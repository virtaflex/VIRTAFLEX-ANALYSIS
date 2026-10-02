/**
 * Browser-only runtime settings (build-time env vars). Kept separate from
 * site.ts so the server can import site.ts without Vite.
 */
import { site, type OrderMode } from './site.ts';

const envMode = import.meta.env.VITE_ORDER_MODE as OrderMode | undefined;

export const orderMode: OrderMode = envMode && ['api', 'whatsapp', 'demo'].includes(envMode) ? envMode : site.ordering.mode;

/** Base URL of the order server API. Same origin by default. */
export const apiBase: string = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api';

/** Online payment needs the order server (it holds the Paymob keys). */
export const onlinePaymentAvailable = site.payments.online.enabled && orderMode === 'api';

export const whatsappAvailable = Boolean(site.contact.whatsapp);
