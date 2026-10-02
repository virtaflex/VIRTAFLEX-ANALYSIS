/**
 * ─────────────────────────────────────────────────────────────
 *  PIZZA HUB — PROMOTIONS
 *  Add, edit or switch off offers here. A promotion is shown when:
 *    active === true  AND  today is between startDate and endDate (if set).
 *  Leave `price` as null until the offer price is confirmed — the card
 *  then shows the offer without a price.
 * ─────────────────────────────────────────────────────────────
 */

export interface Promotion {
  id: string;
  title: string;
  description: string;
  /** EGP. null = not announced yet */
  price: number | null;
  /** Optional "was" price to show a saving */
  compareAtPrice?: number | null;
  /** Image key from config/images.ts or a direct URL */
  image: string;
  /** ISO dates "YYYY-MM-DD" (inclusive). Leave empty for no limit. */
  startDate?: string;
  endDate?: string;
  cta: { label: string; href: string };
  badge?: string;
  active: boolean;
}

export const promotions: Promotion[] = [
  {
    id: 'first-bite',
    title: 'First Bite',
    description: 'Medium pizza + side + sauce.',
    price: null,
    image: 'photos/packaging',
    cta: { label: 'Order now', href: '/menu' },
    badge: 'Combo',
    active: true,
  },
  {
    id: 'double-the-flavor',
    title: 'Double the Flavor',
    description: '2 medium pizzas + drinks + sauces.',
    price: null,
    image: 'photos/pizza-and-box',
    cta: { label: 'Order now', href: '/menu' },
    badge: 'For sharing',
    active: true,
  },
];

function toDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

export function activePromotions(now: Date = new Date()): Promotion[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return promotions.filter((p) => {
    if (!p.active) return false;
    if (p.startDate && today < toDay(p.startDate)) return false;
    if (p.endDate && today > toDay(p.endDate)) return false;
    return true;
  });
}
