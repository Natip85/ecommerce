import { useEffect, useEffectEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, X } from "lucide-react";

import type { OptionValueFilter } from "@ecommerce/api/schemas";

import type { StorefrontFilter } from "@/validation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc";
import { defaultStorefrontFilter } from "@/validation";
import { useProductListSearchParams } from "../products/search-params";
import {
  FilterSidebar,
  FilterSidebarContent,
  FilterSidebarFooter,
  FilterSidebarHeader,
} from "./filter-sidebar";
import { useSidebarParams } from "./query-params";

const MIN_PRICE = 0;
const MAX_PRICE = 1000;

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const ProductFilterSidebar = () => {
  const trpc = useTRPC();
  const {
    searchParams: { filter },
    setSearchParams,
    debouncedSetSearchParams,
    resetFilters,
  } = useProductListSearchParams();
  const {
    sidebarParams: { filterOpen },
    setSidebarParams,
  } = useSidebarParams();

  // Fetch available options for filtering
  const { data: availableOptions } = useQuery(trpc.product.listOptions.queryOptions());

  // Derive price range from search params (storefront schema uses minPrice/maxPrice)
  const priceRange: [number, number] = [
    filter?.minPrice ?? MIN_PRICE,
    filter?.maxPrice ?? MAX_PRICE,
  ];

  // Local state for inputs (to allow typing before committing)
  const [minInput, setMinInput] = useState(priceRange[0].toString());
  const [maxInput, setMaxInput] = useState(priceRange[1].toString());

  // Sync local input state when filter changes externally
  const syncPriceInputs = useEffectEvent(() => {
    setMinInput((filter?.minPrice ?? MIN_PRICE).toString());
    setMaxInput((filter?.maxPrice ?? MAX_PRICE).toString());
  });

  useEffect(() => {
    syncPriceInputs();
  }, [filter?.minPrice, filter?.maxPrice]);

  // Unified filter change handler - handles all filter updates including clears
  const handleFilterChange = (newFilter: Partial<StorefrontFilter>) => {
    // Merge the new filter with existing
    const merged = { ...filter, ...newFilter };

    // Strip out default values to keep URL clean
    const cleanFilter: Partial<StorefrontFilter> = {};
    for (const [key, value] of Object.entries(merged)) {
      const defaultValue = defaultStorefrontFilter[key as keyof StorefrontFilter];
      // Only include if different from default and not undefined
      if (value !== defaultValue && value !== undefined) {
        (cleanFilter as Record<string, unknown>)[key] = value;
      }
    }

    void debouncedSetSearchParams({
      filter: Object.keys(cleanFilter).length > 0 ? cleanFilter : undefined,
      page: 1,
    });
  };

  // Handle price range changes
  const handlePriceChange = (updates: { from?: number; to?: number }) => {
    const newMinPrice = updates.from === MIN_PRICE ? undefined : updates.from;
    const newMaxPrice = updates.to === MAX_PRICE ? undefined : updates.to;

    handleFilterChange({ minPrice: newMinPrice, maxPrice: newMaxPrice });
  };

  // Handle option filter changes
  const handleOptionFilterChange = (optionName: string, value: string, checked: boolean) => {
    const currentOptionFilters = filter?.optionFilters ?? [];

    // Find existing filter for this option
    const existingFilterIndex = currentOptionFilters.findIndex((f) => f.optionName === optionName);

    let newOptionFilters: OptionValueFilter[];

    if (checked) {
      // Adding a value
      if (existingFilterIndex >= 0) {
        // Option already has some values, add this one
        newOptionFilters = currentOptionFilters.map((f, i) =>
          i === existingFilterIndex ? { ...f, values: [...f.values, value] } : f
        );
      } else {
        // New option filter
        newOptionFilters = [...currentOptionFilters, { optionName, values: [value] }];
      }
    } else {
      // Removing a value
      if (existingFilterIndex >= 0) {
        const existingFilter = currentOptionFilters[existingFilterIndex];
        const newValues = existingFilter.values.filter((v) => v !== value);

        if (newValues.length === 0) {
          // Remove the entire option filter if no values left
          newOptionFilters = currentOptionFilters.filter((_, i) => i !== existingFilterIndex);
        } else {
          // Update the values
          newOptionFilters = currentOptionFilters.map((f, i) =>
            i === existingFilterIndex ? { ...f, values: newValues } : f
          );
        }
      } else {
        newOptionFilters = currentOptionFilters;
      }
    }

    handleFilterChange({
      optionFilters: newOptionFilters.length > 0 ? newOptionFilters : undefined,
    });
  };

  // Check if a specific option value is selected
  const isOptionValueSelected = (optionName: string, value: string): boolean => {
    const optionFilter = filter?.optionFilters?.find((f) => f.optionName === optionName);
    return optionFilter?.values.includes(value) ?? false;
  };

  const handleSliderChange = (value: number[]) => {
    setMinInput(value[0].toString());
    setMaxInput(value[1].toString());
    handlePriceChange({ from: value[0], to: value[1] });
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinInput(e.target.value);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxInput(e.target.value);
  };

  const handleMinInputBlur = () => {
    const value = parseInt(minInput, 10);
    if (isNaN(value) || value < MIN_PRICE) {
      setMinInput(MIN_PRICE.toString());
      handlePriceChange({ from: MIN_PRICE, to: priceRange[1] });
    } else if (value >= priceRange[1]) {
      setMinInput((priceRange[1] - 1).toString());
      handlePriceChange({ from: priceRange[1] - 1, to: priceRange[1] });
    } else {
      handlePriceChange({ from: value, to: priceRange[1] });
    }
  };

  const handleMaxInputBlur = () => {
    const value = parseInt(maxInput, 10);
    if (isNaN(value) || value > MAX_PRICE) {
      setMaxInput(MAX_PRICE.toString());
      handlePriceChange({ from: priceRange[0], to: MAX_PRICE });
    } else if (value <= priceRange[0]) {
      setMaxInput((priceRange[0] + 1).toString());
      handlePriceChange({ from: priceRange[0], to: priceRange[0] + 1 });
    } else {
      handlePriceChange({ from: priceRange[0], to: value });
    }
  };

  const handlePresetClick = (min: number, max: number) => {
    setMinInput(min.toString());
    setMaxInput(max.toString());
    handlePriceChange({ from: min, to: max });
  };

  // Clear price filter
  const handleClearPriceFilter = () => {
    setMinInput(MIN_PRICE.toString());
    setMaxInput(MAX_PRICE.toString());

    // Create new filter by spreading existing and removing only price-related fields
    const { minPrice: _minPrice, maxPrice: _maxPrice, ...restFilter } = filter ?? {};

    // Use null to clear the filter completely if no other filters remain
    void setSearchParams({
      filter: Object.keys(restFilter).length > 0 ? restFilter : null,
      page: 1,
    });
  };

  // Clear a specific option filter
  const handleClearOptionFilter = (optionName: string) => {
    const currentFilters = filter?.optionFilters ?? [];
    const newOptionFilters = currentFilters.filter((f) => f.optionName !== optionName);

    // Create new filter by spreading existing and updating only optionFilters
    const newFilter: Partial<StorefrontFilter> = {
      ...filter,
      optionFilters: newOptionFilters.length > 0 ? newOptionFilters : undefined,
    };

    // Clean up undefined values
    const cleanFilter = Object.fromEntries(
      Object.entries(newFilter).filter(([, v]) => v !== undefined)
    ) as Partial<StorefrontFilter>;

    // Use null to clear the filter completely if no other filters remain
    void setSearchParams({
      filter: Object.keys(cleanFilter).length > 0 ? cleanFilter : null,
      page: 1,
    });
  };

  // Get count of selected values for an option
  const getOptionFilterCount = (optionName: string): number => {
    const optionFilter = filter?.optionFilters?.find((f) => f.optionName === optionName);
    return optionFilter?.values.length ?? 0;
  };

  // Check if price filter is active
  const isPriceFilterActive = priceRange[0] !== MIN_PRICE || priceRange[1] !== MAX_PRICE;

  return (
    <FilterSidebar>
      <FilterSidebarHeader title="Filters" />
      <Separator />

      <FilterSidebarContent>
        <FilterSection
          title="Price Range"
          activeCount={isPriceFilterActive ? 1 : 0}
          onClear={handleClearPriceFilter}
          clearDisabled={!isPriceFilterActive}
        >
          <div className="space-y-5">
            {/* Price Display */}
            <div className="bg-muted/50 flex items-center justify-between rounded-lg px-3 py-2">
              <span className="text-primary text-sm font-medium">{formatPrice(priceRange[0])}</span>
              <span className="text-muted-foreground text-xs">to</span>
              <span className="text-primary text-sm font-medium">{formatPrice(priceRange[1])}</span>
            </div>

            {/* Slider */}
            <div className="px-1">
              <Slider
                value={priceRange}
                min={MIN_PRICE}
                max={MAX_PRICE}
                step={10}
                onValueChange={handleSliderChange}
                className="cursor-pointer"
              />
            </div>

            {/* Min/Max Inputs */}
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <Label
                  htmlFor="min-price"
                  className="text-muted-foreground text-xs"
                >
                  Min
                </Label>
                <div className="relative">
                  <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-xs">
                    $
                  </span>
                  <Input
                    id="min-price"
                    type="number"
                    value={minInput}
                    onChange={handleMinInputChange}
                    onBlur={handleMinInputBlur}
                    className="h-9 pr-3 pl-6 text-sm"
                    min={MIN_PRICE}
                    max={priceRange[1] - 1}
                  />
                </div>
              </div>
              <div className="bg-border mt-6 h-px w-3" />
              <div className="flex-1 space-y-1.5">
                <Label
                  htmlFor="max-price"
                  className="text-muted-foreground text-xs"
                >
                  Max
                </Label>
                <div className="relative">
                  <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-xs">
                    $
                  </span>
                  <Input
                    id="max-price"
                    type="number"
                    value={maxInput}
                    onChange={handleMaxInputChange}
                    onBlur={handleMaxInputBlur}
                    className="h-9 pr-3 pl-6 text-sm"
                    min={priceRange[0] + 1}
                    max={MAX_PRICE}
                  />
                </div>
              </div>
            </div>

            {/* Quick Price Ranges */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Under $50", range: [MIN_PRICE, 50] },
                { label: "$50 - $100", range: [50, 100] },
                { label: "$100 - $250", range: [100, 250] },
                { label: "$250+", range: [250, MAX_PRICE] },
              ].map((preset) => {
                const isActive =
                  priceRange[0] === preset.range[0] && priceRange[1] === preset.range[1];
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetClick(preset.range[0], preset.range[1])}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                      isActive ?
                        "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground bg-transparent"
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </FilterSection>

        {/* Dynamic Option Filters (Size, Color, etc.) */}
        {availableOptions?.map((option) => {
          const filterCount = getOptionFilterCount(option.name);
          return (
            <FilterSection
              key={option.name}
              title={option.name}
              defaultOpen={filterCount > 0}
              activeCount={filterCount}
              onClear={() => handleClearOptionFilter(option.name)}
              clearDisabled={filterCount === 0}
            >
              <div className="space-y-2">
                {option.values.map((value) => (
                  <label
                    key={value}
                    className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-md px-1 py-1.5 transition-colors"
                  >
                    <Checkbox
                      checked={isOptionValueSelected(option.name, value)}
                      onCheckedChange={(checked) =>
                        handleOptionFilterChange(option.name, value, checked === true)
                      }
                    />
                    <span className="text-sm">{value}</span>
                  </label>
                ))}
              </div>
            </FilterSection>
          );
        })}
      </FilterSidebarContent>
      <FilterSidebarFooter>
        {filterOpen === "edit" && (
          <Button
            variant="outline"
            onClick={() => {
              void setSidebarParams({ filterOpen: "new", filterSaving: true });
            }}
          >
            Save as new smart list
          </Button>
        )}
        <Button
          className="w-full"
          onClick={() => {
            void resetFilters();
          }}
        >
          {filterOpen === "edit" ? "Reset filters" : "Clear all"}
        </Button>
      </FilterSidebarFooter>
    </FilterSidebar>
  );
};

type FilterSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  activeCount?: number;
  onClear?: () => void;
  clearDisabled?: boolean;
};

function FilterSection({
  title,
  defaultOpen = true,
  children,
  activeCount,
  onClear,
  clearDisabled = true,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border-border border-b"
    >
      <CollapsibleTrigger className="hover:text-primary group flex w-full items-center justify-between py-3 transition-colors">
        <span className="text-sm font-semibold tracking-tight">
          {title}
          {activeCount !== undefined && activeCount > 0 && (
            <span className="text-muted-foreground ml-1.5 text-xs">({activeCount})</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
        <div className="pb-4">
          {children}
          {onClear && (
            <button
              type="button"
              disabled={clearDisabled}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className={cn(
                "mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed py-1.5 text-xs font-medium transition-colors",
                clearDisabled ?
                  "border-muted text-muted-foreground/50 cursor-not-allowed"
                : "border-muted-foreground/30 text-muted-foreground hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
              )}
            >
              <X className="size-3" />
              Clear
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
