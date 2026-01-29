"use client";

import {
  Heart,
  ShoppingCart,
  Star,
  Eye,
  Check,
  Plus,
  Minus,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

import type { RouterOutputs } from "@ecommerce/api";
import type { Route } from "next";

import { cn } from "@/lib/utils";
import { useCartStore } from "@/store";

// =============================================================================
// TYPES
// =============================================================================

export type ProductCardData =
  RouterOutputs["product"]["storefront"]["items"][number];

type ProductCardContextType = {
  productId?: string;
  variantId?: string;
  isHovered: boolean;
  setIsHovered: (value: boolean) => void;
  isWishlisted: boolean;
  setIsWishlisted: (value: boolean) => void;
};

const ProductCardContext = createContext<ProductCardContextType | null>(null);

const useProductCard = () => {
  const context = useContext(ProductCardContext);
  if (!context) {
    throw new Error("ProductCard components must be used within a ProductCard");
  }
  return context;
};

// =============================================================================
// ROOT COMPONENT
// =============================================================================

export type ProductCardProps = {
  children: React.ReactNode;
  productId?: string;
  variantId?: string;
  href?: Route;
  className?: string;
  onClick?: () => void;
};

export const ProductCard = ({
  children,
  productId,
  variantId,
  href,
  className,
  onClick,
}: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const cardContent = (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-xl hover:shadow-foreground/5",
        (href || onClick) && "cursor-pointer",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {children}

      {/* Bottom Progress Bar */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-linear-to-r from-primary to-primary/60 transition-all duration-500"
          style={{ width: isHovered ? "100%" : "0%" }}
        />
      </div>
    </div>
  );

  return (
    <ProductCardContext.Provider
      value={{
        productId,
        variantId,
        isHovered,
        setIsHovered,
        isWishlisted,
        setIsWishlisted,
      }}
    >
      {href ? <Link href={href}>{cardContent}</Link> : cardContent}
    </ProductCardContext.Provider>
  );
};

// =============================================================================
// IMAGE SECTION
// =============================================================================

export type ProductCardImageProps = {
  src?: string | null;
  alt: string;
  badge?: string | null;
  discount?: number;
  inStock?: boolean;
  onQuickView?: () => void;
  onAddToCart?: () => void;
  onWishlist?: () => void;
};

// Flying cart animation component
const FlyingCartIcon = ({
  startPos,
  onComplete,
}: {
  startPos: { x: number; y: number };
  onComplete: () => void;
}) => {
  const [mounted, setMounted] = useState(false);
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    setMounted(true);
    const cartIcon = document.getElementById("header-cart-icon");
    if (cartIcon) {
      const rect = cartIcon.getBoundingClientRect();
      setTargetPos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }, []);

  if (!mounted || !targetPos) return null;

  return createPortal(
    <motion.div
      className="pointer-events-none fixed z-9999 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      initial={{
        left: startPos.x,
        top: startPos.y,
        x: "-50%",
        y: "-50%",
        scale: 1,
        opacity: 1,
      }}
      animate={{
        left: targetPos.x,
        top: targetPos.y,
        scale: 0.4,
        opacity: 0,
      }}
      transition={{
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
        scale: { duration: 0.65, ease: "easeIn" },
        opacity: { duration: 0.5, delay: 0.15 },
      }}
      onAnimationComplete={onComplete}
    >
      <ShoppingCart className="h-4 w-4" />
    </motion.div>,
    document.body,
  );
};

export const ProductCardImage = ({
  src,
  alt,
  badge,
  discount,
  inStock = true,
  onQuickView,
  onAddToCart,
  onWishlist,
}: ProductCardImageProps) => {
  const { isHovered, isWishlisted, setIsWishlisted, productId, variantId } =
    useProductCard();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStartPos, setAnimationStartPos] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Check if item is in cart
  const isInCart = useCartStore((state) =>
    productId ? state.isInCart(productId, variantId) : false,
  );

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    onWishlist?.();
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only animate if not already in cart
    if (!isInCart && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setAnimationStartPos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setIsAnimating(true);
    }

    onAddToCart?.();
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.();
  };

  return (
    <div className="relative aspect-square overflow-hidden bg-muted">
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        fill
        className={cn(
          "object-cover transition-transform duration-500",
          isHovered && "scale-110",
        )}
      />

      {/* Overlay Actions */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-2 bg-foreground/10 opacity-0 backdrop-blur-xs transition-opacity duration-300",
          isHovered && "opacity-100",
        )}
      >
        <Button
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-full shadow-lg transition-transform hover:scale-110"
          asChild
        >
          <Link
            href={`/shop/${productId}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          ref={buttonRef}
          size="icon"
          variant={isInCart ? "default" : "secondary"}
          className={cn(
            "h-10 w-10 rounded-full shadow-lg transition-all hover:scale-110 disabled:opacity-100",
            isInCart && "bg-primary hover:bg-primary/50",
          )}
          onClick={handleAddToCart}
          disabled={!inStock || isInCart}
        >
          {isInCart ? (
            <Check className="h-4 w-4" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Flying animation */}
      {isAnimating && (
        <FlyingCartIcon
          startPos={animationStartPos}
          onComplete={() => setIsAnimating(false)}
        />
      )}

      {/* Wishlist Button */}
      <button
        onClick={handleWishlist}
        className={cn(
          "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110",
          isWishlisted && "bg-red-50 text-red-500 dark:bg-red-950",
        )}
      >
        <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
      </button>

      {/* Badges */}
      <div className="absolute left-3 top-3 flex flex-col gap-1.5">
        {badge && (
          <Badge className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            {badge}
          </Badge>
        )}
        {!!discount && discount > 0 && (
          <Badge className="rounded-md  px-2 py-0.5 text-xs font-medium ">
            -{discount}%
          </Badge>
        )}
      </div>

      {/* Out of Stock Overlay */}
      {!inStock && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <span className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
            Out of Stock
          </span>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// CONTENT SECTION
// =============================================================================

export type ProductCardContentProps = {
  title: string;
  description?: string | null;
  rating?: number;
  reviewCount?: number;
  className?: string;
};

export const ProductCardContent = ({
  title,
  description,
  rating = 4.5,
  reviewCount = 128,
  className,
}: ProductCardContentProps) => {
  return (
    <div className={cn("flex flex-1 flex-col p-4", className)}>
      {/* Rating */}
      <div className="mb-2 flex items-center gap-1.5">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-3.5 w-3.5",
                i < Math.floor(rating)
                  ? "fill-amber-400 text-amber-400"
                  : i < rating
                    ? "fill-amber-400/50 text-amber-400"
                    : "fill-muted text-muted",
              )}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          ({reviewCount.toLocaleString()})
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-1 line-clamp-2 text-balance text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
};

// =============================================================================
// FOOTER SECTION
// =============================================================================

export type ProductCardFooterProps = {
  price: number;
  compareAtPrice?: number | null;
  inStock?: boolean;
  onAddToCart?: () => void;
  className?: string;
};

// Helper to generate cart item ID (matches cart store logic)
const getCartItemId = (productId: string, variantId?: string) =>
  `${productId}-${variantId || "default"}`;

// Quantity control component for when item is in cart
const CartQuantityControl = ({
  itemId,
  quantity,
  onIncrement,
}: {
  itemId: string;
  quantity: number;
  onIncrement: () => void;
}) => {
  const incrementQuantity = useCartStore((state) => state.incrementQuantity);
  const decrementQuantity = useCartStore((state) => state.decrementQuantity);

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    decrementQuantity(itemId);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    incrementQuantity(itemId);
    onIncrement();
  };

  return (
    <div className="flex h-8 items-center gap-1 rounded-full border px-1">
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 rounded-full"
        onClick={handleDecrement}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="min-w-6 text-center text-xs font-semibold ">
        {quantity}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 rounded-full "
        onClick={handleIncrement}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
};

export const ProductCardFooter = ({
  price,
  compareAtPrice,
  inStock = true,
  onAddToCart,
  className,
}: ProductCardFooterProps) => {
  const { productId, variantId } = useProductCard();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStartPos, setAnimationStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const cartItemId = productId ? getCartItemId(productId, variantId) : null;

  // Get cart item info
  const cartItem = useCartStore((state) =>
    cartItemId ? state.getItem(cartItemId) : undefined,
  );
  const isInCart = Boolean(cartItem);

  const discount =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only animate if not already in cart
    if (!isInCart && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setAnimationStartPos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setIsAnimating(true);
    }

    onAddToCart?.();
  };

  const triggerFlyAnimation = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setAnimationStartPos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setIsAnimating(true);
    }
  };

  return (
    <div
      className={cn(
        "flex gap-2 items-end justify-between px-4 pb-4",
        className,
      )}
    >
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-foreground">
            ${price.toFixed(2)}
          </span>
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-sm text-muted-foreground line-through">
              ${compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>
        {discount > 0 && compareAtPrice && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            You save ${(compareAtPrice - price).toFixed(2)}
          </span>
        )}
      </div>

      {/* Cart controls */}
      <div ref={containerRef}>
        {isInCart && cartItemId && cartItem ? (
          <CartQuantityControl
            itemId={cartItemId}
            quantity={cartItem.quantity}
            onIncrement={triggerFlyAnimation}
          />
        ) : (
          <Button
            size="sm"
            className="h-8 gap-1.5 rounded-full border-primary/20 bg-transparent px-3 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            onClick={handleAddToCart}
            disabled={!inStock}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add
          </Button>
        )}
      </div>

      {/* Flying animation */}
      {isAnimating && (
        <FlyingCartIcon
          startPos={animationStartPos}
          onComplete={() => setIsAnimating(false)}
        />
      )}
    </div>
  );
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Calculate discount percentage from prices */
export const calcDiscount = (price: number, compareAtPrice?: number | null) => {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
};

/** Check if product is in stock based on variant data */
export const isInStock = (variant?: {
  inventoryQuantity?: number | null;
  inventoryTracked?: boolean | null;
  continueSellingWhenOutOfStock?: boolean | null;
}): boolean => {
  if (!variant) return true;
  const inventoryQuantity = variant.inventoryQuantity ?? 0;
  const inventoryTracked = variant.inventoryTracked ?? true;
  const continueSellingWhenOutOfStock =
    variant.continueSellingWhenOutOfStock ?? false;
  return (
    !inventoryTracked || inventoryQuantity > 0 || continueSellingWhenOutOfStock
  );
};
