import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client to fetch all users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY!
);

export async function GET(request: Request) {
  try {
    // Authenticate the cron job (Vercel Cron automatically sends a Bearer token matching CRON_SECRET if configured)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Fetch users who haven't completed onboarding or have missing features
    // We look at raw_user_meta_data for the onboarding state
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) throw error;

    const emailsSent = [];

    for (const user of users.users) {
      const meta = user.user_metadata || {};
      const createdAt = new Date(user.created_at);
      const daysSinceCreation = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 3600 * 24));
      
      const isSubscribed = meta.tier && meta.tier !== 'NONE';
      const hasOnboarding = meta.onboarding_completed;

      // 1. Soft-Abort (Subscribed but missing setup) -> Send after 5 days
      if (isSubscribed && hasOnboarding && daysSinceCreation === 5) {
        // Check missing features
        const missingFeatures = [];
        if (!meta.export_email) missingFeatures.push('Automatischen Steuerberater-Export');
        // If we had whatsapp/telegram connected flags, we'd check them here
        missingFeatures.push('WhatsApp / Telegram Bot Anbindung');

        if (missingFeatures.length > 0) {
          await sendPlunkEmail(
            user.email!,
            "Nutze das volle Potenzial deines Futrdesk-Abos",
            `Hey!\n\nWillst du nicht das ganze Potenzial deines Abos ausschöpfen?\nDu hast folgende Funktionen noch nicht eingerichtet:\n- ${missingFeatures.join('\n- ')}\n\nKlicke hier, um dein Setup in 2 Minuten abzuschließen:\nhttps://futrdesk.com/dashboard/settings\n\nViele Grüße,\nDein Futrdesk Team`
          );
          emailsSent.push({ type: 'soft_abort', email: user.email });
        }
      }
      
      // 2. Hard-Abort (Account created, but never finished setup/subscription) -> Send after 3 days
      if (!isSubscribed && daysSinceCreation === 3) {
        await sendPlunkEmail(
          user.email!,
          "Dein Futrdesk Account wartet auf dich",
          `Hey!\n\nDein Futrdesk Account ist fast fertig. Schließe jetzt deine Einrichtung ab, aktiviere dein Abo und automatisiere deine Rechnungen sofort.\n\nKlicke hier, um fortzufahren:\nhttps://futrdesk.com/dashboard\n\nViele Grüße,\nDein Futrdesk Team`
        );
        emailsSent.push({ type: 'hard_abort', email: user.email });
      }
    }

    return NextResponse.json({ success: true, processed: users.users.length, emailsSent });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function sendPlunkEmail(to: string, subject: string, body: string) {
  if (!process.env.PLUNK_SECRET_API_KEY) return;
  await fetch('https://api.useplunk.com/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PLUNK_SECRET_API_KEY}`
    },
    body: JSON.stringify({
      to,
      subject,
      body,
      // Optional: replyTo, name, etc.
    })
  });
}
