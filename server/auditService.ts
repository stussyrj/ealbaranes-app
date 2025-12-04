import { db } from "./db";
import { auditLogs, InsertAuditLog } from "@shared/schema";

export type AuditAction = 
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'register'
  | 'create_delivery_note'
  | 'update_delivery_note'
  | 'sign_delivery_note'
  | 'invoice_delivery_note'
  | 'create_worker'
  | 'update_worker'
  | 'delete_worker'
  | 'create_quote'
  | 'update_quote_status'
  | 'assign_worker_to_quote';

export type AuditEntityType = 
  | 'user'
  | 'delivery_note'
  | 'worker'
  | 'quote'
  | 'tenant';

interface AuditLogParams {
  tenantId?: string | null;
  userId?: string | null;
  action: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const logEntry: InsertAuditLog = {
      tenantId: params.tenantId ?? null,
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      details: params.details ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    };
    
    await db.insert(auditLogs).values(logEntry);
  } catch (error) {
    console.error("[audit] Error logging audit entry:", error);
  }
}

export function getClientInfo(req: any): { ipAddress: string; userAgent: string } {
  const ipAddress = req.ip || 
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
    req.connection?.remoteAddress || 
    'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  return { ipAddress, userAgent };
}
