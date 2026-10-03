import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Split } from '../components/Text.tsx';
import { FlavorCard, FlavorModal } from '../components/Flavor.tsx';
import { Marquee } from '../components/Chrome.tsx';
import { categories, extras, flavors, type Category } from '../config/flavors.ts';
import { flavorImg, useDocumentMeta } from '../lib/util.ts';
import { gsap, introTimeline, reducedMotion, ScrollTrigger, useScrollFx } from '../lib/motion.ts';

export default function Flavours() {
  useDocumentMeta('Flavours', 'Explore every Fortone swirl — classics, signatures and fruity favourites, in a waffle cone or our signature cup.');
  const ref = useRef<HTMLDivElement>(null);
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState<Category | 'all'>('all');
  const open = flavors.find((f) => f.id === params.get('f')) ?? null;
  const list = cat === 'all' ? flavors : flavors.filter((f) => f.category === cat);

  useScrollFx(ref, (reduced) => {
    introTimeline(ref.current!);
    if (reduced) return;
    gsap.utils.toArray<HTMLElement>('.phero__cone').forEach((el, k) => {
      gsap.to(el, { y: -16 - k * 4, rotate: k % 2 ? 5 : -5, duration: 3 + k * 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });
  });

  // re-flow the grid with a staggered rise whenever the filter changes
  const grid = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);
  useLayoutEffect(() => {
    const cards = grid.current?.querySelectorAll('.fcard');
    if (!cards?.length || reducedMotion()) return;
    const t = gsap.fromTo(
      cards,
      { y: 60, opacity: 0, scale: 0.96 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.07,
        ...(firstRun.current && { scrollTrigger: { trigger: grid.current, start: 'top 85%', once: true } }),
      },
    );
    firstRun.current = false;
    ScrollTrigger.refresh();
    return () => void t.kill();
  }, [cat]);

  // sliding pill under the active filter
  const tabs = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const active = tabs.current?.querySelector<HTMLElement>('.is-active');
    const pill = tabs.current?.querySelector<HTMLElement>('.tabs__pill');
    if (!active || !pill) return;
    gsap.to(pill, { x: active.offsetLeft, width: active.offsetWidth, duration: reducedMotion() ? 0 : 0.6, ease: 'expo.out' });
  }, [cat]);

  return (
    <div ref={ref}>
      <section className="phero phero--flavours">
        <div className="container phero__inner">
          <p className="eyebrow eyebrow--light" data-intro-fade>
            The menu
          </p>
          <Split as="h1" className="display" lines={['Every swirl,', 'a little ceremony.']} accent={[3]} intro />
          <p className="phero__lead" data-intro-fade>
            Classics we’ll never change, signatures we’re proud of, and fruity swirls for the hottest days. Tap any flavour for the full story.
          </p>
        </div>
        <div className="phero__cones" aria-hidden="true">
          {['vanilla', 'twist', 'mango'].map((im) => (
            <img key={im} className="phero__cone" src={flavorImg(im, 480)} alt="" width={480} height={600} />
          ))}
        </div>
      </section>

      <section className="section menu-list">
        <div className="container">
          <div className="tabs" ref={tabs} role="tablist" aria-label="Filter flavours">
            <span className="tabs__pill" aria-hidden="true" />
            {categories.map((c) => (
              <button key={c.id} role="tab" aria-selected={cat === c.id} className={cat === c.id ? 'is-active' : ''} onClick={() => setCat(c.id)} data-cursor="hide">
                {c.label}
              </button>
            ))}
          </div>
          <div className="grid" ref={grid}>
            {list.map((f) => (
              <FlavorCard key={f.id} flavor={f} onOpen={() => setParams({ f: f.id }, { preventScrollReset: true })} />
            ))}
          </div>
        </div>
      </section>

      <Marquee tone="gold" items={['Cone or cup', 'Double swirl', 'Extra drizzle', 'Always fresh']} />

      <section className="section extras">
        <div className="container extras__grid">
          <div>
            <p className="eyebrow" data-reveal>Also on the counter</p>
            <Split as="h2" className="display-md" lines={['More ways', 'to indulge.']} accent={[3]} />
          </div>
          <ul className="extras__list">
            {extras.map((e, k) => (
              <li key={e.name} data-reveal={k * 0.06}>
                <span className="extras__n">0{k + 1}</span>
                <span className="extras__name">{e.name}</span>
                <span className="extras__detail">{e.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FlavorModal flavor={open} onClose={() => setParams({}, { preventScrollReset: true })} />
    </div>
  );
}
