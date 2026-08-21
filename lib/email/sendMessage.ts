import { sendPlunkEmail, textToHtml } from '../email/plunk';

/**
 * Sends an email with a PDF attachment via Plunk.
 * The PDF is downloaded from the provided (signed) URL first.
 */
export async function sendEmailWithAttachment(
  to: string,
  subject: string,
  text: string,
  pdfUrl: string,
  filename: string
) {
  try {
    const fileRes = await fetch(pdfUrl);
    if (!fileRes.ok) {
      console.error('Failed to download PDF for email attachment');
      return;
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await sendPlunkEmail({
      to,
      subject,
      body: textToHtml(text),
      from: process.env.MAIL_FROM_INVOICES || 'invoices@futrdesk.com',
      attachments: [
        {
          filename,
          content: buffer.toString('base64'),
          contentType: 'application/pdf'
        }
      ]
    });
  } catch (err) {
    console.error('Error sending email with attachment:', err);
  }
}

export async function sendEmailText(to: string, subject: string, text: string) {
  await sendPlunkEmail({
    to,
    subject,
    body: textToHtml(text),
    from: process.env.MAIL_FROM_ALERTS || 'alerts@futrdesk.com'
  });
}
