import { sendPlunkEmail } from '../email/plunk';

export async function sendExportZipEmail(to: string, zipBuffer: Buffer, month: string) {
  const success = await sendPlunkEmail({
    to,
    subject: `Futrdesk Buchhaltungsexport: ${month}`,
    body: `<p>Hallo,</p>
<p>anbei befindet sich der automatisierte Buchhaltungsexport für <strong>${month}</strong>.</p>
<p>Das ZIP-Archiv enthält alle gesammelten ZUGFeRD PDF/A-3 Rechnungen sowie eine zusammenfassende CSV-Datei.</p>
<p>Viele Grüße,<br>Dein Futrdesk-System</p>`,
    from: process.env.MAIL_FROM_EXPORT || 'export@futrdesk.com',
    attachments: [
      {
        filename: `Export_${month.replace(' ', '_')}.zip`,
        content: zipBuffer.toString('base64'),
        contentType: 'application/zip'
      }
    ],
    idempotencyKey: `export-${month}-${to}`
  });

  if (success) {
    console.log(`ZIP export email sent successfully to ${to}`);
  }
}
