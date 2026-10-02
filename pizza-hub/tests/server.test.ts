/**
 * End-to-end test of the order server, with a fake Paymob API.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { createHmac } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { site } from '../src/config/site.ts';
import { productById } from '../src/config/menu.ts';

const PORT = 18080;
const PAYMOB_PORT = 18081;
const HMAC = 'test-hmac-secret';
const base = `http://localhost:${PORT}`;
let proc: ChildProcess;
let paymob: Server;
let lastIntention: Record<string, unknown> = {};
const dataDir = mkdtempSync(join(tmpdir(), 'pizzahub-'));

before(async () => {
  paymob = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      lastIntention = JSON.parse(body || '{}');
      assert.equal(req.headers.authorization, 'Token sk_test');
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'pi_test', client_secret: 'cs_test', intention_order_id: 777 }));
    });
  }).listen(PAYMOB_PORT);

  proc = spawn(process.execPath, ['server/index.ts'], {
    env: {
      ...process.env,
      PORT: String(PORT),
      DATA_DIR: dataDir,
      ADMIN_TOKEN: 'admin-test',
      PUBLIC_URL: 'https://pizzahub.test',
      PAYMOB_API_BASE: `http://localhost:${PAYMOB_PORT}`,
      PAYMOB_SECRET_KEY: 'sk_test',
      PAYMOB_PUBLIC_KEY: 'pk_test',
      PAYMOB_INTEGRATION_IDS: '123',
      PAYMOB_HMAC_SECRET: HMAC,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise<void>((resolve, reject) => {
    proc.stdout!.on('data', (d) => String(d).includes('running on') && resolve());
    proc.stderr!.on('data', (d) => process.stderr.write(d));
    proc.on('exit', (code) => reject(new Error(`server exited ${code}`)));
  });
});

after(() => {
  proc?.kill();
  paymob?.close();
  rmSync(dataDir, { recursive: true, force: true });
});

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

const area = site.delivery.areas[0];
const deliveryOrder = (paymentMethod: 'cash' | 'online') => ({
  orderType: 'delivery',
  paymentMethod,
  customer: { name: 'Mona Ahmed', phone: '+20 100 123 4567', areaId: area.id, street: '12 Central Axis', building: '5', floor: '2', apartment: '4' },
  items: [
    { productId: 'pizza-hub-special', selection: { sizeId: 'large', options: { crust: { 'cheese-crust': 1 }, toppings: { mushrooms: 1 } } }, quantity: 2, unitPrice: 1 },
    { productId: 'garlic-bread', selection: { sizeId: 'regular', options: { sauces: { garlic: 1 } } }, quantity: 1 },
  ],
});
const expectedTotal = () => {
  const p = productById.get('pizza-hub-special')!;
  return (p.prices.large! + 50 + 20) * 2 + (60 + 15) + area.fee;
};

test('cash order is created, re-priced and trackable', async () => {
  const res = await post('/api/orders', deliveryOrder('cash'));
  assert.equal(res.status, 201);
  const order = await res.json();
  assert.match(order.orderNumber, /^PH-[A-Z2-9]{6}$/);
  assert.equal(order.status, 'received');
  assert.equal(order.totals.total, expectedTotal());
  assert.equal(order.customer.phone, '01001234567');
  assert.equal(order.request, undefined, 'internal fields are not exposed');

  assert.equal((await fetch(`${base}/api/orders/${order.orderNumber}?t=wrong`)).status, 404);
  const tracked = await (await fetch(`${base}/api/orders/${order.orderNumber}?t=${order.trackingToken}`)).json();
  assert.equal(tracked.status, 'received');

  // kitchen updates the status
  assert.equal((await fetch(`${base}/api/admin/orders/${order.orderNumber}`, { method: 'PATCH', body: '{"status":"preparing"}' })).status, 401);
  const upd = await fetch(`${base}/api/admin/orders/${order.orderNumber}`, { method: 'PATCH', headers: { Authorization: 'Bearer admin-test' }, body: '{"status":"preparing"}' });
  assert.equal(upd.status, 200);
  const again = await (await fetch(`${base}/api/orders/${order.orderNumber}?t=${order.trackingToken}`)).json();
  assert.equal(again.status, 'preparing');
});

test('invalid orders are rejected with field errors', async () => {
  const res = await post('/api/orders', { ...deliveryOrder('cash'), customer: { name: '', phone: '123' } });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.fields.phone);
  assert.ok(body.fields.name);
});

function sign(obj: Record<string, unknown>) {
  const fields = ['amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction', 'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded', 'is_standalone_payment', 'is_voided', 'order.id', 'owner', 'pending', 'source_data.pan', 'source_data.sub_type', 'source_data.type', 'success'];
  const get = (p: string) => p.split('.').reduce<any>((o, k) => o?.[k], obj);
  return createHmac('sha512', HMAC).update(fields.map((f) => String(get(f) ?? '')).join('')).digest('hex');
}

test('online order stays unpaid until a valid Paymob callback arrives', async () => {
  const res = await post('/api/orders', deliveryOrder('online'));
  assert.equal(res.status, 201);
  const order = await res.json();
  assert.equal(order.status, 'awaiting_payment');
  assert.equal(order.paymentStatus, 'pending');
  assert.equal(order.paymentUrl, `http://localhost:${PAYMOB_PORT}/unifiedcheckout/?publicKey=pk_test&clientSecret=cs_test`);
  assert.equal(lastIntention.amount, expectedTotal() * 100);
  const items = lastIntention.items as { amount: number; quantity: number }[];
  assert.equal(items.reduce((s, i) => s + i.amount * i.quantity, 0), expectedTotal() * 100);

  const txn = {
    id: 9001, amount_cents: expectedTotal() * 100, created_at: '2026-10-02T12:00:00', currency: 'EGP', error_occured: false,
    has_parent_transaction: false, integration_id: 123, is_3d_secure: true, is_auth: false, is_capture: false, is_refunded: false,
    is_standalone_payment: true, is_voided: false, order: { id: 777, merchant_order_id: `${order.orderNumber}-1` }, owner: 1,
    pending: false, source_data: { pan: '2346', sub_type: 'MasterCard', type: 'card' }, success: true,
  };

  // forged callback → rejected, still unpaid
  const forged = await post('/api/payments/paymob/webhook?hmac=deadbeef', { type: 'TRANSACTION', obj: txn });
  assert.equal(forged.status, 401);
  let status = await (await fetch(`${base}/api/orders/${order.orderNumber}?t=${order.trackingToken}`)).json();
  assert.equal(status.paymentStatus, 'pending');

  // wrong amount, valid signature → failed, not paid
  const cheap = { ...txn, amount_cents: 100 };
  await post(`/api/payments/paymob/webhook?hmac=${sign(cheap)}`, { type: 'TRANSACTION', obj: cheap });
  status = await (await fetch(`${base}/api/orders/${order.orderNumber}?t=${order.trackingToken}`)).json();
  assert.notEqual(status.paymentStatus, 'paid');

  // genuine callback → paid & received
  const ok = await post(`/api/payments/paymob/webhook?hmac=${sign(txn)}`, { type: 'TRANSACTION', obj: txn });
  assert.equal(ok.status, 200);
  status = await (await fetch(`${base}/api/orders/${order.orderNumber}?t=${order.trackingToken}`)).json();
  assert.equal(status.paymentStatus, 'paid');
  assert.equal(status.status, 'received');
});

test('SPA routes fall back to index.html when built', async () => {
  const res = await fetch(`${base}/menu`);
  assert.ok([200, 503].includes(res.status));
  const missing = await fetch(`${base}/nope.js`);
  assert.ok([404, 503].includes(missing.status));
});
