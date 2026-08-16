"use server";

import { createClient } from "../../lib/supabase/server";

export async function loginAction(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Unknown error occurred" };
  }
}

import { redirect } from "next/navigation";

export async function signupAction(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("full_name") as string;
    const companyName = formData.get("company_name") as string;

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || "",
          company_name: companyName || "",
        }
      }
    });

    if (error) {
      return { error: error.message };
    }
    
    if (!data.session) {
      return { error: "Bitte überprüfe deinen Posteingang und bestätige deine E-Mail-Adresse." };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Unknown error occurred" };
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
