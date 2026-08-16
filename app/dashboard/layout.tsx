import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardLayoutClient from "./DashboardLayoutClient"
import OnboardingWizard from "../../components/OnboardingWizard"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
  if (!user) {
    // Redirect to login if they have a stale session or are unauthenticated
    redirect('/login');
  }

  const { data: publicProfile } = await supabase.from('users').select('*').eq('id', user.id).single();
  
  const profile = {
    ...publicProfile,
    company_profile: user.user_metadata?.company_profile || publicProfile?.company_profile,
    onboarding_completed: user.user_metadata?.onboarding_completed || false,
    onboarding_step: user.user_metadata?.onboarding_step || 1,
  };

  const isPaymentPendingBypass = cookieStore.get('payment_pending')?.value === 'true';
  const isSubscribed = (profile?.tier && profile.tier !== 'NONE') || isPaymentPendingBypass;
  const hasCompanyData = profile?.company_profile?.company_name && (profile?.company_profile?.vat_id || profile?.company_profile?.tax_id);
  
  // Gatekeeper Logic:
  const needsOnboarding = !profile.onboarding_completed || !isSubscribed || !hasCompanyData;

  if (needsOnboarding) {
    return (
      <div className="flex h-screen bg-[#fafafa] font-sans selection:bg-action/20 selection:text-action relative z-0">
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <OnboardingWizard profile={profile} email={user.email} />
      </div>
    );
  }

  const displayTier = (profile?.tier && profile.tier !== 'NONE') ? profile.tier : (isPaymentPendingBypass ? 'Aktivierung läuft...' : 'NONE');
  
  const profileToPass = {
    ...profile,
    company_name: profile.company_name || profile.company_profile?.company_name,
    tier: displayTier,
  };

  return (
    <DashboardLayoutClient profile={profileToPass}>
      {children}
    </DashboardLayoutClient>
  );
}
