import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import storage from './storage';

type ProductModerationState = {
  pausedProductIds: string[];
  deletedProductIds: string[];
  markPaused: (productId: string) => void;
  markDeleted: (productId: string) => void;
  unmarkPaused: (productId: string) => void;
  unmarkDeleted: (productId: string) => void;
};

export const useProductModerationStore = create<ProductModerationState>()(
  persist(
    (set) => ({
      pausedProductIds: [],
      deletedProductIds: [],
      markPaused: (productId) => {
        set((state) => ({
          pausedProductIds: state.pausedProductIds.includes(productId)
            ? state.pausedProductIds
            : [...state.pausedProductIds, productId],
          deletedProductIds: state.deletedProductIds.filter((id) => id !== productId),
        }));
      },
      markDeleted: (productId) => {
        set((state) => ({
          deletedProductIds: state.deletedProductIds.includes(productId)
            ? state.deletedProductIds
            : [...state.deletedProductIds, productId],
          pausedProductIds: state.pausedProductIds.filter((id) => id !== productId),
        }));
      },
      unmarkPaused: (productId) => {
        set((state) => ({
          pausedProductIds: state.pausedProductIds.filter((id) => id !== productId),
        }));
      },
      unmarkDeleted: (productId) => {
        set((state) => ({
          deletedProductIds: state.deletedProductIds.filter((id) => id !== productId),
        }));
      },
    }),
    {
      name: 'product-moderation-store',
      storage,
      partialize: (state) => ({
        pausedProductIds: state.pausedProductIds,
        deletedProductIds: state.deletedProductIds,
      }),
    },
  ),
);
