"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Eye,
  MapPin,
  Package,
  RefreshCcw,
  Truck,
  XCircle,
} from "lucide-react";

import type { RouterOutputs } from "@ecommerce/api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OrderStatus = "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";

type OrderItem = RouterOutputs["order"]["getOrder"]["items"][number];

type OrderCardProps = {
  orderId: string;
  orderDate: Date;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  deliveredDate?: Date;
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  onViewDetails?: (orderId: string) => void;
  onTrackOrder?: (orderId: string) => void;
  onReorder?: (orderId: string) => void;
};

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    icon: typeof Package;
    color: string;
    bgColor: string;
    step: number;
  }
> = {
  processing: {
    label: "Processing",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    step: 1,
  },
  shipped: {
    label: "Shipped",
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    step: 2,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    icon: Truck,
    color: "text-primary",
    bgColor: "bg-primary/10",
    step: 3,
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    step: 4,
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    step: 0,
  },
};

export function OrderCard({
  orderId,
  orderDate,
  status,
  items,
  subtotal,
  shipping,
  tax,
  total,
  trackingNumber,
  estimatedDelivery,
  deliveredDate,
  shippingAddress,
  onViewDetails,
  onTrackOrder,
  onReorder,
}: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  const handleCopyTracking = () => {
    if (trackingNumber) {
      void navigator.clipboard.writeText(trackingNumber);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className={cn(
        "group border-border bg-card relative overflow-hidden rounded-xl border transition-all duration-300",
        isHovered && "shadow-foreground/5 shadow-xl"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="border-border bg-muted/30 flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {/* Order Number */}
          <div>
            <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
              Order
            </p>
            <p className="text-foreground font-mono text-sm font-semibold">#{orderId}</p>
          </div>

          {/* Order Date */}
          <div>
            <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
              Placed on
            </p>
            <p className="text-foreground text-sm font-medium">{formatDate(orderDate)}</p>
          </div>

          {/* Total */}
          <div>
            <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
              Total
            </p>
            <p className="text-foreground text-sm font-bold">${(total / 100).toFixed(2)}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={cn("flex items-center gap-2 rounded-full px-3 py-1.5", statusInfo.bgColor)}>
          <StatusIcon className={cn("h-4 w-4", statusInfo.color)} />
          <span className={cn("text-xs font-semibold", statusInfo.color)}>{statusInfo.label}</span>
        </div>
      </div>

      {/* Status Progress (for non-cancelled orders) */}
      {status !== "cancelled" && (
        <div className="border-border bg-muted/20 border-b px-4 py-3">
          <div className="flex items-center justify-between">
            {["Processing", "Shipped", "Out for Delivery", "Delivered"].map((step, index) => {
              const stepNum = index + 1;
              const isCompleted = statusInfo.step >= stepNum;
              const isCurrent = statusInfo.step === stepNum;

              return (
                <div
                  key={step}
                  className="flex flex-1 items-center"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300",
                        isCompleted ?
                          "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30 bg-background text-muted-foreground/50",
                        isCurrent && "ring-primary/20 ring-4"
                      )}
                    >
                      {isCompleted ?
                        <Check className="h-3 w-3" />
                      : <span className="text-[10px] font-bold">{stepNum}</span>}
                    </div>
                    <span
                      className={cn(
                        "mt-1 hidden text-[10px] font-medium sm:block",
                        isCompleted ? "text-foreground" : "text-muted-foreground/50"
                      )}
                    >
                      {step}
                    </span>
                  </div>
                  {index < 3 && (
                    <div
                      className={cn(
                        "mx-1 h-0.5 flex-1 transition-all duration-300",
                        statusInfo.step > stepNum ? "bg-primary" : "bg-muted-foreground/20"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Delivery Info */}
          {estimatedDelivery && status !== "delivered" && (
            <p className="text-muted-foreground mt-3 text-center text-xs">
              Estimated delivery:{" "}
              <span className="text-foreground font-semibold">{formatDate(estimatedDelivery)}</span>
            </p>
          )}
          {deliveredDate && status === "delivered" && (
            <p className="mt-3 text-center text-xs text-emerald-600">
              Delivered on {formatDate(deliveredDate)}
            </p>
          )}
        </div>
      )}

      {/* Items Preview */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Stacked Images */}
          <div className="relative flex -space-x-3">
            {items.slice(0, 3).map((item, index) => (
              <div
                key={item.id}
                className="border-background bg-muted relative h-14 w-14 overflow-hidden rounded-lg border-2 shadow-sm"
                style={{ zIndex: 3 - index }}
              >
                <Image
                  src={item.imageUrl ?? "/placeholder.svg"}
                  alt={item.productTitle}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
            {items.length > 3 && (
              <div className="border-background bg-muted relative flex h-14 w-14 items-center justify-center rounded-lg border-2 shadow-sm">
                <span className="text-muted-foreground text-xs font-bold">+{items.length - 3}</span>
              </div>
            )}
          </div>

          {/* Items Summary */}
          <div className="flex-1">
            <p className="text-foreground line-clamp-1 text-sm font-medium">
              {items[0]?.productTitle}
              {items.length > 1 && (
                <span className="text-muted-foreground"> and {items.length - 1} more</span>
              )}
            </p>
            <p className="text-muted-foreground text-xs">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </p>
          </div>

          {/* Expand Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <span>{isExpanded ? "Hide" : "View"} items</span>
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Expanded Items List */}
        {isExpanded && (
          <div className="border-border mt-4 space-y-3 border-t pt-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3"
              >
                <div className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={item.imageUrl ?? "/placeholder.svg"}
                    alt={item.productTitle}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground line-clamp-1 text-sm font-medium">
                    {item.productTitle}
                  </p>
                  {item.variantTitle && (
                    <p className="text-muted-foreground text-xs">{item.variantTitle}</p>
                  )}
                  <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                </div>
                <p className="text-foreground text-sm font-semibold">
                  ${(item.total / 100).toFixed(2)}
                </p>
              </div>
            ))}

            {/* Order Breakdown */}
            <div className="border-border mt-4 space-y-2 border-t border-dashed pt-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">${(subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-foreground">
                  {shipping === 0 ?
                    <span className="text-emerald-600">FREE</span>
                  : `$${(shipping / 100).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-foreground">${(tax / 100).toFixed(2)}</span>
              </div>
              <div className="border-border flex justify-between border-t pt-2 text-sm font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">${(total / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Shipping Address */}
            {shippingAddress && (
              <div className="bg-muted/50 mt-4 rounded-lg p-3">
                <div className="mb-2 flex items-center gap-2">
                  <MapPin className="text-muted-foreground h-3 w-3" />
                  <span className="text-foreground text-xs font-semibold">Shipping Address</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {shippingAddress.name}
                  <br />
                  {shippingAddress.address}
                  <br />
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
                </p>
              </div>
            )}

            {/* Tracking Number */}
            {trackingNumber && (
              <div className="bg-muted/50 mt-3 flex items-center justify-between rounded-lg p-3">
                <div>
                  <p className="text-foreground text-xs font-semibold">Tracking Number</p>
                  <p className="text-muted-foreground font-mono text-xs">{trackingNumber}</p>
                </div>
                <button
                  onClick={handleCopyTracking}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-2 transition-colors"
                >
                  {copiedTracking ?
                    <Check className="h-4 w-4 text-emerald-600" />
                  : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="border-border bg-muted/20 flex flex-wrap items-center gap-2 border-t p-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent"
          onClick={() => onViewDetails?.(orderId)}
        >
          <Eye className="h-3 w-3" />
          View Details
        </Button>

        {status !== "cancelled" && status !== "delivered" && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent"
            onClick={() => onTrackOrder?.(orderId)}
          >
            <Truck className="h-3 w-3" />
            Track Order
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent"
          onClick={() => onReorder?.(orderId)}
        >
          <RefreshCcw className="h-3 w-3" />
          Reorder
        </Button>

        {status === "delivered" && (
          <Badge className="ml-auto bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        )}
      </div>

      {/* Hover accent line */}
      <div
        className={cn(
          "from-primary to-primary/60 absolute bottom-0 left-0 h-0.5 bg-linear-to-r transition-all duration-500",
          isHovered ? "w-full" : "w-0"
        )}
      />
    </div>
  );
}
