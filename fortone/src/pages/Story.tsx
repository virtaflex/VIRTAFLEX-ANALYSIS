import { useRef } from 'react';
import { Split, ScrubText } from '../components/Text.tsx';
import { Button } from '../components/Button.tsx';
import { flavorImg, useDocumentMeta } from '../lib/util.ts';
import { gsap, introTimeline, useScrollFx } from '../lib/motion.ts';

// TODO: replace with Fortone's real story, milestones and photos.
const chapters = [
  { k: 'The obsession', title: 'It started with one perfect swirl.', text: 'Not a recipe. A feeling — the first cold, silky bite of soft serve on a warm evening. We wanted to bottle that, and serve it every single day.' },
  { k: 'The craft', title: 'Then we got particular.', text: 'We tested bases, temperatures and nozzles until the texture was right: dense enough to hold a tall swirl, light enough to melt the moment it lands.' },
  { k: 'The counter', title: 'Now it’s yours.', text: 'Today every Fortone cone is still pulled by hand, finished to order and handed over with a smile. Same obsession. More flavours.' },
];

const values = [
  { title: 'Real ingredients', text: 'Fresh milk and cream as the base, real fruit and nuts on top. If we can’t pronounce it, it’s not in your cone.', img: 'pistachio' },
  { title: 'Made to order', text: 'Nothing sits waiting. Your swirl is pulled, topped and finished the second you ask for it.', img: 'strawberry' },
  { title: 'Made to share', text: 'Ice cream is better with company. Our counters are built for friends, families and late-night walks.', img: 'mango' },
];

export default function Story() {
  useDocumentMeta('Our Story', 'How Fortone turned an obsession with the perfect soft-serve swirl into a premium ice cream house.');
  const ref = useRef<HTMLDivElement>(null);
  useScrollFx(ref, (reduced) => {
    introTimeline(ref.current!);
    if (reduced) return;
    // chapter numbers count with the scroll; images glide in opposite directions
    gsap.utils.toArray<HTMLElement>('.chapter').forEach((el, k) => {
      gsap.from(el.querySelector('.chapter__img'), {
        xPercent: k % 2 ? -20 : 20,
        rotate: k % 2 ? -10 : 10,
        opacity: 0,
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 70%', once: true },
      });
    });
    gsap.to('.story-hero__ring', { rotate: 360, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom bottom', scrub: 1 } });
  });

  return (
    <div ref={ref}>
      <section className="phero phero--story story-hero">
        <div className="story-hero__ring" aria-hidden="true">
          <svg viewBox="0 0 200 200">
            <defs>
              <path id="ring" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
            </defs>
            <text>
              <textPath href="#ring">SWIRLED SLOW · SERVED COLD · MADE BY HAND · </textPath>
            </text>
          </svg>
        </div>
        <div className="container phero__inner">
          <p className="eyebrow eyebrow--light" data-intro-fade>
            Our story
          </p>
          <Split as="h1" className="display" lines={['Born from one', 'very serious', 'obsession.']} accent={[5]} intro />
        </div>
      </section>

      <section className="section manifesto">
        <div className="container container--narrow">
          <ScrubText
            className="manifesto__text"
            text="Fortone exists for the small moment between the first lick and the last crunch of the cone — the moment everything else goes quiet. We built a whole ice cream house around protecting it."
          />
        </div>
      </section>

      <section className="chapters">
        {chapters.map((c, k) => (
          <article className={`chapter container${k % 2 ? ' chapter--flip' : ''}`} key={c.k}>
            <div className="chapter__visual">
              <span className="chapter__num" data-parallax="0.4">
                0{k + 1}
              </span>
              <img className="chapter__img" src={flavorImg(['vanilla', 'chocolate', 'twist'][k], 900)} alt="" width={900} height={1125} loading="lazy" />
            </div>
            <div className="chapter__copy">
              <p className="eyebrow" data-reveal>{c.k}</p>
              <Split as="h2" className="display-md" lines={[c.title]} />
              <p data-reveal="0.1">{c.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="section values">
        <div className="container">
          <p className="eyebrow" data-reveal>What we stand for</p>
          <Split as="h2" className="display-md" lines={['Three promises', 'in every cone.']} accent={[4]} />
          <div className="values__grid">
            {values.map((v, k) => (
              <article className="value" key={v.title} data-reveal={k * 0.08}>
                <img src={flavorImg(v.img, 480)} alt="" width={480} height={600} loading="lazy" />
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section quote">
        <div className="container container--narrow">
          <Split as="blockquote" className="display-md quote__text" lines={['“Make it the best', 'part of somebody’s day.”']} accent={[3, 4]} />
          <p className="quote__by" data-reveal="0.2">— The Fortone promise</p>
          <div data-reveal="0.3" className="quote__cta">
            <Button to="/flavours">Taste the menu</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
