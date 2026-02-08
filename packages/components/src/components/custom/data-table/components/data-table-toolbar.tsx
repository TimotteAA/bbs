import * as React from "react";
import { cn } from "~@/lib/utils";
import { QueryBuilder } from "./query-builder";
import { ColumnSettings } from "./column-settings";
import type { DataTableToolbarProps, FilterGroup } from "../types";
import { createEmptyFilter } from "../hooks/use-query-builder";

export function DataTableToolbar<TData>({
  table,
  fields = [],
  filter,
  onFilterChange,
  storageKey,
  className,
}: DataTableToolbarProps<TData>) {
  const currentFilter = filter ?? createEmptyFilter();

  const handleFilterChange = (newFilter: FilterGroup) => {
    onFilterChange?.(newFilter);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-3 px-1",
        className
      )}
    >
      {/* Left Side - Query Builder */}
      <div className="flex items-center gap-2">
        {fields.length > 0 && onFilterChange && (
          <QueryBuilder
            fields={fields}
            value={currentFilter}
            onChange={handleFilterChange}
          />
        )}
      </div>

      {/* Right Side - Column Settings */}
      <div className="flex items-center gap-2">
        <ColumnSettings table={table} storageKey={storageKey} />
      </div>
    </div>
  );
}
