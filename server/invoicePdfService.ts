import { jsPDF } from "jspdf";
import { Invoice, InvoiceLineItem, InvoiceTemplate } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface InvoiceWithDetails extends Invoice {
  lineItems: InvoiceLineItem[];
  template?: InvoiceTemplate | null;
}

export function generateInvoicePdf(invoice: InvoiceWithDetails): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const template = invoice.template;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = margin;

  doc.setFont("helvetica");

  if (template?.companyName) {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(template.companyName, margin, yPos);
    yPos += 8;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  
  if (template?.companyAddress) {
    doc.text(template.companyAddress, margin, yPos);
    yPos += 4;
  }
  
  const cityPostal = [template?.companyCity, template?.companyPostalCode]
    .filter(Boolean)
    .join(", ");
  if (cityPostal) {
    doc.text(cityPostal, margin, yPos);
    yPos += 4;
  }
  
  if (template?.companyTaxId) {
    doc.text(`CIF/NIF: ${template.companyTaxId}`, margin, yPos);
    yPos += 4;
  }
  
  const contactInfo = [template?.companyPhone, template?.companyEmail]
    .filter(Boolean)
    .join(" | ");
  if (contactInfo) {
    doc.text(contactInfo, margin, yPos);
    yPos += 4;
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  const invoiceTitle = `FACTURA`;
  doc.text(invoiceTitle, pageWidth - margin, 25, { align: "right" });
  
  doc.setFontSize(12);
  const invoiceNumber = `Nº ${invoice.invoicePrefix || ""}${invoice.invoiceNumber}`;
  doc.text(invoiceNumber, pageWidth - margin, 33, { align: "right" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (invoice.issueDate) {
    const issueDate = format(new Date(invoice.issueDate), "d 'de' MMMM 'de' yyyy", { locale: es });
    doc.text(`Fecha: ${issueDate}`, pageWidth - margin, 40, { align: "right" });
  }

  yPos = Math.max(yPos, 55);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENTE", margin, yPos);
  yPos += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  if (invoice.customerName) {
    doc.setFont("helvetica", "bold");
    doc.text(invoice.customerName, margin, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 5;
  }
  
  if (invoice.customerTaxId) {
    doc.text(`CIF/NIF: ${invoice.customerTaxId}`, margin, yPos);
    yPos += 5;
  }
  
  if (invoice.customerAddress) {
    doc.text(invoice.customerAddress, margin, yPos);
    yPos += 5;
  }

  const customerCityPostal = [invoice.customerCity, invoice.customerPostalCode]
    .filter(Boolean)
    .join(", ");
  if (customerCityPostal) {
    doc.text(customerCityPostal, margin, yPos);
    yPos += 5;
  }

  yPos += 10;

  const colDescription = margin;
  const colQty = pageWidth - margin - 70;
  const colPrice = pageWidth - margin - 45;
  const colSubtotal = pageWidth - margin - 15;

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, "F");
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPCIÓN", colDescription, yPos);
  doc.text("CANT.", colQty, yPos, { align: "right" });
  doc.text("PRECIO", colPrice, yPos, { align: "right" });
  doc.text("IMPORTE", colSubtotal, yPos, { align: "right" });
  yPos += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  for (const item of invoice.lineItems) {
    const description = item.description || "";
    const lines = doc.splitTextToSize(description, colQty - colDescription - 10);
    
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], colDescription, yPos);
      if (i === 0) {
        doc.text(item.quantity.toString(), colQty, yPos, { align: "right" });
        doc.text((item.unitPrice / 100).toFixed(2) + " €", colPrice, yPos, { align: "right" });
        doc.text((item.subtotal / 100).toFixed(2) + " €", colSubtotal, yPos, { align: "right" });
      }
      yPos += 5;
    }
    yPos += 2;
  }

  yPos += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  const totalsX = pageWidth - margin - 60;
  
  doc.setFontSize(10);
  doc.text("Base imponible:", totalsX, yPos);
  doc.text((invoice.subtotal / 100).toFixed(2) + " €", colSubtotal, yPos, { align: "right" });
  yPos += 6;
  
  doc.text(`IVA (${invoice.taxRate}%):`, totalsX, yPos);
  doc.text((invoice.taxAmount / 100).toFixed(2) + " €", colSubtotal, yPos, { align: "right" });
  yPos += 8;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL:", totalsX, yPos);
  doc.text((invoice.total / 100).toFixed(2) + " €", colSubtotal, yPos, { align: "right" });
  yPos += 15;

  if (invoice.dueDate) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const dueDate = format(new Date(invoice.dueDate), "d 'de' MMMM 'de' yyyy", { locale: es });
    doc.text(`Fecha de vencimiento: ${dueDate}`, margin, yPos);
    yPos += 8;
  }

  if (template?.defaultPaymentTerms) {
    doc.setFontSize(9);
    doc.text(`Condiciones: ${template.defaultPaymentTerms}`, margin, yPos);
    yPos += 10;
  }

  if (template?.bankName || template?.bankIban) {
    yPos += 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS BANCARIOS", margin, yPos);
    yPos += 6;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    if (template.bankName) {
      doc.text(`Banco: ${template.bankName}`, margin, yPos);
      yPos += 5;
    }
    if (template.bankIban) {
      doc.text(`IBAN: ${template.bankIban}`, margin, yPos);
      yPos += 5;
    }
    if (template.bankSwift) {
      doc.text(`SWIFT/BIC: ${template.bankSwift}`, margin, yPos);
      yPos += 5;
    }
  }

  if (invoice.notes) {
    yPos += 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(notesLines, margin, yPos);
    yPos += notesLines.length * 5;
  }

  if (template?.footerText) {
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    const footerLines = doc.splitTextToSize(template.footerText, pageWidth - 2 * margin);
    doc.text(footerLines, pageWidth / 2, footerY, { align: "center" });
  }

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
