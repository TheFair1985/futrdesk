import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateExportZip } from '../../../../lib/export/generateZip';
import { sendExportZipEmail } from '../../../../lib/export/sendExportEmail';

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY || ''
);

export async function GET(request: Request) {
  // CRON endpoint protection via authorization header (e.g., from Vercel Cron)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1. Hole alle Nutzer, die eine export_email in ihren App-Settings oder Metadaten definiert haben.
    // Falls keine spezifische Spalte "export_email" in users existiert, nutzen wir "email" als Fallback.
    const { data: users, error } = await supabase.from('users').select('id, email');
    
    if (error || !users) {
      return new NextResponse('Failed to fetch users', { status: 500 });
    }

    const monthStr = new Date().toLocaleString('de-DE', { month: 'long', year: 'numeric' });

    let processedCount = 0;

    // 2. Iteriere über alle User und generiere Exports
    for (const user of users) {
      // In einer Produktions-App würden wir nachschauen, ob user.export_email existiert. 
      // Hier nutzen wir als MVP user.email als primäres Ziel.
      const targetEmail = user.email;
      
      if (!targetEmail) continue;

      const zipBuffer = await generateExportZip(user.id);
      
      if (zipBuffer) {
        // Send email
        await sendExportZipEmail(targetEmail, zipBuffer, monthStr);
        
        // Optional: Status der Rechnungen auf 'exported' oder ähnliches aktualisieren
        // await supabase.from('invoices').update({ status: 'archived' }).eq('user_id', user.id).eq('status', 'completed');
        
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
