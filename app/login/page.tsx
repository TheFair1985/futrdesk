"use client";

import { useState } from "react";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { loginAction, signupAction } from "./actions";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      
      {/* Dashboard Style Background Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        
        {/* LOGO AREA */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block text-2xl font-bold font-sans text-core tracking-tight">
            FUTRDESK_
          </Link>
          <p className="text-core/50 font-mono text-sm mt-2 tracking-widest uppercase">
            {isLogin ? "Anmeldung" : "Registrierung"}
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-white border border-[#bfc0c0] p-8 rounded-2xl shadow-xl shadow-black/5">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-core font-sans mb-2">
                  {isLogin ? "Willkommen zurück" : "Neuen Account erstellen"}
                </h2>
                <p className="text-core/70 text-sm leading-relaxed">
                  {isLogin 
                    ? "Gib deine E-Mail und dein Passwort ein, um zum Dashboard zu gelangen." 
                    : "Erstelle dir jetzt einen Account, um Futrdesk zu nutzen."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-bold text-core/60 uppercase tracking-widest font-mono">
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
                      placeholder="firma@beispiel.de"
                      className="w-full bg-[#fafafa] border border-[#bfc0c0] text-core placeholder:text-core/30 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-all font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs font-bold text-core/60 uppercase tracking-widest font-mono">
                    Passwort
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

                {error && (
                  <div className="text-red-700 text-xs font-bold bg-red-50 border border-red-200 p-3 rounded-lg">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="text-green-700 text-xs font-bold bg-green-50 border border-green-200 p-3 rounded-lg">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-action hover:bg-action/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? "Sicher einloggen" : "Account erstellen"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 text-center pt-6 border-t border-shading">
            <button 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }} 
              className="text-core/60 hover:text-action text-sm transition-colors font-bold"
            >
              {isLogin ? "Noch keinen Account? Hier registrieren" : "Bereits einen Account? Hier einloggen"}
            </button>
          </div>

        </div>
        
      </div>
    </div>
  );
}
