import { Bike, Leaf, Pizza, Smartphone } from 'lucide-react';
import { Reveal } from '../components/Reveal.tsx';

const items = [
  { Icon: Leaf, title: 'Fresh Ingredients', text: 'Fresh ingredients prepared daily.' },
  { Icon: Pizza, title: 'Authentic Taste', text: 'Classic Egyptian-style pizza made fresh.' },
  { Icon: Bike, title: 'Fast Delivery', text: 'Hot pizza delivered to your door.' },
  { Icon: Smartphone, title: 'Easy Ordering', text: 'Simple ordering through the website or Talabat.' },
];

export function Benefits() {
  return (
    <section className="benefits" aria-label="Why Pizza Hub">
      <div className="container benefits-grid">
        {items.map(({ Icon, title, text }, i) => (
          <Reveal key={title} className="benefit" delay={i * 80}>
            <span className="benefit-icon">
              <Icon size={30} strokeWidth={1.6} />
            </span>
            <div>
              <h2 className="benefit-title">{title}</h2>
              <p className="benefit-text">{text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
