import { ChevronRight, Lock, ShieldCheck, Tag, Truck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type CartSummaryProps = {
  subtotal: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  itemCount: number;
  onCheckout?: () => void;
  onApplyPromo?: (code: string) => void;
};
export const CartSummary = ({
  subtotal,
  discount = 0,
  shipping = 0,
  tax = 0,
  itemCount,
  onCheckout,
  onApplyPromo,
}: CartSummaryProps) => {
  const [promoCode, setPromoCode] = useState("");
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const total = subtotal - discount + shipping + tax;
  const freeShippingThreshold = 50;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300",
        isHovered && "shadow-xl shadow-foreground/5",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="border-b border-border bg-muted/30 px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      <div className="p-5">
        {/* Free Shipping Progress */}
        {amountToFreeShipping > 0 ? (
          <div className="mb-5 rounded-lg bg-amber-500/10 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Truck className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">
                Add ${amountToFreeShipping.toFixed(2)} for FREE shipping
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-amber-200">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{
                  width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="mb-5 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3">
            <Truck className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">
              You qualify for FREE shipping!
            </span>
          </div>
        )}

        {/* Promo Code */}
        <div className="mb-5">
          <button
            onClick={() => setIsPromoOpen(!isPromoOpen)}
            className="flex w-full items-center justify-between text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span>Have a promo code?</span>
            </div>
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isPromoOpen && "rotate-90",
              )}
            />
          </button>
          {isPromoOpen && (
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Enter code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="h-9 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApplyPromo?.(promoCode)}
                className="shrink-0 bg-transparent"
              >
                Apply
              </Button>
            </div>
          )}
        </div>

        <Separator className="mb-5" />

        {/* Price Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground">
              ${subtotal.toFixed(2)}
            </span>
          </div>

          {discount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-600">Discount</span>
              <span className="font-medium text-emerald-600">
                -${discount.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium text-foreground">
              {shipping === 0 ? (
                <span className="text-emerald-600">FREE</span>
              ) : (
                `$${shipping.toFixed(2)}`
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimated Tax</span>
            <span className="font-medium text-foreground">
              ${tax.toFixed(2)}
            </span>
          </div>
        </div>

        <Separator className="my-5" />

        {/* Total */}
        <div className="mb-5 flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">Total</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-foreground">
              ${total.toFixed(2)}
            </span>
            {discount > 0 && (
              <p className="text-xs text-emerald-600">
                You save ${discount.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          className="h-12 w-full gap-2 text-base font-semibold"
          onClick={onCheckout}
        >
          <Lock className="h-4 w-4" />
          Proceed to Checkout
        </Button>

        {/* Trust Badges */}
        <div className="mt-5 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>Secure Checkout</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>Fast Delivery</span>
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div
        className={cn(
          "h-1 w-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500",
        )}
        style={{ opacity: isHovered ? 1 : 0.3 }}
      />
    </div>
  );
};
