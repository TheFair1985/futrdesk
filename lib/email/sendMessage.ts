export async function sendEmailWithAttachment(to: string, subject: string, text: string, pdfUrl: string, filename: string) {
  // Using Resend API as an example for the mailer
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not defined.');
    return;
  }
  
  try {
    // Download pdf from Supabase public/signed url to attach it
    const fileRes = await fetch(pdfUrl);
    if (!fileRes.ok) {
      console.error('Failed to download PDF for email attachment');
      return;
    }
    
    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'invoices@futrdesk.com', // MUST be verified in Resend
        to: to,
        subject: subject,
        text: text,
        attachments: [{
          filename: filename,
          content: buffer.toString('base64')
        }]
      })
    });
    
    if (!response.ok) {
      const err = await response.json();
      console.error('Failed to send email:', err);
    } else {
      console.log(`Email sent successfully to ${to}`);
    }
  } catch (err) {
    console.error('Error sending email:', err);
  }
}
