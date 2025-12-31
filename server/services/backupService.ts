import cron from "node-cron";
import { db } from "../db";
import { eq, and, isNull, desc, inArray } from "drizzle-orm";
import {
  tenants,
  deliveryNotes,
  invoices,
  invoiceLineItems,
  invoiceTemplates,
  quotes,
  workers,
  vehicleTypes,
  users,
  backupLogs,
} from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

const BACKUP_DIR = path.join(process.cwd(), "backups");

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function createTenantBackup(tenantId: string): Promise<{
  success: boolean;
  fileName?: string;
  fileSize?: number;
  recordCounts?: Record<string, number>;
  error?: string;
}> {
  try {
    const tenantData = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    if (!tenantData || tenantData.length === 0) {
      return { success: false, error: "Tenant not found" };
    }

    const [
      tenantDeliveryNotes,
      tenantInvoices,
      tenantWorkers,
      tenantVehicleTypes,
      tenantUsers,
      tenantQuotes,
      tenantInvoiceTemplates,
    ] = await Promise.all([
      db.select().from(deliveryNotes).where(and(eq(deliveryNotes.tenantId, tenantId), isNull(deliveryNotes.deletedAt))),
      db.select().from(invoices).where(eq(invoices.tenantId, tenantId)),
      db.select().from(workers).where(eq(workers.tenantId, tenantId)),
      db.select().from(vehicleTypes).where(eq(vehicleTypes.tenantId, tenantId)),
      db.select().from(users).where(eq(users.tenantId, tenantId)),
      db.select().from(quotes).where(eq(quotes.tenantId, tenantId)),
      db.select().from(invoiceTemplates).where(eq(invoiceTemplates.tenantId, tenantId)),
    ]);

    const invoiceIds = tenantInvoices.map(inv => inv.id);
    let tenantLineItems: any[] = [];
    if (invoiceIds.length > 0) {
      tenantLineItems = await db.select().from(invoiceLineItems).where(inArray(invoiceLineItems.invoiceId, invoiceIds));
    }

    const backupData = {
      version: "1.1",
      type: "automated",
      exportedAt: new Date().toISOString(),
      tenantId: tenantId,
      companyName: tenantData[0]?.companyName || "Unknown",
      data: {
        tenant: tenantData[0] || null,
        deliveryNotes: tenantDeliveryNotes,
        invoices: tenantInvoices,
        invoiceLineItems: tenantLineItems,
        invoiceTemplates: tenantInvoiceTemplates,
        quotes: tenantQuotes,
        workers: tenantWorkers,
        vehicleTypes: tenantVehicleTypes,
        users: tenantUsers.map(u => ({
          ...u,
          password: "[REDACTED]"
        })),
      },
      counts: {
        deliveryNotes: tenantDeliveryNotes.length,
        invoices: tenantInvoices.length,
        quotes: tenantQuotes.length,
        workers: tenantWorkers.length,
        vehicleTypes: tenantVehicleTypes.length,
        users: tenantUsers.length,
      }
    };

    const backupJson = JSON.stringify(backupData, null, 2);
    const fileSize = Buffer.byteLength(backupJson, 'utf8');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `automated_backup_${tenantId}_${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);

    fs.writeFileSync(filePath, backupJson);

    return {
      success: true,
      fileName,
      fileSize,
      recordCounts: backupData.counts,
    };
  } catch (error) {
    console.error(`[backup] Error creating backup for tenant ${tenantId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function runAutomatedBackups(): Promise<void> {
  console.log(`[backup] Starting automated backup at ${new Date().toISOString()}`);

  try {
    const allTenants = await db.select().from(tenants);
    console.log(`[backup] Found ${allTenants.length} tenants to backup`);

    for (const tenant of allTenants) {
      console.log(`[backup] Creating backup for tenant: ${tenant.companyName || tenant.id}`);

      const result = await createTenantBackup(tenant.id);

      const backupLogEntry = {
        tenantId: tenant.id,
        userId: "system",
        type: "automated" as const,
        status: result.success ? ("completed" as const) : ("failed" as const),
        fileName: result.fileName,
        fileSize: result.fileSize,
        recordCounts: result.recordCounts as any,
        errorMessage: result.error,
      };
      await db.insert(backupLogs).values(backupLogEntry);

      if (result.success) {
        console.log(`[backup] ✓ Backup completed for ${tenant.companyName || tenant.id}: ${result.fileName}`);
      } else {
        console.error(`[backup] ✗ Backup failed for ${tenant.companyName || tenant.id}: ${result.error}`);
      }
    }

    cleanOldBackups();

    console.log(`[backup] Automated backup cycle completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error("[backup] Error during automated backup:", error);
  }
}

function cleanOldBackups(): void {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const MAX_AGE_DAYS = 365; // Retención de 12 meses (aprox 365 días)
    const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAgeMs) {
        fs.unlinkSync(filePath);
        console.log(`[backup] Deleted old backup: ${file}`);
      }
    }
  } catch (error) {
    console.error("[backup] Error cleaning old backups:", error);
  }
}

export function initializeBackupScheduler(): void {
  cron.schedule("0 3 * * *", () => {
    runAutomatedBackups();
  });

  console.log("[backup] Automated backup scheduler initialized - runs daily at 3:00 AM");
}

export async function runManualBackupForAllTenants(): Promise<void> {
  await runAutomatedBackups();
}

export { createTenantBackup };
