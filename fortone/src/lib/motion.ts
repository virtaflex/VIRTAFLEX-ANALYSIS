import { useLayoutEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis: Lenis | null = null;

/** Smooth scrolling driven by the GSAP ticker so ScrollTrigger stays perfectly in sync. */
export function startSmoothScroll() {
  if (lenis || reducedMotion()) return;
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.classList.toggle('is-locked', locked);
}

/* ---------- intro timing (preloader on first load, curtain afterwards) ---------- */

let introDelay = 2.1;
export const getIntroDelay = () => introDelay;
export const setIntroDelay = (s: number) => {
  introDelay = s;
};

/**
 * Runs GSAP code scoped to `scope` and reverts it on unmount.
 * Also wires the shared data-attribute effects used across pages:
 *   [data-reveal]       fade + rise when entering the viewport
 *   [data-split]        words rise from behind a mask (see <Split>)
 *   [data-parallax="n"] vertical drift while scrolling (n = strength)
 *   [data-scrub-words]  words light up as you read (see <ScrubText>)
 *   [data-clip]         image frame wipes open
 */
export function useScrollFx(scope: RefObject<HTMLElement | null>, setup?: (reduced: boolean) => void, deps: unknown[] = []) {
  useLayoutEffect(() => {
    const root = scope.current;
    if (!root) return;
    const reduced = reducedMotion();
    const ctx = gsap.context(() => {
      if (!reduced) {
        gsap.utils.toArray<HTMLElement>('[data-reveal]', root).forEach((el) => {
          // opacity (not visibility) so unrevealed content stays keyboard-focusable
          gsap.from(el, {
            y: 46,
            opacity: 0,
            duration: 1.1,
            ease: 'expo.out',
            delay: Number(el.dataset.reveal || 0),
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          });
        });
        gsap.utils.toArray<HTMLElement>('[data-split]:not([data-intro])', root).forEach((el) => {
          gsap.from(el.querySelectorAll('.word > span'), {
            yPercent: 115,
            rotate: 4,
            duration: 1.15,
            ease: 'expo.out',
            stagger: 0.045,
            scrollTrigger: { trigger: el, start: 'top 86%', once: true },
          });
        });
        gsap.utils.toArray<HTMLElement>('[data-parallax]', root).forEach((el) => {
          const k = Number(el.dataset.parallax || 0.2);
          gsap.fromTo(
            el,
            { yPercent: -k * 50 },
            { yPercent: k * 50, ease: 'none', scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true } },
          );
        });
        gsap.utils.toArray<HTMLElement>('[data-clip]', root).forEach((el) => {
          gsap.from(el, {
            clipPath: 'inset(18% 18% 18% 18% round 40px)',
            scale: 1.08,
            duration: 1.5,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          });
        });
      }
      gsap.utils.toArray<HTMLElement>('[data-scrub-words]', root).forEach((el) => {
        gsap.fromTo(
          el.querySelectorAll('.sw'),
          { opacity: 0.16 },
          { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: reduced ? false : 0.6 } },
        );
      });
      setup?.(reduced);
    }, root);
    // fonts/images can shift layout after mount
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => {
      window.clearTimeout(t);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Plays the hero heading/lead/CTA entrance once the preloader or page curtain is out of the way. */
export function introTimeline(root: HTMLElement) {
  const tl = gsap.timeline({ delay: getIntroDelay() });
  if (reducedMotion()) return tl;
  tl.from(root.querySelectorAll('[data-intro] .word > span'), { yPercent: 120, rotate: 5, duration: 1.3, ease: 'expo.out', stagger: 0.06 })
    .from(root.querySelectorAll('[data-intro-fade]'), { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1 }, '-=0.95');
  return tl;
}
