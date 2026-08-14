"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_SHOP_ID || "futrdesk";
const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY || "test_key";

const VARIANTS: Record<string, string> = {
  STARTER: process.env.LEMON_SQUEEZY_PRODUCT_STARTER_ID || "1285105",
  PRO: process.env.LEMON_SQUEEZY_PRODUCT_PRO || "1285123",
  BUSINESS: process.env.LEMON_SQUEEZY_PRODUCT_BUSINESS_ID || "1285127",
  ADDON_1: process.env.LEMON_SQUEEZY_PRODUCT_EINZELRECHNUNG || "1285155",
  ADDON_20: process.env.LEMON_SQUEEZY_PRODUCT_RECHNUNGSPAKET_20 || "1285162",
  ADDON_50: process.env.LEMON_SQUEEZY_PRODUCT_RECHNUNGSPAKET_50 || "1285169",
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
    redirect(`https://sandbox.lemonsqueezy.com/checkout/buy/${variantId}?checkout[custom][user_id]=${user.id}&checkout[quantity]=${quantity}`);
  }

  const data = await response.json();
  redirect(data.data.attributes.url);
}
