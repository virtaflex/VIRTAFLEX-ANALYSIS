/**
 * ─────────────────────────────────────────────────────────────
 *  PIZZA HUB — RESTAURANT SETTINGS
 *  Edit this file to update contact details, links, delivery and
 *  payment settings. Anything left empty ("") stays hidden on the site.
 *  This file is shared by the website AND the order server, so keep
 *  it plain data (no imports from the UI).
 * ─────────────────────────────────────────────────────────────
 */

export type OrderMode = 'api' | 'whatsapp' | 'demo';

export interface DeliveryArea {
  id: string;
  name: string;
  /** Delivery fee in EGP */
  fee: number;
}

export interface OpeningHours {
  /** e.g. "Daily", "Sat – Thu", "Friday" */
  days: string;
  /** 24h "HH:MM" */
  opens: string;
  /** 24h "HH:MM" — can be after midnight, e.g. "02:00" */
  closes: string;
}

export const site = {
  name: 'Pizza Hub',
  tagline: 'Good Pizza. Fast.',
  /** Public website address — used for SEO, sharing previews and payment redirects. */
  url: 'https://pizzahub.example',
  currency: 'EGP',

  contact: {
    /** Display format, e.g. "0100 000 0000" */
    phone: '',
    /** International format, digits only, e.g. "201000000000" */
    whatsapp: '',
    email: '',
  },

  address: {
    street: '',
    area: 'Obour City',
    city: 'Obour',
    region: 'Qalyubia',
    countryCode: 'EG',
    display: 'Obour City, Egypt',
    /** Google Maps share link for "Get directions" */
    mapsUrl: '',
    /** Google Maps "Embed a map" src URL (optional) */
    mapEmbedUrl: '',
    /** Optional coordinates for SEO, e.g. { lat: 30.2, lng: 31.47 } */
    geo: null as null | { lat: number; lng: number },
  },

  /** Leave empty until confirmed — the site hides the hours block. */
  hours: [] as OpeningHours[],

  links: {
    /** Paste the restaurant's real Talabat page URL here. */
    talabat: '',
    instagram: '',
    facebook: '',
    tiktok: '',
  },

  ordering: {
    /**
     * How orders are sent:
     *  - "api"      → our order server (server/index.ts). Supports online payment.
     *  - "whatsapp" → the order is handed to WhatsApp, pre-filled, to contact.whatsapp.
     *  - "demo"     → nothing is sent. For previewing only; the site shows a demo notice.
     * Can be overridden at build time with VITE_ORDER_MODE.
     */
    mode: 'demo' as OrderMode,
    /** Estimated times in minutes [from, to] */
    prepTime: { pickup: [15, 25] as [number, number], delivery: [35, 50] as [number, number] },
    /** Minimum subtotal for delivery orders, EGP (0 = none) */
    minimumDeliveryOrder: 0,
    maxItemQuantity: 20,
  },

  delivery: {
    /**
     * SAMPLE AREAS & FEES — replace with the real delivery zones before launch.
     */
    areas: [
      { id: 'obour-north', name: 'Obour — Districts 1–5', fee: 15 },
      { id: 'obour-south', name: 'Obour — Districts 6–9', fee: 20 },
      { id: 'golf-city', name: 'Golf City / Obour Buildings', fee: 25 },
      { id: 'industrial', name: 'Industrial Zone', fee: 30 },
    ] as DeliveryArea[],
    /** Free delivery when the subtotal reaches this amount (null = off) */
    freeDeliveryOver: null as number | null,
  },

  payments: {
    cash: { enabled: true },
    /** Card / wallet via Paymob. Works only in "api" mode once the server has Paymob keys. */
    online: { enabled: true, provider: 'paymob' as const },
  },

  launch: {
    /**
     * true while menu prices in menu.ts are placeholders.
     * Shows a small "sample prices" notice across the site. Set to false once real prices are in.
     */
    samplePrices: true,
  },

  seo: {
    title: 'Pizza Hub | Fresh Pizza in Obour',
    description:
      'Pizza Hub — fresh Egyptian-style pizza, takeaway and delivery in Obour City. Order your favorite pizza online.',
    ogImage: '/og-image.jpg',
  },
};

export type Site = typeof site;
