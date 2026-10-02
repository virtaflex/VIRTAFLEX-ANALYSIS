import { site } from '../src/config/site.ts';

const env = process.env;
const list = (v?: string) => (v ?? '').split(',').map((s) => s.trim()).filter(Boolean);

export const config = {
  port: Number(env.PORT) || 8080,
  /** Public website origin — used for Paymob redirects. */
  publicUrl: (env.PUBLIC_URL || site.url).replace(/\/$/, ''),
  dataDir: env.DATA_DIR || new URL('../data', import.meta.url).pathname,
  distDir: env.DIST_DIR || new URL('../dist', import.meta.url).pathname,
  adminToken: env.ADMIN_TOKEN || '',
  trustProxy: env.TRUST_PROXY === '1',
  /** Extra origins allowed to call the API (when the website is hosted elsewhere). */
  allowedOrigins: list(env.ALLOWED_ORIGINS),
  notify: {
    webhookUrl: env.ORDER_WEBHOOK_URL || '',
    telegramBotToken: env.TELEGRAM_BOT_TOKEN || '',
    telegramChatId: env.TELEGRAM_CHAT_ID || '',
  },
  paymob: {
    apiBase: (env.PAYMOB_API_BASE || 'https://accept.paymob.com').replace(/\/$/, ''),
    secretKey: env.PAYMOB_SECRET_KEY || '',
    publicKey: env.PAYMOB_PUBLIC_KEY || '',
    integrationIds: list(env.PAYMOB_INTEGRATION_IDS).map(Number).filter(Number.isFinite),
    hmacSecret: env.PAYMOB_HMAC_SECRET || '',
    /** Paymob requires a billing email; checkout doesn't ask for one. */
    billingEmail: env.PAYMOB_BILLING_EMAIL || site.contact.email || 'NA',
  },
};

export const paymobConfigured = () =>
  Boolean(config.paymob.secretKey && config.paymob.publicKey && config.paymob.integrationIds.length && config.paymob.hmacSecret);
