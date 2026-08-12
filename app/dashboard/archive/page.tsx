import { Download, Code, Save, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 0; // Disable static rendering for live data

export default async function ArchivePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Hole alle Rechnungen des (authentifizierten) Users, sortiert nach Datum
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  // Generiere Download-URLs (Signed URLs für Storage)
  const invoicesWithUrls = await Promise.all((invoices || []).map(async (inv: any) => {
    let pdfDownloadUrl = null;
    let xmlDownloadUrl = null;

    const pdfPath = inv.pdf_url || inv.pdf_storage_path;
    if (pdfPath) {
      const { data } = await supabase.storage.from('invoices').createSignedUrl(pdfPath, 3600);
      pdfDownloadUrl = data?.signedUrl || null;
    }

    const xmlPath = inv.xml_storage_path;
    if (xmlPath) {
      const { data } = await supabase.storage.from('invoices').createSignedUrl(xmlPath, 3600);
      xmlDownloadUrl = data?.signedUrl || null;
    }

    return { ...inv, pdfDownloadUrl, xmlDownloadUrl };
  }));

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'processing') {
      return (
        <span className="inline-flex items-center gap-1.5 border border-yellow-200 bg-yellow-50 px-2.5 py-1 rounded text-[10px] font-bold text-yellow-700 uppercase tracking-widest whitespace-nowrap">
          <Clock className="w-3 h-3 shrink-0" />
          [ Analysiert... ]
        </span>
      );
    }
    if (status === 'needs_fix') {
      return (
        <span className="inline-flex items-center gap-1.5 border border-orange-200 bg-orange-50 px-2.5 py-1 rounded text-[10px] font-bold text-orange-700 uppercase tracking-widest whitespace-nowrap">
          <AlertCircle className="w-3 h-3 shrink-0" />
          [ Korrektur nötig ]
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 border border-green-200 bg-green-50 px-2.5 py-1 rounded text-[10px] font-bold text-green-700 uppercase tracking-widest whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          [ ZUGFeRD Validiert ]
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 border border-gray-200 bg-gray-50 px-2.5 py-1 rounded text-[10px] font-bold text-gray-700 uppercase tracking-widest whitespace-nowrap">
        [{status || 'Fehler'}]
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      
      {/* HEADER */}
      <header className="flex flex-col gap-2 mb-2">
        <h1 className="text-3xl font-bold font-sans text-core tracking-tight">
          Das Archiv
        </h1>
        <p className="text-core/70 font-sans text-lg">
          Zentrale Dokumentenverwaltung und Live-Extraktionsstatus.
        </p>
      </header>

      {/* EXPORT CONFIGURATION */}
      <div className="bg-gray-50 border border-[#bfc0c0] p-6 rounded-xl shadow-sm">
        <h2 className="font-sans font-bold text-core mb-4">
          Export-Routing (Automatischer Datenexport)
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4 mb-3">
          <input 
            type="email" 
            placeholder="z.B. kanzlei@steuerberater.de" 
            className="flex-1 border border-[#bfc0c0] bg-white px-4 py-3 rounded-lg font-mono text-sm focus:outline-none focus:border-action focus:ring-1 focus:ring-action"
          />
          <button className="bg-[#2d3142] text-white hover:bg-[#1a1c23] transition-colors font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Route speichern
          </button>
        </div>
        
        <p className="text-xs text-core/60 leading-relaxed font-sans max-w-2xl">
          An diese Adresse wird am Monatsende (oder bei Speicherlimit-Erreichung) automatisch das gebündelte ZIP-Archiv (PDFs & CSV) gesendet.
        </p>
      </div>

      {/* THE VAULT (DATA TABLE) */}
      <div className="bg-white border border-[#bfc0c0] rounded-xl shadow-sm overflow-hidden">
        
        {/* Scrollable Container for Mobile */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            
            {/* Table Head */}
            <thead className="bg-gray-100 border-b border-[#bfc0c0]">
              <tr>
                <th className="py-4 px-6 font-bold text-sm text-core font-sans">Datum</th>
                <th className="py-4 px-6 font-bold text-sm text-core font-sans">Kunde / Vendor</th>
                <th className="py-4 px-6 font-bold text-sm text-core font-sans text-right">Netto</th>
                <th className="py-4 px-6 font-bold text-sm text-core font-sans text-right">Brutto</th>
                <th className="py-4 px-6 font-bold text-sm text-core font-sans">Status</th>
                <th className="py-4 px-6 font-bold text-sm text-core font-sans text-center">Aktion</th>
              </tr>
            </thead>
            
            {/* Table Body */}
            <tbody>
              {invoicesWithUrls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-core/50 font-mono text-sm">
                    Keine Rechnungen im Archiv gefunden.
                  </td>
                </tr>
              ) : (
                invoicesWithUrls.map((inv) => (
                  <tr 
                    key={inv.id} 
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono text-sm text-core/80 whitespace-nowrap">
                      {formatDate(inv.created_at)}
                    </td>
                    <td className="py-4 px-6 font-sans text-sm font-medium text-core">
                      {inv.vendor_name || 'Unbekannt'}
                    </td>
                    <td className="py-4 px-6 font-mono text-sm text-core/80 text-right whitespace-nowrap">
                      {(inv.net_amount || 0).toFixed(2)} €
                    </td>
                    <td className="py-4 px-6 font-mono text-sm font-bold text-core text-right whitespace-nowrap">
                      {(inv.gross_amount || 0).toFixed(2)} €
                    </td>
                    <td className="py-4 px-6">
                      {renderStatusBadge(inv.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        {inv.pdfDownloadUrl ? (
                          <a 
                            href={inv.pdfDownloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="PDF Herunterladen"
                            className="p-2 border border-[#bfc0c0] text-core/60 hover:text-action hover:border-action rounded bg-white transition-colors block"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        ) : (
                          <button 
                            disabled
                            title="Kein PDF verfügbar"
                            className="p-2 border border-gray-200 text-gray-300 rounded bg-gray-50 cursor-not-allowed"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Fallback to PDF URL if standalone XML is missing (ZUGFeRD embeds XML in PDF) */}
                        <a 
                          href={inv.xmlDownloadUrl || inv.pdfDownloadUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="XML Struktur herunterladen (Eingebettet in PDF/A-3)"
                          className={`p-2 border border-[#bfc0c0] rounded bg-white transition-colors block ${(!inv.xmlDownloadUrl && !inv.pdfDownloadUrl) ? 'text-gray-300 border-gray-200 bg-gray-50 cursor-not-allowed' : 'text-core/60 hover:text-action hover:border-action'}`}
                        >
                          <Code className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            
          </table>
        </div>
        
      </div>
      
    </div>
  );
}
