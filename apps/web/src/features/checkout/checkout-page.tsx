"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, ShoppingBag } from "lucide-react";

import type { BreadcrumbPageType } from "@/components/breadcrumbs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { cartBreadcrumb, homeBreadcrumb } from "@/lib/breadcrumbs";
import { useCartStore } from "@/store";
import { CheckoutForm } from "./checkout-form";
import { CheckoutSummary } from "./checkout-summary";

const checkoutBreadcrumbs: BreadcrumbPageType[] = [
  homeBreadcrumb,
  cartBreadcrumb,
  { href: "/checkout", label: "Checkout" },
];

export function CheckoutPageContent() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);

  // Derive cart items array from the items record
  const cartItems = useMemo(
    () => Object.values(items).sort((a, b) => a.addedAt - b.addedAt),
    [items]
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

  // If cart is empty, redirect to cart page
  if (cartItems.length === 0) {
    return (
      <main className="bg-background min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs pages={checkoutBreadcrumbs} />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-muted mb-6 flex h-24 w-24 items-center justify-center rounded-full">
              <ShoppingBag className="text-muted-foreground h-12 w-12" />
            </div>
            <h1 className="text-foreground mb-2 text-2xl font-bold">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              Add some items to your cart before checking out.
            </p>
            <Link
              href="/shop"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const shipping = subtotal >= 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;

  return (
    <main className="bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs pages={checkoutBreadcrumbs} />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <CreditCard className="text-primary h-5 w-5" />
            </div>
            <div>
              <h1 className="text-foreground text-2xl font-bold">Checkout</h1>
              <p className="text-muted-foreground text-sm">Complete your order securely</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutForm
              cartItems={cartItems}
              onSuccess={(orderId: string) => {
                router.push(`/order/${orderId}`);
              }}
            />
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <CheckoutSummary
              items={cartItems}
              subtotal={subtotal}
              discount={savings > 0 ? savings : undefined}
              shipping={shipping}
              tax={tax}
              itemCount={itemCount}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
