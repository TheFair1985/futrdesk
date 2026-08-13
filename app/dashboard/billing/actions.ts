"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID || "store_123";
const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY || "test_key";

const VARIANTS: Record<string, string> = {
  STARTER: process.env.LS_VARIANT_STARTER || "12345",
  PRO: process.env.LS_VARIANT_PRO || "12346",
  BUSINESS: process.env.LS_VARIANT_BUSINESS || "12347",
  ADDON_1: process.env.LS_VARIANT_ADDON_1 || "addon_1",
  ADDON_20: process.env.LS_VARIANT_ADDON_20 || "addon_20",
  ADDON_50: process.env.LS_VARIANT_ADDON_50 || "addon_50",
};

export async function generateCheckoutUrl(formData: FormData) {
  const tier = formData.get('tier') as string;
  const quantity = formData.get('quantity') ? parseInt(formData.get('quantity') as string, 10) : 1;
  const variantId = VARIANTS[tier];

  if (!variantId) {
    throw new Error('Invalid tier selected');
  }

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
  if (!user) throw new Error('Unauthorized');

  // Generate checkout URL via Lemon Squeezy API
  const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            custom: {
              user_id: user.id
            }
          }
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: LEMON_SQUEEZY_STORE_ID
            }
          },
          variant: {
            data: {
              type: 'variants',
              id: variantId
            }
          }
        }
      }
    })
  });

  if (!response.ok) {
    // Sandbox / Test Fallback, falls keine API-Credentials gesetzt sind
    console.log('Checkout API Error. Using fallback test redirect.', await response.text());
    redirect(`https://sandbox.lemonsqueezy.com/checkout/buy/${variantId}?checkout[custom][user_id]=${user.id}&checkout[quantity]=${quantity}`);
  }

  const data = await response.json();
  redirect(data.data.attributes.url);
}
