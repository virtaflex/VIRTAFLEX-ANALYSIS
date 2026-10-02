import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, Menu as MenuIcon, ShoppingBag, X } from 'lucide-react';
import { Logo } from './Logo.tsx';
import { useCart } from '../state/cart.tsx';
import { useUI } from '../state/ui.tsx';
import { site } from '../config/site.ts';
import { InstagramIcon, FacebookIcon, TikTokIcon } from './BrandIcons.tsx';
import { lockScroll, unlockScroll } from '../lib/scrollLock.ts';
import './Header.css';

export const navItems = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function Header() {
  const { pathname } = useLocation();
  const { totals } = useCart();
  const { openCart } = useUI();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const overHero = pathname === '/';

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    lockScroll();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      unlockScroll();
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const solid = scrolled || !overHero || menuOpen;
  const count = totals.itemCount;
  const socials = [
    { href: site.links.instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: site.links.facebook, label: 'Facebook', Icon: FacebookIcon },
    { href: site.links.tiktok, label: 'TikTok', Icon: TikTokIcon },
  ].filter((s) => s.href);

  return (
    <header className={`site-header${solid ? ' is-solid' : ''}${scrolled ? ' is-compact' : ''}`}>
      <div className="container header-inner">
        <Link to="/" className="header-logo" aria-label={`${site.name} — home`}>
          <Logo height={56} />
        </Link>

        <nav className="header-nav" aria-label="Main">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className="nav-link">
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <button type="button" className="icon-btn cart-btn" onClick={openCart} aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}>
            <ShoppingBag size={22} strokeWidth={2} />
            {count > 0 && (
              <span className="cart-count" key={count}>
                {count}
              </span>
            )}
          </button>
          <Link to="/menu" className="btn btn-primary btn-sm header-order">
            <span className="hide-sm">Order Now</span>
            <span className="show-sm">Order</span>
            <ArrowRight size={16} className="arrow" />
          </Link>
          <button
            type="button"
            className="icon-btn menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" className={`mobile-menu${menuOpen ? ' is-open' : ''}`} hidden={!menuOpen}>
        <nav aria-label="Mobile">
          {navItems.map((item, i) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className="mobile-link" style={{ transitionDelay: `${60 + i * 50}ms` }}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mobile-menu-foot">
          <Link to="/menu" className="btn btn-primary btn-lg btn-block">
            Order Now <ArrowRight size={18} className="arrow" />
          </Link>
          {socials.length > 0 && (
            <div className="mobile-socials">
              {socials.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label={label}>
                  <Icon size={22} />
                </a>
              ))}
            </div>
          )}
          <p className="mobile-menu-loc">{site.address.display}</p>
        </div>
      </div>
    </header>
  );
}
