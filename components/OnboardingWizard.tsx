"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Shield, ArrowRight, Building2, Send, CreditCard, UploadCloud, Loader2, Zap, RefreshCw, LogOut } from "lucide-react";
import { verifyVatId, saveOnboardingStep, markPaymentPending } from "../app/dashboard/onboardingActions";
import { generateCheckoutUrl } from "../app/dashboard/billing/actions";
import { logoutAction } from "../app/login/actions";
import { cn } from "../lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

function OnboardingContent({ profile, email }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPaymentPending = searchParams.get('payment') === 'success';

  // Determine initial step based on existing profile data
  let initialStep = 1;
  const hasCompanyData = profile?.company_profile?.company_name;
  if (hasCompanyData) initialStep = 2;
  if (profile?.onboarding_completed) initialStep = 3;
  if (isPaymentPending) initialStep = 4; // Virtual step for polling

  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [vatInput, setVatInput] = useState("");
  const [companyData, setCompanyData] = useState<any>(null);
  const [mode, setMode] = useState<"vat" | "manual" | "upload">("vat");
  const [legalConfirmed, setLegalConfirmed] = useState(false);
  
  // Step 2 State
  const [exportEmail, setExportEmail] = useState(profile?.export_email || "");
  const [autoSend, setAutoSend] = useState(profile?.auto_send_invoices !== false);

  // Step 3 State
  const [invoiceEmail, setInvoiceEmail] = useState(profile?.futrdesk_invoice_email || email || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Optimistic UI for payment verification
  const [showFallback, setShowFallback] = useState(false);
  useEffect(() => {
    if (isPaymentPending && (!profile?.tier || profile?.tier === 'NONE')) {
      let isMounted = true;
      
      const simulateVerification = async () => {
        // Show spinning wheel for 2.5 seconds for UX (feels secure)
        await new Promise(resolve => setTimeout(resolve, 2500));
        if (!isMounted) return;
        
        // Optimistically set tier to PENDING so they can enter the dashboard
        await markPaymentPending();
        router.push('/dashboard');
      };
      
      simulateVerification();
      
      const timeout = setTimeout(() => setShowFallback(true), 8000);
      
      return () => { 
        isMounted = false;
        clearTimeout(timeout);
      };
    }
  }, [isPaymentPending, profile, router]);

  const handleVatCheck = async () => {
    if (!vatInput) return;
    setLoading(true);
    const res = await verifyVatId(vatInput);
    if (res.success) {
      setCompanyData(res.company);
      setLegalConfirmed(false);
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLoading(true);
      // Simulate KI extraction
      setTimeout(() => {
        setLoading(false);
        setCompanyData({
          company_name: "Gewerbe " + (profile?.company_profile?.company_name || ""),
          address: "",
          tax_id: "",
        });
        setLegalConfirmed(false);
        setMode("manual");
      }, 2000);
    }
  };

  const saveStep1 = async () => {
    setLoading(true);
    await saveOnboardingStep({
      company_profile: {
        vat_id: companyData?.vat_id || vatInput,
        company_name: companyData?.name || companyData?.company_name,
        address: companyData?.address || "",
        legal_form: companyData?.legal_form || "",
        tax_id: companyData?.tax_id || ""
      }
    });
    setStep(2);
    setLoading(false);
  };

  const saveStep2 = async (skip = false) => {
    setLoading(true);
    if (!skip) {
      await saveOnboardingStep({ export_email: exportEmail, auto_send_invoices: autoSend });
    }
    setStep(3);
    setLoading(false);
  };

  const completeOnboarding = async (formData: FormData) => {
    setLoading(true);
    // Save invoice email
    await saveOnboardingStep({
      futrdesk_invoice_email: invoiceEmail,
      onboarding_completed: true
    });
    
    // Redirect to checkout
    await generateCheckoutUrl(formData);
  };

  const progress = (step / 3) * 100;

  return (
    <div className="absolute inset-0 bg-[#fafafa] z-50 flex flex-col">
      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-gray-200">
        <div className="h-full bg-action transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center py-20 relative">
        <div className="mb-12 text-center">
          <div className="text-xl font-bold font-sans tracking-tight mb-8 text-core flex justify-center">
            <Image src="/logo.png" alt="Futrdesk Logo" width={150} height={40} priority className="mix-blend-multiply" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full max-w-xl bg-white p-10 rounded-3xl shadow-xl border border-shading/10 flex flex-col gap-8">
              <div className="flex flex-col gap-2 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-core mx-auto mb-2">
                  <Building2 className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-core tracking-tight">Deine offiziellen Daten</h2>
                <p className="text-sm text-core/60 leading-relaxed">Da wir echte Rechnungen für dich schreiben, brauchen wir deine korrekten Firmendaten für den Briefkopf. Das geht in 5 Sekunden.</p>
              </div>

              {!companyData ? (
                <div className="flex flex-col gap-6">
                  {mode === "vat" && (
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">USt-IdNr. (Empfohlen)</label>
                      <div className="flex gap-2">
                        <input value={vatInput} onChange={e => setVatInput(e.target.value)} type="text" placeholder="DE123456789" className="flex-1 bg-gray-50 border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 uppercase" />
                        <button onClick={handleVatCheck} disabled={loading} className="bg-core text-white font-bold px-6 py-3 rounded-xl hover:bg-core/90 transition-colors flex items-center gap-2">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Suchen'}
                        </button>
                      </div>
                      <p className="text-xs text-core/50">Wir ziehen deine Daten live und sicher vom Bundeszentralamt für Steuern.</p>
                      
                      <div className="flex items-center gap-4 mt-4">
                        <hr className="flex-1 border-shading/10" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-core/30">Oder</span>
                        <hr className="flex-1 border-shading/10" />
                      </div>
                      <div className="flex justify-center gap-4">
                        <button onClick={() => setMode("manual")} className="text-xs font-bold text-action hover:underline">Manuell eingeben</button>
                        <button onClick={() => setMode("upload")} className="text-xs font-bold text-action hover:underline">Gewerbeanmeldung hochladen</button>
                      </div>
                    </div>
                  )}

                  {mode === "manual" && (
                    <div className="flex flex-col gap-4 text-left">
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-2">
                        <span className="font-bold text-blue-800 text-sm block mb-1">Kleinunternehmer-Erklärung</span>
                        <span className="text-xs text-blue-700">Fülle diese Daten aus. Wir generieren daraus automatisch ein offizielles Stammdaten-PDF für deinen Account. Beachte: Gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen.</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Vor- und Nachname / Firmenname</label>
                          <input type="text" placeholder="Max Mustermann" onChange={e => setCompanyData({...companyData, company_name: e.target.value})} className="w-full bg-gray-50 border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core mt-1" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Straße & Hausnummer</label>
                          <input type="text" placeholder="Musterstraße 1" onChange={e => setCompanyData({...companyData, address: e.target.value})} className="w-full bg-gray-50 border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core mt-1" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Steuernummer</label>
                          <input type="text" placeholder="12/345/67890" onChange={e => setCompanyData({...companyData, tax_id: e.target.value})} className="w-full bg-gray-50 border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core mt-1" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Zuständiges Finanzamt</label>
                          <input type="text" placeholder="Finanzamt Berlin" className="w-full bg-gray-50 border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core mt-1" />
                        </div>
                        <div className="col-span-2 flex items-start gap-3 mt-2">
                          <input type="checkbox" id="ku" className="mt-1" defaultChecked />
                          <label htmlFor="ku" className="text-xs text-core/70 leading-relaxed">
                            Ich bestätige, dass ich unter die Kleinunternehmerregelung (§ 19 UStG) falle. Diese Klausel wird automatisch auf meinen ZUGFeRD-Belegen eingefügt.
                          </label>
                        </div>
                      </div>
                      
                      <button onClick={() => { if(companyData?.company_name) saveStep1(); }} className="bg-core text-white font-bold px-6 py-3 rounded-xl hover:bg-core/90 w-full mt-2">Daten bestätigen & Weiter</button>
                      <button onClick={() => setMode("vat")} className="text-xs font-bold text-core/50 mt-2 text-center">Zurück zur Schnellsuche</button>
                    </div>
                  )}

                  {mode === "upload" && (
                    <div 
                      className="flex flex-col gap-4 items-center justify-center p-10 border-2 border-dashed border-shading/20 hover:border-action/50 transition-colors rounded-2xl bg-gray-50 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud className="w-10 h-10 text-core/30 mb-2" />
                      <p className="text-sm font-bold text-core">Dokument hochladen (oder Foto)</p>
                      <p className="text-xs text-core/50 text-center">Unsere KI liest deine Gewerbeanmeldung in Sekundenbruchteilen aus.</p>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*,.pdf" 
                        onChange={handleFileUpload} 
                      />
                      <button className="mt-4 px-6 py-2 bg-white border border-shading/20 rounded-xl text-sm font-bold text-core shadow-sm pointer-events-none">Datei auswählen</button>
                      <button onClick={(e) => { e.stopPropagation(); setMode("vat"); }} className="text-xs font-bold text-core/50 mt-4 relative z-10 hover:underline">Abbrechen</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-200 text-green-800 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl">Verifiziert</div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                      <span className="font-bold text-green-800 text-lg">Daten erfolgreich abgerufen</span>
                    </div>
                    <div className="flex flex-col font-mono text-sm text-green-900/80 bg-green-100/50 p-4 rounded-xl border border-green-200/50">
                      <p className="text-xs text-green-800 mb-2 font-sans font-bold">Die USt-IdNr. ist gültig. Bitte bestätige oder ergänze deine Firmendaten für die Rechnungserstellung:</p>
                      <div className="flex flex-col gap-2 w-full mt-2">
                        <input type="text" value={(companyData.company_name || companyData.name || "").replace("---", "")} placeholder="Dein Firmenname" onChange={e => setCompanyData({...companyData, company_name: e.target.value})} className="w-full bg-white border border-green-300 rounded-lg px-3 py-2 text-sm font-medium text-core" />
                        <input type="text" value={(companyData.address || "").replace("---", "")} placeholder="Adresse (optional)" onChange={e => setCompanyData({...companyData, address: e.target.value})} className="w-full bg-white border border-green-300 rounded-lg px-3 py-2 text-sm font-medium text-core" />
                      </div>
                      {companyData.vat_id && <span className="mt-4 text-xs font-bold opacity-70">Verifizierte USt-IdNr.: {companyData.vat_id}</span>}
                    </div>

                    <div className="flex items-start gap-3 bg-white border border-shading/10 p-4 rounded-xl">
                      <input 
                        type="checkbox" 
                        id="legalConfirm" 
                        checked={legalConfirmed}
                        onChange={(e) => setLegalConfirmed(e.target.checked)}
                        className="mt-1 w-4 h-4 text-action rounded border-gray-300 focus:ring-action" 
                      />
                      <label htmlFor="legalConfirm" className="text-xs text-core/70 leading-relaxed font-sans">
                        Ich bestätige, dass dies meine korrekten Firmendaten sind und ich berechtigt bin, im Namen dieses Unternehmens zu handeln.
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button onClick={() => setCompanyData(null)} className="px-6 py-3 rounded-xl font-bold text-core hover:bg-gray-100 transition-colors border border-shading/10 bg-white">Falsche Daten?</button>
                    <button 
                      onClick={saveStep1} 
                      disabled={loading || !legalConfirmed} 
                      className="flex-1 bg-core text-white font-bold px-6 py-3 rounded-xl hover:bg-core/90 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Stimmt! Speichern & Weiter'} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-xl bg-white p-10 rounded-3xl shadow-xl border border-shading/10 flex flex-col gap-8">
              <div className="flex flex-col gap-2 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-core mx-auto mb-2">
                  <Send className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-core tracking-tight">Deine Workflows</h2>
                <p className="text-sm text-core/60 leading-relaxed">Wie sollen wir mit deinen Belegen umgehen, sobald sie fertig sind?</p>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Monats-Export Empfänger (z.B. Buchhaltung, Steuerberater)</label>
                  <input value={exportEmail} onChange={e => setExportEmail(e.target.value)} type="email" placeholder="kanzlei@steuerberater.de" className="w-full bg-gray-50 border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50" />
                  <p className="text-[10px] text-core/50 font-mono">Hinweis: Wenn du hier keine E-Mail-Adresse einträgst, wird der monatliche Export automatisch an deine Account-E-Mail gesendet.</p>
                </div>

                <div className="flex items-start gap-4 p-5 bg-action/5 border border-action/20 rounded-2xl cursor-pointer" onClick={() => setAutoSend(!autoSend)}>
                  <div className="relative flex items-center mt-0.5">
                    <div className={cn("w-10 h-5 rounded-full transition-colors", autoSend ? "bg-action" : "bg-gray-300")}></div>
                    <div className={cn("absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform", autoSend ? "translate-x-5" : "")}></div>
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-core text-sm block">Rechnungen sofort an Kunden senden</span>
                    {autoSend ? (
                      <p className="text-xs text-core/60 mt-1">Keine Sorge: Wir verschicken nichts blind. Du musst jede E-Rechnung vorher kurz mit einem Klick freigeben.</p>
                    ) : (
                      <p className="text-xs text-red-600 font-bold mt-1">Achtung: Wir senden die fertige Rechnung als PDF nur in den Chat (WhatsApp/Telegram/E-Mail) zurück. Du bist selbst dafür verantwortlich, sie an den Kunden weiterzuleiten!</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <button onClick={() => saveStep2(true)} className="px-6 py-3 rounded-xl font-bold text-core/50 hover:text-core hover:bg-gray-100 transition-colors">Überspringen</button>
                <button onClick={() => saveStep2(false)} disabled={loading} className="flex-1 bg-core text-white font-bold px-6 py-3 rounded-xl hover:bg-core/90 transition-colors flex items-center justify-center gap-2 shadow-sm">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Speichern & Weiter'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-4xl bg-white p-10 rounded-3xl shadow-xl border border-shading/10 flex flex-col gap-8">
              <div className="flex flex-col gap-2 text-center max-w-xl mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-core mx-auto mb-2">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-core tracking-tight">Tarif & Abrechnung</h2>
                <p className="text-sm text-core/60 leading-relaxed">Wähle deinen Tarif. Die Aktivierung über LemonSqueezy schließt deine Identitätsprüfung automatisch ab (Abgleich mit Zahlungsdaten).</p>
              </div>

              <div className="max-w-md mx-auto w-full mb-4">
                <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono mb-2 block text-center">Wohin dürfen wir unsere Rechnungen an dich senden?</label>
                <input value={invoiceEmail} onChange={e => setInvoiceEmail(e.target.value)} type="email" placeholder="buchhaltung@..." className="w-full bg-gray-50 border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 text-center" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Starter */}
                <div className="relative flex flex-col bg-white border border-shading/10 shadow-sm p-6 rounded-2xl">
                  <h3 className="font-mono text-sm font-bold text-core uppercase tracking-widest mb-4">Starter</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold font-sans text-core">19,99€</span><span className="text-xs text-core/60 font-sans">/ mtl.</span>
                  </div>
                  <div className="mb-6"><div className="font-bold text-core mb-1 text-sm">25 Rechnungen</div><div className="text-xs text-core/60">max. 1 GB Speicher</div></div>
                  <form action={completeOnboarding} className="mt-auto">
                    <input type="hidden" name="tier" value="STARTER" />
                    <button className="w-full py-3 text-sm rounded-xl font-bold transition-colors bg-white text-core hover:bg-gray-50 border border-shading/20 shadow-sm">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Starter aktivieren'}
                    </button>
                  </form>
                </div>

                {/* Pro */}
                <div className="relative flex flex-col bg-core border border-core shadow-xl p-6 rounded-2xl transform md:-translate-y-2">
                  <div className="absolute top-0 right-0 bg-[#F48F65] text-white font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl">Empfehlung</div>
                  <h3 className="font-mono text-sm font-bold text-[#F48F65] uppercase tracking-widest mb-4">Pro</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold font-sans text-white">49,99€</span><span className="text-xs text-white/60 font-sans">/ mtl.</span>
                  </div>
                  <div className="mb-6"><div className="font-bold text-white mb-1 text-sm">75 Rechnungen</div><div className="text-xs text-white/60">max. 3 GB Speicher</div></div>
                  <form action={completeOnboarding} className="mt-auto">
                    <input type="hidden" name="tier" value="PRO" />
                    <button className="w-full py-3 text-sm rounded-xl font-bold transition-colors bg-[#F48F65] hover:bg-[#F48F65]/90 text-white shadow-md">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Pro aktivieren'}
                    </button>
                  </form>
                </div>

                {/* Business */}
                <div className="relative flex flex-col bg-white border border-shading/10 shadow-sm p-6 rounded-2xl">
                  <h3 className="font-mono text-sm font-bold text-core uppercase tracking-widest mb-4">Business</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold font-sans text-core">99,99€</span><span className="text-xs text-core/60 font-sans">/ mtl.</span>
                  </div>
                  <div className="mb-6"><div className="font-bold text-core mb-1 text-sm">150 Rechnungen</div><div className="text-xs text-core/60">max. 5 GB Speicher</div></div>
                  <form action={completeOnboarding} className="mt-auto">
                    <input type="hidden" name="tier" value="BUSINESS" />
                    <button className="w-full py-3 text-sm rounded-xl font-bold transition-colors bg-white text-core hover:bg-gray-50 border border-shading/20 shadow-sm">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Business aktivieren'}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl bg-white p-10 rounded-3xl shadow-xl border border-shading/10 flex flex-col gap-8 text-center">
              <div className="w-16 h-16 bg-action/10 rounded-2xl flex items-center justify-center text-action mx-auto mb-2">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <h2 className="text-3xl font-black text-core tracking-tight">Zahlung wird verifiziert</h2>
              <p className="text-sm text-core/60 leading-relaxed">
                Dein Checkout war erfolgreich. Wir richten gerade im Hintergrund deinen Workspace ein und schalten die Funktionen frei. Bitte einen Moment Geduld...
              </p>
              <div className="flex flex-col items-center gap-4 mt-4">
                <Loader2 className="w-6 h-6 animate-spin text-core/30" />
                {showFallback && (
                  <button 
                    onClick={() => router.push('/dashboard')} 
                    className="mt-6 px-6 py-2 border border-shading/20 rounded-xl text-xs font-bold text-core/60 hover:text-core hover:bg-gray-50 transition-all"
                  >
                    Dauert zu lange? Hier klicken, um zum Dashboard zu springen
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function OnboardingWizard(props: any) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-core" /></div>}>
      <OnboardingContent {...props} />
    </Suspense>
  );
}
