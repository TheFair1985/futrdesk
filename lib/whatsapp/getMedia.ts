import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY || ''
);

export async function getMediaAndUploadToSupabase(mediaId: string, mimeType: string, userId: string): Promise<string | null> {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('WhatsApp API credentials are missing in environment variables.');
      return null;
    }

    // A. Schritt 1: URL Resolution
    const urlRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!urlRes.ok) {
      console.error('Failed to get media URL from Meta:', await urlRes.text());
      return null;
    }
    
    const urlData = await urlRes.json();
    if (!urlData.url) {
      console.error('No URL returned from Meta for media ID:', mediaId);
      return null;
    }

    // B. Schritt 2: Binary Fetch & Storage Upload
    const mediaRes = await fetch(urlData.url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!mediaRes.ok) {
      console.error('Failed to download binary data from Meta URL');
      return null;
    }
    
    const arrayBuffer = await mediaRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Bestimme Dateiendung anhand des MIME-Types
    const ext = mimeType.includes('pdf') ? 'pdf' : mimeType.includes('png') ? 'png' : 'jpg';
    const filePath = `${userId}/${Date.now()}_${mediaId}.${ext}`;

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.storage
      .from('invoices')
      .upload(filePath, buffer, {
        contentType: mimeType,
      });

    if (error) {
      console.error('Supabase Upload failed:', error);
      return null;
    }

    console.log(`Media uploaded successfully to path: ${filePath}`);
    return filePath;

  } catch (error) {
    console.error('Error fetching/uploading media from WhatsApp:', error);
    return null;
  }
}
