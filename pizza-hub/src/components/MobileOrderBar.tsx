import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../state/cart.tsx';
import { useUI } from '../state/ui.tsx';
import { formatMoney } from '../lib/format.ts';
import './MobileOrderBar.css';

/** Sticky thumb-zone order button on phones. Becomes "View cart" once something is in the cart. */
export function MobileOrderBar() {
  const { pathname } = useLocation();
  const { totals } = useCart();
  const { openCart, cartOpen, customizer } = useUI();
  if (pathname.startsWith('/checkout') || pathname.startsWith('/order') || cartOpen || customizer) return null;

  return (
    <div className="mobile-bar">
      {totals.itemCount > 0 ? (
        <button type="button" className="btn btn-primary btn-lg btn-block mobile-bar-btn" onClick={openCart}>
          <span className="mobile-bar-count">
            <ShoppingBag size={18} /> {totals.itemCount}
          </span>
          <span>View cart</span>
          <span className="mobile-bar-total">{formatMoney(totals.subtotal)}</span>
        </button>
      ) : (
        <Link to="/menu" className="btn btn-primary btn-lg btn-block">
          Order Now <ArrowRight size={18} className="arrow" />
        </Link>
      )}
    </div>
  );
}
