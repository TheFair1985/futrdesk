"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Archive, Settings, CreditCard, LogOut } from "lucide-react";
import { cn } from "../../lib/utils";

const navigation = [
  { name: "Übersicht", href: "/dashboard", icon: LayoutDashboard },
  { name: "Archiv", href: "/dashboard/archive", icon: Archive },
  { name: "Einstellungen", href: "/dashboard/settings", icon: Settings },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#2d3142] text-white flex flex-col border-r border-[#bfc0c0] shrink-0">
        
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <span className="font-mono text-xl font-bold tracking-widest text-white">
            FUTRDESK_
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 flex flex-col gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 font-sans text-sm transition-colors",
                  isActive
                    ? "bg-white/10 border-l-[3px] border-[#ef8354] text-white font-bold"
                    : "text-white/60 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ef8354] flex items-center justify-center font-mono text-xs font-bold shadow-inner">
                JD
              </div>
              <span className="font-mono text-xs text-white/80">User</span>
            </div>
          </div>
          <button className="flex items-center gap-2 text-white/50 hover:text-white transition-colors font-sans text-xs uppercase tracking-wider">
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto">
        {/* Aceternity Dot Grid Pattern */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(#bfc0c0_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
        
        <div className="relative z-10 p-8 md:p-12">
          {children}
        </div>
      </main>
      
    </div>
  );
}
