"use client";

import { useEffect } from "react";
import { motion, useAnimate } from "framer-motion";
import { ArrowRight, CheckCheck, FileCheck } from "lucide-react";
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
      transition: { staggerChildren: 0.1 },
    },
  };

  const staggerItem: any = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section className="relative grid grid-cols-1 lg:grid-cols-2 min-h-screen bg-white overflow-hidden selection:bg-black selection:text-white">
      {/* LEFT COLUMN - TEXT */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="p-8 md:p-16 lg:p-24 flex flex-col justify-center relative z-10"
      >
        <motion.div variants={staggerItem} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full w-fit text-sm font-medium text-gray-900 mb-8">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          ZUGFeRD & EN 16931 Ready
        </motion.div>

        <motion.h1 variants={staggerItem} className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.05] tracking-tight mb-8 max-w-2xl">
          Rechnungskonvertierung <br /> & Analyse auf Autopilot.
        </motion.h1>

        <motion.p variants={staggerItem} className="text-xl md:text-2xl text-gray-500 mb-12 max-w-xl leading-relaxed font-light">
          Sende PDFs per WhatsApp oder E-Mail. Wir konvertieren zu ZUGFeRD, zeigen dir Analysen im Dashboard und exportieren direkt zum Steuerberater oder Kunden.
        </motion.p>

        <motion.div variants={staggerItem} className="flex items-center gap-4">
          <Link href="/login" className="bg-black text-white font-medium text-lg px-8 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors">
            Jetzt loslegen
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </motion.div>

      {/* RIGHT COLUMN - VISUALS */}
      <div className="flex items-center justify-center p-8 lg:p-24 relative z-10 bg-gray-50/50" ref={scope}>
        {/* Container */}
        <div className="relative w-full max-w-md h-[550px] flex items-center justify-center overflow-visible">
          
          {/* WHATSAPP MOCKUP */}
          <motion.div
            id="whatsapp"
            className="absolute flex flex-col w-[280px] h-[550px] z-10 rounded-[2.5rem] border-[8px] border-gray-100 bg-white overflow-hidden shadow-2xl"
          >
            <img 
              src="/whatsapp-bg.png" 
              alt="WhatsApp Chat Background" 
              className="absolute inset-0 w-full h-full object-cover z-0 opacity-50"
            />
            
            <div className="relative z-10 px-3 pb-[4.5rem] h-full flex flex-col justify-end gap-3">
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

              <div className="bg-white p-2.5 rounded-2xl rounded-tl-none shadow-sm relative self-start max-w-[85%] border border-gray-100">
                <p className="text-[13px] text-gray-800 leading-snug">
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
            className="absolute top-[-50px] bottom-[-50px] w-32 bg-gradient-to-r from-transparent via-blue-500 to-transparent z-20 mix-blend-overlay blur-xl"
            style={{ left: "-10%", opacity: 0 }}
          />
          <motion.div
            id="beam"
            className="absolute top-[-50px] bottom-[-50px] w-1 bg-blue-500 z-30 shadow-[0_0_30px_10px_rgba(59,130,246,0.5)]"
            style={{ left: "-10%", opacity: 0 }}
          />

          {/* PDF MOCKUP */}
          <motion.div
            id="pdf"
            className="absolute w-[300px] bg-white rounded-xl shadow-2xl border border-gray-100 p-8 flex flex-col z-10"
            style={{ opacity: 0, x: 50 }}
          >
            <div className="border-b border-gray-100 pb-5 mb-5 flex justify-between items-start">
              <div>
                <div className="font-bold text-gray-900 text-2xl tracking-tight">RECHNUNG</div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium">Nr. 2026-084</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-blue-500 rounded-sm" />
              </div>
            </div>
            
            <div className="w-full text-left mt-2">
              <div className="grid grid-cols-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2 mb-3">
                <span className="col-span-2">Pos</span>
                <span className="text-right">Menge</span>
                <span className="text-right">Preis</span>
              </div>
              <div className="grid grid-cols-4 text-sm text-gray-900 mb-3">
                <span className="col-span-2 font-medium">Arbeitszeit</span>
                <span className="text-right text-gray-500">4 h</span>
                <span className="text-right">240.00</span>
              </div>
              <div className="grid grid-cols-4 text-sm text-gray-900 mb-6 border-b border-gray-50 pb-4">
                <span className="col-span-2 font-medium">Material</span>
                <span className="text-right text-gray-500">1 pa</span>
                <span className="text-right">110.00</span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Netto</span>
                <span>350.00 €</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>MwSt 19%</span>
                <span>66.50 €</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-3 border-t-2 border-gray-900">
                <span>Brutto</span>
                <span>416.50 €</span>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 border border-green-100 bg-green-50 px-3 py-2 rounded-lg">
               <FileCheck className="w-4 h-4 text-green-600" />
               <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">ZUGFeRD PDF/A-3</span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
