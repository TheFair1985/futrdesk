import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processIncomingDocument, executeApproval } from '../../../../services/invoicePipeline';

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Handle Inline Keyboard Approvals
    if (body.callback_query) {
      const callback = body.callback_query;
      const chatId = callback.message.chat.id.toString();
      const payload = callback.data; // APPROVE or REJECT

      const { data: user } = await supabase.from('users').select('id').eq('telegram_chat_id', chatId).single();
      if (user) {
        // Fire & Forget
        executeApproval(user.id, payload === 'APPROVE').catch(console.error);
      }
      return NextResponse.json({ status: 'OK' }, { status: 200 });
    }

    // 2. Handle Incoming Image
    if (body.message) {
      const message = body.message;
      const chatId = message.chat.id.toString();

      // Authentication Gateway
      const { data: user } = await supabase.from('users').select('id').eq('telegram_chat_id', chatId).single();
      if (!user) return NextResponse.json({ status: 'Ignored' }, { status: 200 });

      if (message.photo && message.photo.length > 0) {
        const fileId = message.photo[message.photo.length - 1].file_id; // Get highest resolution

        // Fire & Forget
        (async () => {
          try {
            const token = process.env.TELEGRAM_BOT_TOKEN;
            // Get download path
            const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
            const fileData = await fileRes.json();
            const filePath = fileData.result.file_path;
            
            // Download binary
            const downloadRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
            const arrayBuffer = await downloadRes.arrayBuffer();
            const rawBuffer = Buffer.from(arrayBuffer);
            
            await processIncomingDocument(rawBuffer, user.id, 'telegram', chatId);
          } catch (e) {
            console.error("Telegram Webhook Pipeline Error:", e);
          }
        })();
      }
    }
    
    return NextResponse.json({ status: 'Event received' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: 'Error' }, { status: 200 });
  }
}
