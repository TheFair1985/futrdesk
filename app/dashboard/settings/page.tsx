import { createServerClient } from "@supabase/ssr"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import SettingsClient from "./SettingsClient"
import { generateCheckoutUrl } from "../billing/actions"

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
  if (!user) return null;
  
  const { data: publicProfile } = await supabase.from('users').select('*').eq('id', user.id).single();

  // Combine public profile with robust auth metadata
  const profile = {
    ...publicProfile,
    company_profile: user.user_metadata?.company_profile || publicProfile?.company_profile
  };

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
    
    const formType = formData.get('form_type');

    const admin = createAdminClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL)!,
      process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY!
    );

    if (formType === 'company_profile') {
      const companyData = {
        company_name: formData.get('company_name'),
        legal_form: formData.get('legal_form'),
        street: formData.get('street'),
        zip: formData.get('zip'),
        city: formData.get('city'),
        public_email: formData.get('public_email'),
        website: formData.get('website'),
        phone: formData.get('phone'),
        fax: formData.get('fax'),
        vat_id: formData.get('vat_id'),
        tax_id: formData.get('tax_id'),
        commercial_register: formData.get('commercial_register'),
        court: formData.get('court'),
      };

      // 1. Update the robust auth metadata to bypass SQL schema limits
      await supabase.auth.updateUser({
        data: { company_profile: companyData }
      });

      // 2. Update the public.users flat column securely bypassing RLS
      const { error } = await admin.from('users').update({
        company_name: formData.get('company_name'),
      }).eq('id', user.id);
      if (error) console.error("Admin DB Update Failed (Settings):", error);
    } 
    else if (formType === 'billing') {
      const { error } = await admin.from('users').update({
        futrdesk_invoice_email: formData.get('futrdesk_invoice_email'),
        department: formData.get('department'),
        cost_center: formData.get('cost_center'),
      }).eq('id', user.id);
      if (error) console.error("Admin DB Update Failed (Billing Settings):", error);
    }
    else if (formType === 'workflow') {
      const { error } = await admin.from('users').update({
        auto_send_invoices: formData.get('auto_send_invoices') === 'on',
        export_target: formData.get('export_target'),
        export_email: formData.get('export_email'),
      }).eq('id', user.id);
      if (error) console.error("Admin DB Update Failed (Workflow Settings):", error);
    }
    
    revalidatePath('/dashboard/settings');
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2 max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-black text-core tracking-tight uppercase">Einstellungen</h1>
        <p className="text-core/50 font-mono text-xs mt-1">Zentrale Verwaltung deines Futrdesk-Accounts & Abos</p>
      </header>

      <SettingsClient 
        profile={profile || {}} 
        email={user.email} 
        generateCheckoutUrlAction={generateCheckoutUrl}
        updateSettingsAction={updateSettings}
      />
    </div>
  );
}
