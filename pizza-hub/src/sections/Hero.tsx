import { Link } from 'react-router-dom';
import { ArrowRight, Bike, MapPin, Timer } from 'lucide-react';
import { Img } from '../components/Img.tsx';
import { site } from '../config/site.ts';
import { formatRange } from '../lib/format.ts';
import './Hero.css';

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-media">
        <Img
          src="photos/hero"
          alt="Fresh Pizza Hub pepperoni pizza with a stretchy cheese pull, in front of a red Pizza Hub box"
          sizes="(max-width: 900px) 100vw, 62vw"
          priority
        />
        <div className="hero-steam" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="container hero-inner">
        <div className="hero-copy">
          <p className="eyebrow hero-anim" style={{ animationDelay: '0.1s' }}>
            Real ingredients. Great taste.
          </p>
          <h1 id="hero-title" className="hero-title hero-anim" style={{ animationDelay: '0.2s' }}>
            Good pizza <span className="hero-fast swoosh">fast.</span>
          </h1>
          <p className="hero-text hero-anim" style={{ animationDelay: '0.35s' }}>
            Fresh dough. Quality ingredients. Authentic flavors. Made fresh and ready for takeaway or delivery in Obour.
          </p>
          <div className="hero-ctas hero-anim" style={{ animationDelay: '0.5s' }}>
            <Link to="/menu" className="btn btn-primary btn-lg">
              Order now <ArrowRight size={18} className="arrow" />
            </Link>
            <Link to="/menu" className="btn btn-ghost btn-lg">
              View menu
            </Link>
          </div>
          <ul className="hero-meta hero-anim" style={{ animationDelay: '0.65s' }}>
            <li>
              <MapPin size={17} /> {site.address.display}
            </li>
            <li>
              <Timer size={17} /> Pickup {formatRange(site.ordering.prepTime.pickup)}
            </li>
            <li>
              <Bike size={17} /> Delivery {formatRange(site.ordering.prepTime.delivery)}
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
