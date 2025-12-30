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

function drawSectionHeader(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
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

  // Header background
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 35, "F");

  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("ALBARÁN DE ENTREGA", margin, 18);

  // Note number badge
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const noteNumText = `#${note.noteNumber || "—"}`;
  const noteNumWidth = doc.getTextWidth(noteNumText) + 10;
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(pageWidth - margin - noteNumWidth, 10, noteNumWidth, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(noteNumText, pageWidth - margin - noteNumWidth + 5, 17);

  // Date under header
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  const dateStr = note.date ? format(new Date(note.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : "";
  doc.text(dateStr, margin, 28);

  doc.setTextColor(0, 0, 0);
  yPos = 45;

  // Main info section - two columns
  const colWidth = (contentWidth - 5) / 2;

  // Left column - Client info
  drawSectionBox(doc, margin, yPos, colWidth, 32);
  drawSectionHeader(doc, "CLIENTE", margin + 4, yPos + 6);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  const clientLines = doc.splitTextToSize(note.clientName || "N/A", colWidth - 8);
  doc.text(clientLines, margin + 4, yPos + 13);
  
  if (note.workerName) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Trabajador: ${note.workerName}`, margin + 4, yPos + 26);
  }

  // Right column - Vehicle & Time
  const rightColX = margin + colWidth + 5;
  drawSectionBox(doc, rightColX, yPos, colWidth, 32);
  
  // Vehicle
  drawSectionHeader(doc, "VEHÍCULO", rightColX + 4, yPos + 6);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(note.vehicleType || "N/A", rightColX + 4, yPos + 13);

  // Time
  drawSectionHeader(doc, "HORA", rightColX + 4, yPos + 21);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(note.time || "N/A", rightColX + 4, yPos + 28);

  yPos += 38;

  // Route section - Origins and Destination
  let routeHeight = 20;
  if (note.pickupOrigins && note.pickupOrigins.length > 0) {
    routeHeight += note.pickupOrigins.length * 10;
  }
  
  drawSectionBox(doc, margin, yPos, contentWidth, routeHeight);
  
  let routeY = yPos + 6;
  
  // Origins
  if (note.pickupOrigins && note.pickupOrigins.length > 0) {
    drawSectionHeader(doc, "ORIGEN", margin + 4, routeY);
    routeY += 5;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    
    note.pickupOrigins.forEach((origin, idx) => {
      const originName = origin.name || "";
      const originAddress = origin.address || "";
      const originText = originName && originAddress ? `${originName} - ${originAddress}` : originName || originAddress || "N/A";
      doc.text(`• ${originText}`, margin + 6, routeY);
      routeY += 5;
    });
  }

  // Arrow
  doc.setFontSize(12);
  doc.setTextColor(59, 130, 246);
  doc.text("→", margin + contentWidth / 2 - 3, routeY - 2);

  // Destination
  drawSectionHeader(doc, "DESTINO", margin + contentWidth / 2 + 10, yPos + 6);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const destLines = doc.splitTextToSize(note.destination || "N/A", contentWidth / 2 - 15);
  doc.text(destLines, margin + contentWidth / 2 + 10, yPos + 12);

  yPos += routeHeight + 5;

  // Carload details if present
  if (note.carloadDetails) {
    const carloadLines = doc.splitTextToSize(note.carloadDetails, contentWidth - 10);
    const carloadHeight = Math.max(15, carloadLines.length * 4 + 10);
    
    drawSectionBox(doc, margin, yPos, contentWidth, carloadHeight);
    drawSectionHeader(doc, "DETALLES DE CARGA", margin + 4, yPos + 6);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(carloadLines, margin + 4, yPos + 12);
    
    yPos += carloadHeight + 5;
  }

  // Observations if present
  if (note.observations) {
    const obsLines = doc.splitTextToSize(note.observations, contentWidth - 10);
    const obsHeight = Math.max(15, obsLines.length * 4 + 10);
    
    drawSectionBox(doc, margin, yPos, contentWidth, obsHeight);
    drawSectionHeader(doc, "OBSERVACIONES", margin + 4, yPos + 6);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(obsLines, margin + 4, yPos + 12);
    
    yPos += obsHeight + 5;
  }

  // Time tracking section
  if (note.arrivedAt || note.departedAt) {
    drawSectionBox(doc, margin, yPos, contentWidth, 20);
    drawSectionHeader(doc, "REGISTRO DE TIEMPOS", margin + 4, yPos + 6);
    
    let timeX = margin + 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);

    if (note.arrivedAt) {
      const arrivedTime = format(new Date(note.arrivedAt), "HH:mm", { locale: es });
      doc.text(`Llegada: ${arrivedTime}`, timeX, yPos + 14);
      timeX += 40;
    }

    if (note.departedAt) {
      const departedTime = format(new Date(note.departedAt), "HH:mm", { locale: es });
      doc.text(`Salida: ${departedTime}`, timeX, yPos + 14);
      timeX += 40;
    }

    if (note.arrivedAt && note.departedAt) {
      const arrived = new Date(note.arrivedAt).getTime();
      const departed = new Date(note.departedAt).getTime();
      const diffMinutes = Math.floor((departed - arrived) / 60000);
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      const durationText = hours > 0 ? `${hours}h ${mins}min` : `${mins} min`;
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94);
      doc.text(`Duración: ${durationText}`, timeX, yPos + 14);
    }

    yPos += 25;
  }

  // Photo section - new page if needed
  if (note.photo) {
    const maxPhotoHeight = 90;
    const scaledDims = getScaledImageDimensions(note.photo, contentWidth, maxPhotoHeight);
    const photoHeight = scaledDims ? scaledDims.height : 60;
    
    if (yPos + photoHeight + 20 > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }

    drawSectionHeader(doc, "FOTO DE ENTREGA", margin, yPos + 4);
    yPos += 8;

    try {
      if (scaledDims) {
        const photoX = margin + (contentWidth - scaledDims.width) / 2;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.rect(photoX - 1, yPos - 1, scaledDims.width + 2, scaledDims.height + 2);
        doc.addImage(note.photo, "JPEG", photoX, yPos, scaledDims.width, scaledDims.height);
        yPos += scaledDims.height + 8;
      } else {
        doc.addImage(note.photo, "JPEG", margin, yPos, 80, 60);
        yPos += 68;
      }
    } catch (e) {
      console.error("Error adding delivery photo:", e);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text("No se pudo cargar la foto", margin, yPos + 10);
      yPos += 15;
    }
  }

  // Signatures section - new page if needed
  const hasSignatures = note.originSignatureDocument || note.destinationSignatureDocument;
  if (hasSignatures) {
    if (yPos + 50 > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }

    const sigColWidth = (contentWidth - 10) / 2;

    // Origin signature
    if (note.originSignatureDocument) {
      drawSectionBox(doc, margin, yPos, sigColWidth, 45);
      drawSectionHeader(doc, "FIRMA ORIGEN", margin + 4, yPos + 6);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`DNI: ${note.originSignatureDocument}`, margin + 4, yPos + 12);
      
      if (note.originSignedAt) {
        const signedDate = format(new Date(note.originSignedAt), "dd/MM/yyyy HH:mm", { locale: es });
        doc.setFontSize(8);
        doc.text(signedDate, margin + 4, yPos + 17);
      }

      if (note.originSignature) {
        try {
          doc.addImage(note.originSignature, "PNG", margin + 4, yPos + 20, sigColWidth - 10, 22);
        } catch (e) {
          console.error("Error adding origin signature:", e);
        }
      }
    }

    // Destination signature
    if (note.destinationSignatureDocument) {
      const destX = margin + sigColWidth + 10;
      drawSectionBox(doc, destX, yPos, sigColWidth, 45);
      drawSectionHeader(doc, "FIRMA DESTINO", destX + 4, yPos + 6);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`DNI: ${note.destinationSignatureDocument}`, destX + 4, yPos + 12);
      
      if (note.destinationSignedAt) {
        const signedDate = format(new Date(note.destinationSignedAt), "dd/MM/yyyy HH:mm", { locale: es });
        doc.setFontSize(8);
        doc.text(signedDate, destX + 4, yPos + 17);
      }

      if (note.destinationSignature) {
        try {
          doc.addImage(note.destinationSignature, "PNG", destX + 4, yPos + 20, sigColWidth - 10, 22);
        } catch (e) {
          console.error("Error adding destination signature:", e);
        }
      }
    }

    yPos += 50;
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  const footerY = pageHeight - 10;
  doc.text(`Documento generado digitalmente el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}`, margin, footerY);
  doc.text("eAlbarán - Gestión Digital de Transporte", pageWidth - margin - 55, footerY);

  return Buffer.from(doc.output("arraybuffer"));
}
