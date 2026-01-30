"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Heart, Minus, Plus, Trash2 } from "lucide-react";

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

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  return (
    <div
      className={cn(
        "border-border bg-card group relative flex gap-4 rounded-xl border p-4 transition-all duration-300",
        isHovered && "shadow-foreground/5 shadow-lg",
        !inStock && "opacity-70"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="bg-muted relative h-28 w-28 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className={cn("object-cover transition-transform duration-500", isHovered && "scale-110")}
        />
        {badge && (
          <Badge className="bg-primary text-primary-foreground absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[10px] font-medium">
            {badge}
          </Badge>
        )}
        {!inStock && (
          <div className="bg-background/80 absolute inset-0 flex items-center justify-center">
            <span className="text-muted-foreground text-[10px] font-medium">Unavailable</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Title & Description */}
        <div className="mb-2">
          <h3 className="text-foreground group-hover:text-primary line-clamp-1 text-sm font-semibold transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{description}</p>
          )}
          {/* Variant Options Display */}
          {variantOptions && Object.keys(variantOptions).length > 0 && (
            <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs">
              {Object.entries(variantOptions).map(([key, value], index, arr) => (
                <span
                  key={key}
                  className="inline-flex items-center"
                >
                  <span className="text-foreground/70 font-medium">{key}:</span>{" "}
                  <span>{value}</span>
                  {index < arr.length - 1 && <span className="text-border ml-2">|</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stock Status */}
        {inStock ?
          <div className="mb-2 flex items-center gap-1">
            <Check className="h-3 w-3 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600">In Stock</span>
          </div>
        : <span className="text-destructive mb-2 text-xs font-medium">Out of Stock</span>}

        {/* Actions Row */}
        <div className="mt-auto flex items-center gap-3">
          {/* Quantity Selector */}
          <div className="border-border bg-muted/50 flex items-center rounded-full border">
            <button
              onClick={() => onQuantityChange?.(id, Math.max(1, quantity - 1))}
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-7 w-7 items-center justify-center rounded-l-full transition-colors disabled:opacity-50"
              disabled={quantity <= 1 || !inStock}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-foreground min-w-8 text-center text-xs font-semibold">
              {quantity}
            </span>
            <button
              onClick={() => onQuantityChange?.(id, quantity + 1)}
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-7 w-7 items-center justify-center rounded-r-full transition-colors disabled:opacity-50"
              disabled={!inStock}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Divider */}
          <div className="bg-border h-4 w-px" />

          {/* Save for Later */}
          <button
            onClick={() => onSaveForLater?.(id)}
            className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs transition-colors"
          >
            <Heart className="h-3 w-3" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Divider */}
          <div className="bg-border h-4 w-px" />

          {/* Remove */}
          <button
            onClick={() => onRemove?.(id)}
            className="text-muted-foreground hover:text-destructive flex items-center gap-1 text-xs transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
      </div>

      {/* Price Column */}
      <div className="flex shrink-0 flex-col items-end justify-between">
        <div className="text-right">
          <div className="text-foreground text-lg font-bold">${(price * quantity).toFixed(2)}</div>
          {originalPrice && (
            <>
              <div className="text-muted-foreground text-xs line-through">
                ${(originalPrice * quantity).toFixed(2)}
              </div>
              <Badge className="mt-1 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                -{discount}% off
              </Badge>
            </>
          )}
        </div>
        {quantity > 1 && (
          <span className="text-muted-foreground text-[10px]">${price.toFixed(2)} each</span>
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
};
