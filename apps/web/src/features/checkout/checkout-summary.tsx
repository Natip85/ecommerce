"use client";

import Image from "next/image";
import { ShieldCheck, Truck } from "lucide-react";

import type { CartItem } from "@/store/cart-store";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type CheckoutSummaryProps = {
  items: CartItem[];
  subtotal: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  itemCount: number;
};

export function CheckoutSummary({
  items,
  subtotal,
  discount = 0,
  shipping = 0,
  tax = 0,
  itemCount,
}: CheckoutSummaryProps) {
  const total = subtotal - discount + shipping + tax;

  return (
    <div className="border-border bg-card rounded-xl border">
      {/* Header */}
      <div className="border-border bg-muted/30 border-b px-5 py-4">
        <h2 className="text-foreground text-lg font-semibold">Order Summary</h2>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="p-5">
        {/* Items List */}
        <div className="mb-5 max-h-64 space-y-3 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3"
            >
              <div className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                {item.imageUrl ?
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                : <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                    No image
                  </div>
                }
                <div className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium">
                  {item.quantity}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">{item.title}</p>
                {item.variantOptions && (
                  <p className="text-muted-foreground truncate text-xs">
                    {Object.values(item.variantOptions).join(" / ")}
                  </p>
                )}
                <p className="text-foreground text-sm font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator className="mb-5" />

        {/* Price Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground font-medium">${subtotal.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-600">Discount</span>
              <span className="font-medium text-emerald-600">-${discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-foreground font-medium">
              {shipping === 0 ?
                <span className="text-emerald-600">FREE</span>
              : `$${shipping.toFixed(2)}`}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimated Tax</span>
            <span className="text-foreground font-medium">${tax.toFixed(2)}</span>
          </div>
        </div>

        <Separator className="my-5" />

        {/* Total */}
        <div className="mb-5 flex items-center justify-between">
          <span className="text-foreground text-base font-semibold">Total</span>
          <div className="text-right">
            <span className="text-foreground text-2xl font-bold">${total.toFixed(2)}</span>
            {discount > 0 && (
              <p className="text-xs text-emerald-600">You save ${discount.toFixed(2)}</p>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <ShieldCheck className="h-4 w-4" />
            <span>Secure Checkout</span>
          </div>
          <div className="bg-border h-4 w-px" />
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Truck className="h-4 w-4" />
            <span>Fast Delivery</span>
          </div>
        </div>
      </div>
    </div>
  );
}
