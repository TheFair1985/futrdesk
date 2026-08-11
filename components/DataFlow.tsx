"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const steps = [
  {
    title: "Ingest (Multi-Node)",
    description: "Unstrukturierter Datenempfang (Scan, Foto, PDF) via E-Mail, WhatsApp oder Telegram.",
    graphic: (
      <div className="w-full h-full bg-shading/10 border border-shading rounded-2xl flex flex-col items-center justify-center p-8 gap-4">
        <div className="flex gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center font-bold text-xs border border-shading/50">MAIL</div>
          <div className="w-16 h-16 rounded-2xl bg-[#E7FFDB] shadow-sm flex items-center justify-center font-bold text-xs border border-green-200">WA</div>
          <div className="w-16 h-16 rounded-2xl bg-blue-50 shadow-sm flex items-center justify-center font-bold text-xs border border-blue-200">TG</div>
        </div>
        <div className="w-1 h-8 bg-gradient-to-b from-shading to-action" />
        <div className="w-48 h-12 bg-core text-white rounded-lg flex items-center justify-center font-mono text-xs shadow-lg">INBOX ROUTER</div>
      </div>
    ),
  },
  {
    title: "Extraction (AI-Parsing)",
    description: "Semantische Entitäten-Erkennung. Die KI extrahiert Netto, Brutto, Steuersätze und Rechnungssteller fehlerfrei.",
    graphic: (
      <div className="w-full h-full bg-shading/10 border border-shading rounded-2xl flex items-center justify-center p-8">
        <div className="w-full bg-[#2d3142] rounded-xl p-4 font-mono text-[10px] text-green-400 overflow-hidden shadow-2xl">
          <p>{`{`}</p>
          <p className="ml-4">"vendor": <span className="text-white">"Baustoffe Meyer GmbH"</span>,</p>
          <p className="ml-4">"net_amount": <span className="text-action">350.00</span>,</p>
          <p className="ml-4">"tax_rate": <span className="text-white">19</span>,</p>
          <p className="ml-4">"gross_amount": <span className="text-action">416.50</span></p>
          <p>{`}`}</p>
        </div>
      </div>
    ),
  },
  {
    title: "Validation (Compliance Check)",
    description: "Abgleich gegen das EN 16931-Regelwerk. Bei Unschärfen triggert der interaktive Fix-Flow zur sofortigen Klärung.",
    graphic: (
      <div className="w-full h-full bg-shading/10 border border-shading rounded-2xl flex flex-col items-center justify-center p-8 gap-3">
        <div className="w-full bg-white p-3 rounded border border-green-200 flex justify-between items-center">
          <span className="font-mono text-xs">BT-1 (Rechnungsnummer)</span>
          <span className="w-2 h-2 rounded-full bg-green-500" />
        </div>
        <div className="w-full bg-white p-3 rounded border border-green-200 flex justify-between items-center">
          <span className="font-mono text-xs">BT-5 (Währung)</span>
          <span className="w-2 h-2 rounded-full bg-green-500" />
        </div>
        <div className="w-full bg-action/10 p-3 rounded border border-action flex justify-between items-center">
          <span className="font-mono text-xs text-action font-bold">BT-27 (Verkäufername fehlt)</span>
          <span className="w-2 h-2 rounded-full bg-action animate-pulse" />
        </div>
        <div className="text-[9px] text-core/50 font-sans mt-2">Triggering Fix-Flow...</div>
      </div>
    ),
  },
  {
    title: "Synthesis",
    description: "Erstellung des hybriden PDF/A-3 Formats inkl. XML-Datensatz. Export-ready.",
    graphic: (
      <div className="w-full h-full bg-shading/10 border border-shading rounded-2xl flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-action/20 to-transparent" />
        <div className="w-40 h-56 bg-white border-2 border-core shadow-[8px_8px_0_0_#2d3142] relative z-10 p-4 flex flex-col">
          <div className="w-full h-2 bg-gray-200 mb-2" />
          <div className="w-3/4 h-2 bg-gray-200 mb-6" />
          <div className="w-full h-16 border border-gray-100 flex items-center justify-center">
            <span className="font-mono text-[8px] text-gray-400">XML EMBEDDED</span>
          </div>
          <div className="mt-auto bg-green-100 text-green-700 text-[8px] font-bold py-1 text-center rounded border border-green-200 uppercase tracking-widest">
            ZUGFeRD Valid
          </div>
        </div>
      </div>
    ),
  },
];

export function DataFlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section ref={containerRef} className="bg-white py-32 relative z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        <div className="text-center mb-24 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-core font-sans tracking-tighter mb-6">
            Intelligente Pipeline.<br />
            Revisionssichere Daten.
          </h2>
          <p className="text-lg text-core/70">
            Wir verarbeiten das Chaos. Du erhältst strukturierte Perfektion.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 relative">
          
          {/* Tracing Beam */}
          <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-[2px] bg-shading/30 -translate-x-1/2 hidden md:block">
            <motion.div 
              className="w-full bg-gradient-to-b from-action/50 via-action to-action shadow-[0_0_15px_rgba(239,131,84,0.8)]"
              style={{ height: lineHeight }}
            />
          </div>

          {/* Left Column: Sticky Scroll Text */}
          <div className="flex flex-col gap-24 md:gap-32 pb-32">
            {steps.map((step, idx) => (
              <div key={idx} className="relative z-10 lg:pr-12 md:pl-20 lg:pl-0">
                <div className="absolute left-0 lg:left-auto lg:-right-[calc(3rem+1px)] top-2 w-4 h-4 rounded-full bg-white border-2 border-action shadow-[0_0_10px_rgba(239,131,84,0.5)] z-20 hidden md:block" />
                <h3 className="text-2xl font-bold text-core font-sans tracking-tight mb-4">
                  <span className="text-action font-mono text-sm block mb-2">0{idx + 1}</span>
                  {step.title}
                </h3>
                <p className="text-core/70 leading-relaxed text-lg">
                  {step.description}
                </p>
                
                {/* Mobile Graphic */}
                <div className="mt-8 h-80 lg:hidden relative">
                  {step.graphic}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Sticky Graphics (Desktop only) */}
          <div className="hidden lg:block relative">
            <div className="sticky top-1/4 h-[500px] w-full pl-12 flex flex-col justify-center relative">
              {steps.map((step, idx) => {
                // Determine opacity based on scroll segment
                const start = idx * 0.25;
                const end = (idx + 1) * 0.25;
                
                // We use opacity driven by scrollYProgress to crossfade graphics
                const opacity = useTransform(
                  scrollYProgress,
                  [Math.max(0, start - 0.1), start, end, Math.min(1, end + 0.1)],
                  [0, 1, 1, 0]
                );
                
                // For the last one, keep it visible until the very end
                const finalOpacity = idx === steps.length - 1 
                  ? useTransform(scrollYProgress, [start - 0.1, start], [0, 1])
                  : opacity;

                return (
                  <motion.div 
                    key={idx}
                    className="absolute inset-0 pl-12"
                    style={{ opacity: finalOpacity }}
                  >
                    {step.graphic}
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
