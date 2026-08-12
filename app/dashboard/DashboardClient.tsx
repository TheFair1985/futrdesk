"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { TrendingUp, Users, CheckCircle2, Smartphone, Send, Mail, Map, Zap, ArrowUpRight, ArrowDownRight, Clock, Archive, Trophy, Sparkles, Activity } from "lucide-react";
import { cn } from "../../lib/utils";

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
};

type Timeframe = 'monat' | 'quartal' | 'jahr';

// --- MOCK DATA GENERATOR (2025 & 2026 Seasonality + Munich Geofence) ---
const generateMockInvoices = () => {
  const invoices = [];
  const start = new Date(2025, 0, 1);
  const end = new Date(2026, 7, 12); // August 12, 2026

  const customers = [
    { name: "Amazon AWS", share: 0.35 },
    { name: "Shell Fleet", share: 0.25 },
    { name: "Adobe Systems", share: 0.15 },
    { name: "Salesforce", share: 0.10 },
    { name: "Telekom", share: 0.10 },
    { name: "Microsoft", share: 0.05 }
  ];

  // Munich & 150km radius PLZs
  const regions = [
    { name: "München Zentrum (80333)", zip: "80333", prob: 0.4 },
    { name: "Augsburg (86150)", zip: "86150", prob: 0.2 },
    { name: "Ingolstadt (85049)", zip: "85049", prob: 0.15 },
    { name: "Rosenheim (83022)", zip: "83022", prob: 0.15 },
    { name: "Garmisch (82467)", zip: "82467", prob: 0.1 },
  ];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const month = d.getMonth(); // 0 = Jan, 1 = Feb, 7 = Aug
    const isBadMonth = month === 0 || month === 1 || month === 7;
    
    // Base daily probability of an invoice
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

      // Random amount between 150 and 900
      const amount = Math.floor(Math.random() * 750) + 150;

      invoices.push({
        id: `INV-${d.getTime()}-${i}`,
        created_at: new Date(d).toISOString(),
        vendor_name: selectedCustomer,
        gross_amount: amount,
        status: Math.random() > 0.05 ? 'completed' : 'needs_fix',
        zip_code: selectedRegion.zip,
        region_name: selectedRegion.name
      });
    }
  }
  return invoices;
};

const cachedMockInvoices = generateMockInvoices();

export default function DashboardClient({ profile }: any) {
  const [timeframe, setTimeframe] = useState<Timeframe>('jahr'); // Default to year to show off seasonality

  // FILTER LOGIC
  const now = new Date(2026, 7, 12); // Simulated "now" is August 12, 2026
  
  const currentPeriodInvoices = useMemo(() => {
    return cachedMockInvoices.filter((inv) => {
      const d = new Date(inv.created_at);
      if (timeframe === 'monat') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (timeframe === 'quartal') return Math.floor(d.getMonth() / 3) === Math.floor(now.getMonth() / 3) && d.getFullYear() === now.getFullYear();
      if (timeframe === 'jahr') return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [timeframe]);

  const previousPeriodInvoices = useMemo(() => {
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
  }, [timeframe]);

  const currentBilled = currentPeriodInvoices.reduce((sum, inv) => sum + inv.gross_amount, 0);
  const previousBilled = previousPeriodInvoices.reduce((sum, inv) => sum + inv.gross_amount, 0);
  const growth = previousBilled === 0 ? 0 : ((currentBilled - previousBilled) / previousBilled) * 100;

  // FORECAST LOGIC
  const forecast = useMemo(() => {
    if (timeframe === 'monat') return (currentBilled / 12) * 31; // Extrapolate August 12
    if (timeframe === 'quartal') return (currentBilled / 42) * 90; // Approx 42 days into Q3
    if (timeframe === 'jahr') return (currentBilled / 224) * 365; // Approx 224 days into 2026
    return currentBilled;
  }, [timeframe, currentBilled]);

  // LEADERBOARD LOGIC
  const getLeaderboard = (invoices: any[]) => {
    const map: Record<string, number> = {};
    invoices.forEach(i => map[i.vendor_name] = (map[i.vendor_name] || 0) + i.gross_amount);
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

  const currentLeaderboard = getLeaderboard(currentPeriodInvoices);
  const prevLeaderboard = getLeaderboard(previousPeriodInvoices);
  const leaderboard = currentLeaderboard.map(curr => {
    const prev = prevLeaderboard.find(p => p.name === curr.name);
    const pAmount = prev ? prev.amount : 0;
    const g = pAmount === 0 ? 100 : ((curr.amount - pAmount) / pAmount) * 100;
    return { ...curr, growth: g, status: g >= 0 ? 'up' : 'down' };
  });

  // GEO DATA
  const getGeoData = (invoices: any[]) => {
    const map: Record<string, number> = {};
    invoices.forEach(i => map[i.region_name] = (map[i.region_name] || 0) + i.gross_amount);
    return Object.entries(map).map(([region, value]) => ({ region, value }));
  };
  const geoData = getGeoData(currentPeriodInvoices);

  // TREND DATA
  const trendData = useMemo(() => {
    const data = [];
    if (timeframe === 'jahr') {
      for (let i = 0; i < 12; i++) {
        const currMonth = currentPeriodInvoices.filter(inv => new Date(inv.created_at).getMonth() === i).reduce((s,i)=>s+i.gross_amount,0);
        const prevMonth = previousPeriodInvoices.filter(inv => new Date(inv.created_at).getMonth() === i).reduce((s,i)=>s+i.gross_amount,0);
        const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
        data.push({ name: monthNames[i], current: currMonth, previous: prevMonth });
      }
    } else if (timeframe === 'monat') {
      // 4 weeks roughly
      for(let i=0; i<4; i++) {
        data.push({ name: `W${i+1}`, current: currentBilled * (0.2 + (i*0.05)), previous: previousBilled * 0.25 }); // Highly mocked shape
      }
    } else {
      data.push({ name: 'M1', current: currentBilled * 0.3, previous: previousBilled * 0.33 });
      data.push({ name: 'M2', current: currentBilled * 0.4, previous: previousBilled * 0.33 });
      data.push({ name: 'M3', current: currentBilled * 0.3, previous: previousBilled * 0.33 });
    }
    return data;
  }, [timeframe, currentPeriodInvoices, previousPeriodInvoices, currentBilled, previousBilled]);

  // FLOW CHECK (Historial Tracker for 2026)
  const flowCheckData = [
    { month: 'August 26', generated: 142, zugferd: 142, clientSent: 140, taxSent: false, zipDays: 19, status: 'active' },
    { month: 'Juli 26', generated: 450, zugferd: 450, clientSent: 449, taxSent: true, zipDays: 0, status: 'completed' },
    { month: 'Juni 26', generated: 480, zugferd: 480, clientSent: 480, taxSent: true, zipDays: 0, status: 'completed' },
    { month: 'Mai 26', generated: 512, zugferd: 510, clientSent: 510, taxSent: true, zipDays: 0, status: 'completed' },
    { month: 'Apr 26', generated: 490, zugferd: 490, clientSent: 490, taxSent: true, zipDays: 0, status: 'completed' },
    { month: 'Mär 26', generated: 520, zugferd: 520, clientSent: 520, taxSent: true, zipDays: 0, status: 'completed' },
  ];

  // AI Insights Generation based on real data
  const generateAiInsights = () => {
    const insights = [];
    
    // Seasonality insight
    if (timeframe === 'jahr') {
      insights.push(`Saisonales Muster erkannt: Januar, Februar und August zeigen konsistente Umsatzdellen (-60% vs. Jahresdurchschnitt). Urlaubszeiten einkalkulieren.`);
    } else if (timeframe === 'monat' && now.getMonth() === 7) {
      insights.push(`Warnung: Der August-Umsatz ist traditionell schwach. Die KI-Prognose rechnet mit ${forecast.toLocaleString('de-DE', {style:'currency', currency:'EUR'})} am Monatsende.`);
    }

    // Geofence insight
    const munichShare = geoData.find(g => g.region.includes('80333'))?.value || 0;
    const munichPercent = currentBilled > 0 ? Math.round((munichShare / currentBilled) * 100) : 0;
    if (munichPercent > 30) {
      insights.push(`Extremer lokaler Fokus: ${munichPercent}% des fakturierten Umsatzes entsteht im 15km Radius um München Zentrum (80333).`);
    }

    // Customer insight
    if (leaderboard.length > 0 && leaderboard[0].growth > 10) {
      insights.push(`Abhängigkeitswarnung: '${leaderboard[0].name}' wächst rasant (+${leaderboard[0].growth.toFixed(1)}%) und macht nun ${leaderboard[0].share.toFixed(1)}% des Gesamtvolumens aus.`);
    }

    return insights;
  };
  const aiInsights = generateAiInsights();

  const limits = { 'STARTER': 25, 'PRO': 75, 'BUSINESS': 150 };
  const maxInvoices = (limits as any)[profile?.tier || 'STARTER'] || 25;
  const usedInvoices = profile?.invoices_used_this_month || 0;
  
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-10">
      
      {/* -------------------------------------------------------------
          HEADER & SUPER-METRICS (The Cockpit)
          ------------------------------------------------------------- */}
      <motion.div variants={itemVariants} className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 bg-white p-8 rounded-[32px] shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-shading/10">
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-core font-sans">
              {currentBilled.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </h1>
            <div className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm",
              growth > 0 ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"
            )}>
              {growth > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(growth).toFixed(1)}% vs. {timeframe === 'monat' ? 'Vormonat' : 'Vorjahr'}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-core/50 font-medium flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-action" /> Fakturierter Ausgangsumsatz
            </span>
            <div className="h-4 w-px bg-shading/30" />
            <span className="text-action font-bold flex items-center gap-1.5 bg-action/5 px-2 py-1 rounded-md">
              <Zap className="w-4 h-4" /> KI-Prognose: {forecast.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
        </div>

        {/* TIME TOGGLE */}
        <div className="flex items-center bg-gray-50/80 p-1.5 rounded-2xl shadow-inner border border-shading/10 w-fit shrink-0">
          {(['monat', 'quartal', 'jahr'] as Timeframe[]).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={cn(
                "relative px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-colors z-10",
                timeframe === t ? "text-core" : "text-core/40 hover:text-core/80"
              )}
            >
              {timeframe === t && (
                <motion.div layoutId="timeframe-bubble" className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.06)] border border-shading/5 -z-10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              {t}
            </button>
          ))}
        </div>
      </motion.div>


      {/* -------------------------------------------------------------
          ROW 1: THE RACE (Leaderboard & Trend)
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEADERBOARD (Top Customers Championship) */}
        <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-shading/10 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-action/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-action" />
            </div>
            <div>
              <h3 className="font-bold text-core text-lg">Top Kunden Race</h3>
              <p className="text-xs text-core/50 font-mono">Volumen-Ranking ({timeframe})</p>
            </div>
          </div>

          <div className="flex flex-col gap-5 flex-1">
            {leaderboard.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className="font-mono font-black text-xl text-core/20 w-6">{item.rank}</div>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="font-bold text-core text-sm truncate pr-2">{item.name}</span>
                    <span className="font-mono text-sm font-bold text-core">{item.amount.toLocaleString('de-DE')} €</span>
                  </div>
                  
                  {/* Dense Data Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${item.share}%` }} 
                        transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                        className={cn("h-full rounded-full", item.rank === 1 ? "bg-action" : "bg-core")} 
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-core/50 w-8">{item.share.toFixed(1)}%</span>
                    <span className={cn(
                      "text-[10px] font-mono font-bold flex items-center w-14",
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

        {/* REVENUE TREND (Dense Area Chart) */}
        <motion.div variants={itemVariants} className="xl:col-span-2 bg-white rounded-[32px] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-shading/10 flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-core/5 flex items-center justify-center">
                <Activity className="w-6 h-6 text-core" />
              </div>
              <div>
                <h3 className="font-bold text-core text-lg">Cashflow Momentum</h3>
                <p className="text-xs text-core/50 font-mono">Aktueller Zeitraum vs. Vorperiode (inkl. Saisonalität)</p>
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-bold font-mono bg-gray-50 px-4 py-2 rounded-xl">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-action" /> Aktuell</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-core/20" /> Vorher</div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[260px] -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef8354" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef8354" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }} itemStyle={{ fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="previous" stroke="#2d3142" strokeOpacity={0.2} strokeWidth={2} strokeDasharray="5 5" fill="none" />
                <Area type="monotone" dataKey="current" stroke="#ef8354" strokeWidth={4} fillOpacity={1} fill="url(#colorCurrent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>


      {/* -------------------------------------------------------------
          ROW 2: THE FLOW CHECK (Historical Pipeline Tracker)
          ------------------------------------------------------------- */}
      <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-shading/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Archive className="w-64 h-64" />
        </div>
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h3 className="font-bold text-core text-xl">Flow Check / GoBD Pipeline</h3>
            <p className="text-sm text-core/50 mt-1">Lückenlose Nachverfolgung der Ausgangsrechnungen</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 relative z-10">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-mono font-bold text-core/40 uppercase tracking-widest border-b border-shading/20">
            <div className="col-span-2">Monat</div>
            <div className="col-span-2">Generiert</div>
            <div className="col-span-3">ZUGFeRD & Client</div>
            <div className="col-span-3">Steuerberater Export</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          {/* Table Rows */}
          {flowCheckData.map((row, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-4 items-center px-6 py-4 bg-gray-50/50 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-shading/10 group">
              <div className="col-span-2 font-bold text-core">{row.month}</div>
              
              <div className="col-span-2 font-mono font-bold text-core">{row.generated} <span className="text-core/40 text-xs">Belege</span></div>
              
              <div className="col-span-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] font-mono font-bold mb-1.5">
                    <span className="text-core/60">ZUGFeRD</span>
                    <span className={row.zugferd === row.generated ? "text-green-500" : "text-action"}>{Math.round((row.zugferd/row.generated)*100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className={cn("h-full rounded-full", row.zugferd === row.generated ? "bg-green-500" : "bg-action")} style={{ width: `${(row.zugferd/row.generated)*100}%` }} /></div>
                </div>
              </div>

              <div className="col-span-3 flex items-center gap-2">
                {row.taxSent ? (
                  <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-lg text-xs font-bold w-fit border border-green-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ZIP übertragen
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-action/10 text-action px-3 py-1.5 rounded-lg text-xs font-bold w-fit border border-action/20">
                    <Clock className="w-3.5 h-3.5" /> Auto-Export in {row.zipDays} Tagen
                  </div>
                )}
              </div>

              <div className="col-span-2 flex justify-end">
                <span className={cn(
                  "text-[10px] font-mono font-black uppercase tracking-widest px-3 py-1.5 rounded-full border",
                  row.status === 'completed' ? "bg-core/5 text-core/50 border-core/10" : "bg-green-500 text-white border-green-600 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                )}>
                  {row.status === 'completed' ? 'Archiviert' : 'Live'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* -------------------------------------------------------------
          ROW 3: KI INSIGHTS & GEOFENCING
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* GEO MAPPING WIDGET (Munich Radius) */}
        <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-shading/10 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-core/5 flex items-center justify-center">
              <Map className="w-5 h-5 text-core" />
            </div>
            <div>
              <h3 className="font-bold text-core">Kunden-Geofence</h3>
              <p className="text-xs text-core/40">150km Radius um 80333 München</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center mt-4 -ml-6">
            <ResponsiveContainer width="110%" height={220}>
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={geoData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="region" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                <Radar dataKey="value" stroke="#ef8354" strokeWidth={2} fill="#ef8354" fillOpacity={0.2} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 'bold' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI INSIGHTS WIDGET */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-core text-white rounded-[32px] p-8 shadow-[0_10px_40px_rgba(45,49,66,0.3)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Sparkles className="w-6 h-6 text-action" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Futrdesk Intelligence</h3>
              <p className="text-white/40 text-xs font-mono">Echtzeit Analyse der Ausgangsrechnungen</p>
            </div>
          </div>
          <div className="flex flex-col gap-5 relative z-10 flex-1 justify-center">
            {aiInsights.map((insight, idx) => (
              <div key={idx} className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="w-2 h-2 rounded-full bg-action shrink-0 mt-2" />
                <p className="text-white/90 leading-relaxed font-sans font-medium">{insight}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
