import { site } from '../config/site.ts';
import { asset } from '../lib/asset.ts';

/** The Pizza Hub logo (transparent PNG/WebP cut from the brand artwork). Use on dark or red backgrounds. */
export function Logo({ className, height = 52 }: { className?: string; height?: number }) {
  return (
    <img
      className={className}
      src={asset('images/brand/logo-200.webp')}
      srcSet={`${asset('images/brand/logo-200.webp')} 200w, ${asset('images/brand/logo-400.webp')} 400w`}
      sizes={`${Math.round(height * 1.173)}px`}
      width={Math.round(height * 1.173)}
      height={height}
      alt={site.name}
      decoding="async"
    />
  );
}
