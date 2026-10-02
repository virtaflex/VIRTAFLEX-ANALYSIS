import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { availableProducts, categories } from '../config/menu.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { Reveal } from '../components/Reveal.tsx';
import { SamplePricesNotice } from '../components/Notices.tsx';

export function MenuPreview() {
  const [active, setActive] = useState<string>('featured');
  const list = useMemo(() => {
    const all = availableProducts();
    return (active === 'featured' ? all.filter((p) => p.featured) : all.filter((p) => p.categoryId === active)).slice(0, 6);
  }, [active]);

  return (
    <section className="section section--cream menu-preview" id="menu" aria-labelledby="menu-preview-title">
      <div className="container">
        <Reveal className="section-head">
          <div>
            <p className="eyebrow">Our menu</p>
            <h2 id="menu-preview-title" className="display">
              Pizzas for <br className="hide-mobile" />
              every craving
            </h2>
            <p className="lead">From classic favorites to loaded specialties, choose your favorite Pizza Hub creation and make it your own.</p>
          </div>
          <Link to="/menu" className="btn btn-outline">
            View full menu <ArrowRight size={16} className="arrow" />
          </Link>
        </Reveal>

        <div className="chips" role="tablist" aria-label="Menu categories">
          {[{ id: 'featured', name: 'Most loved' }, ...categories].map((c) => (
            <button key={c.id} type="button" role="tab" aria-selected={active === c.id} className={`chip${active === c.id ? ' is-on' : ''}`} onClick={() => setActive(c.id)}>
              {c.name}
            </button>
          ))}
        </div>

        <div className="product-grid" key={active}>
          {list.map((p, i) => (
            <div key={p.id} className="grid-in" style={{ animationDelay: `${i * 60}ms` }}>
              <ProductCard product={p} variant="light" />
            </div>
          ))}
        </div>
        <SamplePricesNotice className="menu-preview-note" />
      </div>
    </section>
  );
}
