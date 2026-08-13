"use client";

import { useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

    const supabase = createClient();
    
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError("Falsche E-Mail oder Passwort.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess("Account erstellt! Du kannst dich jetzt einloggen.");
        setIsLogin(true);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center p-4">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-action/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        
        {/* LOGO AREA */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block text-2xl font-bold font-sans text-white tracking-tight">
            FUTRDESK
          </Link>
          <p className="text-white/50 font-mono text-sm mt-2 tracking-widest">
            {isLogin ? "Anmeldung" : "Registrierung"}
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white font-sans mb-2">
              {isLogin ? "Willkommen zurück" : "Neuen Account erstellen"}
            </h2>
            <p className="text-white/60 text-sm">
              {isLogin 
                ? "Gib deine E-Mail und dein Passwort ein, um zum Dashboard zu gelangen." 
                : "Erstelle dir jetzt einen kostenlosen Account, um Futrdesk zu nutzen."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold text-white/50 uppercase tracking-widest font-mono">
                E-Mail Adresse
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="firma@beispiel.de"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-action/50 focus:ring-1 focus:ring-action/50 transition-all font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold text-white/50 uppercase tracking-widest font-mono">
                Passwort
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-action/50 focus:ring-1 focus:ring-action/50 transition-all font-mono text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs font-bold bg-red-400/10 border border-red-400/20 p-3 rounded-lg">
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-green-400 text-xs font-bold bg-green-400/10 border border-green-400/20 p-3 rounded-lg">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-action hover:bg-action/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Einloggen" : "Registrieren"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }} 
              className="text-white/50 hover:text-white text-sm transition-colors font-bold"
            >
              {isLogin ? "Noch keinen Account? Hier registrieren" : "Bereits einen Account? Hier einloggen"}
            </button>
          </div>

        </div>
        
      </div>
    </div>
  );
}
