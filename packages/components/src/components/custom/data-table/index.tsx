import * as React from "react";
import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type ColumnPinningState,
} from "@tanstack/react-table";
import { cn } from "~@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { DataTableToolbar } from "./components/data-table-toolbar";
import { VirtualDataTable } from "./components/virtual-table";
import { createEmptyFilter } from "./hooks/use-query-builder";
import type { DataTableProps, FilterGroup } from "./types";

// Re-export all types
export * from "./types";
export * from "./hooks";
export * from "./components";

// Main DataTable Component
export function DataTable<TData, TValue>({
  columns,
  data,
  storageKey,
  fields = [],
  onFilterChange,
  estimateRowHeight = 48,
  className,
  tableClassName,
  getRowId,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [],
    right: [],
  });
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [filter, setFilter] = useState<FilterGroup>(createEmptyFilter());

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnPinning,
      columnOrder,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId,
  });

  const handleFilterChange = (newFilter: FilterGroup) => {
    setFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  return (
    <div className={cn("h-full gap-y-2 flex flex-col", className)}>
      {/* Toolbar: Query Builder (left) + Column Settings (right) */}
      <DataTableToolbar
        table={table}
        fields={fields}
        filter={filter}
        onFilterChange={onFilterChange ? handleFilterChange : undefined}
        storageKey={storageKey}
      />
      <VirtualDataTable
        table={table}
        columns={columns}
        estimateRowHeight={estimateRowHeight}
        className={tableClassName}
        onRowClick={onRowClick}
      />
    </div>
  );
}
