import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ArchiveClient from "./ArchiveClient";

export const revalidate = 0;

export default async function ArchivePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL)!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() }
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  let realInvoices = [];
  if (invoices) {
    realInvoices = await Promise.all(invoices.map(async (inv) => {
      let pdfDownloadUrl = null;
      let xmlDownloadUrl = null;

      const pdfPath = inv.file_path;
      const xmlPath = pdfPath ? pdfPath.replace(/\.pdf$/i, '.xml') : null;

      if (pdfPath) {
        const { data } = await supabase.storage.from('invoices').createSignedUrl(pdfPath, 3600);
        pdfDownloadUrl = data?.signedUrl || null;
      }
      if (xmlPath) {
        const { data } = await supabase.storage.from('invoices').createSignedUrl(xmlPath, 3600);
        xmlDownloadUrl = data?.signedUrl || null;
      }

      return { 
        ...inv, 
        pdfDownloadUrl, 
        xmlDownloadUrl,
        // Provide safe defaults for UI components that expect region data (mocking the region if missing to avoid UI crash)
        region_name: inv.region_name || 'Unbekannt',
        zip_code: inv.zip_code || '00000',
        lat: inv.lat || 0,
        lng: inv.lng || 0
      };
    }));
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <ArchiveClient initialInvoices={realInvoices} />
    </div>
  );
}
