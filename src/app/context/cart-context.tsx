import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface CartItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  price: number;
  mrp?: number;
  quantity: number;
  maxStock: number;
  primaryImageId?: number | null;
  sku: string;
  hsnCode?: string;
  taxPercentage?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "premium-store-cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function itemKey(productId: string, variantId?: string) {
  return variantId ? `${productId}::${variantId}` : productId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    saveCart(next);
  }, []);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const key = itemKey(item.productId, item.variantId);
      const idx = prev.findIndex((i) => itemKey(i.productId, i.variantId) === key);
      let next: CartItem[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: Math.min(next[idx].quantity + item.quantity, item.maxStock),
        };
      } else {
        next = [...prev, item];
      }
      saveCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems((prev) => {
      const key = itemKey(productId, variantId);
      const next = prev.filter((i) => itemKey(i.productId, i.variantId) !== key);
      saveCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, variantId: string | undefined, quantity: number) => {
    setItems((prev) => {
      const key = itemKey(productId, variantId);
      const next = prev.map((i) =>
        itemKey(i.productId, i.variantId) === key
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
          : i
      );
      saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    persist([]);
  }, [persist]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
