import { Plus, SlidersHorizontal } from 'lucide-react';
import { isCustomizable, productSizes, sizes, type Product, type Tag } from '../config/menu.ts';
import { defaultSelection } from '../lib/pricing.ts';
import { formatMoney } from '../lib/format.ts';
import { useCart } from '../state/cart.tsx';
import { useUI } from '../state/ui.tsx';
import { Img } from './Img.tsx';
import './ProductCard.css';

const tagLabels: Record<Tag, string> = {
  bestseller: 'Bestseller',
  new: 'New',
  spicy: 'Spicy',
  veg: 'Veggie',
  signature: 'Signature',
};

export function startingPrice(product: Product): number {
  return Math.min(...productSizes(product).map((s) => product.prices[s] ?? Infinity));
}

interface Props {
  product: Product;
  variant?: 'dark' | 'light';
  /** Show size chips (menu page) */
  showSizes?: boolean;
}

export function ProductCard({ product, variant = 'dark', showSizes = false }: Props) {
  const { add } = useCart();
  const { openCustomizer, showToast } = useUI();
  const customizable = isCustomizable(product);
  const sizeIds = productSizes(product);
  const from = startingPrice(product);
  const multiPrice = sizeIds.length > 1;
  // Pizzas (several sizes) and items priced 0 on their own (e.g. dips) open the customizer first.
  const needsChoice = customizable && (multiPrice || from === 0);

  const open = () => openCustomizer(product.id);
  const quickAdd = () => {
    if (needsChoice) return open();
    add({ productId: product.id, selection: defaultSelection(product), quantity: 1 });
    showToast(`${product.name} added to cart`);
  };

  return (
    <article className={`product-card product-card--${variant}`}>
      <button type="button" className="product-media" onClick={open} aria-label={`Customize ${product.name}`}>
        <Img src={product.image} alt={`${product.name} pizza — ${product.description}`} sizes="(max-width: 600px) 92vw, (max-width: 1100px) 46vw, 360px" />
        <span className="product-tags">
          {product.tags?.map((t) => (
            <span key={t} className={`badge ${t === 'spicy' || t === 'signature' ? 'badge--red' : t === 'veg' ? 'badge--dark' : ''}`}>
              {tagLabels[t]}
            </span>
          ))}
        </span>
        {customizable && product.optionGroupIds?.includes('toppings') && (
          <span className="product-custom">
            <SlidersHorizontal size={13} /> Customize
          </span>
        )}
      </button>
      <div className="product-body">
        <h3 className="product-name">
          <button type="button" onClick={open}>
            {product.name}
          </button>
        </h3>
        <p className="product-desc">{product.description}</p>
        {showSizes && multiPrice && (
          <ul className="product-sizes" aria-label="Sizes">
            {sizeIds.map((s) => (
              <li key={s}>
                {sizes[s].label} <strong>{formatMoney(product.prices[s] ?? 0)}</strong>
              </li>
            ))}
          </ul>
        )}
        <div className="product-foot">
          <p className="product-price">
            {from > 0 ? (
              <>
                {multiPrice && <span className="from">From</span>}
                {formatMoney(from)}
              </>
            ) : (
              <span className="from">Pick your favorites</span>
            )}
          </p>
          <button type="button" className="add-btn" onClick={quickAdd} aria-label={`Add ${product.name}`}>
            <Plus size={18} strokeWidth={3} /> Add
          </button>
        </div>
      </div>
    </article>
  );
}
