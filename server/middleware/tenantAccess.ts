import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { tenants, users } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface TenantContext {
  tenantId: string;
  subscriptionStatus: string;
  isInGrace: boolean;
  isReadOnly: boolean;
  canAccess: boolean;
}

declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
    }
  }
}

export async function getTenantForUser(userId: string): Promise<TenantContext | null> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || !user.tenantId) {
      return null;
    }

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
    if (!tenant) {
      return null;
    }

    // Free access - no subscription checks
    return {
      tenantId: tenant.id,
      subscriptionStatus: 'active',
      isInGrace: false,
      isReadOnly: false,
      canAccess: true,
    };
  } catch (error) {
    console.error('[tenant] Error getting tenant context:', error);
    return null;
  }
}

export function requireTenantAccess(options: { allowReadOnly?: boolean } = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: "No autenticado" });
    }

    // Free access enabled - grant full access
    req.tenantContext = {
      tenantId: user.tenantId || 'free',
      subscriptionStatus: 'active',
      isInGrace: false,
      isReadOnly: false,
      canAccess: true,
    };
    return next();
  };
}

export function requireActiveSubscription() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: "No autenticado" });
    }

    // Free access enabled - grant full access
    req.tenantContext = {
      tenantId: user.tenantId || 'free',
      subscriptionStatus: 'active',
      isInGrace: false,
      isReadOnly: false,
      canAccess: true,
    };
    return next();
  };
}

export function requireAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: "No autenticado" });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ error: "Acceso solo para administradores" });
    }

    next();
  };
}
