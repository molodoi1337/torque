import "server-only";

/**
 * Уведомление администратору в Telegram.
 * Работает, только если заданы TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID — иначе тихо пропускается.
 */
export async function notifyTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    console.error("Telegram notify failed", e);
  }
}
