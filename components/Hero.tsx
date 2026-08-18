"use client";

import { useEffect, useState } from "react";
import { motion, useAnimate } from "framer-motion";
import { ArrowRight, Check, CheckCheck, FileCheck } from "lucide-react";
import Link from "next/link";

export function Hero() {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    let isMounted = true;

    const runSequence = async () => {
      while (isMounted) {
        if (!isMounted) break;
        // Reset state
        await animate("#whatsapp", { opacity: 1, y: 0, filter: "blur(0px)" }, { duration: 0 });
        await animate("#beam", { left: "-10%", opacity: 0 }, { duration: 0 });
        await animate("#pdf", { opacity: 0, x: 50, filter: "blur(10px)" }, { duration: 0 });

        // State 1: Show WhatsApp
        await new Promise((r) => setTimeout(r, 1500));
        if (!isMounted) break;

        // Transition: Laser Beam Wipe
        await animate("#beam", { opacity: 1 }, { duration: 0.1 });
        await animate("#whatsapp", { opacity: 0, filter: "blur(4px)" }, { duration: 0.8, ease: "easeIn" });
        await animate("#beam", { left: "110%" }, { duration: 1.2, ease: "easeInOut" });
        await animate("#beam", { opacity: 0 }, { duration: 0.2 });

        if (!isMounted) break;

        // State 3: Output PDF slides in
        await animate("#pdf", { opacity: 1, x: 0, filter: "blur(0px)" }, { duration: 0.6, type: "spring", bounce: 0.2 });

        // Wait to show PDF
        await new Promise((r) => setTimeout(r, 3000));
        if (!isMounted) break;

        // Reset for loop
        await animate("#pdf", { opacity: 0, y: -20 }, { duration: 0.4 });
      }
    };

    runSequence();

    return () => {
      isMounted = false;
    };
  }, [animate]);

  const staggerContainer: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const staggerItem: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <section className="relative grid grid-cols-1 md:grid-cols-2 min-h-[700px] bg-transparent overflow-hidden">
      
      {/* Background Animated Blob */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-action/10 rounded-full blur-[100px] pointer-events-none z-0"
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* LEFT COLUMN */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="p-8 md:p-12 lg:p-20 flex flex-col justify-center relative z-10"
      >
        <motion.div variants={staggerItem} className="flex items-center gap-2 border border-white/30 px-3 py-1.5 bg-white/40 backdrop-blur-md rounded-full w-fit font-mono text-xs font-bold text-core mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          [ EN 16931 ERFÜLLT ]
        </motion.div>

        <motion.h1 variants={staggerItem} className="text-4xl md:text-5xl lg:text-[4rem] font-bold text-core leading-[1.05] tracking-tighter mb-6 max-w-xl">
          E-Rechnungen.<br />
          ZUGFeRD.<br />
          Vollautomatisiert.
        </motion.h1>

        <motion.p variants={staggerItem} className="text-lg text-core/70 mb-10 max-w-lg leading-relaxed">
          Schluss mit manueller Eingabe. Sende PDF-Rechnungen einfach per WhatsApp, Telegram oder E-Mail – Futrdesk konvertiert alles in strukturierte ZUGFeRD-XML Dateien, bereit für deine Buchhaltung.
        </motion.p>

        <motion.div variants={staggerItem} className="relative group w-fit cursor-pointer">
          {/* Shiny Edge Button Container */}
          <div className="absolute -inset-[2px] rounded-lg bg-gradient-to-r from-action via-white to-action opacity-70 group-hover:opacity-100 blur-[2px] transition duration-500 animate-pulse" />
          <Link href="/login" className="relative bg-[#2d3142] text-white font-sans text-sm font-bold px-8 py-4 rounded-lg flex items-center justify-center gap-3 transition-transform duration-200 group-hover:scale-[1.02]">
            Jetzt starten
            <ArrowRight className="w-4 h-4 text-action" />
          </Link>
        </motion.div>
      </motion.div>

      {/* RIGHT COLUMN */}
      <div className="flex items-center justify-center p-8 relative z-10" ref={scope}>
        
        {/* Glassmorphism Container */}
        <div className="relative w-full max-w-md h-[450px] bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-center overflow-hidden">
          
          {/* WHATSAPP MOCKUP */}
          <motion.div
            id="whatsapp"
            className="absolute flex flex-col w-[280px] h-[550px] z-10 rounded-[2.5rem] border-[6px] border-gray-900 bg-white overflow-hidden shadow-2xl"
          >
            {/* Background Screenshot */}
            <img 
              src="/whatsapp-bg.png" 
              alt="WhatsApp Chat" 
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
            
            {/* Chat Content Overlay */}
            <div className="relative z-10 px-3 pb-[4.5rem] h-full flex flex-col justify-end gap-3">
              
              {/* User sends note (Green Bubble) */}
              <div className="bg-[#dcf8c6] p-1.5 rounded-2xl rounded-tr-none shadow-sm relative self-end w-[85%] border border-[#c1e8a8]">
                <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden relative border border-black/5">
                  <img src="/note.png" alt="Handwritten Note" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col mt-1 px-1">
                  <span className="text-[13px] text-gray-800 leading-snug mb-1">Bitte in ZUGFeRD wandeln, danke!</span>
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-[10px] text-gray-500">14:23</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                  </div>
                </div>
              </div>

              {/* Bot answers (White Bubble) */}
              <div className="bg-white p-2.5 rounded-2xl rounded-tl-none shadow-sm relative self-start max-w-[85%] border border-gray-100">
                <p className="text-[13px] text-gray-800 font-sans leading-snug">
                  Rechnung erkannt. Konvertiere in ZUGFeRD-XML... ⏳
                </p>
                <div className="flex items-center justify-end mt-1 gap-1">
                  <span className="text-[10px] text-gray-400">14:23</span>
                </div>
              </div>
              
            </div>
          </motion.div>

          {/* BEAM / LASER WIPE */}
          <motion.div
            id="beam"
            className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-action to-transparent z-20 mix-blend-overlay blur-md"
            style={{ left: "-10%", opacity: 0 }}
          />
          <motion.div
            id="beam"
            className="absolute top-0 bottom-0 w-1 bg-action z-30 shadow-[0_0_20px_5px_rgba(239,131,84,0.8)]"
            style={{ left: "-10%", opacity: 0 }}
          />

          {/* PDF MOCKUP */}
          <motion.div
            id="pdf"
            className="absolute w-[300px] h-[380px] bg-white rounded-md shadow-2xl border border-gray-200 p-6 flex flex-col z-10"
            style={{ opacity: 0, x: 50 }}
          >
            {/* PDF Header */}
            <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between items-start">
              <div>
                <div className="font-bold text-core font-sans text-xl tracking-tight">RECHNUNG</div>
                <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Nr. 2026-084</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-blue-400 rounded-sm" />
              </div>
            </div>
            
            {/* Realistic Table */}
            <div className="w-full text-left mt-2">
              <div className="grid grid-cols-4 text-[9px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1 mb-2">
                <span className="col-span-2">Pos</span>
                <span className="text-right">Menge</span>
                <span className="text-right">Preis</span>
              </div>
              <div className="grid grid-cols-4 text-xs text-core mb-2">
                <span className="col-span-2 font-medium">Arbeitszeit</span>
                <span className="text-right text-gray-500">4 h</span>
                <span className="text-right font-mono">240.00</span>
              </div>
              <div className="grid grid-cols-4 text-xs text-core mb-4 border-b border-gray-100 pb-3">
                <span className="col-span-2 font-medium">Material</span>
                <span className="text-right text-gray-500">1 pa</span>
                <span className="text-right font-mono">110.00</span>
              </div>
              
              {/* Totals */}
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Netto</span>
                <span className="font-mono">350.00 €</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-3">
                <span>MwSt 19%</span>
                <span className="font-mono">66.50 €</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-core pt-2 border-t-2 border-core">
                <span>Brutto</span>
                <span className="font-mono text-action">416.50 €</span>
              </div>
            </div>

            {/* ZUGFeRD Badge */}
            <div className="mt-auto flex items-center gap-2 border border-green-200 bg-green-50 px-2 py-1 rounded">
               <FileCheck className="w-3 h-3 text-green-600" />
               <span className="text-[9px] text-green-700 font-bold uppercase tracking-wider">ZUGFeRD PDF/A-3 Integriert</span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
