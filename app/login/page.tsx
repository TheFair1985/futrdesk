"use client";

import { useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    
    // Default redirect to /dashboard after login via magic link
    const redirectUrl = `${window.location.origin}/api/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      }
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
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
          <p className="text-white/50 font-mono text-sm mt-2 uppercase tracking-widest">
            B2B Identity Portal
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          {success ? (
            <div className="text-center flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white font-sans">Prüfe dein Postfach</h2>
              <p className="text-white/60 text-sm leading-relaxed max-w-[250px] mx-auto">
                Wir haben dir einen magischen Anmelde-Link an <strong className="text-white">{email}</strong> gesendet. Klicke darauf, um dich einzuloggen.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white font-sans mb-2">
                  Willkommen zurück
                </h2>
                <p className="text-white/60 text-sm">
                  Logge dich mit einem Klick über unser sicheres Zero-UI Portal ein. Kein Passwort notwendig.
                </p>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-5">
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
                      placeholder="business@firma.de"
                      className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-action/50 focus:ring-1 focus:ring-action/50 transition-all font-mono text-sm"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-400 text-xs font-mono bg-red-400/10 border border-red-400/20 p-3 rounded-lg">
                    {error}
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
                      Magischen Anmelde-Link senden
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
        
      </div>
    </div>
  );
}
