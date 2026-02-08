import { useState, useEffect, useCallback, useMemo } from "react";
import type { Table, Column } from "@tanstack/react-table";
import type { ColumnConfig, ColumnSettingsState } from "../types";

interface UseColumnSettingsOptions<TData> {
  table: Table<TData>;
  storageKey?: string;
}

interface UseColumnSettingsReturn {
  columnConfigs: ColumnConfig[];
  updateColumnVisibility: (columnId: string, visible: boolean) => void;
  updateColumnPinning: (
    columnId: string,
    pinned: "left" | "right" | false
  ) => void;
  updateColumnOrder: (columnIds: string[]) => void;
  resetToDefault: () => void;
  pinnedLeftColumns: ColumnConfig[];
  pinnedRightColumns: ColumnConfig[];
  unpinnedColumns: ColumnConfig[];
}

const STORAGE_PREFIX = "data-table-columns-";

function getDefaultColumnConfig<TData>(
  columns: Column<TData, unknown>[]
): ColumnConfig[] {
  return columns.map((col, index) => ({
    id: col.id,
    visible: col.getIsVisible(),
    pinned: col.getIsPinned() || false,
    order: index,
    width: col.getSize(),
  }));
}

export function useColumnSettings<TData>({
  table,
  storageKey,
}: UseColumnSettingsOptions<TData>): UseColumnSettingsReturn {
  const allColumns = table.getAllColumns();
  const fullStorageKey = storageKey ? `${STORAGE_PREFIX}${storageKey}` : null;

  // Initialize state from localStorage or defaults
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(() => {
    if (fullStorageKey) {
      try {
        const stored = localStorage.getItem(fullStorageKey);
        if (stored) {
          const parsed: ColumnSettingsState = JSON.parse(stored);
          // Merge with current columns (handle new/removed columns)
          const storedMap = new Map(
            parsed.columns.map((c) => [c.id, c])
          );
          const currentIds = new Set(allColumns.map((c) => c.id));

          // Keep stored configs for existing columns, add new columns
          const merged: ColumnConfig[] = [];
          let maxOrder = parsed.columns.length;

          allColumns.forEach((col, index) => {
            const stored = storedMap.get(col.id);
            if (stored) {
              merged.push(stored);
            } else {
              merged.push({
                id: col.id,
                visible: true,
                pinned: false,
                order: maxOrder++,
                width: col.getSize(),
              });
            }
          });

          // Sort by order
          return merged.sort((a, b) => a.order - b.order);
        }
      } catch (e) {
        console.warn("Failed to load column settings from localStorage:", e);
      }
    }
    return getDefaultColumnConfig(allColumns);
  });

  // Sync to localStorage
  useEffect(() => {
    if (fullStorageKey) {
      try {
        const state: ColumnSettingsState = { columns: columnConfigs };
        localStorage.setItem(fullStorageKey, JSON.stringify(state));
      } catch (e) {
        console.warn("Failed to save column settings to localStorage:", e);
      }
    }
  }, [columnConfigs, fullStorageKey]);

  // Apply settings to table
  useEffect(() => {
    // Apply visibility
    const visibilityState: Record<string, boolean> = {};
    columnConfigs.forEach((config) => {
      visibilityState[config.id] = config.visible;
    });
    table.setColumnVisibility(visibilityState);

    // Apply pinning
    const leftPinned: string[] = [];
    const rightPinned: string[] = [];
    columnConfigs.forEach((config) => {
      if (config.pinned === "left") leftPinned.push(config.id);
      if (config.pinned === "right") rightPinned.push(config.id);
    });
    table.setColumnPinning({ left: leftPinned, right: rightPinned });

    // Apply column order
    const orderedIds = columnConfigs
      .sort((a, b) => a.order - b.order)
      .map((c) => c.id);
    table.setColumnOrder(orderedIds);
  }, [columnConfigs, table]);

  const updateColumnVisibility = useCallback(
    (columnId: string, visible: boolean) => {
      setColumnConfigs((prev) =>
        prev.map((config) =>
          config.id === columnId ? { ...config, visible } : config
        )
      );
    },
    []
  );

  const updateColumnPinning = useCallback(
    (columnId: string, pinned: "left" | "right" | false) => {
      setColumnConfigs((prev) =>
        prev.map((config) =>
          config.id === columnId ? { ...config, pinned } : config
        )
      );
    },
    []
  );

  const updateColumnOrder = useCallback((columnIds: string[]) => {
    setColumnConfigs((prev) => {
      const configMap = new Map(prev.map((c) => [c.id, c]));
      return columnIds.map((id, index) => ({
        ...configMap.get(id)!,
        order: index,
      }));
    });
  }, []);

  const resetToDefault = useCallback(() => {
    const defaults = getDefaultColumnConfig(allColumns);
    setColumnConfigs(defaults);
    if (fullStorageKey) {
      localStorage.removeItem(fullStorageKey);
    }
  }, [allColumns, fullStorageKey]);

  const pinnedLeftColumns = useMemo(
    () =>
      columnConfigs
        .filter((c) => c.pinned === "left")
        .sort((a, b) => a.order - b.order),
    [columnConfigs]
  );

  const pinnedRightColumns = useMemo(
    () =>
      columnConfigs
        .filter((c) => c.pinned === "right")
        .sort((a, b) => a.order - b.order),
    [columnConfigs]
  );

  const unpinnedColumns = useMemo(
    () =>
      columnConfigs
        .filter((c) => !c.pinned)
        .sort((a, b) => a.order - b.order),
    [columnConfigs]
  );

  return {
    columnConfigs,
    updateColumnVisibility,
    updateColumnPinning,
    updateColumnOrder,
    resetToDefault,
    pinnedLeftColumns,
    pinnedRightColumns,
    unpinnedColumns,
  };
}
