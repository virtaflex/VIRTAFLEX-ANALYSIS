import { Pencil, Trash2 } from 'lucide-react';
import { isCustomizable } from '../config/menu.ts';
import { site } from '../config/site.ts';
import { describeSelection, type PricedLine } from '../lib/pricing.ts';
import { formatMoney } from '../lib/format.ts';
import { useCart } from '../state/cart.tsx';
import { Img } from './Img.tsx';
import { QuantityStepper } from './QuantityStepper.tsx';

export function CartLineItem({ line, onEdit }: { line: PricedLine & { lineId: string }; onEdit?: (lineId: string, productId: string) => void }) {
  const { setQuantity, remove } = useCart();
  const d = describeSelection(line.product, line.selection);
  return (
    <li className="cart-line">
      <div className="cart-line-img">
        <Img src={line.product.image} alt="" sizes="80px" />
      </div>
      <div className="cart-line-main">
        <div className="cart-line-top">
          <h3 className="cart-line-name">
            {line.product.name}
            {d.size && <span className="cart-line-size">{d.size}</span>}
          </h3>
          <p className="cart-line-price">{formatMoney(line.lineTotal)}</p>
        </div>
        {d.lines.length > 0 && (
          <ul className="cart-line-details">
            {d.lines.map((l) => (
              <li key={l.group.id}>{l.group.type === 'single' || l.group.options.length === 1 ? l.text : `+ ${l.text}`}</li>
            ))}
          </ul>
        )}
        {line.note && <p className="cart-line-note">“{line.note}”</p>}
        <div className="cart-line-actions">
          <QuantityStepper size="sm" value={line.quantity} max={site.ordering.maxItemQuantity} onChange={(n) => setQuantity(line.lineId, n)} label={`${line.product.name} quantity`} />
          {onEdit && isCustomizable(line.product) && (
            <button type="button" className="link-btn" onClick={() => onEdit(line.lineId, line.productId)}>
              <Pencil size={14} /> Edit
            </button>
          )}
          <button type="button" className="link-btn link-btn--danger" onClick={() => remove(line.lineId)} aria-label={`Remove ${line.product.name}`}>
            <Trash2 size={14} /> Remove
          </button>
        </div>
      </div>
    </li>
  );
}
