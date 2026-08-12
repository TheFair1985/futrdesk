import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppText, sendWhatsAppDocument } from '../../../../lib/whatsapp/sendMessage';
import { getMediaAndUploadToSupabase } from '../../../../lib/whatsapp/getMedia';
import { extractInvoice } from '../../../../lib/ai/extractInvoice';
import { generateZugferdPdf } from '../../../../lib/zugferd/generatePdf';

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
        const image = message.image;
        const document = message.document;

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
        } else if (image || document) {
          // EPISODE 27: Media Processing
          const mediaObj = image || document;
          const mediaId = mediaObj.id;
          const mimeType = mediaObj.mime_type;

          const supabaseAdmin = getSupabaseAdmin();
          
          // Nummern-Zuordnung: Finde User anhand der Absender-Nummer
          const { data: channel, error: channelErr } = await supabaseAdmin
            .from('channels')
            .select('user_id')
            .eq('phone_number', from)
            .eq('connection_status', 'active')
            .single();

          if (channel && channel.user_id) {
            // Pipeline-Trigger: Media Download & Storage Upload
            const filePath = await getMediaAndUploadToSupabase(mediaId, mimeType, channel.user_id);

            if (filePath) {
              // Initialer Datensatz in der invoices-Tabelle
              const { data: insertData, error: insertError } = await supabaseAdmin.from('invoices').insert({
                user_id: channel.user_id,
                vendor_name: 'Wird analysiert...',
                net_amount: 0,
                gross_amount: 0,
                pdf_storage_path: filePath,
                status: 'processing'
              }).select('id');

              if (!insertError && insertData && insertData.length > 0) {
                const invoiceId = insertData[0].id;
                // Bot-Antwort an User
                await sendWhatsAppText(
                  from, 
                  "Dokument empfangen. Unsere KI analysiert die Daten..."
                );
                
                // Pipeline-Kette: Starte KI-Extraktion
                processInvoiceAsync(invoiceId, filePath, from).catch(console.error);
              } else {
                console.error("Error creating invoice record:", insertError);
              }
            }
          } else {
            console.log(`No active channel found for phone number: ${from}`);
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

async function processInvoiceAsync(invoiceId: string, filePath: string, from: string) {
  const result = await extractInvoice(filePath);
  const supabaseAdmin = getSupabaseAdmin();
  
  if (result) {
    const needsFix = result.confidence_score < 80 || result.gross_amount === 0 || result.net_amount === 0 || !result.vendor_name;
    const status = needsFix ? 'needs_fix' : 'completed';
    
    // Update the invoice with extracted data
    // (Using any here since types/supabase.ts might be out of date with these new columns)
    await (supabaseAdmin.from('invoices') as any).update({
      vendor_name: result.vendor_name,
      net_amount: result.net_amount,
      gross_amount: result.gross_amount,
      status: status
    }).eq('id', invoiceId);
    
    if (needsFix) {
      await sendWhatsAppText(
        from, 
        `Ich konnte einen Wert nicht eindeutig lesen. Handelt es sich um ${result.gross_amount.toFixed(2).replace('.', ',')} €?`
      );
    } else {
      try {
        // ZUGFeRD PDF/A-3 generieren
        const pdfBytes = await generateZugferdPdf(result, invoiceId);
        
        // Storage Upload
        const pdfStoragePath = `zugferd/${invoiceId}.pdf`;
        await supabaseAdmin.storage.from('invoices').upload(pdfStoragePath, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        });
        
        // Update Datensatz mit PDF-Pfad
        await (supabaseAdmin.from('invoices') as any).update({
          pdf_url: pdfStoragePath
        }).eq('id', invoiceId);
        
        // Signed URL generieren
        const { data: signedUrlData } = await supabaseAdmin.storage.from('invoices').createSignedUrl(pdfStoragePath, 3600);
        
        if (signedUrlData?.signedUrl) {
          // WhatsApp Dokument Versand
          await sendWhatsAppDocument(
            from,
            signedUrlData.signedUrl,
            `Rechnung_${result.vendor_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
            "Deine ZUGFeRD-Rechnung ist bereit. Hier ist das offizielle PDF/A-3."
          );
        }
      } catch (err) {
        console.error('Error generating ZUGFeRD PDF:', err);
        await sendWhatsAppText(from, "Die Rechnung wurde erfasst, aber beim Generieren des ZUGFeRD-PDFs gab es einen Fehler.");
      }
    }
  } else {
    // Extraction failed
    await supabaseAdmin.from('invoices').update({
      status: 'failed'
    }).eq('id', invoiceId);
    
    await sendWhatsAppText(
      from, 
      "Bei der Analyse ist ein Fehler aufgetreten. Bitte lade das Dokument erneut hoch oder korrigiere es manuell."
    );
  }
}
