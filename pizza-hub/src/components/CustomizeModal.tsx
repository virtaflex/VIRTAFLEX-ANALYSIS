import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { productById, productOptionGroups, productSizes, sizes, type OptionGroup, type Product, type SizeId } from '../config/menu.ts';
import { site } from '../config/site.ts';
import { defaultSelection, optionAvailable, priceFor, unitPrice, type Selection } from '../lib/pricing.ts';
import { formatMoney } from '../lib/format.ts';
import { useDialog } from '../lib/useDialog.ts';
import { useCart } from '../state/cart.tsx';
import { useUI } from '../state/ui.tsx';
import { Img } from './Img.tsx';
import { QuantityStepper } from './QuantityStepper.tsx';
import { SamplePricesNotice } from './Notices.tsx';
import './CustomizeModal.css';

/** Mounted by <App/> whenever ui.customizer is set. */
export function CustomizeModal() {
  const { customizer, closeCustomizer } = useUI();
  const product = customizer ? productById.get(customizer.productId) : undefined;
  if (!customizer || !product) return null;
  return <Customizer key={`${customizer.productId}:${customizer.lineId ?? 'new'}`} product={product} lineId={customizer.lineId} onClose={closeCustomizer} />;
}

function Customizer({ product, lineId, onClose }: { product: Product; lineId?: string; onClose: () => void }) {
  const cart = useCart();
  const { showToast, openCart } = useUI();
  const editing = lineId ? cart.lines.find((l) => l.lineId === lineId) : undefined;

  const [selection, setSelection] = useState<Selection>(() => editing?.selection ?? defaultSelection(product));
  const [quantity, setQuantity] = useState(editing?.quantity ?? 1);
  const [note, setNote] = useState(editing?.note ?? '');
  const ref = useDialog<HTMLDivElement>(true, onClose);

  const sizeIds = productSizes(product);
  const groups = productOptionGroups(product);
  const unit = useMemo(() => unitPrice(product, selection), [product, selection]);
  const total = unit * quantity;
  const canAdd = unit > 0;

  const setSize = (sizeId: SizeId) =>
    setSelection((s) => {
      // drop options that don't exist for the new size
      const options: Selection['options'] = {};
      for (const g of groups) {
        const picked = s.options[g.id];
        if (!picked) continue;
        const kept = Object.fromEntries(Object.entries(picked).filter(([id]) => {
          const o = g.options.find((x) => x.id === id);
          return o && optionAvailable(o, sizeId);
        }));
        if (Object.keys(kept).length) options[g.id] = kept;
      }
      return { sizeId, options };
    });

  const setOption = (group: OptionGroup, optionId: string, qty: number) =>
    setSelection((s) => {
      const current = { ...(s.options[group.id] ?? {}) };
      if (group.type === 'single') {
        return { ...s, options: { ...s.options, [group.id]: { [optionId]: 1 } } };
      }
      if (qty <= 0) delete current[optionId];
      else current[optionId] = qty;
      const options = { ...s.options, [group.id]: current };
      if (!Object.keys(current).length) delete options[group.id];
      return { ...s, options };
    });

  const submit = () => {
    if (!canAdd) return;
    const item = { productId: product.id, selection, quantity, note: note.trim() || undefined };
    if (editing) {
      cart.update(editing.lineId, item);
      showToast(`${product.name} updated`);
    } else {
      cart.add(item);
      showToast(`${product.name} added to cart`);
    }
    onClose();
    if (editing) openCart();
  };

  return (
    <div className="cz-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="cz" role="dialog" aria-modal="true" aria-labelledby="cz-title">
        <button type="button" className="cz-close icon-btn" onClick={onClose} aria-label="Close">
          <X size={22} />
        </button>

        <div className="cz-media">
          <Img src={product.image} alt={product.name} sizes="(max-width: 860px) 100vw, 440px" priority />
        </div>

        <div className="cz-panel">
          <div className="cz-scroll">
            <header className="cz-head">
              <p className="eyebrow">{editing ? 'Edit your pizza' : 'Make it yours'}</p>
              <h2 id="cz-title" className="cz-title">
                {product.name}
              </h2>
              <p className="cz-desc">{product.description}</p>
              <SamplePricesNotice />
            </header>

            {sizeIds.length > 1 && (
              <fieldset className="cz-group">
                <legend className="cz-legend">
                  Choose your size <span className="cz-req">Required</span>
                </legend>
                <div className="cz-sizes">
                  {sizeIds.map((s) => (
                    <label key={s} className={`cz-size${selection.sizeId === s ? ' is-on' : ''}`}>
                      <input type="radio" name="size" value={s} checked={selection.sizeId === s} onChange={() => setSize(s)} data-autofocus={selection.sizeId === s ? '' : undefined} />
                      <span className="cz-size-name">{sizes[s].label}</span>
                      {sizes[s].note && <span className="cz-size-note">{sizes[s].note}</span>}
                      <span className="cz-size-price">{formatMoney(product.prices[s] ?? 0)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {groups.map((group) => (
              <OptionGroupField key={group.id} group={group} selection={selection} onChange={setOption} />
            ))}

            <div className="cz-group">
              <label className="cz-legend" htmlFor="cz-note">
                Special instructions <span className="cz-opt">Optional</span>
              </label>
              <textarea
                id="cz-note"
                className="textarea"
                rows={2}
                maxLength={200}
                placeholder="e.g. well done, cut into squares, no onions"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <footer className="cz-foot">
            <QuantityStepper value={quantity} onChange={setQuantity} max={site.ordering.maxItemQuantity} label="quantity" />
            <button type="button" className="btn btn-primary btn-lg cz-add" onClick={submit} disabled={!canAdd}>
              <span>{!canAdd ? 'Choose an option' : editing ? 'Update item' : 'Add to cart'}</span>
              {canAdd && (
                <span className="cz-total" key={total}>
                  {formatMoney(total)}
                </span>
              )}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

function OptionGroupField({
  group,
  selection,
  onChange,
}: {
  group: OptionGroup;
  selection: Selection;
  onChange: (g: OptionGroup, optionId: string, qty: number) => void;
}) {
  const picked = selection.options[group.id] ?? {};
  const options = group.options.filter((o) => optionAvailable(o, selection.sizeId));
  const count = Object.keys(picked).length;
  const priceLabel = (p: number) => (p > 0 ? `+${formatMoney(p)}` : 'Included');

  // A multi group with one option (e.g. Extra cheese) renders as a single toggle.
  if (group.type === 'multi' && options.length === 1) {
    const o = options[0];
    const on = (picked[o.id] ?? 0) > 0;
    return (
      <div className="cz-group">
        <label className={`cz-toggle${on ? ' is-on' : ''}`}>
          <input type="checkbox" checked={on} onChange={() => onChange(group, o.id, on ? 0 : 1)} />
          <span className="cz-toggle-text">
            <span className="cz-legend cz-legend--inline">{group.title}</span>
            {group.subtitle && <span className="cz-sub">{group.subtitle}</span>}
          </span>
          <span className="cz-toggle-price">{priceLabel(priceFor(o.price, selection.sizeId))}</span>
          <span className="cz-switch" aria-hidden="true" />
        </label>
      </div>
    );
  }

  return (
    <fieldset className="cz-group">
      <legend className="cz-legend">
        {group.title}
        {group.required ? <span className="cz-req">Required</span> : <span className="cz-opt">{count ? `${count} selected` : 'Optional'}</span>}
      </legend>
      {group.subtitle && <p className="cz-sub">{group.subtitle}</p>}

      {group.type === 'single' && (
        <div className="cz-choices">
          {options.map((o) => {
            const on = (picked[o.id] ?? 0) > 0;
            return (
              <label key={o.id} className={`cz-choice${on ? ' is-on' : ''}`}>
                <input type="radio" name={group.id} checked={on} onChange={() => onChange(group, o.id, 1)} />
                <span className="cz-dot" aria-hidden="true" />
                <span className="cz-choice-name">{o.name}</span>
                <span className="cz-choice-price">{priceLabel(priceFor(o.price, selection.sizeId))}</span>
              </label>
            );
          })}
        </div>
      )}

      {group.type === 'multi' && (
        <div className="cz-chips">
          {options.map((o) => {
            const on = (picked[o.id] ?? 0) > 0;
            const full = !on && !!group.maxSelections && count >= group.maxSelections;
            return (
              <label key={o.id} className={`cz-chip${on ? ' is-on' : ''}${full ? ' is-disabled' : ''}`}>
                <input type="checkbox" checked={on} disabled={full} onChange={() => onChange(group, o.id, on ? 0 : 1)} />
                <span className="cz-check" aria-hidden="true">
                  {on && <Check size={13} strokeWidth={3.5} />}
                </span>
                <span className="cz-chip-text">
                  <span className="cz-chip-name">{o.name}</span>
                  <span className="cz-chip-price">+{formatMoney(priceFor(o.price, selection.sizeId))}</span>
                </span>
              </label>
            );
          })}
        </div>
      )}

      {group.type === 'quantity' && (
        <ul className="cz-qty-list">
          {options.map((o) => {
            const qty = picked[o.id] ?? 0;
            return (
              <li key={o.id} className={`cz-qty${qty ? ' is-on' : ''}`}>
                <span className="cz-qty-name">{o.name}</span>
                <span className="cz-qty-price">{formatMoney(priceFor(o.price, selection.sizeId))}</span>
                <QuantityStepper size="sm" min={0} max={o.maxQty ?? 10} value={qty} onChange={(n) => onChange(group, o.id, n)} label={o.name} />
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
