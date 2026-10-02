import { Info } from 'lucide-react';
import { site } from '../config/site.ts';
import { orderMode } from '../config/runtime.ts';

/** Shown while menu prices are placeholders (site.launch.samplePrices). */
export function SamplePricesNotice({ className = '' }: { className?: string }) {
  if (!site.launch.samplePrices) return null;
  return (
    <p className={`notice ${className}`}>
      <Info size={15} /> Sample prices — final prices coming soon.
    </p>
  );
}

/** Shown while ordering runs in demo mode (nothing is sent to the restaurant). */
export function DemoModeNotice({ className = '' }: { className?: string }) {
  if (orderMode !== 'demo') return null;
  return (
    <p className={`notice notice--strong ${className}`}>
      <Info size={15} /> Preview mode — orders placed here are not sent to the restaurant yet.
    </p>
  );
}
