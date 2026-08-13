import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { Building2, Archive as ArchiveIcon, Send, Save, Mail, User } from "lucide-react"

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL)!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() }
      }
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  if (user) {
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    profile = data;
  }

  async function updateSettings(formData: FormData) {
    "use server"
    const cookieStore = await cookies();
    const supabase = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL)!,
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)!,
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
      company_name: formData.get('company_name'),
      email: formData.get('email'), // Note: this usually requires auth.updateUser for real email change
      auto_send_invoices: formData.get('auto_send_invoices') === 'on',
      export_email: formData.get('export_email'),
      export_target: formData.get('export_target') // 'account' or 'custom'
    }).eq('id', user.id);
    
    revalidatePath('/dashboard/settings');
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10">
      
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-core tracking-tight uppercase">Einstellungen</h1>
        <p className="text-core/50 font-mono text-xs mt-1">Account-Daten, Rechnungsversand & Archiv-Routing</p>
      </header>

      <form action={updateSettings} className="flex flex-col gap-8">
        
        {/* ACCOUNT SETTINGS */}
        <section className="bg-white border border-shading/10 rounded-3xl p-8 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-core/50">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-core">Account-Einstellungen</h2>
              <p className="text-xs font-mono text-core/40">Basisdaten deines Unternehmens</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Unternehmensname</label>
              <input 
                name="company_name"
                type="text" 
                defaultValue={profile?.company_name || ""} 
                placeholder="Musterfirma GmbH"
                className="w-full bg-gray-50 border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 focus:ring-2 focus:ring-action/20 transition-all" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-core/50 font-mono">Account E-Mail (Hauptkontakt)</label>
              <input 
                name="email"
                type="email" 
                defaultValue={user?.email || ""} 
                readOnly
                className="w-full bg-gray-50 border border-shading/10 rounded-xl px-4 py-3 text-sm font-medium text-core/60 cursor-not-allowed" 
              />
              <span className="text-[10px] text-core/40 font-mono">Die E-Mail Adresse kann aktuell nur über den Support geändert werden.</span>
            </div>
          </div>
        </section>

        {/* AUTO-DELIVERY TO CUSTOMERS */}
        <section className="bg-white border border-shading/10 rounded-3xl p-8 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-action/10 flex items-center justify-center text-action">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-core">Automatische Rechnungszustellung (An Kunden)</h2>
              <p className="text-xs font-mono text-core/40">Versand-Regeln für neu erstellte ZUGFeRD-Belege</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-action/5 border border-action/20 rounded-xl">
            <input 
              type="checkbox" 
              name="auto_send_invoices"
              id="auto-send" 
              defaultChecked={profile?.auto_send_invoices !== false} 
              className="mt-1 w-5 h-5 accent-action rounded cursor-pointer" 
            />
            <div>
              <label htmlFor="auto-send" className="font-bold text-core text-sm block cursor-pointer">Erstellte ZUGFeRD-Rechnungen sofort per E-Mail an den Kunden senden</label>
              <p className="text-xs text-core/60 mt-1 leading-relaxed">
                Sobald du Rechnungsdaten (via WhatsApp, Telegram oder E-Mail) einreichst und unsere KI daraus erfolgreich einen ZUGFeRD-Beleg generiert hat, wird dieser vollautomatisch an die hinterlegte E-Mail-Adresse des Kunden gesendet.
              </p>
            </div>
          </div>
        </section>

        {/* MONTHLY ARCHIVE ROUTING */}
        <section className="bg-white border border-shading/10 rounded-3xl p-8 shadow-[0_2px_20px_rgb(0,0,0,0.02)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-core/50">
              <ArchiveIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-core">Monats-Archiv (ZIP) Routing</h2>
              <p className="text-xs font-mono text-core/40">Zustellung der gesammelten Rechnungen</p>
            </div>
          </div>

          <p className="text-sm text-core/60 mb-6">
            Am Ende jedes Monats (oder wenn dein Speicherplatz voll ist) erstellen wir ein gebündeltes ZIP-Archiv aller Belege. Standardmäßig senden wir dir dieses Archiv an deine Account-E-Mail. Du kannst es hier auch direkt an deinen Steuerberater umleiten.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <input 
                type="radio" 
                id="route-account" 
                name="export_target" 
                value="account"
                defaultChecked={profile?.export_target !== 'custom'} 
                className="w-5 h-5 accent-action cursor-pointer" 
              />
              <label htmlFor="route-account" className="font-bold text-core text-sm cursor-pointer">An meine Account E-Mail senden (Default)</label>
            </div>
            
            <div className="flex items-start gap-3">
              <input 
                type="radio" 
                id="route-custom" 
                name="export_target" 
                value="custom"
                defaultChecked={profile?.export_target === 'custom'} 
                className="mt-1 w-5 h-5 accent-action cursor-pointer" 
              />
              <div className="flex-1">
                <label htmlFor="route-custom" className="font-bold text-core text-sm cursor-pointer">An Steuerberater / Buchhaltung weiterleiten</label>
                <div className="mt-3 flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative max-w-md">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-core/30" />
                    <input 
                      name="export_email"
                      type="email" 
                      defaultValue={profile?.export_email || ""}
                      placeholder="kanzlei@steuerberater.de" 
                      className="w-full bg-gray-50 border border-shading/10 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-core focus:outline-none focus:border-action/50 focus:ring-2 focus:ring-action/20 transition-all" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end mt-2 mb-20">
          <button 
            type="submit"
            className="bg-core text-white hover:bg-core/90 transition-colors font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-3 shadow-[0_4px_20px_rgb(0,0,0,0.1)]"
          >
            <Save className="w-5 h-5" />
            Einstellungen speichern
          </button>
        </div>

      </form>
    </div>
  );
}
