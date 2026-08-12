import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY || ''
);

export async function getTelegramMediaAndUpload(fileId: string, userId: string): Promise<{filePath: string, mimeType: string} | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  
  try {
    // 1. Get file path from Telegram
    const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    if (!fileData.ok) return null;
    
    const tgFilePath = fileData.result.file_path;
    const mimeType = tgFilePath.endsWith('.pdf') ? 'application/pdf' : tgFilePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const ext = tgFilePath.split('.').pop();
    
    // 2. Download file buffer
    const mediaRes = await fetch(`https://api.telegram.org/file/bot${token}/${tgFilePath}`);
    const arrayBuffer = await mediaRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 3. Upload to Supabase
    const filePath = `${userId}/${Date.now()}_${fileId}.${ext}`;
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.storage.from('invoices').upload(filePath, buffer, {
      contentType: mimeType,
    });
    
    if (error) {
      console.error('Failed to upload Telegram media to Supabase:', error);
      return null;
    }
    
    return { filePath, mimeType };
  } catch (error) {
    console.error('Error fetching Telegram media:', error);
    return null;
  }
}
