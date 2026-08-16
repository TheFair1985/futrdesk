import { createClient } from "../../lib/supabase/server"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
  const { data: channels } = await supabase.from('channels').select('*').eq('user_id', user.id);
  
  // Get ALL invoices for BI filtering on the client
  const { data: invoices } = await supabase
    .from('invoices')
    .select('vendor_name, gross_amount, created_at, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  return (
    <DashboardClient 
      profile={profile || {}} 
      channels={channels || []} 
      invoices={invoices || []} 
    />
  );
}
