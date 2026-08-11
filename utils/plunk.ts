export async function sendInvoiceEmail(
  clientEmail: string, 
  clientName: string, 
  pdfBuffer: Buffer, 
  invoiceNumber: string
): Promise<void> {
  const apiKey = process.env.PLUNK_SECRET_API_KEY || process.env.PLUNK_PUBLIC_API_KEY; 
  if (!apiKey) {
    throw new Error("PLUNK_API_KEY is not set in environment");
  }

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <p>Hallo ${clientName},</p>
      <p>anbei erhalten Sie Ihre E-Rechnung <strong>${invoiceNumber}</strong> im ZUGFeRD-Format als Dateianhang.</p>
      <p style="margin-top: 20px;">Vielen Dank für die gute Zusammenarbeit!</p>
    </div>
  `;

  // Convert Buffer to Base64 for the Plunk API Attachment
  const pdfBase64 = pdfBuffer.toString('base64');

  const response = await fetch("https://api.useplunk.com/v1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      to: clientEmail,
      subject: `Ihre E-Rechnung ${invoiceNumber}`,
      body: htmlBody,
      attachments: [
        {
          name: `${invoiceNumber}.pdf`,
          type: "application/pdf",
          data: pdfBase64
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send email via Plunk: ${response.status} - ${errorText}`);
  }
}
