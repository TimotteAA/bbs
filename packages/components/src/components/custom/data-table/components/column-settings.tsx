import * as React from "react";
import { useState, useMemo, useCallback } from "react";
import {
  Settings2,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  GripVertical,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "~@/lib/utils";
import { Button } from "../../../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../ui/popover";
import { Checkbox } from "../../../ui/checkbox";
import type { Table } from "@tanstack/react-table";
import type { ColumnConfig, ColumnSettingsProps } from "../types";
import { useColumnSettings } from "../hooks/use-column-settings";

// ============== Column Item ==============
interface ColumnItemProps {
  config: ColumnConfig;
  label: string;
  onVisibilityChange: (visible: boolean) => void;
  onPinChange: (pinned: "left" | "right" | false) => void;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: () => void;
}

function ColumnItem({
  config,
  label,
  onVisibilityChange,
  onPinChange,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
}: ColumnItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md border bg-background",
        "hover:bg-muted/50 transition-colors cursor-grab",
        isDragging && "opacity-50 ring-2 ring-primary"
      )}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.();
      }}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />

      {/* Visibility Toggle */}
      <Checkbox
        checked={config.visible}
        onCheckedChange={(checked) => onVisibilityChange(checked === true)}
        className="h-4 w-4"
      />

      {/* Column Name */}
      <span
        className={cn(
          "flex-1 text-sm truncate",
          !config.visible && "text-muted-foreground line-through"
        )}
      >
        {label}
      </span>

      {/* Pin Controls */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 w-6 p-0",
            config.pinned === "left" && "text-primary bg-primary/10"
          )}
          onClick={() =>
            onPinChange(config.pinned === "left" ? false : "left")
          }
          title="固定到左侧"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 w-6 p-0",
            config.pinned === "right" && "text-primary bg-primary/10"
          )}
          onClick={() =>
            onPinChange(config.pinned === "right" ? false : "right")
          }
          title="固定到右侧"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ============== Column Group ==============
interface ColumnGroupProps {
  title: string;
  icon: React.ReactNode;
  columns: ColumnConfig[];
  allColumns: ColumnConfig[];
  table: Table<unknown>;
  onVisibilityChange: (columnId: string, visible: boolean) => void;
  onPinChange: (columnId: string, pinned: "left" | "right" | false) => void;
  onReorder: (columnIds: string[]) => void;
}

function ColumnGroup({
  title,
  icon,
  columns,
  allColumns,
  table,
  onVisibilityChange,
  onPinChange,
  onReorder,
}: ColumnGroupProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const getColumnLabel = useCallback(
    (columnId: string) => {
      const col = table.getColumn(columnId);
      if (!col) return columnId;

      const header = col.columnDef.header;
      if (typeof header === "string") return header;
      if (typeof header === "function") {
        // Try to get a reasonable label
        return columnId;
      }
      return columnId;
    },
    [table]
  );

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    if (draggedId && dragOverId && draggedId !== dragOverId) {
      // Reorder within the same group
      const currentOrder = allColumns.map((c) => c.id);
      const draggedIndex = currentOrder.indexOf(draggedId);
      const targetIndex = currentOrder.indexOf(dragOverId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newOrder = [...currentOrder];
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedId);
        onReorder(newOrder);
      }
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragOver = (id: string) => {
    if (draggedId && id !== draggedId) {
      setDragOverId(id);
    }
  };

  if (columns.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        <span>{title}</span>
        <span className="text-xs">({columns.length})</span>
      </div>
      <div className="space-y-1">
        {columns.map((config) => (
          <ColumnItem
            key={config.id}
            config={config}
            label={getColumnLabel(config.id)}
            onVisibilityChange={(v) => onVisibilityChange(config.id, v)}
            onPinChange={(p) => onPinChange(config.id, p)}
            isDragging={draggedId === config.id}
            onDragStart={() => handleDragStart(config.id)}
            onDragEnd={handleDragEnd}
            onDragOver={() => handleDragOver(config.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ============== Main ColumnSettings Component ==============
export function ColumnSettings<TData>({
  table,
  storageKey,
  className,
}: ColumnSettingsProps<TData>) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    columnConfigs,
    updateColumnVisibility,
    updateColumnPinning,
    updateColumnOrder,
    resetToDefault,
    pinnedLeftColumns,
    pinnedRightColumns,
    unpinnedColumns,
  } = useColumnSettings({ table: table as Table<unknown>, storageKey });

  const visibleCount = useMemo(
    () => columnConfigs.filter((c) => c.visible).length,
    [columnConfigs]
  );

  const hiddenCount = useMemo(
    () => columnConfigs.filter((c) => !c.visible).length,
    [columnConfigs]
  );

  const pinnedCount = useMemo(
    () => columnConfigs.filter((c) => c.pinned).length,
    [columnConfigs]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 gap-1.5", className)}
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span>列设置</span>
          {pinnedCount > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
              {pinnedCount} 固定
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0"
        align="end"
        sideOffset={4}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">列设置</div>
            <div className="text-xs text-muted-foreground">
              {visibleCount} 显示 / {hiddenCount} 隐藏
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={resetToDefault}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            重置
          </Button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-4 max-h-96 overflow-y-auto">
          {/* Pinned Left */}
          <ColumnGroup
            title="固定左侧"
            icon={<Pin className="h-3.5 w-3.5 rotate-45" />}
            columns={pinnedLeftColumns}
            allColumns={columnConfigs}
            table={table as Table<unknown>}
            onVisibilityChange={updateColumnVisibility}
            onPinChange={updateColumnPinning}
            onReorder={updateColumnOrder}
          />

          {/* Unpinned */}
          <ColumnGroup
            title="未固定"
            icon={<PinOff className="h-3.5 w-3.5" />}
            columns={unpinnedColumns}
            allColumns={columnConfigs}
            table={table as Table<unknown>}
            onVisibilityChange={updateColumnVisibility}
            onPinChange={updateColumnPinning}
            onReorder={updateColumnOrder}
          />

          {/* Pinned Right */}
          <ColumnGroup
            title="固定右侧"
            icon={<Pin className="h-3.5 w-3.5 -rotate-45" />}
            columns={pinnedRightColumns}
            allColumns={columnConfigs}
            table={table as Table<unknown>}
            onVisibilityChange={updateColumnVisibility}
            onPinChange={updateColumnPinning}
            onReorder={updateColumnOrder}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="text-xs text-muted-foreground">
            拖拽调整列顺序 • 点击复选框切换显示
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
