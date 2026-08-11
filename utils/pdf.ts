export async function generateZugferdPDF(invoiceData: any): Promise<Buffer> {
  // Determine URL based on Vercel environment or local development
  const url = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/api/zugferd` 
    : "http://localhost:3000/api/zugferd";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(invoiceData)
  });

  if (!response.ok) {
    throw new Error(`ZUGFeRD PDF Generation failed with status: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
