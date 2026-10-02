/**
 * New-order notifications for the restaurant. Configure any of:
 *  - ORDER_WEBHOOK_URL   → JSON POST (Make.com / Zapier / n8n → WhatsApp, Sheets, email…)
 *  - TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID → message to the kitchen Telegram group
 */
import { orderTicket } from '../src/lib/order.ts';
import { config } from './config.ts';
import { publicView, type StoredOrder } from './store.ts';

export async function notifyNewOrder(order: StoredOrder) {
  const tasks: Promise<unknown>[] = [];
  const { webhookUrl, telegramBotToken, telegramChatId } = config.notify;
  if (webhookUrl) {
    tasks.push(
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'order.created', order: { ...publicView(order), trackingToken: undefined }, ticket: orderTicket(order) }),
      }),
    );
  }
  if (telegramBotToken && telegramChatId) {
    tasks.push(
      fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramChatId, text: orderTicket(order).replace(/\*/g, '') }),
      }),
    );
  }
  if (!tasks.length) console.log(`\n${orderTicket(order)}\n`);
  const results = await Promise.allSettled(tasks);
  for (const r of results) if (r.status === 'rejected') console.error('[notify] failed', r.reason);
}
