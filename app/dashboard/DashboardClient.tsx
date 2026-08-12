"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Sector } from 'recharts';
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

export default function DashboardClient({ profile, channels, invoices }: any) {
  const [timeframe, setTimeframe] = useState<Timeframe>('monat');

  // 1. ADVANCED MOCK DATA OVERRIDES (For the "Championship" Density)
  // We use actual invoices for basic counts, but heavily mock the complex historical stuff to show the ultimate UI.
  
  const totalBilled = 124500.50; // Mocked High Revenue for visual impact
  const previousPeriodBilled = 108200.00;
  const growth = ((totalBilled - previousPeriodBilled) / previousPeriodBilled) * 100;
  
  const forecast = totalBilled * 1.18; // 18% projected growth
  
  // Leaderboard Mock Data (The "Race")
  const leaderboard = [
    { rank: 1, name: "Amazon AWS", amount: 45000, share: 36, growth: 12.5, status: 'up' },
    { rank: 2, name: "Shell Fleet", amount: 32000, share: 25, growth: -4.2, status: 'down' },
    { rank: 3, name: "Adobe Systems", amount: 18500, share: 15, growth: 22.1, status: 'up' },
    { rank: 4, name: "Salesforce", amount: 12000, share: 10, growth: 5.0, status: 'up' },
  ];

  // AI Insights
  const aiInsights = [
    "Das Volumen bei 'Adobe Systems' ist um 22% gestiegen. Ein Rahmenvertrag könnte Kosten senken.",
    "Die ZUGFeRD-Konvertierungsrate liegt stabil bei 99.8%. Perfekter Flow.",
    "Prognose: Der August wird das stärkste Quartal seit Aufzeichnung beenden (+18% über Ziel)."
  ];

  // Flow Check Pipeline (Historical Tracker)
  const flowCheckData = [
    { month: 'August', generated: 215, zugferd: 215, clientSent: 212, taxSent: false, zipDays: 4, status: 'active' },
    { month: 'Juli', generated: 482, zugferd: 482, clientSent: 480, taxSent: true, zipDays: 0, status: 'completed' },
    { month: 'Juni', generated: 410, zugferd: 410, clientSent: 410, taxSent: true, zipDays: 0, status: 'completed' },
    { month: 'Mai', generated: 385, zugferd: 384, clientSent: 384, taxSent: true, zipDays: 0, status: 'completed' },
  ];

  // Trend Data (Current vs Previous)
  const trendData = [
    { name: 'W1', current: 12000, previous: 9000 },
    { name: 'W2', current: 28000, previous: 22000 },
    { name: 'W3', current: 45000, previous: 38000 },
    { name: 'W4', current: 82000, previous: 75000 },
    { name: 'W5', current: 124500, previous: 108200 },
  ];

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
              {totalBilled.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
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
              <p className="text-xs text-core/50 font-mono">Monatliches Volumen-Ranking</p>
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
                    <span className="text-[10px] font-mono font-bold text-core/50 w-8">{item.share}%</span>
                    <span className={cn(
                      "text-[10px] font-mono font-bold flex items-center w-12",
                      item.status === 'up' ? "text-green-500" : "text-red-500"
                    )}>
                      {item.status === 'up' ? '▲' : '▼'} {Math.abs(item.growth)}%
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
                <p className="text-xs text-core/50 font-mono">Aktueller Zeitraum vs. Vorperiode</p>
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
          ROW 3: KI INSIGHTS & OPERATIONAL HEALTH
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* AI INSIGHTS WIDGET */}
        <motion.div variants={itemVariants} className="bg-core text-white rounded-[32px] p-8 shadow-[0_10px_40px_rgba(45,49,66,0.3)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Sparkles className="w-5 h-5 text-action" />
            </div>
            <h3 className="font-bold text-lg">Futrdesk Intelligence</h3>
          </div>
          <div className="flex flex-col gap-4 relative z-10 flex-1 justify-center">
            {aiInsights.map((insight, idx) => (
              <div key={idx} className="flex gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-action shrink-0 mt-1.5" />
                <p className="text-white/80 leading-relaxed font-sans">{insight}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CHANNELS WIDGET */}
        <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-shading/10 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-core text-lg">Inbound-Kanäle</h3>
            <p className="text-sm text-core/50 mt-1">Lauschende Gateways</p>
          </div>
          
          <div className="flex items-center gap-4 mt-8">
            <div className="flex-1 h-16 rounded-2xl bg-gray-50 border border-shading/20 flex items-center justify-center relative group">
              <Smartphone className="w-6 h-6 text-[#25D366]" />
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
            </div>
            <div className="flex-1 h-16 rounded-2xl bg-gray-50 border border-shading/20 flex items-center justify-center relative group">
              <Send className="w-6 h-6 text-[#0088cc]" />
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
            </div>
            <div className="flex-1 h-16 rounded-2xl bg-gray-50 border border-shading/20 flex items-center justify-center relative group opacity-50">
              <Mail className="w-6 h-6 text-core" />
              {/* Not connected mock */}
            </div>
          </div>
        </motion.div>

        {/* LIMITS WIDGET */}
        <motion.div variants={itemVariants} className="bg-white rounded-[32px] p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border border-shading/10 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-core text-lg">Infrastruktur</h3>
              <p className="text-sm text-core/50 mt-1">Abo-Tarif: <span className="font-mono font-bold text-core">{profile?.tier || 'STARTER'}</span></p>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="flex justify-between items-end mb-2">
              <span className="font-mono text-xs text-core/60 uppercase tracking-widest">Auslastung</span>
              <span className="font-mono text-sm font-bold text-core">{usedInvoices} <span className="text-core/40">/ {maxInvoices}</span></span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-action rounded-full transition-all duration-1000 relative overflow-hidden" style={{ width: `${Math.min(100, (usedInvoices / maxInvoices) * 100)}%` }}>
                <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite] -translate-x-full" />
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
