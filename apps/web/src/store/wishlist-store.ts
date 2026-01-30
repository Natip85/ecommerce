"use client";

import { create } from "zustand";
import { createJSONStorage, devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { createSelectors } from "./store-utils";

// =============================================================================
// TYPES
// =============================================================================

export type WishlistItem = {
  productId: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  addedAt: number;
};

export type WishlistState = {
  items: Record<string, WishlistItem>;
};

export type WishlistActions = {
  addItem: (item: Omit<WishlistItem, "addedAt">) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: Omit<WishlistItem, "addedAt">) => boolean; // returns new state (true = added)
  isInWishlist: (productId: string) => boolean;
  getAllItems: () => WishlistItem[];
  getItemCount: () => number;
  clearWishlist: () => void;
};

export type WishlistStore = WishlistState & WishlistActions;

// =============================================================================
// ZUSTAND STORE
// =============================================================================

export const wishlistStore = create<WishlistStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          items: {},

          addItem: (item) => {
            set((state) => {
              state.items[item.productId] = {
                ...item,
                addedAt: Date.now(),
              };
            });
          },

          removeItem: (productId) => {
            set((state) => {
              delete state.items[productId];
            });
          },

          toggleItem: (item) => {
            const exists = Boolean(get().items[item.productId]);
            if (exists) {
              get().removeItem(item.productId);
              return false;
            } else {
              get().addItem(item);
              return true;
            }
          },

          isInWishlist: (productId) => {
            return Boolean(get().items[productId]);
          },

          getAllItems: () => {
            return Object.values(get().items).sort((a, b) => b.addedAt - a.addedAt);
          },

          getItemCount: () => {
            return Object.keys(get().items).length;
          },

          clearWishlist: () => {
            set((state) => {
              state.items = {};
            });
          },
        })),
        {
          name: "wishlist",
          version: 1,
          storage: createJSONStorage(() => localStorage),
        }
      )
    ),
    { name: "WishlistStore" }
  )
);

export const useWishlistStore = createSelectors(wishlistStore);
