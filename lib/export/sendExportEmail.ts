export async function sendExportZipEmail(to: string, zipBuffer: Buffer, month: string) {
  // Using Resend API for sending the ZIP bundle
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not defined.');
    return;
  }
  
  try {
    const response = await fetch('https://api.api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'export@futrdesk.com', // Must be a verified domain in Resend
        to: to,
        subject: `Futrdesk Buchhaltungsexport: ${month}`,
        text: `Hallo,\n\nanbei befindet sich der automatisierte Buchhaltungsexport für ${month}. Das ZIP-Archiv enthält alle gesammelten ZUGFeRD PDF/A-3 Rechnungen sowie eine zusammenfassende CSV-Datei.\n\nViele Grüße,\nDein Futrdesk-System`,
        attachments: [{
          filename: `Export_${month.replace(' ', '_')}.zip`,
          content: zipBuffer.toString('base64')
        }]
      })
    });
    
    if (!response.ok) {
      const err = await response.json();
      console.error('Failed to send ZIP export email:', err);
    } else {
      console.log(`ZIP Export email sent successfully to ${to}`);
    }
  } catch (err) {
    console.error('Error sending ZIP export email:', err);
  }
}
