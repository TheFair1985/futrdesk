export async function sendTelegramText(chatId: string, text: string, replyMarkup?: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  const payload: any = { chat_id: chatId, text, parse_mode: 'Markdown' };
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }
  
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function sendTelegramDocument(chatId: string, documentUrl: string, caption?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, document: documentUrl, caption })
  });
}
