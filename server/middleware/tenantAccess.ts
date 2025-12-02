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

    const now = new Date();
    const subscriptionStatus = tenant.subscriptionStatus || 'active';
    
    const isInGrace: boolean = subscriptionStatus === 'in_grace' || 
      Boolean(subscriptionStatus === 'canceled' && tenant.graceUntil && tenant.graceUntil > now);
    
    const isReadOnly: boolean = isInGrace || subscriptionStatus === 'past_due';
    
    const isWithinRetention = tenant.retentionUntil ? tenant.retentionUntil > now : true;
    const canAccess: boolean = ['active', 'past_due', 'in_grace'].includes(subscriptionStatus) || 
      Boolean(subscriptionStatus === 'canceled' && isWithinRetention);

    return {
      tenantId: tenant.id,
      subscriptionStatus,
      isInGrace,
      isReadOnly,
      canAccess,
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

    const tenantContext = await getTenantForUser(user.id);
    
    if (!tenantContext) {
      return res.status(403).json({ 
        error: "No tienes acceso a ninguna empresa",
        code: "NO_TENANT" 
      });
    }

    if (!tenantContext.canAccess) {
      return res.status(403).json({ 
        error: "Tu suscripción ha expirado y el período de retención ha terminado",
        code: "SUBSCRIPTION_EXPIRED" 
      });
    }

    if (tenantContext.isReadOnly && !options.allowReadOnly) {
      return res.status(403).json({ 
        error: "Tu cuenta está en modo de solo lectura. Por favor, actualiza tu suscripción.",
        code: "READ_ONLY_MODE" 
      });
    }

    req.tenantContext = tenantContext;
    next();
  };
}

export function requireActiveSubscription() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const tenantContext = await getTenantForUser(user.id);
    
    if (!tenantContext) {
      return res.status(403).json({ 
        error: "No tienes acceso a ninguna empresa",
        code: "NO_TENANT" 
      });
    }

    if (tenantContext.subscriptionStatus !== 'active') {
      return res.status(403).json({ 
        error: "Necesitas una suscripción activa para realizar esta acción",
        code: "SUBSCRIPTION_REQUIRED" 
      });
    }

    req.tenantContext = tenantContext;
    next();
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
