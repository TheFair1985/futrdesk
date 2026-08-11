import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processIncomingDocument } from '../../../../services/invoicePipeline';

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Plunk Inbound Email Payload Structure
    const senderEmail = body.from;
    const attachments = body.attachments || [];

    // Authentication Gateway
    const { data: user } = await supabase.from('users').select('id').eq('email', senderEmail).single();
    if (!user) {
      console.warn(`Auth failed for email ${senderEmail}`);
      return NextResponse.json({ status: 'Ignored' }, { status: 200 });
    }

    if (attachments.length > 0) {
      const file = attachments[0]; 
      
      // Fire & Forget
      (async () => {
        try {
          // Plunk delivers attachment content as a Base64 string in 'content'
          const base64Content = file.content;
          const rawBuffer = Buffer.from(base64Content, 'base64');
          
          await processIncomingDocument(rawBuffer, user.id, 'email', senderEmail);
        } catch (e) {
          console.error("Email Webhook Pipeline Error:", e);
        }
      })();
    }

    return NextResponse.json({ status: 'Event received' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ status: 'Error' }, { status: 200 });
  }
}
