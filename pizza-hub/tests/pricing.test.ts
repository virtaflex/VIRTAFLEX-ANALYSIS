import { test } from 'node:test';
import assert from 'node:assert/strict';
import { productById } from '../src/config/menu.ts';
import { site } from '../src/config/site.ts';
import { computeTotals, defaultSelection, normalizeSelection, priceLines, unitPrice, describeSelection } from '../src/lib/pricing.ts';
import { normalizeEgyptianMobile, validateOrderRequest } from '../src/lib/order.ts';

const pizza = productById.get('chicken-ranch')!;

test('default selection picks medium + default crust', () => {
  const s = defaultSelection(pizza);
  assert.equal(s.sizeId, 'medium');
  assert.deepEqual(s.options.crust, { classic: 1 });
  assert.equal(unitPrice(pizza, s), pizza.prices.medium);
});

test('size-dependent extras are added to the price', () => {
  const s = { sizeId: 'large' as const, options: { crust: { 'cheese-crust': 1 }, cheese: { 'extra-cheese': 1 }, toppings: { chicken: 1, olives: 1 }, sauces: { garlic: 2 } } };
  const expected = pizza.prices.large! + 50 + 45 + 50 + 20 + 15 * 2;
  assert.equal(unitPrice(pizza, normalizeSelection(pizza, s)), expected);
  const d = describeSelection(pizza, s);
  assert.equal(d.size, 'Large');
  assert.ok(d.lines.some((l) => l.text === 'Garlic sauce ×2'));
});

test('invalid selections are rejected', () => {
  assert.throws(() => normalizeSelection(pizza, { sizeId: 'regular', options: {} }));
  assert.throws(() => normalizeSelection(pizza, { sizeId: 'small', options: { toppings: { gold: 1 } } }));
  assert.throws(() => normalizeSelection(pizza, { sizeId: 'small', options: { sauces: { garlic: 99 } } }));
  assert.throws(() => normalizeSelection(pizza, { sizeId: 'small', options: { crust: { classic: 1, thin: 1 } } }));
  // dips alone cost 0 → must pick at least one sauce
  assert.throws(() => normalizeSelection(productById.get('dips')!, { sizeId: 'regular', options: {} }));
});

test('totals include the delivery fee for the chosen area only', () => {
  const lines = priceLines([{ productId: 'margherita', selection: defaultSelection(productById.get('margherita')!), quantity: 2 }]);
  const area = site.delivery.areas[0];
  const d = computeTotals(lines, 'delivery', area.id);
  assert.equal(d.subtotal, productById.get('margherita')!.prices.medium! * 2);
  assert.equal(d.deliveryFee, area.fee);
  assert.equal(d.total, d.subtotal + area.fee);
  assert.equal(computeTotals(lines, 'pickup', area.id).deliveryFee, 0);
});

test('Egyptian mobile numbers', () => {
  assert.equal(normalizeEgyptianMobile('010 1234 5678'), '01012345678');
  assert.equal(normalizeEgyptianMobile('+20 115 123 4567'), '01151234567');
  assert.equal(normalizeEgyptianMobile('00201212345678'), '01212345678');
  assert.equal(normalizeEgyptianMobile('0131234567'), null);
  assert.equal(normalizeEgyptianMobile('12345'), null);
});

test('server validation ignores any client-sent price', () => {
  const { totals } = validateOrderRequest({
    orderType: 'pickup',
    paymentMethod: 'cash',
    customer: { name: 'Ali', phone: '01012345678' },
    items: [{ productId: 'margherita', selection: { sizeId: 'small', options: {} }, quantity: 1, unitPrice: 1, lineTotal: 1 }],
  });
  assert.equal(totals.total, productById.get('margherita')!.prices.small);
});

test('delivery orders need an area and address', () => {
  assert.throws(
    () => validateOrderRequest({ orderType: 'delivery', paymentMethod: 'cash', customer: { name: 'Ali', phone: '01012345678' }, items: [{ productId: 'margherita', selection: { sizeId: 'small', options: {} }, quantity: 1 }] }),
    /check your details/,
  );
});
