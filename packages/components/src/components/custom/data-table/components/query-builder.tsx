import * as React from "react";
import { useState, useMemo } from "react";
import {
  Filter,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  X,
  FolderPlus,
} from "lucide-react";
import { cn } from "~@/lib/utils";
import { Button } from "~@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~@/components/ui/select";
import { Input } from "~@/components/ui/input";
import type {
  FilterGroup,
  FilterCondition,
  FilterNode,
  FilterOperator,
  FieldOption,
  LogicalOperator,
  QueryBuilderProps,
} from "../types";
import {
  isFilterGroup,
  OPERATOR_LABELS,
  OPERATORS_BY_TYPE,
} from "../types";
import { getFilterSummary } from "../hooks/use-query-builder";

// ============== Filter Tree Preview (Hover) ==============
interface FilterTreePreviewProps {
  filter: FilterGroup;
  fields: FieldOption[];
  depth?: number;
}

function FilterTreePreview({
  filter,
  fields,
  depth = 0,
}: FilterTreePreviewProps) {
  const fieldMap = useMemo(
    () => new Map(fields.map((f) => [f.value, f])),
    [fields]
  );

  if (filter.conditions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2 px-3">
        无筛选条件
      </div>
    );
  }

  return (
    <div className={cn("text-sm", depth > 0 && "ml-4 border-l pl-3")}>
      <div className="flex items-center gap-1.5 py-1">
        <span className="font-medium text-primary uppercase text-xs">
          {filter.operator}
        </span>
      </div>
      {filter.conditions.map((node, index) => (
        <div key={node.id} className="py-0.5">
          {isFilterGroup(node) ? (
            <FilterTreePreview filter={node} fields={fields} depth={depth + 1} />
          ) : (
            <ConditionPreview condition={node} fieldMap={fieldMap} />
          )}
        </div>
      ))}
    </div>
  );
}

interface ConditionPreviewProps {
  condition: FilterCondition;
  fieldMap: Map<string, FieldOption>;
}

function ConditionPreview({ condition, fieldMap }: ConditionPreviewProps) {
  const field = fieldMap.get(condition.field);
  const fieldLabel = field?.label || condition.field;
  const operatorLabel = OPERATOR_LABELS[condition.operator];

  const valueDisplay = useMemo(() => {
    if (
      condition.operator === "isNull" ||
      condition.operator === "isNotNull" ||
      condition.operator === "isEmpty" ||
      condition.operator === "isNotEmpty"
    ) {
      return null;
    }

    if (field?.options && condition.value) {
      const opt = field.options.find((o) => o.value === condition.value);
      return opt?.label || String(condition.value);
    }

    return condition.value !== undefined && condition.value !== ""
      ? String(condition.value)
      : "未设置";
  }, [condition, field]);

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span className="text-foreground font-medium">{fieldLabel}</span>
      <span className="text-xs">{operatorLabel}</span>
      {valueDisplay && (
        <span className="text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">
          {valueDisplay}
        </span>
      )}
    </div>
  );
}

// ============== Filter Editor ==============
interface FilterEditorProps {
  filter: FilterGroup;
  fields: FieldOption[];
  onAddCondition: (parentId: string, condition: Omit<FilterCondition, "id">) => void;
  onAddGroup: (parentId: string) => void;
  onUpdateCondition: (
    conditionId: string,
    updates: Partial<Omit<FilterCondition, "id">>
  ) => void;
  onUpdateGroupOperator: (groupId: string, operator: LogicalOperator) => void;
  onRemoveNode: (nodeId: string) => void;
  onClearAll: () => void;
}

function FilterEditor({
  filter,
  fields,
  onAddCondition,
  onAddGroup,
  onUpdateCondition,
  onUpdateGroupOperator,
  onRemoveNode,
  onClearAll,
}: FilterEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">筛选条件</span>
        {filter.conditions.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
          >
            清空全部
          </Button>
        )}
      </div>

      <FilterGroupEditor
        group={filter}
        fields={fields}
        isRoot
        onAddCondition={onAddCondition}
        onAddGroup={onAddGroup}
        onUpdateCondition={onUpdateCondition}
        onUpdateGroupOperator={onUpdateGroupOperator}
        onRemoveNode={onRemoveNode}
      />
    </div>
  );
}

interface FilterGroupEditorProps {
  group: FilterGroup;
  fields: FieldOption[];
  isRoot?: boolean;
  onAddCondition: (parentId: string, condition: Omit<FilterCondition, "id">) => void;
  onAddGroup: (parentId: string) => void;
  onUpdateCondition: (
    conditionId: string,
    updates: Partial<Omit<FilterCondition, "id">>
  ) => void;
  onUpdateGroupOperator: (groupId: string, operator: LogicalOperator) => void;
  onRemoveNode: (nodeId: string) => void;
}

function FilterGroupEditor({
  group,
  fields,
  isRoot = false,
  onAddCondition,
  onAddGroup,
  onUpdateCondition,
  onUpdateGroupOperator,
  onRemoveNode,
}: FilterGroupEditorProps) {
  const [expanded, setExpanded] = useState(true);

  const handleAddCondition = () => {
    if (fields.length > 0) {
      const firstField = fields[0];
      const operators = OPERATORS_BY_TYPE[firstField.type];
      onAddCondition(group.id, {
        field: firstField.value,
        fieldType: firstField.type,
        operator: operators[0],
        value: "",
      });
    }
  };

  return (
    <div
      className={cn(
        "rounded-md border",
        isRoot ? "bg-background" : "bg-muted/30"
      )}
    >
      {/* Group Header */}
      <div className="flex items-center gap-2 p-2 border-b bg-muted/50">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        <Select
          value={group.operator}
          onValueChange={(v: string) =>
            onUpdateGroupOperator(group.id, v as LogicalOperator)
          }
        >
          <SelectTrigger className="h-7 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">AND</SelectItem>
            <SelectItem value="or">OR</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground flex-1">
          {group.conditions.length} 个条件
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleAddCondition}
          >
            <Plus className="h-3 w-3 mr-1" />
            条件
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onAddGroup(group.id)}
          >
            <FolderPlus className="h-3 w-3 mr-1" />
            组
          </Button>
          {!isRoot && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveNode(group.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Group Content */}
      {expanded && (
        <div className="p-2 space-y-2">
          {group.conditions.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              点击上方按钮添加筛选条件
            </div>
          ) : (
            group.conditions.map((node) =>
              isFilterGroup(node) ? (
                <FilterGroupEditor
                  key={node.id}
                  group={node}
                  fields={fields}
                  onAddCondition={onAddCondition}
                  onAddGroup={onAddGroup}
                  onUpdateCondition={onUpdateCondition}
                  onUpdateGroupOperator={onUpdateGroupOperator}
                  onRemoveNode={onRemoveNode}
                />
              ) : (
                <ConditionEditor
                  key={node.id}
                  condition={node}
                  fields={fields}
                  onUpdate={(updates) => onUpdateCondition(node.id, updates)}
                  onRemove={() => onRemoveNode(node.id)}
                />
              )
            )
          )}
        </div>
      )}
    </div>
  );
}

interface ConditionEditorProps {
  condition: FilterCondition;
  fields: FieldOption[];
  onUpdate: (updates: Partial<Omit<FilterCondition, "id">>) => void;
  onRemove: () => void;
}

function ConditionEditor({
  condition,
  fields,
  onUpdate,
  onRemove,
}: ConditionEditorProps) {
  const currentField = useMemo(
    () => fields.find((f) => f.value === condition.field),
    [fields, condition.field]
  );

  const availableOperators = useMemo(
    () => OPERATORS_BY_TYPE[condition.fieldType] || OPERATORS_BY_TYPE.text,
    [condition.fieldType]
  );

  const handleFieldChange = (fieldValue: string) => {
    const field = fields.find((f) => f.value === fieldValue);
    if (field) {
      const newOperators = OPERATORS_BY_TYPE[field.type];
      onUpdate({
        field: fieldValue,
        fieldType: field.type,
        operator: newOperators[0],
        value: "",
      });
    }
  };

  const showValueInput =
    condition.operator !== "isNull" &&
    condition.operator !== "isNotNull" &&
    condition.operator !== "isEmpty" &&
    condition.operator !== "isNotEmpty";

  return (
    <div className="flex items-center gap-2 p-2 rounded border bg-background">
      {/* Field Select */}
      <Select value={condition.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="h-8 w-32 text-xs">
          <SelectValue placeholder="选择字段" />
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field.value} value={field.value}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator Select */}
      <Select
        value={condition.operator}
        onValueChange={(v: string) => onUpdate({ operator: v as FilterOperator })}
      >
        <SelectTrigger className="h-8 w-28 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableOperators.map((op) => (
            <SelectItem key={op} value={op}>
              {OPERATOR_LABELS[op]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value Input */}
      {showValueInput && (
        <>
          {currentField?.options ? (
            <Select
              value={String(condition.value || "")}
              onValueChange={(v: string) => onUpdate({ value: v })}
            >
              <SelectTrigger className="h-8 flex-1 text-xs">
                <SelectValue placeholder="选择值" />
              </SelectTrigger>
              <SelectContent>
                {currentField.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              className="h-8 flex-1 text-xs"
              placeholder="输入值"
              value={String(condition.value || "")}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ value: e.target.value })}
              type={
                condition.fieldType === "number"
                  ? "number"
                  : condition.fieldType === "date"
                    ? "date"
                    : "text"
              }
            />
          )}
        </>
      )}

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ============== Main QueryBuilder Component ==============
export function QueryBuilder({
  fields,
  value,
  onChange,
  className,
}: QueryBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const summary = useMemo(
    () => getFilterSummary(value, fields),
    [value, fields]
  );

  const conditionCount = useMemo(() => {
    const count = (group: FilterGroup): number => {
      let c = 0;
      for (const node of group.conditions) {
        if (isFilterGroup(node)) {
          c += count(node);
        } else {
          c++;
        }
      }
      return c;
    };
    return count(value);
  }, [value]);

  const handleAddCondition = (
    parentId: string,
    condition: Omit<FilterCondition, "id">
  ) => {
    const newCondition: FilterCondition = {
      ...condition,
      id: Math.random().toString(36).substring(2, 11),
    };

    const addToGroup = (group: FilterGroup): FilterGroup => {
      if (group.id === parentId) {
        return { ...group, conditions: [...group.conditions, newCondition] };
      }
      return {
        ...group,
        conditions: group.conditions.map((node) =>
          isFilterGroup(node) ? addToGroup(node) : node
        ),
      };
    };

    onChange(addToGroup(value));
  };

  const handleAddGroup = (parentId: string) => {
    const newGroup: FilterGroup = {
      id: Math.random().toString(36).substring(2, 11),
      operator: "and",
      conditions: [],
    };

    const addToGroup = (group: FilterGroup): FilterGroup => {
      if (group.id === parentId) {
        return { ...group, conditions: [...group.conditions, newGroup] };
      }
      return {
        ...group,
        conditions: group.conditions.map((node) =>
          isFilterGroup(node) ? addToGroup(node) : node
        ),
      };
    };

    onChange(addToGroup(value));
  };

  const handleUpdateCondition = (
    conditionId: string,
    updates: Partial<Omit<FilterCondition, "id">>
  ) => {
    const updateInGroup = (group: FilterGroup): FilterGroup => ({
      ...group,
      conditions: group.conditions.map((node) => {
        if (node.id === conditionId && !isFilterGroup(node)) {
          return { ...node, ...updates };
        }
        if (isFilterGroup(node)) {
          return updateInGroup(node);
        }
        return node;
      }),
    });

    onChange(updateInGroup(value));
  };

  const handleUpdateGroupOperator = (
    groupId: string,
    operator: LogicalOperator
  ) => {
    const updateInGroup = (group: FilterGroup): FilterGroup => {
      if (group.id === groupId) {
        return { ...group, operator };
      }
      return {
        ...group,
        conditions: group.conditions.map((node) =>
          isFilterGroup(node) ? updateInGroup(node) : node
        ),
      };
    };

    onChange(updateInGroup(value));
  };

  const handleRemoveNode = (nodeId: string) => {
    const removeFromGroup = (group: FilterGroup): FilterGroup => ({
      ...group,
      conditions: group.conditions
        .filter((node) => node.id !== nodeId)
        .map((node) => (isFilterGroup(node) ? removeFromGroup(node) : node)),
    });

    onChange(removeFromGroup(value));
  };

  const handleClearAll = () => {
    onChange({
      ...value,
      conditions: [],
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative group", className)}>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5",
              conditionCount > 0 && "border-primary/50"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>筛选</span>
            {conditionCount > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {conditionCount}
              </span>
            )}
          </Button>

          {/* Hover Preview */}
          {conditionCount > 0 && !isOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
              <div className="bg-popover border rounded-md shadow-md p-2 min-w-64 max-w-96">
                <FilterTreePreview filter={value} fields={fields} />
              </div>
            </div>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[480px] p-4"
        align="start"
        sideOffset={4}
      >
        <FilterEditor
          filter={value}
          fields={fields}
          onAddCondition={handleAddCondition}
          onAddGroup={handleAddGroup}
          onUpdateCondition={handleUpdateCondition}
          onUpdateGroupOperator={handleUpdateGroupOperator}
          onRemoveNode={handleRemoveNode}
          onClearAll={handleClearAll}
        />
      </PopoverContent>
    </Popover>
  );
}
