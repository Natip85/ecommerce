"use client";

import { Package, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

import { TableActions } from "./table-actions";

import type { RouterOutputs } from "@ecommerce/api";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


// Product type from the list query
type Product = RouterOutputs["product"]["list"]["items"][number];

// Status badge variant mapping
const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  draft: "secondary",
  archived: "outline",
};

// Creation status badge variant mapping
const creationStatusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  in_progress: "outline",
  completed: "default",
};

// Creation status display names
const creationStatusLabels: Record<string, string> = {
  in_progress: "In Progress",
  completed: "Completed",
};

// Format price for display
function formatPrice(price: string | null): string {
  if (!price) return "$0.00";
  const num = parseFloat(price);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

// Get price range from variants
function getPriceRange(variants: Product["variants"]): string {
  if (!variants || variants.length === 0) return "$0.00";

  const prices = variants
    .map((v: Product["variants"][number]) => parseFloat(v.price || "0"))
    .filter((p: number) => !isNaN(p));

  if (prices.length === 0) return "$0.00";

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) return formatPrice(String(min));
  return `${formatPrice(String(min))} - ${formatPrice(String(max))}`;
}

// Get total inventory across all variants
function getTotalInventory(variants: Product["variants"]): number {
  if (!variants || variants.length === 0) return 0;
  return variants.reduce(
    (sum: number, v: Product["variants"][number]) =>
      sum + (v.inventoryQuantity || 0),
    0,
  );
}

export const columns: ColumnDef<Product>[] = [
  // Select checkbox column
  {
    id: "select",
    size: 40,
    minSize: 40,
    maxSize: 40,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // Product image and title
  {
    id: "product",
    accessorKey: "title",
    header: () => <div>Product</div>,
    cell: ({ row }) => {
      const product = row.original;
      const firstImage = product.images?.[0];

      return (
        <div className="flex items-center gap-3">
          <div className="bg-muted relative h-10 w-10 overflow-hidden rounded-md border">
            {firstImage?.url ? (
              <Image
                src={firstImage.url}
                alt={firstImage.alt || product.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="text-muted-foreground h-5 w-5" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="max-w-[200px] truncate font-medium">
              {product.title}
            </span>
            {product.vendor && (
              <span className="text-muted-foreground text-xs">
                {product.vendor}
              </span>
            )}
          </div>
        </div>
      );
    },
  },

  // Status
  {
    id: "status",
    accessorKey: "status",
    header: () => <div>Status</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={statusVariants[status] || "secondary"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },

  // Creation Status
  {
    id: "creationStatus",
    accessorKey: "creationStatus",
    header: () => <div>Progress</div>,
    cell: ({ row }) => {
      const creationStatus = row.original.creationStatus;
      return (
        <Badge variant={creationStatusVariants[creationStatus] || "secondary"}>
          {creationStatusLabels[creationStatus] || creationStatus}
        </Badge>
      );
    },
  },

  // Published
  {
    id: "published",
    accessorKey: "published",
    header: () => <div>Visibility</div>,
    cell: ({ row }) => {
      const published = row.original.published;
      return (
        <div className="flex items-center gap-1.5">
          {published ? (
            <>
              <Eye className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">Visible</span>
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Hidden</span>
            </>
          )}
        </div>
      );
    },
  },

  // Inventory
  {
    id: "inventory",
    header: () => <div>Inventory</div>,
    cell: ({ row }) => {
      const total = getTotalInventory(row.original.variants);
      const isLow = total > 0 && total <= 5;
      const isOut = total === 0;

      return (
        <div className="flex items-center gap-2">
          <span
            className={
              isOut ? "text-destructive" : isLow ? "text-amber-500" : ""
            }
          >
            {total} in stock
          </span>
          {isOut && (
            <Badge variant="destructive" className="text-xs">
              Out
            </Badge>
          )}
        </div>
      );
    },
  },

  // Price
  {
    id: "price",
    header: () => <div>Price</div>,
    cell: ({ row }) => {
      return <div>{getPriceRange(row.original.variants)}</div>;
    },
  },

  // Product Type
  {
    id: "productType",
    accessorKey: "productType",
    header: () => <div>Type</div>,
    cell: ({ row }) => {
      const type = row.original.productType;
      return type ? (
        <span className="text-muted-foreground">{type}</span>
      ) : (
        <span className="text-muted-foreground/50">—</span>
      );
    },
  },

  // Variants count
  {
    id: "variants",
    header: () => <div>Variants</div>,
    cell: ({ row }) => {
      const variantsCount = row.original.variants?.length || 0;
      return (
        <span className="text-muted-foreground">
          {variantsCount} {variantsCount === 1 ? "variant" : "variants"}
        </span>
      );
    },
  },

  // Tags
  {
    id: "tags",
    header: () => <div>Tags</div>,
    cell: ({ row }) => {
      const tags = row.original.tags;

      if (!tags || tags.length === 0) {
        return <span className="text-muted-foreground/50">—</span>;
      }

      const displayTags = tags.slice(0, 2);
      const remainingCount = tags.length - 2;

      return (
        <div className="flex items-center gap-1">
          {displayTags.map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs">
                    +{remainingCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex flex-col gap-1">
                    {tags.slice(2).map((tag: string) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },

  // Created date
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: () => <div>Created</div>,
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return (
        <span className="text-muted-foreground text-sm">
          {new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      );
    },
  },

  // Actions
  {
    id: "actions",
    header: () => <div></div>,
    cell: ({ row }) => {
      return <TableActions product={row.original} />;
    },
  },
];

// Export ordered columns for the products list
export const orderedColumns = columns;
