import { NextResponse } from 'next/server';
import { executeApproval } from '../../../services/invoicePipeline';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user');
  const action = searchParams.get('action');

  if (!userId || !action) {
    return new NextResponse('Invalid request parameters', { status: 400 });
  }

  try {
    const isApproved = action === 'APPROVE';
    
    // Trigger approval pipeline via Fire & Forget
    executeApproval(userId, isApproved).catch(console.error);

    const message = isApproved 
      ? 'Freigabe erteilt. Die ZUGFeRD-Rechnung wird nun generiert und versendet.' 
      : 'Vorgang abgebrochen. Die Rechnung wurde verworfen.';
      
    const htmlResponse = `
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: ${isApproved ? 'green' : 'red'};">${message}</h1>
          <p>Sie können dieses Fenster nun schließen.</p>
        </body>
      </html>
    `;

    return new NextResponse(htmlResponse, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
