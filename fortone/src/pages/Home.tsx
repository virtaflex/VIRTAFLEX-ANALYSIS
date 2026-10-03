import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Split, ScrubText } from '../components/Text.tsx';
import { Button } from '../components/Button.tsx';
import { Marquee } from '../components/Chrome.tsx';
import { FlavorCard } from '../components/Flavor.tsx';
import { flavors } from '../config/flavors.ts';
import { site } from '../config/site.ts';
import { asset, flavorImg, useDocumentMeta } from '../lib/util.ts';
import { gsap, introTimeline, reducedMotion, useScrollFx } from '../lib/motion.ts';

const craft = [
  { n: '01', title: 'Fresh every morning', text: 'Our base is mixed fresh each day — real milk, real cream, nothing powdered, nothing pre-made.' },
  { n: '02', title: 'Slow-churned', text: 'We churn colder and slower than standard machines, so the ice crystals stay tiny and the texture stays silk.' },
  { n: '03', title: 'Hand-swirled', text: 'Every swirl is pulled through a star nozzle by hand — three-and-a-half turns, finished with a curl.' },
  { n: '04', title: 'Finished your way', text: 'Ribbons, crumbs, sprinkles and sauces, added the second before it reaches your hand.' },
];

function HeroVideo() {
  // separate portrait cut for phones so the cone stays centred
  const [portrait, setPortrait] = useState(() => window.matchMedia('(max-aspect-ratio: 4/5)').matches);
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const mq = window.matchMedia('(max-aspect-ratio: 4/5)');
    const on = () => setPortrait(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.load();
    if (reducedMotion()) return;
    v.play().catch(() => undefined);
  }, [portrait]);
  const name = portrait ? 'hero-mobile' : 'hero-desktop';
  return (
    <video ref={ref} className="hero__video" muted loop playsInline autoPlay={!reducedMotion()} preload="auto" poster={asset(`media/${name}-poster.webp`)} aria-hidden="true">
      <source src={asset(`media/${name}.webm`)} type="video/webm" />
      <source src={asset(`media/${name}.mp4`)} type="video/mp4" />
    </video>
  );
}

function FlavorPicker() {
  const [i, setI] = useState(2);
  const f = flavors[i];
  const img = useRef<HTMLImageElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current || reducedMotion()) {
      first.current = false;
      return;
    }
    gsap.fromTo(img.current, { scale: 0.75, rotate: -14, yPercent: 8, autoAlpha: 0 }, { scale: 1, rotate: 0, yPercent: 0, autoAlpha: 1, duration: 1.1, ease: 'elastic.out(1, 0.65)' });
    gsap.fromTo('.picker__name .word > span', { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05 });
  }, [i]);
  return (
    <section className="picker" style={{ '--tint': f.tint, '--accent': f.accent } as CSSProperties} aria-label="Flavour picker">
      <div className="container picker__grid">
        <div className="picker__intro">
          <p className="eyebrow" data-reveal>Pick your mood</p>
          <Split as="h2" className="display-md" lines={['What are we', 'swirling today?']} accent={[3]} />
          <div className="picker__swatches" role="radiogroup" aria-label="Flavours" data-reveal="0.1">
            {flavors.map((fl, k) => (
              <button
                key={fl.id}
                role="radio"
                aria-checked={k === i}
                className={`swatch${k === i ? ' is-active' : ''}`}
                style={{ '--sw': fl.tint, '--sa': fl.accent } as CSSProperties}
                onClick={() => setI(k)}
                data-cursor="hide"
              >
                <span className="swatch__dot" />
                <span className="swatch__label">{fl.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="picker__stage">
          <div className="picker__halo" aria-hidden="true" />
          <img ref={img} key={f.id} src={flavorImg(f.image, 900)} alt={`${f.name} in a ${f.serve.toLowerCase()}`} width={900} height={1125} />
        </div>
        <div className="picker__info" aria-live="polite">
          <Split key={f.id} as="h3" className="picker__name" lines={[f.name]} intro />
          <p className="picker__notes">{f.notes}</p>
          <p>{f.description}</p>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useDocumentMeta();
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useScrollFx(ref, (reduced) => {
    introTimeline(ref.current!);
    if (reduced) return;
    // hero: the film shrinks into a rounded frame and the copy drifts up as you leave
    gsap.to('.hero__frame', {
      clipPath: 'inset(6% 4% 0% 4% round 48px)',
      scale: 0.96,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero__content', { yPercent: -35, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '10% top', end: '70% top', scrub: true } });

    // signature flavours: vertical scroll drives a horizontal track (desktop)
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const track = document.querySelector<HTMLElement>('.gallery__track');
      if (!track) return;
      const dist = () => track.scrollWidth - window.innerWidth + 64;
      gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: { trigger: '.gallery', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true },
      });
      gsap.to('.gallery__progress span', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.gallery', start: 'top top', end: () => `+=${dist()}`, scrub: true } });
    });

    // craft: the twist render turns as the steps scroll past
    gsap.fromTo('.craft__visual img', { rotate: -10, scale: 0.9 }, { rotate: 8, scale: 1.05, ease: 'none', scrollTrigger: { trigger: '.craft', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.utils.toArray<HTMLElement>('.craft__step').forEach((el) => {
      gsap.from(el, { opacity: 0.15, x: 40, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 75%', toggleActions: 'play none none reverse' } });
    });

    // floating cones in the visit CTA
    gsap.utils.toArray<HTMLElement>('.cta__float').forEach((el, k) => {
      gsap.to(el, { y: -18 - k * 6, rotate: k % 2 ? 6 : -6, duration: 2.6 + k * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });
  });

  const loc = site.locations[0];

  return (
    <div ref={ref}>
      <section className="hero">
        <div className="hero__frame">
          <HeroVideo />
          <div className="hero__shade" />
        </div>
        <div className="hero__content container">
          <p className="eyebrow eyebrow--light" data-intro-fade>
            Premium soft serve · Hand-swirled to order
          </p>
          <Split as="h1" className="display" lines={['Swirled slow.', 'Served cold.']} accent={[2, 3]} intro />
          <p className="hero__lead" data-intro-fade>
            Silky soft serve, real ingredients and signature swirls — finished by hand the second you order.
          </p>
          <div className="hero__ctas" data-intro-fade>
            <Button to="/flavours">Explore flavours</Button>
            <Button to="/visit" variant="ghost">
              Find us
            </Button>
          </div>
        </div>
        <div className="hero__scroll" data-intro-fade aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
      </section>

      <Marquee items={['Silky soft serve', 'Fresh every day', 'Hand-swirled', 'Real ingredients', 'Signature twists', 'Made to share']} />

      <section className="manifesto section">
        <div className="container container--narrow">
          <p className="eyebrow" data-reveal>The Fortone way</p>
          <ScrubText
            className="manifesto__text"
            text="We think ice cream should feel like an occasion — even on a Tuesday. So we churn it slower, swirl it by hand and finish every cone the second before it reaches you. No shortcuts. Just the silkiest soft serve in town."
          />
        </div>
      </section>

      <section className="gallery" aria-labelledby="gallery-title">
        <div className="gallery__head container">
          <div>
            <p className="eyebrow" data-reveal>Signature swirls</p>
            <Split as="h2" className="display-md" lines={['Eight ways', 'to melt.']} accent={[3]} />
          </div>
          <Button to="/flavours" variant="ghost">
            Full menu
          </Button>
        </div>
        <div className="gallery__viewport">
          <div className="gallery__track">
            {flavors.map((f, k) => (
              <FlavorCard key={f.id} flavor={f} index={k} onOpen={() => navigate(`/flavours?f=${f.id}`)} />
            ))}
          </div>
        </div>
        <div className="gallery__progress container" aria-hidden="true">
          <span />
        </div>
      </section>

      <FlavorPicker />

      <section className="craft section">
        <div className="container craft__grid">
          <div className="craft__visual">
            <div className="craft__sticky">
              <div className="craft__ring" aria-hidden="true" />
              <img src={flavorImg('twist', 900)} alt="The Fortone Twist — vanilla and chocolate soft serve in a waffle cone" width={900} height={1125} loading="lazy" />
            </div>
          </div>
          <div className="craft__steps">
            <p className="eyebrow" data-reveal>The craft</p>
            <Split as="h2" className="display-md" lines={['Four steps.', 'Zero shortcuts.']} accent={[3]} />
            {craft.map((s) => (
              <article className="craft__step" key={s.n}>
                <span className="craft__n">{s.n}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Marquee tone="dark" items={['Open late', 'Cones', 'Cups', 'Shakes', 'Sundaes', 'Take-home tubs']} />

      <section className="cta section">
        <img className="cta__float cta__float--a" src={flavorImg('strawberry', 480)} alt="" width={480} height={600} loading="lazy" />
        <img className="cta__float cta__float--b" src={flavorImg('pistachio', 480)} alt="" width={480} height={600} loading="lazy" />
        <img className="cta__float cta__float--c" src={flavorImg('caramel', 480)} alt="" width={480} height={600} loading="lazy" />
        <div className="container cta__inner">
          <p className="eyebrow eyebrow--light" data-reveal>Come say hi</p>
          <Split as="h2" className="display" lines={['Your swirl', 'is waiting.']} accent={[3]} />
          <p className="cta__lead" data-reveal="0.1">
            {loc.address || 'Drop by our flagship — directions are one tap away.'}
          </p>
          <div className="hero__ctas cta__ctas" data-reveal="0.2">
            <Button href={loc.mapsUrl} variant="light">
              Get directions
            </Button>
            <Button to="/contact" variant="ghost">
              Events & catering
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
