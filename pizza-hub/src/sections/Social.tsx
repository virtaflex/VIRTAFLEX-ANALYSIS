import { site } from '../config/site.ts';
import { Img } from '../components/Img.tsx';
import { Reveal } from '../components/Reveal.tsx';
import { ExternalCta } from '../components/ExternalCta.tsx';
import { FacebookIcon, InstagramIcon, TikTokIcon } from '../components/BrandIcons.tsx';

const tiles = [
  { src: 'photos/cheese-pull', alt: 'Cheese pull from a fresh pepperoni pizza' },
  { src: 'photos/box', alt: 'Pizza Hub pizza box' },
  { src: 'photos/toppings', alt: 'Bowls of fresh pizza toppings' },
  { src: 'photos/pizza-and-box', alt: 'Whole pepperoni pizza next to a Pizza Hub box' },
];

export function Social() {
  const socials = [
    { href: site.links.instagram, label: 'Instagram', Icon: InstagramIcon },
    { href: site.links.facebook, label: 'Facebook', Icon: FacebookIcon },
    { href: site.links.tiktok, label: 'TikTok', Icon: TikTokIcon },
  ];
  return (
    <section className="section social" aria-labelledby="social-title">
      <div className="container social-grid">
        <Reveal className="social-copy">
          <p className="eyebrow">Stay hungry</p>
          <h2 id="social-title" className="display">
            Follow the <span className="text-gold">craving</span>
          </h2>
          <p className="lead">Follow Pizza Hub for new pizzas, special offers and fresh-from-the-oven moments.</p>
          <div className="social-btns">
            {socials.map(({ href, label, Icon }) => (
              <ExternalCta key={label} href={href} className="btn btn-ghost social-btn" ariaLabel={`Pizza Hub on ${label} (opens in a new tab)`}>
                <Icon size={20} /> {label}
              </ExternalCta>
            ))}
          </div>
        </Reveal>
        <div className="social-tiles">
          {tiles.map((t, i) => (
            <Reveal key={t.src} variant="img" className="social-tile" delay={i * 90}>
              <Img src={t.src} alt={t.alt} sizes="(max-width: 900px) 45vw, 260px" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
