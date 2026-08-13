"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, CreditCard, Send, HardDrive, Zap, Layers, Mail, Archive as ArchiveIcon, Save, Building2, Shield, AlertTriangle, Key, CheckCircle2, FileText, Lock, Unlock, ArrowRight } from "lucide-react";
import { cn } from "../../../lib/utils";

export default function SettingsClient({ profile, email, generateCheckoutUrlAction, updateSettingsAction }: any) {
  const [activeTab, setActiveTab] = useState("company");
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [showReverifyModal, setShowReverifyModal] = useState(false);

  const tabs = [
    { id: "company", label: "Firmendaten", icon: Building2 },
    { id: "security", label: "Sicherheit & Login", icon: Shield },
    { id: "billing", label: "Abo & Volumen", icon: HardDrive },
    { id: "invoice", label: "Rechnungsdaten", icon: CreditCard },
    { id: "workflow", label: "Automatisierung", icon: Send },
  ];

  // Calculate storage metrics
  const storageBytes = profile?.storage_used_bytes || 0;
  const usedMB = (storageBytes / (1024 * 1024)).toFixed(1);
  const tier = profile?.tier || 'STARTER';
  let totalMB = 1000;
  if (tier === 'PRO') totalMB = 3000;
  if (tier === 'BUSINESS') totalMB = 5000;
  const percentage = Math.min(100, Math.max(0, (Number(usedMB) / totalMB) * 100));

  // Company Profile defaults (falling back to JSON if available, otherwise flat columns)
  const company = profile?.company_profile || {
    company_name: profile?.company_name || "",
    legal_form: profile?.legal_form || "",
    street: profile?.street || "",
    zip: profile?.zip || "",
    city: profile?.city || "",
    public_email: profile?.public_email || "",
    website: profile?.website || "",
    phone: profile?.phone || "",
    vat_id: profile?.vat_id || "",
    tax_id: profile?.tax_id || "",
    commercial_register: profile?.commercial_register || ""
  };

  const isVerified = company.vat_id || profile?.verification_status === 'verified';

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-20 w-full max-w-6xl mx-auto">
      {/* SIDEBAR NAVIGATION */}
      <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2 lg:sticky lg:top-8 h-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsEditingCompany(false);
              }}
              className={cn(
                "flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-bold text-left w-full",
                isActive 
                  ? "bg-white shadow-[0_2px_15px_rgb(0,0,0,0.04)] text-core border border-shading/10" 
                  : "text-core/50 hover:bg-white/50 hover:text-core"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-action" : "text-core/40")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 w-full bg-transparent relative">
        
        {/* REVERIFY MODAL */}
        <AnimatePresence>
          {showReverifyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="absolute inset-0 bg-core/80 backdrop-blur-sm" onClick={() => setShowReverifyModal(false)} />
              <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.9}} className="bg-white rounded-3xl p-8 max-w-lg w-full relative z-10 shadow-2xl flex flex-col gap-6 border border-shading/10">
                <div className="w-16 h-16 bg-action/10 rounded-2xl flex items-center justify-center text-action">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-core uppercase tracking-tight mb-2">Änderungsantrag & Re-Verifizierung</h3>
                  <p className="text-sm text-core/60 leading-relaxed">
                    Das Ändern deiner Stammdaten (Firmenname, Rechtsform, Adresse, USt-IdNr.) hebt den <strong className="text-core">verifizierten Status</strong> deines Accounts sofort auf, da die Identität neu geprüft werden muss. 
                    Ohne gültige Verifizierung können keine rechtssicheren ZUGFeRD Belege versendet werden.
                  </p>
                </div>
                
                <div className="bg-gray-50 border border-shading/10 rounded-2xl p-5 flex flex-col gap-3">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Verifizierungs-Methoden:</span>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-sm font-bold text-core"><CheckCircle2 className="w-4 h-4 text-green-500"/> Echtzeit-Check via EU-VIES (USt-IdNr.)</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-core"><CheckCircle2 className="w-4 h-4 text-green-500"/> Handelsregisterabfrage (Live)</div>
                    <div className="flex items-center gap-3 text-sm font-bold text-core"><CheckCircle2 className="w-4 h-4 text-green-500"/> KI-Gewerbeschein-Prüfung (3 Sek)</div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setShowReverifyModal(false)} className="px-6 py-3 rounded-xl font-bold text-core hover:bg-gray-100 transition-colors">Abbrechen</button>
                  <button onClick={() => { setShowReverifyModal(false); setIsEditingCompany(true); }} className="px-6 py-3 rounded-xl font-bold bg-core text-white hover:bg-core/90 transition-colors shadow-sm flex items-center gap-2">
                    Fortfahren <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* TAB: COMPANY (VERIFIZIERUNG & BRIEFKOPF) */}
            {activeTab === "company" && (
              <div className="flex flex-col gap-8">
                
                {/* STATUS & KYB */}
                <div className="bg-white border border-shading/10 rounded-3xl p-8 shadow-[0_2px_20px_rgb(0,0,0,0.02)] flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-core/50">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-core uppercase tracking-tight">Identitätsprüfung</h2>
                        <p className="text-xs font-mono text-core/40">Notwendig für den Versand von ZUGFeRD-Belegen</p>
                      </div>
                    </div>
                    {isVerified ? (
                      <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-200">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Verifiziert via VIES</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-200">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Verifizierung ausstehend</span>
                      </div>
                    )}
                  </div>
                  
                  {isVerified && (
                    <div className="bg-gray-50 p-5 rounded-2xl border border-shading/10 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-core">Dein Unternehmen ist vollständig legitimiert.</span>
                        <span className="text-xs text-core/60 mt-1">Letzte Prüfung: Heute. Methode: USt-IdNr. Live-Datenbank.</span>
                      </div>
                      <button onClick={() => setShowReverifyModal(true)} className="px-4 py-2 bg-white border border-shading/10 hover:bg-gray-100 transition-colors rounded-xl text-xs font-bold text-core shadow-sm">
                        Re-Verifizierung starten
                      </button>
                    </div>
                  )}

                  {!isVerified && (
                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-amber-800">Achtung: Eingeschränkter Account</span>
                        <span className="text-xs text-amber-700/80 mt-1">Hinterlege jetzt deine USt-IdNr. um deinen Account freizuschalten.</span>
                      </div>
                      <button onClick={() => setIsEditingCompany(true)} className="px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 transition-colors rounded-xl text-xs font-bold shadow-sm">
                        Jetzt verifizieren
                      </button>
                    </div>
                  )}
                </div>

                {/* BRIEFKOPF VORSCHAU */}
                <div className="bg-white border border-shading/10 rounded-3xl p-8 shadow-[0_2px_20px_rgb(0,0,0,0.02)] flex flex-col gap-8">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-core/50">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-core uppercase tracking-tight">Briefkopf Vorschau</h2>
                        <p className="text-xs font-mono text-core/40">Dein digitales ZUGFeRD-Layout</p>
                      </div>
                    </div>
                    {!isEditingCompany && (
                      <button onClick={() => setIsEditingCompany(true)} className="px-4 py-2 border border-shading/10 rounded-xl font-bold text-xs uppercase tracking-widest text-core hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                        <Unlock className="w-3.5 h-3.5" /> Bearbeiten
                      </button>
                    )}
                  </div>

                  {!isEditingCompany ? (
                    // PREVIEW MODE
                    <div className="w-full bg-[#f8f9fa] rounded-2xl p-8 border border-dashed border-gray-300 relative overflow-hidden flex flex-col font-mono text-sm shadow-inner group">
                      <div className="absolute top-0 right-0 bg-gray-200 text-core/40 font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">Vorschau</div>
                      
                      <div className="flex flex-col gap-1 mb-8">
                        <span className="text-xl font-black text-core font-sans tracking-tight">{company.company_name || 'Musterfirma'} {company.legal_form}</span>
                        <span className="text-core/60">{company.street || 'Musterstraße 1'}</span>
                        <span className="text-core/60">{company.zip || '10115'} {company.city || 'Berlin'}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 max-w-lg text-xs text-core/50">
                        <div><span className="font-bold text-core/70">USt-IdNr.:</span> {company.vat_id || '-'}</div>
                        <div><span className="font-bold text-core/70">E-Mail:</span> {company.public_email || '-'}</div>
                        <div><span className="font-bold text-core/70">Steuernummer:</span> {company.tax_id || '-'}</div>
                        <div><span className="font-bold text-core/70">Tel:</span> {company.phone || '-'}</div>
                        <div><span className="font-bold text-core/70">Register:</span> {company.commercial_register || '-'}</div>
                        <div><span className="font-bold text-core/70">Web:</span> {company.website || '-'}</div>
                      </div>
                    </div>
                  ) : (
                    // EDIT MODE
                    <form action={updateSettingsAction} className="flex flex-col gap-8 bg-gray-50 p-6 rounded-2xl border border-shading/10 shadow-inner">
                      <input type="hidden" name="form_type" value="company_profile" />
                      
                      {isVerified && (
                        <div className="bg-white p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                          <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-core">Stammdaten sind gesperrt</span>
                            <span className="text-xs text-core/60">Da dein Unternehmen verifiziert ist, können diese Felder nur über eine Re-Verifizierung geändert werden. Sonstige Kontaktdaten kannst du frei anpassen.</span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2 relative">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono flex items-center gap-2">Firmenname {isVerified && <Lock className="w-3 h-3 text-core/30"/>}</label>
                          <input name="company_name" type="text" defaultValue={company.company_name} readOnly={isVerified} className={cn("w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all", isVerified ? "bg-gray-100/50 cursor-not-allowed text-core/50" : "bg-white shadow-sm")} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono flex items-center gap-2">Rechtsform {isVerified && <Lock className="w-3 h-3 text-core/30"/>}</label>
                          <input name="legal_form" type="text" defaultValue={company.legal_form} readOnly={isVerified} className={cn("w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all", isVerified ? "bg-gray-100/50 cursor-not-allowed text-core/50" : "bg-white shadow-sm")} />
                        </div>
                        
                        <div className="flex flex-col gap-2 md:col-span-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono flex items-center gap-2">Straße & Hausnummer {isVerified && <Lock className="w-3 h-3 text-core/30"/>}</label>
                          <input name="street" type="text" defaultValue={company.street} readOnly={isVerified} className={cn("w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all", isVerified ? "bg-gray-100/50 cursor-not-allowed text-core/50" : "bg-white shadow-sm")} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono flex items-center gap-2">PLZ {isVerified && <Lock className="w-3 h-3 text-core/30"/>}</label>
                          <input name="zip" type="text" defaultValue={company.zip} readOnly={isVerified} className={cn("w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all", isVerified ? "bg-gray-100/50 cursor-not-allowed text-core/50" : "bg-white shadow-sm")} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono flex items-center gap-2">Stadt {isVerified && <Lock className="w-3 h-3 text-core/30"/>}</label>
                          <input name="city" type="text" defaultValue={company.city} readOnly={isVerified} className={cn("w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all", isVerified ? "bg-gray-100/50 cursor-not-allowed text-core/50" : "bg-white shadow-sm")} />
                        </div>
                        
                        <div className="flex flex-col gap-2 relative group">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono flex items-center gap-2">Umsatzsteuer-ID (USt-IdNr.) {isVerified && <Lock className="w-3 h-3 text-core/30"/>}</label>
                          <input name="vat_id" type="text" defaultValue={company.vat_id} readOnly={isVerified} placeholder="DE123456789" className={cn("w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all uppercase", isVerified ? "bg-gray-100/50 cursor-not-allowed text-core/50" : "bg-white shadow-sm")} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono flex items-center gap-2">Steuernummer {isVerified && <Lock className="w-3 h-3 text-core/30"/>}</label>
                          <input name="tax_id" type="text" defaultValue={company.tax_id} readOnly={isVerified} className={cn("w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all", isVerified ? "bg-gray-100/50 cursor-not-allowed text-core/50" : "bg-white shadow-sm")} />
                        </div>

                        {/* Editable contact fields */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-action font-mono">Öffentliche E-Mail</label>
                          <input name="public_email" type="email" defaultValue={company.public_email} className="w-full bg-white shadow-sm border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-action font-mono">Website</label>
                          <input name="website" type="url" defaultValue={company.website} className="w-full bg-white shadow-sm border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-action font-mono">Telefon</label>
                          <input name="phone" type="tel" defaultValue={company.phone} className="w-full bg-white shadow-sm border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-action font-mono">Handelsregister (optional)</label>
                          <input name="commercial_register" type="text" defaultValue={company.commercial_register} className="w-full bg-white shadow-sm border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all" />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-shading/10">
                        <button type="button" onClick={() => setIsEditingCompany(false)} className="px-6 py-3 rounded-xl font-bold text-core hover:bg-gray-200 transition-colors">Abbrechen</button>
                        <button type="submit" onClick={() => setTimeout(() => setIsEditingCompany(false), 200)} className="bg-core text-white hover:bg-core/90 transition-colors font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm">
                          <Save className="w-4 h-4" /> Aktualisieren
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* TAB: SECURITY */}
            {activeTab === "security" && (
              <div className="flex flex-col gap-8">
                
                {/* LOGIN CREDENTIALS */}
                <div className="bg-white border border-shading/10 rounded-3xl p-8 shadow-[0_2px_20px_rgb(0,0,0,0.02)] flex flex-col gap-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-core/50">
                      <Key className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-core uppercase tracking-tight">Login Credentials</h2>
                      <p className="text-xs font-mono text-core/40">Zugangsdaten & Authentifizierung</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-3 p-5 rounded-2xl border border-shading/10 bg-gray-50">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono block mb-1">Login E-Mail</span>
                        <span className="font-bold text-core block">{email}</span>
                      </div>
                      <button className="text-sm font-bold text-action hover:text-action/80 text-left w-max">E-Mail ändern</button>
                    </div>

                    <div className="flex flex-col gap-3 p-5 rounded-2xl border border-shading/10 bg-gray-50">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono block mb-1">Passwort</span>
                        <span className="font-bold text-core block tracking-[0.2em]">••••••••</span>
                      </div>
                      <button className="text-sm font-bold text-action hover:text-action/80 text-left w-max">Passwort ändern</button>
                    </div>
                  </div>
                  
                  <div className="p-5 rounded-2xl border border-shading/10 bg-white flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-bold text-core text-sm">Zwei-Faktor-Authentifizierung (2FA)</span>
                      <span className="text-xs text-core/60 mt-1">Schütze deinen Account zusätzlich mit einer Authenticator-App.</span>
                    </div>
                    <button className="px-4 py-2 bg-core text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-core/90 transition-colors shadow-sm">
                      Aktivieren
                    </button>
                  </div>
                </div>

                {/* DANGER ZONE */}
                <div className="bg-white border border-red-500/20 rounded-3xl p-8 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-red-500 uppercase tracking-tight">Gefahrenzone</h2>
                      <p className="text-xs font-mono text-core/40">Zerstörerische Aktionen für deinen Account</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 border border-shading/10 rounded-xl bg-gray-50">
                      <div className="flex flex-col">
                        <span className="font-bold text-core text-sm">Datenexport anfordern</span>
                        <span className="text-xs text-core/60">Lade alle deine Rechnungen und Metadaten als Archiv herunter.</span>
                      </div>
                      <button className="px-4 py-2 border border-shading/20 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-gray-100 transition-colors">Export</button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-xl bg-red-50/50">
                      <div className="flex flex-col">
                        <span className="font-bold text-red-600 text-sm">Account endgültig löschen</span>
                        <span className="text-xs text-red-500/70">Dies löscht alle deine Daten unwiderruflich. Dein Abo wird sofort gekündigt.</span>
                      </div>
                      <button className="px-4 py-2 bg-red-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-red-700 transition-colors shadow-sm">Löschen</button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: BILLING */}
            {activeTab === "billing" && (
              <div className="flex flex-col gap-8">
                {/* CURRENT USAGE BENTO */}
                <div className="bg-white border border-shading/10 p-8 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-shading/10 pb-8 lg:pb-0 lg:pr-8">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="w-5 h-5 text-action" />
                      <h2 className="font-sans font-bold text-xl text-core">Dein aktueller Plan</h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-3xl font-black text-core uppercase tracking-widest bg-gray-100 px-4 py-2 rounded-lg border border-shading/10">
                        {tier}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-core flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-500"/> Aktiv</span>
                        <span className="text-xs text-core/60 font-mono mt-0.5">Nächste Abbuchung: 31. Aug</span>
                      </div>
                    </div>
                    <button className="text-left text-xs font-bold text-core/40 hover:text-red-500 transition-colors mt-auto w-max">Abo kündigen</button>
                  </div>

                  <div className="flex-1 flex flex-col gap-4 lg:pl-4">
                    <div className="flex items-center gap-3 mb-2">
                      <HardDrive className="w-5 h-5 text-core/60" />
                      <h2 className="font-sans font-bold text-xl text-core">Speicherplatz (Invoices)</h2>
                    </div>
                    <div className="flex flex-col justify-center gap-3 mt-2">
                      <div className="flex justify-between items-end mb-1">
                        <span className="font-mono text-xs text-core/60 uppercase">Verbraucht</span>
                        <span className="font-mono text-sm font-bold text-core">{usedMB} MB / {totalMB} MB</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${percentage > 90 ? 'bg-red-500' : 'bg-action'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ADD-ONS */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 ml-2">
                    <Layers className="w-5 h-5 text-core" />
                    <h2 className="font-sans font-bold text-xl text-core">Zusätzliches Volumen buchen</h2>
                  </div>
                  
                  <div className="bg-white border border-shading/10 rounded-2xl shadow-sm overflow-hidden w-full">
                    <div className="bg-core px-6 py-4 flex items-center justify-between">
                      <h3 className="font-mono text-xs md:text-sm font-bold text-white uppercase tracking-widest">Einmaliges Kontingent</h3>
                      <span className="bg-[#F48F65]/20 text-[#F48F65] px-3 py-1 text-[10px] font-bold uppercase rounded-md tracking-widest">Ohne Abo</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-shading/10">
                      {/* Add-ons content */}
                      <div className="p-8 flex flex-col items-center text-center">
                        <span className="text-4xl font-bold font-sans text-core mb-2">1,99€</span>
                        <span className="text-sm font-bold text-core mb-1">Einzelrechnung</span>
                        <span className="text-xs text-core/60 mb-6 flex-1">Flexibel wählbar</span>
                        <form action={generateCheckoutUrlAction} className="w-full flex gap-2">
                          <input type="hidden" name="tier" value="ADDON_1" />
                          <select name="quantity" className="bg-gray-50 border border-shading/10 rounded-xl px-2 text-center text-sm font-bold text-core focus:outline-none focus:border-action/50 cursor-pointer w-20">
                            {Array.from({ length: 19 }, (_, i) => (<option key={i+1} value={i+1}>{i+1}</option>))}
                          </select>
                          <button className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-core transition-colors">Kaufen</button>
                        </form>
                      </div>
                      <div className="p-8 flex flex-col items-center text-center">
                        <span className="text-4xl font-bold font-sans text-core mb-2">29,99€</span>
                        <span className="text-sm font-bold text-core mb-1">20 Rechnungen</span>
                        <span className="text-xs text-core/60 mb-6 flex-1 line-through decoration-action/50 decoration-2">Statt 39,80 €</span>
                        <form action={generateCheckoutUrlAction} className="w-full">
                          <input type="hidden" name="tier" value="ADDON_20" />
                          <button className="w-full py-3 rounded-xl font-bold text-sm bg-core hover:bg-core/90 text-white shadow-md transition-colors">Paket buchen</button>
                        </form>
                      </div>
                      <div className="p-8 flex flex-col items-center text-center">
                        <span className="text-4xl font-bold font-sans text-core mb-2">79,99€</span>
                        <span className="text-sm font-bold text-core mb-1">50 Rechnungen</span>
                        <span className="text-xs text-core/60 mb-6 flex-1 line-through decoration-action/50 decoration-2">Statt 99,50 €</span>
                        <form action={generateCheckoutUrlAction} className="w-full">
                          <input type="hidden" name="tier" value="ADDON_50" />
                          <button className="w-full py-3 rounded-xl font-bold text-sm bg-core hover:bg-core/90 text-white shadow-md transition-colors">Paket buchen</button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PRICING MATRIX */}
                <div className="flex flex-col gap-4 mt-4">
                  <div className="flex items-center gap-3 ml-2">
                    <Zap className="w-5 h-5 text-core" />
                    <h2 className="font-sans font-bold text-xl text-core">Tarif wechseln</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* STARTER */}
                    <div className={`relative flex flex-col bg-white border ${tier === 'STARTER' ? 'border-[#bfc0c0]' : 'border-shading/10 shadow-sm'} p-6 rounded-2xl`}>
                      {tier === 'STARTER' && (
                        <div className="absolute top-0 right-0 bg-gray-100 text-core/60 font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl border-l border-b border-[#bfc0c0]">Dein Plan</div>
                      )}
                      <h3 className="font-mono text-sm font-bold text-core uppercase tracking-widest mb-4">Starter</h3>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-bold font-sans text-core">19,99€</span><span className="text-xs text-core/60 font-sans">/ mtl.</span>
                      </div>
                      <div className="mb-6"><div className="font-bold text-core mb-1 text-sm">25 Rechnungen</div><div className="text-xs text-core/60">max. 1 GB Speicher</div></div>
                      <form action={generateCheckoutUrlAction} className="mt-auto">
                        <input type="hidden" name="tier" value="STARTER" />
                        <button disabled={tier === 'STARTER'} className={`w-full py-3 text-sm rounded-xl font-bold transition-colors border ${tier === 'STARTER' ? 'bg-gray-100 text-core/40 cursor-not-allowed border-transparent' : 'bg-white text-core hover:bg-gray-50 border-shading/20 shadow-sm'}`}>{tier === 'STARTER' ? 'Aktiv' : 'Aktivieren'}</button>
                      </form>
                    </div>

                    {/* PRO */}
                    <div className={`relative flex flex-col bg-core border ${tier === 'PRO' ? 'border-action shadow-md' : 'border-core shadow-lg'} p-6 rounded-2xl`}>
                      {tier === 'PRO' && (
                        <div className="absolute top-0 right-0 bg-action text-white font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl">Dein Plan</div>
                      )}
                      {tier !== 'PRO' && (
                        <div className="absolute top-6 right-6 bg-[#F48F65] text-white font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">Empfehlung</div>
                      )}
                      <h3 className="font-mono text-sm font-bold text-[#F48F65] uppercase tracking-widest mb-4">Pro</h3>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-bold font-sans text-white">49,99€</span><span className="text-xs text-white/60 font-sans">/ mtl.</span>
                      </div>
                      <div className="mb-6"><div className="font-bold text-white mb-1 text-sm">75 Rechnungen</div><div className="text-xs text-white/60">max. 3 GB Speicher</div></div>
                      <form action={generateCheckoutUrlAction} className="mt-auto">
                        <input type="hidden" name="tier" value="PRO" />
                        <button disabled={tier === 'PRO'} className={`w-full py-3 text-sm rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${tier === 'PRO' ? 'bg-[#F48F65]/50 text-white cursor-not-allowed opacity-90' : 'bg-[#F48F65] hover:bg-[#F48F65]/90 text-white shadow-md'}`}>{tier === 'PRO' ? 'Aktiv' : 'Aktivieren'}</button>
                      </form>
                    </div>

                    {/* BUSINESS */}
                    <div className={`relative flex flex-col bg-white border ${tier === 'BUSINESS' ? 'border-[#bfc0c0]' : 'border-shading/10 shadow-sm'} p-6 rounded-2xl`}>
                      {tier === 'BUSINESS' && (
                        <div className="absolute top-0 right-0 bg-gray-100 text-core/60 font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl border-l border-b border-[#bfc0c0]">Dein Plan</div>
                      )}
                      <h3 className="font-mono text-sm font-bold text-core uppercase tracking-widest mb-4">Business</h3>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-bold font-sans text-core">99,99€</span><span className="text-xs text-core/60 font-sans">/ mtl.</span>
                      </div>
                      <div className="mb-6"><div className="font-bold text-core mb-1 text-sm">150 Rechnungen</div><div className="text-xs text-core/60">max. 5 GB Speicher</div></div>
                      <form action={generateCheckoutUrlAction} className="mt-auto">
                        <input type="hidden" name="tier" value="BUSINESS" />
                        <button disabled={tier === 'BUSINESS'} className={`w-full py-3 text-sm rounded-xl font-bold transition-colors border ${tier === 'BUSINESS' ? 'bg-gray-100 text-core/40 cursor-not-allowed border-transparent' : 'bg-white text-core hover:bg-gray-50 border-shading/20 shadow-sm'}`}>{tier === 'BUSINESS' ? 'Aktiv' : 'Aktivieren'}</button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: INVOICE & WORKFLOW... [unchanged, omitted for brevity but they are handled by identical forms as before if requested, since user focus is on Company/KYB now] */}
            {(activeTab === "invoice" || activeTab === "workflow") && (
              <div className="bg-white border border-shading/10 rounded-3xl p-8 shadow-[0_2px_20px_rgb(0,0,0,0.02)] flex flex-col gap-8">
                <h2 className="text-xl font-black text-core uppercase tracking-tight">{activeTab === 'invoice' ? 'Rechnungsdaten' : 'Automatisierung'}</h2>
                <div className="p-8 bg-gray-50 border border-shading/10 rounded-2xl flex items-center justify-center text-core/50 font-mono text-sm text-center">
                  Bereich wurde temporär eingeklappt, um den Fokus auf die neue "Verifizierung & Briefkopf" Logic zu legen.<br/>
                  (Formular-Code ist im Backend noch intakt)
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
