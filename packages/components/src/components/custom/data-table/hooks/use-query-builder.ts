import { useState, useCallback, useMemo } from "react";
import type {
  FilterGroup,
  FilterCondition,
  FilterNode,
  FilterOperator,
  FilterFieldType,
  LogicalOperator,
  FieldOption,
} from "../types";
import { isFilterGroup } from "../types";

interface UseQueryBuilderOptions {
  initialValue?: FilterGroup;
  onChange?: (filter: FilterGroup) => void;
}

interface UseQueryBuilderReturn {
  filter: FilterGroup;
  addCondition: (parentId: string, condition: Omit<FilterCondition, "id">) => void;
  addGroup: (parentId: string, operator?: LogicalOperator) => void;
  updateCondition: (
    conditionId: string,
    updates: Partial<Omit<FilterCondition, "id">>
  ) => void;
  updateGroupOperator: (groupId: string, operator: LogicalOperator) => void;
  removeNode: (nodeId: string) => void;
  clearAll: () => void;
  setFilter: (filter: FilterGroup) => void;
  hasConditions: boolean;
  conditionCount: number;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function createEmptyFilter(): FilterGroup {
  return {
    id: generateId(),
    operator: "and",
    conditions: [],
  };
}

export function createCondition(
  field: string,
  fieldType: FilterFieldType,
  operator: FilterOperator = "equals",
  value: unknown = ""
): FilterCondition {
  return {
    id: generateId(),
    field,
    fieldType,
    operator,
    value,
  };
}

function findAndUpdateNode(
  root: FilterGroup,
  nodeId: string,
  updater: (node: FilterNode) => FilterNode | null
): FilterGroup {
  const updateInGroup = (group: FilterGroup): FilterGroup => {
    const newConditions: FilterNode[] = [];

    for (const node of group.conditions) {
      if (node.id === nodeId) {
        const updated = updater(node);
        if (updated) {
          newConditions.push(updated);
        }
        // If null, node is removed
      } else if (isFilterGroup(node)) {
        newConditions.push(updateInGroup(node));
      } else {
        newConditions.push(node);
      }
    }

    return { ...group, conditions: newConditions };
  };

  // If root itself is the target
  if (root.id === nodeId) {
    const result = updater(root);
    return isFilterGroup(result!) ? result! : root;
  }

  return updateInGroup(root);
}

function addNodeToGroup(
  root: FilterGroup,
  parentId: string,
  newNode: FilterNode
): FilterGroup {
  const addToGroup = (group: FilterGroup): FilterGroup => {
    if (group.id === parentId) {
      return {
        ...group,
        conditions: [...group.conditions, newNode],
      };
    }

    return {
      ...group,
      conditions: group.conditions.map((node) =>
        isFilterGroup(node) ? addToGroup(node) : node
      ),
    };
  };

  return addToGroup(root);
}

function countConditions(group: FilterGroup): number {
  let count = 0;
  for (const node of group.conditions) {
    if (isFilterGroup(node)) {
      count += countConditions(node);
    } else {
      count++;
    }
  }
  return count;
}

export function useQueryBuilder({
  initialValue,
  onChange,
}: UseQueryBuilderOptions = {}): UseQueryBuilderReturn {
  const [filter, setFilterState] = useState<FilterGroup>(
    () => initialValue ?? createEmptyFilter()
  );

  const setFilter = useCallback(
    (newFilter: FilterGroup) => {
      setFilterState(newFilter);
      onChange?.(newFilter);
    },
    [onChange]
  );

  const addCondition = useCallback(
    (parentId: string, condition: Omit<FilterCondition, "id">) => {
      const newCondition: FilterCondition = {
        ...condition,
        id: generateId(),
      };
      setFilter(addNodeToGroup(filter, parentId, newCondition));
    },
    [filter, setFilter]
  );

  const addGroup = useCallback(
    (parentId: string, operator: LogicalOperator = "and") => {
      const newGroup: FilterGroup = {
        id: generateId(),
        operator,
        conditions: [],
      };
      setFilter(addNodeToGroup(filter, parentId, newGroup));
    },
    [filter, setFilter]
  );

  const updateCondition = useCallback(
    (conditionId: string, updates: Partial<Omit<FilterCondition, "id">>) => {
      setFilter(
        findAndUpdateNode(filter, conditionId, (node) => {
          if (!isFilterGroup(node)) {
            return { ...node, ...updates };
          }
          return node;
        })
      );
    },
    [filter, setFilter]
  );

  const updateGroupOperator = useCallback(
    (groupId: string, operator: LogicalOperator) => {
      if (groupId === filter.id) {
        setFilter({ ...filter, operator });
      } else {
        setFilter(
          findAndUpdateNode(filter, groupId, (node) => {
            if (isFilterGroup(node)) {
              return { ...node, operator };
            }
            return node;
          })
        );
      }
    },
    [filter, setFilter]
  );

  const removeNode = useCallback(
    (nodeId: string) => {
      // Don't allow removing root
      if (nodeId === filter.id) {
        return;
      }
      setFilter(findAndUpdateNode(filter, nodeId, () => null));
    },
    [filter, setFilter]
  );

  const clearAll = useCallback(() => {
    setFilter(createEmptyFilter());
  }, [setFilter]);

  const hasConditions = useMemo(
    () => filter.conditions.length > 0,
    [filter.conditions.length]
  );

  const conditionCount = useMemo(() => countConditions(filter), [filter]);

  return {
    filter,
    addCondition,
    addGroup,
    updateCondition,
    updateGroupOperator,
    removeNode,
    clearAll,
    setFilter,
    hasConditions,
    conditionCount,
  };
}

// Helper to get readable summary of filter
export function getFilterSummary(
  filter: FilterGroup,
  fields: FieldOption[]
): string {
  const fieldMap = new Map(fields.map((f) => [f.value, f.label]));

  const summarizeNode = (node: FilterNode): string => {
    if (isFilterGroup(node)) {
      if (node.conditions.length === 0) return "";
      const parts = node.conditions
        .map(summarizeNode)
        .filter(Boolean);
      if (parts.length === 0) return "";
      if (parts.length === 1) return parts[0];
      return `(${parts.join(` ${node.operator.toUpperCase()} `)})`;
    }

    const fieldLabel = fieldMap.get(node.field) || node.field;
    return `${fieldLabel}`;
  };

  const summary = summarizeNode(filter);
  return summary || "无筛选条件";
}
