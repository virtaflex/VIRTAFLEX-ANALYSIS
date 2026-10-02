import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { productById } from '../config/menu.ts';
import { site } from '../config/site.ts';
import {
  computeTotals,
  normalizeSelection,
  priceLines,
  selectionKey,
  type CartItemInput,
  type OrderType,
  type PricedLine,
  type Totals,
} from '../lib/pricing.ts';

export interface CartLine extends CartItemInput {
  lineId: string;
}

interface CartState {
  lines: CartLine[];
  orderType: OrderType;
  areaId: string;
}

type Action =
  | { type: 'add'; item: CartItemInput }
  | { type: 'update'; lineId: string; item: CartItemInput }
  | { type: 'remove'; lineId: string }
  | { type: 'qty'; lineId: string; quantity: number }
  | { type: 'clear' }
  | { type: 'orderType'; orderType: OrderType }
  | { type: 'area'; areaId: string };

const STORAGE_KEY = 'pizzahub:cart:v1';
const maxQty = site.ordering.maxItemQuantity;
const clampQty = (q: number) => Math.max(1, Math.min(maxQty, Math.floor(q)));
const newId = () => Math.random().toString(36).slice(2, 10);

function sameLine(a: CartItemInput, b: CartItemInput) {
  return selectionKey(a.productId, a.selection) === selectionKey(b.productId, b.selection) && (a.note ?? '') === (b.note ?? '');
}

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'add': {
      const existing = state.lines.find((l) => sameLine(l, action.item));
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) => (l === existing ? { ...l, quantity: clampQty(l.quantity + action.item.quantity) } : l)),
        };
      }
      return { ...state, lines: [...state.lines, { ...action.item, quantity: clampQty(action.item.quantity), lineId: newId() }] };
    }
    case 'update':
      return {
        ...state,
        lines: state.lines.map((l) => (l.lineId === action.lineId ? { ...action.item, quantity: clampQty(action.item.quantity), lineId: l.lineId } : l)),
      };
    case 'remove':
      return { ...state, lines: state.lines.filter((l) => l.lineId !== action.lineId) };
    case 'qty':
      return { ...state, lines: state.lines.map((l) => (l.lineId === action.lineId ? { ...l, quantity: clampQty(action.quantity) } : l)) };
    case 'clear':
      return { ...state, lines: [] };
    case 'orderType':
      return { ...state, orderType: action.orderType };
    case 'area':
      return { ...state, areaId: action.areaId };
  }
}

/** Load the saved cart, dropping anything the current menu no longer allows. */
function load(): CartState {
  const empty: CartState = { lines: [], orderType: 'delivery', areaId: '' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const saved = JSON.parse(raw) as Partial<CartState>;
    const lines: CartLine[] = [];
    for (const l of saved.lines ?? []) {
      const product = productById.get(l.productId);
      if (!product || product.available === false) continue;
      try {
        lines.push({ ...l, selection: normalizeSelection(product, l.selection), quantity: clampQty(l.quantity) });
      } catch {
        /* option removed from menu — drop the line */
      }
    }
    return {
      lines,
      orderType: saved.orderType === 'pickup' ? 'pickup' : 'delivery',
      areaId: site.delivery.areas.some((a) => a.id === saved.areaId) ? (saved.areaId as string) : '',
    };
  } catch {
    return empty;
  }
}

interface CartContextValue extends CartState {
  priced: (PricedLine & { lineId: string })[];
  totals: Totals;
  add: (item: CartItemInput) => void;
  update: (lineId: string, item: CartItemInput) => void;
  remove: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
  setOrderType: (t: OrderType) => void;
  setArea: (id: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable (private mode) — cart still works for this visit */
    }
  }, [state]);

  const add = useCallback((item: CartItemInput) => dispatch({ type: 'add', item }), []);
  const update = useCallback((lineId: string, item: CartItemInput) => dispatch({ type: 'update', lineId, item }), []);
  const remove = useCallback((lineId: string) => dispatch({ type: 'remove', lineId }), []);
  const setQuantity = useCallback((lineId: string, quantity: number) => dispatch({ type: 'qty', lineId, quantity }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);
  const setOrderType = useCallback((orderType: OrderType) => dispatch({ type: 'orderType', orderType }), []);
  const setArea = useCallback((areaId: string) => dispatch({ type: 'area', areaId }), []);

  const value = useMemo<CartContextValue>(() => {
    const priced = state.lines.flatMap((l) => priceLines([l]).map((p) => ({ ...p, lineId: l.lineId })));
    return {
      ...state,
      priced,
      totals: computeTotals(priced, state.orderType, state.areaId),
      add,
      update,
      remove,
      setQuantity,
      clear,
      setOrderType,
      setArea,
    };
  }, [state, add, update, remove, setQuantity, clear, setOrderType, setArea]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
