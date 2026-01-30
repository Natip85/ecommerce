"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

export type ProductOption = {
  id: string;
  name: string;
  values?: string[] | null;
};

export type ProductVariant = {
  id: string;
  optionValues: Record<string, string>;
  price: string;
  compareAtPrice?: string | null;
  sku?: string | null;
  inventoryQuantity?: number | null;
  inventoryTracked?: boolean | null;
  continueSellingWhenOutOfStock?: boolean | null;
};

export type VariantSelectorProps = {
  options: ProductOption[];
  variants: ProductVariant[];
  selectedVariant?: ProductVariant | null;
  onVariantChange: (variant: ProductVariant | null) => void;
  className?: string;
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Find a variant that matches the given option selections
 */
function findMatchingVariant(
  variants: ProductVariant[],
  selections: Record<string, string>
): ProductVariant | null {
  return (
    variants.find((variant) => {
      // Check if all selections match this variant's optionValues
      return Object.entries(selections).every(
        ([optionName, value]) => variant.optionValues[optionName] === value
      );
    }) ?? null
  );
}

/**
 * Check if a specific option value is available given current selections
 * (used to disable unavailable combinations)
 */
function isValueAvailable(
  variants: ProductVariant[],
  currentSelections: Record<string, string>,
  optionName: string,
  value: string
): boolean {
  // Create a hypothetical selection with this value
  const hypotheticalSelections = {
    ...currentSelections,
    [optionName]: value,
  };

  // Check if any variant matches this hypothetical selection
  // We only check options that have been selected (including the current one)
  return variants.some((variant) => {
    return Object.entries(hypotheticalSelections).every(
      ([name, selectedValue]) => variant.optionValues[name] === selectedValue
    );
  });
}

/**
 * Check if a variant is in stock
 */
function isVariantInStock(variant: ProductVariant): boolean {
  const inventoryQuantity = variant.inventoryQuantity ?? 0;
  const inventoryTracked = variant.inventoryTracked ?? true;
  const continueSellingWhenOutOfStock = variant.continueSellingWhenOutOfStock ?? false;
  return !inventoryTracked || inventoryQuantity > 0 || continueSellingWhenOutOfStock;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const VariantSelector = ({
  options,
  variants,
  selectedVariant,
  onVariantChange,
  className,
}: VariantSelectorProps) => {
  // Track selected value for each option
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    // Initialize from selectedVariant if provided
    if (selectedVariant?.optionValues) {
      return { ...selectedVariant.optionValues };
    }
    // Otherwise, try to select the first available value for each option
    const initial: Record<string, string> = {};
    for (const option of options) {
      if (option.values && option.values.length > 0) {
        initial[option.name] = option.values[0];
      }
    }
    return initial;
  });

  // Find matching variant whenever selections change
  const matchingVariant = useMemo(() => {
    return findMatchingVariant(variants, selections);
  }, [variants, selections]);

  // Notify parent when variant changes
  useEffect(() => {
    onVariantChange(matchingVariant);
  }, [matchingVariant, onVariantChange]);

  // Handle option value selection
  const handleSelect = useCallback((optionName: string, value: string) => {
    setSelections((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  }, []);

  // Don't render if no options
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {options.map((option) => (
        <OptionGroup
          key={option.id}
          option={option}
          variants={variants}
          selections={selections}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
};

// =============================================================================
// OPTION GROUP COMPONENT
// =============================================================================

type OptionGroupProps = {
  option: ProductOption;
  variants: ProductVariant[];
  selections: Record<string, string>;
  onSelect: (optionName: string, value: string) => void;
};

const OptionGroup = ({ option, variants, selections, onSelect }: OptionGroupProps) => {
  const selectedValue = selections[option.name];
  const values = option.values ?? [];

  if (values.length === 0) {
    return null;
  }

  // Check if this looks like a color option (for special styling)
  const isColorOption = option.name.toLowerCase() === "color";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-foreground text-sm font-medium">{option.name}</label>
        {selectedValue && <span className="text-muted-foreground text-sm">{selectedValue}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const isSelected = selectedValue === value;
          const isAvailable = isValueAvailable(variants, selections, option.name, value);

          // Check stock for this specific combination
          const hypotheticalSelections = {
            ...selections,
            [option.name]: value,
          };
          const matchingVariant = findMatchingVariant(variants, hypotheticalSelections);
          const isInStock = matchingVariant ? isVariantInStock(matchingVariant) : true;

          return (
            <OptionButton
              key={value}
              value={value}
              isSelected={isSelected}
              isAvailable={isAvailable}
              isInStock={isInStock}
              isColor={isColorOption}
              onClick={() => onSelect(option.name, value)}
            />
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// OPTION BUTTON COMPONENT
// =============================================================================

type OptionButtonProps = {
  value: string;
  isSelected: boolean;
  isAvailable: boolean;
  isInStock: boolean;
  isColor?: boolean;
  onClick: () => void;
};

// Map of common color names to CSS colors
const COLOR_MAP: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  purple: "#a855f7",
  pink: "#ec4899",
  black: "#171717",
  white: "#ffffff",
  gray: "#6b7280",
  grey: "#6b7280",
  brown: "#92400e",
  navy: "#1e3a5a",
  beige: "#d4c4a8",
  cream: "#fffdd0",
  gold: "#d4af37",
  silver: "#c0c0c0",
  teal: "#14b8a6",
  coral: "#ff7f50",
  mint: "#98ff98",
  lavender: "#e6e6fa",
  maroon: "#800000",
  olive: "#808000",
  tan: "#d2b48c",
  burgundy: "#800020",
  charcoal: "#36454f",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  nude: "#e3bc9a",
  rose: "#ff007f",
  sky: "#87ceeb",
  stone: "#928e85",
};

function getColorStyle(value: string): string | undefined {
  const normalized = value.toLowerCase().trim();
  return COLOR_MAP[normalized];
}

const OptionButton = ({
  value,
  isSelected,
  isAvailable,
  isInStock,
  isColor,
  onClick,
}: OptionButtonProps) => {
  const colorStyle = isColor ? getColorStyle(value) : undefined;
  const isDisabled = !isAvailable;

  // Color swatch style
  if (colorStyle) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        className={cn(
          "relative h-8 w-8 rounded-full border-2 transition-all duration-200",
          isSelected ?
            "border-primary ring-primary ring-offset-background ring-2 ring-offset-2"
          : "border-border hover:border-primary/50",
          isDisabled && "cursor-not-allowed opacity-40",
          !isInStock && !isDisabled && "opacity-60"
        )}
        style={{ backgroundColor: colorStyle }}
        title={`${value}${!isInStock ? " (Out of stock)" : ""}`}
      >
        {/* Out of stock diagonal line */}
        {!isInStock && !isDisabled && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="bg-muted-foreground/70 h-[2px] w-full rotate-45" />
          </span>
        )}
      </button>
    );
  }

  // Text button style (for Size, Material, etc.)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "relative min-w-12 rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-200",
        isSelected ?
          "border-primary bg-primary text-primary-foreground"
        : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted",
        isDisabled && "cursor-not-allowed line-through opacity-40",
        !isInStock && !isDisabled && "opacity-60"
      )}
      title={!isInStock ? "Out of stock" : undefined}
    >
      {value}
      {/* Out of stock indicator */}
      {!isInStock && !isDisabled && (
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500" />
      )}
    </button>
  );
};

export default VariantSelector;
