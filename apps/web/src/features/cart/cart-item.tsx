"use client";
import { Check, Heart, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CartItemProps = {
  id: string;
  image: string;
  title: string;
  description: string;
  variantOptions?: Record<string, string>; // e.g., { "Color": "Red", "Size": "Large" }
  price: number;
  originalPrice?: number;
  quantity: number;
  inStock?: boolean;
  badge?: string;
  onQuantityChange?: (id: string, quantity: number) => void;
  onRemove?: (id: string) => void;
  onSaveForLater?: (id: string) => void;
};
export const CartItem = ({
  id,
  image,
  title,
  description,
  variantOptions,
  price,
  originalPrice,
  quantity,
  inStock = true,
  badge,
  onQuantityChange,
  onRemove,
  onSaveForLater,
}: CartItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  return (
    <div
      className={cn(
        "group relative flex gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-300",
        isHovered && "shadow-lg shadow-foreground/5",
        !inStock && "opacity-70",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className={cn(
            "object-cover transition-transform duration-500",
            isHovered && "scale-110",
          )}
        />
        {badge && (
          <Badge className="absolute left-1.5 top-1.5 bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
            {badge}
          </Badge>
        )}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <span className="text-[10px] font-medium text-muted-foreground">
              Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Title & Description */}
        <div className="mb-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {description}
            </p>
          )}
          {/* Variant Options Display */}
          {variantOptions && Object.keys(variantOptions).length > 0 && (
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              {Object.entries(variantOptions).map(
                ([key, value], index, arr) => (
                  <span key={key} className="inline-flex items-center">
                    <span className="font-medium text-foreground/70">
                      {key}:
                    </span>{" "}
                    <span>{value}</span>
                    {index < arr.length - 1 && (
                      <span className="ml-2 text-border">|</span>
                    )}
                  </span>
                ),
              )}
            </div>
          )}
        </div>

        {/* Stock Status */}
        {inStock ? (
          <div className="mb-2 flex items-center gap-1">
            <Check className="h-3 w-3 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600">
              In Stock
            </span>
          </div>
        ) : (
          <span className="mb-2 text-xs font-medium text-destructive">
            Out of Stock
          </span>
        )}

        {/* Actions Row */}
        <div className="mt-auto flex items-center gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center rounded-full border border-border bg-muted/50">
            <button
              onClick={() => onQuantityChange?.(id, Math.max(1, quantity - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-l-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              disabled={quantity <= 1 || !inStock}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="min-w-8 text-center text-xs font-semibold text-foreground">
              {quantity}
            </span>
            <button
              onClick={() => onQuantityChange?.(id, quantity + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-r-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              disabled={!inStock}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-border" />

          {/* Save for Later */}
          <button
            onClick={() => onSaveForLater?.(id)}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            <Heart className="h-3 w-3" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-border" />

          {/* Remove */}
          <button
            onClick={() => onRemove?.(id)}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
      </div>

      {/* Price Column */}
      <div className="flex shrink-0 flex-col items-end justify-between">
        <div className="text-right">
          <div className="text-lg font-bold text-foreground">
            ${(price * quantity).toFixed(2)}
          </div>
          {originalPrice && (
            <>
              <div className="text-xs text-muted-foreground line-through">
                ${(originalPrice * quantity).toFixed(2)}
              </div>
              <Badge className="mt-1 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                -{discount}% off
              </Badge>
            </>
          )}
        </div>
        {quantity > 1 && (
          <span className="text-[10px] text-muted-foreground">
            ${price.toFixed(2)} each
          </span>
        )}
      </div>

      {/* Hover accent line */}
      <div
        className={cn(
          "absolute bottom-0 left-0 h-0.5 bg-linear-to-r from-primary to-primary/60 transition-all duration-500",
          isHovered ? "w-full" : "w-0",
        )}
      />
    </div>
  );
};
