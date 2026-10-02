import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Pizza, X } from 'lucide-react';
import { site } from '../config/site.ts';
import { useCart } from '../state/cart.tsx';
import { useUI } from '../state/ui.tsx';
import { useDialog } from '../lib/useDialog.ts';
import { formatMoney } from '../lib/format.ts';
import { CartLineItem } from './CartLineItem.tsx';
import { CartSummary } from './CartSummary.tsx';
import { OrderTypeToggle } from './OrderTypeToggle.tsx';
import { SamplePricesNotice } from './Notices.tsx';
import './Cart.css';

export function CartDrawer() {
  const { cartOpen, closeCart, openCustomizer } = useUI();
  const cart = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const ref = useDialog<HTMLDivElement>(cartOpen, closeCart);
  if (!cartOpen) return null;

  const empty = cart.priced.length === 0;
  const belowMin = cart.orderType === 'delivery' && cart.totals.subtotal < site.ordering.minimumDeliveryOrder;

  const edit = (lineId: string, productId: string) => {
    closeCart();
    openCustomizer(productId, lineId);
  };
  const continueShopping = () => {
    closeCart();
    if (pathname !== '/menu') navigate('/menu');
  };

  return (
    <div className="drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeCart()}>
      <aside ref={ref} className="drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <header className="drawer-head">
          <h2 id="cart-title">
            Your order {!empty && <span className="drawer-count">{cart.totals.itemCount}</span>}
          </h2>
          <button type="button" className="icon-btn" onClick={closeCart} aria-label="Close cart">
            <X size={22} />
          </button>
        </header>

        {empty ? (
          <div className="drawer-empty">
            <span className="drawer-empty-icon">
              <Pizza size={40} strokeWidth={1.5} />
            </span>
            <h3>Your cart is empty</h3>
            <p>Hot, fresh pizza is a few taps away.</p>
            <button type="button" className="btn btn-primary" onClick={continueShopping} data-autofocus>
              Browse the menu <ArrowRight size={16} className="arrow" />
            </button>
          </div>
        ) : (
          <>
            <div className="drawer-body">
              <ul className="cart-lines">
                {cart.priced.map((l) => (
                  <CartLineItem key={l.lineId} line={l} onEdit={edit} />
                ))}
              </ul>
            </div>

            <footer className="drawer-foot">
              <OrderTypeToggle value={cart.orderType} onChange={cart.setOrderType} />
              {cart.orderType === 'delivery' && (
                <select className="select select--sm" value={cart.areaId} onChange={(e) => cart.setArea(e.target.value)} aria-label="Delivery area">
                  <option value="">Select your delivery area…</option>
                  {site.delivery.areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {formatMoney(a.fee)}
                    </option>
                  ))}
                </select>
              )}
              <CartSummary totals={cart.totals} orderType={cart.orderType} areaChosen={Boolean(cart.areaId)} />
              {belowMin && <p className="field-error">Minimum delivery order is {formatMoney(site.ordering.minimumDeliveryOrder)}.</p>}
              <SamplePricesNotice />
              <Link to="/checkout" className={`btn btn-primary btn-lg btn-block${belowMin ? ' is-disabled' : ''}`} aria-disabled={belowMin} onClick={closeCart}>
                Checkout · {formatMoney(cart.totals.total)} <ArrowRight size={18} className="arrow" />
              </Link>
              <button type="button" className="btn btn-ghost btn-block" onClick={continueShopping}>
                Continue shopping
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
