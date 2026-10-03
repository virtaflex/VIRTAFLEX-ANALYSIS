import { useRef } from 'react';
import { MapPin, Clock, Phone, MessageCircle } from 'lucide-react';
import { Split } from '../components/Text.tsx';
import { Button } from '../components/Button.tsx';
import { site, whatsappLink } from '../config/site.ts';
import { flavorImg, useDocumentMeta } from '../lib/util.ts';
import { gsap, introTimeline, useScrollFx } from '../lib/motion.ts';

export default function Visit() {
  useDocumentMeta('Visit', 'Find your nearest Fortone Ice Cream — directions, opening hours and how to reach us.');
  const ref = useRef<HTMLDivElement>(null);
  useScrollFx(ref, (reduced) => {
    introTimeline(ref.current!);
    if (reduced) return;
    gsap.to('.mapcard__pin', { y: -12, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.fromTo('.mapcard__pulse', { scale: 0.4, autoAlpha: 0.7 }, { scale: 2.4, autoAlpha: 0, duration: 2, ease: 'expo.out', repeat: -1 });
  });
  const wa = whatsappLink('Hi Fortone! ');

  return (
    <div ref={ref}>
      <section className="phero phero--visit">
        <div className="container phero__inner">
          <p className="eyebrow eyebrow--light" data-intro-fade>
            Visit
          </p>
          <Split as="h1" className="display" lines={['Come for a cone.', 'Stay for another.']} accent={[4]} intro />
        </div>
      </section>

      <section className="section locations">
        <div className="container">
          {site.locations.map((l) => (
            <article className="location" key={l.name}>
              <a className="mapcard" href={l.mapsUrl} target="_blank" rel="noreferrer" data-cursor="Open map" data-clip>
                <span className="mapcard__grid" aria-hidden="true" />
                <span className="mapcard__road mapcard__road--a" aria-hidden="true" />
                <span className="mapcard__road mapcard__road--b" aria-hidden="true" />
                <span className="mapcard__road mapcard__road--c" aria-hidden="true" />
                <span className="mapcard__pulse" aria-hidden="true" />
                <span className="mapcard__pin" aria-hidden="true">
                  <MapPin size={34} />
                </span>
                <span className="mapcard__label">Open in Google Maps ↗</span>
              </a>
              <div className="location__info">
                <p className="eyebrow" data-reveal>{l.area}</p>
                <Split as="h2" className="display-md" lines={[l.name]} />
                <ul className="location__rows">
                  <li data-reveal="0.05">
                    <MapPin size={20} aria-hidden="true" />
                    <span>{l.address || 'Tap “Get directions” for the exact pin.'}</span>
                  </li>
                  <li data-reveal="0.1">
                    <Clock size={20} aria-hidden="true" />
                    <span>
                      {l.hours.length
                        ? l.hours.map((h) => (
                            <span className="hours" key={h.days}>
                              <b>{h.days}</b> {h.time}
                            </span>
                          ))
                        : 'Today’s hours are on our Google Maps listing.'}
                    </span>
                  </li>
                  {site.contact.phone && (
                    <li data-reveal="0.15">
                      <Phone size={20} aria-hidden="true" />
                      <a href={`tel:${site.contact.phone}`}>{site.contact.phone}</a>
                    </li>
                  )}
                </ul>
                <div className="hero__ctas" data-reveal="0.2">
                  <Button href={l.mapsUrl}>Get directions</Button>
                  {wa && (
                    <Button href={wa} variant="ghost">
                      WhatsApp us
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section tips">
        <div className="container">
          <p className="eyebrow" data-reveal>Before you come</p>
          <Split as="h2" className="display-md" lines={['A few insider tips.']} accent={[2]} />
          <div className="tips__grid">
            {[
              { t: 'Go for the twist', d: 'First time? Order The Fortone Twist — vanilla and dark chocolate in one swirl.', img: 'twist' },
              { t: 'Cup or cone?', d: 'Cones for walking, cups for loading up on toppings. You can’t really go wrong.', img: 'hazelnut' },
              { t: 'Planning an event?', d: 'Birthdays, office treats and celebrations — tell us what you need and we’ll make it happen.', img: 'mango' },
            ].map((x, k) => (
              <article className="tip" key={x.t} data-reveal={k * 0.08}>
                <img src={flavorImg(x.img, 480)} alt="" width={480} height={600} loading="lazy" />
                <div>
                  <h3>{x.t}</h3>
                  <p>{x.d}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="tips__cta" data-reveal>
            <MessageCircle size={20} aria-hidden="true" />
            <span>Questions about orders or events?</span>
            <Button to="/contact" variant="ghost">
              Contact us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
