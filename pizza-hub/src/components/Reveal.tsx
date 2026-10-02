import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';

interface Props {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  /** "img" = clip-path reveal for image frames */
  variant?: 'fade' | 'img';
  id?: string;
}

let observer: IntersectionObserver | null = null;
function getObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        // also reveal anything already scrolled past (fast scroll / jump links)
        if (e.isIntersecting || e.boundingClientRect.bottom < 0) {
          e.target.classList.add('is-visible');
          observer?.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  return observer;
}

/** Fades/slides content in once when it scrolls into view. One shared observer for the page. */
export function Reveal({ as: Tag = 'div', children, className = '', delay = 0, variant = 'fade', id }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    const io = getObserver();
    if (!el) return;
    if (!io) {
      el.classList.add('is-visible');
      return;
    }
    io.observe(el);
    return () => io.unobserve(el);
  }, []);
  return (
    <Tag ref={ref} id={id} className={`${variant === 'img' ? 'reveal-img' : 'reveal'} ${className}`} style={{ '--delay': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}
