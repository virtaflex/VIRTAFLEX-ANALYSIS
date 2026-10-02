/**
 * Pricing & selection logic. Pure functions, shared by the website and the
 * order server so totals are always calculated the same way.
 */
import {
  productById,
  productOptionGroups,
  productSizes,
  sizes,
  type Option,
  type OptionGroup,
  type Price,
  type Product,
  type SizeId,
} from '../config/menu.ts';
import { site } from '../config/site.ts';

/** groupId → optionId → quantity */
export type OptionSelection = Record<string, Record<string, number>>;

export interface Selection {
  sizeId: SizeId;
  options: OptionSelection;
}

export interface CartItemInput {
  productId: string;
  selection: Selection;
  quantity: number;
  note?: string;
}

export type OrderType = 'delivery' | 'pickup';

export function priceFor(price: Price, sizeId: SizeId): number {
  if (typeof price === 'number') return price;
  return price[sizeId] ?? 0;
}

export function defaultSelection(product: Product): Selection {
  const sizeIds = productSizes(product);
  const sizeId = sizeIds.includes('medium') ? 'medium' : sizeIds[0];
  const options: OptionSelection = {};
  for (const group of productOptionGroups(product)) {
    if (group.type === 'single') {
      const def = group.defaultOptionId ?? group.options[0]?.id;
      if (def) options[group.id] = { [def]: 1 };
    }
  }
  return { sizeId, options };
}

/** Options offered for a size (size-specific prices hide options missing for that size). */
export function optionAvailable(option: Option, sizeId: SizeId): boolean {
  return typeof option.price === 'number' || typeof option.price[sizeId] === 'number';
}

/**
 * Validates a selection against the product configuration and returns a clean copy.
 * Throws on anything that can't be ordered. Used by the server on every order.
 */
export function normalizeSelection(product: Product, input: Selection): Selection {
  const sizeIds = productSizes(product);
  if (!sizeIds.includes(input?.sizeId)) throw new Error(`Size not available for ${product.name}`);
  const sizeId = input.sizeId;
  const groups = productOptionGroups(product);
  const raw = input.options ?? {};
  const out: OptionSelection = {};

  for (const key of Object.keys(raw)) {
    if (!groups.some((g) => g.id === key)) throw new Error(`Unknown option group "${key}"`);
  }

  for (const group of groups) {
    const picked = raw[group.id] ?? {};
    const clean: Record<string, number> = {};
    for (const [optionId, qtyRaw] of Object.entries(picked)) {
      const qty = Math.floor(Number(qtyRaw));
      if (!Number.isFinite(qty) || qty <= 0) continue;
      const option = group.options.find((o) => o.id === optionId);
      if (!option || !optionAvailable(option, sizeId)) throw new Error(`Option not available: ${optionId}`);
      const max = group.type === 'quantity' ? (option.maxQty ?? 10) : 1;
      if (qty > max) throw new Error(`Too many of ${option.name}`);
      clean[optionId] = qty;
    }
    const count = Object.keys(clean).length;
    if (group.type === 'single') {
      if (count > 1) throw new Error(`Choose one option for ${group.title}`);
      if (count === 0 && group.required) {
        const def = group.defaultOptionId ?? group.options[0]?.id;
        if (def) clean[def] = 1;
      }
    }
    if (group.type === 'multi' && group.maxSelections && count > group.maxSelections) {
      throw new Error(`Up to ${group.maxSelections} choices for ${group.title}`);
    }
    if (Object.keys(clean).length) out[group.id] = clean;
  }

  const normalized = { sizeId, options: out };
  if (unitPrice(product, normalized) <= 0) throw new Error(`Choose at least one option for ${product.name}`);
  return normalized;
}

export function unitPrice(product: Product, selection: Selection): number {
  let total = product.prices[selection.sizeId] ?? 0;
  for (const group of productOptionGroups(product)) {
    const picked = selection.options[group.id];
    if (!picked) continue;
    for (const option of group.options) {
      const qty = picked[option.id] ?? 0;
      if (qty > 0) total += priceFor(option.price, selection.sizeId) * qty;
    }
  }
  return total;
}

export interface SelectionLine {
  group: OptionGroup;
  text: string;
}

/** Human-readable summary, e.g. ["Cheese crust", "Chicken, Mushrooms", "Garlic sauce ×2"] */
export function describeSelection(product: Product, selection: Selection): { size: string | null; lines: SelectionLine[] } {
  const showSize = productSizes(product).length > 1 || selection.sizeId !== 'regular';
  const lines: SelectionLine[] = [];
  for (const group of productOptionGroups(product)) {
    const picked = selection.options[group.id];
    if (!picked) continue;
    const parts = group.options
      .filter((o) => (picked[o.id] ?? 0) > 0)
      .map((o) => (group.type === 'quantity' && picked[o.id] > 1 ? `${o.name} ×${picked[o.id]}` : o.name));
    if (!parts.length) continue;
    // Default single choices that cost nothing (e.g. "Classic" crust) are noise in a summary.
    if (group.type === 'single' && parts.length === 1) {
      const opt = group.options.find((o) => picked[o.id]);
      if (opt && opt.id === group.defaultOptionId) continue;
    }
    lines.push({ group, text: parts.join(', ') });
  }
  return { size: showSize ? sizes[selection.sizeId].label : null, lines };
}

export function selectionKey(productId: string, selection: Selection): string {
  const opts = Object.keys(selection.options)
    .sort()
    .map((g) => `${g}:${Object.entries(selection.options[g]).sort().map(([o, q]) => `${o}*${q}`).join('+')}`)
    .join('|');
  return `${productId}#${selection.sizeId}#${opts}`;
}

export function deliveryFee(orderType: OrderType, areaId: string | undefined, subtotal: number): number {
  if (orderType !== 'delivery') return 0;
  const free = site.delivery.freeDeliveryOver;
  if (free != null && subtotal >= free) return 0;
  const area = site.delivery.areas.find((a) => a.id === areaId);
  return area ? area.fee : 0;
}

export interface PricedLine extends CartItemInput {
  product: Product;
  unitPrice: number;
  lineTotal: number;
}

export interface Totals {
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}

export function priceLines(items: CartItemInput[]): PricedLine[] {
  const out: PricedLine[] = [];
  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product || product.available === false) continue;
    const u = unitPrice(product, item.selection);
    out.push({ ...item, product, unitPrice: u, lineTotal: u * item.quantity });
  }
  return out;
}

export function computeTotals(lines: PricedLine[], orderType: OrderType, areaId?: string): Totals {
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const fee = lines.length ? deliveryFee(orderType, areaId, subtotal) : 0;
  return {
    subtotal,
    deliveryFee: fee,
    total: subtotal + fee,
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
  };
}
