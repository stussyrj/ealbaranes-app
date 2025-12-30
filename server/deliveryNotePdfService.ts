import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

export function generateDeliveryNotePdf(note: DeliveryNoteWithDetails): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  doc.setFont("helvetica");

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`ALBARÁN #${note.noteNumber || "—"}`, margin, yPos);
  yPos += 12;

  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Client section
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE", margin, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const clientText = note.clientName || "N/A";
  doc.text(clientText, margin, yPos);
  yPos += 8;

  // Worker info
  if (note.workerName) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Trabajador: ${note.workerName}`, margin, yPos);
    yPos += 5;
    doc.setTextColor(0, 0, 0);
  }

  // Pickup origins
  if (note.pickupOrigins && note.pickupOrigins.length > 0) {
    yPos += 3;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ORÍGENES DE RECOGIDA", margin, yPos);
    yPos += 5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    note.pickupOrigins.forEach((origin, idx) => {
      const originName = origin.name || "N/A";
      const originAddress = origin.address || "N/A";
      doc.text(`${idx + 1}. ${originName}`, margin + 5, yPos);
      yPos += 4;
      doc.text(`   ${originAddress}`, margin + 5, yPos);
      yPos += 4;
    });
  }

  // Destination
  yPos += 2;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DESTINO", margin, yPos);
  yPos += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(note.destination || "N/A", margin + 5, yPos);
  yPos += 7;

  // Details grid
  yPos += 2;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  const colWidth = (pageWidth - 2 * margin) / 3;
  const detailsY = yPos;

  // Vehicle
  doc.text("Vehículo", margin, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(note.vehicleType || "N/A", margin, yPos + 4);
  doc.setFont("helvetica", "bold");

  // Date
  doc.text("Fecha", margin + colWidth, yPos);
  doc.setFont("helvetica", "normal");
  const dateStr = note.date ? format(new Date(note.date), "dd/MM/yyyy", { locale: es }) : "N/A";
  doc.text(dateStr, margin + colWidth, yPos + 4);
  doc.setFont("helvetica", "bold");

  // Time
  doc.text("Hora", margin + colWidth * 2, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(note.time || "N/A", margin + colWidth * 2, yPos + 4);

  yPos += 12;

  // Carload details if present
  if (note.carloadDetails) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLES DE CARGA", margin, yPos);
    yPos += 5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const carloadLines = doc.splitTextToSize(note.carloadDetails, pageWidth - 2 * margin - 5);
    doc.text(carloadLines, margin + 5, yPos);
    yPos += carloadLines.length * 4 + 3;
  }

  // Observations if present
  if (note.observations) {
    yPos += 2;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("OBSERVACIONES", margin, yPos);
    yPos += 5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const obsLines = doc.splitTextToSize(note.observations, pageWidth - 2 * margin - 5);
    doc.text(obsLines, margin + 5, yPos);
    yPos += obsLines.length * 4 + 3;
  }

  // Delivery photo if present
  if (note.photo) {
    yPos += 3;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("FOTO DE ENTREGA", margin, yPos);
    yPos += 5;

    try {
      const photoWidth = pageWidth - 2 * margin;
      const photoHeight = 80;
      doc.addImage(note.photo, "JPEG", margin, yPos, photoWidth, photoHeight);
      yPos += photoHeight + 5;
    } catch (e) {
      console.error("Error adding delivery photo:", e);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("No se pudo cargar la foto", margin + 5, yPos);
      yPos += 5;
    }
  }

  // Time tracking info
  if (note.arrivedAt || note.departedAt) {
    yPos += 2;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("REGISTRO DE TIEMPOS", margin, yPos);
    yPos += 5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    if (note.arrivedAt) {
      const arrivedTime = format(new Date(note.arrivedAt), "dd/MM/yyyy HH:mm", { locale: es });
      doc.text(`Llegada: ${arrivedTime}`, margin + 5, yPos);
      yPos += 4;
    }

    if (note.departedAt) {
      const departedTime = format(new Date(note.departedAt), "dd/MM/yyyy HH:mm", { locale: es });
      doc.text(`Salida: ${departedTime}`, margin + 5, yPos);
      yPos += 4;
    }

    // Calculate duration
    if (note.arrivedAt && note.departedAt) {
      const arrived = new Date(note.arrivedAt).getTime();
      const departed = new Date(note.departedAt).getTime();
      const diffMinutes = Math.floor((departed - arrived) / 60000);
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      doc.setFont("helvetica", "bold");
      doc.text(`Duración: ${durationText}`, margin + 5, yPos);
      yPos += 4;
      doc.setFont("helvetica", "normal");
    }
  }

  // Signatures section
  yPos += 5;
  const sigSectionY = yPos;
  const sigColWidth = (pageWidth - 2 * margin) / 2 - 2;

  // Origin signature
  if (note.originSignature) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("FIRMA DE ORIGEN", margin, yPos);
    yPos += 5;

    if (note.originSignatureDocument) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`DNI: ${note.originSignatureDocument}`, margin, yPos);
      yPos += 3;
      doc.setTextColor(0, 0, 0);
    }

    if (note.originSignedAt) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const signedDate = format(new Date(note.originSignedAt), "dd/MM/yyyy HH:mm", { locale: es });
      doc.text(`${signedDate}`, margin, yPos);
      yPos += 3;
      doc.setTextColor(0, 0, 0);
    }

    try {
      doc.addImage(note.originSignature, "PNG", margin, yPos, sigColWidth - 2, 20);
      yPos += 22;
    } catch (e) {
      console.error("Error adding origin signature image:", e);
      yPos += 5;
    }
  }

  // Destination signature
  const destSigX = margin + sigColWidth + 2;
  if (note.destinationSignature) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("FIRMA DE DESTINO", destSigX, sigSectionY);

    let destSigY = sigSectionY + 5;

    if (note.destinationSignatureDocument) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`DNI: ${note.destinationSignatureDocument}`, destSigX, destSigY);
      destSigY += 3;
      doc.setTextColor(0, 0, 0);
    }

    if (note.destinationSignedAt) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const signedDate = format(new Date(note.destinationSignedAt), "dd/MM/yyyy HH:mm", { locale: es });
      doc.text(`${signedDate}`, destSigX, destSigY);
      destSigY += 3;
      doc.setTextColor(0, 0, 0);
    }

    try {
      doc.addImage(note.destinationSignature, "PNG", destSigX, destSigY, sigColWidth - 2, 20);
    } catch (e) {
      console.error("Error adding destination signature image:", e);
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.text(`Albarán generado digitalmente - ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`, margin, footerY);

  return Buffer.from(doc.output("arraybuffer"));
}
