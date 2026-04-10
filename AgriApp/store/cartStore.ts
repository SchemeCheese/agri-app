import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import storage from './storage';

import { Product } from '@/api/product';

type CartItem = {
  product: Product;
  quantity: number;
};

type CartState = {
  items: Record<string, CartItem>;
  addItem: (product: Product, quantity?: number) => void;
  increaseItem: (productId: string) => void;
  decreaseItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  removeItems: (productIds: string[]) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: {},
      addItem: (product, quantity = 1) => {
        const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;

        set((state) => {
          const current = state.items[product.id];
          return {
            items: {
              ...state.items,
              [product.id]: {
                product,
                quantity: current ? current.quantity + safeQuantity : safeQuantity,
              },
            },
          };
        });
      },
      increaseItem: (productId) => {
        set((state) => {
          const item = state.items[productId];
          if (!item) return state;
          return {
            items: {
              ...state.items,
              [productId]: {
                ...item,
                quantity: item.quantity + 1,
              },
            },
          };
        });
      },
      decreaseItem: (productId) => {
        set((state) => {
          const item = state.items[productId];
          if (!item) return state;

          if (item.quantity <= 1) {
            const { [productId]: _, ...rest } = state.items;
            return { items: rest };
          }

          return {
            items: {
              ...state.items,
              [productId]: {
                ...item,
                quantity: item.quantity - 1,
              },
            },
          };
        });
      },
      removeItem: (productId) => {
        set((state) => {
          const { [productId]: _, ...rest } = state.items;
          return { items: rest };
        });
      },
      removeItems: (productIds) => {
        set((state) => {
          const removeSet = new Set(productIds);
          const nextItems = Object.fromEntries(
            Object.entries(state.items).filter(([productId]) => !removeSet.has(productId)),
          );

          return { items: nextItems };
        });
      },
      clearCart: () => set({ items: {} }),
    }),
    {
      name: 'cart-store',
      storage,
      partialize: (state) => ({
        items: state.items,
      }),
    },
  ),
);

export const useCartSummary = () => {
  const items = useCartStore((state) => state.items);

  const cartItems = Object.values(items);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (item.product.price ?? 0) * item.quantity,
    0,
  );

  return {
    cartItems,
    totalItems,
    totalPrice,
  };
};
