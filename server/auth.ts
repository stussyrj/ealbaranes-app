import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, tenants, verificationTokens, users, passwordResetTokens } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, isNull } from "drizzle-orm";
import { getTenantForUser } from "./middleware/tenantAccess";
import { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } from "./email";
import { logAudit, getClientInfo } from "./auditService";

const resendLimits = new Map<string, { count: number; resetAt: number }>();

// Rate limiting for login attempts - protection against brute force attacks
const loginAttempts = new Map<string, { count: number; blockedUntil: number | null }>();
const LOGIN_MAX_ATTEMPTS = 5; // Max failed attempts before blocking
const LOGIN_BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes block

function getClientIP(req: any): string {
  return req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || 'unknown';
}

function checkLoginRateLimit(ip: string): { allowed: boolean; remainingTime?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  
  if (!record) {
    return { allowed: true };
  }
  
  // Check if still blocked
  if (record.blockedUntil && now < record.blockedUntil) {
    const remainingTime = Math.ceil((record.blockedUntil - now) / 1000 / 60);
    return { allowed: false, remainingTime };
  }
  
  // Reset if block has expired
  if (record.blockedUntil && now >= record.blockedUntil) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }
  
  return { allowed: true };
}

function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  
  if (!record) {
    loginAttempts.set(ip, { count: 1, blockedUntil: null });
    return;
  }
  
  record.count++;
  
  // Block if exceeded max attempts
  if (record.count >= LOGIN_MAX_ATTEMPTS) {
    record.blockedUntil = now + LOGIN_BLOCK_DURATION;
    console.log(`[auth] IP ${ip} blocked for ${LOGIN_BLOCK_DURATION / 1000 / 60} minutes after ${record.count} failed login attempts`);
  }
  
  loginAttempts.set(ip, record);
}

function clearFailedLogins(ip: string): void {
  loginAttempts.delete(ip);
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function initializeAdminUser() {
  // SECURITY: Disable default admin creation in production
  if (process.env.NODE_ENV === 'production') {
    console.log("[auth] Default admin user creation disabled in production - use registration flow");
    return;
  }
  
  const adminUser = await storage.getUserByUsername("admin");
  if (!adminUser) {
    console.log("[auth] Creating default admin user for development...");
    const hashedPassword = await hashPassword("admin123");
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      isAdmin: true,
      workerId: null,
    });
    console.log("[auth] Development admin user created (username: admin, password: admin123)");
    console.log("[auth] WARNING: This user is for development only - do not use in production");
  }
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === 'production';
  // Replit uses HTTPS even in development, so we need secure cookies
  const isReplit = !!process.env.REPL_ID || !!process.env.REPLIT_DEPLOYMENT;
  
  console.log("[auth] Session config:", { isProduction, isReplit });
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: true, // Force save session on every request
    saveUninitialized: true, // Save uninitialized sessions
    store: storage.sessionStore,
    name: 'ealbaran.sid', // Custom session cookie name
    cookie: {
      secure: isReplit || isProduction, // HTTPS required in Replit and production
      httpOnly: true,
      sameSite: 'none', // Required for cross-site cookies with secure:true
      maxAge: 24 * 60 * 60 * 1000,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      // Try to find user by username first, then by email
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByEmail(username);
      }
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false, { message: "Credenciales incorrectas" });
      }
      // Check email verification only for admin/company users (not workers)
      if (user.isAdmin && !user.emailVerified) {
        return done(null, false, { message: "EMAIL_NOT_VERIFIED" });
      }
      return done(null, user);
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/login", (req, res, next) => {
    const clientIP = getClientIP(req);
    
    // Check rate limit before attempting login
    const rateCheck = checkLoginRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return res.status(429).json({ 
        error: `Demasiados intentos fallidos. Intenta de nuevo en ${rateCheck.remainingTime} minutos.`,
        code: "RATE_LIMITED"
      });
    }
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        // Record failed login attempt
        recordFailedLogin(clientIP);
        
        // Log failed login attempt
        const clientInfo = getClientInfo(req);
        logAudit({
          action: 'login_failed',
          entityType: 'user',
          details: { username: req.body.username, reason: info?.message || 'invalid_credentials' },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        });
        
        if (info?.message === "EMAIL_NOT_VERIFIED") {
          return res.status(403).json({ 
            error: "Tu email no ha sido verificado. Revisa tu correo y haz click en el enlace de confirmación.",
            code: "EMAIL_NOT_VERIFIED"
          });
        }
        return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
      }
      
      // SECURITY: Only admins (companies) can login via this endpoint
      if (!user.isAdmin) {
        recordFailedLogin(clientIP);
        const clientInfo = getClientInfo(req);
        logAudit({
          action: 'login_failed',
          entityType: 'user',
          details: { username: req.body.username, reason: 'worker_cannot_login_as_company' },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        });
        return res.status(403).json({ error: "Solo las empresas pueden iniciar sesión aquí. Los trabajadores deben usar el login de trabajador." });
      }
      
      // Clear failed login attempts on successful login
      clearFailedLogins(clientIP);
      
      req.login(user, async (loginErr) => {
        if (loginErr) {
          console.error("[auth] Login error:", loginErr);
          return next(loginErr);
        }
        
        // Force session save
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[auth] Session save error:", saveErr);
          }
        });
        
        // Log successful login
        const clientInfo = getClientInfo(req);
        await logAudit({
          tenantId: user.tenantId,
          userId: user.id,
          action: 'login',
          entityType: 'user',
          entityId: user.id,
          details: { username: user.username, isAdmin: user.isAdmin },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        });
        
        res.status(200).json({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          isAdmin: user.isAdmin,
          workerId: user.workerId,
          tenantId: user.tenantId,
          createdAt: user.createdAt,
          hasCompletedOnboarding: user.hasCompletedOnboarding ?? false,
        });
      });
    })(req, res, next);
  });

  app.post("/api/worker-login", (req, res, next) => {
    const clientIP = getClientIP(req);
    
    // Check rate limit before attempting login
    const rateCheck = checkLoginRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return res.status(429).json({ 
        error: `Demasiados intentos fallidos. Intenta de nuevo en ${rateCheck.remainingTime} minutos.`,
        code: "RATE_LIMITED"
      });
    }
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        // Record failed login attempt
        recordFailedLogin(clientIP);
        
        // Log failed login attempt
        const clientInfo = getClientInfo(req);
        logAudit({
          action: 'login_failed',
          entityType: 'user',
          details: { username: req.body.username, reason: info?.message || 'invalid_credentials' },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        });
        
        return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
      }
      
      // SECURITY: Only workers (non-admins) can login via this endpoint
      if (user.isAdmin) {
        recordFailedLogin(clientIP);
        const clientInfo = getClientInfo(req);
        logAudit({
          action: 'login_failed',
          entityType: 'user',
          details: { username: req.body.username, reason: 'company_cannot_login_as_worker' },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        });
        return res.status(403).json({ error: "Las empresas no pueden iniciar sesión aquí. Usa el login de empresa." });
      }
      
      // Clear failed login attempts on successful login
      clearFailedLogins(clientIP);
      
      req.login(user, async (loginErr) => {
        if (loginErr) {
          console.error("[auth] Worker login error:", loginErr);
          return next(loginErr);
        }
        
        // Force session save
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[auth] Session save error:", saveErr);
          }
        });
        
        // Log successful login
        const clientInfo = getClientInfo(req);
        await logAudit({
          tenantId: user.tenantId,
          userId: user.id,
          action: 'login',
          entityType: 'user',
          entityId: user.id,
          details: { username: user.username, isAdmin: user.isAdmin, loginType: 'worker' },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent,
        });
        
        res.status(200).json({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          isAdmin: user.isAdmin,
          workerId: user.workerId,
          tenantId: user.tenantId,
          createdAt: user.createdAt,
          hasCompletedOnboarding: user.hasCompletedOnboarding ?? false,
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", async (req, res, next) => {
    const user = req.user;
    
    // Log logout before destroying session
    if (user) {
      const clientInfo = getClientInfo(req);
      await logAudit({
        tenantId: (user as any).tenantId,
        userId: user.id,
        action: 'logout',
        entityType: 'user',
        entityId: user.id,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });
    }
    
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    
    const tenantContext = await getTenantForUser(user.id);
    
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      isAdmin: user.isAdmin,
      workerId: user.workerId,
      tenantId: user.tenantId,
      createdAt: user.createdAt,
      hasCompletedOnboarding: user.hasCompletedOnboarding ?? false,
      setupRequired: (user as any).setupRequired ?? false,
      subscription: tenantContext ? {
        status: tenantContext.subscriptionStatus,
        isReadOnly: tenantContext.isReadOnly,
        isInGrace: tenantContext.isInGrace,
      } : null,
    });
  });
  
  app.post("/api/user/complete-onboarding", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    
    try {
      await db.update(users).set({ hasCompletedOnboarding: true }).where(eq(users.id, user.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ error: "Error al completar el tutorial" });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, email, companyName } = req.body;
      
      // Basic required field validation
      if (!username || !password || !email) {
        return res.status(400).json({ error: "Usuario, contraseña y email son requeridos" });
      }
      
      // Username validation
      const usernameStr = String(username).trim();
      if (usernameStr.length < 3) {
        return res.status(400).json({ error: "El nombre de usuario debe tener al menos 3 caracteres" });
      }
      if (usernameStr.length > 50) {
        return res.status(400).json({ error: "El nombre de usuario no puede tener más de 50 caracteres" });
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(usernameStr)) {
        return res.status(400).json({ error: "El nombre de usuario solo puede contener letras, números, guiones y guiones bajos" });
      }
      
      // Password strength validation
      const passwordStr = String(password);
      if (passwordStr.length < 8) {
        return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
      }
      if (passwordStr.length > 128) {
        return res.status(400).json({ error: "La contraseña no puede tener más de 128 caracteres" });
      }
      
      // Email format validation
      const emailStr = String(email).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailStr)) {
        return res.status(400).json({ error: "El formato del email no es válido" });
      }
      if (emailStr.length > 254) {
        return res.status(400).json({ error: "El email es demasiado largo" });
      }
      
      // Company name validation (optional but if provided, validate)
      if (companyName && String(companyName).length > 200) {
        return res.status(400).json({ error: "El nombre de empresa no puede tener más de 200 caracteres" });
      }

      const existingUser = await storage.getUserByUsername(usernameStr);
      if (existingUser) {
        return res.status(400).json({ error: "Este nombre de usuario ya está en uso" });
      }

      // Check if email is already in use
      const existingEmailUser = await storage.getUserByEmail(emailStr);
      if (existingEmailUser) {
        return res.status(400).json({ error: "Este email ya está registrado" });
      }

      const companyNameStr = companyName ? String(companyName).trim() : null;

      let tenant: typeof tenants.$inferSelect | null = null;
      let user: typeof users.$inferSelect | null = null;
      let verificationToken: string | null = null;

      try {
        // Create tenant with sanitized values (no [REDACTED-STRIPE]
        const [newTenant] = await db.insert(tenants).values({
          companyName: companyNameStr,
          stripeCustomerId: null,
          subscriptionStatus: 'active',
        }).returning();
        tenant = newTenant;

        // Create user with sanitized values - requires email verification
        user = await storage.createUser({
          username: usernameStr,
          email: emailStr,
          displayName: companyNameStr || usernameStr,
          password: await hashPassword(passwordStr),
          isAdmin: true,
          workerId: null,
          tenantId: tenant.id,
        });

        // Update tenant with admin user
        await db.update(tenants)
          .set({ adminUserId: user.id })
          .where(eq(tenants.id, tenant.id));

        // Generate verification token
        verificationToken = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        await db.insert(verificationTokens).values({
          userId: user.id,
          token: verificationToken,
          expiresAt,
        });

        // Get base URL for verification link
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['host'];
        const baseUrl = `${protocol}://${host}`;

        // Send verification email with sanitized values
        await sendVerificationEmail(emailStr, companyNameStr || usernameStr, verificationToken, baseUrl);

        res.status(201).json({
          success: true,
          message: "¡Cuenta creada! Te hemos enviado un email de verificación. Revisa tu bandeja de entrada.",
          email: emailStr,
          requiresVerification: true,
        });
      } catch (emailError: any) {
        // Email failed to send - rollback everything
        console.error("[auth] Email sending failed, rolling back registration:", emailError);
        
        // Delete verification token if created
        if (user) {
          await db.delete(verificationTokens).where(eq(verificationTokens.userId, user.id)).catch(() => {});
          await db.delete(users).where(eq(users.id, user.id)).catch(() => {});
        }
        
        // Delete tenant if created
        if (tenant) {
          await db.delete(tenants).where(eq(tenants.id, tenant.id)).catch(() => {});
        }

        // Return user-friendly error
        const errorMessage = emailError?.message || "";
        if (errorMessage.includes("domain is not verified")) {
          return res.status(500).json({ 
            error: "No se pudo enviar el email de verificación. El dominio de email no está configurado correctamente. Por favor, contacta al administrador." 
          });
        }
        return res.status(500).json({ 
          error: "No se pudo enviar el email de verificación. Por favor, intenta de nuevo más tarde." 
        });
      }
    } catch (error) {
      console.error("[auth] Registration error:", error);
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  });

  // Verify email endpoint
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: "Token de verificación inválido" });
      }

      // Find the token
      const [tokenRecord] = await db.select()
        .from(verificationTokens)
        .where(and(
          eq(verificationTokens.token, token),
          isNull(verificationTokens.usedAt),
          gt(verificationTokens.expiresAt, new Date())
        ));

      if (!tokenRecord) {
        return res.status(400).json({ 
          error: "El enlace de verificación ha expirado o ya fue utilizado. Por favor, solicita un nuevo enlace.",
          expired: true
        });
      }

      // Mark user as verified in database
      await db.update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, tokenRecord.userId));
      
      // Invalidate the user from the cache so next login fetches fresh data from DB
      storage.invalidateUserCache(tokenRecord.userId);

      // Mark token as used
      await db.update(verificationTokens)
        .set({ usedAt: new Date() })
        .where(eq(verificationTokens.id, tokenRecord.id));

      // Invalidate all other tokens for this user
      await db.update(verificationTokens)
        .set({ usedAt: new Date() })
        .where(and(
          eq(verificationTokens.userId, tokenRecord.userId),
          isNull(verificationTokens.usedAt)
        ));

      // Get user for welcome email
      const user = await storage.getUser(tokenRecord.userId);
      if (user && user.email) {
        sendWelcomeEmail(user.email, user.displayName || user.username).catch(err => {
          console.error("[auth] Failed to send welcome email:", err);
        });
      }

      res.json({ success: true, message: "Email verificado correctamente. Ya puedes iniciar sesión." });
    } catch (error) {
      console.error("[auth] Email verification error:", error);
      res.status(500).json({ error: "Error al verificar el email" });
    }
  });

  // Resend verification email endpoint
  app.post("/api/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email es requerido" });
      }

      // Rate limiting: max 3 resends per hour per email
      const key = email.toLowerCase();
      const now = Date.now();
      const limit = resendLimits.get(key);
      
      if (limit) {
        if (now < limit.resetAt) {
          if (limit.count >= 3) {
            const minutesLeft = Math.ceil((limit.resetAt - now) / 60000);
            return res.status(429).json({ 
              error: `Has alcanzado el límite de reenvíos. Intenta de nuevo en ${minutesLeft} minutos.`
            });
          }
          limit.count++;
        } else {
          resendLimits.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
        }
      } else {
        resendLimits.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // Always return success to avoid email enumeration
      if (!user || !user.isAdmin || user.emailVerified) {
        return res.json({ success: true, message: "Si el email está registrado y pendiente de verificación, recibirás un nuevo enlace." });
      }

      // Invalidate existing tokens
      await db.update(verificationTokens)
        .set({ usedAt: new Date() })
        .where(and(
          eq(verificationTokens.userId, user.id),
          isNull(verificationTokens.usedAt)
        ));

      // Generate new token
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await db.insert(verificationTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      // Get base URL
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['host'];
      const baseUrl = `${protocol}://${host}`;

      // Send verification email
      await sendVerificationEmail(email, user.displayName || user.username, token, baseUrl);

      res.json({ success: true, message: "Si el email está registrado y pendiente de verificación, recibirás un nuevo enlace." });
    } catch (error) {
      console.error("[auth] Resend verification error:", error);
      res.status(500).json({ error: "Error al reenviar el email de verificación" });
    }
  });

  // Forgot password - request password reset
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "El email es requerido" });
      }

      const emailStr = String(email).trim().toLowerCase();
      
      // Rate limiting: max 3 requests per hour per email
      const key = `reset_${emailStr}`;
      const now = Date.now();
      const limit = resendLimits.get(key);
      
      if (limit) {
        if (now < limit.resetAt) {
          if (limit.count >= 3) {
            const minutesLeft = Math.ceil((limit.resetAt - now) / 60000);
            return res.status(429).json({ 
              error: `Has alcanzado el límite de solicitudes. Intenta de nuevo en ${minutesLeft} minutos.`
            });
          }
          limit.count++;
        } else {
          resendLimits.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
        }
      } else {
        resendLimits.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
      }

      // Find user by email
      const user = await storage.getUserByEmail(emailStr);
      
      // Always return success to avoid email enumeration
      if (!user) {
        return res.json({ success: true, message: "Si el email está registrado, recibirás un enlace para restablecer tu contraseña." });
      }

      // Invalidate existing password reset tokens for this user
      await db.update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(and(
          eq(passwordResetTokens.userId, user.id),
          isNull(passwordResetTokens.usedAt)
        ));

      // Generate new reset token (expires in 1 hour)
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      // Get base URL
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['host'];
      const baseUrl = `${protocol}://${host}`;

      // Send password reset email
      await sendPasswordResetEmail(emailStr, user.displayName || user.username, token, baseUrl);

      res.json({ success: true, message: "Si el email está registrado, recibirás un enlace para restablecer tu contraseña." });
    } catch (error) {
      console.error("[auth] Forgot password error:", error);
      res.status(500).json({ error: "Error al procesar la solicitud" });
    }
  });

  // Reset password - actually change the password
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: "Token de recuperación inválido" });
      }
      
      if (!password) {
        return res.status(400).json({ error: "La nueva contraseña es requerida" });
      }

      // Password strength validation
      const passwordStr = String(password);
      if (passwordStr.length < 8) {
        return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
      }
      if (passwordStr.length > 128) {
        return res.status(400).json({ error: "La contraseña no puede tener más de 128 caracteres" });
      }

      // Find the token
      const [tokenRecord] = await db.select()
        .from(passwordResetTokens)
        .where(and(
          eq(passwordResetTokens.token, token),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date())
        ));

      if (!tokenRecord) {
        return res.status(400).json({ 
          error: "El enlace de recuperación ha expirado o ya fue utilizado. Por favor, solicita un nuevo enlace.",
          expired: true
        });
      }

      // Update user password
      const hashedPassword = await hashPassword(passwordStr);
      await storage.updateUserPassword(tokenRecord.userId, hashedPassword);

      // Mark token as used
      await db.update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, tokenRecord.id));

      // Invalidate all other tokens for this user
      await db.update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(and(
          eq(passwordResetTokens.userId, tokenRecord.userId),
          isNull(passwordResetTokens.usedAt)
        ));

      // Log the password reset
      const clientInfo = getClientInfo(req);
      await logAudit({
        userId: tokenRecord.userId,
        action: 'password_reset',
        entityType: 'user',
        entityId: tokenRecord.userId,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
      });

      res.json({ success: true, message: "Contraseña actualizada correctamente. Ya puedes iniciar sesión." });
    } catch (error) {
      console.error("[auth] Reset password error:", error);
      res.status(500).json({ error: "Error al restablecer la contraseña" });
    }
  });

  app.post("/api/admin/create-user", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Empresa no encontrada" });
    }

    const { username, displayName, password, workerId } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
    }

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Este nombre de usuario ya está en uso. Por favor, elige otro." });
    }

    const user = await storage.createUser({
      username,
      displayName: displayName || null,
      password: await hashPassword(password),
      isAdmin: false,
      workerId: workerId || null,
      tenantId: tenantId,
    });

    res.status(201).json({ 
      id: user.id, 
      username: user.username,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      workerId: user.workerId 
    });
  });

  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Empresa no encontrada" });
    }

    const allUsers = await storage.getAllUsers();
    const tenantUsers = allUsers.filter(u => u.tenantId === tenantId);
    
    res.json(tenantUsers.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      isAdmin: u.isAdmin,
      workerId: u.workerId,
      createdAt: u.createdAt,
    })));
  });

  app.patch("/api/admin/users/:id/password", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Empresa no encontrada" });
    }

    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "La contraseña es requerida" });
    }

    const targetUser = await storage.getUser(id);
    if (!targetUser || targetUser.tenantId !== tenantId) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const updated = await storage.updateUserPassword(id, await hashPassword(password));
    if (!updated) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ success: true });
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Empresa no encontrada" });
    }

    const { id } = req.params;
    
    if (id === req.user.id) {
      return res.status(400).json({ error: "No puedes eliminar tu propio usuario" });
    }

    const targetUser = await storage.getUser(id);
    if (!targetUser || targetUser.tenantId !== tenantId) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const deleted = await storage.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ success: true });
  });

  app.delete("/api/admin/company", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const user = req.user;
    const tenantId = user.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Empresa no encontrada" });
    }

    const { password, confirmText } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: "La contraseña es requerida para confirmar esta acción" });
    }
    
    if (!confirmText || confirmText !== "ELIMINAR") {
      return res.status(400).json({ error: "Debes escribir ELIMINAR para confirmar" });
    }

    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    try {
      const deletionDetails = { 
        username: user.username, 
        email: user.email,
        companyDeleted: true,
        deletedAt: new Date().toISOString()
      };

      await storage.deleteTenantCascade(tenantId);

      console.log(`[auth] Successfully deleted tenant ${tenantId} and all its data`);
      console.log(`[auth] Deletion details:`, JSON.stringify(deletionDetails));

      // Wrap logout and session destruction in a promise to ensure completion before response
      let sessionCleanupSuccess = true;
      let sessionCleanupError: Error | null = null;
      try {
        await new Promise<void>((resolve, reject) => {
          req.logout((err) => {
            if (err) {
              console.error("[auth] Error during logout after company deletion:", err);
              sessionCleanupSuccess = false;
              sessionCleanupError = err;
            }
            req.session.destroy((sessionErr) => {
              if (sessionErr) {
                console.error("[auth] Error destroying session after company deletion:", sessionErr);
                sessionCleanupSuccess = false;
                if (!sessionCleanupError) sessionCleanupError = sessionErr;
              }
              res.clearCookie('connect.sid');
              resolve();
            });
          });
        });
      } catch (logoutErr) {
        console.error("[auth] Session cleanup error:", logoutErr);
        sessionCleanupSuccess = false;
        sessionCleanupError = logoutErr as Error;
        res.clearCookie('connect.sid');
      }

      // Return 200 with metadata indicating success status
      // Using 200 since the primary operation (data deletion) succeeded
      // sessionCleared indicates whether session cleanup was also successful
      res.status(200).json({ 
        success: true, 
        dataDeleted: true,
        sessionCleared: sessionCleanupSuccess,
        message: sessionCleanupSuccess 
          ? "Empresa y todos sus datos han sido eliminados" 
          : "Los datos fueron eliminados. Por favor cierra el navegador para completar el cierre de sesión."
      });
    } catch (error) {
      console.error("[auth] Error deleting company:", error);
      res.status(500).json({ error: "Error al eliminar la empresa. Por favor, intenta de nuevo." });
    }
  });
}
