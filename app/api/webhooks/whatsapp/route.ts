import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppText } from '../../../../lib/whatsapp/sendMessage';

// Supabase Admin Client for bypassing RLS during webhook execution
const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY || ''
);

/**
 * A. Verifikation (GET Request)
 * Meta / WhatsApp Cloud API Webhook Verification
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK_VERIFIED');
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse('Forbidden', { status: 403 });
  }
}

/**
 * B. The Ingest Engine (POST Request)
 * WhatsApp Cloud API Incoming Message Handler
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if it's a WhatsApp status update or message
    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const message = body.entry[0].changes[0].value.messages[0];
        
        // Step 1: Extrahiere Absender-Nummer (from) und Text (body)
        const from = message.from; // Sender phone number
        const textBody = message.text?.body;

        if (textBody) {
          // Step 2: Regex Matching für den Magic Code (FUTR-XXXX)
          const magicCodeRegex = /^FUTR-[A-Z0-9]{4}$/i;
          const match = textBody.trim().match(magicCodeRegex);

          if (match) {
            const magicCode = match[0].toUpperCase();
            
            // C. Database Transaction (Supabase Service Role)
            // Step 3: Query
            const supabaseAdmin = getSupabaseAdmin();
            const { data: channel, error: searchError } = await supabaseAdmin
              .from('channels')
              .select('id, user_id, connection_status')
              .eq('magic_code', magicCode)
              .eq('connection_status', 'pending')
              .single();

            if (searchError || !channel) {
              console.log('Magic Code not found or already active.');
              // Step 5: Error Handling - return 200 OK
              return new NextResponse('OK', { status: 200 });
            }

            // Step 4: Update
            const { error: updateError } = await supabaseAdmin
              .from('channels')
              .update({
                phone_number: from,
                connection_status: 'active'
              })
              .eq('id', channel.id);

            if (updateError) {
              console.error('Failed to update channel:', updateError);
              return new NextResponse('OK', { status: 200 });
            }

            console.log(`Channel coupled successfully for user: ${channel.user_id}`);

            // [EPISODE 26] Trigger outgoing Meta API message
            await sendWhatsAppText(
              from,
              "✅ Kopplung erfolgreich! Futrdesk ist jetzt mit deinem Account verbunden. Schick mir einfach ein Foto deiner ersten Rechnung oder Quittung, um das System zu testen."
            );
          }
        }
      }
      
      // Return 200 OK to Meta for all processed requests
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    } else {
      return new NextResponse('Not Found', { status: 404 });
    }
  } catch (error) {
    console.error('Webhook Error:', error);
    // Step 5: Error Handling - return 200 OK to avoid blocking Meta retries
    return new NextResponse('Internal Server Error', { status: 200 });
  }
}
