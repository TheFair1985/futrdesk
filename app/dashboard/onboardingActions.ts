"use server";

import { createClient } from "../../lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function verifyVatId(vatNumber: string) {
  try {
    const cleanVat = vatNumber.replace(/[^A-Z0-9]/g, '');
    const res = await fetch(`https://ec.europa.eu/taxation_customs/vies/rest-api/ms/DE/vat/${cleanVat.replace('DE', '')}`);
    const data = await res.json();
    
    if (data.isValid) {
      return { success: true, company: { name: data.name, address: data.address, vat_id: cleanVat } };
    }
    return { success: false, error: "Ungültige USt-IdNr. oder Datenbank nicht erreichbar." };
  } catch (error) {
    return { success: false, error: "Netzwerkfehler bei der Abfrage." };
  }
}

export async function saveOnboardingStep(stepData: any) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Merge with existing metadata
  const currentMeta = user.user_metadata || {};
  const newMeta = { ...currentMeta };

  if (stepData.company_profile) {
    newMeta.company_profile = { ...(currentMeta.company_profile || {}), ...stepData.company_profile };
  }
  if (stepData.onboarding_completed !== undefined) {
    newMeta.onboarding_completed = stepData.onboarding_completed;
  }
  
  await supabase.auth.updateUser({ data: newMeta });

  // Update public users table for non-metadata fields if provided
  const flatUpdates: any = {};
  if (stepData.company_profile?.company_name) flatUpdates.company_name = stepData.company_profile.company_name;
  if (stepData.export_email !== undefined) flatUpdates.export_email = stepData.export_email;
  if (stepData.auto_send_invoices !== undefined) flatUpdates.auto_send_invoices = stepData.auto_send_invoices;
  if (stepData.futrdesk_invoice_email !== undefined) flatUpdates.futrdesk_invoice_email = stepData.futrdesk_invoice_email;
  
  if (Object.keys(flatUpdates).length > 0) {
    await supabase.from('users').update(flatUpdates).eq('id', user.id);
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function markPaymentPending() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  await supabase.from('users').update({ tier: 'PENDING' }).eq('id', user.id);
  
  revalidatePath('/dashboard');
  return { success: true };
}
