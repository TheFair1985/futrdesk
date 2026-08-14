"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const LEMON_SQUEEZY_STORE_ID = "441519";
const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY || "test_key";

// Use actual LemonSqueezy Variant IDs, NOT Product IDs
const VARIANTS: Record<string, string> = {
  STARTER: "2009462",
  PRO: "2009478",
  BUSINESS: "2009484",
  ADDON_1: "2009532",
  ADDON_20: "2009541",
  ADDON_50: "2009550",
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
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL)!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)!,
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
            test_mode: true,
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
    // Sandbox / Test Fallback, falls API-Credentials oder Store-ID nicht passen
    console.log('Checkout API Error. Using fallback test redirect.', await response.text());
    const storeDomain = process.env.LEMON_SQUEEZY_SHOP_ID || "futrdesk.lemonsqueezy.com";
    redirect(`https://${storeDomain}/checkout/buy/${variantId}?checkout[custom][user_id]=${user.id}&checkout[quantity]=${quantity}`);
  }

  const data = await response.json();
  redirect(data.data.attributes.url);
}
