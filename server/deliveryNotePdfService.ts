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
  doc.roundedRect(x, y, width, height, 1.5, 1.5, "FD");
}

function drawLabel(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFontSize(7);
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
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  doc.setFont("helvetica");

  // Compact header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 22, "F");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("ALBARÁN DE ENTREGA", margin, 10);

  // Note number
  doc.setFontSize(12);
  const noteNumText = `#${note.noteNumber || "—"}`;
  doc.text(noteNumText, pageWidth - margin - doc.getTextWidth(noteNumText), 10);

  // Date and worker
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const dateStr = note.date ? format(new Date(note.date), "dd/MM/yyyy", { locale: es }) : "";
  const workerStr = note.workerName ? ` | ${note.workerName}` : "";
  doc.text(`${dateStr}${workerStr}`, margin, 18);

  doc.setTextColor(0, 0, 0);
  yPos = 26;

  // Row 1: Client + Vehicle/Time (compact)
  const col2Width = (contentWidth - 3) / 2;
  
  // Client box
  drawSectionBox(doc, margin, yPos, col2Width, 18);
  drawLabel(doc, "CLIENTE", margin + 3, yPos + 4);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  const clientText = (note.clientName || "N/A").substring(0, 40);
  doc.text(clientText, margin + 3, yPos + 10);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`${note.vehicleType || "N/A"} | ${note.time || "N/A"}`, margin + 3, yPos + 15);

  // Route box (Origin -> Destination)
  const routeX = margin + col2Width + 3;
  drawSectionBox(doc, routeX, yPos, col2Width, 18);
  drawLabel(doc, "RUTA", routeX + 3, yPos + 4);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  
  let originText = "N/A";
  if (note.pickupOrigins && note.pickupOrigins.length > 0) {
    const first = note.pickupOrigins[0];
    originText = first.name || first.address || "Origen";
    if (note.pickupOrigins.length > 1) {
      originText += ` (+${note.pickupOrigins.length - 1})`;
    }
  }
  originText = originText.substring(0, 25);
  
  const destText = (note.destination || "N/A").substring(0, 25);
  doc.text(originText, routeX + 3, yPos + 10);
  doc.setTextColor(59, 130, 246);
  doc.text("→", routeX + 3 + doc.getTextWidth(originText) + 2, yPos + 10);
  doc.setTextColor(15, 23, 42);
  doc.text(destText, routeX + 3, yPos + 15);

  yPos += 21;

  // Observations + Carload (if any) - compact single row
  const hasObs = note.observations && note.observations.trim().length > 0;
  const hasCarload = note.carloadDetails && note.carloadDetails.trim().length > 0;
  
  if (hasObs || hasCarload) {
    drawSectionBox(doc, margin, yPos, contentWidth, 14);
    
    if (hasCarload && hasObs) {
      // Both - split in two columns
      drawLabel(doc, "CARGA", margin + 3, yPos + 4);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      const carloadShort = (note.carloadDetails || "").substring(0, 50);
      doc.text(carloadShort, margin + 3, yPos + 9);
      
      drawLabel(doc, "OBSERVACIONES", margin + contentWidth/2, yPos + 4);
      const obsShort = (note.observations || "").substring(0, 50);
      doc.text(obsShort, margin + contentWidth/2, yPos + 9);
    } else if (hasObs) {
      drawLabel(doc, "OBSERVACIONES", margin + 3, yPos + 4);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      const obsShort = (note.observations || "").substring(0, 120);
      const obsLines = doc.splitTextToSize(obsShort, contentWidth - 6);
      doc.text(obsLines.slice(0, 2), margin + 3, yPos + 9);
    } else if (hasCarload) {
      drawLabel(doc, "DETALLES DE CARGA", margin + 3, yPos + 4);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      const carloadShort = (note.carloadDetails || "").substring(0, 120);
      const carloadLines = doc.splitTextToSize(carloadShort, contentWidth - 6);
      doc.text(carloadLines.slice(0, 2), margin + 3, yPos + 9);
    }
    
    yPos += 17;
  }

  // Time tracking (compact inline)
  if (note.arrivedAt || note.departedAt) {
    drawSectionBox(doc, margin, yPos, contentWidth, 10);
    drawLabel(doc, "TIEMPOS", margin + 3, yPos + 4);
    
    let timeText = "";
    if (note.arrivedAt) {
      timeText += `Llegada: ${format(new Date(note.arrivedAt), "HH:mm")}`;
    }
    if (note.departedAt) {
      timeText += `  Salida: ${format(new Date(note.departedAt), "HH:mm")}`;
    }
    if (note.arrivedAt && note.departedAt) {
      const diffMinutes = Math.floor((new Date(note.departedAt).getTime() - new Date(note.arrivedAt).getTime()) / 60000);
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      timeText += `  (${hours > 0 ? hours + 'h ' : ''}${mins}min)`;
    }
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(timeText, margin + 25, yPos + 7);
    
    yPos += 13;
  }

  // Photo section - compact height
  if (note.photo) {
    const maxPhotoHeight = 55;
    const maxPhotoWidth = contentWidth - 20;
    const scaledDims = getScaledImageDimensions(note.photo, maxPhotoWidth, maxPhotoHeight);
    
    drawLabel(doc, "FOTO DE ENTREGA", margin, yPos + 3);
    yPos += 5;

    try {
      if (scaledDims) {
        const photoX = margin + (contentWidth - scaledDims.width) / 2;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.rect(photoX - 0.5, yPos - 0.5, scaledDims.width + 1, scaledDims.height + 1);
        doc.addImage(note.photo, "JPEG", photoX, yPos, scaledDims.width, scaledDims.height);
        yPos += scaledDims.height + 4;
      } else {
        doc.addImage(note.photo, "JPEG", margin, yPos, 50, 35);
        yPos += 39;
      }
    } catch (e) {
      console.error("Error adding photo:", e);
      yPos += 5;
    }
  }

  // Signatures section - compact horizontal layout
  const hasOriginDoc = note.originSignatureDocument;
  const hasDestDoc = note.destinationSignatureDocument;
  
  if (hasOriginDoc || hasDestDoc) {
    const sigColWidth = (contentWidth - 3) / 2;
    const sigHeight = 28;
    
    // Origin signature
    if (hasOriginDoc) {
      drawSectionBox(doc, margin, yPos, sigColWidth, sigHeight);
      drawLabel(doc, "FIRMA ORIGEN", margin + 3, yPos + 4);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`DNI: ${note.originSignatureDocument}`, margin + 3, yPos + 9);
      
      if (note.originSignedAt) {
        doc.setFontSize(7);
        doc.text(format(new Date(note.originSignedAt), "dd/MM/yy HH:mm"), margin + 3, yPos + 13);
      }

      if (note.originSignature) {
        try {
          doc.addImage(note.originSignature, "PNG", margin + 3, yPos + 15, sigColWidth - 8, 11);
        } catch (e) {}
      }
    }

    // Destination signature
    if (hasDestDoc) {
      const destX = hasOriginDoc ? margin + sigColWidth + 3 : margin;
      const destWidth = hasOriginDoc ? sigColWidth : contentWidth;
      
      drawSectionBox(doc, destX, yPos, destWidth, sigHeight);
      drawLabel(doc, "FIRMA DESTINO", destX + 3, yPos + 4);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`DNI: ${note.destinationSignatureDocument}`, destX + 3, yPos + 9);
      
      if (note.destinationSignedAt) {
        doc.setFontSize(7);
        doc.text(format(new Date(note.destinationSignedAt), "dd/MM/yy HH:mm"), destX + 3, yPos + 13);
      }

      if (note.destinationSignature) {
        try {
          doc.addImage(note.destinationSignature, "PNG", destX + 3, yPos + 15, (hasOriginDoc ? sigColWidth : contentWidth) - 8, 11);
        } catch (e) {}
      }
    }

    yPos += sigHeight + 3;
  }

  // Footer
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  const footerY = 290;
  doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, margin, footerY);
  doc.text("eAlbarán", pageWidth - margin - 15, footerY);

  return Buffer.from(doc.output("arraybuffer"));
}
