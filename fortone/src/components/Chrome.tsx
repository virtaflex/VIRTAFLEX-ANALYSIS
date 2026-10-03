import { useEffect, useRef, useState } from 'react';
import { Wordmark } from './Wordmark.tsx';
import { gsap, lockScroll, reducedMotion, setIntroDelay } from '../lib/motion.ts';

/** First-load curtain: wordmark rises, counter runs, then the curtain lifts off the hero. */
export function Preloader() {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) {
      setIntroDelay(0.2);
      setDone(true);
      return;
    }
    lockScroll(true);
    const count = { v: 0 };
    const num = el.querySelector('.preloader__count')!;
    const tl = gsap.timeline({
      onComplete: () => {
        lockScroll(false);
        setDone(true);
      },
    });
    tl.from(el.querySelectorAll('.preloader__mark'), { yPercent: 110, duration: 1, ease: 'expo.out' })
      .to(count, { v: 100, duration: 1.2, ease: 'power2.inOut', onUpdate: () => void (num.textContent = String(Math.round(count.v)).padStart(3, '0')) }, 0.1)
      .to(el.querySelector('.preloader__bar span'), { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }, 0.1)
      .to(el.querySelector('.preloader__inner'), { yPercent: -40, autoAlpha: 0, duration: 0.7, ease: 'expo.in' }, '+=0.05')
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=0.25');
    // the page intro starts as the curtain lifts
    setIntroDelay(tl.duration() - 0.55);
    return () => void tl.kill();
  }, []);
  if (done) return null;
  return (
    <div className="preloader" ref={ref} aria-hidden="true">
      <div className="preloader__inner">
        <div className="preloader__mask">
          <div className="preloader__mark">
            <Wordmark />
          </div>
        </div>
        <div className="preloader__bar">
          <span />
        </div>
        <span className="preloader__count">000</span>
      </div>
    </div>
  );
}

/** Dot + ring cursor for fine pointers. Grows over links; shows a label over [data-cursor="Label"]. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || reducedMotion()) return;
    document.documentElement.classList.add('has-cursor');
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3' });
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3' });
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'power3' });
    const move = (e: PointerEvent) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      const t = (e.target as Element | null)?.closest?.('a, button, [data-cursor]') as HTMLElement | null;
      const c = t?.dataset.cursor;
      ring.current?.classList.toggle('is-hover', !!t && c !== 'hide');
      ring.current?.classList.toggle('is-hidden', c === 'hide');
      ring.current?.classList.toggle('is-label', !!c && c !== 'hide');
      setLabel(c && c !== 'hide' ? c : '');
    };
    window.addEventListener('pointermove', move);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.classList.remove('has-cursor');
    };
  }, []);
  return (
    <>
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
      <div className="cursor-ring" ref={ring} aria-hidden="true">
        <span>{label}</span>
      </div>
    </>
  );
}

/** Infinite ticker; speeds up and leans with scroll velocity. */
export function Marquee({ items, tone = 'blush' }: { items: string[]; tone?: 'blush' | 'dark' | 'gold' }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const track = el.querySelector<HTMLElement>('.marquee__track')!;
    const tween = gsap.to(track, { xPercent: -50, ease: 'none', duration: 28, repeat: -1 });
    let last = window.scrollY;
    const tick = () => {
      const v = window.scrollY - last;
      last = window.scrollY;
      const target = 1 + Math.min(Math.abs(v) / 10, 4);
      tween.timeScale(gsap.utils.interpolate(tween.timeScale(), target, 0.1));
      gsap.set(track, { skewX: gsap.utils.clamp(-8, 8, -v * 0.3) });
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      tween.kill();
    };
  }, []);
  const row = [...items, ...items];
  return (
    <div className={`marquee marquee--${tone}`} ref={ref} aria-label={items.join(', ')}>
      <div className="marquee__track" aria-hidden="true">
        {[0, 1].map((k) => (
          <div className="marquee__row" key={k}>
            {row.map((t, i) => (
              <span key={i}>
                {t}
                <i>✦</i>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
