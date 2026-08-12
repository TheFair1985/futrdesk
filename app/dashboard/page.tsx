import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {}
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
  const { data: channels } = await supabase.from('channels').select('*').eq('user_id', user.id);
  
  // Get invoices for BI
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: invoices } = await supabase
    .from('invoices')
    .select('vendor_name, gross_amount, created_at, status')
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString());

  return (
    <DashboardClient 
      profile={profile || {}} 
      channels={channels || []} 
      invoices={invoices || []} 
    />
  );
}
