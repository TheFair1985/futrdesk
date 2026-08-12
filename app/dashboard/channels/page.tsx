"use client";

import { useState } from "react";
import { Smartphone, QrCode, Mail, Send, Copy, CheckCircle2 } from "lucide-react";

export default function ChannelsPage() {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'telegram' | 'email'>('whatsapp');
  const [copied, setCopied] = useState(false);

  const inboundEmail = "u_abc123@inbound.futrdesk.de";

  const handleCopy = () => {
    navigator.clipboard.writeText(inboundEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-10">
      
      {/* HEADER */}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-sans text-core tracking-tight">
          Kanal-Kopplung
        </h1>
        <p className="text-core/70 font-sans text-lg">
          Verbinde deine favorisierten Kanäle. Reiche Dokumente über WhatsApp, Telegram oder E-Mail ein.
        </p>
      </header>

      {/* MULTI-CHANNEL HUB */}
      <div className="bg-white border border-[#bfc0c0] p-8 rounded-2xl shadow-sm flex flex-col gap-8">
        
        {/* TABS */}
        <div className="flex flex-wrap gap-4 border-b border-[#bfc0c0] pb-4">
          <button 
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'whatsapp' ? 'bg-green-50 text-green-700 border border-green-200' : 'text-core/60 hover:bg-gray-50'}`}
          >
            <Smartphone className="w-4 h-4" /> WhatsApp
          </button>
          <button 
            onClick={() => setActiveTab('telegram')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'telegram' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-core/60 hover:bg-gray-50'}`}
          >
            <Send className="w-4 h-4" /> Telegram
          </button>
          <button 
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'email' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-core/60 hover:bg-gray-50'}`}
          >
            <Mail className="w-4 h-4" /> E-Mail Inbound
          </button>
        </div>

        {/* CONTENT */}
        <div className="min-h-[300px]">
          
          {/* WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="flex flex-col gap-8 transition-opacity duration-300">
              <div className="flex items-center gap-4 bg-green-50/50 border border-green-200 p-4 rounded-xl">
                 <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shrink-0" />
                 <span className="font-bold text-green-800">Status: Gekoppelt (+49 151 **** **)</span>
              </div>
              <section>
                <h2 className="font-sans font-bold text-core mb-4">Gerät neu koppeln (Magic Link)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border border-shading/30 rounded-xl p-6 bg-gray-50/50">
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-gray-100 border border-[#bfc0c0] w-40 h-40 flex flex-col items-center justify-center rounded-lg shadow-sm">
                      <QrCode className="w-12 h-12 text-core/30 mb-2" />
                      <span className="font-mono text-[10px] text-core/40">QR MOCKUP</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <button className="w-full bg-[#25D366] text-white hover:bg-[#1DA851] transition-colors py-4 px-6 rounded-xl font-bold font-sans flex items-center justify-center gap-2 shadow-md">
                      In WhatsApp öffnen
                      <Smartphone className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-core/80 leading-relaxed">
                      Sende die vorgefertigte Nachricht <span className="font-mono font-bold bg-gray-200 px-1 py-0.5 rounded">FUTR-9X2A</span>.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TELEGRAM */}
          {activeTab === 'telegram' && (
            <div className="flex flex-col gap-8 transition-opacity duration-300">
              <div className="flex items-center gap-4 bg-blue-50/50 border border-blue-200 p-4 rounded-xl">
                 <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shrink-0" />
                 <span className="font-bold text-blue-800">Status: Gekoppelt (@username)</span>
              </div>
              <section>
                <h2 className="font-sans font-bold text-core mb-4">Mit Telegram verbinden</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border border-shading/30 rounded-xl p-6 bg-gray-50/50">
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-gray-100 border border-[#bfc0c0] w-40 h-40 flex flex-col items-center justify-center rounded-lg shadow-sm">
                      <Send className="w-12 h-12 text-core/30 mb-2" />
                      <span className="font-mono text-[10px] text-core/40">@futrdesk_bot</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <a href="https://t.me/futrdesk_bot?start=FUTR-9X2A" target="_blank" rel="noreferrer" className="w-full bg-[#0088cc] text-white hover:bg-[#0077b3] transition-colors py-4 px-6 rounded-xl font-bold font-sans flex items-center justify-center gap-2 shadow-md">
                      In Telegram öffnen
                      <Send className="w-4 h-4" />
                    </a>
                    <p className="text-xs text-core/80 leading-relaxed">
                      Sende die vorgefertigte Nachricht <span className="font-mono font-bold bg-gray-200 px-1 py-0.5 rounded">FUTR-9X2A</span> an unseren Bot.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* EMAIL */}
          {activeTab === 'email' && (
            <div className="flex flex-col gap-8 transition-opacity duration-300">
              <div className="flex items-center gap-4 bg-purple-50/50 border border-purple-200 p-4 rounded-xl">
                 <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shrink-0" />
                 <span className="font-bold text-purple-800">Status: Aktiv (Lauscht auf eingehende E-Mails)</span>
              </div>
              <section>
                <h2 className="font-sans font-bold text-core mb-4">Deine persönliche Inbound-Adresse</h2>
                <p className="text-sm text-core/70 mb-6">
                  Leite Rechnungen einfach an diese Adresse weiter. Das System verarbeitet PDF- und Bild-Anhänge automatisch und sendet dir die fertige ZUGFeRD-Datei zurück.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 border border-[#bfc0c0] p-4 rounded-xl font-mono text-sm text-core truncate">
                    {inboundEmail}
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="bg-core text-white px-6 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-core/90 transition-colors shrink-0"
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'Kopiert!' : 'Kopieren'}
                  </button>
                </div>
              </section>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
