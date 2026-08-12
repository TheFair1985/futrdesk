import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY || ''
);

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature');
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '';

    if (!signature) {
      return new NextResponse('Unauthorized - Missing Signature', { status: 401 });
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
      return new NextResponse('Unauthorized - Invalid Signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data;
    
    // In order events, customData is inside the order object sometimes, 
    // but standard is in meta.custom_data if passed during checkout
    const userId = customData?.user_id;
    
    if (!userId) {
      console.warn('Webhook payload missing user_id in custom_data. Cannot attribute purchase.');
      return new NextResponse('OK', { status: 200 }); 
    }

    const supabaseAdmin = getSupabaseAdmin();
    const variantId = payload.data.attributes.variant_id?.toString() || payload.data.attributes.first_order_item?.variant_id?.toString();

    // 1. Handle One-Time Purchases (Unit Pay / Add-ons)
    if (eventName === 'order_created') {
      const isEinzelrechnung = variantId === process.env.LEMON_SQUEEZY_PRODUCT_EINZELRECHNUNG;
      const isPaket20 = variantId === process.env.LEMON_SQUEEZY_PRODUCT_RECHNUNGSPAKET_20;
      const isPaket50 = variantId === process.env.LEMON_SQUEEZY_PRODUCT_RECHNUNGSPAKET_50;
      
      let extraInvoices = 0;
      if (isEinzelrechnung) extraInvoices = 1;
      if (isPaket20) extraInvoices = 20;
      if (isPaket50) extraInvoices = 50;

      if (extraInvoices > 0) {
        // Fetch current extra invoices to increment safely
        const { data: userRow } = await supabaseAdmin.from('users').select('extra_invoices_available').eq('id', userId).single();
        const currentExtra = userRow?.extra_invoices_available || 0;
        
        await supabaseAdmin.from('users').update({ 
          extra_invoices_available: currentExtra + extraInvoices 
        }).eq('id', userId);
        
        console.log(`Added ${extraInvoices} extra invoices to user ${userId}`);
      }
    }

    // 2. Handle Subscriptions
    if (eventName.startsWith('subscription_')) {
      const status = payload.data.attributes.status; // e.g. active, past_due, unpaid, cancelled
      
      let newTier = undefined;
      
      // Update Tier if variant corresponds to a plan
      if (variantId === process.env.LEMON_SQUEEZY_PRODUCT_STARTER_ID) newTier = 'STARTER';
      if (variantId === process.env.LEMON_SQUEEZY_PRODUCT_PRO) newTier = 'PRO';
      if (variantId === process.env.LEMON_SQUEEZY_PRODUCT_BUSINESS_ID) newTier = 'BUSINESS';

      const updatePayload: any = {
        subscription_status: status,
      };

      if (newTier) {
        updatePayload.tier = newTier;
      }
      
      // Update renewal/end date
      if (payload.data.attributes.renews_at) {
        updatePayload.current_period_end = payload.data.attributes.renews_at;
      }

      await supabaseAdmin.from('users').update(updatePayload).eq('id', userId);
      console.log(`Updated subscription state for user ${userId}: Status ${status}`);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Lemon Squeezy Webhook Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
