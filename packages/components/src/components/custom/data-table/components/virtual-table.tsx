import * as React from "react";
import { useRef, useCallback, useMemo } from "react";
import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import { flexRender } from "@tanstack/react-table";
import { cn } from "~@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../ui/table";
import type { VirtualTableProps } from "../types";

export function VirtualDataTable<TData, TValue>({
  table,
  columns,
  estimateRowHeight = 48,
  className,
  onRowClick,
}: VirtualTableProps<TData, TValue>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowHeight,
    overscan: 10,
    measureElement: (element) => element?.getBoundingClientRect().height
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0;

  const handleRowClick = useCallback(
    (row: (typeof rows)[0]) => {
      onRowClick?.(row);
    },
    [onRowClick]
  );

  // Get pinned columns
  const leftPinnedColumns = table.getLeftLeafColumns();
  const rightPinnedColumns = table.getRightLeafColumns();
  // Calculate pinned widths

  const leftPinnedWidth = useMemo(() => leftPinnedColumns.reduce(
    (acc, col) => acc + col.getSize(),
    0
  ), [leftPinnedColumns]);
  const rightPinnedWidth = useMemo(() => rightPinnedColumns.reduce(
    (acc, col) => acc + col.getSize(),
    0
  ), [rightPinnedColumns]);

  return (
    <div
      ref={parentRef}
      className={cn("w-full h-full overflow-auto relative box-border", className)}
    >
      <Table 
        className="caption-bottom text-sm box-border" 
        style={{ width: table.getTotalSize()}}
      >
        <TableHeader className="bg-background">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const isPinnedLeft = header.column.getIsPinned() === "left";
                const isPinnedRight = header.column.getIsPinned() === "right";
                
                return (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{
                      width: header.getSize(), 
                      position: "sticky",
                      top: 0,
                      left: isPinnedLeft ? header.column.getStart("left") : undefined,
                      right: isPinnedRight ? header.column.getAfter("right") : undefined,
                      zIndex: isPinnedLeft || isPinnedRight ? 40 : 30, // 固定列表头层级最高 (40)，普通表头次之 (30)
                    }}
                    className={cn(
                      "bg-background", // 必须有背景色，否则内容会透视
                      (isPinnedLeft || isPinnedRight) && 
                        "shadow-[0_0_10px_rgba(0,0,0,0.1)] border-l border-border", // 加点阴影区分
                        isPinnedRight && "border-l" // 右侧固定列左边加个边框更好看
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {paddingTop > 0 && (
            <TableRow>
              <TableCell style={{ height: `${paddingTop}px`, padding: 0 }} colSpan={columns.length} />
            </TableRow>
          )}

          {virtualRows.map((virtualRow: VirtualItem) => {
            const row = rows[virtualRow.index];
            return (
              <TableRow
                key={row.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className={cn(
                  onRowClick && "cursor-pointer",
                  row.getIsSelected() && "bg-muted"
                )}
                onClick={() => handleRowClick(row)}
              >
                {row.getVisibleCells().map((cell) => {
                  const isPinnedLeft = cell.column.getIsPinned() === "left";
                  const isPinnedRight = cell.column.getIsPinned() === "right";
                  
                  return (
                    <TableCell
                      key={cell.id}
                      style={{
                        width: cell.column.getSize(),
                        // 4. 关键修复：Body 中的固定列
                        position: isPinnedLeft || isPinnedRight ? "sticky" : undefined,
                        left: isPinnedLeft ? cell.column.getStart("left") : undefined,
                        right: isPinnedRight ? cell.column.getAfter("right") : undefined,
                        zIndex: isPinnedLeft || isPinnedRight ? 20 : undefined, // 固定列层级 (20) 高于普通内容
                        backgroundColor: isPinnedLeft || isPinnedRight ? "var(--background)" : undefined // 必须设置背景色
                      }}
                      className={cn(
                        (isPinnedLeft || isPinnedRight) && "bg-gray-300",
                        (isPinnedLeft && "border-r shadow-[0_0_10px_rgba(0,0,0,0.1)"),
                        (isPinnedRight) && 
                          "shadow-[0_0_10px_rgba(0,0,0,0.1)] border-l",
                        "border-border"
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}

          {paddingBottom > 0 && (
            <TableRow>
              <TableCell style={{ height: `${paddingBottom}px`, padding: 0 }} colSpan={columns.length} />
            </TableRow>
          )}
          
           {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                暂无数据
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
