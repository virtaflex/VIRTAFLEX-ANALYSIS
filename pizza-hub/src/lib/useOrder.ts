import { useEffect, useState } from 'react';
import type { OrderSummary } from './order.ts';
import { fetchOrder, getSavedOrder, saveOrder, type PlacedOrder } from './orderService.ts';

export function etaClock(o: Pick<OrderSummary, 'createdAt' | 'eta'>) {
  const t = (m: number) => new Date(new Date(o.createdAt).getTime() + m * 60_000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${t(o.eta[0])} – ${t(o.eta[1])}`;
}

/** Loads an order from this browser and, in api mode, keeps its status fresh from the server. */
export function useOrder(orderNumber: string, token: string | null, pollMs: number) {
  const [order, setOrder] = useState<PlacedOrder | undefined>(() => getSavedOrder(orderNumber));
  const [error, setError] = useState('');
  const mode = order?.mode ?? (token ? 'api' : undefined);

  useEffect(() => {
    if (mode !== 'api' || !token) return;
    let stop = false;
    let timer: number | undefined;
    const load = async () => {
      try {
        const fresh = await fetchOrder(orderNumber, token);
        if (stop) return;
        const merged: PlacedOrder = { ...fresh, mode: 'api' };
        setOrder(merged);
        saveOrder(merged);
        setError('');
        const done = ['completed', 'cancelled'].includes(fresh.status);
        const interval = fresh.status === 'awaiting_payment' ? 4000 : pollMs;
        if (!done) timer = window.setTimeout(load, interval);
      } catch (e) {
        if (!stop) setError((e as Error).message);
      }
    };
    load();
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, [orderNumber, token, mode, pollMs]);

  return { order, error };
}

