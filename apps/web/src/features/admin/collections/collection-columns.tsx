"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, EyeOff, FolderOpen } from "lucide-react";

import type { RouterOutputs } from "@ecommerce/api";

import { Checkbox } from "@/components/ui/checkbox";
import { TableActions } from "./table-actions";

// Collection type from the list query
type Collection = RouterOutputs["collection"]["list"]["items"][number];

export const columns: ColumnDef<Collection>[] = [
  // Select checkbox column
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
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

  // Collection title
  {
    id: "collection",
    accessorKey: "title",
    header: () => <div>Collection</div>,
    cell: ({ row }) => {
      const collection = row.original;

      return (
        <div className="flex items-center gap-3">
          <div className="bg-muted flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border">
            <FolderOpen className="text-muted-foreground h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="max-w-[200px] truncate font-medium">{collection.title}</span>
            <span className="text-muted-foreground text-xs">/{collection.handle}</span>
          </div>
        </div>
      );
    },
  },

  // Published status
  {
    id: "published",
    accessorKey: "published",
    header: () => <div>Visibility</div>,
    cell: ({ row }) => {
      const published = row.original.published;
      return (
        <div className="flex items-center gap-1.5">
          {published ?
            <>
              <Eye className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">Visible</span>
            </>
          : <>
              <EyeOff className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">Hidden</span>
            </>
          }
        </div>
      );
    },
  },

  // Product count
  {
    id: "productCount",
    header: () => <div>Products</div>,
    cell: ({ row }) => {
      const count = row.original.productCount;
      return (
        <span className="text-muted-foreground">
          {count} {count === 1 ? "product" : "products"}
        </span>
      );
    },
  },

  // Description
  {
    id: "description",
    accessorKey: "description",
    header: () => <div>Description</div>,
    cell: ({ row }) => {
      const description = row.original.description;
      return description ?
          <span className="text-muted-foreground max-w-[200px] truncate">{description}</span>
        : <span className="text-muted-foreground/50">—</span>;
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
    cell: ({ row }) => <TableActions collection={row.original} />,
  },
];

// Export ordered columns for the collections list
export const orderedColumns = columns;
