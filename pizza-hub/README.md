# Pizza Hub — Website & Online Ordering

Website and ordering system for **Pizza Hub**, an Egyptian-style pizza takeaway & delivery brand in Obour City.
*Good Pizza. Fast.*

- **Website:** React + TypeScript + Vite. Mobile-first, no UI framework. The main JS bundle is ~97 KB gzipped, and fonts are self-hosted.
- **Ordering:** menu → customize (size, crust, extra cheese, toppings, sauces with quantities) → cart (edit / remove / quantity) → checkout (delivery or pickup, area-based delivery fee) → confirmation → tracking.
- **Order server:** `server/` has zero dependencies and needs Node 22.18+. It re-prices every order from the menu config, stores orders, notifies the kitchen and handles Paymob online payments. Every Paymob callback has its HMAC signature checked.

---

## Quick start

```bash
npm install
npm run dev            # website on http://localhost:5173 (demo ordering)
```

Full stack, with orders going to the server:

```bash
npm run build
VITE_ORDER_MODE=api npm run build   # build the site in "api" mode
cp .env.example .env                # fill in the values, then export them
npm start                           # http://localhost:8080 serves the site + /api
```

During development, run `npm run dev:server` in a second terminal. Vite proxies `/api` to it.

Checks: `npm run typecheck` · `npm test` (unit tests, plus an end-to-end server test with a fake Paymob API).

---

## Updating content (no coding needed)

Everything the restaurant changes lives in **`src/config/`**:

| File | What's in it |
| --- | --- |
| `site.ts` | Name, phone, WhatsApp, address, Google Maps links, opening hours, Talabat / Instagram / Facebook / TikTok URLs, delivery areas & fees, free-delivery threshold, prep times, payment options, SEO text |
| `menu.ts` | Categories, products, prices per size, crusts, extra cheese, toppings, sauces — and which options each product offers |
| `promotions.ts` | Offers: title, description, price, image, start/end dates, CTA, active on/off |
| `images.ts` | List of photos in `public/images/` |
| `src/styles/tokens.css` | Brand colors, fonts, corner radius |

Rules the site follows automatically:
- **Empty values stay hidden.** No phone number means no phone link. No Talabat URL means the Talabat button shows "Coming soon" instead of linking anywhere. The same goes for social links and opening hours.
- A product only offers the sizes that have a price.
- Set `available: false` on a product to hide it (sold out).
- A promotion with `price: null` is shown without a price.

### ⚠️ Before launch
1. **Prices:** every price in `menu.ts` and every fee in `site.ts → delivery.areas` is a **sample**. Replace them all, then set `site.launch.samplePrices = false` to remove the "Sample prices" notice.
2. **Delivery areas:** replace the sample Obour zones with your real ones.
3. **Contact & links:** fill in `contact`, `links.talabat`, the social URLs, `address.mapsUrl` and `hours`.
4. **Domain:** set `site.url` (used for SEO, link previews and payment redirects).
5. **Ordering mode:** switch `site.ordering.mode` from `demo` to `api` or `whatsapp` (see below).
6. **Photos:** see "Images" below.

---

## Ordering modes (`site.ordering.mode`)

| Mode | What happens on "Place order" | Needs |
| --- | --- | --- |
| `demo` | Nothing is sent. The confirmation page says it's a preview. | — |
| `whatsapp` | Opens WhatsApp with the full order pre-filled, addressed to the restaurant | `contact.whatsapp` |
| `api` | Order is saved on the server, the kitchen is notified, and online payment works | `npm start` on a server |

Online payment is only offered in `api` mode with Paymob keys configured. In every other case the option shows "Soon" and can't be selected. **The browser never marks an order as paid.** Only a signature-verified Paymob callback (webhook or redirect) can do that, and only when the paid amount matches the order total.

### Paymob setup
1. In the Paymob dashboard, copy the **Secret key**, **Public key**, **HMAC secret** and your card/wallet **Integration IDs** into `.env`.
2. Set `PUBLIC_URL` to your live domain. The server automatically sends Paymob:
   - notification (webhook): `PUBLIC_URL/api/payments/paymob/webhook`
   - redirect: `PUBLIC_URL/api/payments/paymob/return/<order>/<token>`
3. Test with Paymob test keys first.

### Kitchen notifications & order status
- `ORDER_WEBHOOK_URL` receives a JSON POST for every new or paid order, so it can feed **Make.com / Zapier / n8n** (WhatsApp, Google Sheets, email…).
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` sends a ticket to the kitchen's Telegram group.
- With neither configured, the ticket is printed in the server log.
- Update an order's status (this drives the customer's tracking page):
  ```bash
  curl -X PATCH https://your-site/api/admin/orders/PH-ABC123 \
    -H "Authorization: Bearer $ADMIN_TOKEN" -d '{"status":"preparing"}'
  # received | preparing | ready | out_for_delivery | completed | cancelled
  ```
- List orders: `GET /api/admin/orders` (same header).

Orders are stored in `data/orders.json`. That's fine to start with; swap `server/store.ts` for a database when volume grows.

---

## Images

All photos were cut from the Pizza Hub brand artwork and upscaled. Each one comes in several widths (`<name>-<width>.webp`) so phones download small files.
Some menu thumbnails come from small originals and look soft. **Swap in real product shots before launch**: export each photo as WebP at the widths listed in `src/config/images.ts`, keep the same file names, or add a new entry and point the product's `image` at it. A product's `image` can also be a direct URL, like `/uploads/margherita.jpg`.

The logo (`public/images/brand/`) is a transparent cut-out of the original artwork. Use it on dark or red backgrounds.

---

## Deploying

- **Node host** (Railway, Render, Fly.io, a VPS): `npm ci && VITE_ORDER_MODE=api npm run build && npm start`. Put it behind HTTPS and set `TRUST_PROXY=1` if there's a proxy in front.
- **Static host only** (Netlify, Vercel, Cloudflare Pages) for `demo` or `whatsapp` mode: deploy `dist/`. `public/_redirects` handles routing on Netlify.

## SEO
The page title and description come from `site.seo`, plus Open Graph / Twitter cards (`public/og-image.jpg`), Restaurant structured data (JSON-LD), canonical URL, `robots.txt` and a web manifest. All of it is generated from `site.ts` at build time. Each page sets its own title.

## Project structure
```
src/config/      ← restaurant content (edit these)
src/lib/         pricing, order validation, order service (shared with the server)
src/state/       cart (saved in the browser) + UI state
src/components/  header, footer, product card, customize modal, cart drawer…
src/sections/    home page sections
src/pages/       Home, Menu, About, Contact, Checkout, Order, Track
server/          order API, Paymob, notifications, static hosting
tests/           node:test suites
```
