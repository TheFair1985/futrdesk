import { ArrowRight, Check } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-action selection:text-white">
      {/* HEADER */}
      <header className="border-b border-shading px-4 py-4 md:px-8 flex items-center justify-between">
        <div className="font-mono font-bold text-lg tracking-tight">FUTRDESK_</div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-sm font-bold text-core hover:text-action transition-colors hidden sm:block">Login</a>
          <button className="bg-action text-white text-sm font-bold px-4 py-2 rounded-sm hover:bg-core transition-colors">
            Kostenlos starten
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="flex-1 grid grid-cols-1 md:grid-cols-2 border-b border-shading">
        {/* Left: Copy & CTA */}
        <div className="p-6 md:p-12 lg:p-20 flex flex-col justify-center border-b md:border-b-0 md:border-r border-shading">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-core leading-tight mb-6 tracking-tight">
            Rechnungen schreiben ohne Tippen.
          </h1>
          <p className="text-lg text-core/80 mb-8 max-w-xl">
            Du reparierst, baust und lieferst. Futrdesk macht den Papierkram. Schick einfach ein Foto deines Schmierzettels per WhatsApp – wir erledigen den Rest (ZUGFeRD konform).
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="tel" 
              placeholder="+49 160 1234567" 
              className="border border-shading px-4 py-3 bg-white text-core focus:outline-none focus:border-action w-full max-w-xs font-mono text-sm"
            />
            <button className="bg-action text-white font-bold px-6 py-3 flex items-center justify-center gap-2 hover:bg-core transition-colors w-full sm:w-auto whitespace-nowrap">
              Jetzt via WhatsApp starten
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-6 flex items-center gap-2 text-xs text-core/60 font-mono">
            <Check className="w-3 h-3 text-action" /> 14 Tage kostenlos testen
          </div>
        </div>

        {/* Right: Visual Placeholder */}
        <div className="bg-gray-50 flex items-center justify-center p-8 md:p-12 min-h-[400px]">
          <div className="w-full h-full border border-shading bg-white flex items-center justify-center text-center p-6 shadow-sm">
            <span className="font-mono text-core/50 text-sm max-w-xs leading-relaxed">
              [ VISUAL: SPLIT-SCREEN - HANDGESCHRIEBENER ZETTEL VS. WHATSAPP CHAT ]
            </span>
          </div>
        </div>
      </section>

      {/* PROCESS SECTION */}
      <section className="bg-white">
        <div className="border-b border-shading p-6 md:px-12 md:py-8">
          <h2 className="text-2xl font-bold text-core">Zero-UI. 100% Automatisierung.</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Step 1 */}
          <div className="p-6 md:p-12 border-b md:border-b-0 md:border-r border-shading">
            <div className="font-mono text-xs text-action mb-4 tracking-widest font-bold">01 INGEST</div>
            <p className="text-core font-bold text-lg">Foto per WhatsApp senden.</p>
          </div>
          
          {/* Step 2 */}
          <div className="p-6 md:p-12 border-b md:border-b-0 md:border-r border-shading">
            <div className="font-mono text-xs text-action mb-4 tracking-widest font-bold">02 PROCESS</div>
            <p className="text-core font-bold text-lg">KI strukturiert Daten & berechnet Steuern.</p>
          </div>
          
          {/* Step 3 */}
          <div className="p-6 md:p-12">
            <div className="font-mono text-xs text-action mb-4 tracking-widest font-bold">03 SHIP</div>
            <p className="text-core font-bold text-lg">Freigabe per Chat. E-Mail mit PDF/A-3 an den Kunden.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
