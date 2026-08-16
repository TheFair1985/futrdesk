"use server";

import { createClient } from "../../../lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export async function updateAuthEmail(newEmail: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) return { error: error.message };
  return { success: "Bitte prüfe dein neues Postfach (und das alte), um die Änderung zu bestätigen." };
}

export async function updateAuthPassword(newPassword: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: "Dein Passwort wurde erfolgreich geändert." };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht authentifiziert" };

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY || ''
  );

  // Hard delete the user from auth.users (cascades automatically to public.users if foreign key is set up with CASCADE)
  // If no CASCADE is set, we delete manually first
  await admin.from('users').delete().eq('id', user.id);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  
  if (error) {
    console.error("Account deletion failed:", error);
    return { error: "Fehler beim Löschen des Accounts. Bitte Support kontaktieren." };
  }

  await supabase.auth.signOut();
  redirect('/login?deleted=true');
}

export async function triggerDataExport() {
  // In a real app, this would queue a job to zip files and email them.
  // For now, we simulate success.
  await new Promise(r => setTimeout(r, 1000));
  return { success: "Dein Datenexport wurde angefordert. Du erhältst in Kürze eine E-Mail mit dem Download-Link." };
}
