"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronRight, FileText, AlertCircle, CheckCircle2, Clock, X, Code, Download, Zap, FileJson } from "lucide-react";
import { cn } from "../../../lib/utils";

const getISOWeek = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const formatCurrency = (value: number) => {
  return value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export default function ArchiveClient({ initialInvoices }: { initialInvoices: any[] }) {
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  
  // Sets to track expanded state
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set([7])); // Default August (7)
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set(initialInvoices.map(i => new Date(i.created_at).getFullYear()));
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [initialInvoices]);

  const filteredInvoices = useMemo(() => {
    return initialInvoices.filter(inv => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = (inv.vendor_name || '').toLowerCase().includes(q) ||
             (inv.id || '').toLowerCase().includes(q) ||
             (inv.gross_amount && inv.gross_amount.toString().includes(q));
      
      const invYear = new Date(inv.created_at).getFullYear();
      return invYear === selectedYear && matchesSearch;
    });
  }, [searchQuery, selectedYear, initialInvoices]);

  // Helper für Kunden-Avatare
  const getInitials = (name: string) => {
    return (name || 'UN').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700', 
      'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700', 'bg-indigo-100 text-indigo-700', 'bg-cyan-100 text-cyan-700'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const toggleMonth = (monthIdx: number) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthIdx)) next.delete(monthIdx);
      else next.add(monthIdx);
      return next;
    });
  };

  const toggleWeek = (weekKey: string) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekKey)) next.delete(weekKey);
      else next.add(weekKey);
      return next;
    });
  };

  // Group by Month -> Week -> Invoices
  const groupedData = useMemo(() => {
    const map = new Map<number, Map<number, any[]>>();
    
    filteredInvoices.forEach(inv => {
      const d = new Date(inv.created_at);
      const m = d.getMonth();
      const kw = getISOWeek(d);
      
      if (!map.has(m)) map.set(m, new Map());
      if (!map.get(m)!.has(kw)) map.get(m)!.set(kw, []);
      
      map.get(m)!.get(kw)!.push(inv);
    });

    const result = Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([monthIdx, weeksMap]) => {
        const weeks = Array.from(weeksMap.entries())
          .sort((a, b) => b[0] - a[0])
          .map(([kw, invoices]) => {
             const sortedInvoices = invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
             return { 
                 kw, 
                 invoices: sortedInvoices, 
                 total: sortedInvoices.reduce((sum, i) => sum + (i.gross_amount || 0), 0)
             };
          });
        return {
          monthIdx,
          monthName: monthNames[monthIdx],
          weeks,
          total: weeks.reduce((sum, w) => sum + w.total, 0),
          count: weeks.reduce((sum, w) => sum + w.invoices.length, 0)
        };
      });

    return result;
  }, [filteredInvoices]);

  const totalFilteredVolume = filteredInvoices.reduce((sum, i) => sum + (i.gross_amount || 0), 0);
  const pendingCount = filteredInvoices.filter(i => i.status === 'archived').length;

  const metrics = useMemo(() => {
    if (filteredInvoices.length === 0) {
      return { 
        topMonth: { name: '-', val: 0 }, 
        flopMonth: { name: '-', val: 0 }, 
        topCustomer: { name: '-', val: 0 }, 
        flopCustomer: { name: '-', val: 0 }, 
        topRegion: { name: '-', val: 0 }, 
        flopRegion: { name: '-', val: 0 } 
      };
    }

    const monthTotals = new Map<number, number>();
    const customerTotals = new Map<string, number>();
    const regionTotals = new Map<string, number>();

    filteredInvoices.forEach(inv => {
      const monthIdx = new Date(inv.created_at).getMonth();
      monthTotals.set(monthIdx, (monthTotals.get(monthIdx) || 0) + (inv.gross_amount || 0));

      const customer = inv.vendor_name || 'Unbekannt';
      customerTotals.set(customer, (customerTotals.get(customer) || 0) + (inv.gross_amount || 0));

      const region = (inv.region_name || 'Unbekannt').replace(/\s*\(\d+\)\s*/g, '');
      regionTotals.set(region, (regionTotals.get(region) || 0) + (inv.gross_amount || 0));
    });

    const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

    let topMonth = { name: '-', val: -Infinity };
    let flopMonth = { name: '-', val: Infinity };
    monthTotals.forEach((val, idx) => {
      if (val > topMonth.val) topMonth = { name: monthNames[idx], val };
      if (val < flopMonth.val) flopMonth = { name: monthNames[idx], val };
    });

    let topCustomer = { name: '-', val: -Infinity };
    let flopCustomer = { name: '-', val: Infinity };
    customerTotals.forEach((val, name) => {
      if (val > topCustomer.val) topCustomer = { name, val };
      if (val < flopCustomer.val) flopCustomer = { name, val };
    });

    let topRegion = { name: '-', val: -Infinity };
    let flopRegion = { name: '-', val: Infinity };
    regionTotals.forEach((val, name) => {
      if (val > topRegion.val) topRegion = { name, val };
      if (val < flopRegion.val) flopRegion = { name, val };
    });

    return { topMonth, flopMonth, topCustomer, flopCustomer, topRegion, flopRegion };
  }, [filteredInvoices]);

  if (!mounted) return null;

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full relative overflow-hidden bg-[#fafafa]">
      
      <div className={cn(
        "flex flex-col h-full transition-all duration-500 ease-in-out relative z-10",
        selectedInvoice ? "w-full lg:w-1/2 pr-0 lg:pr-6" : "w-full"
      )}>
        
        <div className="flex flex-col gap-6 mb-8 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-core tracking-tight uppercase">Beleg-Archiv</h1>
              <p className="text-core/50 font-mono text-xs mt-1">Zentrale Verwaltung & Extraktions-Logbuch</p>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => alert(`ZIP Export für Jahr ${selectedYear} gestartet`)}
                className="hidden md:flex bg-white hover:bg-gray-50 border border-shading/10 px-4 py-2 rounded-xl text-sm font-bold text-core shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-colors items-center gap-2"
              >
                <Download className="w-4 h-4 text-action" />
                Jahr {selectedYear}
              </button>
              
              <div className="flex items-center bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-shading/10">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    "relative px-6 py-2 text-sm font-black uppercase tracking-widest rounded-xl transition-colors",
                    selectedYear === year ? "text-core" : "text-core/40 hover:text-core/80"
                  )}
                >
                  {selectedYear === year && (
                    <motion.div layoutId="archiveYear" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-shading/5 -z-10" />
                  )}
                  {year}
                </button>
              ))}
              </div>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="flex flex-col">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-core/30" />
              <input 
                type="text"
                placeholder="Belege, Kunden oder Beträge durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-shading/10 rounded-2xl pl-16 pr-6 py-5 text-lg font-medium text-core focus:outline-none focus:border-action/50 focus:ring-2 focus:ring-action/20 transition-all shadow-[0_2px_20px_rgb(0,0,0,0.02)]"
              />
            </div>
          </div>

          <div className="flex gap-4 shrink-0 overflow-x-auto pb-4 scrollbar-hide w-full">
            <div className="bg-white px-5 py-3 rounded-2xl border border-shading/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-center flex-none min-w-[180px] md:min-w-[200px]">
              <span className="text-[10px] uppercase font-bold tracking-widest text-core/40 font-mono whitespace-nowrap">Volumen ({selectedYear})</span>
              <span className="text-lg font-black text-core whitespace-nowrap">{formatCurrency(totalFilteredVolume)} €</span>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl border border-shading/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-center flex-none min-w-[180px] md:min-w-[200px]">
              <span className="text-[10px] uppercase font-bold tracking-widest text-core/40 font-mono whitespace-nowrap">Ausstehender Export</span>
              <span className={cn("text-lg font-black whitespace-nowrap", pendingCount === 0 ? "text-green-500" : "text-action")}>{pendingCount} Belege</span>
            </div>
            
            {metrics && (
              <>
                <div className="bg-white px-5 py-3 rounded-2xl border border-shading/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-center flex-1 min-w-[180px]">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-core/40 font-mono mb-1">Monat</span>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-center text-xs font-bold text-core">
                      <span className="truncate pr-2">{metrics.topMonth.name}</span>
                      <span className="text-green-600">{formatCurrency(metrics.topMonth.val)} €</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-core/50">
                      <span className="truncate pr-2">{metrics.flopMonth.name}</span>
                      <span className="text-red-400">{formatCurrency(metrics.flopMonth.val)} €</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white px-5 py-3 rounded-2xl border border-shading/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-center flex-1 min-w-[180px]">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-core/40 font-mono mb-1">Kunde</span>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-center text-xs font-bold text-core">
                      <span className="truncate pr-2" title={metrics.topCustomer.name}>{metrics.topCustomer.name}</span>
                      <span className="text-green-600">{formatCurrency(metrics.topCustomer.val)} €</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-core/50">
                      <span className="truncate pr-2" title={metrics.flopCustomer.name}>{metrics.flopCustomer.name}</span>
                      <span className="text-red-400">{formatCurrency(metrics.flopCustomer.val)} €</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white px-5 py-3 rounded-2xl border border-shading/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-center flex-1 min-w-[180px]">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-core/40 font-mono mb-1">Region</span>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-center text-xs font-bold text-core">
                      <span className="truncate pr-2" title={metrics.topRegion.name}>{metrics.topRegion.name}</span>
                      <span className="text-green-600">{formatCurrency(metrics.topRegion.val)} €</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-core/50">
                      <span className="truncate pr-2" title={metrics.flopRegion.name}>{metrics.flopRegion.name}</span>
                      <span className="text-red-400">{formatCurrency(metrics.flopRegion.val)} €</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ACCORDION LIST */}
        <div className="flex-1 overflow-y-auto rounded-3xl pb-20 scrollbar-hide">
          <div className="flex flex-col gap-3">
            {groupedData.length === 0 ? (
              <div className="text-center py-20 text-core/40 font-mono text-sm">Keine Belege für diese Auswahl gefunden.</div>
            ) : (
              groupedData.map((month) => {
                const isMonthExpanded = expandedMonths.has(month.monthIdx) || searchQuery !== "";
                return (
                  <div key={month.monthIdx} className="bg-white border border-shading/10 rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                    
                    <div 
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleMonth(month.monthIdx)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMonth(month.monthIdx); } }}
                      className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors cursor-pointer outline-none focus-visible:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-transform", isMonthExpanded ? "bg-action/10 text-action" : "bg-gray-100 text-core/40")}>
                          <ChevronRight className={cn("w-4 h-4 transition-transform", isMonthExpanded && "rotate-90")} />
                        </div>
                        <span className="text-xl font-black text-core uppercase tracking-tight flex items-center gap-3">
                          {month.monthName}
                          {month.monthIdx === new Date().getMonth() && selectedYear === new Date().getFullYear() ? (
                            <span className="flex items-center gap-1 text-[10px] bg-core/5 text-core/50 px-2 py-1 rounded-md tracking-widest"><Clock className="w-3 h-3" /> Archiviert</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] bg-green-500/10 text-green-600 px-2 py-1 rounded-md tracking-widest"><CheckCircle2 className="w-3 h-3" /> Übermittelt</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-sm font-mono font-bold text-core/50">{month.count} Belege</span>
                        <span className="text-lg font-bold text-core w-32 text-right">{formatCurrency(month.total)} €</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); alert(`ZIP Download für ${month.monthName} ${selectedYear} gestartet`); }}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-action hover:text-white text-core/50 flex items-center justify-center transition-colors border border-shading/10"
                          title="ZIP-Bundle für diesen Monat herunterladen"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isMonthExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: "auto", opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-shading/5 bg-gray-50/50"
                        >
                          <div className="p-4 flex flex-col gap-3">
                            
                            {month.monthIdx === new Date().getMonth() && selectedYear === new Date().getFullYear() && (
                              <div className="mb-2 p-4 bg-action/5 border border-action/10 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-action/10 flex items-center justify-center text-action">
                                    <Clock className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-core">Automatischer Export läuft bald</span>
                                    <span className="text-xs text-core/60">Die gesammelten Belege dieses Monats werden am 3. des Folgemonats übermittelt.</span>
                                  </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-action bg-white px-3 py-1.5 rounded-lg shadow-sm border border-action/10">Aktiv</span>
                              </div>
                            )}

                            {month.weeks.map(week => {
                              const weekKey = `${month.monthIdx}-${week.kw}`;
                              const isWeekExpanded = expandedWeeks.has(weekKey) || searchQuery !== "";
                              return (
                                <div key={weekKey} className="bg-white border border-shading/10 rounded-xl overflow-hidden shadow-sm">
                                  
                                  <div 
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => toggleWeek(weekKey)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleWeek(weekKey); } }}
                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer outline-none focus-visible:bg-gray-50"
                                  >
                                    <div className="flex items-center gap-3 pl-2">
                                      <div className={cn("transition-transform", isWeekExpanded ? "text-action" : "text-core/30")}>
                                        <ChevronRight className={cn("w-4 h-4 transition-transform", isWeekExpanded && "rotate-90")} />
                                      </div>
                                      <span className="font-bold text-core text-sm flex items-center gap-2">
                                        Kalenderwoche {week.kw}
                                        {month.monthIdx === new Date().getMonth() && selectedYear === new Date().getFullYear() ? (
                                          <span className="flex items-center gap-1 text-[10px] text-core/40 px-1 py-0.5"><Clock className="w-3 h-3" /></span>
                                        ) : (
                                          <span className="flex items-center gap-1 text-[10px] text-green-500 px-1 py-0.5"><CheckCircle2 className="w-3 h-3" /></span>
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-mono font-bold">
                                      <span className="text-core/40">{week.invoices.length} Belege</span>
                                      <span className="text-core w-28 text-right">{formatCurrency(week.total)} €</span>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); alert(`ZIP Download für KW ${week.kw} gestartet`); }}
                                        className="w-7 h-7 rounded-md bg-gray-100 hover:bg-action hover:text-white text-core/50 flex items-center justify-center transition-colors"
                                        title="ZIP-Bundle für diese Woche herunterladen"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <AnimatePresence>
                                    {isWeekExpanded && (
                                      <motion.div 
                                        initial={{ height: 0, opacity: 0 }} 
                                        animate={{ height: "auto", opacity: 1 }} 
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-shading/5 bg-[#fafafa]"
                                      >
                                        <div className="flex flex-col">
                                          {week.invoices.map((inv) => (
                                            <div 
                                              key={inv.id} 
                                              onClick={() => setSelectedInvoice(inv)}
                                              className={cn(
                                                "flex items-center justify-between px-6 py-4 border-b border-shading/5 last:border-0 hover:bg-white transition-all cursor-pointer group",
                                                selectedInvoice?.id === inv.id ? "bg-white" : ""
                                              )}
                                            >
                                              <div className="flex items-center gap-4">
                                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0", getAvatarColor(inv.vendor_name))}>
                                                  {getInitials(inv.vendor_name)}
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="font-bold text-core text-sm">{inv.vendor_name || 'Unbekannt'}</span>
                                                  <span className="text-[10px] font-mono text-core/40">{new Date(inv.created_at).toLocaleDateString('de-DE')} · {inv.id.split('-')[1] || inv.id}</span>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-6">
                                                <div className="flex flex-col items-end">
                                                  <span className="font-bold text-core text-lg">{formatCurrency(inv.gross_amount)} €</span>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: SPLIT VIEW PANEL */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div 
            initial={{ opacity: 0, x: 100, width: 0 }}
            animate={{ opacity: 1, x: 0, width: "50%" }}
            exit={{ opacity: 0, x: 100, width: 0 }}
            className="h-full bg-core rounded-3xl shadow-[0_10px_40px_rgba(45,49,66,0.3)] overflow-hidden flex flex-col relative z-20 hidden lg:flex"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-action" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg">ZUGFeRD Inspector</h3>
                  <p className="text-[10px] font-mono text-white/50">{selectedInvoice.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest block mb-1">Vendor</span>
                  <span className="font-bold text-white">{selectedInvoice.vendor_name || 'N/A'}</span>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest block mb-1">Bruttobetrag</span>
                  <span className="font-bold text-action text-xl">{formatCurrency(selectedInvoice.gross_amount || 0)} €</span>
                </div>
              </div>

              {/* Original Document Preview Mock */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-4 flex flex-col gap-3">
                <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Ursprungsdatei (Upload)</span>
                <div className="w-full h-32 bg-white/5 border border-dashed border-white/20 rounded-xl flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <FileText className="w-6 h-6 text-white/40 group-hover:text-action transition-colors" />
                    <span className="text-xs text-white/40 font-mono group-hover:text-white transition-colors">eingereichtes_dokument.pdf</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex flex-col flex-1 min-h-[200px]">
                <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-white/50" />
                  <span className="text-xs font-mono font-bold text-white/70">Extrahierte Meta-Daten (JSON)</span>
                </div>
                <div className="p-4 overflow-auto flex-1 font-mono text-xs text-white/70">
                  <pre>{JSON.stringify(selectedInvoice, null, 2)}</pre>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 mt-auto shrink-0">
                <button 
                  onClick={() => alert('Vollständiges ZIP-Paket für diesen Beleg wird generiert')}
                  className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-core text-white hover:bg-core/90 transition-colors shadow-[0_4px_20px_rgb(0,0,0,0.2)]"
                >
                  <Download className="w-4 h-4" /> ZIP Bundle herunterladen
                </button>
                <div className="flex items-center gap-3">
                  <a 
                    href={selectedInvoice.pdfDownloadUrl || "#"} 
                    target="_blank" rel="noreferrer"
                    className={cn(
                      "flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors",
                      selectedInvoice.pdfDownloadUrl ? "bg-white text-core hover:bg-gray-100" : "bg-white/10 text-white/30 cursor-not-allowed"
                    )}
                  >
                    <Download className="w-4 h-4" /> PDF
                  </a>
                  <a 
                    href={selectedInvoice.xmlDownloadUrl || "#"} 
                    target="_blank" rel="noreferrer"
                    className={cn(
                      "flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors",
                      selectedInvoice.xmlDownloadUrl ? "bg-action text-white hover:bg-action/90" : "bg-white/10 text-white/30 cursor-not-allowed"
                    )}
                  >
                    <Code className="w-4 h-4" /> XML
                  </a>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
