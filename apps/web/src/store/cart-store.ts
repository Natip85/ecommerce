"use client";

import { create } from "zustand";
import {
  createJSONStorage,
  devtools,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { createSelectors } from "./store-utils";

// =============================================================================
// TYPES
// =============================================================================

export type CartItemInput = {
  productId: string;
  variantId?: string;
  variantOptions?: Record<string, string>; // e.g., { "Color": "Red", "Size": "Large" }
  title: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
};

export type CartItem = CartItemInput & {
  id: string; // composite: `${productId}-${variantId || 'default'}`
  quantity: number;
  addedAt: number; // timestamp for ordering
};

// Internal representation with timestamp for serialization
type CartItemInternal = CartItem;

export type CartState = {
  items: Record<string, CartItemInternal>;
};

export type CartActions = {
  // CRUD operations
  addItem: (item: CartItemInput, quantity?: number) => boolean;
  removeItem: (itemId: string) => boolean;
  updateQuantity: (itemId: string, quantity: number) => boolean;
  incrementQuantity: (itemId: string) => boolean;
  decrementQuantity: (itemId: string) => boolean;
  clearCart: () => void;

  // Queries
  isInCart: (productId: string, variantId?: string) => boolean;
  getItem: (itemId: string) => CartItem | undefined;
  getAllItems: () => CartItem[];
  getItemCount: () => number;
  getTotalQuantity: () => number;
  getSubtotal: () => number;
  getSavings: () => number;
};

export type CartStore = CartState & CartActions;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Generate a composite ID for a cart item
 */
function generateItemId(productId: string, variantId?: string): string {
  return `${productId}-${variantId || "default"}`;
}

// =============================================================================
// ZUSTAND STORE
// =============================================================================

export const cartStore = create<CartStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          items: {},

          addItem: (item, quantity = 1) => {
            const id = generateItemId(item.productId, item.variantId);
            const existingItem = get().items[id];

            if (existingItem) {
              // Increment quantity if item already exists
              set((state) => {
                state.items[id]!.quantity += quantity;
              });
              return true;
            }

            // Add new item
            set((state) => {
              state.items[id] = {
                ...item,
                id,
                quantity,
                addedAt: Date.now(),
              };
            });
            return true;
          },

          removeItem: (itemId) => {
            const exists = Boolean(get().items[itemId]);
            if (!exists) return false;

            set((state) => {
              delete state.items[itemId];
            });
            return true;
          },

          updateQuantity: (itemId, quantity) => {
            const exists = Boolean(get().items[itemId]);
            if (!exists) return false;

            if (quantity <= 0) {
              return get().removeItem(itemId);
            }

            set((state) => {
              state.items[itemId]!.quantity = quantity;
            });
            return true;
          },

          incrementQuantity: (itemId) => {
            const item = get().items[itemId];
            if (!item) return false;

            set((state) => {
              state.items[itemId]!.quantity += 1;
            });
            return true;
          },

          decrementQuantity: (itemId) => {
            const item = get().items[itemId];
            if (!item) return false;

            if (item.quantity <= 1) {
              return get().removeItem(itemId);
            }

            set((state) => {
              state.items[itemId]!.quantity -= 1;
            });
            return true;
          },

          clearCart: () => {
            set((state) => {
              state.items = {};
            });
          },

          isInCart: (productId, variantId) => {
            const id = generateItemId(productId, variantId);
            return Boolean(get().items[id]);
          },

          getItem: (itemId) => {
            return get().items[itemId];
          },

          getAllItems: () => {
            return Object.values(get().items).sort(
              (a, b) => a.addedAt - b.addedAt
            );
          },

          getItemCount: () => {
            return Object.keys(get().items).length;
          },

          getTotalQuantity: () => {
            return Object.values(get().items).reduce(
              (total, item) => total + item.quantity,
              0
            );
          },

          getSubtotal: () => {
            return Object.values(get().items).reduce(
              (total, item) => total + item.price * item.quantity,
              0
            );
          },

          getSavings: () => {
            return Object.values(get().items).reduce((total, item) => {
              if (item.compareAtPrice && item.compareAtPrice > item.price) {
                return (
                  total + (item.compareAtPrice - item.price) * item.quantity
                );
              }
              return total;
            }, 0);
          },
        })),
        {
          name: "shopping-cart",
          version: 1,
          storage: createJSONStorage(() => localStorage),
        }
      )
    ),
    { name: "CartStore" }
  )
);

export const useCartStore = createSelectors(cartStore);
