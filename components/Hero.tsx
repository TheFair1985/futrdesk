"use client";

import { useEffect, useState } from "react";
import { motion, useAnimate } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function Hero() {
  const [scope, animate] = useAnimate();
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    let isMounted = true;

    const runSequence = async () => {
      while (isMounted) {
        // Reset state
        setTypedText("");
        if (!isMounted) break;
        await animate("#paper", { opacity: 1, x: 0, rotate: -2 }, { duration: 0 });
        await animate("#terminal", { opacity: 0, y: 20 }, { duration: 0 });
        await animate("#pdf", { opacity: 0, x: 100 }, { duration: 0 });
        await animate("#scanner", { top: "-10%", opacity: 0 }, { duration: 0 });

        // State 1: Show Paper
        await new Promise((r) => setTimeout(r, 800));
        if (!isMounted) break;

        // Transition: Scanner
        await animate("#scanner", { opacity: 1 }, { duration: 0.2 });
        await animate("#scanner", { top: "110%" }, { duration: 1.5, ease: "linear" });
        await animate("#scanner", { opacity: 0 }, { duration: 0.2 });

        if (!isMounted) break;

        // State 2: Terminal pops up
        await animate("#terminal", { opacity: 1, y: 0 }, { duration: 0.4, type: "spring" });
        
        // Terminal typing effect
        const text1 = "> extracting net amount: 350.00...";
        const text2 = "> calculating VAT: 19%...";
        
        for (let i = 1; i <= text1.length; i++) {
          if (!isMounted) break;
          setTypedText(text1.slice(0, i));
          await new Promise((r) => setTimeout(r, 20));
        }
        
        await new Promise((r) => setTimeout(r, 300));
        if (!isMounted) break;
        
        for (let i = 1; i <= text2.length; i++) {
          if (!isMounted) break;
          setTypedText(text1 + "\n" + text2.slice(0, i));
          await new Promise((r) => setTimeout(r, 20));
        }

        await new Promise((r) => setTimeout(r, 800));
        if (!isMounted) break;

        // State 3: Output PDF slides in
        animate("#paper", { opacity: 0, scale: 0.95 }, { duration: 0.4 });
        animate("#terminal", { opacity: 0, scale: 0.95 }, { duration: 0.4 });
        await animate("#pdf", { opacity: 1, x: 0 }, { duration: 0.5, type: "spring", bounce: 0.3 });

        // Wait to show PDF
        await new Promise((r) => setTimeout(r, 2500));
        if (!isMounted) break;

        // Reset for loop
        await animate("#pdf", { opacity: 0 }, { duration: 0.3 });
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
    <section className="grid grid-cols-1 md:grid-cols-2 border-b border-shading min-h-[600px] bg-background">
      {/* LEFT COLUMN */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="p-8 md:p-12 lg:p-20 flex flex-col justify-center border-b md:border-b-0 md:border-r border-shading relative"
      >
        <motion.div variants={staggerItem} className="flex items-center gap-2 border border-shading px-3 py-1.5 bg-white w-fit font-mono text-xs font-bold text-core mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          [ EN 16931 ERFÜLLT ]
        </motion.div>

        <motion.h1 variants={staggerItem} className="text-4xl md:text-5xl lg:text-[4rem] font-bold text-core leading-[1.1] tracking-tighter mb-6 max-w-xl">
          E-Rechnungen.<br />
          Automatisiert aus deinen Notizen.
        </motion.h1>

        <motion.div variants={staggerItem} className="mt-8 relative group w-fit cursor-pointer">
          {/* Hard Brutalist Shadow */}
          <div className="absolute inset-0 bg-core translate-y-1.5 translate-x-1.5 border border-core" />
          {/* Button Body */}
          <div className="relative bg-action text-white font-bold px-8 py-4 border border-core flex items-center justify-center gap-2 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 active:translate-y-1.5 active:translate-x-1.5">
            Kostenlos starten
            <ArrowRight className="w-5 h-5" />
          </div>
        </motion.div>
      </motion.div>

      {/* RIGHT COLUMN */}
      <div className="bg-gray-50 flex items-center justify-center p-8 relative overflow-hidden" ref={scope}>
        <div className="relative w-full max-w-sm h-full flex items-center justify-center min-h-[400px]">
          
          {/* PAPER (Ingest) */}
          <motion.div
            id="paper"
            className="absolute w-64 h-80 bg-[#f4f4f4] border border-shading flex flex-col p-6 shadow-sm z-10"
            style={{ rotate: -2 }}
          >
            <div className="w-full h-full border border-dashed border-shading/50 flex items-center justify-center">
              <span className="font-mono text-xs text-core/40 transform -rotate-12">
                Handgeschriebener
                <br />Zettel
              </span>
            </div>
            
            {/* SCANNER LINE */}
            <motion.div
              id="scanner"
              className="absolute left-0 w-full h-1 bg-action z-20 shadow-[0_0_20px_4px_rgba(239,131,84,0.6)]"
              style={{ top: "-10%", opacity: 0 }}
            />
          </motion.div>

          {/* TERMINAL (Structuring) */}
          <motion.div
            id="terminal"
            className="absolute bottom-12 -left-4 w-72 bg-core text-white font-mono text-xs p-4 border border-shading z-30 shadow-lg whitespace-pre-wrap"
            style={{ opacity: 0, y: 20 }}
          >
            <div className="flex gap-1.5 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            {typedText}
            <span className="animate-pulse">_</span>
          </motion.div>

          {/* PDF (Output) */}
          <motion.div
            id="pdf"
            className="absolute w-72 h-[360px] bg-white border-2 border-core z-40 p-6 flex flex-col shadow-[8px_8px_0_0_#2d3142]"
            style={{ opacity: 0, x: 100 }}
          >
            <div className="border-b-2 border-core pb-4 mb-4 flex justify-between items-start">
              <div>
                <div className="font-bold text-core font-sans text-xl">RECHNUNG</div>
                <div className="font-mono text-xs text-core mt-1">ZUGFeRD PDF/A-3</div>
              </div>
              <div className="w-8 h-8 bg-action/20 border border-action flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-action rounded-full" />
              </div>
            </div>
            
            <div className="space-y-3 font-mono text-xs text-core mt-4 flex-1">
              <div className="flex justify-between border-b border-shading/30 pb-1">
                <span>Netto:</span>
                <span className="font-bold">350.00 EUR</span>
              </div>
              <div className="flex justify-between border-b border-shading/30 pb-1">
                <span>MwSt (19%):</span>
                <span>66.50 EUR</span>
              </div>
              <div className="flex justify-between font-bold text-sm mt-4 pt-2 border-t-2 border-core">
                <span>Brutto:</span>
                <span>416.50 EUR</span>
              </div>
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
