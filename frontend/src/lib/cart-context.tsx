"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Book } from "./types";
import type { Localized } from "./i18n";

export interface CartItem {
  bookId: string;
  slug: string;
  title: Localized;
  author: string;
  price: number;
  coverImage?: string;
  sku: string;
  stock: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  add: (book: Book, quantity?: number) => void;
  update: (bookId: string, quantity: number) => void;
  remove: (bookId: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "mmu_cart_v1";
const CartContext = createContext<CartContextValue | null>(null);

function normalize(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is CartItem => Boolean(item && typeof item === "object" && "bookId" in item))
    .map((item) => ({
      ...item,
      quantity: Math.max(1, Math.min(20, Number(item.quantity) || 1))
    }));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(normalize(JSON.parse(stored)));
    } catch {
      setItems([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage can be unavailable in private browsing; the cart still works in memory.
    }
  }, [items, hydrated]);

  const add = useCallback((book: Book, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.bookId === book.id);
      const limit = Math.min(20, Math.max(0, book.stock));
      if (limit === 0) return current;
      if (existing) {
        return current.map((item) =>
          item.bookId === book.id
            ? {
                ...item,
                price: book.effectivePrice,
                stock: book.stock,
                quantity: Math.min(limit, item.quantity + quantity)
              }
            : item
        );
      }
      return [
        ...current,
        {
          bookId: book.id,
          slug: book.slug,
          title: book.title,
          author: book.author,
          price: book.effectivePrice,
          coverImage: book.coverImage,
          sku: book.sku,
          stock: book.stock,
          quantity: Math.min(limit, Math.max(1, quantity))
        }
      ];
    });
  }, []);

  const update = useCallback((bookId: string, quantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.bookId === bookId
          ? { ...item, quantity: Math.max(1, Math.min(20, Math.min(item.stock || 20, quantity))) }
          : item
      )
    );
  }, []);

  const remove = useCallback((bookId: string) => {
    setItems((current) => current.filter((item) => item.bookId !== bookId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, hydrated, count, subtotal, add, update, remove, clear }),
    [items, hydrated, count, subtotal, add, update, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
