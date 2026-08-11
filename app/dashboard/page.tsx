"use client";

import { Download, RefreshCcw, HardDrive } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-10">
      
      {/* STATUS HEADER */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center relative w-3 h-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
          <h1 className="font-mono text-sm font-bold uppercase tracking-widest text-core">
            System Status: Online
          </h1>
        </div>
        <h2 className="text-3xl font-bold font-sans text-core tracking-tight">
          Willkommen zurück. Dein Zero-UI Setup ist aktiv.
        </h2>
      </header>

      {/* 2-COLUMN BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD 1: CHANNEL CONNECTION */}
        <div className="bg-white/80 backdrop-blur-md border border-[#bfc0c0] p-8 rounded-2xl shadow-sm flex flex-col">
          <h3 className="font-sans font-bold text-lg text-core mb-8">
            Aktiver Ingest-Kanal
          </h3>
          
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="flex items-center gap-4 bg-gray-50 border border-shading/30 p-4 rounded-xl">
              {/* WhatsApp Mock Icon */}
              <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center shadow-inner shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
              </div>
              <div>
                <div className="font-mono text-lg font-bold text-core">+49 151 **** **</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-xs font-mono text-core/60 uppercase tracking-widest">Verbunden & Lauscht</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-shading/30">
            <button className="flex items-center gap-2 text-sm font-bold text-core/70 hover:text-action transition-colors">
              <RefreshCcw className="w-4 h-4" />
              Kanal wechseln / Neu koppeln
            </button>
          </div>
        </div>

        {/* CARD 2: STORAGE & AUTOMATISIERUNG */}
        <div className="bg-white/80 backdrop-blur-md border border-[#bfc0c0] p-8 rounded-2xl shadow-sm flex flex-col">
          <h3 className="font-mono font-bold text-lg text-core uppercase tracking-widest mb-8 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-action" />
            Speicher & Export
          </h3>
          
          <div className="flex-1 flex flex-col justify-center gap-3">
            <div className="flex justify-between items-end mb-1">
              <span className="font-mono text-xs text-core/60 uppercase">Auslastung</span>
              <span className="font-mono text-sm font-bold text-core">120 MB / 1.000 MB</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-action rounded-full transition-all duration-1000 ease-out" 
                style={{ width: "12%" }}
              />
            </div>
            
            <p className="text-sm text-core/80 mt-4 leading-relaxed font-sans">
              Bei Erreichen von 1 GB wird das Archiv automatisch als ZIP an <strong className="font-mono text-xs">buchhaltung@firma.de</strong> gesendet.
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-shading/30 flex justify-end">
            <button className="flex items-center gap-2 text-sm font-bold border border-shading text-core px-4 py-2 rounded-lg hover:bg-core hover:text-white transition-colors">
              <Download className="w-4 h-4" />
              Manueller Export (ZIP)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
