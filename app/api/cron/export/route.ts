import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase/admin';
import { generateExportZip } from '../../../../lib/export/generateZip';
import { sendExportZipEmail } from '../../../../lib/export/sendExportEmail';

export async function GET(request: Request) {
  // CRON endpoint protection via authorization header (e.g., from Vercel Cron)
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1. Hole alle Nutzer mit abgeschlossenem Onboarding (Export-Opt-in via export_email)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, export_email, auto_export_enabled');

    if (error || !users) {
      return new NextResponse('Failed to fetch users', { status: 500 });
    }

    const now = new Date();
    const monthStr = now.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let processedCount = 0;

    // 2. Iteriere über alle User und generiere Exports
    for (const user of users) {
      // Nur Nutzer mit aktiviertem Auto-Export und Ziel-Adresse verarbeiten
      const targetEmail = user.export_email || null;
      if (!targetEmail || user.auto_export_enabled === false) continue;

      const zipBuffer = await generateExportZip(user.id, monthKey);

      if (zipBuffer) {
        // Send email
        await sendExportZipEmail(targetEmail, zipBuffer, monthStr);

        // Markiere die exportierten Rechnungen, damit sie nicht erneut versendet werden
        await supabase
          .from('invoices')
          .update({ status: 'archived' })
          .eq('user_id', user.id)
          .eq('status', 'completed');

        processedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Export completed for ${processedCount} users for ${monthStr}`
    });
  } catch (error) {
    console.error('CRON Export Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
