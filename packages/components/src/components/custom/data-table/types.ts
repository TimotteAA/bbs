import type { ColumnDef, Table, Row } from "@tanstack/react-table";

// ============== Filter Types ==============
/**
 * define all filter operators
 */
export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "in"
  | "notIn"
  | "isNull"
  | "isNotNull"
  | "isEmpty"
  | "isNotEmpty";

/**
 * define all filters for one column field
 */
export type FilterFieldType =
  | "text"
  | "number"
  | "date"
  | "datetime"
  | "boolean"
  | "select"
  | "multiSelect";

/**
 * define logical operators for filter groups
 */
export type LogicalOperator = "and" | "or";

/**
 * define a filter condition
 */
export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
  fieldType: FilterFieldType;
}

/**
 * define a filter group
 */
export interface FilterGroup {
  id: string;
  operator: LogicalOperator;
  conditions: (FilterCondition | FilterGroup)[];
}

export type FilterNode = FilterCondition | FilterGroup;

export function isFilterGroup(node: FilterNode): node is FilterGroup {
  return "conditions" in node;
}

// ============== Column Settings Types ==============
export interface ColumnConfig {
  id: string;
  visible: boolean;
  pinned: "left" | "right" | false;
  order: number;
  width?: number;
}

export interface ColumnSettingsState {
  columns: ColumnConfig[];
}

// ============== Query Builder Types ==============
export interface FieldOption {
  value: string;
  label: string;
  type: FilterFieldType;
  options?: { value: string; label: string }[]; // for select/multiSelect
}

export interface QueryBuilderProps {
  fields: FieldOption[];
  value: FilterGroup;
  onChange: (value: FilterGroup) => void;
  className?: string;
}

// ============== Column Settings Props ==============
export interface ColumnSettingsProps<TData> {
  table: Table<TData>;
  storageKey?: string;
  className?: string;
}

// ============== Data Table Props ==============
export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  storageKey?: string;
  fields?: FieldOption[];
  onFilterChange?: (filter: FilterGroup) => void;
  estimateRowHeight?: number;
  className?: string;
  tableClassName?: string;
  getRowId?: (row: TData) => string;
  onRowClick?: (row: Row<TData>) => void;
}

// ============== Toolbar Props ==============
export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  fields?: FieldOption[];
  filter?: FilterGroup;
  onFilterChange?: (filter: FilterGroup) => void;
  storageKey?: string;
  className?: string;
}

// ============== Virtual Table Props ==============
export interface VirtualTableProps<TData, TValue> {
  table: Table<TData>;
  columns: ColumnDef<TData, TValue>[];
  estimateRowHeight?: number;
  className?: string;
  onRowClick?: (row: Row<TData>) => void;
}

// ============== Operator Labels ==============
export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: "等于",
  notEquals: "不等于",
  contains: "包含",
  notContains: "不包含",
  startsWith: "开头是",
  endsWith: "结尾是",
  gt: "大于",
  gte: "大于等于",
  lt: "小于",
  lte: "小于等于",
  between: "介于",
  in: "在列表中",
  notIn: "不在列表中",
  isNull: "为空",
  isNotNull: "不为空",
  isEmpty: "为空字符串",
  isNotEmpty: "非空字符串",
};

export const OPERATORS_BY_TYPE: Record<FilterFieldType, FilterOperator[]> = {
  text: [
    "equals",
    "notEquals",
    "contains",
    "notContains",
    "startsWith",
    "endsWith",
    "isEmpty",
    "isNotEmpty",
    "isNull",
    "isNotNull",
  ],
  number: [
    "equals",
    "notEquals",
    "gt",
    "gte",
    "lt",
    "lte",
    "between",
    "isNull",
    "isNotNull",
  ],
  date: [
    "equals",
    "notEquals",
    "gt",
    "gte",
    "lt",
    "lte",
    "between",
    "isNull",
    "isNotNull",
  ],
  datetime: [
    "equals",
    "notEquals",
    "gt",
    "gte",
    "lt",
    "lte",
    "between",
    "isNull",
    "isNotNull",
  ],
  boolean: ["equals", "notEquals", "isNull", "isNotNull"],
  select: ["equals", "notEquals", "in", "notIn", "isNull", "isNotNull"],
  multiSelect: ["in", "notIn", "isNull", "isNotNull"],
};
