import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { categories, productById, productsInCategory } from '../config/menu.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { SamplePricesNotice } from '../components/Notices.tsx';
import { useUI } from '../state/ui.tsx';
import { useDocumentMeta } from '../lib/useDocumentMeta.ts';
import './Menu.css';

export default function Menu() {
  useDocumentMeta('Menu', 'Browse the Pizza Hub menu — classic, chicken, meat, specialty and vegetarian pizzas, plus sides and dips. Order online in Obour City.');
  const groups = categories.map((c) => ({ ...c, products: productsInCategory(c.id) })).filter((c) => c.products.length);
  const [active, setActive] = useState(groups[0]?.id);
  const navRef = useRef<HTMLDivElement>(null);
  const [params, setParams] = useSearchParams();
  const { openCustomizer } = useUI();

  // Deep link: /menu?item=chicken-ranch opens the customizer
  useEffect(() => {
    const item = params.get('item');
    if (item && productById.has(item)) {
      openCustomizer(item);
      params.delete('item');
      setParams(params, { replace: true });
    }
  }, [params, setParams, openCustomizer]);

  // Scroll-spy: highlight the category in view
  useEffect(() => {
    const els = groups.map((g) => document.getElementById(`cat-${g.id}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace('cat-', ''));
      },
      { rootMargin: '-140px 0px -55% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Keep the active chip visible in the horizontal bar
  useEffect(() => {
    const chip = navRef.current?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    const bar = navRef.current;
    if (chip && bar) bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' });
  }, [active]);

  const jump = (id: string) => {
    const el = document.getElementById(`cat-${id}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 128;
    window.scrollTo({ top, behavior: 'smooth' });
    setActive(id);
  };

  return (
    <>
      <header className="page-hero menu-hero">
        <div className="container">
          <p className="eyebrow">Fresh. Hot. Fast.</p>
          <h1>Our menu</h1>
          <p className="lead">Tap any pizza to pick your size, crust, toppings and sauces.</p>
          <SamplePricesNotice className="menu-hero-note" />
        </div>
      </header>

      <nav className="cat-nav" aria-label="Menu categories">
        <div className="container">
          <div className="cat-nav-inner" ref={navRef}>
            {groups.map((g) => (
              <button key={g.id} type="button" data-cat={g.id} className={`chip${active === g.id ? ' is-on' : ''}`} aria-current={active === g.id ? 'true' : undefined} onClick={() => jump(g.id)}>
                {g.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="menu-body">
        <div className="container">
          {groups.map((g) => (
            <section key={g.id} id={`cat-${g.id}`} className="menu-cat" aria-labelledby={`cat-title-${g.id}`}>
              <div className="menu-cat-head">
                <h2 id={`cat-title-${g.id}`} className="display-sm">
                  {g.name}
                </h2>
                <p>{g.description}</p>
              </div>
              <div className="product-grid">
                {g.products.map((p) => (
                  <ProductCard key={p.id} product={p} showSizes />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
