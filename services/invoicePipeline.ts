import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { extractTextFromImage, structureInvoiceData } from '../utils/groq';
import { generateZugferdPDF } from '../utils/pdf';
import { uploadInvoicePDF, createInvoiceRecord } from '../utils/database';
import { sendInvoiceEmail } from '../utils/plunk';

let supabase: SupabaseClient;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_PROJECT_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY!;
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

// Helper: Omnichannel Message Delivery
async function sendNotification(channel: 'whatsapp' | 'telegram' | 'email', chatId: string, text: string) {
  if (channel === 'whatsapp') {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID || 'default_id';
    await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: chatId, type: 'text', text: { body: text } })
    });
  } else if (channel === 'telegram') {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
  } else if (channel === 'email') {
    const apiKey = process.env.PLUNK_SECRET_API_KEY || process.env.PLUNK_PUBLIC_API_KEY;
    await fetch("https://api.useplunk.com/v1/send", {
      method: "POST",
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ to: chatId, subject: 'Update zu Ihrer Rechnung', body: `<p>${text}</p>` })
    });
  }
}

// Helper: Omnichannel Approval Request Delivery
async function sendApprovalRequest(channel: 'whatsapp' | 'telegram' | 'email', chatId: string, text: string, userId: string) {
  if (channel === 'whatsapp') {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID || 'default_id';
    await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: chatId,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: text },
          action: {
            buttons: [
              { type: 'reply', reply: { id: `APPROVE`, title: '✅ Freigeben' } },
              { type: 'reply', reply: { id: `REJECT`, title: '❌ Abbrechen' } }
            ]
          }
        }
      })
    });
  } else if (channel === 'telegram') {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Freigeben', callback_data: `APPROVE` },
            { text: '❌ Abbrechen', callback_data: `REJECT` }
          ]]
        }
      })
    });
  } else if (channel === 'email') {
    const apiKey = process.env.PLUNK_SECRET_API_KEY || process.env.PLUNK_PUBLIC_API_KEY;
    const approveUrl = `${process.env.APP_URL || 'https://futrdesk.com'}/api/approve?user=${userId}&action=APPROVE`;
    const rejectUrl = `${process.env.APP_URL || 'https://futrdesk.com'}/api/approve?user=${userId}&action=REJECT`;
    
    const htmlBody = `
      <div style="font-family: sans-serif;">
        <p>${text.replace(/\n/g, '<br>')}</p>
        <br>
        <a href="${approveUrl}" style="background-color: green; color: white; padding: 10px; text-decoration: none; border-radius: 5px;">✅ Freigeben</a>
        &nbsp;&nbsp;&nbsp;
        <a href="${rejectUrl}" style="background-color: red; color: white; padding: 10px; text-decoration: none; border-radius: 5px;">❌ Abbrechen</a>
      </div>
    `;
    
    await fetch("https://api.useplunk.com/v1/send", {
      method: "POST",
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ to: chatId, subject: 'Bitte Rechnung freigeben', body: htmlBody })
    });
  }
}

export async function processIncomingDocument(fileBuffer: Buffer, userId: string, channel: 'whatsapp' | 'telegram' | 'email', chatId: string) {
  const db = getSupabase();
  try {
    // 1. Archivierung Original
    const rawFileName = `${userId}/${Date.now()}_original.jpg`;
    await db.storage.from('raw_documents').upload(rawFileName, fileBuffer, { contentType: 'application/octet-stream' });

    // 2. KI Extraktion & Strukturierung
    const base64Content = fileBuffer.toString('base64');
    const extractedText = await extractTextFromImage(base64Content);
    const invoiceJson = await structureInvoiceData(extractedText);

    // 3. Draft JSON persistieren (inkl. Metadaten)
    const draftData = {
      channel,
      chatId,
      invoiceData: invoiceJson
    };
    await db.storage.from('raw_documents').upload(`drafts/${userId}/temp.json`, JSON.stringify(draftData), { contentType: 'application/json', upsert: true });

    // 4. Omnichannel Freigabe-Anfrage
    const previewText = `Neue Rechnung erfasst!\n\nKunde: ${invoiceJson.client_name}\nNetto: ${invoiceJson.net_amount} EUR\nMwSt: ${invoiceJson.vat_amount} EUR\nBrutto: ${invoiceJson.gross_amount} EUR\n\nSoll die ZUGFeRD-Rechnung generiert und versendet werden?`;
    await sendApprovalRequest(channel, chatId, previewText, userId);
  } catch (e: any) {
    console.error("Pipeline Error:", e);
    await sendNotification(channel, chatId, `Fehler bei der Dokumentenverarbeitung: ${e.message}`);
  }
}

export async function executeApproval(userId: string, isApproved: boolean) {
  const db = getSupabase();
  let draftData;
  try {
    const { data: draftFile } = await db.storage.from('raw_documents').download(`drafts/${userId}/temp.json`);
    if (!draftFile) throw new Error("Kein ausstehender Entwurf gefunden.");
    draftData = JSON.parse(await draftFile.text());
  } catch (e) {
    console.error("Failed to load draft:", e);
    return;
  }

  const { channel, chatId, invoiceData } = draftData;

  if (!isApproved) {
    await sendNotification(channel, chatId, 'Vorgang abgebrochen. Die Rechnung wurde verworfen.');
    await db.storage.from('raw_documents').remove([`drafts/${userId}/temp.json`]);
    return;
  }

  try {
    // 1. Generierung und Persistenz
    const invoiceNumber = `FD-${Date.now()}`;
    const pdfBuffer = await generateZugferdPDF(invoiceData);
    
    const pdfUrl = await uploadInvoicePDF(userId, invoiceNumber, pdfBuffer);
    await createInvoiceRecord(userId, invoiceNumber, pdfUrl);
    
    // 2. Email an Endkunden versenden (Im Demofall senden wir es an die User-Mail)
    const { data: user } = await db.from('users').select('email').eq('id', userId).single();
    const customerEmail = user?.email || 'kunde@beispiel.de'; 
    await sendInvoiceEmail(customerEmail, invoiceData.client_name, pdfBuffer, invoiceNumber);
    
    // 3. Bestätigung an den User auf dem Ursprungskanal
    await sendNotification(channel, chatId, `Erfolgreich versendet! Die ZUGFeRD-Rechnung ${invoiceNumber} wurde archiviert und dem Kunden zugestellt.`);
    
    // 4. Draft bereinigen
    await db.storage.from('raw_documents').remove([`drafts/${userId}/temp.json`]);
  } catch (e: any) {
    console.error("Approval Execution Error:", e);
    await sendNotification(channel, chatId, `Fehler bei der Rechnungsgenerierung: ${e.message}`);
  }
}
