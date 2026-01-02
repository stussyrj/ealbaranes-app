import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import imageSize from "image-size";

function getScaledImageDimensions(
  base64Data: string,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } | null {
  try {
    let data = base64Data;
    if (data.includes(",")) {
      data = data.split(",")[1];
    }
    
    const buffer = Buffer.from(data, "base64");
    const dimensions = imageSize(buffer);
    
    if (!dimensions.width || !dimensions.height) {
      return null;
    }
    
    const originalWidth = dimensions.width;
    const originalHeight = dimensions.height;
    const aspectRatio = originalWidth / originalHeight;
    
    let scaledWidth = maxWidth;
    let scaledHeight = scaledWidth / aspectRatio;
    
    if (scaledHeight > maxHeight) {
      scaledHeight = maxHeight;
      scaledWidth = scaledHeight * aspectRatio;
    }
    
    return { width: scaledWidth, height: scaledHeight };
  } catch (e) {
    console.error("Error getting image dimensions:", e);
    return null;
  }
}

interface DeliveryNoteWithDetails {
  id: string;
  noteNumber?: number;
  clientName?: string | null;
  pickupOrigins?: any[] | null;
  destination?: string | null;
  vehicleType?: string | null;
  date?: string | null;
  time?: string | null;
  observations?: string | null;
  photo?: string | null;
  originSignature?: string | null;
  originSignatureDocument?: string | null;
  originSignedAt?: string | null;
  destinationSignature?: string | null;
  destinationSignatureDocument?: string | null;
  destinationSignedAt?: string | null;
  workerName?: string | null;
  arrivedAt?: string | null;
  departedAt?: string | null;
  carloadDetails?: string | null;
}

function drawSectionBox(doc: jsPDF, x: number, y: number, width: number, height: number) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, width, height, 2, 2, "FD");
}

function drawLabel(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text(text, x, y);
  doc.setTextColor(0, 0, 0);
}

export function generateDeliveryNotePdf(note: DeliveryNoteWithDetails): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  doc.setFont("helvetica");

  // Modern Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("ALBARÁN DE ENTREGA", margin, 18);

  // Note number in header
  doc.setFontSize(16);
  const noteNumText = `Nº: ${note.noteNumber || "—"}`;
  doc.text(noteNumText, pageWidth - margin - doc.getTextWidth(noteNumText), 18);

  // Subheader info
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  const dateStr = note.date ? format(new Date(note.date), "dd 'de' MMMM, yyyy", { locale: es }) : "";
  const workerStr = note.workerName ? ` | Conductor: ${note.workerName}` : "";
  doc.text(`${dateStr}${workerStr}`, margin, 28);

  doc.setTextColor(0, 0, 0);
  yPos = 42;

  // Layout Constants
  const rowHeight = 22;
  const colSpacing = 5;
  const colWidth = (contentWidth - (2 * colSpacing)) / 3;

  // Row 1: Client, Vehicle, Time
  // Client Box (Double width for better visibility)
  const clientBoxWidth = colWidth * 1.5 + colSpacing;
  drawSectionBox(doc, margin, yPos, clientBoxWidth, rowHeight);
  drawLabel(doc, "CLIENTE", margin + 4, yPos + 6);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(note.clientName || "N/A", margin + 4, yPos + 14);

  // Vehicle Box
  const vehX = margin + clientBoxWidth + colSpacing;
  const vehWidth = contentWidth - clientBoxWidth - colSpacing;
  drawSectionBox(doc, vehX, yPos, vehWidth, rowHeight);
  drawLabel(doc, "VEHÍCULO / TRANSPORTE", vehX + 4, yPos + 6);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(note.vehicleType || "N/A", vehX + 4, yPos + 14);

  yPos += rowHeight + 8;

  // Row 2: Pickup Locations
  if (note.pickupOrigins && note.pickupOrigins.length > 0) {
    const originsHeight = Math.max(note.pickupOrigins.length * 10 + 10, 35);
    drawSectionBox(doc, margin, yPos, contentWidth, originsHeight);
    drawLabel(doc, "LUGARES DE RECOGIDA", margin + 4, yPos + 6);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    let originY = yPos + 15;
    note.pickupOrigins.forEach((origin, idx) => {
      const name = origin.name || "";
      const address = origin.address || "";
      let text = (name && address) ? `${name} - ${address}` : (name || address || "N/A");
      doc.text(`${idx + 1}. ${text}`, margin + 8, originY);
      originY += 10;
    });
    
    yPos += originsHeight + 8;
  }

  // Row 3: Destination
  drawSectionBox(doc, margin, yPos, contentWidth, 22);
  drawLabel(doc, "PUNTO DE ENTREGA (DESTINO)", margin + 4, yPos + 6);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(note.destination || "N/A", margin + 8, yPos + 14);

  yPos += 30;

  // Row 4: Carload & Observations
  const halfWidth = (contentWidth - colSpacing) / 2;
  
  // Observations
  drawSectionBox(doc, margin, yPos, contentWidth, 30);
  drawLabel(doc, "OBSERVACIONES Y DETALLES DE CARGA", margin + 4, yPos + 6);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const obsText = `${note.carloadDetails || ""} ${note.observations || ""}`.trim() || "Sin observaciones adicionales.";
  const splitObs = doc.splitTextToSize(obsText, contentWidth - 10);
  doc.text(splitObs, margin + 6, yPos + 14);

  yPos += 38;

  // Row 5: Time Tracking & Signatures
  drawSectionBox(doc, margin, yPos, contentWidth, 25);
  
  // Times
  drawLabel(doc, "REGISTRO DE TIEMPOS Y DOCUMENTACIÓN", margin + 4, yPos + 6);
  doc.setFontSize(10);
  let timeInfo = "No se registraron tiempos.";
  if (note.arrivedAt || note.departedAt) {
    timeInfo = "";
    if (note.arrivedAt) timeInfo += `Llegada: ${format(new Date(note.arrivedAt), "HH:mm")}`;
    if (note.departedAt) timeInfo += ` | Salida: ${format(new Date(note.departedAt), "HH:mm")}`;
  }
  doc.text(timeInfo, margin + 6, yPos + 14);

  // Docs
  let docsInfo = "";
  if (note.originSignatureDocument) docsInfo += `DNI Origen: ${note.originSignatureDocument}`;
  if (note.destinationSignatureDocument) docsInfo += `${docsInfo ? ' | ' : ''}DNI Destino: ${note.destinationSignatureDocument}`;
  if (docsInfo) doc.text(docsInfo, margin + 6, yPos + 20);

  yPos += 33;

  // Row 6: Photo (Largest Section)
  if (note.photo) {
    // We want the photo to take up the remaining space properly
    const remainingSpace = pageHeight - yPos - margin - 15;
    const maxPhotoHeight = Math.max(remainingSpace, 80); 
    const maxPhotoWidth = contentWidth;
    
    const scaledDims = getScaledImageDimensions(note.photo, maxPhotoWidth, maxPhotoHeight);
    
    drawLabel(doc, "FOTO COMPROBANTE DE ENTREGA", margin, yPos);
    yPos += 6;

    try {
      if (scaledDims) {
        const photoX = margin + (contentWidth - scaledDims.width) / 2;
        doc.setDrawColor(200, 200, 200);
        doc.rect(photoX - 1, yPos - 1, scaledDims.width + 2, scaledDims.height + 2);
        doc.addImage(note.photo, "JPEG", photoX, yPos, scaledDims.width, scaledDims.height);
      }
    } catch (e) {
      console.error("Error adding photo to PDF:", e);
    }
  }

  // Fixed Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  doc.text(`eAlbarán - Gestión Digital de Transporte | Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth / 2, pageHeight - 10, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
