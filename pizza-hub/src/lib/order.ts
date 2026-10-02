/**
 * Order types + validation, shared by the checkout form and the order server.
 */
import { site } from '../config/site.ts';
import { productById } from '../config/menu.ts';
import {
  computeTotals,
  describeSelection,
  normalizeSelection,
  priceLines,
  type CartItemInput,
  type OrderType,
  type PricedLine,
  type Totals,
} from './pricing.ts';
import { formatMoney } from './format.ts';

export type PaymentMethod = 'cash' | 'online';

export type OrderStatus =
  | 'awaiting_payment'
  | 'payment_failed'
  | 'received'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled';

export interface CustomerDetails {
  name: string;
  phone: string;
  areaId?: string;
  street?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  notes?: string;
}

export interface OrderRequest {
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  customer: CustomerDetails;
  items: CartItemInput[];
}

/** What the server returns (and what the confirmation page displays). */
export interface OrderSummary {
  orderNumber: string;
  trackingToken: string;
  status: OrderStatus;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  paymentStatus: 'not_required' | 'pending' | 'paid' | 'failed';
  createdAt: string;
  eta: [number, number];
  customer: CustomerDetails;
  lines: {
    productId: string;
    name: string;
    size: string | null;
    details: string[];
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    note?: string;
  }[];
  totals: Totals;
  /** Present when the customer must be sent to the payment page */
  paymentUrl?: string;
}

/** Egyptian mobile numbers: 010 / 011 / 012 / 015 + 8 digits (with optional +20 / 0020). */
export function normalizeEgyptianMobile(input: string): string | null {
  const digits = (input || '').replace(/[^\d+]/g, '').replace(/^\+?20|^0020/, '0');
  return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}

export type FieldErrors = Partial<Record<keyof CustomerDetails | 'items' | 'orderType' | 'paymentMethod', string>>;

export function validateCustomer(orderType: OrderType, c: CustomerDetails): FieldErrors {
  const e: FieldErrors = {};
  if (!c.name || c.name.trim().length < 2) e.name = 'Please enter your name';
  if (!normalizeEgyptianMobile(c.phone)) e.phone = 'Enter a valid Egyptian mobile number (e.g. 010xxxxxxxx)';
  if (orderType === 'delivery') {
    if (!site.delivery.areas.some((a) => a.id === c.areaId)) e.areaId = 'Choose your area';
    if (!c.street || c.street.trim().length < 3) e.street = 'Enter your street / address';
    if (!c.building || !c.building.trim()) e.building = 'Required';
  }
  for (const [k, v] of Object.entries(c)) {
    if (typeof v === 'string' && v.length > 300) e[k as keyof CustomerDetails] = 'Too long';
  }
  return e;
}

const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.trim().slice(0, n) : '');

/**
 * Full server-side validation. Re-prices everything from the menu config.
 * Returns the cleaned request and priced lines, or throws with a message.
 */
export function validateOrderRequest(body: unknown): { request: OrderRequest; lines: PricedLine[]; totals: Totals } {
  const b = (body ?? {}) as Partial<OrderRequest>;
  const orderType: OrderType = b.orderType === 'pickup' ? 'pickup' : 'delivery';
  const paymentMethod: PaymentMethod = b.paymentMethod === 'online' ? 'online' : 'cash';
  const c = (b.customer ?? {}) as CustomerDetails;
  const customer: CustomerDetails = {
    name: clip(c.name, 80),
    phone: normalizeEgyptianMobile(clip(c.phone, 20)) ?? clip(c.phone, 20),
    notes: clip(c.notes, 300),
  };
  if (orderType === 'delivery') {
    Object.assign(customer, {
      areaId: clip(c.areaId, 60),
      street: clip(c.street, 200),
      building: clip(c.building, 40),
      floor: clip(c.floor, 20),
      apartment: clip(c.apartment, 20),
    });
  }
  const errors = validateCustomer(orderType, customer);
  if (Object.keys(errors).length) throw new ValidationError('Please check your details', errors);

  if (!Array.isArray(b.items) || b.items.length === 0) throw new ValidationError('Your cart is empty');
  if (b.items.length > 50) throw new ValidationError('Too many items in one order');

  const items: CartItemInput[] = b.items.map((raw) => {
    const product = productById.get(String(raw?.productId));
    if (!product || product.available === false) throw new ValidationError('An item in your cart is no longer available');
    const quantity = Math.floor(Number(raw.quantity));
    if (!(quantity >= 1 && quantity <= site.ordering.maxItemQuantity)) throw new ValidationError('Invalid quantity');
    let selection;
    try {
      selection = normalizeSelection(product, raw.selection);
    } catch (err) {
      throw new ValidationError((err as Error).message);
    }
    return { productId: product.id, selection, quantity, note: clip(raw.note, 200) || undefined };
  });

  const lines = priceLines(items);
  const totals = computeTotals(lines, orderType, customer.areaId);
  if (orderType === 'delivery' && totals.subtotal < site.ordering.minimumDeliveryOrder) {
    throw new ValidationError(`Minimum order for delivery is ${formatMoney(site.ordering.minimumDeliveryOrder)}`);
  }
  if (paymentMethod === 'cash' && !site.payments.cash.enabled) throw new ValidationError('Cash payment is not available');
  if (paymentMethod === 'online' && !site.payments.online.enabled) throw new ValidationError('Online payment is not available');

  return { request: { orderType, paymentMethod, customer, items }, lines, totals };
}

export class ValidationError extends Error {
  fields?: FieldErrors;
  constructor(message: string, fields?: FieldErrors) {
    super(message);
    this.fields = fields;
  }
}

export function summarizeLines(lines: PricedLine[]): OrderSummary['lines'] {
  return lines.map((l) => {
    const d = describeSelection(l.product, l.selection);
    return {
      productId: l.productId,
      name: l.product.name,
      size: d.size,
      details: d.lines.map((x) => x.text),
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      note: l.note,
    };
  });
}

export function etaFor(orderType: OrderType): [number, number] {
  return site.ordering.prepTime[orderType];
}

/** Short, readable order numbers without look-alike characters. */
export function generateOrderNumber(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return 'PH-' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export function generateToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function areaName(areaId?: string): string {
  return site.delivery.areas.find((a) => a.id === areaId)?.name ?? '';
}

export function formatAddress(c: CustomerDetails): string {
  return [
    c.street,
    c.building && `Bldg ${c.building}`,
    c.floor && `Floor ${c.floor}`,
    c.apartment && `Apt ${c.apartment}`,
    areaName(c.areaId),
  ]
    .filter(Boolean)
    .join(', ');
}

/** Plain-text order ticket (WhatsApp / Telegram / kitchen). */
export function orderTicket(o: OrderSummary): string {
  const out: string[] = [];
  out.push(`🍕 *${site.name.toUpperCase()} — NEW ORDER ${o.orderNumber}*`);
  out.push(`${o.orderType === 'delivery' ? '🛵 Delivery' : '🏃 Pickup'} · ${o.paymentMethod === 'cash' ? 'Cash' : 'Online payment'}`);
  out.push('');
  for (const l of o.lines) {
    out.push(`${l.quantity}× ${l.name}${l.size ? ` (${l.size})` : ''} — ${formatMoney(l.lineTotal)}`);
    for (const d of l.details) out.push(`   • ${d}`);
    if (l.note) out.push(`   📝 ${l.note}`);
  }
  out.push('');
  out.push(`Subtotal: ${formatMoney(o.totals.subtotal)}`);
  if (o.orderType === 'delivery') out.push(`Delivery: ${formatMoney(o.totals.deliveryFee)}`);
  out.push(`*Total: ${formatMoney(o.totals.total)}*`);
  out.push('');
  out.push(`👤 ${o.customer.name}`);
  out.push(`📞 ${o.customer.phone}`);
  if (o.orderType === 'delivery') out.push(`📍 ${formatAddress(o.customer)}`);
  if (o.customer.notes) out.push(`📝 ${o.customer.notes}`);
  return out.join('\n');
}
