"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Package, ShoppingBag, XCircle } from "lucide-react";

import type { BreadcrumbPageType } from "@/components/breadcrumbs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { homeBreadcrumb } from "@/lib/breadcrumbs";
import { useCartStore } from "@/store";
import { useTRPC } from "@/trpc";

const orderBreadcrumbs: BreadcrumbPageType[] = [
  homeBreadcrumb,
  { href: "#", label: "Order Confirmation" },
];

type OrderConfirmationContentProps = {
  orderId: string;
};

export function OrderConfirmationContent({ orderId }: OrderConfirmationContentProps) {
  const trpc = useTRPC();
  const clearCart = useCartStore((state) => state.clearCart);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    ...trpc.order.getOrder.queryOptions({ orderId }),
    // Poll every 2 seconds while status is pending
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" ? 2000 : false;
    },
  });

  // Clear cart when order is confirmed as paid
  useEffect(() => {
    if (order?.status === "paid") {
      clearCart();
    }
  }, [order?.status, clearCart]);

  if (isLoading) {
    return (
      <main className="bg-background min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs pages={orderBreadcrumbs} />
        </div>
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="border-border bg-card rounded-xl border p-8">
            <div className="flex flex-col items-center text-center">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="mt-4 h-8 w-48" />
              <Skeleton className="mt-2 h-4 w-64" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="bg-background min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs pages={orderBreadcrumbs} />
        </div>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-destructive/10 mb-6 flex h-16 w-16 items-center justify-center rounded-full">
              <XCircle className="text-destructive h-8 w-8" />
            </div>
            <h1 className="text-foreground mb-2 text-2xl font-bold">Order Not Found</h1>
            <p className="text-muted-foreground mb-8 max-w-md">
              We couldn&apos;t find the order you&apos;re looking for. Please check the order ID and
              try again.
            </p>
            <Button asChild>
              <Link href="/shop?filterOpen=new">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      title: "Payment Processing",
      description: "Your payment is being processed. Please wait a moment.",
    },
    paid: {
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      title: "Order Confirmed!",
      description: "Thank you for your purchase. Your order has been confirmed.",
    },
    failed: {
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      title: "Payment Failed",
      description: "There was an issue processing your payment. Please try again.",
    },
    refunded: {
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      title: "Order Refunded",
      description: "This order has been refunded.",
    },
    cancelled: {
      icon: XCircle,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      title: "Order Cancelled",
      description: "This order has been cancelled.",
    },
  };

  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  return (
    <main className="bg-background">
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumbs pages={orderBreadcrumbs} />
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Status Banner */}
        <div className="border-border bg-card mb-8 rounded-xl border p-8">
          <div className="flex flex-col items-center text-center">
            <div
              className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${status.bgColor}`}
            >
              <StatusIcon className={`h-8 w-8 ${status.color}`} />
            </div>
            <h1 className="text-foreground mb-2 text-2xl font-bold">{status.title}</h1>
            <p className="text-muted-foreground max-w-md">{status.description}</p>
            <p className="text-muted-foreground mt-4 text-sm">
              Order ID: <span className="font-mono font-medium">{order.id}</span>
            </p>
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-6">
          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="border-border bg-card rounded-xl border p-6">
              <h2 className="text-foreground mb-4 text-lg font-semibold">Shipping Address</h2>
              <div className="text-muted-foreground text-sm">
                <p className="text-foreground font-medium">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.email}</p>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="border-border bg-card rounded-xl border p-6">
            <h2 className="text-foreground mb-4 text-lg font-semibold">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4"
                >
                  <div className="bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                    {item.imageUrl ?
                      <Image
                        src={item.imageUrl}
                        alt={item.productTitle}
                        fill
                        className="object-cover"
                      />
                    : <div className="flex h-full w-full items-center justify-center">
                        <Package className="text-muted-foreground h-8 w-8" />
                      </div>
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium">{item.productTitle}</p>
                    {item.variantTitle && (
                      <p className="text-muted-foreground text-sm">{item.variantTitle}</p>
                    )}
                    <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                      <span>Qty: {item.quantity}</span>
                      <span>·</span>
                      <span>${(item.priceAtPurchase / 100).toFixed(2)} each</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-medium">${(item.total / 100).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Order Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${(order.subtotal / 100).toFixed(2)}</span>
              </div>
              {order.shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${(order.shipping / 100).toFixed(2)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${(order.tax / 100).toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${(order.total / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="flex-1"
            >
              <Link href="/shop?filterOpen=new">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
            {order.status === "failed" && (
              <Button
                variant="outline"
                asChild
                className="flex-1"
              >
                <Link href="/cart">Try Again</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
