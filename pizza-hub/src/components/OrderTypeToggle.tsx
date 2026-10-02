import { Bike, Store } from 'lucide-react';
import type { OrderType } from '../lib/pricing.ts';

export function OrderTypeToggle({ value, onChange }: { value: OrderType; onChange: (t: OrderType) => void }) {
  return (
    <div className="seg" role="radiogroup" aria-label="Order type">
      {(
        [
          ['delivery', 'Delivery', Bike],
          ['pickup', 'Pickup', Store],
        ] as const
      ).map(([id, label, Icon]) => (
        <button key={id} type="button" role="radio" aria-checked={value === id} className={`seg-btn${value === id ? ' is-on' : ''}`} onClick={() => onChange(id)}>
          <Icon size={18} /> {label}
        </button>
      ))}
    </div>
  );
}
