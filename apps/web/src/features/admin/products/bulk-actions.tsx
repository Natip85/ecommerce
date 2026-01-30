"use client";

import type { Row, Table } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTRPC } from "@/trpc";

type ProductTableBulkActionsProps<TData extends { id: string }> = {
  selectedRows: Row<TData>[];
  table: Table<TData>;
};

export const ProductTableBulkActions = <TData extends { id: string }>({
  selectedRows,
  table,
}: ProductTableBulkActionsProps<TData>) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutateAsync: deleteMany } = useMutation(
    trpc.product.deleteMany.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.product.list.pathFilter());
        table.resetRowSelection();
      },
    })
  );

  const productIds = selectedRows.map((row) => row.original.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="link"
          className="data-[state=open]:bg-muted text-foreground"
        >
          <MoreHorizontal className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-48"
        align="end"
      >
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={async () => {
              await deleteMany({ productIds });
            }}
            className="text-red-600"
          >
            Delete all
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              table.resetRowSelection();
            }}
          >
            <Trash className="hover:text-red-600" /> Clear selected
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
