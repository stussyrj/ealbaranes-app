import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";
import { hashPassword } from "./auth";
import { randomBytes, randomUUID } from "crypto";
import { db } from "./db";
import { tenants, users } from "@shared/schema";
import { eq } from "drizzle-orm";

interface GoogleProfile {
  id: string;
  displayName: string;
  emails?: Array<{ value: string }>;
  photos?: Array<{ value: string }>;
}

async function handleGoogleLogin(profile: GoogleProfile) {
  const email = profile.emails?.[0]?.value;
  
  if (!email) {
    throw new Error("Google account does not have an email");
  }
  
  let user = await storage.getUserByEmail(email);
  
  // If user doesn't exist, create account automatically
  if (!user) {
    const displayName = profile.displayName || email.split("@")[0];
    const username = email.split("@")[0] + "_" + randomBytes(4).toString("hex");
    const randomPassword = await hashPassword(randomBytes(32).toString("hex"));
    
    // Create new tenant
    const tenantId = randomUUID();
    await db.insert(tenants).values({
      id: tenantId,
      adminUserId: null,
      companyName: displayName,
      subscriptionStatus: "active",
    });
    
    // Create new user as admin of that tenant with setupRequired flag
    user = await storage.createUser({
      username,
      email,
      displayName,
      password: randomPassword,
      isAdmin: true,
      tenantId,
      setupRequired: true,
    });
    
    // Update tenant with admin user
    await db.update(tenants).set({ adminUserId: user.id }).where(eq(tenants.id, tenantId));
    
    // Mark email as verified since it came from Google
    await db.update(users).set({ emailVerified: true }).where(eq(users.id, user.id));
    
    console.log(`[googleAuth] Created new account via Google: ${email}`);
  }
  
  return user;
}

export function setupGoogleAuth(app: Express) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  // Determine callback URL based on environment
  let callbackURL = process.env.GOOGLE_CALLBACK_URL;
  if (!callbackURL) {
    // Use REPLIT_DOMAINS for production, REPLIT_DEV_DOMAIN for development
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || process.env.REPLIT_DEV_DOMAIN;
    if (domain) {
      callbackURL = `https://${domain}/api/auth/callback`;
    } else {
      callbackURL = "http://localhost:5000/api/auth/callback";
    }
  }
  
  console.log("[googleAuth] Callback URL:", callbackURL);
  
  if (!clientID || !clientSecret) {
    console.log("[googleAuth] Credentials not configured - Google Auth disabled");
    return;
  }

  try {
    passport.use(
      new GoogleStrategy(
        {
          clientID,
          clientSecret,
          callbackURL,
        },
        async (accessToken: any, refreshToken: any, profile: any, done: any) => {
          try {
            const user = await handleGoogleLogin(profile);
            done(null, user);
          } catch (error: any) {
            done(error);
          }
        }
      )
    );

    // OAuth initiation
    app.get("/api/auth/google", (req, res, next) => {
      passport.authenticate("google", { 
        scope: ["profile", "email"],
        prompt: "select_account"
      })(req, res, next);
    });

    // OAuth callback
    app.get(
      "/api/auth/callback",
      passport.authenticate("google", { failureRedirect: "/login?error=oauth_failed" }),
      (req, res) => {
        res.redirect("/");
      }
    );

    console.log("[googleAuth] Google OAuth setup complete");
  } catch (error) {
    console.error("[googleAuth] Setup error:", error);
  }
}
