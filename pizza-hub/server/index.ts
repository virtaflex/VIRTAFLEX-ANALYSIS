/**
 * Pizza Hub order server — zero dependencies, Node 22.18+.
 *   npm run build && npm start
 *
 * Serves the built website (dist/) and the order API:
 *   POST  /api/orders                              place an order (re-priced from src/config/menu.ts)
 *   GET   /api/orders/:number?t=token              order status (for confirmation / tracking pages)
 *   POST  /api/orders/:number/payment?t=token      new Paymob payment link (retry)
 *   POST  /api/payments/paymob/webhook?hmac=…      Paymob transaction callback (HMAC verified)
 *   GET   /api/payments/paymob/return/:number/:t   Paymob redirect back to the site
 *   GET   /api/admin/orders                        list orders     (Authorization: Bearer ADMIN_TOKEN)
 *   PATCH /api/admin/orders/:number {status}       update status  (Authorization: Bearer ADMIN_TOKEN)
 *   GET   /api/health
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { createGzip } from 'node:zlib';
import { timingSafeEqual } from 'node:crypto';
import { site } from '../src/config/site.ts';
import {
  etaFor,
  generateOrderNumber,
  generateToken,
  summarizeLines,
  validateOrderRequest,
  ValidationError,
  type OrderStatus,
} from '../src/lib/order.ts';
import { config, paymobConfigured } from './config.ts';
import { publicView, store, type StoredOrder } from './store.ts';
import { createPayment, verifyRedirectHmac, verifyTransactionHmac } from './paymob.ts';
import { notifyNewOrder } from './notify.ts';

const MAX_BODY = 64 * 1024;
const STATUSES: OrderStatus[] = ['received', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'];

/* ───────── helpers ───────── */

function send(res: ServerResponse, status: number, data: unknown, headers: Record<string, string> = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY) throw new ValidationError('Request too large');
    chunks.push(chunk as Buffer);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ValidationError('Invalid JSON');
  }
}

function clientIp(req: IncomingMessage) {
  const fwd = config.trustProxy ? String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() : '';
  return fwd || req.socket.remoteAddress || 'unknown';
}

const hits = new Map<string, number[]>();
/** Simple sliding-window rate limit: `limit` requests per `windowMs` per IP+key. */
function rateLimited(req: IncomingMessage, key: string, limit: number, windowMs: number) {
  const id = `${key}:${clientIp(req)}`;
  const now = Date.now();
  const recent = (hits.get(id) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(id, recent);
  return recent.length > limit;
}
setInterval(() => hits.clear(), 60 * 60 * 1000).unref();

function tokenOk(order: StoredOrder, token: string | null) {
  if (!token) return false;
  const a = Buffer.from(order.trackingToken);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

function isAdmin(req: IncomingMessage) {
  if (!config.adminToken) return false;
  const given = Buffer.from(String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, ''));
  const want = Buffer.from(config.adminToken);
  return given.length === want.length && timingSafeEqual(given, want);
}

function cors(req: IncomingMessage, res: ServerResponse) {
  const origin = String(req.headers.origin ?? '');
  if (origin && config.allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}

/* ───────── API ───────── */

async function createOrder(req: IncomingMessage, res: ServerResponse) {
  if (rateLimited(req, 'order', 8, 10 * 60 * 1000)) return send(res, 429, { error: 'Too many orders from this connection. Please wait a few minutes.' });
  const { request, lines, totals } = validateOrderRequest(await readJson(req));

  const online = request.paymentMethod === 'online';
  if (online && !paymobConfigured()) return send(res, 400, { error: 'Online payment isn’t available yet. Please choose cash.' });

  let orderNumber = generateOrderNumber();
  while (store.has(orderNumber)) orderNumber = generateOrderNumber();
  const now = new Date().toISOString();
  const status: OrderStatus = online ? 'awaiting_payment' : 'received';

  const order: StoredOrder = {
    orderNumber,
    trackingToken: generateToken(),
    status,
    orderType: request.orderType,
    paymentMethod: request.paymentMethod,
    paymentStatus: online ? 'pending' : 'not_required',
    createdAt: now,
    eta: etaFor(request.orderType),
    customer: request.customer,
    lines: summarizeLines(lines),
    totals,
    request,
    history: [{ status, at: now }],
  };

  if (online) {
    const payment = await createPayment(order);
    order.paymob = { intentionId: payment.intentionId, paymobOrderId: payment.paymobOrderId };
    store.save(order);
    return send(res, 201, { ...publicView(order), paymentUrl: payment.url });
  }

  store.save(order);
  void notifyNewOrder(order);
  return send(res, 201, publicView(order));
}

function markPaid(order: StoredOrder, transactionId: string) {
  if (order.paymentStatus === 'paid') return;
  order.paymentStatus = 'paid';
  order.paymob = { ...order.paymob, transactionId };
  store.setStatus(order, 'received', `Paid online (Paymob txn ${transactionId})`);
  void notifyNewOrder(order);
}

function markFailed(order: StoredOrder, transactionId: string) {
  if (order.paymentStatus === 'paid') return;
  order.paymentStatus = 'failed';
  store.setStatus(order, 'payment_failed', `Paymob txn ${transactionId} not successful`);
}

/** Paymob transaction processed callback. */
async function paymobWebhook(req: IncomingMessage, res: ServerResponse, url: URL) {
  const body = (await readJson(req)) as { type?: string; obj?: Record<string, unknown> };
  const obj = body.obj;
  if (body.type !== 'TRANSACTION' || !obj) return send(res, 200, { ok: true, ignored: true });
  if (!verifyTransactionHmac(obj, url.searchParams.get('hmac') ?? '')) {
    console.warn('[paymob] webhook with invalid HMAC rejected');
    return send(res, 401, { error: 'invalid hmac' });
  }
  const paymobOrder = (obj.order ?? {}) as Record<string, unknown>;
  // special_reference is sent as "<orderNumber>-<timestamp>" and comes back as merchant_order_id
  const ref = String(paymobOrder.merchant_order_id ?? '').replace(/-\d+$/, '');
  const order = store.findByPaymob(String(paymobOrder.id ?? '')) ?? store.get(ref);
  if (!order) {
    console.warn('[paymob] webhook for unknown order', paymobOrder.id, ref);
    return send(res, 200, { ok: true, unknown: true });
  }
  const txn = String(obj.id ?? '');
  if (obj.pending === true) return send(res, 200, { ok: true, pending: true });
  if (obj.success === true && Number(obj.amount_cents) === Math.round(order.totals.total * 100)) markPaid(order, txn);
  else markFailed(order, txn);
  return send(res, 200, { ok: true });
}

/** Paymob redirects the customer here after checkout; we verify and bounce to the confirmation page. */
function paymobReturn(res: ServerResponse, url: URL, orderNumber: string, token: string) {
  const order = store.get(orderNumber);
  if (order && tokenOk(order, token) && verifyRedirectHmac(url.searchParams)) {
    const q = url.searchParams;
    const ourOrder = !order.paymob?.paymobOrderId || order.paymob.paymobOrderId === q.get('order');
    if (ourOrder && q.get('pending') !== 'true') {
      if (q.get('success') === 'true' && Number(q.get('amount_cents')) === Math.round(order.totals.total * 100)) markPaid(order, q.get('id') ?? '');
      else markFailed(order, q.get('id') ?? '');
    }
  }
  // Without a valid HMAC we change nothing — the webhook remains the source of truth.
  res.writeHead(302, { Location: `/order/${encodeURIComponent(orderNumber)}?t=${encodeURIComponent(token)}` });
  res.end();
}

async function api(req: IncomingMessage, res: ServerResponse, url: URL) {
  const parts = url.pathname.split('/').filter(Boolean).slice(1); // drop "api"
  const method = req.method ?? 'GET';
  cors(req, res);
  if (method === 'OPTIONS') return send(res, 204, {});

  if (parts[0] === 'health') return send(res, 200, { ok: true, onlinePayments: paymobConfigured() });

  if (parts[0] === 'orders') {
    if (parts.length === 1 && method === 'POST') return createOrder(req, res);
    const order = store.get(decodeURIComponent(parts[1] ?? ''));
    if (!order || !tokenOk(order, url.searchParams.get('t'))) return send(res, 404, { error: 'Order not found' });
    if (parts.length === 2 && method === 'GET') return send(res, 200, publicView(order));
    if (parts[2] === 'payment' && method === 'POST') {
      if (rateLimited(req, 'pay', 6, 10 * 60 * 1000)) return send(res, 429, { error: 'Too many attempts. Please wait a few minutes.' });
      if (order.paymentMethod !== 'online' || order.paymentStatus === 'paid') return send(res, 400, { error: 'This order doesn’t need payment.' });
      if (!paymobConfigured()) return send(res, 400, { error: 'Online payment isn’t available right now.' });
      const payment = await createPayment(order);
      order.paymob = { ...order.paymob, intentionId: payment.intentionId, paymobOrderId: payment.paymobOrderId };
      order.paymentStatus = 'pending';
      store.setStatus(order, 'awaiting_payment', 'Payment retried');
      return send(res, 200, { paymentUrl: payment.url });
    }
  }

  if (parts[0] === 'payments' && parts[1] === 'paymob') {
    if (parts[2] === 'webhook' && method === 'POST') return paymobWebhook(req, res, url);
    if (parts[2] === 'return' && method === 'GET' && parts[3] && parts[4]) return paymobReturn(res, url, decodeURIComponent(parts[3]), decodeURIComponent(parts[4]));
  }

  if (parts[0] === 'admin') {
    if (!isAdmin(req)) return send(res, 401, { error: 'Unauthorized' });
    if (parts[1] === 'orders' && parts.length === 2 && method === 'GET') return send(res, 200, store.list(Number(url.searchParams.get('limit')) || 100));
    if (parts[1] === 'orders' && parts[2] && method === 'PATCH') {
      const order = store.get(decodeURIComponent(parts[2]));
      if (!order) return send(res, 404, { error: 'Order not found' });
      const { status, note } = (await readJson(req)) as { status?: OrderStatus; note?: string };
      if (!status || !STATUSES.includes(status)) return send(res, 400, { error: `status must be one of ${STATUSES.join(', ')}` });
      store.setStatus(order, status, typeof note === 'string' ? note.slice(0, 200) : undefined);
      return send(res, 200, order);
    }
  }

  return send(res, 404, { error: 'Not found' });
}

/* ───────── static site ───────── */

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.webmanifest', '.txt']);

function serveFile(req: IncomingMessage, res: ServerResponse, file: string, cache: string) {
  const ext = extname(file);
  const headers: Record<string, string> = { 'Content-Type': MIME[ext] ?? 'application/octet-stream', 'Cache-Control': cache };
  const gzip = COMPRESSIBLE.has(ext) && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''));
  if (gzip) {
    headers['Content-Encoding'] = 'gzip';
    headers.Vary = 'Accept-Encoding';
  } else {
    headers['Content-Length'] = String(statSync(file).size);
  }
  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  const stream = createReadStream(file);
  (gzip ? stream.pipe(createGzip()) : stream).pipe(res);
}

function serveStatic(req: IncomingMessage, res: ServerResponse, url: URL) {
  const index = join(config.distDir, 'index.html');
  if (!existsSync(index)) {
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    return res.end('Website not built yet — run `npm run build`.');
  }
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = join(config.distDir, rel);
  if (file.startsWith(config.distDir) && existsSync(file) && statSync(file).isFile()) {
    const cache = rel.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : rel.startsWith('/images/') ? 'public, max-age=2592000' : 'public, max-age=3600';
    return serveFile(req, res, file, rel.endsWith('.html') ? 'no-cache' : cache);
  }
  if (extname(rel)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not found');
  }
  return serveFile(req, res, index, 'no-cache'); // SPA route
}

/* ───────── server ───────── */

const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  const url = new URL(req.url ?? '/', 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
    return serveStatic(req, res, url);
  } catch (err) {
    if (err instanceof ValidationError) return send(res, 400, { error: err.message, fields: err.fields });
    console.error(err);
    if (!res.headersSent) send(res, 500, { error: (err as Error).message?.startsWith('Online payment') ? (err as Error).message : 'Something went wrong. Please try again.' });
  }
});

server.listen(config.port, () => {
  console.log(`🍕 ${site.name} running on http://localhost:${config.port}`);
  console.log(`   Online payments (Paymob): ${paymobConfigured() ? 'enabled' : 'not configured'}`);
  if (site.ordering.mode !== 'api') console.log(`   Note: site.ordering.mode is "${site.ordering.mode}" — set it to "api" (or VITE_ORDER_MODE=api) so the website uses this server.`);
});
