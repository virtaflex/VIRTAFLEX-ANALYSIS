import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { activePromotions } from '../config/promotions.ts';
import { formatMoney } from '../lib/format.ts';
import { Img } from '../components/Img.tsx';
import { Reveal } from '../components/Reveal.tsx';

export function Promotions() {
  const promos = activePromotions();
  if (!promos.length) return null;
  return (
    <section className="section section--dark promos" aria-labelledby="promos-title">
      <div className="container">
        <Reveal className="section-head">
          <div>
            <p className="eyebrow">Deals &amp; combos</p>
            <h2 id="promos-title" className="display">
              More pizza. <span className="text-gold">Better deals.</span>
            </h2>
          </div>
        </Reveal>
        <div className="promo-grid">
          {promos.map((p, i) => {
            const external = /^https?:/.test(p.cta.href);
            const cta = (
              <>
                {p.cta.label} <ArrowRight size={16} className="arrow" />
              </>
            );
            return (
              <Reveal key={p.id} as="article" className="promo" delay={i * 100}>
                <div className="promo-media">
                  <Img src={p.image} alt={`${p.title} — ${p.description}`} sizes="(max-width: 900px) 92vw, 300px" />
                </div>
                <div className="promo-body">
                  {p.badge && <span className="badge">{p.badge}</span>}
                  <h3 className="promo-title">{p.title}</h3>
                  <p className="promo-desc">{p.description}</p>
                  <div className="promo-foot">
                    {p.price != null && (
                      <p className="promo-price">
                        {p.compareAtPrice != null && <s>{formatMoney(p.compareAtPrice)}</s>}
                        {formatMoney(p.price)}
                      </p>
                    )}
                    {external ? (
                      <a href={p.cta.href} className="btn btn-gold btn-sm" target="_blank" rel="noopener noreferrer">
                        {cta}
                      </a>
                    ) : (
                      <Link to={p.cta.href} className="btn btn-gold btn-sm">
                        {cta}
                      </Link>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
