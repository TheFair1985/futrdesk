import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppText } from '../whatsapp/sendMessage';
import { sendTelegramText } from '../telegram/sendMessage';
import { sendEmailText } from '../email/sendMessage';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY || ''
);

const TIER_LIMITS: Record<string, number> = {
  'STARTER': 25,
  'PRO': 75,
  'BUSINESS': 150
};

export async function checkAndConsumeInvoice(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  
  // 1. Hole User Metriken
  const { data: user, error } = await supabase
    .from('users')
    .select('tier, invoices_used_this_month, extra_invoices_available, alert_channel, email, channels(whatsapp_number, telegram_chat_id)')
    .eq('id', userId)
    .single();

  if (error || !user) {
    console.error('Usage Check Failed: User not found', error);
    return false;
  }

  const limit = TIER_LIMITS[user.tier || 'STARTER'] || 25;
  const used = user.invoices_used_this_month || 0;
  const extra = user.extra_invoices_available || 0;

  // 2. Prüfe normales Abo-Limit
  if (used < limit) {
    await supabase.from('users').update({ invoices_used_this_month: used + 1 }).eq('id', userId);
    return true;
  }

  // 3. Prüfe Extra-Pakete (Einmalzahlungen)
  if (extra > 0) {
    await supabase.from('users').update({ extra_invoices_available: extra - 1 }).eq('id', userId);
    return true;
  }

  // 4. Limit erreicht -> Send Upsell Warning
  await triggerUpsellWarning(user, userId);
  return false;
}

async function triggerUpsellWarning(user: any, userId: string) {
  const tier = user.tier || 'STARTER';
  const shopId = process.env.LEMON_SQUEEZY_SHOP_ID || 'futrdesk.lemonsqueezy.com';
  
  // Checkout base URL construction (One-click logic without leaving chat)
  const createCheckoutLink = (variantId: string) => 
    `https://${shopId}/checkout/buy/${variantId}?checkout[custom][user_id]=${userId}`;

  const V_PRO = process.env.LEMON_SQUEEZY_PRODUCT_PRO || '1285123';
  const V_BUSINESS = process.env.LEMON_SQUEEZY_PRODUCT_BUSINESS_ID || '1285127';
  const V_EINZEL = process.env.LEMON_SQUEEZY_PRODUCT_EINZELRECHNUNG || '1285155';
  const V_PAKET20 = process.env.LEMON_SQUEEZY_PRODUCT_RECHNUNGSPAKET_20 || '1285162';
  const V_PAKET50 = process.env.LEMON_SQUEEZY_PRODUCT_RECHNUNGSPAKET_50 || '1285169';

  let message = `⚠️ *Rechnungslimit erreicht!*\n\nDein Kontingent für diesen Monat ist aufgebraucht.\n\n`;

  if (tier === 'STARTER') {
    message += `💡 *Smart Tipp:*\nDein Verbrauch steigt! Ein Upgrade auf PRO (75 Rechnungen/M) ist jetzt mathematisch viel günstiger als Einzelpakete.\n\n`;
    message += `🚀 *1-Klick Upgrade auf PRO (49,99€):*\n👉 ${createCheckoutLink(V_PRO)}\n\n`;
  } else if (tier === 'PRO') {
    message += `💡 *Smart Tipp:*\nDu bist ein Power-User! Ein Upgrade auf BUSINESS (150 Rechnungen/M) sichert dich entspannt ab.\n\n`;
    message += `🚀 *1-Klick Upgrade auf BUSINESS (99,99€):*\n👉 ${createCheckoutLink(V_BUSINESS)}\n\n`;
  }

  message += `📦 *Oder Einmal-Paket buchen (Sofortige Freischaltung):*\n`;
  message += `- 1x Rechnung (1,99€): ${createCheckoutLink(V_EINZEL)}\n`;
  message += `- Paket 20 (29,99€): ${createCheckoutLink(V_PAKET20)}\n`;
  message += `- Paket 50 (79,99€): ${createCheckoutLink(V_PAKET50)}`;

  const channels = user.channels?.[0]; // Assuming one active channel row per user

  try {
    // Determine preferred routing based on heavy messaging users
    let routed = false;
    
    // Check user preference first
    if (user.alert_channel === 'whatsapp' && channels?.whatsapp_number) {
      await sendWhatsAppText(channels.whatsapp_number, message);
      routed = true;
    } else if (user.alert_channel === 'telegram' && channels?.telegram_chat_id) {
      await sendTelegramText(channels.telegram_chat_id, message);
      routed = true;
    }
    
    // Fallback if preference not set or missing
    if (!routed) {
      if (channels?.whatsapp_number) {
        await sendWhatsAppText(channels.whatsapp_number, message);
      } else if (channels?.telegram_chat_id) {
        await sendTelegramText(channels.telegram_chat_id, message);
      } else if (user.email) {
        // Fallback to email
        await sendEmailText(
          user.email,
          'Futrdesk: Rechnungslimit erreicht',
          message
        );
      }
    }
  } catch (error) {
    console.error('Failed to send upsell warning', error);
  }
}
