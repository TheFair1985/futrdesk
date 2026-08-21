import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase/admin';
import { sendPlunkEmail } from '../../../../lib/email/plunk';

const APP_URL = process.env.APP_URL || 'https://futrdesk.com';

export async function GET(request: Request) {
  try {
    // Authenticate the cron job (Vercel Cron automatically sends a Bearer token matching CRON_SECRET if configured)
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch users who haven't completed onboarding or have missing features
    // We look at raw_user_meta_data for the onboarding state
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) throw error;

    const emailsSent: { type: string; email: string | undefined }[] = [];

    for (const user of users.users) {
      const meta = user.user_metadata || {};
      const createdAt = new Date(user.created_at);
      const daysSinceCreation = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 3600 * 24));

      const isSubscribed = meta.tier && meta.tier !== 'NONE';
      const hasOnboarding = meta.onboarding_completed;

      // 1. Soft-Abort (Subscribed but missing setup) -> Send on day 5 (window 5-7, catch-up if cron missed a day)
      if (isSubscribed && hasOnboarding && daysSinceCreation >= 5 && daysSinceCreation <= 7 && !meta.reminder_soft_abort_sent) {
        // Check missing features
        const missingFeatures = [];
        if (!meta.export_email) missingFeatures.push('Automatischen Steuerberater-Export');
        // If we had whatsapp/telegram connected flags, we'd check them here
        missingFeatures.push('WhatsApp / Telegram Bot Anbindung');

        if (missingFeatures.length > 0) {
          const sent = await sendPlunkEmail({
            to: user.email!,
            subject: 'Nutze das volle Potenzial deines Futrdesk-Abos',
            body: `<p>Hey!</p>
<p>Willst du nicht das ganze Potenzial deines Abos ausschöpfen?<br>Du hast folgende Funktionen noch nicht eingerichtet:</p>
<ul><li>${missingFeatures.join('</li><li>')}</li></ul>
<p><a href="${APP_URL}/dashboard/settings">Klicke hier, um dein Setup in 2 Minuten abzuschließen</a></p>
<p>Viele Grüße,<br>Dein Futrdesk Team</p>`,
            idempotencyKey: `reminder-soft-${user.id}`
          });
          if (sent) {
            await supabaseAdmin.auth.admin.updateUserById(user.id, {
              user_metadata: { ...meta, reminder_soft_abort_sent: true }
            });
            emailsSent.push({ type: 'soft_abort', email: user.email });
          }
        }
      }

      // 2. Hard-Abort (Account created, but never finished setup/subscription) -> Send on day 3 (window 3-5)
      if (!isSubscribed && daysSinceCreation >= 3 && daysSinceCreation <= 5 && !meta.reminder_hard_abort_sent) {
        const sent = await sendPlunkEmail({
          to: user.email!,
          subject: 'Dein Futrdesk Account wartet auf dich',
          body: `<p>Hey!</p>
<p>Dein Futrdesk Account ist fast fertig. Schließe jetzt deine Einrichtung ab, aktiviere dein Abo und automatisiere deine Rechnungen sofort.</p>
<p><a href="${APP_URL}/dashboard">Klicke hier, um fortzufahren</a></p>
<p>Viele Grüße,<br>Dein Futrdesk Team</p>`,
          idempotencyKey: `reminder-hard-${user.id}`
        });
        if (sent) {
          await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: { ...meta, reminder_hard_abort_sent: true }
          });
          emailsSent.push({ type: 'hard_abort', email: user.email });
        }
      }
    }

    return NextResponse.json({ success: true, processed: users.users.length, emailsSent });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
