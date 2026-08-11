import { uploadInvoicePDF, createInvoiceRecord } from '../utils/database';
import { sendInvoiceEmail } from '../utils/plunk';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function runSelfCheck() {
  console.log("Starting Delivery Pipeline Test (Storage -> DB -> Email)...");

  const originalFetch = global.fetch;

  // Mock global fetch to intercept both Supabase and Plunk calls
  global.fetch = async (url: string | Request | URL, options?: RequestInit): Promise<Response> => {
    const urlStr = url.toString();
    
    // Supabase Storage Upload Mock
    if (urlStr.includes('/storage/v1/object/zugferd_invoices')) {
      console.log(`[Mock] Supabase Storage Upload intercepted`);
      return new Response(JSON.stringify({ Key: "test_user/INV-2026-001.pdf" }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Supabase Signed URL Mock
    if (urlStr.includes('/storage/v1/object/sign/zugferd_invoices')) {
      console.log(`[Mock] Supabase Signed URL intercepted`);
      return new Response(JSON.stringify({ signedURL: "https://mocked-signed-url.supabase.co/INV-2026-001.pdf?token=abc" }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Supabase DB Insert Mock
    if (urlStr.includes('/rest/v1/invoices')) {
      console.log(`[Mock] Supabase Database Insert intercepted`);
      return new Response(JSON.stringify([{ id: "mock-uuid" }]), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    // Plunk API Mock
    if (urlStr.includes('api.useplunk.com/v1/send')) {
      console.log(`[Mock] Plunk Email Delivery intercepted`);
      const body = JSON.parse(options?.body as string);
      console.log(`\n📧 Payload that would be sent to Plunk:`);
      console.log(JSON.stringify(body, null, 2));
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return originalFetch(url, options);
  };

  try {
    const mockUserId = "test-uuid-999";
    const mockInvoiceNumber = "INV-2026-001";
    const mockBuffer = Buffer.from("dummy-pdf-content");
    const clientEmail = "adilalexanderayaz@gmail.com";
    const clientName = "Bauer Erding";

    // 1. Upload
    console.log("\n1. Uploading PDF to Storage...");
    const pdfUrl = await uploadInvoicePDF(mockUserId, mockInvoiceNumber, mockBuffer);
    console.log(`✅ Uploaded. Signed URL: ${pdfUrl}`);

    // 2. DB Insert
    console.log("\n2. Creating DB Record...");
    await createInvoiceRecord(mockUserId, mockInvoiceNumber, pdfUrl);
    console.log(`✅ DB Record Created.`);

    // 3. Email Delivery
    console.log("\n3. Sending Email via Plunk...");
    await sendInvoiceEmail(clientEmail, clientName, mockBuffer, mockInvoiceNumber);
    console.log(`✅ Email sent successfully.`);

    console.log("\n🎉 Delivery Pipeline Test Completed Successfully!");

  } catch (error) {
    console.error("\n❌ Test failed:", error);
  } finally {
    global.fetch = originalFetch;
  }
}

runSelfCheck();
