import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, tenants, verificationTokens, users } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, isNull } from "drizzle-orm";
import { stripeService } from "./stripeService";
import { getTenantForUser } from "./middleware/tenantAccess";
import { sendWelcomeEmail, sendVerificationEmail } from "./email";

const resendLimits = new Map<string, { count: number; resetAt: number }>();

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
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: isProduction, // HTTPS only in production
      httpOnly: true,
      sameSite: isProduction ? 'strict' : 'lax', // CSRF protection in production
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
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        if (info?.message === "EMAIL_NOT_VERIFIED") {
          return res.status(403).json({ 
            error: "Tu email no ha sido verificado. Revisa tu correo y haz click en el enlace de confirmación.",
            code: "EMAIL_NOT_VERIFIED"
          });
        }
        return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.status(200).json({
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin,
          workerId: user.workerId,
          createdAt: user.createdAt,
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
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
      isAdmin: user.isAdmin,
      workerId: user.workerId,
      tenantId: user.tenantId,
      createdAt: user.createdAt,
      subscription: tenantContext ? {
        status: tenantContext.subscriptionStatus,
        isReadOnly: tenantContext.isReadOnly,
        isInGrace: tenantContext.isInGrace,
      } : null,
    });
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, email, companyName } = req.body;
      
      if (!username || !password || !email) {
        return res.status(400).json({ error: "Usuario, contraseña y email son requeridos" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Este nombre de usuario ya está en uso" });
      }

      // Check if email is already in use
      const existingEmailUser = await storage.getUserByEmail(email);
      if (existingEmailUser) {
        return res.status(400).json({ error: "Este email ya está registrado" });
      }

      // Create [REDACTED-STRIPE] customer first (outside transaction)
      const stripeCustomer = await stripeService.createCustomer(email, "", companyName);

      let tenant: typeof tenants.$inferSelect | null = null;
      let user: typeof users.$inferSelect | null = null;
      let verificationToken: string | null = null;

      try {
        // Create tenant
        const [newTenant] = await db.insert(tenants).values({
          companyName: companyName || null,
          stripeCustomerId: stripeCustomer.id,
          subscriptionStatus: 'active',
        }).returning();
        tenant = newTenant;

        // Create user - requires email verification
        user = await storage.createUser({
          username,
          email: email,
          displayName: companyName || username,
          password: await hashPassword(password),
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

        // Send verification email
        await sendVerificationEmail(email, companyName || username, verificationToken, baseUrl);

        res.status(201).json({
          success: true,
          message: "¡Cuenta creada! Te hemos enviado un email de verificación. Revisa tu bandeja de entrada.",
          email: email,
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
        
        // Try to delete [REDACTED-STRIPE] customer (best effort)
        try {
          await stripeService.deleteCustomer(stripeCustomer.id);
        } catch (stripeError) {
          console.error("[auth] Failed to delete orphaned [REDACTED-STRIPE] customer:", stripeCustomer.id);
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

      // Mark user as verified
      await db.update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, tokenRecord.userId));

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

  app.post("/api/admin/create-user", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ error: "No autorizado" });
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

    const users = await storage.getAllUsers();
    res.json(users.map(u => ({
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

    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "La contraseña es requerida" });
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

    const { id } = req.params;
    
    if (id === req.user.id) {
      return res.status(400).json({ error: "No puedes eliminar tu propio usuario" });
    }

    const deleted = await storage.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ success: true });
  });
}
