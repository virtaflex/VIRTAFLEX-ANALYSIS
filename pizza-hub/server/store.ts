/**
 * Minimal JSON-file order store. Fine for a single restaurant to start with;
 * swap for a real database (Postgres, Supabase, …) by re-implementing these functions.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OrderRequest, OrderStatus, OrderSummary } from '../src/lib/order.ts';
import { config } from './config.ts';

export interface StoredOrder extends OrderSummary {
  request: OrderRequest;
  history: { status: OrderStatus; at: string; note?: string }[];
  paymob?: { intentionId?: string; paymobOrderId?: string; transactionId?: string };
}

const file = join(config.dataDir, 'orders.json');
const orders = new Map<string, StoredOrder>();

try {
  mkdirSync(config.dataDir, { recursive: true });
  const saved = JSON.parse(readFileSync(file, 'utf8')) as StoredOrder[];
  for (const o of saved) orders.set(o.orderNumber, o);
} catch {
  /* first run */
}

let timer: NodeJS.Timeout | undefined;
function persist() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, JSON.stringify([...orders.values()], null, 2));
    renameSync(tmp, file);
  }, 50);
}

export const store = {
  get: (orderNumber: string) => orders.get(orderNumber),
  has: (orderNumber: string) => orders.has(orderNumber),
  save(order: StoredOrder) {
    orders.set(order.orderNumber, order);
    persist();
    return order;
  },
  setStatus(order: StoredOrder, status: OrderStatus, note?: string) {
    order.status = status;
    order.history.push({ status, at: new Date().toISOString(), note });
    persist();
  },
  findByPaymob(paymobOrderId: string) {
    for (const o of orders.values()) if (o.paymob?.paymobOrderId === paymobOrderId) return o;
    return undefined;
  },
  list: (limit = 100) => [...orders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit),
};

/** Fields safe to show the customer (no internal payment ids / history notes). */
export function publicView(o: StoredOrder): OrderSummary {
  const { request: _r, history: _h, paymob: _p, ...pub } = o;
  void _r;
  void _h;
  void _p;
  return pub;
}
