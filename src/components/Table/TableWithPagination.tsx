/*
 * Copyright (c) 2024 Payhuddle. All rights reserved.
 *
 * This software and associated documentation files are the intellectual
 * property of Payhuddle. Use of this software is governed by the terms
 * of the applicable license agreement.
 *
 * No part of this software may be reproduced, distributed, or transmitted
 * in any form or by any means without the prior written permission of Payhuddle.
 */
import React, { useEffect, useState } from "react";
import { Table as AntTable, Pagination } from "antd";
import { type ITableProps } from "./ITable";

interface TableComponentProps extends ITableProps {
  currentPage?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number, newPageSize: number) => void;
  pageSizeOptions?: string[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showPaginationInfo?: boolean;
  paginationInfoText?: (start: number, end: number, total: number) => React.ReactNode;
  locale?: {
    emptyText?: React.ReactNode;
  };
}

const TableComponent: React.FC<TableComponentProps> = ({
  columns,
  dataSource,
  loading = false,
  pagination = false,
  size = "middle",
  bordered = false,
  showHeader = true,
  className,
  style,
  rowSelection,
  expandable,
  scroll,
  // maxHeight = 400,
  
  currentPage = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  pageSizeOptions = ['10', '20', '50', '100'],
  showSizeChanger = true,
  showQuickJumper = true,
  showPaginationInfo = true,
  paginationInfoText,
  locale,
}) => {
  // Forces a re-render on resize so cell renderers relying on the current window width
  // (e.g. renderTruncatedCellWithTooltip's responsive character cap) recompute live, without
  // every table needing its own resize listener.
  const [, forceRerenderOnResize] = useState(0);
  useEffect(() => {
    const handleResize = () => forceRerenderOnResize((n) => n + 1);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Do not gate on `total` — 0 is valid and Ant Design Pagination still needs a total for "empty" pages.
  const hasCustomPagination =
    typeof onPageChange === 'function' && Number(pageSize) > 0 && Number.isFinite(currentPage);
  
  const getPaginationConfig = () => {
    if (hasCustomPagination) {
      return false;
    }
    
    if (pagination === false) {
      return false;
    } else if (pagination === true) {
      return { pageSize: 10 };
    } else {
      return pagination;
    }
  };
  
  const paginationConfig = getPaginationConfig();
  
  const start = Math.min((currentPage - 1) * pageSize + 1, total);
  const end = Math.min(currentPage * pageSize, total);
  
  const defaultPaginationInfo = (
    <>
      <span>Showing</span> {start} <span> to</span> {end} <span>of</span> {total}
    </>
  );

  return (
    <>
      {hasCustomPagination ? (
        <div className="pagination-container">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={onPageChange}
            onShowSizeChange={onPageChange}
            showSizeChanger={showSizeChanger}
            showQuickJumper={showQuickJumper}
            pageSizeOptions={pageSizeOptions}
          />

          {showPaginationInfo && (
            <div className="pagination-info">
              {paginationInfoText ? paginationInfoText(start, end, total) : defaultPaginationInfo}
            </div>
          )}
        </div>
      ) : ""}
      <div className={`custom-table ${className || ""}`} style={style}>
        <AntTable
          columns={columns}
          dataSource={dataSource}
          pagination={paginationConfig}
          loading={loading}
          size={size}
          bordered={bordered}
          showHeader={showHeader}
          rowSelection={rowSelection}
          expandable={expandable}
          scroll={scroll}
          className="custom-table__ant-table"
          locale={locale}
        />
      </div>
    </>
  );
};

export default TableComponent;