"use client";

import { useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { Check } from "lucide-react";
import { MouseEvent } from "react";
import { cn } from "../lib/utils";

const pricingTiers = [
  {
    name: "STARTER",
    priceMonthly: "19,99",
    priceYearly: "199,99",
    features: [
      "25 Rechnungen / Monat",
      "Multi-Channel (WhatsApp, Telegram, Mail)",
      "ZUGFeRD PDF",
      "Kundengedächtnis",
      "1 GB Archiv (inkl. Auto-ZIP-Export)",
    ],
    highlight: false,
    buttonText: "Kostenlos starten",
  },
  {
    name: "PRO",
    badge: "EMPFEHLUNG",
    priceMonthly: "49,99",
    priceYearly: "499,99",
    features: [
      "Alle Starter-Features",
      "Erweitertes Volumen (für kleine Werkstätten)",
      "Direkter DATEV-Export",
    ],
    highlight: true,
    buttonText: "Pro testen",
  },
  {
    name: "FLOTTE",
    priceMonthly: "99,99",
    priceYearly: "999,99",
    features: [
      "Unlimited Features",
      "Priorisierter Support",
      "Multi-User fähig",
    ],
    highlight: false,
    buttonText: "Flotte anfragen",
  },
];

function PricingCard({ tier, isYearly }: { tier: typeof pricingTiers[0], isYearly: boolean }) {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative flex flex-col p-8 rounded-2xl border overflow-hidden backdrop-blur-md transition-all duration-300",
        tier.highlight
          ? "bg-[#2d3142] text-white border-action md:scale-105 shadow-2xl z-10"
          : "bg-white/40 text-core border-shading/60 hover:bg-white/60"
      )}
    >
      {/* Mouse Tracking Glow */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-0"
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

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className={cn("font-mono font-bold tracking-widest text-sm", tier.highlight ? "text-action" : "text-core")}>
            {tier.name}
          </h3>
          {tier.badge && (
            <span className="bg-action text-white text-[10px] font-bold px-2 py-1 rounded-sm tracking-wider uppercase">
              {tier.badge}
            </span>
          )}
        </div>

        <div className="mb-6">
          <span className="text-4xl font-bold tracking-tighter">
            {isYearly ? tier.priceYearly : tier.priceMonthly} €
          </span>
          <span className={cn("text-sm ml-2", tier.highlight ? "text-white/60" : "text-core/60")}>
            / {isYearly ? "Jahr" : "Monat"}
          </span>
        </div>

        <ul className="space-y-4 mb-8 flex-1">
          {tier.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm">
              <Check className={cn("w-4 h-4 shrink-0 mt-0.5", tier.highlight ? "text-action" : "text-core")} />
              <span className={tier.highlight ? "text-white/80" : "text-core/80"}>{feature}</span>
            </li>
          ))}
        </ul>

        {tier.highlight ? (
          <div className="relative group/btn cursor-pointer mt-auto">
            <div className="absolute -inset-[2px] rounded-lg bg-gradient-to-r from-action via-white to-action opacity-70 group-hover/btn:opacity-100 blur-[2px] transition duration-500 animate-pulse" />
            <button className="relative w-full bg-action text-white font-sans text-sm font-bold px-6 py-3 rounded-lg transition-transform duration-200 group-hover/btn:scale-[1.02]">
              {tier.buttonText}
            </button>
          </div>
        ) : (
          <button className={cn(
            "mt-auto w-full font-bold px-6 py-3 rounded-lg border transition-all duration-200",
            "bg-transparent border-[#bfc0c0] text-[#2d3142] hover:bg-[#2d3142] hover:text-white"
          )}>
            {tier.buttonText}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden z-10">
      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-20">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-core font-sans tracking-tighter mb-8">
            Einfache Preise. Volle Automatisierung.
          </h2>
          
          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <div className="relative flex items-center bg-white/50 backdrop-blur-sm border border-shading/50 p-1 rounded-full">
              
              <button
                onClick={() => setIsYearly(false)}
                className={cn("relative px-6 py-2 text-sm font-bold rounded-full transition-colors z-10", !isYearly ? "text-white" : "text-core/70 hover:text-core")}
              >
                Monthly
                {!isYearly && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-action rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>

              <button
                onClick={() => setIsYearly(true)}
                className={cn("relative px-6 py-2 text-sm font-bold rounded-full transition-colors z-10", isYearly ? "text-white" : "text-core/70 hover:text-core")}
              >
                Yearly
                {isYearly && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-action rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            </div>
            
            {/* Yearly Badge */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isYearly ? 1 : 0.5, x: 0 }}
              className="font-mono text-xs text-action font-bold bg-action/10 px-3 py-1.5 rounded-full border border-action/20"
            >
              [ 2 Monate geschenkt ]
            </motion.div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {pricingTiers.map((tier, idx) => (
            <PricingCard key={idx} tier={tier} isYearly={isYearly} />
          ))}
        </div>

        {/* Add-on Box */}
        <div className="max-w-4xl mx-auto bg-gray-50 border border-shading p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-sm">
          <div className="bg-[#2d3142] text-white font-mono text-[10px] px-2 py-1 uppercase tracking-widest shrink-0">
            Auto-Scale
          </div>
          <p className="font-mono text-sm text-core/80 leading-relaxed">
            Volumen überschritten? Add-ons skalieren automatisch, ohne harten Lockout: <br className="hidden md:block"/>
            <span className="font-bold text-core">1-19 Stück für je 1,99 € | 20er Paket für 29,99 € | 50er Paket für 79,99 €.</span>
          </p>
        </div>

      </div>
    </section>
  );
}
