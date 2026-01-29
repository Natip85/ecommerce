"use client";

import { useQuery } from "@tanstack/react-query";

import { CollectionTableBulkActions } from "./bulk-actions";
import { columns } from "./collection-columns";
import { useAdminCollectionSearchParams } from "./search-params";

import { DataTable } from "@/features/admin/products/data-table";
import { useTRPC } from "@/trpc";

export function AdminCollectionsList() {
  const trpc = useTRPC();
  const { searchParams } = useAdminCollectionSearchParams();

  const { data } = useQuery(trpc.collection.list.queryOptions(searchParams));

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      renderBulkActions={({ selectedRows, table }) => (
        <CollectionTableBulkActions selectedRows={selectedRows} table={table} />
      )}
    />
  );
}
