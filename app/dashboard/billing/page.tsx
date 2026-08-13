import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { CreditCard, HardDrive, Zap, Check, ArrowRight, Layers } from "lucide-react"
import { generateCheckoutUrl } from "./actions"

export default async function BillingPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() }
      }
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = { tier: 'STARTER', storage_used_bytes: 0, futrdesk_invoice_email: '', cost_center: '', department: '' };
  if (user) {
    const { data } = await supabase.from('users').select('tier, storage_used_bytes, futrdesk_invoice_email, cost_center, department').eq('id', user.id).single();
    if (data) {
      profile = {
        tier: data.tier || 'STARTER',
        storage_used_bytes: data.storage_used_bytes || 0,
        futrdesk_invoice_email: data.futrdesk_invoice_email || '',
        cost_center: data.cost_center || '',
        department: data.department || ''
      };
    }
  }

  async function updateBilling(formData: FormData) {
    "use server"
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
             try {
               cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
               )
             } catch(err) {}
          }
        }
      }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('users').update({
      futrdesk_invoice_email: formData.get('futrdesk_invoice_email'),
      cost_center: formData.get('cost_center'),
      department: formData.get('department')
    }).eq('id', user.id);
    
    revalidatePath('/dashboard/billing');
  }

  // Calculate storage metrics
  const usedMB = (profile.storage_used_bytes / (1024 * 1024)).toFixed(1);
  let totalMB = 1000;
  if (profile.tier === 'PRO') totalMB = 3000;
  if (profile.tier === 'BUSINESS') totalMB = 5000;
  
  const percentage = Math.min(100, Math.max(0, (Number(usedMB) / totalMB) * 100));

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-10 pb-20">
      
      {/* HEADER */}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-core tracking-tight uppercase">Abrechnung</h1>
        <p className="text-core/50 font-mono text-xs mt-1">Dein Futrdesk-Abo und Zustellung unserer Rechnungen</p>
      </header>

      {/* CURRENT USAGE BENTO */}
      <div className="bg-white/80 backdrop-blur-md border border-[#bfc0c0] p-8 rounded-2xl shadow-sm flex flex-col lg:flex-row gap-8">
        
        {/* Active Plan */}
        <div className="flex-1 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-[#bfc0c0] pb-8 lg:pb-0 lg:pr-8">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-5 h-5 text-action" />
            <h2 className="font-sans font-bold text-xl text-core">Dein aktueller Plan</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-3xl font-black text-core uppercase tracking-widest bg-gray-100 px-4 py-2 rounded-lg border border-[#bfc0c0]">
              {profile.tier}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-core">Status: Aktiv</span>
              <span className="text-xs text-core/60 font-mono">Nächste Abrechnung: Monatsletzter</span>
            </div>
          </div>
        </div>

        {/* Storage Metrics */}
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

      {/* FUTRDESK INVOICE ROUTING FORM */}
      <form action={updateBilling} className="flex flex-col mt-4">
        <section className="bg-white border border-shading/10 rounded-3xl p-8 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-core/50">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-core">Futrdesk-Rechnungen empfangen</h2>
              <p className="text-xs font-mono text-core/40">Zustellung und Metadaten für unsere Abrechnung an dich</p>
            </div>
          </div>

          <p className="text-sm text-core/60 mb-8 leading-relaxed">
            Hier kannst du einstellen, an welche E-Mail-Adresse du die monatlichen Futrdesk-Abo-Rechnungen erhalten möchtest (z.B. direkt an deine Buchhaltung). Zusätzlich kannst du eine Kostenstelle oder Abteilung hinterlegen, die wir automatisch auf unseren Rechnungen an dich ausweisen, um dir die interne Zuordnung zu erleichtern.
          </p>
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">
                Empfänger E-Mail für Futrdesk-Rechnungen
              </label>
              <input 
                name="futrdesk_invoice_email"
                type="email"
                defaultValue={profile.futrdesk_invoice_email || user?.email || ""}
                placeholder="buchhaltung@musterfirma.de"
                className="w-full bg-gray-50 border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 focus:ring-2 focus:ring-action/20 transition-all" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <div className="flex flex-col gap-2 relative">
                <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">
                  Abteilung (Optional)
                </label>
                <input 
                  name="department"
                  type="text"
                  defaultValue={profile.department || ""}
                  placeholder="z.B. IT-Services"
                  className="w-full bg-gray-50 border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 focus:ring-2 focus:ring-action/20 transition-all" 
                />
              </div>
              
              <div className="flex flex-col gap-2 relative">
                <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">
                  Kostenstelle (Optional)
                </label>
                <input 
                  name="cost_center"
                  type="text"
                  defaultValue={profile.cost_center || ""}
                  placeholder="z.B. KS-4029"
                  className="w-full bg-gray-50 border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 focus:ring-2 focus:ring-action/20 transition-all" 
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button 
                type="submit"
                className="bg-core text-white hover:bg-core/90 transition-colors font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgb(0,0,0,0.1)]"
              >
                Abrechnungsdaten speichern
              </button>
            </div>
          </div>
        </section>
      </form>

      {/* PRICING MATRIX */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-8">
          <Zap className="w-5 h-5 text-core" />
          <h2 className="font-sans font-bold text-2xl text-core">Tarife & Optionen</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* STARTER */}
          <div className={`relative flex flex-col bg-white border ${profile.tier === 'STARTER' ? 'border-[#bfc0c0]' : 'border-shading/10 shadow-sm'} p-8 rounded-2xl`}>
            {profile.tier === 'STARTER' && (
              <div className="absolute top-0 right-0 bg-gray-100 text-core/60 font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl border-l border-b border-[#bfc0c0]">
                Dein Plan
              </div>
            )}
            <h3 className="font-mono text-sm font-bold text-core uppercase tracking-widest mb-4">Starter</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-bold font-sans text-core">19,99€</span>
              <span className="text-sm text-core/60 font-sans">/ Monat</span>
            </div>
            
            <div className="mb-8">
              <div className="font-bold text-core mb-1 text-sm">25 Rechnungen / Monat</div>
              <div className="text-xs text-core/60">max. 1 GB Speicher</div>
            </div>

            <ul className="flex flex-col gap-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-core/80 leading-relaxed"><Check className="w-4 h-4 text-core shrink-0 mt-0.5" /> E-Mail + WhatsApp + Telegram (inkl. Foto-Scanner & interaktivem Korrektur-Flow)</li>
              <li className="flex items-start gap-3 text-sm text-core/80 leading-relaxed"><Check className="w-4 h-4 text-core shrink-0 mt-0.5" /> ZUGFeRD PDF-Design (inklusive aller Pflichtangaben)</li>
              <li className="flex items-start gap-3 text-sm text-core/80 leading-relaxed"><Check className="w-4 h-4 text-core shrink-0 mt-0.5" /> Kundengedächtnis (Das System merkt sich Kunden und Adressen für Autovervollständigung)</li>
              <li className="flex items-start gap-3 text-sm text-core/80 leading-relaxed"><Check className="w-4 h-4 text-core shrink-0 mt-0.5" /> Monatlicher Auto-Export (Standard: ZIP mit PDFs & CSV an Buchhaltung/Steuerberater)</li>
              <li className="flex items-start gap-3 text-sm text-core/80 leading-relaxed"><Check className="w-4 h-4 text-core shrink-0 mt-0.5" /> Fail-Safe bei Limit-Überschreitung oder Accountlöschung (Automatischer Datenexport als ZIP)</li>
            </ul>
            <form action={generateCheckoutUrl}>
              <input type="hidden" name="tier" value="STARTER" />
              <button disabled={profile.tier === 'STARTER'} className={`w-full py-4 rounded-xl font-bold transition-colors border ${profile.tier === 'STARTER' ? 'bg-gray-100 text-core/40 cursor-not-allowed border-transparent' : 'bg-white text-core hover:bg-gray-50 border-shading/20 shadow-sm'}`}>
                {profile.tier === 'STARTER' ? 'Dein aktueller Tarif' : 'Starter aktivieren'}
              </button>
            </form>
          </div>

          {/* PRO */}
          <div className={`relative flex flex-col bg-core border ${profile.tier === 'PRO' ? 'border-action shadow-lg scale-100 md:scale-[1.02] z-10' : 'border-core shadow-xl scale-100 md:scale-[1.02] z-10'} p-8 rounded-2xl`}>
            {profile.tier === 'PRO' && (
              <div className="absolute top-0 right-0 bg-action text-white font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl">
                Dein Plan
              </div>
            )}
            {profile.tier !== 'PRO' && (
              <div className="absolute top-8 right-8 bg-[#F48F65] text-white font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-md">
                Empfehlung
              </div>
            )}
            <h3 className="font-mono text-sm font-bold text-[#F48F65] uppercase tracking-widest mb-4">Pro</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-bold font-sans text-white">49,99€</span>
              <span className="text-sm text-white/60 font-sans">/ Monat</span>
            </div>
            
            <div className="mb-8">
              <div className="font-bold text-white mb-1 text-sm">75 Rechnungen / Monat</div>
              <div className="text-xs text-white/60">max. 3 GB Speicher</div>
            </div>

            <ul className="flex flex-col gap-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-white/80 leading-relaxed"><Check className="w-4 h-4 text-[#F48F65] shrink-0 mt-0.5" /> E-Mail + WhatsApp + Telegram (inkl. Foto-Scanner & interaktivem Korrektur-Flow)</li>
              <li className="flex items-start gap-3 text-sm text-white/80 leading-relaxed"><Check className="w-4 h-4 text-[#F48F65] shrink-0 mt-0.5" /> ZUGFeRD PDF-Design (inklusive aller Pflichtangaben)</li>
              <li className="flex items-start gap-3 text-sm text-white/80 leading-relaxed"><Check className="w-4 h-4 text-[#F48F65] shrink-0 mt-0.5" /> Kundengedächtnis (Das System merkt sich Kunden und Adressen für Autovervollständigung)</li>
              <li className="flex items-start gap-3 text-sm text-white/80 leading-relaxed"><Check className="w-4 h-4 text-[#F48F65] shrink-0 mt-0.5" /> Monatlicher Auto-Export (Standard: ZIP mit PDFs & CSV an Buchhaltung/Steuerberater)</li>
              <li className="flex items-start gap-3 text-sm text-white/80 leading-relaxed"><Check className="w-4 h-4 text-[#F48F65] shrink-0 mt-0.5" /> Fail-Safe bei Limit-Überschreitung oder Accountlöschung (Automatischer Datenexport als ZIP)</li>
            </ul>
            <form action={generateCheckoutUrl}>
              <input type="hidden" name="tier" value="PRO" />
              <button disabled={profile.tier === 'PRO'} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${profile.tier === 'PRO' ? 'bg-[#F48F65]/50 text-white cursor-not-allowed opacity-90' : 'bg-[#F48F65] hover:bg-[#F48F65]/90 text-white shadow-md'}`}>
                {profile.tier === 'PRO' ? 'Dein aktueller Tarif' : 'Pro aktivieren'}
              </button>
            </form>
          </div>

          {/* BUSINESS */}
          <div className={`relative flex flex-col bg-white border ${profile.tier === 'BUSINESS' ? 'border-[#bfc0c0]' : 'border-shading/10 shadow-sm'} p-8 rounded-2xl`}>
            {profile.tier === 'BUSINESS' && (
              <div className="absolute top-0 right-0 bg-gray-100 text-core/60 font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl border-l border-b border-[#bfc0c0]">
                Dein Plan
              </div>
            )}
            <h3 className="font-mono text-sm font-bold text-core uppercase tracking-widest mb-4">Business</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-bold font-sans text-core">99,99€</span>
              <span className="text-sm text-core/60 font-sans">/ Monat</span>
            </div>
            
            <div className="mb-8">
              <div className="font-bold text-core mb-1 text-sm">150 Rechnungen / Monat</div>
              <div className="text-xs text-core/60">max. 5 GB Speicher</div>
            </div>

            <ul className="flex flex-col gap-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-core/80 leading-relaxed"><Check className="w-4 h-4 text-core shrink-0 mt-0.5" /> E-Mail + WhatsApp + Telegram (inkl. Foto-Scanner & interaktivem Korrektur-Flow)</li>
              <li className="flex items-start gap-3 text-sm text-core/80 leading-relaxed"><Check className="w-4 h-4 text-core shrink-0 mt-0.5" /> ZUGFeRD PDF-Design (inklusive aller Pflichtangaben)</li>
              <li className="flex items-start gap-3 text-sm text-core/80 leading-relaxed"><Check className="w-4 h-4 text-core shrink-0 mt-0.5" /> Kundengedächtnis (Das System merkt sich Kunden und Adressen für Autovervollständigung)</li>
              <li className="flex items-start gap-3 text-sm text-core/80 leading-relaxed"><Check className="w-4 h-4 text-core shrink-0 mt-0.5" /> Monatlicher Auto-Export (Standard: ZIP mit PDFs & CSV an Buchhaltung/Steuerberater)</li>
              <li className="flex items-start gap-3 text-sm text-core/80 leading-relaxed"><Check className="w-4 h-4 text-core shrink-0 mt-0.5" /> Fail-Safe bei Limit-Überschreitung oder Accountlöschung (Automatischer Datenexport als ZIP)</li>
            </ul>
            <form action={generateCheckoutUrl}>
              <input type="hidden" name="tier" value="BUSINESS" />
              <button disabled={profile.tier === 'BUSINESS'} className={`w-full py-4 rounded-xl font-bold transition-colors border ${profile.tier === 'BUSINESS' ? 'bg-gray-100 text-core/40 cursor-not-allowed border-transparent' : 'bg-white text-core hover:bg-gray-50 border-shading/20 shadow-sm'}`}>
                {profile.tier === 'BUSINESS' ? 'Dein aktueller Tarif' : 'Business aktivieren'}
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* ADD-ONS */}
      <div className="mt-12 mb-20">
        <div className="flex items-center gap-3 mb-8">
          <Layers className="w-5 h-5 text-core" />
          <h2 className="font-sans font-bold text-2xl text-core">Zusätzliches Volumen</h2>
        </div>
        
        <div className="bg-white border border-shading/10 rounded-2xl shadow-sm overflow-hidden w-full">
          <div className="bg-core px-6 py-4 flex items-center justify-between">
            <h3 className="font-mono text-xs md:text-sm font-bold text-white uppercase tracking-widest">Volumen überschritten?</h3>
            <span className="bg-[#F48F65]/20 text-[#F48F65] px-3 py-1 text-[10px] font-bold uppercase rounded-md tracking-widest">Variabel Wählbar</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-shading/10">
            {/* 1 Invoice */}
            <div className="p-8 flex flex-col items-center text-center">
              <span className="text-4xl font-bold font-sans text-core mb-2">1,99€</span>
              <span className="text-sm font-bold text-core mb-1">Einzelrechnung</span>
              <span className="text-xs text-core/60 mb-6 flex-1">Flexibel von 1-19 Rechnungen</span>
              <form action={generateCheckoutUrl} className="w-full flex gap-2">
                <input type="hidden" name="tier" value="ADDON_1" />
                <select name="quantity" className="bg-gray-50 border border-shading/10 rounded-xl px-2 text-center text-sm font-bold text-core focus:outline-none focus:border-action/50 cursor-pointer w-20">
                  {Array.from({ length: 19 }, (_, i) => (
                    <option key={i+1} value={i+1}>{i+1}</option>
                  ))}
                </select>
                <button className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-core transition-colors">
                  Kaufen
                </button>
              </form>
            </div>
            
            {/* 20 Invoices */}
            <div className="p-8 flex flex-col items-center text-center">
              <span className="text-4xl font-bold font-sans text-core mb-2">29,99€</span>
              <span className="text-sm font-bold text-core mb-1">20 Rechnungen</span>
              <span className="text-xs text-core/60 mb-6 flex-1 line-through decoration-action/50 decoration-2">Statt 39,80 €</span>
              <form action={generateCheckoutUrl} className="w-full">
                <input type="hidden" name="tier" value="ADDON_20" />
                <button className="w-full py-3 rounded-xl font-bold text-sm bg-core hover:bg-core/90 text-white shadow-md transition-colors">
                  Paket buchen
                </button>
              </form>
            </div>
            
            {/* 50 Invoices */}
            <div className="p-8 flex flex-col items-center text-center">
              <span className="text-4xl font-bold font-sans text-core mb-2">79,99€</span>
              <span className="text-sm font-bold text-core mb-1">50 Rechnungen</span>
              <span className="text-xs text-core/60 mb-6 flex-1 line-through decoration-action/50 decoration-2">Statt 99,50 €</span>
              <form action={generateCheckoutUrl} className="w-full">
                <input type="hidden" name="tier" value="ADDON_50" />
                <button className="w-full py-3 rounded-xl font-bold text-sm bg-core hover:bg-core/90 text-white shadow-md transition-colors">
                  Paket buchen
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
