import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { downloadWhatsAppImage } from '../../../../utils/whatsapp';
import { processIncomingDocument, executeApproval } from '../../../../services/invoicePipeline';

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('hub.mode') === 'subscribe' && searchParams.get('hub.verify_token') === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(searchParams.get('hub.challenge'), { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (value && value.messages && value.messages.length > 0) {
            const message = value.messages[0];
            const senderPhone = message.from;

            // Authentication Gateway
            const { data: user } = await supabase.from('users').select('id').eq('phone_number', senderPhone).single();
            if (!user) return NextResponse.json({ status: 'Ignored' }, { status: 200 });

            // Fire & Forget for Vercel Timeouts
            (async () => {
              try {
                if (message.type === 'image') {
                  const mediaId = message.image.id;
                  const base64DataUri = await downloadWhatsAppImage(mediaId);
                  const rawBuffer = Buffer.from(base64DataUri.split(',')[1], 'base64');
                  
                  await processIncomingDocument(rawBuffer, user.id, 'whatsapp', senderPhone);
                } 
                else if (message.type === 'interactive') {
                  const payload = message.interactive.button_reply.id; // APPROVE or REJECT
                  if (payload === 'APPROVE' || payload === 'REJECT') {
                    await executeApproval(user.id, payload === 'APPROVE');
                  }
                }
              } catch (e) {
                console.error("WhatsApp Webhook Pipeline Error:", e);
              }
            })();
          }
        }
      }
    }
    return NextResponse.json({ status: 'Event received' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: 'Error' }, { status: 200 });
  }
}
