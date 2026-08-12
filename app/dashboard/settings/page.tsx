import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { Building2, Bell, DownloadCloud, Save } from "lucide-react"

export default async function SettingsPage() {
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
  
  let profile = null;
  if (user) {
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    profile = data;
  }

  async function updateSettings(formData: FormData) {
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
             } catch(err) {
               // Ignore in server action
             }
          }
        }
      }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('users').update({
      company_name: formData.get('company_name'),
      tax_number: formData.get('tax_number'),
      vat_id: formData.get('vat_id'),
      export_frequency: formData.get('export_frequency'),
      auto_export_enabled: formData.get('auto_export_enabled') === 'on',
      export_email: formData.get('export_email'),
      alert_channel: formData.get('alert_channel')
    }).eq('id', user.id);
    
    revalidatePath('/dashboard/settings');
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-sans text-core tracking-tight">
          Workflow & Operationen
        </h1>
        <p className="text-core/70 font-sans text-lg">
          Zentrale Steuerung für Automatisierungen, Rechnungs-Metadaten und Benachrichtigungen.
        </p>
      </header>

      <form action={updateSettings} className="flex flex-col gap-8">
        
        {/* SEKTION 1 */}
        <section className="bg-white/80 backdrop-blur-md border border-[#bfc0c0] p-8 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-action" />
            <h2 className="font-sans font-bold text-xl text-core">Stammdaten</h2>
          </div>
          <p className="text-sm text-core/60 mb-6 font-mono">
            Wird für die korrekte Ausweisung in deinen ZUGFeRD-Daten verwendet.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-core/50 uppercase tracking-widest font-mono">
                Firmenname / Rechnungssteller
              </label>
              <input 
                name="company_name"
                defaultValue={profile?.company_name || ""}
                className="border border-[#bfc0c0] bg-gray-50 px-4 py-3 rounded-xl font-mono text-sm focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-all" 
                placeholder="z.B. Muster GmbH"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-core/50 uppercase tracking-widest font-mono">
                Steuernummer
              </label>
              <input 
                name="tax_number"
                defaultValue={profile?.tax_number || ""}
                className="border border-[#bfc0c0] bg-gray-50 px-4 py-3 rounded-xl font-mono text-sm focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-all" 
                placeholder="z.B. 12/345/67890"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-core/50 uppercase tracking-widest font-mono">
                USt-IdNr. (VAT-ID)
              </label>
              <input 
                name="vat_id"
                defaultValue={profile?.vat_id || ""}
                className="border border-[#bfc0c0] bg-gray-50 px-4 py-3 rounded-xl font-mono text-sm focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-all" 
                placeholder="z.B. DE123456789"
              />
            </div>
          </div>
        </section>

        {/* SEKTION 2 */}
        <section className="bg-white/80 backdrop-blur-md border border-[#bfc0c0] p-8 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <DownloadCloud className="w-5 h-5 text-action" />
            <h2 className="font-sans font-bold text-xl text-core">Workflow & Export-Abläufe</h2>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-core/50 uppercase tracking-widest font-mono">
                Export-Intervall
              </label>
              <select 
                name="export_frequency"
                defaultValue={profile?.export_frequency || "monthly"}
                className="border border-[#bfc0c0] bg-gray-50 px-4 py-3 rounded-xl font-mono text-sm focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-all w-full md:w-1/2"
              >
                <option value="monthly">Monatlich am Letzten</option>
                <option value="on_limit">Sofort bei Erreichen der Speichergrenze (1 GB)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <input 
                type="checkbox" 
                name="auto_export_enabled" 
                id="auto_export_enabled"
                defaultChecked={profile?.auto_export_enabled}
                className="w-5 h-5 accent-action rounded border-[#bfc0c0] cursor-pointer"
              />
              <label htmlFor="auto_export_enabled" className="text-sm font-bold text-core font-sans cursor-pointer">
                ZIP-Bundle automatisch an Steuerberater senden
              </label>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label className="text-xs font-bold text-core/50 uppercase tracking-widest font-mono">
                Empfänger-Adresse (Steuerberater)
              </label>
              <input 
                name="export_email"
                type="email"
                defaultValue={profile?.export_email || ""}
                className="border border-[#bfc0c0] bg-gray-50 px-4 py-3 rounded-xl font-mono text-sm focus:outline-none focus:border-action focus:ring-1 focus:ring-action transition-all w-full md:w-1/2" 
                placeholder="kanzlei@steuerberater.de"
              />
            </div>
          </div>
        </section>

        {/* SEKTION 3 */}
        <section className="bg-white/80 backdrop-blur-md border border-[#bfc0c0] p-8 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-action" />
            <h2 className="font-sans font-bold text-xl text-core">Benachrichtigungs- & Fehler-Routing</h2>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-core/50 uppercase tracking-widest font-mono mb-2">
              Kanal-Priorität (Bei needs_fix Rückfragen)
            </label>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="alert_channel" value="whatsapp" defaultChecked={profile?.alert_channel === 'whatsapp'} className="accent-action w-4 h-4 cursor-pointer" />
                <span className="text-sm font-bold text-core">WhatsApp</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="alert_channel" value="telegram" defaultChecked={profile?.alert_channel === 'telegram'} className="accent-action w-4 h-4 cursor-pointer" />
                <span className="text-sm font-bold text-core">Telegram</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="alert_channel" value="email" defaultChecked={!profile?.alert_channel || profile?.alert_channel === 'email'} className="accent-action w-4 h-4 cursor-pointer" />
                <span className="text-sm font-bold text-core">E-Mail</span>
              </label>
            </div>
          </div>
        </section>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end mt-2 mb-20">
          <button 
            type="submit"
            className="bg-[#2d3142] text-white hover:bg-[#1a1c23] transition-colors font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-3 shadow-md"
          >
            <Save className="w-5 h-5" />
            Einstellungen speichern
          </button>
        </div>

      </form>
    </div>
  );
}
