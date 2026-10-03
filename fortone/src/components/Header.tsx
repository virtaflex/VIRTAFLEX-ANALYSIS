import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Wordmark } from './Wordmark.tsx';
import { gsap, lockScroll, reducedMotion } from '../lib/motion.ts';
import { site } from '../config/site.ts';

export const nav = [
  { to: '/', label: 'Home' },
  { to: '/flavours', label: 'Flavours' },
  { to: '/story', label: 'Our Story' },
  { to: '/visit', label: 'Visit' },
  { to: '/contact', label: 'Contact' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  // glass background after the hero; slides away while scrolling down, returns on scroll up
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > 300 && y > last + 2);
      if (y < last - 2) setHidden(false);
      last = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    lockScroll(open);
    const el = menuRef.current;
    if (!el) return;
    if (reducedMotion()) {
      gsap.set(el, { autoAlpha: open ? 1 : 0 });
      return;
    }
    if (open) {
      gsap.timeline()
        .set(el, { autoAlpha: 1 })
        .fromTo(el, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: 0.9, ease: 'expo.inOut' })
        .fromTo(el.querySelectorAll('.menu__link span'), { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, '-=0.45')
        .fromTo(el.querySelectorAll('.menu__foot'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, '-=0.6');
    } else {
      gsap.to(el, { clipPath: 'circle(0% at 100% 0%)', duration: 0.6, ease: 'expo.inOut', onComplete: () => void gsap.set(el, { autoAlpha: 0 }) });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <header className={`header${scrolled ? ' is-scrolled' : ''}${hidden && !open ? ' is-hidden' : ''}${open ? ' is-open' : ''}`}>
        <div className="header__inner container">
          <Link to="/" className="header__logo" aria-label={`${site.fullName} — home`}>
            <Wordmark />
          </Link>
          <nav className="header__nav" aria-label="Main">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to} end className="header__link">
                <span>{n.label}</span>
              </NavLink>
            ))}
          </nav>
          <Link to="/visit" className="header__cta" data-cursor="hide">
            Find a store
          </Link>
          <button className="burger" aria-expanded={open} aria-controls="menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
            <span />
            <span />
          </button>
        </div>
      </header>
      <div id="menu" className="menu" ref={menuRef} aria-hidden={!open} {...(!open && { inert: true })}>
        <nav className="menu__nav container" aria-label="Mobile">
          {nav.map((n, i) => (
            <NavLink key={n.to} to={n.to} end className="menu__link">
              <span>
                <small>0{i + 1}</small>
                {n.label}
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="menu__foot container">
          <p>{site.tagline}</p>
          <a href={site.locations[0].mapsUrl} target="_blank" rel="noreferrer">
            Directions ↗
          </a>
        </div>
      </div>
    </>
  );
}
