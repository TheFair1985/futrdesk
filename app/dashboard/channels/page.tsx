"use client";

import { Smartphone, QrCode } from "lucide-react";
import Link from "next/link";

export default function ChannelsPage() {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-10">
      
      {/* HEADER */}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-sans text-core tracking-tight">
          Kanal-Kopplung
        </h1>
        <p className="text-core/70 font-sans text-lg">
          Verbinde dein Smartphone in wenigen Sekunden. Keine SMS-Codes, kein Abtippen.
        </p>
      </header>

      {/* 2-STEP FLOW (BENTO CARD) */}
      <div className="bg-white border border-[#bfc0c0] p-8 rounded-2xl shadow-sm flex flex-col gap-10">
        
        {/* STEP 1 */}
        <section>
          <h2 className="font-sans font-bold text-core mb-4">
            Schritt 1: Kanal wählen
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* WhatsApp (Active) */}
            <div className="flex items-center justify-center gap-2 border-2 border-green-500 bg-green-50/50 p-4 rounded-xl cursor-pointer transition-colors">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-600" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              <span className="font-bold text-sm text-green-700">WhatsApp</span>
            </div>
            
            {/* Telegram (Inactive) */}
            <div className="flex items-center justify-center gap-2 border border-[#bfc0c0] bg-gray-50 p-4 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-core/50" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/>
              </svg>
              <span className="font-bold text-sm text-core/60">Telegram</span>
            </div>
          </div>
        </section>

        {/* STEP 2 */}
        <section>
          <h2 className="font-sans font-bold text-core mb-4">
            Schritt 2: Der Magic Link
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border border-shading/30 rounded-xl p-6 bg-gray-50/50">
            
            {/* Left: QR Code (Desktop) */}
            <div className="flex flex-col items-center gap-3">
              <div className="bg-gray-100 border border-[#bfc0c0] w-40 h-40 flex flex-col items-center justify-center rounded-lg shadow-sm">
                <QrCode className="w-12 h-12 text-core/30 mb-2" />
                <span className="font-mono text-[10px] text-core/40">QR MOCKUP</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-core/60">
                Kamera draufhalten
              </span>
            </div>

            {/* Right: Direct Link (Mobile/Alt) */}
            <div className="flex flex-col gap-4">
              <span className="text-sm font-bold text-core">
                Oder direkt am Smartphone öffnen:
              </span>
              
              <button className="w-full bg-[#2d3142] text-white hover:bg-[#1a1c23] transition-colors py-4 px-6 rounded-xl font-bold font-sans flex items-center justify-center gap-2 shadow-md">
                In WhatsApp öffnen
                <Smartphone className="w-4 h-4" />
              </button>

              <div className="bg-gray-50 border-l-2 border-action p-4 rounded-r-lg shadow-sm">
                <p className="text-xs text-core/80 leading-relaxed font-sans">
                  Sende einfach die vorgefertigte Nachricht (<span className="font-mono font-bold bg-gray-200 px-1 py-0.5 rounded">FUTR-9X2A</span>), die sich automatisch öffnet. Unser System verbindet deine Nummer in Echtzeit.
                </p>
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* ACTIVE CONNECTIONS STATUS */}
      <section className="flex flex-col gap-4">
        <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-core/60 border-b border-[#bfc0c0] pb-2">
          Aktive Verbindungen
        </h3>
        
        <div className="bg-white border border-[#bfc0c0] p-6 rounded-xl shadow-sm flex items-center gap-4">
          <div className="flex items-center justify-center relative w-3 h-3 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
          </div>
          <span className="font-mono text-sm text-core font-bold">
            Wartet auf Kopplung...
          </span>
        </div>
      </section>

    </div>
  );
}
