import { useRef, type ReactNode, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { gsap, reducedMotion } from '../lib/motion.ts';

interface Props {
  children: ReactNode;
  to?: string;
  href?: string;
  variant?: 'solid' | 'ghost' | 'light';
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  icon?: boolean;
}

/** Pill button with a magnetic pull and a fill that wipes in on hover. */
export function Button({ children, to, href, variant = 'solid', onClick, type = 'button', disabled, icon = true }: Props) {
  const ref = useRef<HTMLElement>(null);
  const move = (e: PointerEvent) => {
    if (!ref.current || e.pointerType !== 'mouse' || reducedMotion()) return;
    const r = ref.current.getBoundingClientRect();
    gsap.to(ref.current, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.5, ease: 'power3.out' });
  };
  const leave = () => ref.current && gsap.to(ref.current, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
  const inner = (
    <>
      <span className="btn__fill" aria-hidden="true" />
      <span className="btn__label">{children}</span>
      {icon && <ArrowUpRight className="btn__icon" size={18} aria-hidden="true" />}
    </>
  );
  const common = { className: `btn btn--${variant}`, onPointerMove: move, onPointerLeave: leave, 'data-cursor': 'hide' };
  if (to)
    return (
      <Link ref={ref as React.Ref<HTMLAnchorElement>} to={to} {...common}>
        {inner}
      </Link>
    );
  if (href)
    return (
      <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} target="_blank" rel="noreferrer" {...common}>
        {inner}
      </a>
    );
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} type={type} onClick={onClick} disabled={disabled} {...common}>
      {inner}
    </button>
  );
}
