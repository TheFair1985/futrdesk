"use client";

import { useState } from "react";
import { Mail, Lock, ArrowRight, Loader2, Building2, User, KeyRound, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { loginAction, signupAction } from "./actions";
import { cn } from "../../lib/utils";
import { Suspense } from "react";

function LoginClient() {
  const searchParams = useSearchParams();
  const defaultToSignup = searchParams.get("mode") === "signup";
  
  const [isLogin, setIsLogin] = useState(!defaultToSignup);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    
    if (isLogin) {
      const res = await loginAction(formData);
      if (res.error) {
        setError("Falsche E-Mail oder Passwort.");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      formData.append("full_name", fullName);
      formData.append("company_name", companyName);
      const res = await signupAction(formData);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 font-sans selection:bg-action/20 selection:text-action relative z-0">
      
      {/* Dynamic Background Pattern */}
      <AnimatePresence mode="wait">
        {isLogin ? (
          <motion.div key="bg-login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        ) : (
          <motion.div key="bg-signup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ef83541a_1px,transparent_1px),linear-gradient(to_bottom,#ef83541a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        )}
      </AnimatePresence>

      <motion.div 
        layout
        className={cn(
          "relative z-10 w-full transition-all duration-500 ease-in-out",
          isLogin ? "max-w-md" : "max-w-xl"
        )}
      >
        
        {/* LOGO AREA */}
        <motion.div layout className="text-center mb-8 flex flex-col items-center">
          <Link href="/" className="inline-block mb-2 group">
            <Image src="/logo.png" alt="Futrdesk Logo" width={180} height={48} priority className="mix-blend-multiply group-hover:scale-105 transition-transform" />
          </Link>
          <motion.p layout className={cn(
            "font-mono text-sm mt-2 tracking-widest uppercase font-bold",
            isLogin ? "text-core/50" : "text-action"
          )}>
            {isLogin ? "Secure Login" : "Join the Future"}
          </motion.p>
        </motion.div>

        {/* CARD CONTAINER */}
        <motion.div 
          layout
          className="bg-white border border-[#bfc0c0] rounded-[24px] shadow-2xl shadow-black/5 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {isLogin ? (
              // ---------------- LOGIN MODE ----------------
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="p-8 md:p-10"
              >
                <div className="mb-8">
                  <div className="w-12 h-12 bg-core/5 rounded-2xl flex items-center justify-center mb-6">
                    <KeyRound className="w-6 h-6 text-core" />
                  </div>
                  <h2 className="text-3xl font-black text-core font-sans mb-2 tracking-tight">
                    Willkommen zurück
                  </h2>
                  <p className="text-core/70 text-sm leading-relaxed font-medium">
                    Melde dich an, um auf dein Futrdesk Dashboard zuzugreifen.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-[11px] font-black text-core/60 uppercase tracking-widest font-mono">
                      E-Mail Adresse
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-core/40" />
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@firma.de"
                        className="w-full bg-[#fafafa] border border-[#bfc0c0] text-core placeholder:text-core/30 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-core focus:ring-1 focus:ring-core transition-all font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <label htmlFor="password" className="text-[11px] font-black text-core/60 uppercase tracking-widest font-mono">
                        Passwort
                      </label>
                      <button type="button" className="text-[11px] font-bold text-core/50 hover:text-core transition-colors">
                        Vergessen?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-core/40" />
                      <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#fafafa] border border-[#bfc0c0] text-core placeholder:text-core/30 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-core focus:ring-1 focus:ring-core transition-all font-mono text-sm"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-700 text-xs font-bold bg-red-50 border border-red-200 p-4 rounded-xl">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-core hover:bg-core/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-core/20 active:scale-[0.98]"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Sicher einloggen
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              // ---------------- SIGNUP MODE ----------------
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-8 md:p-10 bg-white"
              >
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <div className="w-12 h-12 bg-action/10 rounded-2xl flex items-center justify-center mb-6">
                      <Sparkles className="w-6 h-6 text-action" />
                    </div>
                    <h2 className="text-3xl font-black text-core font-sans mb-2 tracking-tight">
                      Account erstellen
                    </h2>
                    <p className="text-core/70 text-sm leading-relaxed font-medium">
                      Starte noch heute mit Futrdesk und automatisiere deine Prozesse.
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="px-4 py-2 bg-action/5 rounded-xl border border-action/10 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-action animate-pulse" />
                      <span className="text-xs font-bold text-action">Fast Setup</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-[11px] font-black text-core/60 uppercase tracking-widest font-mono">
                        Vor- & Nachname
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-core/40" />
                        <input
                          id="fullName"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Max Mustermann"
                          className="w-full bg-[#fafafa] border border-[#bfc0c0] text-core placeholder:text-core/30 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-all font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="companyName" className="text-[11px] font-black text-core/60 uppercase tracking-widest font-mono">
                        Unternehmen
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-core/40" />
                        <input
                          id="companyName"
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Firma GmbH"
                          className="w-full bg-[#fafafa] border border-[#bfc0c0] text-core placeholder:text-core/30 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-all font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-[11px] font-black text-core/60 uppercase tracking-widest font-mono">
                        Arbeits E-Mail
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-core/40" />
                        <input
                          id="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@firma.de"
                          className="w-full bg-[#fafafa] border border-[#bfc0c0] text-core placeholder:text-core/30 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-all font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className="text-[11px] font-black text-core/60 uppercase tracking-widest font-mono">
                        Sicheres Passwort
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-core/40" />
                        <input
                          id="password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#fafafa] border border-[#bfc0c0] text-core placeholder:text-core/30 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-all font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-700 text-xs font-bold bg-red-50 border border-red-200 p-4 rounded-xl">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="text-green-700 text-xs font-bold bg-green-50 border border-green-200 p-4 rounded-xl">
                      {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-action hover:bg-action/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-action/20 active:scale-[0.98]"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Kostenlos Account erstellen
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* BOTTOM TOGGLE */}
        <motion.div layout className="mt-8 text-center">
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }} 
            className="text-core/60 hover:text-action text-sm transition-colors font-bold px-6 py-2 rounded-full hover:bg-white/50"
          >
            {isLogin ? "Noch keinen Account? Jetzt registrieren" : "Bereits einen Account? Hier einloggen"}
          </button>
        </motion.div>
        
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4"><Loader2 className="w-8 h-8 animate-spin text-core" /></div>}>
      <LoginClient />
    </Suspense>
  );
}
