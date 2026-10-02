/**
 * Paymob (Accept) — Intention API + Unified Checkout.
 *  1. createPayment() → POST /v1/intention/ with the secret key → client_secret
 *  2. Customer is redirected to /unifiedcheckout/?publicKey=…&clientSecret=…
 *  3. Paymob calls our webhook (transaction processed callback) → verify HMAC → mark paid.
 * Nothing is ever marked as paid without a valid, HMAC-verified Paymob callback.
 * Docs: https://developers.paymob.com
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { site } from '../src/config/site.ts';
import { config } from './config.ts';
import type { StoredOrder } from './store.ts';

export async function createPayment(order: StoredOrder): Promise<{ url: string; intentionId: string; paymobOrderId?: string }> {
  const { apiBase, secretKey, publicKey, integrationIds } = config.paymob;
  const amountCents = Math.round(order.totals.total * 100);
  const [first, ...rest] = order.customer.name.trim().split(/\s+/);
  const items = order.lines.map((l) => ({
    name: `${l.name}${l.size ? ` (${l.size})` : ''}`.slice(0, 50),
    amount: Math.round(l.unitPrice * 100),
    quantity: l.quantity,
    description: (l.details.join(', ') || l.name).slice(0, 255),
  }));
  if (order.totals.deliveryFee > 0) {
    items.push({ name: 'Delivery', amount: Math.round(order.totals.deliveryFee * 100), quantity: 1, description: 'Delivery fee' });
  }
  // Paymob requires the item amounts to add up to the total.
  const itemsTotal = items.reduce((s, i) => s + i.amount * i.quantity, 0);

  const body = {
    amount: amountCents,
    currency: site.currency,
    payment_methods: integrationIds,
    items: itemsTotal === amountCents ? items : [{ name: `Order ${order.orderNumber}`, amount: amountCents, quantity: 1, description: site.name }],
    billing_data: {
      first_name: first || 'Customer',
      last_name: rest.join(' ') || 'NA',
      phone_number: order.customer.phone.replace(/^0/, '+20'),
      email: config.paymob.billingEmail,
      street: order.customer.street || 'NA',
      building: order.customer.building || 'NA',
      floor: order.customer.floor || 'NA',
      apartment: order.customer.apartment || 'NA',
      city: site.address.city,
      state: site.address.region,
      country: site.address.countryCode,
    },
    special_reference: `${order.orderNumber}-${Date.now()}`,
    notification_url: `${config.publicUrl}/api/payments/paymob/webhook`,
    redirection_url: `${config.publicUrl}/api/payments/paymob/return/${order.orderNumber}/${order.trackingToken}`,
    extras: { order_number: order.orderNumber },
  };

  const res = await fetch(`${apiBase}/v1/intention/`, {
    method: 'POST',
    headers: { Authorization: `Token ${secretKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { client_secret?: string; id?: string; intention_order_id?: number | string };
  if (!res.ok || !data.client_secret) {
    console.error('[paymob] intention failed', res.status, data);
    throw new Error('Online payment is unavailable right now. Please try again or choose cash.');
  }
  return {
    url: `${apiBase}/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(data.client_secret)}`,
    intentionId: String(data.id ?? ''),
    paymobOrderId: data.intention_order_id != null ? String(data.intention_order_id) : undefined,
  };
}

/** Field order Paymob uses for the transaction HMAC. */
const HMAC_FIELDS = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
];

function pick(obj: Record<string, unknown>, path: string): string {
  const v = path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
  return v === undefined || v === null ? '' : String(v);
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a.toLowerCase());
  const y = Buffer.from(b.toLowerCase());
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Webhook body: { type: 'TRANSACTION', obj: {...} }, HMAC in ?hmac= */
export function verifyTransactionHmac(obj: Record<string, unknown>, hmac: string): boolean {
  if (!config.paymob.hmacSecret || !hmac) return false;
  const message = HMAC_FIELDS.map((f) => pick(obj, f)).join('');
  const digest = createHmac('sha512', config.paymob.hmacSecret).update(message).digest('hex');
  return safeEqual(digest, hmac);
}

/** Redirect (GET) callback: flat query params, "order" instead of "order.id". */
export function verifyRedirectHmac(q: URLSearchParams): boolean {
  const hmac = q.get('hmac') || '';
  if (!config.paymob.hmacSecret || !hmac) return false;
  const message = HMAC_FIELDS.map((f) => q.get(f === 'order.id' ? 'order' : f) ?? '').join('');
  const digest = createHmac('sha512', config.paymob.hmacSecret).update(message).digest('hex');
  return safeEqual(digest, hmac);
}
