"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { TrendingUp, Users, CheckCircle2, Smartphone, Send, Mail, Map, Zap, ArrowUpRight, ArrowDownRight, Clock, Archive, Trophy, Sparkles, Activity, Info, FileText, Bot, AlertTriangle, Database } from "lucide-react";
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
  const [customLogo, setCustomLogo] = useState<string | null>(null);

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
      data.push({ name: '1', Aktuell: currentBilled * 0.2, Vorher: previousBilled * 0.25 });
      data.push({ name: '2', Aktuell: currentBilled * 0.25, Vorher: previousBilled * 0.25 });
      data.push({ name: '3', Aktuell: currentBilled * 0.35, Vorher: previousBilled * 0.25 });
      data.push({ name: '4', Aktuell: currentBilled * 0.2, Vorher: previousBilled * 0.25 });
    }
    return data;
  }, [timeframe, currentPeriodInvoices, previousPeriodInvoices, currentBilled, previousBilled]);
  const flowCheckData = [
    { month: `August ${String(selectedYear).slice(2)}`, generated: 142, zugferd: 139, clientSent: 139, taxSent: false, zipDays: 19, status: 'attention', desc: '3 Belege fehlerhaft. Stammdaten unvollständig (Steuernummer fehlt). Bitte manuell korrigieren.' },
    { month: `Juli ${String(selectedYear).slice(2)}`, generated: 450, zugferd: 450, clientSent: 450, taxSent: true, zipDays: 0, status: 'completed', desc: 'Sammel-Export erfolgreich an DATEV übermittelt. Zyklus GoBD-konform geschlossen.' },
    { month: `Juni ${String(selectedYear).slice(2)}`, generated: 480, zugferd: 480, clientSent: 480, taxSent: true, zipDays: 0, status: 'completed', desc: 'Sammel-Export erfolgreich an DATEV übermittelt. Zyklus GoBD-konform geschlossen.' },
    { month: `Mai ${String(selectedYear).slice(2)}`, generated: 512, zugferd: 512, clientSent: 512, taxSent: true, zipDays: 0, status: 'completed', desc: 'Sammel-Export erfolgreich an DATEV übermittelt. Zyklus GoBD-konform geschlossen.' },
  ];

  // AI Analysis Generation based on real data (Report Style)
  const generateAiInsights = () => {
    return [
      `Basierend auf der aktuellen Datenlage für ${selectedYear} zeigt sich eine deutliche saisonale Prägung im August. Das aktuelle Fakturierungsvolumen liegt bei 142 Belegen, was einem temporären Rückgang entspricht.`,
      `Die KI-Hochrechnung prognostiziert für das Quartalsende jedoch einen starken Rebound auf ca. ${forecast.toLocaleString('de-DE', {style:'currency', currency:'EUR'})}, angetrieben durch das konstante Wachstum in der Kernregion München (80333). Keine kritischen Liquiditätsengpässe erkennbar.`
    ];
  };
  const aiInsights = generateAiInsights();

  if (!mounted) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-core/20">Inititalisiere Dashboard Engine...</div>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-10 relative w-full overflow-hidden">
      
      {/* -------------------------------------------------------------
          HEADER & SUPER-METRICS (The Cockpit)
          ------------------------------------------------------------- */}
      <motion.div variants={itemVariants} className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 bg-white/90 backdrop-blur-sm p-8 rounded-[32px] shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-shading/10 relative overflow-hidden z-10">
        
        {/* Hidden File Input for Logo */}
        <input 
          type="file" 
          id="logo-upload" 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => { 
            if(e.target.files?.[0]) {
              const newUrl = URL.createObjectURL(e.target.files[0]);
              setCustomLogo(newUrl);
              window.dispatchEvent(new CustomEvent('logo-updated', { detail: newUrl }));
            }
          }} 
        />

        <div className="flex flex-col gap-5 relative z-10">
          <h2 className="text-xl font-black text-core tracking-tight uppercase mb-2">{profile?.company_name || 'FutrDesk GmbH'}</h2>
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

        {/* RIGHT SIDE: COMPANY & TIME TOGGLE */}
        <div className="flex flex-col items-end gap-8 shrink-0 relative z-10">
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl shadow-inner border border-shading/10">
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
        </div>

        {/* Hero Logo Absolute Background Element */}
        <div 
          className="absolute top-6 right-6 w-80 h-80 opacity-20 mix-blend-multiply cursor-pointer group z-0 transition-transform hover:scale-105"
          onClick={() => document.getElementById('logo-upload')?.click()}
        >
          <Image src={customLogo || "/image.png"} fill className="object-contain object-right-top" alt="Company Logo" />
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 backdrop-blur-sm rounded-full m-8 border border-white/50 shadow-sm text-center p-4">
            <span className="text-core font-bold text-sm mb-1">Logo ändern</span>
            <span className="text-core/60 text-[10px] font-medium leading-tight">Format 1:1 (z.B. 1000x1000px)<br/>Max. 5 MB</span>
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
                <XAxis dataKey="name" hide />
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef8354" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef8354" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  cursor={{ fill: 'transparent' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 'bold' }}
                  formatter={(value: number) => [value.toLocaleString('de-DE', {style: 'currency', currency: 'EUR'}), 'Fakturierter Umsatz']}
                  labelFormatter={(label) => {
                    if (timeframe === 'jahr') return `Monat ${label}`;
                    if (timeframe === 'monat') return `Kalenderwoche ${label}`;
                    return `Quartal ${label}`;
                  }}
                />
                <Area type="monotone" dataKey="Vorher" stroke="#2d3142" strokeOpacity={0.2} strokeWidth={2} strokeDasharray="5 5" fill="none" />
                <Area type="monotone" dataKey="Aktuell" stroke="#ef8354" strokeWidth={4} fillOpacity={1} fill="url(#colorCurrent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* -------------------------------------------------------------
          ROW 3: KI INSIGHTS WIDGET (Report/Analyse)
          ------------------------------------------------------------- */}
      <motion.div variants={itemVariants} className="bg-core text-white rounded-[32px] p-6 lg:p-10 shadow-[0_10px_40px_rgba(45,49,66,0.3)] flex flex-col xl:flex-row items-stretch gap-10 relative overflow-hidden">
        
        {/* Left: Modern Sleek Visual */}
        <div className="w-full xl:w-1/3 relative z-10 flex flex-col justify-center items-start xl:border-r border-white/10 xl:pr-10 min-h-[250px]">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
               <Activity className="w-5 h-5 text-action" />
             </div>
             <div>
               <h3 className="text-xl font-black text-white leading-none">KI Prognose</h3>
               <span className="text-xs text-white/50 font-mono">Real-Time Analyse</span>
             </div>
           </div>
           
           <div className="w-full flex-1 relative bg-white/5 rounded-2xl border border-white/10 p-6 flex flex-col justify-end overflow-hidden">
             {/* Abstract modern visual representing forecasting */}
             <div className="flex items-end gap-2 h-full w-full opacity-80">
               {[40, 60, 45, 80, 50, 100].map((h, i) => (
                 <div key={i} className="flex-1 bg-gradient-to-t from-action to-action/20 rounded-t-sm" style={{ height: `${h}%` }} />
               ))}
             </div>
             <div className="absolute top-6 left-6">
               <div className="text-3xl font-black font-mono tracking-tighter text-white">{forecast.toLocaleString('de-DE', {style:'currency', currency:'EUR'})}</div>
               <div className="text-xs text-action font-bold uppercase tracking-widest mt-1">Erwarteter Endspurt</div>
             </div>
           </div>
        </div>

        {/* Right: ChatGPT Screenshot Mockup */}
        <div className="flex-1 flex flex-col justify-center relative z-10 w-full rounded-2xl overflow-hidden border border-white/10">
          {/* Mock Header */}
          <div className="h-12 border-b border-white/10 flex items-center px-4 bg-white/5 backdrop-blur relative z-10">
            <span className="text-xs font-bold bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">{(profile?.company_name || 'FutrDesk').split(' ')[0]} Intelligence Model v4</span>
          </div>
          
          <div className="p-6 flex flex-col gap-6 bg-transparent max-h-[300px] overflow-y-auto relative z-10">
            {/* User Prompt Mock */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden relative shadow-sm">
                <Image src={customLogo || "/image.png"} fill className="object-contain p-1 mix-blend-multiply scale-90" alt="User" />
              </div>
              <div className="pt-1.5">
                <p className="text-sm font-semibold text-white/90">Generiere einen aktuellen Performance-Bericht inkl. saisonaler Effekte.</p>
              </div>
            </div>

            {/* AI Response Mock (with glow mood) */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-action/10 border border-action/20 flex items-center justify-center shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-action/20 to-transparent animate-pulse" />
                <Sparkles className="w-4 h-4 text-action relative z-10" />
              </div>
              <div className="flex flex-col gap-3 pt-1">
                {aiInsights.map((insight, idx) => (
                  <p key={idx} className="text-sm text-white/70 leading-relaxed font-medium">
                    {insight}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>


      {/* -------------------------------------------------------------
          ROW 4: HISTORICAL PIPELINE TRACKER (Verarbeitungs-Historie)
          ------------------------------------------------------------- */}
      <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-shading/10 overflow-hidden relative">
        <div 
          className="absolute top-6 right-6 w-80 h-80 pointer-events-none opacity-20 mix-blend-multiply" 
        >
          <Image src={customLogo || "/image.png"} fill className="object-contain object-right-top" alt="Watermark" />
        </div>
        
        <div className="flex flex-col gap-4 mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
              <Database className="w-5 h-5 text-core" />
            </div>
            <div>
              <h3 className="text-xl font-black text-core leading-none">Verarbeitungs-Historie</h3>
            </div>
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
                <span className={cn("text-xs text-right leading-tight max-w-[250px]", row.status === 'attention' ? "text-red-500 font-bold" : "text-core/60")}>
                  {row.desc}
                </span>

                {row.status === 'attention' ? (
                  <a href="/dashboard/archive?filter=needs_fix" className="flex items-center justify-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-widest px-4 py-2 rounded-lg border min-w-[140px] text-center shrink-0 bg-red-500 text-white border-red-600 hover:bg-red-600 transition-colors shadow-[0_4px_14px_rgba(239,68,68,0.3)]">
                    Jetzt beheben <ArrowUpRight className="w-3 h-3" />
                  </a>
                ) : (
                  <span className={cn(
                    "text-[10px] font-mono font-black uppercase tracking-widest px-4 py-2 rounded-lg border min-w-[140px] text-center shrink-0",
                    row.status === 'completed' ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-action/10 text-action border-action/20"
                  )}>
                    {row.status === 'completed' ? 'Archiviert' : 'In Bearbeitung'}
                  </span>
                )}
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
            <MapComponent geoData={mapData} logoUrl={customLogo || '/image.png'} />
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
