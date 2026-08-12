import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractInvoice } from '../../../../lib/ai/extractInvoice';
import { generateZugferdPdf } from '../../../../lib/zugferd/generatePdf';
import { sendEmailWithAttachment } from '../../../../lib/email/sendMessage';
import { checkAndConsumeInvoice } from '../../../../lib/billing/usage';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY || ''
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Postmark format: From, Attachments array (Name, Content (base64), ContentType)
    const fromEmail = body.From;
    const attachments = body.Attachments;
    
    if (!fromEmail || !attachments || attachments.length === 0) {
      return new NextResponse('OK', { status: 200 });
    }
    
    const supabaseAdmin = getSupabaseAdmin();
    // Match User via Email in channels table
    const { data: channel } = await (supabaseAdmin.from('channels') as any).select('user_id').eq('email_address', fromEmail).single();
    
    if (channel && channel.user_id) {
      const isAllowed = await checkAndConsumeInvoice(channel.user_id);
      if (!isAllowed) {
        return new NextResponse('OK', { status: 200 });
      }

      // Process first attachment
      const attachment = attachments[0];
      const buffer = Buffer.from(attachment.Content, 'base64');
      const ext = attachment.Name.split('.').pop();
      const filePath = `${channel.user_id}/${Date.now()}_email_ingest.${ext}`;
      
      const { error } = await supabaseAdmin.storage.from('invoices').upload(filePath, buffer, {
        contentType: attachment.ContentType,
      });
      
      if (!error) {
        const { data: insertData } = await (supabaseAdmin.from('invoices') as any).insert({
          user_id: channel.user_id,
          vendor_name: 'Wird analysiert...',
          net_amount: 0,
          gross_amount: 0,
          pdf_storage_path: filePath,
          status: 'processing'
        }).select('id');
        
        if (insertData && insertData.length > 0) {
           processEmailInvoiceAsync(insertData[0].id, filePath, fromEmail).catch(console.error);
        }
      } else {
        console.error('Failed to upload email attachment to Supabase:', error);
      }
    } else {
      console.log(`No user found for email: ${fromEmail}`);
    }
    
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Email Webhook Error:', error);
    return new NextResponse('OK', { status: 200 });
  }
}

async function processEmailInvoiceAsync(invoiceId: string, filePath: string, fromEmail: string) {
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
    
    if (!needsFix) {
      try {
        const pdfBytes = await generateZugferdPdf(result, invoiceId);
        const pdfStoragePath = `zugferd/${invoiceId}.pdf`;
        await supabaseAdmin.storage.from('invoices').upload(pdfStoragePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
        
        await (supabaseAdmin.from('invoices') as any).update({ pdf_url: pdfStoragePath }).eq('id', invoiceId);
        const { data: signedUrlData } = await supabaseAdmin.storage.from('invoices').createSignedUrl(pdfStoragePath, 3600);
        
        if (signedUrlData?.signedUrl) {
          await sendEmailWithAttachment(
            fromEmail,
            `Deine ZUGFeRD-Rechnung: ${result.vendor_name}`,
            "Deine ZUGFeRD-Rechnung ist bereit. Hier ist das offizielle PDF/A-3 im Anhang.",
            signedUrlData.signedUrl,
            `Rechnung_${result.vendor_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
          );
        }
      } catch (err) {
        console.error('Error generating ZUGFeRD PDF for Email:', err);
      }
    }
  } else {
    await (supabaseAdmin.from('invoices') as any).update({ status: 'failed' }).eq('id', invoiceId);
  }
}
