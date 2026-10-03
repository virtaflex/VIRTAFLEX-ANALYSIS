import { useEffect, useRef, type CSSProperties, type PointerEvent } from 'react';
import { X } from 'lucide-react';
import type { Flavor } from '../config/flavors.ts';
import { flavorImg } from '../lib/util.ts';
import { gsap, lockScroll, reducedMotion } from '../lib/motion.ts';

const tintVars = (f: Flavor) => ({ '--tint': f.tint, '--accent': f.accent }) as CSSProperties;

/** Card with pointer-driven 3D tilt; the render floats above the card plane. */
export function FlavorCard({ flavor, index, onOpen }: { flavor: Flavor; index?: number; onOpen?: (f: Flavor) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const tilt = (e: PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse' || reducedMotion()) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(el, { rotateY: x * 10, rotateX: -y * 10, duration: 0.6, ease: 'power3.out' });
    gsap.to(el.querySelector('.fcard__img'), { x: x * 22, y: y * 14, duration: 0.6, ease: 'power3.out' });
    el.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
    el.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    gsap.to(el, { rotateY: 0, rotateX: 0, duration: 1, ease: 'elastic.out(1, 0.5)' });
    gsap.to(el.querySelector('.fcard__img'), { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.5)' });
  };
  return (
    <button ref={ref} type="button" className="fcard" style={tintVars(flavor)} onPointerMove={tilt} onPointerLeave={reset} onClick={() => onOpen?.(flavor)} data-cursor="Taste">
      <span className="fcard__glow" aria-hidden="true" />
      {index !== undefined && <span className="fcard__num">{String(index + 1).padStart(2, '0')}</span>}
      <span className="fcard__serve">{flavor.serve}</span>
      <img className="fcard__img" src={flavorImg(flavor.image, 480)} srcSet={`${flavorImg(flavor.image, 480)} 480w, ${flavorImg(flavor.image, 900)} 900w`} sizes="(max-width: 700px) 80vw, 380px" alt="" loading="lazy" width={480} height={600} />
      <span className="fcard__body">
        <span className="fcard__name">{flavor.name}</span>
        <span className="fcard__notes">{flavor.notes}</span>
      </span>
    </button>
  );
}

/** Detail sheet for a flavour — a native <dialog> for focus trapping and Esc. */
export function FlavorModal({ flavor, onClose }: { flavor: Flavor | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d || !flavor) return;
    d.showModal();
    lockScroll(true);
    if (!reducedMotion()) {
      gsap.fromTo(d.querySelector('.fmodal__panel'), { yPercent: 12, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: 'expo.out' });
      gsap.fromTo(d.querySelector('.fmodal__img'), { scale: 0.7, rotate: -8, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 1.2, ease: 'elastic.out(1, 0.6)', delay: 0.1 });
    }
    return () => lockScroll(false);
  }, [flavor]);
  if (!flavor) return null;
  const close = () => {
    ref.current?.close();
    onClose();
  };
  return (
    <dialog ref={ref} className="fmodal" style={tintVars(flavor)} onCancel={close} onClick={(e) => e.target === ref.current && close()} aria-labelledby="fmodal-title">
      <div className="fmodal__panel">
        <button className="fmodal__close" onClick={close} aria-label="Close">
          <X size={22} />
        </button>
        <div className="fmodal__visual">
          <img className="fmodal__img" src={flavorImg(flavor.image, 900)} alt={`${flavor.name} soft serve in a ${flavor.serve.toLowerCase()}`} width={900} height={1125} />
        </div>
        <div className="fmodal__body">
          <p className="eyebrow">{flavor.category} · {flavor.serve}</p>
          <h2 id="fmodal-title" className="display-sm">{flavor.name}</h2>
          <p className="fmodal__notes">{flavor.notes}</p>
          <p>{flavor.description}</p>
          {flavor.toppings.length > 0 && (
            <ul className="chips">
              {flavor.toppings.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          {flavor.price !== undefined && <p className="fmodal__price">EGP {flavor.price}</p>}
        </div>
      </div>
    </dialog>
  );
}
