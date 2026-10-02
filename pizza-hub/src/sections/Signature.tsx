import { ArrowRight, Droplets, Layers, Sparkles } from 'lucide-react';
import { Img } from '../components/Img.tsx';
import { Reveal } from '../components/Reveal.tsx';
import { useUI } from '../state/ui.tsx';
import { productById } from '../config/menu.ts';

const BUILD_PRODUCT = 'build-your-own';

export function Signature() {
  const { openCustomizer } = useUI();
  const canBuild = productById.has(BUILD_PRODUCT);
  return (
    <section className="section section--red signature" aria-labelledby="signature-title">
      <div className="container signature-grid">
        <Reveal variant="img" className="signature-media">
          <Img src="photos/cheese-pull-steam" alt="Close-up of a loaded pizza slice with long strings of melted mozzarella" sizes="(max-width: 900px) 92vw, 560px" />
        </Reveal>
        <Reveal className="signature-copy">
          <p className="eyebrow">More than just pizza</p>
          <h2 id="signature-title" className="display">
            Your favorite pizza, <span className="text-gold">your way.</span>
          </h2>
          <p className="lead">Choose your favorite toppings, add extra cheese, pick your preferred size and make every order exactly how you like it.</p>
          <ul className="signature-points">
            <li>
              <Sparkles size={26} strokeWidth={1.6} /> Extra Cheese
            </li>
            <li>
              <Layers size={26} strokeWidth={1.6} /> Extra Toppings
            </li>
            <li>
              <Droplets size={26} strokeWidth={1.6} /> Signature Sauces
            </li>
          </ul>
          {canBuild && (
            <button type="button" className="btn btn-gold btn-lg" onClick={() => openCustomizer(BUILD_PRODUCT)}>
              Build your pizza <ArrowRight size={18} className="arrow" />
            </button>
          )}
        </Reveal>
      </div>
    </section>
  );
}
