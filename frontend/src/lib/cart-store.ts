"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "./types";

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "cartId">) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clear: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: [
            ...state.items,
            { ...item, cartId: `${item.productId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
          ],
        })),
      removeItem: (cartId) =>
        set((state) => ({ items: state.items.filter((i) => i.cartId !== cartId) })),
      updateQuantity: (cartId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.cartId === cartId ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    }),
    { name: "novasneak-cart" }
  )
);
