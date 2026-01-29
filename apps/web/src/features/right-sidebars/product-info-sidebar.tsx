"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import {
  Check,
  Eye,
  Heart,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Star,
  Tag,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";

import { useSidebarParams } from "./query-params";

import type { Route } from "next";

import {
  VariantSelector,
  type ProductVariant,
} from "@/components/product/variant-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { cartStore, useCartStore } from "@/store/cart-store";
import { useTRPC } from "@/trpc";

// =============================================================================
// LOADING SKELETON
// =============================================================================

const ProductInfoSkeleton = () => (
  <div className="flex h-full flex-col">
    <div className="flex items-center justify-between border-b p-4">
      <Skeleton className="h-9 w-32" />
    </div>
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-20 w-full" />
    </div>
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ProductInfoSidebar = () => {
  const trpc = useTRPC();
  const {
    sidebarParams: { infoId },
  } = useSidebarParams();

  const { data, isFetching } = useQuery(
    trpc.product.getById.queryOptions(
      infoId ? { productId: infoId } : skipToken,
    ),
  );

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );

  // Handle variant selection change
  const handleVariantChange = useCallback((variant: ProductVariant | null) => {
    setSelectedVariant(variant);
  }, []);

  if (isFetching) {
    return <ProductInfoSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Product not found</p>
      </div>
    );
  }

  // Get the defaultVariant from API (full variant data with inventory info)
  const defaultVariant = data.defaultVariant;

  // Transform variants for the VariantSelector component
  // Note: The API returns a minimal format for variants (id, optionValues, price, sku, quantity)
  // We use available data and derive inventory info from quantity
  const transformedVariants: ProductVariant[] = (data.variants ?? []).map(
    (v) => ({
      id: v.id,
      optionValues: v.optionValues as Record<string, string>,
      price: v.price ?? "0",
      compareAtPrice: null, // Not available in the transformed data
      sku: v.sku,
      inventoryQuantity: v.quantity ? parseInt(v.quantity, 10) : null,
      inventoryTracked: defaultVariant?.inventoryTracked ?? true,
      continueSellingWhenOutOfStock:
        defaultVariant?.continueSellingWhenOutOfStock ?? false,
    }),
  );

  // Use selected variant if available, otherwise fall back to default
  const activeVariant =
    selectedVariant ??
    (defaultVariant
      ? {
          id: defaultVariant.id,
          optionValues:
            (defaultVariant.optionValues as Record<string, string>) ?? {},
          price: defaultVariant.price ?? "0",
          compareAtPrice: defaultVariant.compareAtPrice,
          sku: defaultVariant.sku,
          inventoryQuantity: defaultVariant.inventoryQuantity,
          inventoryTracked: defaultVariant.inventoryTracked,
          continueSellingWhenOutOfStock:
            defaultVariant.continueSellingWhenOutOfStock,
        }
      : null);

  // Calculate pricing info from active variant
  const price = activeVariant ? Number(activeVariant.price) : 0;
  const compareAtPrice = activeVariant?.compareAtPrice
    ? Number(activeVariant.compareAtPrice)
    : null;
  const discount =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  // Check stock status from active variant
  const inventoryQty = activeVariant?.inventoryQuantity ?? 0;
  const inventoryTracked = activeVariant?.inventoryTracked ?? true;
  const continueWhenOut = activeVariant?.continueSellingWhenOutOfStock ?? false;
  const isInStock = !inventoryTracked || inventoryQty > 0 || continueWhenOut;

  const mainImage = data.images?.[selectedImageIndex] ?? data.images?.[0];
  // API returns tags as string array directly
  const tags = data.tags ?? [];
  const productUrl = `/shop/${infoId}` as Route;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Button asChild variant="secondary" size="sm" className="gap-1.5">
          <Link href={productUrl}>
            <Eye className="h-3.5 w-3.5" />
            View Product Details
          </Link>
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Image Gallery */}
        <div className="relative">
          {/* Main Image */}
          <div className="relative aspect-square bg-muted">
            {mainImage ? (
              <Image
                src={mainImage.url}
                alt={mainImage.alt ?? data.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}

            {/* Discount Badge */}
            {discount > 0 && (
              <Badge className="absolute left-3 top-3 rounded-md  ">
                -{discount}% OFF
              </Badge>
            )}

            {/* Wishlist Button */}
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className={cn(
                "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur-sm transition-all hover:scale-110",
                isWishlisted && "bg-red-50 text-red-500 dark:bg-red-950",
              )}
            >
              <Heart
                className={cn("h-4 w-4", isWishlisted && "fill-current")}
              />
            </button>
          </div>

          {/* Thumbnail Strip */}
          {data.images && data.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3">
              {data.images.slice(0, 5).map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-all",
                    selectedImageIndex === idx
                      ? "border-primary"
                      : "border-transparent opacity-60 hover:opacity-100",
                  )}
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? `${data.title} ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
              {data.images.length > 5 && (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                  +{data.images.length - 5}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-4 p-4">
          {/* Vendor & Product Type */}
          {(data.vendor || data.productType) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {data.vendor && <span>{data.vendor}</span>}
              {data.vendor && data.productType && <span>•</span>}
              {data.productType && <span>{data.productType}</span>}
            </div>
          )}

          {/* Title */}
          <h2 className="text-xl font-semibold leading-tight">{data.title}</h2>

          {/* Rating (placeholder - can be connected to reviews later) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < 4
                      ? "fill-amber-400 text-amber-400"
                      : "fill-muted text-muted",
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">(128 reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold">${price.toFixed(2)}</span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-base text-muted-foreground line-through">
                ${compareAtPrice.toFixed(2)}
              </span>
            )}
            {discount > 0 && compareAtPrice && (
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Save ${(compareAtPrice - price).toFixed(2)}
              </span>
            )}
          </div>

          <Separator />

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isInStock ? "bg-emerald-500" : "bg-red-500",
              )}
            />
            <span
              className={cn(
                "text-sm font-medium",
                isInStock
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {isInStock ? "In Stock" : "Out of Stock"}
            </span>
            {isInStock &&
              inventoryTracked &&
              inventoryQty > 0 &&
              inventoryQty <= 10 && (
                <span className="text-xs text-muted-foreground">
                  (Only {inventoryQty} left)
                </span>
              )}
          </div>

          {/* Description */}
          {data.description && (
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {data.description}
            </p>
          )}

          {/* Variant Selector */}
          {data.options &&
            data.options.length > 0 &&
            transformedVariants.length > 0 && (
              <VariantSelector
                options={data.options}
                variants={transformedVariants}
                selectedVariant={activeVariant}
                onVariantChange={handleVariantChange}
              />
            )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              {tags.slice(0, 5).map((tagValue) => (
                <Badge
                  key={tagValue}
                  variant="secondary"
                  className="rounded-md text-xs"
                >
                  {tagValue}
                </Badge>
              ))}
              {tags.length > 5 && (
                <span className="text-xs text-muted-foreground">
                  +{tags.length - 5} more
                </span>
              )}
            </div>
          )}

          <Separator />

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>Free shipping over $50</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Easy returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <SidebarCartFooter
        productId={infoId ?? undefined}
        variantId={activeVariant?.id}
        variantOptions={activeVariant?.optionValues}
        title={data.title}
        description={data.description ?? undefined}
        price={price}
        compareAtPrice={compareAtPrice ?? undefined}
        imageUrl={mainImage?.url}
        isInStock={isInStock}
      />
    </div>
  );
};

// =============================================================================
// CART FOOTER COMPONENT
// =============================================================================

type SidebarCartFooterProps = {
  productId?: string;
  variantId?: string;
  variantOptions?: Record<string, string>;
  title: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  isInStock: boolean;
};

const getCartItemId = (productId: string, variantId?: string) =>
  `${productId}-${variantId || "default"}`;

const SidebarCartFooter = ({
  productId,
  variantId,
  variantOptions,
  title,
  description,
  price,
  compareAtPrice,
  imageUrl,
  isInStock,
}: SidebarCartFooterProps) => {
  const cartItemId = productId ? getCartItemId(productId, variantId) : null;

  // Get cart item info - this is a hook that subscribes to cart changes
  const cartItem = useCartStore((state) =>
    cartItemId ? state.getItem(cartItemId) : undefined,
  );
  const isItemInCart = Boolean(cartItem);

  const handleAddToCart = () => {
    if (!productId) return;
    cartStore.getState().addItem({
      productId,
      variantId,
      variantOptions,
      title,
      description,
      price,
      compareAtPrice,
      imageUrl,
    });
  };

  const handleIncrement = () => {
    if (cartItemId) {
      cartStore.getState().incrementQuantity(cartItemId);
    }
  };

  const handleDecrement = () => {
    if (cartItemId) {
      cartStore.getState().decrementQuantity(cartItemId);
    }
  };

  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        {isItemInCart && cartItem ? (
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">In Cart</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={handleDecrement}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-8 text-center text-sm font-semibold">
                  {cartItem.quantity}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  onClick={handleIncrement}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button variant="secondary" className="w-full" size="lg" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-4 w-4" />
                Go to Cart
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 gap-2 flex-col">
            <Button
              className="w-full"
              size="lg"
              disabled={!isInStock}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </Button>
            <Button variant="secondary" className="w-full" size="lg" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-4 w-4" />
                Go to Cart
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
