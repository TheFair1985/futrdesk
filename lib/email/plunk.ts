const PLUNK_API_URL = process.env.PLUNK_API_URL || 'https://next-api.useplunk.com';

export interface PlunkAttachment {
  filename: string;
  /** Base64-encoded file content */
  content: string;
  contentType: string;
}

interface SendPlunkEmailOptions {
  to: string | string[];
  subject: string;
  /** HTML body */
  body: string;
  from?: string;
  replyTo?: string;
  attachments?: PlunkAttachment[];
  idempotencyKey?: string;
}

export async function sendPlunkEmail(options: SendPlunkEmailOptions): Promise<boolean> {
  const apiKey = process.env.PLUNK_SECRET_API_KEY;
  if (!apiKey) {
    console.error('PLUNK_SECRET_API_KEY is not set - email skipped:', options.subject);
    return false;
  }

  try {
    const response = await fetch(`${PLUNK_API_URL}/v1/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {})
      },
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        body: options.body,
        ...(options.from ? { from: options.from } : {}),
        ...(options.replyTo ? { reply: options.replyTo } : {}),
        ...(options.attachments && options.attachments.length > 0
          ? {
              attachments: options.attachments.map((a) => ({
                filename: a.filename,
                content: a.content,
                contentType: a.contentType
              }))
            }
          : {})
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Plunk send failed (${response.status}):`, errText);
      return false;
    }

    const data = await response.json().catch(() => null);
    if (data && data.success === false) {
      console.error('Plunk send rejected:', data);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error sending email via Plunk:', err);
    return false;
  }
}

/** Converts plain text (with \n line breaks) to a minimal HTML body */
export function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}
