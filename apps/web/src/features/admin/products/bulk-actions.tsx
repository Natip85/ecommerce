"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Trash } from "lucide-react";

import type { Row, Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  // const { mutateAsync: deleteMutation } = useMutation(
  //   trpc.product.delete.mutationOptions(),
  // );

  const recipeIds = selectedRows.map((row) => row.original.id);

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
      <DropdownMenuContent className="min-w-48" align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={async () => {
              // await deleteMutation({ recipeIds });
              await queryClient.invalidateQueries(
                trpc.product.list.pathFilter(),
              );
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
