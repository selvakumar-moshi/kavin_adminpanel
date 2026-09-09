
export interface ITableColumn {
  key: string;
  title: React.ReactNode;
  dataIndex?: string;
  width?: number | string;
  align?: "left" | "center" | "right";
  render?: (value: any, record: any, index: number) => React.ReactNode;
  style?: React.CSSProperties;
  sorter?: (a: any, b: any) => number;
  sortDirections?: ("ascend" | "descend")[];
  searchType?: "text" | "date" | "dropdown";
  filterOptions?: Array<{ value: string; label: string }>;
  displayOrder?: number;
  Permissions?: boolean;
}

export interface ITableData {
  key: string;
  [key: string]: any;
}

export interface ITableProps {
  columns: ITableColumn[];
  dataSource: ITableData[];
  loading?: boolean;
  pagination?: boolean | object;
  size?: "small" | "middle" | "large";
  bordered?: boolean;
  showHeader?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onRow?: (record: ITableData, index: number) => object;
  rowSelection?: object;
  scroll?: {
    x?: number | string;
    y?: number | string;
  };
  maxHeight?: number | string;
}
