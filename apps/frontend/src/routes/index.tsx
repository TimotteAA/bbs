import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@bbs/components/ui";
import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  type FieldOption,
  type FilterGroup,
} from "@bbs/components/custom";


/**
 * DataTable 使用示例
 * 包含 100 个字段和 10000 行数据
 */

// ============== 类型定义 ==============
interface MockData {
  id: string;
  [key: string]: string | number | boolean | Date;
}

// ============== Mock 数据生成 ==============
function generateMockColumns(count: number): ColumnDef<MockData>[] {
  const columns: ColumnDef<MockData>[] = [
    {
      accessorKey: "id",
      header: "ID",
      size: 80,
    },
  ];

  for (let i = 1; i <= count; i++) {
    const type = i % 4;
    switch (type) {
      case 0:
        columns.push({
          accessorKey: `text_${i}`,
          header: `文本字段 ${i}`,
          size: 150,
        });
        break;
      case 1:
        columns.push({
          accessorKey: `number_${i}`,
          header: `数字字段 ${i}`,
          size: 120,
          cell: ({ getValue }) => {
            const value = getValue() as number;
            return value.toLocaleString();
          },
        });
        break;
      case 2:
        columns.push({
          accessorKey: `status_${i}`,
          header: `状态 ${i}`,
          size: 100,
          cell: ({ getValue }) => {
            const value = getValue() as string;
            const colors: Record<string, string> = {
              active: "bg-green-100 text-green-800",
              inactive: "bg-gray-100 text-gray-800",
              pending: "bg-yellow-100 text-yellow-800",
            };
            return (
              <span
                className={`px-2 py-1 rounded-full text-xs ${colors[value] || ""}`}
              >
                {value}
              </span>
            );
          },
        });
        break;
      case 3:
        columns.push({
          accessorKey: `date_${i}`,
          header: `日期 ${i}`,
          size: 120,
          cell: ({ getValue }) => {
            const value = getValue() as string;
            return new Date(value).toLocaleDateString("zh-CN");
          },
        });
        break;
    }
  }

  return columns;
}

function generateMockData(rowCount: number, columnCount: number): MockData[] {
  const statuses = ["active", "inactive", "pending"];
  const names = ["张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十"];
  const cities = ["北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "南京"];

  return Array.from({ length: rowCount }, (_, rowIndex) => {
    const row: MockData = {
      id: `ROW-${String(rowIndex + 1).padStart(5, "0")}`,
    };

    for (let i = 1; i <= columnCount; i++) {
      const type = i % 4;
      switch (type) {
        case 0:
          row[`text_${i}`] = `${names[rowIndex % names.length]}-${cities[i % cities.length]}-${rowIndex}`;
          break;
        case 1:
          row[`number_${i}`] = Math.floor(Math.random() * 1000000);
          break;
        case 2:
          row[`status_${i}`] = statuses[Math.floor(Math.random() * statuses.length)];
          break;
        case 3:
          row[`date_${i}`] = new Date(
            Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
          ).toISOString();
          break;
      }
    }

    return row;
  });
}

function generateFieldOptions(columnCount: number): FieldOption[] {
  const fields: FieldOption[] = [
    { value: "id", label: "ID", type: "text" },
  ];

  for (let i = 1; i <= columnCount; i++) {
    const type = i % 4;
    switch (type) {
      case 0:
        fields.push({
          value: `text_${i}`,
          label: `文本字段 ${i}`,
          type: "text",
        });
        break;
      case 1:
        fields.push({
          value: `number_${i}`,
          label: `数字字段 ${i}`,
          type: "number",
        });
        break;
      case 2:
        fields.push({
          value: `status_${i}`,
          label: `状态 ${i}`,
          type: "select",
          options: [
            { value: "active", label: "活跃" },
            { value: "inactive", label: "非活跃" },
            { value: "pending", label: "待处理" },
          ],
        });
        break;
      case 3:
        fields.push({
          value: `date_${i}`,
          label: `日期 ${i}`,
          type: "date",
        });
        break;
    }
  }

  return fields;
}

// ============== 示例组件 ==============
function DataTableDemo() {
  const COLUMN_COUNT = 75;
  const ROW_COUNT = 1000;

  // 使用 useMemo 避免重复生成
  const columns = useMemo(() => generateMockColumns(COLUMN_COUNT), []);
  const data = useMemo(() => generateMockData(ROW_COUNT, COLUMN_COUNT), []);
  const fields = useMemo(() => generateFieldOptions(COLUMN_COUNT), []);

  const [filter, setFilter] = useState<FilterGroup | null>(null);

  const handleFilterChange = (newFilter: FilterGroup) => {
    setFilter(newFilter);
    console.log("筛选条件变更:", JSON.stringify(newFilter, null, 2));
  };

  const handleRowClick = (row: any) => {
    console.log("点击行:", row.original);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">DataTable 示例</h1>
        <p className="text-muted-foreground">
          {COLUMN_COUNT} 个字段 × {ROW_COUNT.toLocaleString()} 行数据
          （启用虚拟滚动）
        </p>
      </div>

      <div style={{ height:"600px" }}>
        <DataTable
          columns={columns}
          data={data}
          fields={fields}
          storageKey="demo-table"
          enableVirtualization
          estimateRowHeight={48}
          onFilterChange={handleFilterChange}
          onRowClick={handleRowClick}
          getRowId={(row) => row.id}
        />
      </div>
        

      {filter && filter.conditions.length > 0 && (
        <div className="p-4 bg-muted rounded-md">
          <h3 className="font-medium mb-2">当前筛选条件：</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(filter, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}


export const Route = createFileRoute("/")({
  component: IndexComponent,
});

function IndexComponent() { 
  return (
    <div className={`p-2`}>
      <div className={`text-lg`}>Welcome Home!</div>
      <hr className={`my-2`} />
      <Link
        to="/users"
        className={`py-1 px-2 text-xs bg-blue-500 text-white rounded-full`}
      >
        Users
      </Link>
      <Link to="/auth">Auth</Link>
      <Button>shadcn Button!</Button>
      <div className="mt-4">asdas</div>
      <DataTableDemo />
    </div>
  );
}
