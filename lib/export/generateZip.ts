import JSZip from 'jszip';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY || ''
);

export async function generateExportZip(userId: string): Promise<Buffer | null> {
  const supabase = getSupabaseAdmin();
  
  // 1. Hole alle Rechnungen des Users
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: true });
    
  if (error || !invoices || invoices.length === 0) {
    console.log(`No completed invoices found for user: ${userId}`);
    return null;
  }
  
  const zip = new JSZip();
  let csvContent = 'Rechnungs-ID,Datum,Verkäufer,Netto,Brutto,Steuer\n';
  
  // 2. Iteriere über Rechnungen und bilde ZIP + CSV
  for (const inv of invoices) {
    const pdfPath = inv.pdf_url || inv.pdf_storage_path;
    
    // Fallback: If no PDF is linked, skip adding PDF but add to CSV maybe?
    if (pdfPath) {
      // Download PDF directly from Supabase using signed URL to ensure access
      const { data: signedUrlData } = await supabase.storage.from('invoices').createSignedUrl(pdfPath, 60);
      if (signedUrlData?.signedUrl) {
        try {
          const res = await fetch(signedUrlData.signedUrl);
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            // Append PDF to ZIP
            const safeVendorName = (inv.vendor_name || 'Unbekannt').replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `Rechnung_${inv.id}_${safeVendorName}.pdf`;
            zip.file(`PDFs/${filename}`, arrayBuffer);
          }
        } catch (err) {
          console.error(`Failed to fetch PDF for invoice ${inv.id}`, err);
        }
      }
    }
    
    // Add to CSV
    const date = inv.created_at ? new Date(inv.created_at).toISOString().split('T')[0] : '';
    const vendor = (inv.vendor_name || 'Unbekannt').replace(/,/g, ''); // Remove commas for CSV
    const net = (inv.net_amount || 0).toFixed(2);
    const gross = (inv.gross_amount || 0).toFixed(2);
    const tax = inv.tax_rate || '';
    
    csvContent += `${inv.id},${date},${vendor},${net},${gross},${tax}\n`;
  }
  
  // 3. Füge summary.csv hinzu
  zip.file('summary.csv', csvContent);
  
  // 4. Erzeuge ZIP-Buffer
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return zipBuffer;
}
