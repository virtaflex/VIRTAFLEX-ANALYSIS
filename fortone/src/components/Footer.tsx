import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { nav } from './Header.tsx';
import { site } from '../config/site.ts';
import { gsap, useScrollFx } from '../lib/motion.ts';

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  useScrollFx(ref, (reduced) => {
    if (reduced) return;
    // giant wordmark letters rise one by one as the footer arrives
    gsap.from('.footer__giant span', {
      yPercent: 100,
      ease: 'expo.out',
      stagger: 0.05,
      duration: 1.4,
      scrollTrigger: { trigger: '.footer__giant', start: 'top 95%', once: true },
    });
  });
  const socials = Object.entries(site.social).filter(([, url]) => url);
  const loc = site.locations[0];
  return (
    <footer className="footer" ref={ref}>
      <div className="container footer__top">
        <div className="footer__intro" data-reveal>
          <p className="eyebrow">Fortone Ice Cream</p>
          <p className="footer__line">
            Life’s short.
            <br />
            <em>Get the double swirl.</em>
          </p>
        </div>
        <div className="footer__cols">
          <div data-reveal="0.05">
            <h3>Explore</h3>
            <ul>
              {nav.map((n) => (
                <li key={n.to}>
                  <Link to={n.to}>{n.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal="0.1">
            <h3>Visit</h3>
            <ul>
              <li>{loc.name}</li>
              {loc.address && <li>{loc.address}</li>}
              {loc.hours.map((h) => (
                <li key={h.days}>
                  {h.days}: {h.time}
                </li>
              ))}
              <li>
                <a href={loc.mapsUrl} target="_blank" rel="noreferrer">
                  Get directions ↗
                </a>
              </li>
            </ul>
          </div>
          <div data-reveal="0.15">
            <h3>Say hi</h3>
            <ul>
              {site.contact.phone && (
                <li>
                  <a href={`tel:${site.contact.phone}`}>{site.contact.phone}</a>
                </li>
              )}
              {site.contact.email && (
                <li>
                  <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
                </li>
              )}
              {socials.map(([k, url]) => (
                <li key={k}>
                  <a href={url} target="_blank" rel="noreferrer" className="cap">
                    {k} ↗
                  </a>
                </li>
              ))}
              <li>
                <Link to="/contact">Send us a note</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer__giant" aria-hidden="true">
        {'Fortone'.split('').map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </div>
      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} {site.fullName}</span>
        <span>{site.tagline}</span>
      </div>
    </footer>
  );
}
