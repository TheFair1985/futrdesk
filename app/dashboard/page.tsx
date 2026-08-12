"use client";

import { Download, RefreshCcw, HardDrive, Smartphone, Send, Mail } from "lucide-react";
import Link from "next/link";

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
          <h3 className="font-sans font-bold text-lg text-core mb-6">
            Aktive Ingest-Kanäle
          </h3>
          
          <div className="flex-1 flex flex-col gap-4">
            
            {/* WHATSAPP */}
            <div className="flex items-center gap-4 bg-gray-50 border border-shading/30 p-4 rounded-xl">
              <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center shadow-inner shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm font-bold text-core">+49 151 **** **</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-mono text-core/60 uppercase tracking-widest hidden sm:inline-block">Aktiv</span>
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              </div>
            </div>

            {/* TELEGRAM */}
            <div className="flex items-center gap-4 bg-gray-50 border border-shading/30 p-4 rounded-xl">
              <div className="w-10 h-10 bg-[#0088cc] rounded-full flex items-center justify-center shadow-inner shrink-0">
                <Send className="w-5 h-5 text-white -ml-0.5" />
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm font-bold text-core">@username</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-mono text-core/60 uppercase tracking-widest hidden sm:inline-block">Aktiv</span>
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              </div>
            </div>

            {/* EMAIL */}
            <div className="flex items-center gap-4 bg-gray-50 border border-shading/30 p-4 rounded-xl">
              <div className="w-10 h-10 bg-core rounded-full flex items-center justify-center shadow-inner shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-bold text-core truncate">u_abc123@inbound...</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-mono text-core/60 uppercase tracking-widest hidden sm:inline-block">Aktiv</span>
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              </div>
            </div>

          </div>
          
          <div className="mt-6 pt-6 border-t border-shading/30">
            <Link href="/dashboard/channels" className="flex items-center gap-2 text-sm font-bold text-core/70 hover:text-action transition-colors w-fit">
              <RefreshCcw className="w-4 h-4" />
              Kanäle verwalten
            </Link>
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
