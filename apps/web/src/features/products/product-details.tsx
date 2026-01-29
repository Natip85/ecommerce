"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ProductDetailsComponents } from "./product-details-components";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { createProductDetailBreadcrumbs } from "@/lib/breadcrumbs";
import {
  cartStore,
  wishlistStore,
  useWishlistStore,
  useCartStore,
} from "@/store";
import { useTRPC } from "@/trpc";

interface ProductDetailsProps {
  id: string;
}

export default function ProductDetails({ id }: ProductDetailsProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const {
    data: product,
    isLoading,
    error,
  } = useQuery(trpc.product.getByIdPublic.queryOptions({ id }));

  // Subscribe to wishlist items for reactivity
  const wishlistItems = useWishlistStore((state) => state.items);

  // Subscribe to cart items for reactivity
  const cartItems = useCartStore((state) => state.items);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ProductDetailsSkeleton />
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className=" ">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Product Not Found
            </h1>
            <p className="mt-2 text-muted-foreground">
              The product you&apos;re looking for doesn&apos;t exist or is no
              longer available.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-block text-primary hover:underline"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* Breadcrumbs */}
      <div className="flex flex-1 flex-col gap-4 py-6 px-2">
        <Breadcrumbs
          pages={createProductDetailBreadcrumbs(product.id, product.title)}
        />
      </div>
      {/* Product Detail */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProductDetailsComponents
          productId={product.id}
          images={product.images}
          title={product.title}
          description={product.description}
          price={product.price}
          originalPrice={product.originalPrice}
          inStock={product.inStock}
          stockCount={product.stockCount}
          sku={product.sku}
          brand={product.brand}
          options={product.options.map((opt) => ({
            id: opt.id,
            name: opt.name,
            values: opt.values.map((v) => v.value),
          }))}
          variants={product.variants.map((v) => ({
            id: v.id,
            optionValues: v.optionValues,
            price: String(v.price),
            compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : null,
            sku: v.sku,
            inventoryQuantity: v.inventoryQuantity,
          }))}
          // Empty arrays for features we're skipping for now
          features={[]}
          specifications={{}}
          reviews={[]}
          reviewCount={0}
          isWishlisted={Boolean(wishlistItems[product.id])}
          cartItems={cartItems}
          onAddToCart={(quantity, selectedVariant) => {
            cartStore.getState().addItem(
              {
                productId: product.id,
                variantId: selectedVariant?.id,
                variantOptions: selectedVariant?.optionValues ?? {},
                title: product.title,
                description: product.description,
                price: selectedVariant?.price
                  ? parseFloat(selectedVariant.price)
                  : product.price,
                compareAtPrice: selectedVariant?.compareAtPrice
                  ? parseFloat(selectedVariant.compareAtPrice)
                  : product.originalPrice,
                imageUrl: product.images[0]?.src,
              },
              quantity,
            );
          }}
          onUpdateCartQuantity={(cartItemId, newQuantity) => {
            if (newQuantity <= 0) {
              cartStore.getState().removeItem(cartItemId);
            } else {
              cartStore.getState().updateQuantity(cartItemId, newQuantity);
            }
          }}
          onWishlist={() => {
            wishlistStore.getState().toggleItem({
              productId: product.id,
              title: product.title,
              price: product.price,
              compareAtPrice: product.originalPrice,
              imageUrl: product.images[0]?.src,
            });
          }}
          onViewCart={() => {
            router.push("/cart");
          }}
        />
      </div>
    </main>
  );
}

function ProductDetailsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image Gallery Skeleton */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
          <div className="flex gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 w-20 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="flex flex-col gap-4">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-20 w-full animate-pulse rounded bg-muted" />
          <div className="h-12 w-full animate-pulse rounded bg-muted" />
          <div className="h-12 w-full animate-pulse rounded bg-muted" />
          <div className="flex gap-3">
            <div className="h-12 flex-1 animate-pulse rounded-full bg-muted" />
            <div className="h-12 flex-1 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
