"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, CreditCard, Send, HardDrive, Zap, Layers, Mail, Archive as ArchiveIcon, Save, Building2, Shield, AlertTriangle, Key, CheckCircle2, FileText, Lock, Unlock, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { updateAuthEmail, updateAuthPassword, deleteAccount, triggerDataExport } from "./securityActions";

export default function SettingsClient({ profile, email, generateCheckoutUrlAction, updateSettingsAction }: any) {
  const [activeTab, setActiveTab] = useState("company");
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  
  // Security Tab States
  const [isPending, startTransition] = useTransition();
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [securityMessage, setSecurityMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Company Profile defaults
  const initialCompany = profile?.company_profile || {
    company_name: profile?.company_name || "",
    legal_form: profile?.legal_form || "",
    managing_director: profile?.managing_director || "",
    street: profile?.street || "",
    zip: profile?.zip || "",
    city: profile?.city || "",
    public_email: profile?.public_email || "",
    website: profile?.website || "",
    phone: profile?.phone || "",
    vat_id: profile?.vat_id || "",
    tax_id: profile?.tax_id || "",
    commercial_register: profile?.commercial_register || "",
    iban: profile?.iban || "",
    bic: profile?.bic || "",
    bank_name: profile?.bank_name || "",
    is_small_business: profile?.is_small_business || false
  };
  const [companyForm, setCompanyForm] = useState(initialCompany);
  const [isFetchingVat, setIsFetchingVat] = useState(false);

  const [isVatValid, setIsVatValid] = useState<boolean | null>(null);

  const handleFetchVat = async () => {
    if (!companyForm.vat_id) return;
    setIsFetchingVat(true);
    setIsVatValid(null);
    
    try {
      const { verifyVatId } = await import('../onboardingActions');
      const res = await verifyVatId(companyForm.vat_id);
      
      if (res.success && res.company) {
        setIsVatValid(true);
        // German VIES blocks name/address (returns '---'). Only fill if it's actual data.
        if (res.company.name && res.company.name !== '---') {
          setCompanyForm((prev: any) => ({ ...prev, company_name: res.company.name }));
        }
        if (res.company.address && res.company.address !== '---') {
          const parts = res.company.address.split('\n');
          const streetPart = parts[0] || '';
          const cityPart = parts[1] || '';
          const zipMatch = cityPart.match(/\d{5}/);
          
          setCompanyForm((prev: any) => ({
            ...prev,
            street: streetPart || prev.street,
            zip: zipMatch ? zipMatch[0] : prev.zip,
            city: cityPart.replace(/\d{5}/, '').trim() || prev.city,
          }));
        }
      } else {
        setIsVatValid(false);
      }
    } catch (e) {
      alert("Fehler bei der Überprüfung.");
    }
    
    setIsFetchingVat(false);
  };

  const handleSecurityAction = (action: () => Promise<{success?: string, error?: string}>) => {
    setSecurityMessage(null);
    startTransition(async () => {
      const res = await action();
      if (res.error) setSecurityMessage({ type: 'error', text: res.error });
      else if (res.success) setSecurityMessage({ type: 'success', text: res.success });
      
      setEditingEmail(false);
      setEditingPassword(false);
      setNewEmail("");
      setNewPassword("");
      
      if (res.success) setTimeout(() => setSecurityMessage(null), 5000);
    });
  };

  const tabs = [
    { id: "company", label: "Firmendaten", icon: Building2 },
    { id: "security", label: "Sicherheit & Login", icon: Shield },
    { id: "billing", label: "Abo & Volumen", icon: HardDrive },
    { id: "invoice", label: "Rechnungsdaten", icon: CreditCard },
    { id: "workflow", label: "Automatisierung", icon: Send },
  ];

  const storageBytes = profile?.storage_used_bytes || 0;
  const usedMB = (storageBytes / (1024 * 1024)).toFixed(1);
  const tier = profile?.tier || 'STARTER';
  let totalMB = 1000;
  if (tier === 'PRO') totalMB = 3000;
  if (tier === 'BUSINESS') totalMB = 5000;
  const percentage = Math.min(100, Math.max(0, (Number(usedMB) / totalMB) * 100));

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
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* TAB: COMPANY (BRIEFKOPF) */}
            {activeTab === "company" && (
              <div className="flex flex-col gap-8">
                
                {/* BRIEFKOPF VORSCHAU */}
                <div className="bg-white border border-shading/10 rounded-3xl p-8 shadow-[0_2px_20px_rgb(0,0,0,0.02)] flex flex-col gap-8">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-core/50">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-core uppercase tracking-tight">Dein Briefkopf</h2>
                        <p className="text-xs font-mono text-core/40">Alle rechtlichen Daten für deine Rechnungen</p>
                      </div>
                    </div>
                    {!isEditingCompany && (
                      <button onClick={() => setIsEditingCompany(true)} className="px-4 py-2 border border-shading/10 rounded-xl font-bold text-xs uppercase tracking-widest text-core hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                        Bearbeiten
                      </button>
                    )}
                  </div>

                  {!isEditingCompany ? (
                    // PREVIEW MODE
                    <div className="w-full bg-[#f8f9fa] rounded-2xl p-8 border border-dashed border-gray-300 relative overflow-hidden flex flex-col font-mono text-sm shadow-inner group">
                      <div className="absolute top-0 right-0 bg-gray-200 text-core/40 font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">Vorschau</div>
                      
                      <div className="flex flex-col gap-1 mb-8">
                        <span className="text-xl font-black text-core font-sans tracking-tight">{initialCompany.company_name || 'Musterfirma'} {initialCompany.legal_form}</span>
                        {initialCompany.managing_director && <span className="text-sm font-bold text-core/80 mt-1">Vertreten durch: {initialCompany.managing_director}</span>}
                        <span className="text-core/60 mt-2">{initialCompany.street || 'Musterstraße 1'}</span>
                        <span className="text-core/60">{initialCompany.zip || '10115'} {initialCompany.city || 'Berlin'}</span>
                        {initialCompany.is_small_business && <span className="text-xs font-bold text-action mt-2">Kleinunternehmer gemäß § 19 UStG</span>}
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 max-w-lg text-xs text-core/50 mb-6">
                        <div><span className="font-bold text-core/70">USt-IdNr.:</span> {initialCompany.vat_id || '-'}</div>
                        <div><span className="font-bold text-core/70">E-Mail:</span> {initialCompany.public_email || '-'}</div>
                        <div><span className="font-bold text-core/70">Steuernummer:</span> {initialCompany.tax_id || '-'}</div>
                        <div><span className="font-bold text-core/70">Tel:</span> {initialCompany.phone || '-'}</div>
                        <div><span className="font-bold text-core/70">Register:</span> {initialCompany.commercial_register || '-'}</div>
                        <div><span className="font-bold text-core/70">Web:</span> {initialCompany.website || '-'}</div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-300 border-dashed grid grid-cols-2 gap-y-2 text-xs text-core/50">
                        <div className="col-span-2 text-[10px] uppercase font-bold text-core/40 tracking-widest mb-1">Bankverbindung</div>
                        <div className="col-span-2"><span className="font-bold text-core/70">Bank:</span> {initialCompany.bank_name || '-'}</div>
                        <div className="col-span-2 font-mono"><span className="font-bold text-core/70 font-sans">IBAN:</span> {initialCompany.iban || '-'}</div>
                        <div className="col-span-2 font-mono"><span className="font-bold text-core/70 font-sans">BIC:</span> {initialCompany.bic || '-'}</div>
                      </div>
                    </div>
                  ) : (
                    // EDIT MODE
                    <form action={updateSettingsAction} className="flex flex-col gap-8 bg-gray-50 p-6 rounded-2xl border border-shading/10 shadow-inner">
                      <input type="hidden" name="form_type" value="company_profile" />
                      
                      <div className="bg-white p-4 rounded-xl border border-action/20 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-action shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-core">Du bist rechtlich verantwortlich!</span>
                          <span className="text-xs text-core/60">Die korrekte Angabe dieser Daten ist essenziell für die Rechtsgültigkeit deiner Dokumente (z.B. ZUGFeRD). Bitte prüfe alle Felder sorgfältig.</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2 relative group md:col-span-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono flex items-center gap-2">Umsatzsteuer-ID (USt-IdNr.)</label>
                          <div className="flex gap-2">
                            <input 
                              name="vat_id" 
                              type="text" 
                              value={companyForm.vat_id} 
                              onChange={e => {
                                setCompanyForm({...companyForm, vat_id: e.target.value.toUpperCase()});
                                setIsVatValid(null); // Reset validation on type
                              }} 
                              placeholder="DE123456789" 
                              className={cn(
                                "flex-1 border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition-all uppercase shadow-sm",
                                isVatValid === true ? "border-green-500 bg-green-50 text-green-900" : 
                                isVatValid === false ? "border-red-500 bg-red-50 text-red-900" : 
                                "border-shading/10 bg-white text-core focus:border-action/50"
                              )} 
                            />
                            <button type="button" onClick={handleFetchVat} disabled={isFetchingVat || !companyForm.vat_id} className={cn(
                              "text-white px-6 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm whitespace-nowrap disabled:opacity-50 transition-colors",
                              isVatValid === true ? "bg-green-600 hover:bg-green-700" : "bg-core hover:bg-core/90"
                            )}>
                              {isFetchingVat ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                               isVatValid === true ? <CheckCircle2 className="w-4 h-4" /> : 
                               <Shield className="w-4 h-4" />} 
                              {isVatValid === true ? "Gültig!" : "Gültigkeit prüfen"}
                            </button>
                          </div>
                          <span className="text-[10px] text-core/40 ml-1">Klicke auf Prüfen, um die Gültigkeit der ID live über das Bundeszentralamt für Steuern zu bestätigen.</span>
                        </div>

                        <div className="flex flex-col gap-2 relative mt-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Firmenname</label>
                          <input name="company_name" type="text" value={companyForm.company_name} onChange={e => setCompanyForm({...companyForm, company_name: e.target.value})} className="w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all bg-white shadow-sm" />
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Rechtsform (z.B. GmbH, Freiberufler)</label>
                          <input name="legal_form" type="text" value={companyForm.legal_form} onChange={e => setCompanyForm({...companyForm, legal_form: e.target.value})} className="w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all bg-white shadow-sm" />
                        </div>

                        <div className="flex flex-col gap-2 md:col-span-2 mb-4">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Geschäftsführer / Inhaber (Optional)</label>
                          <input name="managing_director" type="text" value={companyForm.managing_director} onChange={e => setCompanyForm({...companyForm, managing_director: e.target.value})} placeholder="Max Mustermann" className="w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all bg-white shadow-sm" />
                        </div>
                        
                        <div className="flex flex-col gap-2 md:col-span-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Straße & Hausnummer</label>
                          <input name="street" type="text" value={companyForm.street} onChange={e => setCompanyForm({...companyForm, street: e.target.value})} className="w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all bg-white shadow-sm" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">PLZ</label>
                          <input name="zip" type="text" value={companyForm.zip} onChange={e => setCompanyForm({...companyForm, zip: e.target.value})} className="w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all bg-white shadow-sm" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Stadt</label>
                          <input name="city" type="text" value={companyForm.city} onChange={e => setCompanyForm({...companyForm, city: e.target.value})} className="w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all bg-white shadow-sm" />
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Steuernummer</label>
                          <input name="tax_id" type="text" value={companyForm.tax_id} onChange={e => setCompanyForm({...companyForm, tax_id: e.target.value})} className="w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all bg-white shadow-sm" />
                        </div>

                        {/* Editable contact fields */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-action font-mono">Öffentliche E-Mail</label>
                          <input name="public_email" type="email" value={companyForm.public_email} onChange={e => setCompanyForm({...companyForm, public_email: e.target.value})} className="w-full bg-white shadow-sm border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-action font-mono">Website</label>
                          <input name="website" type="url" value={companyForm.website} onChange={e => setCompanyForm({...companyForm, website: e.target.value})} className="w-full bg-white shadow-sm border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-action font-mono">Telefon</label>
                          <input name="phone" type="tel" value={companyForm.phone} onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} className="w-full bg-white shadow-sm border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-action font-mono">Handelsregister (optional)</label>
                          <input name="commercial_register" type="text" value={companyForm.commercial_register} onChange={e => setCompanyForm({...companyForm, commercial_register: e.target.value})} className="w-full bg-white shadow-sm border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all" />
                        </div>
                      </div>

                      <div className="border-t border-shading/10 pt-6 mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <h3 className="font-bold text-sm text-core uppercase tracking-widest font-mono mb-1">Zahlungsverkehr (Bankdaten)</h3>
                          <p className="text-xs text-core/60">Notwendig, damit deine Kunden deine ZUGFeRD-Rechnungen bezahlen können.</p>
                        </div>
                        <div className="flex flex-col gap-2 md:col-span-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Bankname</label>
                          <input name="bank_name" type="text" value={companyForm.bank_name} onChange={e => setCompanyForm({...companyForm, bank_name: e.target.value})} placeholder="z.B. Deutsche Bank" className="w-full bg-white shadow-sm border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">IBAN</label>
                          <input name="iban" type="text" value={companyForm.iban} onChange={e => setCompanyForm({...companyForm, iban: e.target.value.toUpperCase().replace(/\s/g, '')})} placeholder="DEXX XXXX XXXX XXXX XXXX XX" className="w-full bg-white shadow-sm border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all font-mono uppercase" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">BIC</label>
                          <input name="bic" type="text" value={companyForm.bic} onChange={e => setCompanyForm({...companyForm, bic: e.target.value.toUpperCase().replace(/\s/g, '')})} className="w-full bg-white shadow-sm border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all font-mono uppercase" />
                        </div>
                      </div>

                      <div className="border-t border-shading/10 pt-6 mt-2 flex items-start gap-4">
                        <div className="pt-1">
                          <input type="checkbox" name="is_small_business" checked={companyForm.is_small_business} onChange={e => setCompanyForm({...companyForm, is_small_business: e.target.checked})} className="w-5 h-5 accent-action cursor-pointer rounded-md" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-core">Kleinunternehmer (§ 19 UStG)</span>
                          <span className="text-xs text-core/60 mt-1">Aktivieren, wenn du als Freelancer/Gewerbe von der Umsatzsteuer befreit bist. Der gesetzliche Pflichthinweis wird automatisch auf deinen Rechnungen platziert.</span>
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
                
                {securityMessage && (
                  <div className={cn("p-4 rounded-2xl border flex items-center gap-3", securityMessage.type === 'error' ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700")}>
                    {securityMessage.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    <span className="text-sm font-bold">{securityMessage.text}</span>
                  </div>
                )}
                
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
                      {!editingEmail ? (
                        <>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono block mb-1">Login E-Mail</span>
                            <span className="font-bold text-core block">{email}</span>
                          </div>
                          <button onClick={() => setEditingEmail(true)} className="text-sm font-bold text-action hover:text-action/80 text-left w-max">E-Mail ändern</button>
                        </>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-action font-mono">Neue E-Mail Adresse</label>
                          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="neue@email.de" className="w-full border border-shading/10 rounded-xl px-3 py-2 text-sm text-core focus:border-action/50 focus:outline-none" />
                          <div className="flex gap-2">
                            <button onClick={() => setEditingEmail(false)} className="px-3 py-2 text-xs font-bold text-core/60 hover:text-core">Abbrechen</button>
                            <button disabled={isPending || !newEmail} onClick={() => handleSecurityAction(() => updateAuthEmail(newEmail))} className="px-3 py-2 text-xs font-bold bg-core text-white rounded-lg flex items-center gap-2">
                              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Speichern
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 p-5 rounded-2xl border border-shading/10 bg-gray-50">
                      {!editingPassword ? (
                        <>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono block mb-1">Passwort</span>
                            <span className="font-bold text-core block tracking-[0.2em]">••••••••</span>
                          </div>
                          <button onClick={() => setEditingPassword(true)} className="text-sm font-bold text-action hover:text-action/80 text-left w-max">Passwort ändern</button>
                        </>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-action font-mono">Neues Passwort</label>
                          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 Zeichen" className="w-full border border-shading/10 rounded-xl px-3 py-2 text-sm text-core focus:border-action/50 focus:outline-none" />
                          <div className="flex gap-2">
                            <button onClick={() => setEditingPassword(false)} className="px-3 py-2 text-xs font-bold text-core/60 hover:text-core">Abbrechen</button>
                            <button disabled={isPending || newPassword.length < 6} onClick={() => handleSecurityAction(() => updateAuthPassword(newPassword))} className="px-3 py-2 text-xs font-bold bg-core text-white rounded-lg flex items-center gap-2">
                              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Speichern
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5 rounded-2xl border border-shading/10 bg-white flex items-center justify-between opacity-50 grayscale pointer-events-none">
                    <div className="flex flex-col">
                      <span className="font-bold text-core text-sm">Zwei-Faktor-Authentifizierung (2FA)</span>
                      <span className="text-xs text-core/60 mt-1">Schütze deinen Account zusätzlich mit einer Authenticator-App. (In Kürze verfügbar)</span>
                    </div>
                    <button className="px-4 py-2 bg-core text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-sm">
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
                      <button disabled={isPending} onClick={() => handleSecurityAction(triggerDataExport)} className="px-4 py-2 border border-shading/20 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2">
                        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Export"}
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-red-200 rounded-xl bg-red-50/50">
                      <div className="flex flex-col">
                        <span className="font-bold text-red-600 text-sm">Account endgültig löschen</span>
                        <span className="text-xs text-red-500/70">Dies löscht alle deine Daten unwiderruflich. Dein Abo wird sofort gekündigt.</span>
                      </div>
                      <button 
                        disabled={isPending} 
                        onClick={() => {
                          if(window.confirm("Bist du sicher, dass du deinen Account komplett löschen möchtest? Dies kann nicht rückgängig gemacht werden!")) {
                            handleSecurityAction(deleteAccount);
                          }
                        }} 
                        className="px-4 py-2 bg-red-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2"
                      >
                        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Löschen"}
                      </button>
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

            {/* TAB: INVOICE */}
            {activeTab === "invoice" && (
              <div className="bg-white border border-shading/10 rounded-3xl p-8 shadow-[0_2px_20px_rgb(0,0,0,0.02)] flex flex-col gap-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-core/50">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-core uppercase tracking-tight">Rechnungsdaten</h2>
                    <p className="text-xs font-mono text-core/40">Zahlungs- und Abrechnungsinformationen</p>
                  </div>
                </div>

                <form action={updateSettingsAction} className="flex flex-col gap-6">
                  <input type="hidden" name="form_type" value="billing" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">E-Mail für Futrdesk-Rechnungen</label>
                      <input name="futrdesk_invoice_email" type="email" defaultValue={profile?.futrdesk_invoice_email || email} className="w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all shadow-sm" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Abteilung (Optional)</label>
                      <input name="department" type="text" defaultValue={profile?.department} placeholder="z.B. Buchhaltung" className="w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all shadow-sm" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Kostenstelle (Optional)</label>
                      <input name="cost_center" type="text" defaultValue={profile?.cost_center} placeholder="z.B. 1000" className="w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-shading/10">
                    <button type="submit" className="bg-core text-white hover:bg-core/90 transition-colors font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm">
                      <Save className="w-4 h-4" /> Speichern
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: WORKFLOW */}
            {activeTab === "workflow" && (
              <div className="bg-white border border-shading/10 rounded-3xl p-8 shadow-[0_2px_20px_rgb(0,0,0,0.02)] flex flex-col gap-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-core/50">
                    <Send className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-core uppercase tracking-tight">Automatisierung</h2>
                    <p className="text-xs font-mono text-core/40">Workflows & Steuerberater-Export</p>
                  </div>
                </div>

                <form action={updateSettingsAction} className="flex flex-col gap-8">
                  <input type="hidden" name="form_type" value="workflow" />
                  
                  <div className="flex items-start gap-4 p-5 rounded-2xl border border-shading/10 bg-gray-50">
                    <div className="pt-1">
                      <input type="checkbox" name="auto_send_invoices" defaultChecked={profile?.auto_send_invoices !== false} className="w-5 h-5 accent-action cursor-pointer rounded-md" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-core">Auto-Versand aktivieren</span>
                      <span className="text-xs text-core/60 mt-1">Eingehende Rechnungen werden sofort nach Erkennung weitergeleitet. Bei Deaktivierung müssen Rechnungen manuell im Dashboard freigegeben werden.</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Export-Ziel</label>
                      <select name="export_target" defaultValue={profile?.export_target || 'DATEV'} className="w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all shadow-sm bg-white">
                        <option value="DATEV">DATEV Unternehmen online</option>
                        <option value="LEXOFFICE">Lexoffice</option>
                        <option value="SEVDESK">sevDesk</option>
                        <option value="CUSTOM_EMAIL">E-Mail (ZIP-Archiv)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Export E-Mail Adresse</label>
                      <input name="export_email" type="email" defaultValue={profile?.export_email || ''} placeholder="steuerberater@kanzlei.de" className="w-full border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-shading/10">
                    <button type="submit" className="bg-core text-white hover:bg-core/90 transition-colors font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm">
                      <Save className="w-4 h-4" /> Speichern
                    </button>
                  </div>
                </form>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
