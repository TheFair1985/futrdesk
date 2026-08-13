"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const faqs = [
  {
    question: "Was passiert, wenn die KI meine Handschrift nicht lesen kann?",
    answer: "Das System rät nicht. Bei Unklarheiten greift der interaktive Fix-Flow. Der Bot fragt dich direkt im Chat (WhatsApp/Telegram), was genau auf dem Zettel steht, bevor die PDF generiert wird.",
  },
  {
    question: "Sind die generierten Rechnungen rechtssicher für das Finanzamt?",
    answer: "Ja. Jedes Dokument wird als ZUGFeRD-konformes PDF/A-3 (Profil EN 16931) generiert. Zudem werden alle Originaldateien und Rechnungen GoBD-konform im Speicher archiviert.",
  },
  {
    question: "Was geschieht, wenn mein monatlicher Speicher voll ist?",
    answer: "Wir sperren dich nicht aus. Bei Überschreitung des Limits (oder bei Accountlöschung) bündelt das System deine Daten in einem automatischen Datenexport (ZIP inkl. PDFs und CSV) und sendet sie an die hinterlegte E-Mail-Adresse (z. B. direkt an deinen Steuerberater).",
  },
  {
    question: "Ersetzt Futrdesk meinen Steuerberater?",
    answer: "Nein. Futrdesk ist dein digitales Werkzeug, um die tägliche Zettelwirtschaft zu eliminieren. Es liefert am Monatsende exakt die sauber strukturierten Daten, die dein Steuerberater für die Verbuchung braucht.",
  },
];

function AccordionItem({ faq, isOpen, onClick }: { faq: typeof faqs[0], isOpen: boolean, onClick: () => void }) {
  return (
    <div className="border-b border-shading overflow-hidden">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-6 px-4 md:px-6 text-left bg-transparent hover:bg-gray-50/50 transition-colors duration-200"
      >
        <span className="font-bold text-core text-lg md:text-xl font-sans pr-8">{faq.question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="font-mono text-xl text-action flex-shrink-0"
        >
          +
        </motion.span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-4 md:px-6 pb-6 text-core/80 leading-relaxed font-sans">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqAndCta() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      {/* FAQ SECTION */}
      <section className="bg-white py-24 relative z-10">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <h2 className="text-3xl md:text-5xl font-bold text-core font-sans tracking-tighter mb-12 text-center">
            Noch Fragen? <span className="text-action">Klare Antworten.</span>
          </h2>
          
          <div className="border-t border-shading">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                faq={faq} 
                isOpen={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="bg-core py-24 md:py-32 relative z-10 overflow-hidden">
        {/* Subtle Background Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-action/10 via-core to-core pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center relative z-20">
          <h2 className="text-4xl md:text-6xl font-bold text-white font-sans tracking-tighter mb-6">
            Bereit für Feierabend <br className="hidden md:block"/> ohne Papierkram?
          </h2>
          <p className="text-lg md:text-xl text-shading mb-12 max-w-2xl mx-auto">
            Starte jetzt und lass Futrdesk deine erste E-Rechnung schreiben.
          </p>
          
          <div className="flex justify-center">
            <div className="relative group w-fit cursor-pointer">
              {/* Shiny Edge Box */}
              <div className="absolute -inset-[3px] rounded-xl bg-gradient-to-r from-action via-white/50 to-action opacity-70 group-hover:opacity-100 blur-[2px] transition duration-500 animate-pulse" />
              
              <Link href="/login" className="relative bg-action text-white font-sans text-lg font-bold px-10 py-5 rounded-xl flex items-center justify-center gap-3 transition-transform duration-200 group-hover:scale-105 active:scale-95 shadow-2xl">
                Kostenlos ausprobieren
                <ArrowRight className="w-5 h-5 text-white" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
