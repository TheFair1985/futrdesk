import { ArrowRight, Check } from 'lucide-react';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-action selection:text-white">
      {/* HEADER */}
      <header className="border-b border-shading px-4 py-4 md:px-8 flex items-center justify-between">
        <div className="font-mono font-bold text-lg tracking-tight">FUTRDESK_</div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-sm font-bold text-core hover:text-action transition-colors hidden sm:block">Login</a>
          <button className="bg-action text-white text-sm font-bold px-4 py-2 rounded-sm hover:bg-core transition-colors">
            Kostenlos starten
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <Hero />

      {/* FEATURES SECTION */}
      <Features />
    </div>
  );
}
