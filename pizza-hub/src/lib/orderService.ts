/**
 * Sends orders according to the configured mode (see site.ordering.mode).
 *  - api      → POST to the order server; online payments redirect to Paymob.
 *  - whatsapp → builds a pre-filled WhatsApp message to the restaurant.
 *  - demo     → nothing is sent; the confirmation page is clearly marked as a demo.
 * Payments are never marked as paid in the browser — only the server can do
 * that, after Paymob confirms the transaction.
 */
import { site, type OrderMode } from '../config/site.ts';
import { apiBase, orderMode } from '../config/runtime.ts';
import { computeTotals, priceLines } from './pricing.ts';
import {
  etaFor,
  generateOrderNumber,
  generateToken,
  normalizeEgyptianMobile,
  orderTicket,
  summarizeLines,
  ValidationError,
  type OrderRequest,
  type OrderSummary,
} from './order.ts';

export interface PlacedOrder extends OrderSummary {
  mode: OrderMode;
  whatsappUrl?: string;
}

const STORE_KEY = 'pizzahub:orders:v1';

export function saveOrder(order: PlacedOrder) {
  try {
    const all = loadOrders().filter((o) => o.orderNumber !== order.orderNumber);
    all.unshift(order);
    localStorage.setItem(STORE_KEY, JSON.stringify(all.slice(0, 10)));
  } catch {
    /* ignore */
  }
}

export function loadOrders(): PlacedOrder[] {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '[]') as PlacedOrder[];
  } catch {
    return [];
  }
}

export function getSavedOrder(orderNumber: string): PlacedOrder | undefined {
  return loadOrders().find((o) => o.orderNumber === orderNumber);
}

function buildLocalSummary(req: OrderRequest): OrderSummary {
  const lines = priceLines(req.items);
  const totals = computeTotals(lines, req.orderType, req.customer.areaId);
  return {
    orderNumber: generateOrderNumber(),
    trackingToken: generateToken(),
    status: 'received',
    orderType: req.orderType,
    paymentMethod: req.paymentMethod,
    paymentStatus: 'not_required',
    createdAt: new Date().toISOString(),
    eta: etaFor(req.orderType),
    customer: { ...req.customer, phone: normalizeEgyptianMobile(req.customer.phone) ?? req.customer.phone },
    lines: summarizeLines(lines),
    totals,
  };
}

export async function placeOrder(req: OrderRequest): Promise<PlacedOrder> {
  if (orderMode === 'api') {
    let res: Response;
    try {
      res = await fetch(`${apiBase}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
    } catch {
      throw new Error('We couldn’t reach the restaurant. Check your connection and try again.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ValidationError(data.error || 'Something went wrong. Please try again.', data.fields);
    const order: PlacedOrder = { ...(data as OrderSummary), mode: 'api' };
    saveOrder(order);
    return order;
  }

  if (req.paymentMethod === 'online') {
    throw new Error('Online payment isn’t available yet. Please choose cash.');
  }

  const summary = buildLocalSummary(req);

  if (orderMode === 'whatsapp') {
    if (!site.contact.whatsapp) throw new Error('WhatsApp ordering isn’t set up yet.');
    const whatsappUrl = `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(orderTicket(summary))}`;
    const order: PlacedOrder = { ...summary, mode: 'whatsapp', whatsappUrl };
    saveOrder(order);
    return order;
  }

  const order: PlacedOrder = { ...summary, mode: 'demo' };
  saveOrder(order);
  return order;
}

/** Live status from the order server (api mode only). */
export async function fetchOrder(orderNumber: string, token: string): Promise<OrderSummary> {
  const res = await fetch(`${apiBase}/orders/${encodeURIComponent(orderNumber)}?t=${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error(res.status === 404 ? 'Order not found' : 'Could not load the order');
  return (await res.json()) as OrderSummary;
}

/** Ask the server for a fresh payment link (after a failed / abandoned card payment). */
export async function retryPayment(orderNumber: string, token: string): Promise<string> {
  const res = await fetch(`${apiBase}/orders/${encodeURIComponent(orderNumber)}/payment?t=${encodeURIComponent(token)}`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.paymentUrl) throw new Error(data.error || 'Online payment is unavailable right now.');
  return data.paymentUrl as string;
}
