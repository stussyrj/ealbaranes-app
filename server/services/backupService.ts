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
import { jsPDF } from "jspdf";

const BACKUP_DIR = path.join(process.cwd(), "backups");

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function createTenantBackup(tenantId: string): Promise<{
  success: boolean;
  fileName?: string;
  pdfFileName?: string;
  fileSize?: number;
  pdfFileSize?: number;
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
      tenantQuotes,
      tenantInvoiceTemplates,
    ] = await Promise.all([
      db.select().from(deliveryNotes).where(and(eq(deliveryNotes.tenantId, tenantId), isNull(deliveryNotes.deletedAt))).orderBy(desc(deliveryNotes.createdAt)),
      db.select().from(invoices).where(eq(invoices.tenantId, tenantId)).orderBy(desc(invoices.createdAt)),
      db.select().from(workers).where(eq(workers.tenantId, tenantId)),
      db.select().from(vehicleTypes).where(eq(vehicleTypes.tenantId, tenantId)),
      db.select().from(quotes).where(eq(quotes.tenantId, tenantId)),
      db.select().from(invoiceTemplates).where(eq(invoiceTemplates.tenantId, tenantId)),
    ]);

    const invoiceIds = tenantInvoices.map(inv => inv.id);
    let tenantLineItems: any[] = [];
    if (invoiceIds.length > 0) {
      tenantLineItems = await db.select().from(invoiceLineItems).where(inArray(invoiceLineItems.invoiceId, invoiceIds));
    }

    // Crear mapa de trabajadores por ID para búsqueda rápida
    const workerMap = new Map(tenantWorkers.map(w => [w.id, w]));

    // JSON backup sin usuarios (solo empresa y trabajadores)
    const backupData = {
      version: "1.2",
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
        // No incluimos usuarios para evitar mezclas
      },
      counts: {
        deliveryNotes: tenantDeliveryNotes.length,
        invoices: tenantInvoices.length,
        quotes: tenantQuotes.length,
        workers: tenantWorkers.length,
        vehicleTypes: tenantVehicleTypes.length,
      }
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // JSON Backup
    const backupJson = JSON.stringify(backupData, null, 2);
    const fileSize = Buffer.byteLength(backupJson, 'utf8');
    const fileName = `${backupData.type}_backup_${tenantId}_${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);
    fs.writeFileSync(filePath, backupJson);

    // PDF Backup - Más completo y profesional
    let pdfFileName: string | undefined;
    let pdfFileSize: number | undefined;

    try {
      const doc = new jsPDF();
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 25;

      // Función helper para salto de página
      const checkPageBreak = (neededSpace: number) => {
        if (y + neededSpace > pageHeight - 20) {
          doc.addPage();
          y = 25;
          return true;
        }
        return false;
      };

      // Función para línea separadora
      const drawSeparator = () => {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
      };

      // ========== PORTADA ==========
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("RESPALDO DE DATOS", pageWidth / 2, y, { align: "center" });
      y += 15;
      
      doc.setFontSize(18);
      doc.setFont("helvetica", "normal");
      doc.text(tenantData[0]?.companyName || "Empresa", pageWidth / 2, y, { align: "center" });
      y += 20;

      doc.setFontSize(12);
      doc.text(`Fecha de exportación: ${new Date().toLocaleString("es-ES")}`, margin, y);
      y += 15;

      // Resumen ejecutivo
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resumen de Datos", margin, y);
      y += 10;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const summaryData = [
        ["Albaranes activos:", tenantDeliveryNotes.length.toString()],
        ["Facturas:", tenantInvoices.length.toString()],
        ["Trabajadores:", tenantWorkers.length.toString()],
        ["Tipos de vehículos:", tenantVehicleTypes.length.toString()],
      ];
      
      summaryData.forEach(([label, value]) => {
        doc.text(`• ${label} ${value}`, margin + 5, y);
        y += 7;
      });

      // ========== TRABAJADORES ==========
      if (tenantWorkers.length > 0) {
        doc.addPage();
        y = 25;
        
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("TRABAJADORES", margin, y);
        y += 12;
        drawSeparator();
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        tenantWorkers.forEach((worker, index) => {
          checkPageBreak(15);
          doc.setFont("helvetica", "bold");
          doc.text(`${index + 1}. ${worker.name}`, margin, y);
          doc.setFont("helvetica", "normal");
          y += 6;
          doc.text(`   Email: ${worker.email || 'N/A'}`, margin, y);
          y += 5;
          doc.text(`   Teléfono: ${worker.phone || 'N/A'}`, margin, y);
          y += 5;
          doc.text(`   Estado: ${worker.isActive ? 'Activo' : 'Inactivo'}`, margin, y);
          y += 8;
        });
      }

      // ========== ALBARANES (Detallados) ==========
      if (tenantDeliveryNotes.length > 0) {
        doc.addPage();
        y = 25;
        
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("ALBARANES", margin, y);
        y += 12;
        drawSeparator();

        // Mostrar hasta 100 albaranes con detalles completos
        const notesToPrint = tenantDeliveryNotes.slice(0, 100);
        
        doc.setFontSize(9);
        
        notesToPrint.forEach((note, index) => {
          checkPageBreak(45);
          
          // Encabezado del albarán
          doc.setFont("helvetica", "bold");
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F');
          doc.text(`Albarán #${note.noteNumber}`, margin + 2, y);
          
          // Estado y facturación
          const estado = note.status === 'signed' ? 'FIRMADO' : note.status === 'pending' ? 'PENDIENTE' : (note.status || 'N/A').toUpperCase();
          const facturado = note.isInvoiced ? 'SÍ' : 'NO';
          doc.text(`Estado: ${estado} | Facturado: ${facturado}`, pageWidth - margin - 60, y);
          y += 10;
          
          doc.setFont("helvetica", "normal");
          
          // Cliente
          doc.text(`Cliente: ${note.clientName || 'N/A'}`, margin + 2, y);
          y += 5;
          
          // Fecha y hora
          const fechaCreacion = note.createdAt ? new Date(note.createdAt).toLocaleDateString('es-ES') : 'N/A';
          const fechaAlbaran = note.date || 'N/A';
          const hora = note.time || 'N/A';
          doc.text(`Fecha: ${fechaAlbaran} | Hora: ${hora} | Creado: ${fechaCreacion}`, margin + 2, y);
          y += 5;
          
          // Trabajador que lo hizo
          const worker = note.workerId ? workerMap.get(note.workerId) : null;
          const workerName = worker ? worker.name : 'N/A';
          doc.text(`Realizado por: ${workerName}`, margin + 2, y);
          y += 5;
          
          // Vehículo
          doc.text(`Vehículo: ${note.vehicleType || 'N/A'}`, margin + 2, y);
          y += 5;
          
          // Direcciones de recogida y entrega (Orígenes -> Destino Final)
          if (note.pickupOrigins && Array.isArray(note.pickupOrigins) && note.pickupOrigins.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text(`   ORÍGENES DE RECOGIDA:`, margin + 2, y);
            y += 5;
            doc.setFont("helvetica", "normal");
            note.pickupOrigins.forEach((origin: any, idx: number) => {
              checkPageBreak(12);
              const originName = origin.name || 'N/A';
              const originStatus = origin.status === 'completed' ? '[✓]' : origin.status === 'problem' ? '[!]' : '[ ]';
              doc.text(`      ${originStatus} ${idx + 1}. ${originName}`, margin + 2, y);
              y += 5;
              if (origin.signerName || origin.incidence) {
                let info = `         - `;
                if (origin.signerName) info += `Firmante: ${origin.signerName} ${origin.signerDocument ? '(' + origin.signerDocument + ')' : ''}`;
                if (origin.incidence) info += ` | Incidencia: ${origin.incidence}`;
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text(info, margin + 2, y);
                doc.setFontSize(9);
                doc.setTextColor(0, 0, 0);
                y += 5;
              }
            });
            checkPageBreak(10);
            doc.setFont("helvetica", "bold");
            doc.text(`   DESTINO FINAL: ${note.destination || 'N/A'}`, margin + 2, y);
            y += 7;
          } else {
            doc.text(`   Destino Final: ${note.destination || 'N/A'}`, margin + 2, y);
            y += 7;
          }
          
          // Tiempo de espera si existe
          if (note.waitTime && note.waitTime > 0) {
            const hours = Math.floor(note.waitTime / 60);
            const mins = note.waitTime % 60;
            const waitTimeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            doc.text(`   Tiempo de espera: ${waitTimeStr}`, margin + 2, y);
            y += 5;
          }
          
          // Observaciones
          if (note.observations) {
            checkPageBreak(10);
            const obsText = note.observations.length > 80 ? note.observations.substring(0, 80) + '...' : note.observations;
            doc.text(`   Observaciones: ${obsText}`, margin + 2, y);
            y += 5;
          }
          
          // Información de firma
          if (note.signedAt) {
            const signedDate = new Date(note.signedAt).toLocaleString('es-ES');
            doc.text(`   Firmado: ${signedDate}`, margin + 2, y);
            y += 5;
          }
          
          y += 8; // Espacio entre albaranes
        });
        
        if (tenantDeliveryNotes.length > 100) {
          checkPageBreak(15);
          doc.setFont("helvetica", "italic");
          doc.text(`... y ${tenantDeliveryNotes.length - 100} albaranes más (ver archivo JSON para lista completa)`, margin, y);
          y += 10;
        }
      }

      // ========== FACTURAS ==========
      if (tenantInvoices.length > 0) {
        doc.addPage();
        y = 25;
        
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("FACTURAS", margin, y);
        y += 12;
        drawSeparator();

        const invoicesToPrint = tenantInvoices.slice(0, 50);
        
        doc.setFontSize(9);
        
        invoicesToPrint.forEach((inv, index) => {
          checkPageBreak(25);
          
          doc.setFont("helvetica", "bold");
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F');
          doc.text(`Factura ${inv.invoicePrefix || 'FAC'}-${inv.invoiceNumber}`, margin + 2, y);
          
          const estadoFactura = inv.status === 'paid' ? 'PAGADA' : inv.status === 'sent' ? 'ENVIADA' : inv.status === 'cancelled' ? 'CANCELADA' : 'BORRADOR';
          doc.text(`Estado: ${estadoFactura}`, pageWidth - margin - 40, y);
          y += 10;
          
          doc.setFont("helvetica", "normal");
          doc.text(`Cliente: ${inv.customerName || 'N/A'}`, margin + 2, y);
          y += 5;
          
          const fechaEmision = inv.issueDate || 'N/A';
          const fechaVenc = inv.dueDate || 'N/A';
          doc.text(`Fecha emisión: ${fechaEmision} | Vencimiento: ${fechaVenc}`, margin + 2, y);
          y += 5;
          
          doc.text(`Subtotal: ${(inv.subtotal || 0).toFixed(2)}€ | IVA (${inv.taxRate || 21}%): ${(inv.taxAmount || 0).toFixed(2)}€ | Total: ${(inv.total || 0).toFixed(2)}€`, margin + 2, y);
          y += 10;
        });
        
        if (tenantInvoices.length > 50) {
          checkPageBreak(15);
          doc.setFont("helvetica", "italic");
          doc.text(`... y ${tenantInvoices.length - 50} facturas más (ver archivo JSON para lista completa)`, margin, y);
        }
      }

      // ========== TIPOS DE VEHÍCULOS ==========
      if (tenantVehicleTypes.length > 0) {
        doc.addPage();
        y = 25;
        
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("TIPOS DE VEHÍCULOS", margin, y);
        y += 12;
        drawSeparator();
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        tenantVehicleTypes.forEach((vt, index) => {
          checkPageBreak(10);
          doc.text(`${index + 1}. ${vt.name} ${vt.isActive ? '(Activo)' : '(Inactivo)'}`, margin, y);
          y += 7;
        });
      }

      // Pie de página en última página
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(`Generado por eAlbarán - ${new Date().toLocaleString("es-ES")}`, pageWidth / 2, pageHeight - 10, { align: "center" });

      const pdfOutput = doc.output('arraybuffer');
      pdfFileName = `${backupData.type}_backup_${tenantId}_${timestamp}.pdf`;
      const pdfFilePath = path.join(BACKUP_DIR, pdfFileName);
      fs.writeFileSync(pdfFilePath, Buffer.from(pdfOutput));
      pdfFileSize = pdfOutput.byteLength;
    } catch (pdfError) {
      console.error(`[backup] Error generating PDF for tenant ${tenantId}:`, pdfError);
      // We continue since JSON is the primary backup
    }

    return {
      success: true,
      fileName,
      pdfFileName,
      fileSize,
      pdfFileSize,
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

      // Log JSON Backup
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

      // Log PDF Backup if successful
      if (result.success && result.pdfFileName) {
        const pdfBackupLogEntry = {
          tenantId: tenant.id,
          userId: "system",
          type: "automated" as const,
          status: "completed" as const,
          fileName: result.pdfFileName,
          fileSize: result.pdfFileSize,
          recordCounts: result.recordCounts as any,
          errorMessage: null,
        };
        await db.insert(backupLogs).values(pdfBackupLogEntry);
      }

      if (result.success) {
        console.log(`[backup] ✓ Backups completed for ${tenant.companyName || tenant.id}: ${result.fileName}${result.pdfFileName ? ' and ' + result.pdfFileName : ''}`);
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
