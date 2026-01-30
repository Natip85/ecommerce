"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  Package,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  XCircle,
} from "lucide-react";

import type { RouterOutputs } from "@ecommerce/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc";
import { OrderCard } from "../order/order-card";

// Map database order status to UI display status
type DbOrderStatus = RouterOutputs["order"]["getOrders"][number]["status"];
type DisplayStatus = "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
type FilterStatus = "all" | DisplayStatus;

const mapDbStatusToDisplay = (status: DbOrderStatus): DisplayStatus => {
  switch (status) {
    case "pending":
      return "processing";
    case "paid":
      return "delivered";
    case "failed":
    case "refunded":
    case "cancelled":
      return "cancelled";
    default:
      return "processing";
  }
};

const statusFilterConfig: {
  value: FilterStatus;
  label: string;
  icon: typeof Package;
}[] = [
  { value: "all", label: "All Orders", icon: ShoppingBag },
  { value: "processing", label: "Processing", icon: Clock },
  { value: "shipped", label: "Shipped", icon: Package },
  { value: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { value: "delivered", label: "Delivered", icon: CheckCircle2 },
  { value: "cancelled", label: "Cancelled", icon: XCircle },
];

export function HistoryList() {
  const trpc = useTRPC();
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: orders, isPending, isError } = useQuery(trpc.order.getOrders.queryOptions());

  // Transform orders for display and calculate status counts
  const { transformedOrders, statusCounts } = useMemo(() => {
    if (!orders) {
      return { transformedOrders: [], statusCounts: {} as Record<FilterStatus, number> };
    }

    const counts: Record<FilterStatus, number> = {
      all: orders.length,
      processing: 0,
      shipped: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };

    const transformed = orders.map((order) => {
      const displayStatus = mapDbStatusToDisplay(order.status);
      counts[displayStatus]++;

      // Transform shipping address to match OrderCard format
      const shippingAddress =
        order.shippingAddress ?
          {
            name: order.shippingAddress.name,
            address: [order.shippingAddress.line1, order.shippingAddress.line2]
              .filter(Boolean)
              .join(", "),
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            zip: order.shippingAddress.postalCode,
          }
        : undefined;

      return {
        orderId: order.id,
        orderDate: new Date(order.createdAt),
        status: displayStatus,
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        tax: order.tax,
        total: order.total,
        shippingAddress,
        // These could be added to the DB schema later for real tracking
        deliveredDate: order.paidAt ? new Date(order.paidAt) : undefined,
      };
    });

    return { transformedOrders: transformed, statusCounts: counts };
  }, [orders]);

  // Filter orders based on selected status and search query
  const filteredOrders = useMemo(() => {
    return transformedOrders.filter((order) => {
      const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
      const matchesSearch =
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item) =>
          item.productTitle.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesStatus && matchesSearch;
    });
  }, [transformedOrders, selectedStatus, searchQuery]);

  return (
    <div>
      {/* Header */}
      <div className="border-border bg-card border-b">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
              <Package className="text-primary h-6 w-6" />
            </div>
            <div>
              <h1 className="text-foreground text-2xl font-bold">Your Orders</h1>
              <p className="text-muted-foreground text-sm">
                Track, return, or buy again from your recent purchases
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Search and Filters Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search orders by ID or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pr-4 pl-10"
            />
          </div>

          {/* Filter Toggle (Mobile) */}
          <Button
            variant="outline"
            className="gap-2 bg-transparent sm:hidden"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", isFilterOpen && "rotate-180")}
            />
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <div className={cn("mb-6 overflow-x-auto", !isFilterOpen && "hidden sm:block")}>
          <div className="flex gap-2 pb-2">
            {statusFilterConfig.map((filter) => {
              const Icon = filter.icon;
              const isActive = selectedStatus === filter.value;
              const count = statusCounts[filter.value] ?? 0;

              return (
                <button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value)}
                  className={cn(
                    "group flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                    isActive ?
                      "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-primary-foreground" : (
                        "text-muted-foreground group-hover:text-foreground"
                      )
                    )}
                  />
                  <span>{filter.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      isActive ?
                        "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        {!isPending && !isError && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing <span className="text-foreground font-semibold">{filteredOrders.length}</span>{" "}
              {filteredOrders.length === 1 ? "order" : "orders"}
            </p>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span>Sort by:</span>
              <button className="text-foreground hover:text-primary flex items-center gap-1 font-medium">
                Most Recent
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Orders List */}
        {isPending ?
          <div className="border-border bg-card/50 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16">
            <Loader2 className="text-muted-foreground mb-4 h-8 w-8 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading your orders...</p>
          </div>
        : isError ?
          <div className="border-border bg-card/50 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16">
            <div className="bg-destructive/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <XCircle className="text-destructive h-8 w-8" />
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">Failed to load orders</h3>
            <p className="text-muted-foreground mb-6 max-w-sm text-center text-sm">
              Something went wrong while loading your orders. Please try again.
            </p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        : filteredOrders.length > 0 ?
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.orderId}
                {...order}
              />
            ))}
          </div>
        : /* Empty State */
          <div className="border-border bg-card/50 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16">
            <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Package className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">No orders found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm text-center text-sm">
              {searchQuery ?
                "Try adjusting your search or filters to find what you're looking for."
              : "You haven't placed any orders yet. Start shopping to see your orders here."}
            </p>
            <Button className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Start Shopping
            </Button>
          </div>
        }

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="bg-transparent"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <button className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium">
                1
              </button>
              <button className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium">
                2
              </button>
              <button className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium">
                3
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
