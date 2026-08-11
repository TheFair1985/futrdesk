"use client";

import { Download, Code, Save } from "lucide-react";

const dummyInvoices = [
  {
    id: "INV-2026-084",
    date: "11.08.2026",
    customer: "Spedition Müller GmbH",
    net: "350.00 €",
    gross: "416.50 €",
    status: "ZUGFeRD Validiert",
  },
  {
    id: "INV-2026-083",
    date: "09.08.2026",
    customer: "Baustoffe Meyer KG",
    net: "1,200.00 €",
    gross: "1,428.00 €",
    status: "ZUGFeRD Validiert",
  },
  {
    id: "INV-2026-082",
    date: "02.08.2026",
    customer: "Elektro Schmidt",
    net: "85.50 €",
    gross: "101.75 €",
    status: "ZUGFeRD Validiert",
  }
];

export default function ArchivePage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      
      {/* HEADER */}
      <header className="flex flex-col gap-2 mb-2">
        <h1 className="text-3xl font-bold font-sans text-core tracking-tight">
          Das Archiv
        </h1>
        <p className="text-core/70 font-sans text-lg">
          Zentrale Dokumentenverwaltung und Export-Konfiguration.
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
                <th className="py-4 px-6 font-bold text-sm text-core font-sans">Kunde <span className="text-core/50 font-normal text-xs">(via Kundengedächtnis)</span></th>
                <th className="py-4 px-6 font-bold text-sm text-core font-sans text-right">Netto</th>
                <th className="py-4 px-6 font-bold text-sm text-core font-sans text-right">Brutto</th>
                <th className="py-4 px-6 font-bold text-sm text-core font-sans">Status</th>
                <th className="py-4 px-6 font-bold text-sm text-core font-sans text-center">Aktion</th>
              </tr>
            </thead>
            
            {/* Table Body */}
            <tbody>
              {dummyInvoices.map((inv) => (
                <tr 
                  key={inv.id} 
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-4 px-6 font-mono text-sm text-core/80 whitespace-nowrap">
                    {inv.date}
                  </td>
                  <td className="py-4 px-6 font-sans text-sm font-medium text-core">
                    {inv.customer}
                  </td>
                  <td className="py-4 px-6 font-mono text-sm text-core/80 text-right whitespace-nowrap">
                    {inv.net}
                  </td>
                  <td className="py-4 px-6 font-mono text-sm font-bold text-core text-right whitespace-nowrap">
                    {inv.gross}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 border border-green-200 bg-green-50 px-2.5 py-1 rounded text-[10px] font-bold text-green-700 uppercase tracking-widest whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      [{inv.status}]
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        title="PDF Herunterladen"
                        className="p-2 border border-[#bfc0c0] text-core/60 hover:text-action hover:border-action rounded bg-white transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        title="XML Struktur anzeigen"
                        className="p-2 border border-[#bfc0c0] text-core/60 hover:text-action hover:border-action rounded bg-white transition-colors"
                      >
                        <Code className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            
          </table>
        </div>
        
      </div>
      
    </div>
  );
}
