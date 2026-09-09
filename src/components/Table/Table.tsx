
import React from "react";
import { Table as AntTable } from "antd";
import { type ColumnsType } from "antd/es/table";
import { type ITableData, type ITableProps } from "./ITable";

const Table: React.FC<ITableProps> = ({
  columns,
  dataSource,
  loading = false,
  pagination,
  size = "middle",
  bordered = false,
  showHeader = true,
  className,
  style,
  rowSelection,
  scroll,
  maxHeight: _maxHeight = 400,
}) => {
  const antColumns: ColumnsType<ITableData> = columns.map((column) => ({
    key: column.key,
    title: column.title,
    dataIndex: column.dataIndex,
    width: column.width,
    align: column.align,
    render: column.render,
  }));

  // Handle pagination - if it's an object, use it; if false, disable it; if true, use default
  let paginationConfig: false | object | undefined;
  if (pagination === false) {
    paginationConfig = false;
  } else if (pagination === true) {
    paginationConfig = { pageSize: 10 };
  } else {
    paginationConfig = pagination;
  }

  const calculateScrollHeight = (): string => {
    if (paginationConfig) {
      return 'calc(100vh - 200px)';
    }
    return 'calc(100vh - 318px)';
  };
  const scrollConfig = scroll 
    ? { 
        ...scroll, 
        y: scroll.y ?? calculateScrollHeight(),
        x: scroll.x ?? 'max-content'
      }
    : { 
        y: calculateScrollHeight(),
        x: 'max-content'
      };

  return (
    <div className={`custom-table ${className || ""}`} style={style}>
      <AntTable
        columns={antColumns}
        dataSource={dataSource}
        pagination={false}
        loading={loading}
        size={size}
        bordered={bordered}
        showHeader={showHeader}
        rowSelection={rowSelection}
        scroll={scrollConfig}
        className="custom-table__ant-table"
      />
    </div>
  );
};

export default Table;