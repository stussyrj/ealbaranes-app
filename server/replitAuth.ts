import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import type { Express } from "express";
import memoize from "memoizee";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

interface OAuthClaims {
  sub: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
}

async function handleOAuthLogin(claims: OAuthClaims) {
  const email = claims.email;
  
  if (!email) {
    throw new Error("Se requiere un email para iniciar sesión con Google");
  }
  
  const user = await storage.getUserByEmail(email);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }
  
  return user;
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
          const claims = tokens.claims() as OAuthClaims;
          const user = await handleOAuthLogin(claims);
          verified(null, user);
        } catch (error: any) {
          console.error("[replitAuth] OAuth error:", error.message);
          verified(error, undefined);
        }
      };

      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile",
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
      scope: ["openid", "email", "profile"],
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
