import { CircleCheck } from 'lucide-react';
import { useUI } from '../state/ui.tsx';

export function Toast() {
  const { toast } = useUI();
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        <div className="toast" key={toast.id}>
          <CircleCheck size={20} /> {toast.message}
        </div>
      )}
    </div>
  );
}
