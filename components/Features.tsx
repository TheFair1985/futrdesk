"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Smartphone, BrainCircuit, FileCheck, Archive } from "lucide-react";
import { MouseEvent } from "react";

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
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function FeatureCard({ feature }: { feature: typeof features[0] }) {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      variants={itemVariants}
      onMouseMove={handleMouseMove}
      className="group relative flex flex-col items-start bg-gray-50/40 p-8 border border-shading/60 overflow-hidden transition-colors hover:bg-gray-50/80"
    >
      {/* Hover Glow */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-10"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(239, 131, 84, 0.15),
              transparent 40%
            )
          `,
        }}
      />

      {/* Icon Glass Container */}
      <div className="relative z-20 w-12 h-12 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
        <feature.icon className="w-5 h-5 text-core group-hover:text-action transition-colors duration-300" />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-20"
        transition={{ duration: 0.2 }}
        whileHover={{ y: -2 }}
      >
        <h3 className="text-core font-bold text-lg mb-3 font-sans">
          {feature.title}
        </h3>
        <p className="text-core/70 text-sm leading-relaxed">
          {feature.text}
        </p>
      </motion.div>
    </motion.div>
  );
}

export function Features() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden z-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-20">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-core font-sans tracking-tighter mb-6 leading-tight">
            Enterprise-Logik. <br className="hidden md:block"/>Ohne Enterprise-Komplexität.
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {features.map((feature, idx) => (
            <FeatureCard key={idx} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
