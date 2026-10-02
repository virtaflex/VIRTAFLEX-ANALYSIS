import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { site } from '../config/site.ts';
import { Img } from '../components/Img.tsx';
import { Reveal } from '../components/Reveal.tsx';
import { ExternalCta } from '../components/ExternalCta.tsx';

export function Talabat() {
  return (
    <section className="section talabat" aria-labelledby="talabat-title">
      <div className="container talabat-card">
        <div className="talabat-copy">
          <Reveal>
            <p className="eyebrow">Easy ordering</p>
            <h2 id="talabat-title" className="display">
              Craving pizza? <br />
              <span className="text-gold">Order now.</span>
            </h2>
            <p className="lead">Get Pizza Hub delivered straight to your door through Talabat — or order directly on our website.</p>
            <div className="talabat-ctas">
              <ExternalCta href={site.links.talabat} className="btn btn-primary btn-lg talabat-btn" ariaLabel="Order Pizza Hub on Talabat (opens in a new tab)">
                Order on <span className="talabat-word">talabat</span>
                {site.links.talabat && <ExternalLink size={16} />}
              </ExternalCta>
              <Link to="/menu" className="btn btn-ghost btn-lg">
                Order on website <ArrowRight size={18} className="arrow" />
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="talabat-media" aria-hidden="true">
          <Reveal variant="img" className="talabat-phone">
            <Img src="photos/phone-order" alt="" sizes="(max-width: 900px) 60vw, 320px" />
          </Reveal>
          <Reveal variant="img" className="talabat-rider" delay={120}>
            <Img src="photos/delivery" alt="" sizes="(max-width: 900px) 50vw, 280px" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
