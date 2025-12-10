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
    
    // Create new user as admin of that tenant
    user = await storage.createUser({
      username,
      email,
      displayName,
      password: randomPassword,
      isAdmin: true,
      tenantId,
    });
    
    // Update tenant with admin user
    await db.update(tenants).set({ adminUserId: user.id }).where(eq(tenants.id, tenantId));
    
    // Mark email as verified since it came from Google
    await db.update(users).set({ emailVerified: true }).where(eq(users.id, user.id));
    
    console.log(`[googleAuth] Created new account via Google: ${email}`);
  } else {
    console.log(`[googleAuth] User already exists: ${email}`);
  }
  
  return user;
}

export function setupGoogleAuth(app: Express) {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/callback";
  
  if (!clientID || !clientSecret) {
    console.log("[googleAuth] Google OAuth credentials not configured");
    console.log(`[googleAuth] GOOGLE_CLIENT_ID: ${clientID ? "✓" : "✗"}`);
    console.log(`[googleAuth] GOOGLE_CLIENT_SECRET: ${clientSecret ? "✓" : "✗"}`);
    console.log("[googleAuth] Google Auth disabled");
    return;
  }

  try {
    console.log(`[googleAuth] Setting up Google OAuth with callback: ${callbackURL}`);
    
    const strategy = new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (accessToken: any, refreshToken: any, profile: any, done: any) => {
        try {
          console.log(`[googleAuth] Google OAuth callback received for: ${profile.emails?.[0]?.value}`);
          const user = await handleGoogleLogin(profile);
          done(null, user);
        } catch (error: any) {
          console.error("[googleAuth] Error in strategy:", error.message);
          done(error);
        }
      }
    );
    
    passport.use("google", strategy);
    console.log("[googleAuth] Google strategy registered");

    // Initiate Google OAuth flow
    app.get(
      "/api/auth/google",
      (req, res, next) => {
        console.log("[googleAuth] /api/auth/google endpoint called");
        passport.authenticate("google", { 
          scope: ["profile", "email"],
          accessType: "offline",
          prompt: "consent"
        })(req, res, next);
      }
    );

    // Google OAuth callback
    app.get(
      "/api/auth/callback",
      passport.authenticate("google", { 
        failureRedirect: "/login?error=oauth_failed",
        failureMessage: true
      }),
      (req, res) => {
        console.log("[googleAuth] OAuth callback successful, redirecting to /");
        res.redirect("/");
      }
    );

    console.log("[googleAuth] Google OAuth setup complete");
  } catch (error) {
    console.error("[googleAuth] Error setting up Google OAuth:", error);
  }
}
