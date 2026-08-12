import { PDFDocument, StandardFonts, rgb, AFRelationship } from 'pdf-lib';
import { InvoiceExtraction } from '../ai/extractInvoice';
import { generateZugferdXml } from './generateXml';

export async function generateZugferdPdf(data: InvoiceExtraction, invoiceId: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  // Basic visual PDF representation
  const page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  page.drawText('ZUGFeRD E-Rechnung (PDF/A-3)', { x: 50, y: 800, size: 18, font, color: rgb(0, 0, 0) });
  page.drawText(`Vendor: ${data.vendor_name}`, { x: 50, y: 760, size: 12, font });
  page.drawText(`Invoice ID: ${invoiceId}`, { x: 50, y: 740, size: 12, font });
  page.drawText(`Net Amount: ${data.net_amount.toFixed(2)} EUR`, { x: 50, y: 720, size: 12, font });
  page.drawText(`Tax Rate: ${data.tax_rate || 19}%`, { x: 50, y: 700, size: 12, font });
  page.drawText(`Gross Amount: ${data.gross_amount.toFixed(2)} EUR`, { x: 50, y: 680, size: 12, font });
  
  let y = 640;
  if (data.line_items && data.line_items.length > 0) {
    page.drawText('Positionen:', { x: 50, y, size: 12, font });
    y -= 20;
    data.line_items.forEach(item => {
      page.drawText(`- ${item.quantity}x ${item.description} (Einzel: ${item.unit_price.toFixed(2)} EUR)`, { x: 70, y, size: 10, font });
      y -= 15;
    });
  }

  // Generate XML
  const xmlString = generateZugferdXml(data, invoiceId);
  const xmlBytes = new TextEncoder().encode(xmlString);

  // Embed XML as PDF attachment (minimal PDF/A-3 simulation)
  await pdfDoc.attach(xmlBytes, 'zugferd-invoice.xml', {
    mimeType: 'text/xml',
    description: 'ZUGFeRD Rechnung im XML-Format (EN 16931)',
    creationDate: new Date(),
    modificationDate: new Date(),
    afRelationship: AFRelationship.Data
  });
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

