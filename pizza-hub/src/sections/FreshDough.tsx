import { ChefHat, Flame, Wheat } from 'lucide-react';
import { Img } from '../components/Img.tsx';
import { Reveal } from '../components/Reveal.tsx';

export function FreshDough() {
  return (
    <section className="section section--dark dough" aria-labelledby="dough-title">
      <div className="container dough-grid">
        <Reveal className="dough-copy">
          <p className="eyebrow">Made in-house</p>
          <h2 id="dough-title" className="display">
            Fresh dough. <br />
            <span className="text-gold">Better pizza.</span>
          </h2>
          <p className="lead">Our pizza starts with fresh dough, carefully prepared and baked to order.</p>
          <ul className="dough-points">
            <li>
              <Wheat size={28} strokeWidth={1.5} />
              <span>Freshly Prepared</span>
            </li>
            <li>
              <ChefHat size={28} strokeWidth={1.5} />
              <span>Quality Ingredients</span>
            </li>
            <li>
              <Flame size={28} strokeWidth={1.5} />
              <span>Baked To Order</span>
            </li>
          </ul>
        </Reveal>
        <Reveal variant="img" className="dough-media">
          <Img src="photos/dough" alt="Pizza Hub chef dusting fresh pizza dough with flour" sizes="(max-width: 900px) 92vw, 600px" />
        </Reveal>
      </div>
    </section>
  );
}
