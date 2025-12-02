import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

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
  const adminUser = await storage.getUserByUsername("admin");
  if (!adminUser) {
    console.log("[auth] Creating default admin user...");
    const hashedPassword = await hashPassword("admin123");
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      isAdmin: true,
      workerId: null,
    });
    console.log("[auth] Default admin user created (username: admin, password: admin123)");
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const user = req.user!;
    res.status(200).json({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      workerId: user.workerId,
      createdAt: user.createdAt,
    });
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      workerId: user.workerId,
      createdAt: user.createdAt,
    });
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
