import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramText, sendTelegramDocument } from '../../../../lib/telegram/sendMessage';
import { getTelegramMediaAndUpload } from '../../../../lib/telegram/getMedia';
import { extractInvoice } from '../../../../lib/ai/extractInvoice';
import { generateZugferdPdf } from '../../../../lib/zugferd/generatePdf';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body.message;
    if (!message) return new NextResponse('OK', { status: 200 });

    const chatId = message.chat.id.toString();
    const textBody = message.text;
    const document = message.document;
    const photo = message.photo;

    const supabaseAdmin = getSupabaseAdmin();

    if (textBody) {
      const magicCodeRegex = /^FUTR-[A-Z0-9]{4}$/i;
      const match = textBody.trim().match(magicCodeRegex);

      if (match) {
        const magicCode = match[0].toUpperCase();
        // Coupling logic
        const { data: channel, error: searchError } = await (supabaseAdmin.from('channels') as any)
          .select('id, user_id, connection_status')
          .eq('magic_code', magicCode)
          .eq('connection_status', 'pending')
          .single();

        if (!searchError && channel) {
          await (supabaseAdmin.from('channels') as any).update({
            telegram_chat_id: chatId,
            connection_status: 'active'
          }).eq('id', channel.id);
          
          await sendTelegramText(chatId, "✅ Kopplung erfolgreich! Futrdesk ist jetzt mit deinem Account verbunden. Schick mir einfach ein Foto deiner ersten Rechnung oder Quittung, um das System zu testen.");
        }
      }
    } else if (document || photo) {
      const fileId = document ? document.file_id : photo[photo.length - 1].file_id;
      
      const { data: channel } = await (supabaseAdmin.from('channels') as any)
        .select('user_id')
        .eq('telegram_chat_id', chatId)
        .eq('connection_status', 'active')
        .single();
        
      if (channel && channel.user_id) {
        const mediaResult = await getTelegramMediaAndUpload(fileId, channel.user_id);
        if (mediaResult) {
          const { data: insertData } = await (supabaseAdmin.from('invoices') as any).insert({
            user_id: channel.user_id,
            vendor_name: 'Wird analysiert...',
            net_amount: 0,
            gross_amount: 0,
            pdf_storage_path: mediaResult.filePath,
            status: 'processing'
          }).select('id');
          
          if (insertData && insertData.length > 0) {
            await sendTelegramText(chatId, "Dokument empfangen. Unsere KI analysiert die Daten...");
            processTelegramInvoiceAsync(insertData[0].id, mediaResult.filePath, chatId).catch(console.error);
          }
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return new NextResponse('OK', { status: 200 });
  }
}

async function processTelegramInvoiceAsync(invoiceId: string, filePath: string, chatId: string) {
  const result = await extractInvoice(filePath);
  const supabaseAdmin = getSupabaseAdmin();
  
  if (result) {
    const needsFix = result.confidence_score < 80 || result.gross_amount === 0 || result.net_amount === 0 || !result.vendor_name;
    const status = needsFix ? 'needs_fix' : 'completed';
    
    await (supabaseAdmin.from('invoices') as any).update({
      vendor_name: result.vendor_name,
      net_amount: result.net_amount,
      gross_amount: result.gross_amount,
      status: status
    }).eq('id', invoiceId);
    
    if (needsFix) {
      await sendTelegramText(chatId, `Ich konnte einen Wert nicht eindeutig lesen. Handelt es sich um ${result.gross_amount.toFixed(2).replace('.', ',')} €?`);
    } else {
      try {
        const pdfBytes = await generateZugferdPdf(result, invoiceId);
        const pdfStoragePath = `zugferd/${invoiceId}.pdf`;
        await supabaseAdmin.storage.from('invoices').upload(pdfStoragePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
        
        await (supabaseAdmin.from('invoices') as any).update({ pdf_url: pdfStoragePath }).eq('id', invoiceId);
        const { data: signedUrlData } = await supabaseAdmin.storage.from('invoices').createSignedUrl(pdfStoragePath, 3600);
        
        if (signedUrlData?.signedUrl) {
          await sendTelegramDocument(chatId, signedUrlData.signedUrl, "Deine ZUGFeRD-Rechnung ist bereit. Hier ist das offizielle PDF/A-3.");
        }
      } catch (err) {
        console.error('Error generating ZUGFeRD PDF:', err);
        await sendTelegramText(chatId, "Die Rechnung wurde erfasst, aber beim Generieren des ZUGFeRD-PDFs gab es einen Fehler.");
      }
    }
  } else {
    await (supabaseAdmin.from('invoices') as any).update({ status: 'failed' }).eq('id', invoiceId);
    await sendTelegramText(chatId, "Bei der Analyse ist ein Fehler aufgetreten. Bitte lade das Dokument erneut hoch oder korrigiere es manuell.");
  }
}
