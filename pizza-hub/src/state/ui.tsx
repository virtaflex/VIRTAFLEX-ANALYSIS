import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

interface CustomizerTarget {
  productId: string;
  /** Set when editing an existing cart line */
  lineId?: string;
}

interface Toast {
  id: number;
  message: string;
}

interface UIContextValue {
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  customizer: CustomizerTarget | null;
  openCustomizer: (productId: string, lineId?: string) => void;
  closeCustomizer: () => void;
  toast: Toast | null;
  showToast: (message: string) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [customizer, setCustomizer] = useState<CustomizerTarget | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const openCustomizer = useCallback((productId: string, lineId?: string) => setCustomizer({ productId, lineId }), []);
  const closeCustomizer = useCallback(() => setCustomizer(null), []);
  const showToast = useCallback((message: string) => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message });
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const value = useMemo(
    () => ({ cartOpen, openCart, closeCart, customizer, openCustomizer, closeCustomizer, toast, showToast }),
    [cartOpen, openCart, closeCart, customizer, openCustomizer, closeCustomizer, toast, showToast],
  );
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>');
  return ctx;
}
