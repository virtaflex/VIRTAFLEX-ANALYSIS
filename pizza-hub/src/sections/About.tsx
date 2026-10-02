import { Bike, ChefHat, Clock, HandPlatter, ShoppingBag, Wheat } from 'lucide-react';
import { Img } from '../components/Img.tsx';
import { Reveal } from '../components/Reveal.tsx';

const points = [
  { Icon: Wheat, label: 'Fresh dough' },
  { Icon: ChefHat, label: 'Quality ingredients' },
  { Icon: HandPlatter, label: 'Generous toppings' },
  { Icon: Clock, label: 'Fast preparation' },
  { Icon: ShoppingBag, label: 'Convenient ordering' },
  { Icon: Bike, label: 'Takeaway & delivery' },
];

export function About() {
  return (
    <section className="section section--cream about" id="about" aria-labelledby="about-title">
      <div className="container about-grid">
        <Reveal className="about-copy">
          <p className="eyebrow">Our story</p>
          <h2 id="about-title" className="display">
            Welcome to <span className="text-red">Pizza Hub</span>
          </h2>
          <p className="lead">Pizza Hub is an Egyptian-style pizza takeaway brand created for people who want great pizza without the wait.</p>
          <p className="about-text">
            We keep it simple: dough made fresh, good ingredients, toppings you can actually see — and a kitchen built around getting your order out hot and on time. Pick it up in Obour or have it delivered to your door.
          </p>
          <ul className="about-points">
            {points.map(({ Icon, label }) => (
              <li key={label}>
                <span>
                  <Icon size={20} strokeWidth={1.8} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </Reveal>
        <div className="about-media">
          <Reveal variant="img" className="about-img-main">
            <Img src="photos/box-velvet" alt="Pizza Hub branded pizza box with the Good Pizza. Fast. tagline" sizes="(max-width: 900px) 92vw, 560px" />
          </Reveal>
          <Reveal variant="img" className="about-img-float" delay={150}>
            <Img src="photos/packaging" alt="Pizza Hub takeaway packaging with a drink and sauce cups" sizes="240px" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
