export type DataTableFilterType =
  | "number"
  | "text"
  | "select"
  | "date"
  | "boolean"
  | "range"
  | "autoComplete"
  | "date";

export interface DataTableFilterMeta {
  filterType: DataTableFilterType;
}
