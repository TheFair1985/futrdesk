import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_PROJECT_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY!;
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

export async function uploadInvoicePDF(userId: string, invoiceNumber: string, pdfBuffer: Buffer): Promise<string> {
  const filePath = `${userId}/${invoiceNumber}.pdf`;
  const db = getSupabase();

  // Upload the file to the 'zugferd_invoices' bucket
  const { error: uploadError } = await db.storage
    .from('zugferd_invoices')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true // allow overwrite in case of re-generation
    });

  if (uploadError) {
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  // Generate a signed URL valid for 30 days
  const { data: signedUrlData, error: signedUrlError } = await db.storage
    .from('zugferd_invoices')
    .createSignedUrl(filePath, 60 * 60 * 24 * 30);

  if (signedUrlError || !signedUrlData) {
    throw new Error(`Failed to generate signed URL: ${signedUrlError?.message}`);
  }

  return signedUrlData.signedUrl;
}

export async function createInvoiceRecord(userId: string, invoiceNumber: string, pdfUrl: string): Promise<void> {
  const db = getSupabase();
  const { error } = await db
    .from('invoices')
    .insert([
      {
        user_id: userId,
        invoice_number: invoiceNumber,
        pdf_url: pdfUrl,
        status: 'sent'
      }
    ]);

  if (error) {
    // Postgres unique constraint violation usually has code '23505'
    if (error.code === '23505') {
      console.warn(`Invoice ${invoiceNumber} already exists in database.`);
    } else {
      throw new Error(`Failed to create invoice record: ${error.message}`);
    }
  }
}
