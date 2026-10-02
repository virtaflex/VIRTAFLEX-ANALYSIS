import { site } from '../config/site.ts';

const nf = new Intl.NumberFormat('en-EG', { maximumFractionDigits: 2 });

/** "EGP 180" */
export function formatMoney(amount: number): string {
  return `${site.currency} ${nf.format(amount)}`;
}

export function formatRange([a, b]: [number, number]): string {
  return `${a}–${b} min`;
}

/** "13:00" → "1:00 PM" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
