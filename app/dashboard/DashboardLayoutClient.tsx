"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Archive, Settings, CreditCard, LogOut } from "lucide-react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const navigation = [
  { name: "Übersicht", href: "/dashboard", icon: LayoutDashboard },
  { name: "Archiv", href: "/dashboard/archive", icon: Archive },
  { name: "Einstellungen", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayoutClient({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: any;
}) {
  const pathname = usePathname();
  const [sidebarLogo, setSidebarLogo] = useState<string>("/image.png");

  useEffect(() => {
    const handleLogoUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) setSidebarLogo(customEvent.detail);
    };
    window.addEventListener('logo-updated', handleLogoUpdate);
    return () => window.removeEventListener('logo-updated', handleLogoUpdate);
  }, []);

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans selection:bg-action/20 selection:text-action relative z-0">
      {/* Global Background Grid (Intense) */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      {/* Sleek Minimalist Sidebar */}
      <aside className="w-64 bg-white/95 backdrop-blur-md flex flex-col shrink-0 border-r border-shading/20 relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.01)]">
        
        {/* Logo */}
        <div className="h-24 flex items-center px-8">
          <span className="font-mono text-xl font-bold tracking-tighter text-core">
            FUTRDESK
            <span className="text-action">.</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 flex flex-col gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group",
                  isActive
                    ? "text-core"
                    : "text-core/50 hover:text-core hover:bg-gray-50"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gray-100/80 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className={cn(
                  "w-4 h-4 shrink-0 transition-colors duration-200", 
                  isActive ? "text-action" : "text-core/40 group-hover:text-core/70"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

          {/* Sidebar Progress Bar (Gamification) */}
          {(() => {
            let progress = 40; // Base: Setup completed
            if (profile?.company_profile?.vat_id || profile?.company_profile?.tax_id) progress += 20;
            if (profile?.tier && profile?.tier !== 'NONE') progress += 20;
            if (profile?.export_email) progress += 10;
            if (profile?.auto_send_invoices !== undefined) progress += 10;
            
            if (progress >= 100) return null;
            return (
              <div className="px-6 mb-4">
                <div className="bg-gray-50 border border-shading/10 p-4 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-core font-mono">Setup Progress</span>
                    <span className="text-[10px] font-bold text-action">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-action rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                  </div>
                  <Link href="/dashboard/settings" className="text-[10px] text-core/50 hover:text-action transition-colors mt-1 font-mono">
                    Jetzt vervollständigen →
                  </Link>
                </div>
              </div>
            );
          })()}

        {/* User Footer */}
        <div className="p-6 pt-0">
          <div className="p-4 rounded-2xl bg-gray-50 flex items-center justify-between border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden border border-gray-200 relative">
                <img src={sidebarLogo} className="w-full h-full object-contain p-1.5 mix-blend-multiply" alt="User" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-core truncate max-w-[100px]">{profile?.company_name || 'Dein Account'}</span>
                <span className="text-[10px] uppercase font-mono text-core/40">{profile?.tier || 'Pro Plan'}</span>
              </div>
            </div>
            <button className="text-core/40 hover:text-action transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto z-10">
        <div className="max-w-[1400px] mx-auto p-12 lg:p-16 relative">
          {children}
        </div>
      </main>
      
    </div>
  );
}
