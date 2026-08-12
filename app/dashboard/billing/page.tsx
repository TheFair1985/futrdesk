import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { CreditCard, HardDrive, Zap, Check, ArrowRight } from "lucide-react"

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
  
  let profile = { tier: 'STARTER', storage_used_bytes: 0 };
  if (user) {
    const { data } = await supabase.from('users').select('tier, storage_used_bytes').eq('id', user.id).single();
    if (data) {
      profile = {
        tier: data.tier || 'STARTER',
        storage_used_bytes: data.storage_used_bytes || 0
      };
    }
  }

  // Calculate storage metrics
  const usedMB = (profile.storage_used_bytes / (1024 * 1024)).toFixed(1);
  let totalMB = 1000;
  if (profile.tier === 'PRO') totalMB = 3000;
  if (profile.tier === 'BUSINESS') totalMB = 5000;
  
  const percentage = Math.min(100, Math.max(0, (Number(usedMB) / totalMB) * 100));

  async function upgradePlan(formData: FormData) {
    "use server"
    
    const newTier = formData.get('tier') as string;
    
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
    if (user && newTier) {
      // In a real app, this would trigger a Stripe checkout flow. 
      // For this MVP, we simulate an immediate upgrade in the database.
      await supabase.from('users').update({ tier: newTier }).eq('id', user.id);
      revalidatePath('/dashboard/billing');
    }
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-10 pb-20">
      
      {/* HEADER */}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-sans text-core tracking-tight">
          Billing & Subscription
        </h1>
        <p className="text-core/70 font-sans text-lg">
          Verwalte dein Abonnement, deinen Speicherplatz und Rechnungen.
        </p>
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

      {/* PRICING MATRIX */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-8">
          <Zap className="w-5 h-5 text-core" />
          <h2 className="font-sans font-bold text-2xl text-core">Pläne & Upgrades</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* STARTER */}
          <div className={`relative flex flex-col bg-white border ${profile.tier === 'STARTER' ? 'border-[#bfc0c0]' : 'border-transparent shadow-sm'} p-8 rounded-2xl`}>
            {profile.tier === 'STARTER' && (
              <div className="absolute top-0 right-0 bg-gray-100 text-core/60 font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl border-l border-b border-[#bfc0c0]">
                Dein Plan
              </div>
            )}
            <h3 className="font-mono text-lg font-bold text-core uppercase tracking-widest mb-2">Starter</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold font-sans text-core">29€</span>
              <span className="text-sm text-core/60 font-sans">/ Monat</span>
            </div>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              <li className="flex items-start gap-2 text-sm text-core/80"><Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> WhatsApp Ingest</li>
              <li className="flex items-start gap-2 text-sm text-core/80"><Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> 1 GB Speicher (ZIP Export)</li>
              <li className="flex items-start gap-2 text-sm text-core/80"><Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> Llama-3 Extraktion</li>
            </ul>
            <form action={upgradePlan}>
              <input type="hidden" name="tier" value="STARTER" />
              <button disabled={profile.tier === 'STARTER'} className={`w-full py-3 rounded-xl font-bold transition-colors ${profile.tier === 'STARTER' ? 'bg-gray-100 text-core/40 cursor-not-allowed' : 'bg-gray-100 text-core hover:bg-gray-200 border border-[#bfc0c0]'}`}>
                {profile.tier === 'STARTER' ? 'Aktuell' : 'Downgrade auf Starter'}
              </button>
            </form>
          </div>

          {/* PRO */}
          <div className={`relative flex flex-col bg-white border ${profile.tier === 'PRO' ? 'border-action shadow-lg scale-100 md:scale-[1.02] z-10' : 'border-action shadow-md'} p-8 rounded-2xl`}>
            {profile.tier === 'PRO' && (
              <div className="absolute top-0 right-0 bg-action text-white font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl">
                Dein Plan
              </div>
            )}
            {profile.tier !== 'PRO' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-action text-white font-mono text-[10px] uppercase font-bold px-4 py-1 rounded-full shadow-sm">
                Empfohlen
              </div>
            )}
            <h3 className="font-mono text-lg font-bold text-core uppercase tracking-widest mb-2">Pro</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold font-sans text-core">79€</span>
              <span className="text-sm text-core/60 font-sans">/ Monat</span>
            </div>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              <li className="flex items-start gap-2 text-sm text-core/80"><Check className="w-4 h-4 text-action shrink-0 mt-0.5" /> Alle Starter Features</li>
              <li className="flex items-start gap-2 text-sm text-core/80"><Check className="w-4 h-4 text-action shrink-0 mt-0.5" /> Multi-Channel (Mail, Telegram)</li>
              <li className="flex items-start gap-2 text-sm text-core/80"><Check className="w-4 h-4 text-action shrink-0 mt-0.5" /> 3 GB Speicher (GoBD 10J)</li>
              <li className="flex items-start gap-2 text-sm text-core/80"><Check className="w-4 h-4 text-action shrink-0 mt-0.5" /> Automatischer Export</li>
            </ul>
            <form action={upgradePlan}>
              <input type="hidden" name="tier" value="PRO" />
              <button disabled={profile.tier === 'PRO'} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${profile.tier === 'PRO' ? 'bg-action text-white cursor-not-allowed opacity-90' : 'bg-action hover:bg-action/90 text-white shadow-md'}`}>
                {profile.tier === 'PRO' ? 'Aktuell' : 'Plan wechseln'}
                {profile.tier !== 'PRO' && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>

          {/* BUSINESS */}
          <div className={`relative flex flex-col bg-core border ${profile.tier === 'BUSINESS' ? 'border-action shadow-lg' : 'border-core shadow-md'} p-8 rounded-2xl`}>
            {profile.tier === 'BUSINESS' && (
              <div className="absolute top-0 right-0 bg-action text-white font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl">
                Dein Plan
              </div>
            )}
            <h3 className="font-mono text-lg font-bold text-white uppercase tracking-widest mb-2">Business</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold font-sans text-white">199€</span>
              <span className="text-sm text-white/60 font-sans">/ Monat</span>
            </div>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              <li className="flex items-start gap-2 text-sm text-white/80"><Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> Unbegrenzte Channels</li>
              <li className="flex items-start gap-2 text-sm text-white/80"><Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> 5 GB Speicher</li>
              <li className="flex items-start gap-2 text-sm text-white/80"><Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> Eigene Inbound Domain</li>
              <li className="flex items-start gap-2 text-sm text-white/80"><Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> API Zugriff</li>
            </ul>
            <form action={upgradePlan}>
              <input type="hidden" name="tier" value="BUSINESS" />
              <button disabled={profile.tier === 'BUSINESS'} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${profile.tier === 'BUSINESS' ? 'bg-white/10 text-white cursor-not-allowed' : 'bg-white text-core hover:bg-gray-100 shadow-md'}`}>
                {profile.tier === 'BUSINESS' ? 'Aktuell' : 'Enterprise anfragen'}
              </button>
            </form>
          </div>

        </div>
      </div>

    </div>
  );
}
