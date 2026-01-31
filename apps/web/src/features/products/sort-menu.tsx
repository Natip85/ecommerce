"use client";

import { useState } from "react";
import { Check, SortDesc, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useProductListSearchParams } from "./search-params";

type SortOption = {
  label: string;
  value: string;
  sort: { field: string; direction: "asc" | "desc" }[];
};

const DEFAULT_SORT_VALUE = "new-arrivals";

const sortOptions: SortOption[] = [
  {
    label: "New Arrivals",
    value: "new-arrivals",
    sort: [{ field: "createdAt", direction: "desc" }],
  },
  {
    label: "Price: Low to High",
    value: "price-asc",
    sort: [{ field: "price", direction: "asc" }],
  },
  {
    label: "Price: High to Low",
    value: "price-desc",
    sort: [{ field: "price", direction: "desc" }],
  },
];

function getSortValue(sort: { field: string; direction: "asc" | "desc" }[]): string {
  if (!sort || sort.length === 0) {
    return DEFAULT_SORT_VALUE;
  }

  const firstSort = sort[0];
  if (!firstSort) return DEFAULT_SORT_VALUE;

  const option = sortOptions.find(
    (opt) =>
      opt.sort[0]?.field === firstSort.field && opt.sort[0]?.direction === firstSort.direction
  );

  return option?.value ?? DEFAULT_SORT_VALUE;
}

export function SortMenu() {
  const [open, setOpen] = useState(false);
  const { searchParams, setSearchParams } = useProductListSearchParams();

  const currentValue = getSortValue(searchParams.sort);
  const isNonDefaultSort = currentValue !== DEFAULT_SORT_VALUE;
  const currentLabel = sortOptions.find((opt) => opt.value === currentValue)?.label ?? "Sort by";

  const handleSortChange = (value: string) => {
    const option = sortOptions.find((opt) => opt.value === value);
    if (option) {
      void setSearchParams({ sort: option.sort, page: 1 });
    }
    setOpen(false);
  };

  const handleClearSort = () => {
    void setSearchParams({ sort: null, page: 1 });
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between gap-2"
        >
          <SortDesc className="h-5 w-5 shrink-0" />
          <span className="hidden md:inline">{currentLabel}</span>
          {isNonDefaultSort && <Badge className="h-4 px-1.5 text-[10px]">1</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-1"
        align="start"
      >
        <div className="flex flex-col">
          {sortOptions.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              size="sm"
              className={cn("w-full justify-start", currentValue === option.value && "bg-accent")}
              onClick={() => handleSortChange(option.value)}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  currentValue === option.value ? "opacity-100" : "opacity-0"
                )}
              />
              {option.label}
            </Button>
          ))}
          {isNonDefaultSort && (
            <>
              <div className="my-1 border-t" />
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground w-full justify-start"
                onClick={handleClearSort}
              >
                <X className="mr-2 h-4 w-4" />
                Clear sort
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
