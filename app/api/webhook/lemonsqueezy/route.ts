import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY!
);

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '04.07.1985';
    
    // Validate Signature
    const signature = request.headers.get('x-signature');
    if (signature) {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
      const signatureBuffer = Buffer.from(signature, 'utf8');
      if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
        console.error('Invalid signature');
        return new NextResponse('Invalid signature', { status: 403 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Missing signature', { status: 403 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data || {};
    const userId = customData.user_id;

    if (!userId) {
      return new NextResponse('No user_id in custom data', { status: 400 });
    }

    if (eventName === 'subscription_created' || eventName === 'order_created') {
      // Determine tier from variant/product name or just set to PRO for now
      // Since it's a test, we will upgrade them to PRO (or extract the actual tier if we passed it)
      
      // Update public users table
      await supabaseAdmin.from('users').update({ tier: 'PRO' }).eq('id', userId);
      
      // Update auth metadata
      const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (user?.user) {
        const newMeta = { ...user.user.user_metadata, tier: 'PRO' };
        await supabaseAdmin.auth.admin.updateUserById(userId, { user_metadata: newMeta });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Webhook Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
