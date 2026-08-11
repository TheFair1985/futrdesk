/**
 * Utility to send WhatsApp text messages via Meta Graph API
 */
export async function sendWhatsAppText(to: string, text: string) {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      console.error('WhatsApp API credentials are missing in environment variables.');
      return;
    }

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: text,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send WhatsApp message:', JSON.stringify(errorData));
    } else {
      console.log(`WhatsApp message sent successfully to ${to}`);
    }
  } catch (error) {
    console.error('Error in sendWhatsAppText utility:', error);
    // We log the error but don't throw to prevent crashing the webhook execution
  }
}
