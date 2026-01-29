"use client";
"use no memo";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  Row,
  RowSelectionState,
  SortingState,
  Table as TanTable,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  renderBulkActions?: (args: {
    selectedRows: Row<TData>[];
    table: TanTable<TData>;
  }) => React.ReactNode;
};

export const DataTable = <TData, TValue>({
  columns,
  data,
  onColumnVisibilityChange,
  renderBulkActions,
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Use external column visibility if provided, otherwise use internal state
  const setColumnVisibility =
    onColumnVisibilityChange ?? setInternalColumnVisibility;

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      //   pagination: {
      //     pageIndex: page - 1,
      //     pageSize: perPage,
      //   },
    },
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  return (
    <div className="relative w-full overflow-hidden rounded-lg border-2">
      <Table className="contain-paint">
        <TableHeader className="bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className={cn(hasSelection && "border-b ")}
            >
              {headerGroup.headers.map((header) => {
                const isSelectHeader = header.column.id === "select";
                const isActionsHeader = header.column.id === "actions";
                if (hasSelection) {
                  if (header.index === 1) {
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "text-foreground",
                          isSelectHeader &&
                            'after:content-[" "] sticky left-0 z-30 bg-muted px-3 text-center after:absolute after:top-0 after:right-0 after:bottom-0 after:w-px after:bg-muted dark:after:bg-muted',
                          isActionsHeader &&
                            'after:content-[" "] sticky right-0 z-30 bg-muted pr-3 pl-4 text-right after:absolute after:top-0 after:bottom-0 after:left-0 after:w-px after:bg-muted dark:after:bg-muted',
                        )}
                      >
                        {selectedRows.length} row
                        {selectedRows.length !== 1 ? "s" : ""} selected
                      </TableHead>
                    );
                  }
                  if (isSelectHeader) {
                    return (
                      <TableHead
                        key={header.id}
                        style={{
                          width:
                            header.column.getSize() !== 150
                              ? header.column.getSize()
                              : undefined,
                          minWidth: header.column.columnDef.minSize,
                          maxWidth: header.column.columnDef.maxSize,
                        }}
                        className='after:content-[" "] sticky left-0 z-30 bg-muted px-3 text-center after:absolute after:top-0 after:right-0 after:bottom-0 after:w-px after:bg-muted dark:after:bg-muted'
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </TableHead>
                    );
                  }
                  if (isActionsHeader) {
                    return (
                      <TableHead
                        key={header.id}
                        className='after:content-[" "] sticky right-0 z-30 bg-muted pr-3 pl-4 text-right after:absolute after:top-0 after:bottom-0 after:left-0 after:w-px after:bg-muted dark:after:bg-muted'
                      >
                        {renderBulkActions?.({ selectedRows, table })}
                      </TableHead>
                    );
                  }
                }
                return (
                  <TableHead
                    key={header.id}
                    style={{
                      width:
                        header.column.getSize() !== 150
                          ? header.column.getSize()
                          : undefined,
                      minWidth: header.column.columnDef.minSize,
                      maxWidth: header.column.columnDef.maxSize,
                    }}
                    className={cn(
                      hasSelection && header.id !== "select" && "opacity-0",
                      isSelectHeader &&
                        'after:content-[" "] sticky left-0 z-30 bg-muted px-3 text-center after:absolute after:top-0 after:right-0 after:bottom-0 after:w-px after:bg-muted dark:after:bg-muted',
                      isActionsHeader &&
                        'after:content-[" "] sticky right-0 z-30 bg-muted pr-3 pl-4 text-right after:absolute after:top-0 after:bottom-0 after:left-0 after:w-px after:bg-muted dark:after:bg-muted',
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        {/* } */}
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                className="hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer border-b transition-colors"
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => {
                  const isSelectCell = cell.column.id === "select";
                  const isActionsCell = cell.column.id === "actions";
                  return (
                    <TableCell
                      key={cell.id}
                      style={{
                        width:
                          cell.column.getSize() !== 150
                            ? cell.column.getSize()
                            : undefined,
                        minWidth: cell.column.columnDef.minSize,
                        maxWidth: cell.column.columnDef.maxSize,
                      }}
                      className={cn(
                        isSelectCell &&
                          'after:content-[" "] sticky left-0 z-20 bg-muted px-3 text-center will-change-transform after:absolute after:top-0 after:right-0 after:bottom-0 after:w-px after:bg-muted dark:after:bg-muted',
                        isActionsCell &&
                          'after:content-[" "] sticky right-0 z-20 bg-muted pr-3 pl-4 text-right will-change-transform after:absolute after:top-0 after:bottom-0 after:left-0 after:w-px after:bg-muted dark:after:bg-muted',
                        isActionsCell && hasSelection && "pointer-events-none",
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, {
                        ...cell.getContext(),
                        hasSelection,
                      })}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length}>No results.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
