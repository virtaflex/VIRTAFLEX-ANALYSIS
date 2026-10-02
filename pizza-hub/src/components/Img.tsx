import type { CSSProperties } from 'react';
import { images } from '../config/images.ts';

interface Props {
  /** Registry key (e.g. "photos/hero") or a direct URL */
  src: string;
  alt: string;
  /** The `sizes` attribute — how wide the image renders */
  sizes?: string;
  className?: string;
  style?: CSSProperties;
  /** Above-the-fold images: load eagerly with high priority */
  priority?: boolean;
}

/** Responsive, lazy-loaded image with fixed aspect ratio (no layout shift). */
export function Img({ src, alt, sizes = '100vw', className, style, priority }: Props) {
  const entry = images[src];
  const loading = priority ? 'eager' : 'lazy';
  const fetchPriority = priority ? 'high' : 'auto';
  if (!entry) {
    return <img src={src} alt={alt} className={className} style={style} loading={loading} decoding="async" fetchPriority={fetchPriority} />;
  }
  const largest = entry.widths[entry.widths.length - 1];
  const srcSet = entry.widths.map((w) => `/images/${src}-${w}.webp ${w}w`).join(', ');
  return (
    <img
      src={`/images/${src}-${entry.widths[Math.min(1, entry.widths.length - 1)]}.webp`}
      srcSet={srcSet}
      sizes={sizes}
      width={largest}
      height={Math.round(largest / entry.ratio)}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
    />
  );
}
