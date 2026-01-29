"use client";

import { ArrowLeft, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "@/features/cart/cart-item";
import { CartSummary } from "@/features/cart/cart-summary";
import { cartBreadcrumbs } from "@/lib/breadcrumbs";
import { useCartStore } from "@/store";

export function CartPageContent() {
  // Get raw items state (stable reference) and actions from Zustand store
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  // Derive cart items array from the items record
  const cartItems = useMemo(
    () => Object.values(items).sort((a, b) => a.addedAt - b.addedAt),
    [items],
  );

  // Calculate derived values
  const { subtotal, savings, itemCount } = useMemo(() => {
    let subtotal = 0;
    let savings = 0;
    let itemCount = 0;

    for (const item of cartItems) {
      subtotal += item.price * item.quantity;
      itemCount += item.quantity;
      if (item.compareAtPrice && item.compareAtPrice > item.price) {
        savings += (item.compareAtPrice - item.price) * item.quantity;
      }
    }

    return { subtotal, savings, itemCount };
  }, [cartItems]);

  // Map cart store items to CartItem component props
  const mappedItems = useMemo(
    () =>
      cartItems.map((item) => ({
        id: item.id,
        image: item.imageUrl || "",
        title: item.title,
        description: item.description || "",
        variantOptions: item.variantOptions,
        price: item.price,
        originalPrice: item.compareAtPrice,
        quantity: item.quantity,
        inStock: true, // Default: assume in stock
        badge: undefined as string | undefined, // Default: no badge
      })),
    [cartItems],
  );

  const handleQuantityChange = (id: string, newQuantity: number) => {
    updateQuantity(id, newQuantity);
  };

  const handleRemove = (id: string) => {
    removeItem(id);
  };

  const handleSaveForLater = (id: string) => {
    console.log("Save for later:", id);
  };

  // Calculate summary values
  const discount = savings;
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;

  // Since we default all items to inStock: true, all items are in stock
  const inStockItems = mappedItems;
  const outOfStockItems: typeof mappedItems = [];

  if (cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs pages={cartBreadcrumbs} />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              Your cart is empty
            </h1>
            <p className="mb-8 max-w-md text-muted-foreground">
              Looks like you haven&apos;t added any items to your cart yet.
              Start shopping to fill it up!
            </p>
            <Button size="lg" className="gap-2" asChild>
              <Link href="/shop">
                <Package className="h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }
  return (
    <main className="bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs pages={cartBreadcrumbs} />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/shop"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Shopping Cart
              </h1>
              <p className="text-sm text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"} ready for
                checkout
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {/* In Stock Items */}
            <div className="space-y-4">
              {inStockItems.map((item) => (
                <CartItem
                  key={item.id}
                  {...item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                  onSaveForLater={handleSaveForLater}
                />
              ))}
            </div>

            {/* Out of Stock Items */}
            {outOfStockItems.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Unavailable Items ({outOfStockItems.length})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    These items are currently out of stock
                  </p>
                </div>
                <div className="space-y-4">
                  {outOfStockItems.map((item) => (
                    <CartItem
                      key={item.id}
                      {...item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemove}
                      onSaveForLater={handleSaveForLater}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <CartSummary
              subtotal={subtotal}
              discount={discount > 0 ? discount : undefined}
              shipping={shipping}
              tax={tax}
              itemCount={itemCount}
              onCheckout={() => console.log("Checkout clicked")}
              onApplyPromo={(code) => console.log("Promo code:", code)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
