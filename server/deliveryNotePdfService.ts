import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import imageSize from "image-size";

function getScaledImageDimensions(
  base64Data: string,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  try {
    if (!base64Data || base64Data.length < 100) {
      console.log("Base64 data too short, using default dimensions");
      return getDefaultDimensions(maxWidth, maxHeight);
    }
    
    let data = base64Data;
    // Handle data URLs (data:image/jpeg;base64,...)
    if (data.includes(",")) {
      data = data.split(",")[1];
    }
    
    // Validate base64 string
    if (!data || data.length < 50) {
      console.log("Invalid base64 content, using default dimensions");
      return getDefaultDimensions(maxWidth, maxHeight);
    }
    
    const buffer = Buffer.from(data, "base64");
    
    if (buffer.length < 100) {
      console.log("Decoded buffer too small, using default dimensions");
      return getDefaultDimensions(maxWidth, maxHeight);
    }
    
    const dimensions = imageSize(buffer);
    
    if (!dimensions.width || !dimensions.height) {
      console.log("Could not determine image dimensions, using defaults");
      return getDefaultDimensions(maxWidth, maxHeight);
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
    console.log("Error getting image dimensions, using defaults:", e);
    return getDefaultDimensions(maxWidth, maxHeight);
  }
}

function getDefaultDimensions(maxWidth: number, maxHeight: number): { width: number; height: number } {
  // Use 4:3 aspect ratio as default (common photo aspect ratio)
  const aspectRatio = 4 / 3;
  let width = maxWidth;
  let height = width / aspectRatio;
  
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return { width, height };
}

interface Stop {
  address: string;
  name?: string;
  type: 'recogida' | 'entrega' | 'recogida+entrega';
  orderIndex?: number;
  status?: string;
  signature?: string | null;
  signerName?: string | null;
  signerDocument?: string | null;
  signedAt?: string | null;
  quantity?: string | null;
  incidence?: string | null;
  geoLocation?: { lat: number; lng: number } | null;
}

interface DeliveryNoteWithDetails {
  id: string;
  noteNumber?: number;
  clientName?: string | null;
  stops?: Stop[] | null;
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
  const rowHeight = 20; // Reduced from 22
  const colSpacing = 5;
  const colWidth = (contentWidth - (2 * colSpacing)) / 3;

  // Row 1: Client, Vehicle, Time
  // Client Box (Double width for better visibility)
  const clientBoxWidth = colWidth * 1.5 + colSpacing;
  drawSectionBox(doc, margin, yPos, clientBoxWidth, rowHeight);
  drawLabel(doc, "CLIENTE", margin + 4, yPos + 6);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(note.clientName || "N/A", margin + 4, yPos + 13);

  // Vehicle Box
  const vehX = margin + clientBoxWidth + colSpacing;
  const vehWidth = contentWidth - clientBoxWidth - colSpacing;
  drawSectionBox(doc, vehX, yPos, vehWidth, rowHeight);
  drawLabel(doc, "VEHÍCULO / TRANSPORTE", vehX + 4, yPos + 6);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(note.vehicleType || "N/A", vehX + 4, yPos + 13);

  yPos += rowHeight + 4;

  // Row 2: Stops (paradas) - Uses new stops format with fallback to pickupOrigins
  const stopsData: Stop[] = note.stops && note.stops.length > 0 
    ? note.stops 
    : (note.pickupOrigins || []).map((origin, idx, arr) => ({
        address: origin.address || "",
        name: origin.name || "",
        type: idx === arr.length - 1 ? "entrega" as const : "recogida" as const,
        status: origin.status,
        signature: origin.signature,
        signerName: origin.signerName,
        signerDocument: origin.signerDocument,
        signedAt: origin.signedAt,
        quantity: origin.quantity,
        incidence: origin.incidence,
        geoLocation: origin.geoLocation,
      }));

  if (stopsData.length > 0) {
    drawLabel(doc, "PARADAS DE RUTA", margin, yPos);
    yPos += 6;
    
    let originY = yPos;
    stopsData.forEach((stop, idx) => {
      const name = stop.name || stop.address;
      const address = stop.address || "";
      const status = stop.status || "pending";
      const statusText = status === "completed" ? "[OK]" : status === "problem" ? "[!]" : "[ ]";
      
      // Type label - use simple text compatible with Helvetica font
      const typeLabels: Record<string, string> = {
        'recogida': 'RECOGIDA',
        'entrega': 'ENTREGA',
        'recogida+entrega': 'RECOGIDA + ENTREGA'
      };
      const typeLabel = typeLabels[stop.type] || stop.type.toUpperCase();
      
      // Location line with type
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const text = `${idx + 1}. ${statusText} ${typeLabel}: ${name}`;
      doc.text(text, margin + 4, originY);
      originY += 5;
      
      // Address if different from name
      if (address && address !== name) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(`Dir: ${address}`, margin + 12, originY);
        doc.setTextColor(0, 0, 0);
        originY += 5;
      }
      
      // Additional info if signed
      if (stop.signedAt || stop.quantity || stop.signerName || stop.signerDocument) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        
        let infoLine = "";
        if (stop.signedAt) {
          try {
            infoLine += `Hora: ${format(new Date(stop.signedAt), "HH:mm")}`;
          } catch (e) {
            infoLine += `Hora: ${stop.signedAt}`;
          }
        }
        if (stop.signerName) infoLine += `${infoLine ? " | " : ""}Firmado por: ${stop.signerName}`;
        if (stop.signerDocument) infoLine += ` (${stop.signerDocument})`;
        if (stop.quantity) infoLine += `${infoLine ? " | " : ""}Cantidad: ${stop.quantity}`;
        
        if (infoLine) {
          doc.text(infoLine, margin + 12, originY);
          originY += 5;
        }
        
        // Geo location if available
        if (stop.geoLocation) {
          doc.text(`GPS: ${stop.geoLocation.lat.toFixed(6)}, ${stop.geoLocation.lng.toFixed(6)}`, margin + 12, originY);
          originY += 5;
        }
        
        // Incidence warning
        if (stop.incidence) {
          doc.setTextColor(180, 83, 9);
          doc.text(`[!] Incidencia: ${stop.incidence}`, margin + 12, originY);
          originY += 5;
        }
        
        doc.setTextColor(0, 0, 0);
      }
      
      // Signature image if present
      if (stop.signature && stop.signature.length > 100) {
        try {
          const sigWidth = 40;
          const sigHeight = 20;
          const sigX = margin + 12;
          
          let sigData = stop.signature;
          if (!sigData.startsWith('data:image/')) {
            sigData = `data:image/png;base64,${sigData}`;
          }
          
          doc.addImage(sigData, 'PNG', sigX, originY, sigWidth, sigHeight);
          originY += sigHeight + 4;
        } catch (e) {
          console.error("Error adding stop signature to PDF:", e);
        }
      }
      
      originY += 3;
      
      // Check for page break needed for next stop
      if (originY > pageHeight - 60) {
        doc.addPage();
        originY = 25;
      }
    });
    
    yPos = originY + 4;
  }

  // Show legacy destination if no stops format
  if (!note.stops || note.stops.length === 0) {
    drawSectionBox(doc, margin, yPos, contentWidth, 18);
    drawLabel(doc, "DESTINO FINAL (ENTREGA)", margin + 4, yPos + 6);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(note.destination || "N/A", margin + 8, yPos + 13);
    doc.setTextColor(0, 0, 0);
    yPos += 22;
  }

  // Row 4: Carload & Observations
  const obsHeight = 25; // Reduced from 30
  drawSectionBox(doc, margin, yPos, contentWidth, obsHeight);
  drawLabel(doc, "OBSERVACIONES Y DETALLES DE CARGA", margin + 4, yPos + 6);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const obsText = `${note.carloadDetails || ""} ${note.observations || ""}`.trim() || "Sin observaciones adicionales.";
  const splitObs = doc.splitTextToSize(obsText, contentWidth - 10);
  doc.text(splitObs, margin + 6, yPos + 13);

  yPos += obsHeight + 4; // Reduced from 38

  // Row 5: Time Tracking & Signatures
  const timeBoxHeight = 22; // Reduced from 25
  drawSectionBox(doc, margin, yPos, contentWidth, timeBoxHeight);
  
  // Times
  drawLabel(doc, "REGISTRO DE TIEMPOS Y DOCUMENTACIÓN", margin + 4, yPos + 6);
  doc.setFontSize(10);
  let timeInfo = "No se registraron tiempos.";
  if (note.arrivedAt || note.departedAt) {
    timeInfo = "";
    if (note.arrivedAt) timeInfo += `Llegada: ${format(new Date(note.arrivedAt), "HH:mm")}`;
    if (note.departedAt) timeInfo += ` | Salida: ${format(new Date(note.departedAt), "HH:mm")}`;
  }
  doc.text(timeInfo, margin + 6, yPos + 13);

  // Docs
  let docsInfo = "";
  if (note.originSignatureDocument) docsInfo += `DNI Origen: ${note.originSignatureDocument}`;
  if (note.destinationSignatureDocument) docsInfo += `${docsInfo ? ' | ' : ''}DNI Destino: ${note.destinationSignatureDocument}`;
  if (docsInfo) doc.text(docsInfo, margin + 6, yPos + 19);

  yPos += timeBoxHeight + 4; // Reduced from 33

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
      const photoX = margin + (contentWidth - scaledDims.width) / 2;
      doc.setDrawColor(200, 200, 200);
      doc.rect(photoX - 1, yPos - 1, scaledDims.width + 2, scaledDims.height + 2);
      
      // Ensure photo is a valid base64 image string for jspdf
      let photoData = note.photo;
      if (!photoData.startsWith('data:image/')) {
        // If it's just raw base64, assume PNG if it starts with PNG signature, otherwise JPEG
        const isPng = photoData.startsWith('iVBORw0KGgo');
        photoData = `data:image/${isPng ? 'png' : 'jpeg'};base64,${photoData}`;
      }
      
      const imageFormat = photoData.includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(photoData, imageFormat, photoX, yPos, scaledDims.width, scaledDims.height);
    } catch (e) {
      console.error("Error adding photo to PDF:", e);
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("(Error al cargar la imagen)", margin + 6, yPos + 10);
      doc.setTextColor(0, 0, 0);
    }
  }

  // Fixed Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  doc.text(`eAlbarán - Gestión Digital de Transporte | Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageWidth / 2, pageHeight - 10, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
