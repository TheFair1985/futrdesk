"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { TrendingUp, Users, CheckCircle2, Smartphone, Send, Mail, Map, Zap, ArrowUpRight, ArrowDownRight, Clock, Archive, Trophy, Sparkles, Activity, Info, FileText, Bot, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";
import Image from "next/image";

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false, loading: () => <div className="w-full h-full bg-gray-50 animate-pulse rounded-2xl flex items-center justify-center text-core/20 font-bold text-sm">Karte wird geladen...</div> });

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
};

type Timeframe = 'monat' | 'quartal' | 'jahr';

// --- MOCK DATA GENERATOR (2024, 2025, 2026) ---
const generateMockInvoices = () => {
  const invoices = [];
  const start = new Date(2024, 0, 1);
  const end = new Date(2026, 7, 12); // August 12, 2026

  const customers = [
    { name: "Amazon AWS", share: 0.35 },
    { name: "Shell Fleet", share: 0.25 },
    { name: "Adobe Systems", share: 0.15 },
    { name: "Salesforce", share: 0.10 },
    { name: "Telekom", share: 0.10 },
    { name: "Microsoft", share: 0.05 }
  ];

  const regions = [
    { name: "München Zentrum (80333)", zip: "80333", prob: 0.4, lat: 48.1466, lng: 11.5670 },
    { name: "Augsburg (86150)", zip: "86150", prob: 0.2, lat: 48.3715, lng: 10.8985 },
    { name: "Ingolstadt (85049)", zip: "85049", prob: 0.15, lat: 48.7665, lng: 11.4258 },
    { name: "Rosenheim (83022)", zip: "83022", prob: 0.15, lat: 47.8561, lng: 12.1190 },
    { name: "Garmisch (82467)", zip: "82467", prob: 0.1, lat: 47.4921, lng: 11.0955 },
  ];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const month = d.getMonth();
    const isBadMonth = month === 0 || month === 1 || month === 7;
    const dailyInvoices = isBadMonth ? Math.floor(Math.random() * 2) + 1 : Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < dailyInvoices; i++) {
      const randCustomer = Math.random();
      let cumulative = 0;
      let selectedCustomer = customers[0].name;
      for (const c of customers) {
        cumulative += c.share;
        if (randCustomer <= cumulative) {
          selectedCustomer = c.name;
          break;
        }
      }

      const randRegion = Math.random();
      let cumReg = 0;
      let selectedRegion = regions[0];
      for (const r of regions) {
        cumReg += r.prob;
        if (randRegion <= cumReg) {
          selectedRegion = r;
          break;
        }
      }

      // 2024 was worse than 2025, 2025 worse than 2026 (growth trend)
      const yearMultiplier = d.getFullYear() === 2024 ? 0.7 : d.getFullYear() === 2025 ? 0.85 : 1.0;
      const amount = (Math.floor(Math.random() * 750) + 150) * yearMultiplier;

      invoices.push({
        id: `INV-${d.getTime()}-${i}`,
        created_at: new Date(d).toISOString(),
        vendor_name: selectedCustomer,
        gross_amount: amount,
        status: Math.random() > 0.05 ? 'completed' : 'needs_fix',
        zip_code: selectedRegion.zip,
        region_name: selectedRegion.name,
        lat: selectedRegion.lat,
        lng: selectedRegion.lng
      });
    }
  }
  return invoices;
};

// Generate exactly once outside the component to keep references stable if needed
let cachedMockInvoices: any[] = [];

export default function DashboardClient({ profile }: any) {
  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('jahr');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  useEffect(() => {
    if (cachedMockInvoices.length === 0) {
      cachedMockInvoices = generateMockInvoices();
    }
    setMounted(true);
  }, []);

  // FILTER LOGIC
  const now = new Date(selectedYear, selectedYear === 2026 ? 7 : 11, selectedYear === 2026 ? 12 : 31);
  
  const currentPeriodInvoices = useMemo(() => {
    if (!mounted) return [];
    return cachedMockInvoices.filter((inv) => {
      const d = new Date(inv.created_at);
      if (timeframe === 'monat') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (timeframe === 'quartal') return Math.floor(d.getMonth() / 3) === Math.floor(now.getMonth() / 3) && d.getFullYear() === now.getFullYear();
      if (timeframe === 'jahr') return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [timeframe, selectedYear, mounted, now]);

  const previousPeriodInvoices = useMemo(() => {
    if (!mounted) return [];
    return cachedMockInvoices.filter((inv) => {
      const d = new Date(inv.created_at);
      if (timeframe === 'monat') return d.getMonth() === (now.getMonth() === 0 ? 11 : now.getMonth() - 1) && d.getFullYear() === (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
      if (timeframe === 'quartal') {
        const prevQ = Math.floor(now.getMonth() / 3) - 1;
        const targetYear = prevQ < 0 ? now.getFullYear() - 1 : now.getFullYear();
        const targetQ = prevQ < 0 ? 3 : prevQ;
        return Math.floor(d.getMonth() / 3) === targetQ && d.getFullYear() === targetYear;
      }
      if (timeframe === 'jahr') return d.getFullYear() === now.getFullYear() - 1;
      return true;
    });
  }, [timeframe, selectedYear, mounted, now]);

  const currentBilled = currentPeriodInvoices.reduce((sum, inv) => sum + inv.gross_amount, 0);
  const previousBilled = previousPeriodInvoices.reduce((sum, inv) => sum + inv.gross_amount, 0);
  const growth = previousBilled === 0 ? 0 : ((currentBilled - previousBilled) / previousBilled) * 100;

  // FORECAST LOGIC
  const forecast = useMemo(() => {
    if (selectedYear !== 2026) return currentBilled; // No forecast for past years
    if (timeframe === 'monat') return (currentBilled / 12) * 31;
    if (timeframe === 'quartal') return (currentBilled / 42) * 90;
    if (timeframe === 'jahr') return (currentBilled / 224) * 365;
    return currentBilled;
  }, [timeframe, currentBilled, selectedYear]);

  // LEADERBOARD LOGIC
  const getLeaderboard = (invoices: any[], field: string) => {
    const map: Record<string, number> = {};
    invoices.forEach(i => map[i[field]] = (map[i[field]] || 0) + i.gross_amount);
    const total = Object.values(map).reduce((a,b)=>a+b, 0);
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map((entry, idx) => ({
        rank: idx + 1,
        name: entry[0],
        amount: entry[1],
        share: total > 0 ? (entry[1] / total) * 100 : 0
      }));
  };

  const currentLeaderboard = getLeaderboard(currentPeriodInvoices, 'vendor_name');
  const prevLeaderboard = getLeaderboard(previousPeriodInvoices, 'vendor_name');
  const leaderboard = currentLeaderboard.map(curr => {
    const prev = prevLeaderboard.find(p => p.name === curr.name);
    const pAmount = prev ? prev.amount : 0;
    const g = pAmount === 0 ? 100 : ((curr.amount - pAmount) / pAmount) * 100;
    return { ...curr, growth: g, status: g >= 0 ? 'up' : 'down' };
  });

  const currentGeoBoard = getLeaderboard(currentPeriodInvoices, 'region_name');
  const prevGeoBoard = getLeaderboard(previousPeriodInvoices, 'region_name');
  const geoLeaderboard = currentGeoBoard.map(curr => {
    const prev = prevGeoBoard.find(p => p.name === curr.name);
    const pAmount = prev ? prev.amount : 0;
    const g = pAmount === 0 ? 100 : ((curr.amount - pAmount) / pAmount) * 100;
    return { ...curr, growth: g, status: g >= 0 ? 'up' : 'down' };
  });

  const mapData = useMemo(() => {
    const map: Record<string, { lat: number, lng: number, value: number, region: string }> = {};
    currentPeriodInvoices.forEach(i => {
      const key = `${i.lat}-${i.lng}`;
      if (!map[key]) map[key] = { lat: i.lat, lng: i.lng, value: 0, region: i.region_name };
      map[key].value += i.gross_amount;
    });
    return Object.values(map);
  }, [currentPeriodInvoices]);

  const trendData = useMemo(() => {
    const data = [];
    if (timeframe === 'jahr') {
      for (let i = 0; i < 12; i++) {
        const currMonth = currentPeriodInvoices.filter(inv => new Date(inv.created_at).getMonth() === i).reduce((s,i)=>s+i.gross_amount,0);
        const prevMonth = previousPeriodInvoices.filter(inv => new Date(inv.created_at).getMonth() === i).reduce((s,i)=>s+i.gross_amount,0);
        const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
        data.push({ name: monthNames[i], Aktuell: currMonth, Vorher: prevMonth });
      }
    } else if (timeframe === 'monat') {
      for(let i=0; i<4; i++) {
        data.push({ name: `Woche ${i+1}`, Aktuell: currentBilled * (0.2 + (i*0.05)), Vorher: previousBilled * 0.25 });
      }
    } else {
      data.push({ name: 'Monat 1', Aktuell: currentBilled * 0.3, Vorher: previousBilled * 0.33 });
      data.push({ name: 'Monat 2', Aktuell: currentBilled * 0.4, Vorher: previousBilled * 0.33 });
      data.push({ name: 'Monat 3', Aktuell: currentBilled * 0.3, Vorher: previousBilled * 0.33 });
    }
    return data;
  }, [timeframe, currentPeriodInvoices, previousPeriodInvoices, currentBilled, previousBilled]);

  const flowCheckData = [
    { month: `August ${String(selectedYear).slice(2)}`, generated: 142, zugferd: 139, clientSent: 139, taxSent: false, zipDays: 19, status: 'attention', desc: '3 Belege fehlerhaft. Stammdaten unvollständig (Steuernummer fehlt). Bitte manuell korrigieren.' },
    { month: `Juli ${String(selectedYear).slice(2)}`, generated: 450, zugferd: 450, clientSent: 450, taxSent: true, zipDays: 0, status: 'completed', desc: 'Sammel-Export erfolgreich an DATEV übermittelt. Zyklus GoBD-konform geschlossen.' },
    { month: `Juni ${String(selectedYear).slice(2)}`, generated: 480, zugferd: 480, clientSent: 480, taxSent: true, zipDays: 0, status: 'completed', desc: 'Sammel-Export erfolgreich an DATEV übermittelt. Zyklus GoBD-konform geschlossen.' },
    { month: `Mai ${String(selectedYear).slice(2)}`, generated: 512, zugferd: 512, clientSent: 512, taxSent: true, zipDays: 0, status: 'completed', desc: 'Sammel-Export erfolgreich an DATEV übermittelt. Zyklus GoBD-konform geschlossen.' },
  ];

  const generateAiInsights = () => {
    const insights = [];
    if (timeframe === 'jahr') {
      insights.push(`Saisonales Muster erkannt: Januar, Februar und August zeigen konsistente Umsatzdellen (-60% vs. Jahresdurchschnitt).`);
    } else if (timeframe === 'monat' && now.getMonth() === 7) {
      insights.push(`Der August-Umsatz ist erfahrungsgemäß urlaubsbedingt schwach. Prognostizierter Endspurt sichert stabile Marge.`);
    }

    if (leaderboard.length > 0 && leaderboard[0].growth > 10) {
      insights.push(`Der Kunde '${leaderboard[0].name}' wächst massiv (+${leaderboard[0].growth.toFixed(1)}%) und fordert ${leaderboard[0].share.toFixed(1)}% Kapazität.`);
    }

    return insights;
  };
  const aiInsights = generateAiInsights();

  if (!mounted) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-core/20">Inititalisiere Dashboard Engine...</div>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-10">
      
      {/* -------------------------------------------------------------
          HEADER & SUPER-METRICS (The Cockpit)
          ------------------------------------------------------------- */}
      <motion.div variants={itemVariants} className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 bg-white p-8 rounded-[32px] shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-shading/10">
        
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1 mb-2">
            <div className="flex items-center gap-3">
              {profile?.logo_url && (
                <Image src={profile.logo_url} width={32} height={32} alt="Logo" className="rounded-lg object-contain" />
              )}
              <h2 className="text-xl font-bold text-core tracking-tight">{profile?.company_name || 'Musterfirma GmbH'}</h2>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-4 mb-2">
              <span className="text-core/50 font-bold text-sm tracking-widest uppercase">Fakturierter Ausgangsumsatz</span>
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
                {[2024, 2025, 2026].map(year => (
                  <button 
                    key={year} 
                    onClick={() => setSelectedYear(year)}
                    className={cn("px-3 py-1 rounded-md text-xs font-bold transition-all", selectedYear === year ? "bg-white shadow-sm text-core" : "text-core/40 hover:text-core/80")}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-core font-sans">
                {currentBilled.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </h1>
              <div className={cn(
                "flex flex-col px-4 py-2 rounded-xl text-sm font-bold shadow-sm",
                growth > 0 ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"
              )}>
                <div className="flex items-center gap-1">
                  {growth > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(growth).toFixed(1)}% vs. {timeframe === 'monat' ? 'Vormonat' : 'Vorjahr'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-1 bg-gray-50 p-4 rounded-2xl border border-shading/10 w-fit">
            <span className="text-xs text-core/60 font-bold">Summe aller Ausgangsrechnungen (Netto + MwSt) im ausgewählten Zeitraum.</span>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-core/40">Vergleichswert Vorperiode: <span className="font-bold text-core">{previousBilled.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span></span>
              {selectedYear === 2026 && (
                <>
                  <div className="w-1 h-1 bg-shading/20 rounded-full" />
                  <span className="text-action font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> KI-Prognose: {forecast.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* TIME TOGGLE */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs font-bold text-core/40 uppercase tracking-widest mr-2">Zeitraum Filter</span>
          <div className="flex items-center bg-gray-50/80 p-1.5 rounded-2xl shadow-inner border border-shading/10">
            {(['monat', 'quartal', 'jahr'] as Timeframe[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={cn(
                  "relative px-8 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-colors z-10",
                  timeframe === t ? "text-core" : "text-core/40 hover:text-core/80"
                )}
              >
                {timeframe === t && (
                  <motion.div layoutId="timeframe-bubble" className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.06)] border border-shading/5 -z-10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                {t === 'monat' ? 'Monat' : t === 'quartal' ? 'Quartal' : 'Jahr'}
              </button>
            ))}
          </div>
        </div>
      </motion.div>


      {/* -------------------------------------------------------------
          ROW 2: THE RACE (Leaderboard & Trend)
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-shading/10 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-action/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-action" />
            </div>
            <div>
              <h3 className="font-bold text-core text-lg">Top Kunden Rangliste</h3>
              <p className="text-xs text-core/50 font-mono">Volumen-Auswertung</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 mb-6 text-xs text-core/60 font-medium">
            Diese Rangliste zeigt die umsatzstärksten Kunden im gewählten Zeitraum und ihr Wachstum zur Vorperiode.
          </div>

          <div className="flex flex-col gap-6 flex-1">
            {leaderboard.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="font-mono font-black text-xl text-core/20 w-6">{item.rank}</div>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-bold text-core text-sm truncate pr-2">{item.name}</span>
                    <span className="font-mono text-sm font-bold text-core">{item.amount.toLocaleString('de-DE')} €</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${item.share}%` }} 
                        transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                        className={cn("h-full rounded-full", item.rank === 1 ? "bg-action" : "bg-core")} 
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-core/50 w-24">Anteil: {item.share.toFixed(1)}%</span>
                    <span className={cn(
                      "text-[10px] font-mono font-bold flex items-center w-16",
                      item.status === 'up' ? "text-green-500" : "text-red-500"
                    )}>
                      {item.status === 'up' ? '▲' : '▼'} {Math.abs(item.growth).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="xl:col-span-2 bg-white rounded-[32px] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-shading/10 flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-core/5 flex items-center justify-center">
                <Activity className="w-6 h-6 text-core" />
              </div>
              <div>
                <h3 className="font-bold text-core text-lg">Umsatz-Entwicklung</h3>
                <p className="text-xs text-core/50 font-mono">Aktueller Zeitraum vs. Vorperiode (inkl. Saisonalität)</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold font-mono bg-gray-50 px-4 py-2 rounded-xl border border-shading/10">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-action" /> Aktuell ({selectedYear})</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-core/20" /> Vorher</div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[260px] -ml-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef8354" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef8354" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  formatter={(value: number) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  labelFormatter={(label) => `Abschnitt: ${label}`}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }} 
                  itemStyle={{ fontWeight: 'bold' }} 
                />
                <Area type="monotone" dataKey="Vorher" stroke="#2d3142" strokeOpacity={0.2} strokeWidth={2} strokeDasharray="5 5" fill="none" />
                <Area type="monotone" dataKey="Aktuell" stroke="#ef8354" strokeWidth={4} fillOpacity={1} fill="url(#colorCurrent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* -------------------------------------------------------------
          ROW 3: KI INSIGHTS WIDGET
          ------------------------------------------------------------- */}
      <motion.div variants={itemVariants} className="bg-core text-white rounded-[32px] p-8 shadow-[0_10px_40px_rgba(45,49,66,0.3)] flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Sparkles className="w-64 h-64 -mt-20 -mr-20" />
        </div>
        
        {/* Left: Visual Gauge */}
        <div className="w-full md:w-1/4 h-full relative z-10 flex flex-col justify-center items-center md:border-r border-white/10 md:pr-10">
           <span className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">GoBD ZUGFeRD Quote</span>
           <div className="h-28 w-full max-w-[160px]">
             <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={10} data={[{name: 'Quote', value: 99.8, fill: '#22c55e'}]}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={10} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-white font-black text-2xl">
                    99.8%
                  </text>
                </RadialBarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Right: LLM Chat Bubbles */}
        <div className="flex-1 flex flex-col gap-5 relative z-10 w-full">
          {aiInsights.slice(0,2).map((insight, idx) => (
            <div key={idx} className="flex items-end gap-3 w-full max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <Image src="/futrdesk.png" alt="Futrdesk Logo" width={20} height={20} className="opacity-90 grayscale contrast-150" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none p-4 text-[14px] leading-relaxed text-white/90 font-medium">
                {insight}
              </div>
            </div>
          ))}
        </div>
      </motion.div>


      {/* -------------------------------------------------------------
          ROW 4: HISTORICAL PIPELINE TRACKER (Verarbeitungs-Historie)
          ------------------------------------------------------------- */}
      <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-shading/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Archive className="w-64 h-64" />
        </div>
        
        <div className="flex flex-col gap-4 mb-8 relative z-10">
          <div>
            <h3 className="font-bold text-core text-xl flex items-center gap-2">Verarbeitungs-Historie</h3>
            <p className="text-sm text-core/50 mt-1">Lückenlose Nachverfolgung des GoBD-Workflows und ZUGFeRD-Konvertierung.</p>
          </div>
          
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex flex-wrap gap-6 text-xs text-core/70 font-medium w-fit">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /> <span className="font-bold text-core">Archiviert:</span> Alle GoBD-Schritte abgeschlossen.</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-action" /> <span className="font-bold text-core">In Bearbeitung:</span> ZUGFeRD bereit für Export.</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> <span className="font-bold text-core">Aktion erforderlich:</span> Belege fehlerhaft (siehe Details).</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 relative z-10">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-mono font-bold text-core/40 uppercase tracking-widest border-b border-shading/20">
            <div className="col-span-2">Monat</div>
            <div className="col-span-1">Belege</div>
            <div className="col-span-3">ZUGFeRD Fortschritt</div>
            <div className="col-span-6 text-right">Prozess-Details & Status</div>
          </div>

          {flowCheckData.map((row, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-4 items-center px-6 py-5 bg-gray-50/50 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-shading/10">
              <div className="col-span-2 font-bold text-core text-base">{row.month}</div>
              
              <div className="col-span-1 font-mono font-bold text-core">{row.generated}</div>
              
              <div className="col-span-3 flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11px] font-mono font-bold">
                    <span className="text-core/60">{row.zugferd} von {row.generated} Belegen konvertiert</span>
                    <span className={row.zugferd === row.generated ? "text-green-500" : "text-action"}>{Math.round((row.zugferd/row.generated)*100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", row.zugferd === row.generated ? "bg-green-500" : "bg-action")} style={{ width: `${(row.zugferd/row.generated)*100}%` }} />
                  </div>
              </div>

              <div className="col-span-6 flex items-center justify-end gap-6">
                <span className={cn("text-xs text-right leading-tight max-w-[300px]", row.status === 'attention' ? "text-red-500 font-bold" : "text-core/60")}>
                  {row.desc}
                </span>

                <span className={cn(
                  "text-[10px] font-mono font-black uppercase tracking-widest px-4 py-2 rounded-lg border min-w-[140px] text-center shrink-0",
                  row.status === 'completed' ? "bg-green-500/10 text-green-600 border-green-500/20" : 
                  row.status === 'attention' ? "bg-red-500/10 text-red-600 border-red-500/20" : 
                  "bg-action/10 text-action border-action/20"
                )}>
                  {row.status === 'completed' ? 'Archiviert' : row.status === 'attention' ? 'Aktion nötig' : 'In Bearbeitung'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* -------------------------------------------------------------
          ROW 5: GEOGRAPHY (Interactive Map & Region Leaderboard)
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        <motion.div variants={itemVariants} className="xl:col-span-2 bg-white rounded-[32px] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-shading/10 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-core/5 flex items-center justify-center">
              <Map className="w-6 h-6 text-core" />
            </div>
            <div>
              <h3 className="font-bold text-core text-lg">Geografische Verteilung</h3>
              <p className="text-xs text-core/50 font-mono">Hotspots & Umsatzkonzentration (Simulation München)</p>
            </div>
          </div>
          
          <div className="text-xs text-core/60 mb-6 bg-gray-50 p-3 rounded-xl w-fit">
            Jeder Radius auf der Karte repräsentiert das fakturierte Volumen in diesem Postleitzahlengebiet.
          </div>

          <div className="flex-1 w-full min-h-[300px] bg-gray-50 rounded-2xl overflow-hidden border border-shading/10 relative z-0">
            <MapComponent geoData={mapData} />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-shading/10 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-action/10 flex items-center justify-center">
              <Map className="w-6 h-6 text-action" />
            </div>
            <div>
              <h3 className="font-bold text-core text-lg">Top Regionen</h3>
              <p className="text-xs text-core/50 font-mono">Volumen nach PLZ ({selectedYear})</p>
            </div>
          </div>

          <div className="flex flex-col gap-5 flex-1">
            {geoLeaderboard.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="font-mono font-black text-xl text-core/20 w-6">{item.rank}</div>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-bold text-core text-sm truncate pr-2">{item.name.split(' ')[0]}</span>
                    <span className="font-mono text-sm font-bold text-core">{item.amount.toLocaleString('de-DE')} €</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${item.share}%` }} 
                        transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                        className={cn("h-full rounded-full", item.rank === 1 ? "bg-action" : "bg-core")} 
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-core/50 w-24">Anteil: {item.share.toFixed(1)}%</span>
                    <span className={cn(
                      "text-[10px] font-mono font-bold flex items-center w-16",
                      item.status === 'up' ? "text-green-500" : "text-red-500"
                    )}>
                      {item.status === 'up' ? '▲' : '▼'} {Math.abs(item.growth).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

    </motion.div>
  );
}
