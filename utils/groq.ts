export async function extractTextFromImage(base64Image: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llava-v1.5-7b-4096-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extrahiere den gesamten Text aus dieser Rechnung. Ignoriere Logos. Gib nur den Text zurück." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ]
        }
      ],
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq Vision API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function structureInvoiceData(rawText: string): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Du bist ein B2B-Rechnungsassistent. Formatiere den Rohtext in ein striktes JSON mit exakt diesen Keys: client_name (string), full_address (string), line_items (array von Objekten mit 'description' und 'price'), net_amount (number), vat_amount (number), gross_amount (number). Wenn Daten fehlen, setze null. Errechne korrekte Steuern und Bruttobeträge, falls diese implizit erwähnt sind."
        },
        {
          role: "user",
          content: rawText
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq Text API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch (e) {
    throw new Error("Failed to parse Groq response as JSON.");
  }
}
