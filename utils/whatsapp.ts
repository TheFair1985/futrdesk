export async function downloadWhatsAppImage(mediaId: string): Promise<string> {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) throw new Error("WHATSAPP_TOKEN is not set in environment");

  try {
    // Step 1: Request media URL metadata from Meta Graph API
    const metadataResponse = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!metadataResponse.ok) {
      const errText = await metadataResponse.text();
      throw new Error(`Failed to fetch media metadata (Status: ${metadataResponse.status}) - ${errText}`);
    }

    const metadata = await metadataResponse.json();
    const mediaUrl = metadata.url;
    const mimeType = metadata.mime_type || 'image/jpeg';

    if (!mediaUrl) {
      throw new Error("No URL found in media metadata response from Meta.");
    }

    // Step 2: Download binary data from the extracted URL
    const imageResponse = await fetch(mediaUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!imageResponse.ok) {
      const errText = await imageResponse.text();
      throw new Error(`Failed to download media binary (Status: ${imageResponse.status}) - ${errText}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    
    // Step 3: Convert binary Buffer to Base64 String
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    
    // Return complete Data-URI
    return `data:${mimeType};base64,${base64String}`;

  } catch (error: any) {
    throw new Error(`WhatsApp Media Download Error: ${error.message}`);
  }
}
