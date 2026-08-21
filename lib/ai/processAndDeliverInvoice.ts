import { extractInvoice } from './extractInvoice';
import { generateZugferdPdf } from '../zugferd/generatePdf';
import { sendWhatsAppText, sendWhatsAppDocument } from '../whatsapp/sendMessage';
import { sendTelegramText, sendTelegramDocument } from '../telegram/sendMessage';
import { sendEmailWithAttachment, sendEmailText } from '../email/sendMessage';
import { getSupabaseAdmin } from '../supabase/admin';

export async function processAndDeliverInvoice(invoiceId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  
  // 1. Fetch invoice and channel details
  const { data: invoice } = await (supabaseAdmin.from('invoices') as any)
    .select('user_id, pdf_storage_path, users(email, alert_channel), channels(phone_number, telegram_chat_id, email_address)')
    .eq('id', invoiceId)
    .single();
    
  if (!invoice) return;

  const filePath = invoice.pdf_storage_path;
  const user = invoice.users;
  // Get active channel info (assuming single active channel row)
  const channel = Array.isArray(invoice.channels) ? invoice.channels[0] : invoice.channels;

  const result = await extractInvoice(filePath);
  
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
      const fixMsg = `Ich konnte einen Wert nicht eindeutig lesen. Handelt es sich um ${result.gross_amount.toFixed(2).replace('.', ',')} €?`;
      await routeMessage(channel, user, fixMsg);
    } else {
      try {
        const pdfBytes = await generateZugferdPdf(result, invoiceId);
        const pdfStoragePath = `zugferd/${invoiceId}.pdf`;
        await supabaseAdmin.storage.from('invoices').upload(pdfStoragePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
        
        await (supabaseAdmin.from('invoices') as any).update({ pdf_url: pdfStoragePath }).eq('id', invoiceId);
        const { data: signedUrlData } = await supabaseAdmin.storage.from('invoices').createSignedUrl(pdfStoragePath, 3600);
        
        if (signedUrlData?.signedUrl) {
          const successMsg = "Deine ZUGFeRD-Rechnung ist bereit. Hier ist das offizielle PDF/A-3.";
          await routeDocument(
            channel, 
            user, 
            signedUrlData.signedUrl, 
            `Rechnung_${result.vendor_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, 
            successMsg
          );
        }
      } catch (err) {
        console.error('Error generating ZUGFeRD PDF:', err);
        await routeMessage(channel, user, "Die Rechnung wurde erfasst, aber beim Generieren des ZUGFeRD-PDFs gab es einen Fehler.");
      }
    }
  } else {
    await (supabaseAdmin.from('invoices') as any).update({ status: 'failed' }).eq('id', invoiceId);
    await routeMessage(channel, user, "Bei der Analyse ist ein Fehler aufgetreten. Bitte lade das Dokument erneut hoch oder korrigiere es manuell.");
  }
}

async function routeMessage(channel: any, user: any, text: string) {
  if (user?.alert_channel === 'whatsapp' && channel?.phone_number) {
    return sendWhatsAppText(channel.phone_number, text);
  } else if (user?.alert_channel === 'telegram' && channel?.telegram_chat_id) {
    return sendTelegramText(channel.telegram_chat_id, text);
  }
  
  if (channel?.phone_number) return sendWhatsAppText(channel.phone_number, text);
  if (channel?.telegram_chat_id) return sendTelegramText(channel.telegram_chat_id, text);
  if (channel?.email_address) return sendEmailText(channel.email_address, "Futrdesk Update", text);
}

async function routeDocument(channel: any, user: any, url: string, filename: string, caption: string) {
  if (user?.alert_channel === 'whatsapp' && channel?.phone_number) {
    return sendWhatsAppDocument(channel.phone_number, url, filename, caption);
  } else if (user?.alert_channel === 'telegram' && channel?.telegram_chat_id) {
    return sendTelegramDocument(channel.telegram_chat_id, url, caption);
  }
  
  if (channel?.phone_number) return sendWhatsAppDocument(channel.phone_number, url, filename, caption);
  if (channel?.telegram_chat_id) return sendTelegramDocument(channel.telegram_chat_id, url, caption);
  if (channel?.email_address) return sendEmailWithAttachment(channel.email_address, "Deine ZUGFeRD Rechnung", caption, url, filename);
}
