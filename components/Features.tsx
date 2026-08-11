"use client";

import { motion } from "framer-motion";
import { Smartphone, BrainCircuit, FileCheck, Archive } from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Multi-Channel Ingest",
    text: "Voller Support für E-Mail, WhatsApp und Telegram. Liefere die Daten über den Kanal, den du gerade zur Hand hast.",
  },
  {
    icon: BrainCircuit,
    title: "Kundengedächtnis",
    text: "Einmal erfasst, nie wieder getippt. Das System erkennt deine Kunden und vervollständigt Adressdaten künftig vollautomatisch.",
  },
  {
    icon: FileCheck,
    title: "ZUGFeRD PDF-Design",
    text: "Jede Rechnung verlässt das System als validierte, saubere PDF/A-3 Datei (Profil EN 16931), bereit für DATEV & Co.",
  },
  {
    icon: Archive,
    title: "Fail-Safe Archiv",
    text: "1 GB GoBD-Speicher inklusive. Bei Überschreitung gibt es keine Paywall, sondern einen automatischen ZIP-Export an deine E-Mail.",
  },
];

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function Features() {
  return (
    <section className="bg-white py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-core font-sans tracking-tight mb-4">
            Enterprise-Logik. Ohne Enterprise-Komplexität.
          </h2>
          <p className="text-lg text-accent">
            Futrdesk ist keine dumme OCR-Erkennung. Es ist eine mitdenkende Middleware.
          </p>
        </div>

        {/* Grid Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-shading border border-shading"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="group bg-white p-8 relative flex flex-col items-start cursor-pointer transition-all"
            >
              {/* Inset Border on Hover */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-action z-10 pointer-events-none transition-colors" />

              {/* Icon Container */}
              <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mb-6 group-hover:bg-core transition-colors">
                <feature.icon className="w-6 h-6 text-core group-hover:text-action transition-colors" />
              </div>

              {/* Content */}
              <h3 className="text-core font-bold text-lg mb-3 font-sans relative z-20">
                {feature.title}
              </h3>
              <p className="text-core/80 text-sm leading-relaxed relative z-20">
                {feature.text}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
