"use client";

import {
  Heart,
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  Truck,
  RotateCcw,
  Shield,
  Share2,
  Minus,
  Plus,
  ZoomIn,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";


import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProductVariant {
  id: string;
  name: string;
  value: string;
  image?: string;
  inStock?: boolean;
}

interface ProductImage {
  id: string;
  src: string;
  alt: string;
}

interface ProductReview {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified?: boolean;
  helpful?: number;
}

interface ProductDetailProps {
  images: ProductImage[];
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  inStock?: boolean;
  stockCount?: number;
  sku?: string;
  brand?: string;
  colors?: ProductVariant[];
  sizes?: ProductVariant[];
  features?: string[];
  specifications?: Record<string, string>;
  reviews?: ProductReview[];
  isWishlisted?: boolean;
  cartQuantity?: number;
  onAddToCart?: (quantity: number, variants: Record<string, string>) => void;
  onUpdateCartQuantity?: (quantity: number) => void;
  onWishlist?: () => void;
  onViewCart?: () => void;
}

export function ProductDetailsComponents({
  images,
  title,
  description,
  price,
  originalPrice,
  rating = 4.5,
  reviewCount = 128,
  badge,
  inStock = true,
  stockCount,
  sku,
  brand,
  colors = [],
  sizes = [],
  features = [],
  specifications = {},
  reviews = [],
  isWishlisted = false,
  cartQuantity = 0,
  onAddToCart,
  onUpdateCartQuantity,
  onWishlist,
  onViewCart,
}: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [selectedColor, setSelectedColor] = useState(colors[0]?.id || "");
  const [selectedSize, setSelectedSize] = useState(sizes[0]?.id || "");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleWishlist = () => {
    onWishlist?.();
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) =>
      Math.max(1, Math.min(prev + delta, stockCount || 99)),
    );
  };

  const handleAddToCartClick = () => {
    if (!showQuantitySelector) {
      setShowQuantitySelector(true);
    } else {
      onAddToCart?.(quantity, {
        color: selectedColor,
        size: selectedSize,
      });
      setShowQuantitySelector(false);
      setQuantity(1);
    }
  };

  const handleCancelQuantity = () => {
    setShowQuantitySelector(false);
    setQuantity(1);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image Gallery */}
        <div className="flex flex-col gap-4">
          {/* Main Image */}
          <div
            className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            <Image
              src={images[selectedImage]?.src || "/placeholder.svg"}
              alt={images[selectedImage]?.alt || title}
              fill
              className={cn(
                "object-cover transition-transform duration-300",
                isZoomed && "scale-150",
              )}
              style={
                isZoomed
                  ? {
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    }
                  : undefined
              }
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-lg backdrop-blur-sm transition-all hover:bg-background hover:scale-110"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 shadow-lg backdrop-blur-sm transition-all hover:bg-background hover:scale-110"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Zoom Indicator */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm">
              <ZoomIn className="h-3.5 w-3.5" />
              Hover to zoom
            </div>

            {/* Badges */}
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              {badge && (
                <Badge className="bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                  {badge}
                </Badge>
              )}
              {discount > 0 && (
                <Badge className="bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white">
                  -{discount}%
                </Badge>
              )}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                    selectedImage === index
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          {/* Brand & Title */}
          {brand && (
            <span className="mb-1 text-sm font-medium text-primary">
              {brand}
            </span>
          )}
          <h1 className="mb-3 text-2xl font-bold text-foreground lg:text-3xl">
            {title}
          </h1>

          {/* Rating & Reviews */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Math.floor(rating)
                      ? "fill-amber-400 text-amber-400"
                      : i < rating
                        ? "fill-amber-400/50 text-amber-400"
                        : "fill-muted text-muted",
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">
              {rating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({reviewCount.toLocaleString()} reviews)
            </span>
            {sku && (
              <>
                <span className="text-muted-foreground">|</span>
                <span className="text-sm text-muted-foreground">
                  SKU: {sku}
                </span>
              </>
            )}
          </div>

          {/* Price Section */}
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground">
                ${price.toFixed(2)}
              </span>
              {originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  ${originalPrice.toFixed(2)}
                </span>
              )}
              {discount > 0 && (
                <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                  Save {discount}%
                </Badge>
              )}
            </div>
            {discount > 0 && (
              <p className="mt-1 text-sm font-medium text-emerald-500">
                You save ${(originalPrice! - price).toFixed(2)}
              </p>
            )}
          </div>

          {/* Stock Status */}
          <div className="mb-6 flex items-center gap-2">
            {inStock ? (
              <>
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-emerald-500">
                  In Stock
                </span>
                {stockCount && stockCount <= 10 && (
                  <span className="text-sm text-amber-500">
                    - Only {stockCount} left!
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="flex h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-red-500">
                  Out of Stock
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="mb-6 leading-relaxed text-muted-foreground">
            {description}
          </p>

          {/* Color Variants */}
          {colors.length > 0 && (
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Color
                </span>
                <span className="text-sm text-muted-foreground">
                  {colors.find((c) => c.id === selectedColor)?.name}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.id)}
                    disabled={color.inStock === false}
                    className={cn(
                      "group/color relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all",
                      selectedColor === color.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50",
                      color.inStock === false &&
                        "opacity-40 cursor-not-allowed",
                    )}
                    title={color.name}
                  >
                    <span
                      className="h-9 w-9 rounded-full"
                      style={{ backgroundColor: color.value }}
                    />
                    {selectedColor === color.id && (
                      <Check
                        className={cn(
                          "absolute h-4 w-4",
                          ["#ffffff", "#fff", "white", "#f5f5f5"].includes(
                            color.value.toLowerCase(),
                          )
                            ? "text-foreground"
                            : "text-white",
                        )}
                      />
                    )}
                    {color.inStock === false && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="h-px w-10 rotate-45 bg-muted-foreground" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Variants */}
          {sizes.length > 0 && (
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Size
                </span>
                <button className="text-sm text-primary hover:underline">
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    disabled={size.inStock === false}
                    className={cn(
                      "flex h-10 min-w-[48px] items-center justify-center rounded-lg border px-4 text-sm font-medium transition-all",
                      selectedSize === size.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50",
                      size.inStock === false &&
                        "cursor-not-allowed opacity-40 line-through",
                    )}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {/* Wishlist Button */}
            <button
              onClick={handleWishlist}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border border-border transition-all hover:border-red-300 hover:bg-red-50",
                isWishlisted && "border-red-300 bg-red-50 text-red-500",
              )}
            >
              <Heart
                className={cn("h-5 w-5", isWishlisted && "fill-current")}
              />
            </button>

            {/* Share Button */}
            <button className="flex h-11 w-11 items-center justify-center rounded-full border border-border transition-all hover:bg-muted">
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          {/* Add to Cart */}
          <div className="mb-8">
            {cartQuantity > 0 ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Cart Quantity Adjuster */}
                <div className="flex items-center rounded-full border border-border bg-muted/50">
                  <button
                    onClick={() => onUpdateCartQuantity?.(cartQuantity - 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-l-full transition-colors hover:bg-muted"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex h-11 w-12 items-center justify-center text-sm font-medium">
                    {cartQuantity}
                  </span>
                  <button
                    onClick={() => onUpdateCartQuantity?.(cartQuantity + 1)}
                    disabled={cartQuantity >= (stockCount || 99)}
                    className="flex h-11 w-11 items-center justify-center rounded-r-full transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  size="lg"
                  className="flex-1 gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={onViewCart}
                >
                  <ShoppingCart className="h-5 w-5" />
                  View Cart
                </Button>
              </div>
            ) : showQuantitySelector ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Quantity Selector */}
                <div className="flex items-center rounded-full border border-border bg-muted/50">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="flex h-11 w-11 items-center justify-center rounded-l-full transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex h-11 w-12 items-center justify-center text-sm font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (stockCount || 99)}
                    className="flex h-11 w-11 items-center justify-center rounded-r-full transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-1 gap-2">
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 rounded-full bg-transparent"
                    onClick={handleCancelQuantity}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleAddToCartClick}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Confirm
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleAddToCartClick}
                disabled={!inStock}
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">
                Free Shipping
              </span>
              <span className="text-xs text-muted-foreground">Orders $50+</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <RotateCcw className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">
                Easy Returns
              </span>
              <span className="text-xs text-muted-foreground">
                30-Day Policy
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">
                Secure Checkout
              </span>
              <span className="text-xs text-muted-foreground">
                SSL Encrypted
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-12">
        <Tabs defaultValue="shipping" className="w-full">
          <TabsList className="w-full justify-start gap-2 overflow-x-auto border-b border-border bg-transparent p-0">
            {features.length > 0 && (
              <TabsTrigger
                value="features"
                className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Features
              </TabsTrigger>
            )}
            {Object.keys(specifications).length > 0 && (
              <TabsTrigger
                value="specifications"
                className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Specifications
              </TabsTrigger>
            )}
            {(reviews.length > 0 || reviewCount > 0) && (
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Reviews ({reviewCount})
              </TabsTrigger>
            )}
            <TabsTrigger
              value="shipping"
              className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Shipping & Returns
            </TabsTrigger>
          </TabsList>

          {features.length > 0 && (
            <TabsContent value="features" className="mt-6">
              <ul className="grid gap-3 md:grid-cols-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3 w-3 text-primary" />
                    </span>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
          )}

          {Object.keys(specifications).length > 0 && (
            <TabsContent value="specifications" className="mt-6">
              <div className="overflow-hidden rounded-lg border border-border">
                {Object.entries(specifications).map(([key, value], index) => (
                  <div
                    key={key}
                    className={cn(
                      "flex",
                      index % 2 === 0 ? "bg-muted/30" : "bg-background",
                    )}
                  >
                    <span className="w-1/3 border-r border-border px-4 py-3 text-sm font-medium text-foreground">
                      {key}
                    </span>
                    <span className="flex-1 px-4 py-3 text-sm text-muted-foreground">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}

          {(reviews.length > 0 || reviewCount > 0) && (
            <TabsContent value="reviews" className="mt-6">
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            {review.avatar ? (
                              <Image
                                src={review.avatar || "/placeholder.svg"}
                                alt={review.author}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <span className="text-sm font-semibold text-primary">
                                {review.author.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {review.author}
                              </span>
                              {review.verified && (
                                <Badge variant="secondary" className="text-xs">
                                  Verified Purchase
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {review.date}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-3.5 w-3.5",
                                i < review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-muted text-muted",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      {review.title && (
                        <h4 className="mb-2 font-medium text-foreground">
                          {review.title}
                        </h4>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {review.content}
                      </p>
                      {review.helpful !== undefined && (
                        <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
                          <span className="text-xs text-muted-foreground">
                            {review.helpful} people found this helpful
                          </span>
                          <button className="text-xs text-primary hover:underline">
                            Helpful
                          </button>
                          <button className="text-xs text-muted-foreground hover:text-foreground">
                            Report
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <p className="mb-4 text-muted-foreground">
                    No reviews yet. Be the first to review this product!
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-full bg-transparent"
                  >
                    Write a Review
                  </Button>
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="shipping" className="mt-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="shipping">
                <AccordionTrigger className="hover:no-underline">
                  Shipping Information
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      We offer free standard shipping on all orders over $50.
                      Orders are processed within 1-2 business days.
                    </p>
                    <ul className="list-inside list-disc space-y-1">
                      <li>Standard Shipping (5-7 business days): $4.99</li>
                      <li>Express Shipping (2-3 business days): $9.99</li>
                      <li>Next Day Delivery: $14.99</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="returns">
                <AccordionTrigger className="hover:no-underline">
                  Returns & Exchanges
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      We accept returns within 30 days of purchase for a full
                      refund. Items must be in original condition with tags
                      attached.
                    </p>
                    <p>
                      To initiate a return, please contact our customer service
                      team or visit your account page.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="warranty">
                <AccordionTrigger className="hover:no-underline">
                  Warranty
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground">
                    All products come with a 1-year manufacturer warranty
                    against defects. Extended warranty options are available at
                    checkout.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
