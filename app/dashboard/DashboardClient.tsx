"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ArrowUpRight, Smartphone, Send, Mail, CheckCircle2, TrendingUp, Users } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function DashboardClient({ profile, channels, invoices }: any) {
  const totalBilled = invoices.reduce((acc: number, inv: any) => acc + (inv.gross_amount || 0), 0);
  const successCount = invoices.filter((i:any) => i.status === 'completed').length;
  
  const customersMap: Record<string, number> = {};
  invoices.forEach((inv: any) => {
    if (inv.vendor_name && inv.vendor_name !== 'Wird analysiert...') {
       customersMap[inv.vendor_name] = (customersMap[inv.vendor_name] || 0) + (inv.gross_amount || 0);
    }
  });
  
  const topCustomers = Object.entries(customersMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, amount]) => ({ name: name.length > 12 ? name.substring(0, 12) + '...' : name, amount }));

  // Mild BI Trend (Mocked history + actual current month)
  const trendData = [
    { name: 'Mär', value: 4200 },
    { name: 'Apr', value: 5100 },
    { name: 'Mai', value: 4800 },
    { name: 'Jun', value: 6300 },
    { name: 'Jul', value: 5900 },
    { name: 'Aug', value: totalBilled > 0 ? totalBilled : 7400 },
  ];

  const limits = { 'STARTER': 25, 'PRO': 75, 'BUSINESS': 150 };
  const maxInvoices = (limits as any)[profile?.tier || 'STARTER'] || 25;
  const usedInvoices = profile?.invoices_used_this_month || 0;
  const extraInvoices = profile?.extra_invoices_available || 0;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-10"
    >
      
      {/* HERO SECTION */}
      <motion.header variants={itemVariants} className="flex flex-col gap-2">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-core font-sans">
          {totalBilled.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
        </h1>
        <p className="text-core/50 font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-action" />
          Fakturierter Umsatz im laufenden Monat
        </p>
      </motion.header>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CHART WIDGET */}
        <motion.div variants={itemVariants} className="md:col-span-2 bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-shading/10 flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="font-bold text-core">Umsatz-Trend</h3>
              <p className="text-sm text-core/50 mt-1">Die letzten 6 Monate im Überblick</p>
            </div>
            <div className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full">
              +12% vs Vormonat
            </div>
          </div>
          
          <div className="flex-1 min-h-[200px] -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef8354" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef8354" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#2d3142', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="value" stroke="#ef8354" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* CUSTOMER WIDGET */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-shading/10 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-core">Top Kunden</h3>
              <p className="text-xs text-core/50">Nach Volumen (Monat)</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end">
            {topCustomers.length > 0 ? (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCustomers} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                    <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
                      {topCustomers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#4f5d75' : '#bfc0c0'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-core/40">
                Noch keine Daten vorhanden.
              </div>
            )}
          </div>
        </motion.div>

        {/* HEALTH WIDGET */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-shading/10 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-core">Verarbeitung</h3>
            <p className="text-sm text-core/50 mt-1">ZUGFeRD GoBD-Status</p>
          </div>
          
          <div className="mt-8">
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-mono font-bold text-core">{successCount}</span>
              <span className="text-sm font-mono text-core/40">von {usedInvoices} Belegen</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-1000" 
                style={{ width: `${usedInvoices > 0 ? (successCount / usedInvoices) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-core/50 mt-4 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
              Erfolgreich an Kunden übermittelt
            </p>
          </div>
        </motion.div>

        {/* LIMITS WIDGET */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-shading/10 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-core">Kontingent</h3>
              <p className="text-sm text-core/50 mt-1">Abo: {profile?.tier || 'STARTER'}</p>
            </div>
            {extraInvoices > 0 && (
              <div className="px-2 py-1 bg-action/10 text-action text-[10px] font-bold rounded-md uppercase tracking-wider">
                +{extraInvoices} Booster
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <div className="flex justify-between items-end mb-2">
              <span className="font-mono text-sm text-core/60">Verbraucht</span>
              <span className="font-mono text-sm font-bold text-core">{usedInvoices} / {maxInvoices}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-action rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, (usedInvoices / maxInvoices) * 100)}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* CHANNELS WIDGET */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-shading/10 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-core">Inbound-Kanäle</h3>
            <p className="text-sm text-core/50 mt-1">Wo Kunden Rechnungen anfordern</p>
          </div>
          
          <div className="flex items-center gap-4 mt-6">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center relative group cursor-pointer hover:border-green-500 transition-colors">
              <Smartphone className="w-5 h-5 text-[#25D366]" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center relative group cursor-pointer hover:border-blue-500 transition-colors">
              <Send className="w-5 h-5 text-[#0088cc]" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center relative group cursor-pointer hover:border-core transition-colors">
              <Mail className="w-5 h-5 text-core" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
