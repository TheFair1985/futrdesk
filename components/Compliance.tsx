"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "../lib/utils";

const text = "Sicherheit ist kein Feature. Es ist das Fundament. Futrdesk garantiert 100% GoBD-konforme Archivierung, lückenlose ZUGFeRD-Validierung (EN 16931) und kompromisslose DSGVO-Datensouveränität. Dein Audit-Trail ist gesichert.";

export function Compliance() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 50%"],
  });

  const words = text.split(" ");

  return (
    <section ref={containerRef} className="bg-core py-32 md:py-48 relative z-10">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        
        {/* Text Reveal Section */}
        <div className="mb-24">
          <p className="text-3xl md:text-5xl lg:text-7xl font-bold font-sans tracking-tight leading-tight flex flex-wrap gap-x-3 gap-y-2">
            {words.map((word, i) => {
              const start = i / words.length;
              const end = start + (1 / words.length);
              
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const opacity = useTransform(scrollYProgress, [start, end], [0.2, 1]);
              
              return (
                <motion.span key={i} style={{ opacity }} className="text-white">
                  {word}
                </motion.span>
              );
            })}
          </p>
        </div>

        {/* Static Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-shading/30 pt-12">
          
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-6 rounded-xl backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-mono font-bold text-white shadow-inner">
              01
            </div>
            <div className="font-mono text-sm tracking-widest text-white uppercase font-bold">
              GoBD Archiv
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-6 rounded-xl backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-mono font-bold text-white shadow-inner">
              02
            </div>
            <div className="font-mono text-sm tracking-widest text-white uppercase font-bold">
              EN 16931 Profil
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-6 rounded-xl backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-action/20 flex items-center justify-center font-mono font-bold text-action border border-action/30 shadow-[0_0_15px_rgba(239,131,84,0.3)]">
              03
            </div>
            <div className="font-mono text-sm tracking-widest text-white uppercase font-bold">
              ISO/DSGVO Standards
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
