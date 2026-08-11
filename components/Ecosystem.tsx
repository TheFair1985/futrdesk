"use client";

import { motion } from "framer-motion";

const integrations = [
  "DATEV (Unternehmen online)",
  "Lexoffice",
  "SAP-Ready",
  "Steuerberater Export (CSV/XML)",
  "Peppol-Architektur",
];

// Duplicate for seamless loop
const duplicatedIntegrations = [...integrations, ...integrations];

export function Ecosystem() {
  return (
    <section className="bg-gray-50 py-24 relative z-10 overflow-hidden border-y border-shading/30">
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-16 text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-core font-sans tracking-tight">
          Nahtlos in bestehende Workflows integriert.
        </h2>
      </div>

      <div className="relative w-full flex overflow-hidden mask-image-fade group">
        
        {/* We use a mask image to fade the edges left and right */}
        <div 
          className="absolute inset-0 z-20 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #f9fafb 0%, transparent 15%, transparent 85%, #f9fafb 100%)' }}
        />

        <motion.div
          className="flex whitespace-nowrap gap-8 pr-8 items-center"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 20, // adjust speed here
          }}
        >
          {duplicatedIntegrations.map((item, index) => (
            <div 
              key={index} 
              className="inline-flex items-center justify-center px-8 py-4 bg-white border border-shading/40 shadow-sm rounded-xl"
            >
              <span className="font-mono text-sm md:text-base font-bold text-core tracking-wider uppercase">
                {item}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
