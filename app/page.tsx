import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { DataFlow } from '../components/DataFlow';
import { Compliance } from '../components/Compliance';
import { Ecosystem } from '../components/Ecosystem';
import { Pricing } from '../components/Pricing';
import { FaqAndCta } from '../components/FaqAndCta';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-action selection:text-white">
      {/* HEADER */}
      <header className="border-b border-shading px-4 py-4 md:px-8 flex items-center justify-between">
        <div className="font-mono font-bold text-lg tracking-tight">FUTRDESK_</div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-bold text-core hover:text-action transition-colors hidden sm:block">Login</Link>
          <Link href="/login" className="bg-action text-white text-sm font-bold px-4 py-2 rounded-sm hover:bg-core transition-colors">
            Jetzt starten
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <Hero />

      {/* FEATURES SECTION */}
      <Features />

      {/* DATA FLOW (TRACING BEAM) SECTION */}
      <DataFlow />

      {/* COMPLIANCE (TEXT REVEAL) SECTION */}
      <Compliance />

      {/* ECOSYSTEM (INFINITE SCROLL) SECTION */}
      <Ecosystem />

      {/* PRICING SECTION */}
      <Pricing />

      {/* FAQ & CTA SECTION */}
      <FaqAndCta />
    </div>
  );
}
