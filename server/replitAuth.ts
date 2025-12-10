import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import { storage } from "./storage";
import { randomBytes } from "crypto";
import { hashPassword } from "./auth";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

interface OAuthUserClaims {
  sub: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

async function findOrCreateUserFromOAuth(claims: OAuthUserClaims) {
  const email = claims.email;
  
  if (!email) {
    throw new Error("Se requiere un email para iniciar sesión");
  }
  
  let user = await storage.getUserByEmail(email);
  
  if (user) {
    return user;
  }
  
  const displayName = [claims.first_name, claims.last_name].filter(Boolean).join(" ") || email.split("@")[0];
  const username = email.split("@")[0] + "_" + randomBytes(4).toString("hex");
  const randomPassword = await hashPassword(randomBytes(32).toString("hex"));
  
  const tenant = await storage.createTenant({
    companyName: displayName,
    subscriptionStatus: "active",
  });
  
  user = await storage.createUser({
    username,
    email,
    displayName,
    password: randomPassword,
    isAdmin: true,
    tenantId: tenant.id,
  });
  
  await storage.updateTenantAdminUser(tenant.id, user.id);
  
  if (user.email) {
    await storage.markEmailVerified(user.id);
  }
  
  console.log(`[replitAuth] Created new user via Google OAuth: ${email}`);
  
  return user;
}

function updateUserSession(
  sessionUser: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  sessionUser.claims = tokens.claims();
  sessionUser.access_token = tokens.access_token;
  sessionUser.refresh_token = tokens.refresh_token;
  sessionUser.expires_at = sessionUser.claims?.exp;
}

export async function setupReplitAuth(app: Express) {
  const config = await getOidcConfig();

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const verify: VerifyFunction = async (
        tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
        verified: passport.AuthenticateCallback
      ) => {
        try {
          const claims = tokens.claims() as OAuthUserClaims;
          const user = await findOrCreateUserFromOAuth(claims);
          
          const sessionUser = {
            ...user,
            claims,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: claims.exp,
          };
          
          verified(null, user);
        } catch (error) {
          console.error("[replitAuth] Error in OAuth verify:", error);
          verified(error as Error, undefined);
        }
      };

      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/auth/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  app.get("/api/auth/google", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/auth/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successRedirect: "/",
      failureRedirect: "/login?error=oauth_failed",
    })(req, res, next);
  });
}
