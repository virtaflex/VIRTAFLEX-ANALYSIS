import { site } from '../config/site.ts';
import { formatMoney } from '../lib/format.ts';
import type { OrderType, Totals } from '../lib/pricing.ts';

/** Subtotal → Delivery fee → Total */
export function CartSummary({ totals, orderType, areaChosen }: { totals: Totals; orderType: OrderType; areaChosen: boolean }) {
  const free = site.delivery.freeDeliveryOver;
  return (
    <dl className="summary">
      <div>
        <dt>Subtotal</dt>
        <dd>{formatMoney(totals.subtotal)}</dd>
      </div>
      <div>
        <dt>Delivery fee</dt>
        <dd>
          {orderType === 'pickup'
            ? 'Free — pickup'
            : !areaChosen
              ? 'Choose your area'
              : totals.deliveryFee === 0
                ? 'Free'
                : formatMoney(totals.deliveryFee)}
        </dd>
      </div>
      {orderType === 'delivery' && free != null && totals.subtotal < free && (
        <p className="summary-hint">Add {formatMoney(free - totals.subtotal)} more for free delivery</p>
      )}
      <div className="summary-total">
        <dt>Total</dt>
        <dd>{formatMoney(totals.total)}</dd>
      </div>
    </dl>
  );
}
