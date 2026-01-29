"use client";

import { useQuery } from "@tanstack/react-query";

import { ProductTableBulkActions } from "./bulk-actions";
import { DataTable } from "./data-table";
import { columns } from "./product-columns";
import { useAdminProductSearchParams } from "./search-params";

import { useTRPC } from "@/trpc";

export function AdminProductsList() {
  const trpc = useTRPC();
  const { searchParams } = useAdminProductSearchParams();

  const { data } = useQuery(trpc.product.list.queryOptions(searchParams));

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      renderBulkActions={({ selectedRows, table }) => (
        <ProductTableBulkActions selectedRows={selectedRows} table={table} />
      )}
    />
  );
}
