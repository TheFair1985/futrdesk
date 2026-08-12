import { z } from 'zod';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_SECRET_KEY || ''
);

export const invoiceSchema = z.object({
  vendor_name: z.string(),
  net_amount: z.number(),
  gross_amount: z.number(),
  tax_rate: z.number(),
  confidence_score: z.number(),
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unit_price: z.number()
  })).optional()
});

export type InvoiceExtraction = z.infer<typeof invoiceSchema>;

export async function extractInvoice(filePath: string): Promise<InvoiceExtraction | null> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // 1. Download document from Supabase storage
    const { data, error } = await supabaseAdmin.storage.from('invoices').download(filePath);
    
    if (error || !data) {
      console.error('Failed to download file from Supabase:', error);
      return null;
    }
    
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64String = buffer.toString('base64');
    
    const mimeType = filePath.endsWith('.pdf') ? 'application/pdf' : 
                     filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    
    // For Groq Vision API we pass base64 images.
    // (If PDF, it ideally needs to be converted to images first, but we pass it as a data URL anyway)
    const dataUrl = `data:${mimeType};base64,${base64String}`;
    
    const promptText = `Du bist eine präzise Buchhaltungs-Middleware. Extrahiere die Rechnungsdaten fehlerfrei in das geforderte JSON-Format.
Bitte antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt mit folgender Struktur (keine Markdown-Formatierung, kein Präfix):
{
  "vendor_name": "String (Name des Unternehmens)",
  "net_amount": Number (Netto-Betrag als Zahl),
  "gross_amount": Number (Brutto-Betrag als Zahl),
  "tax_rate": Number (Steuersatz als Zahl),
  "confidence_score": Number (1-100, wie sicher bist du dir bei den Werten?),
  "line_items": [
    {
      "description": "String",
      "quantity": Number,
      "unit_price": Number
    }
  ]
}`;

    // 2. Call Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.2-90b-vision-preview", // Vision model
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: promptText },
            { type: "image_url", image_url: { url: dataUrl } }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });
    
    const responseText = completion.choices[0]?.message?.content || '{}';
    const jsonParsed = JSON.parse(responseText);
    
    // 3. Validate with Zod
    const validated = invoiceSchema.parse(jsonParsed);
    return validated;
    
  } catch (err) {
    console.error('Groq AI Extraction Error:', err);
    return null;
  }
}
