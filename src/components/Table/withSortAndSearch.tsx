import { Tooltip } from 'antd';
import { CaretUpOutlined, CaretDownOutlined, SearchOutlined } from '@ant-design/icons';
import ColumnSearchModal from '../ColumnSearchModal/ColumnSearchModal';
import type { ITableColumn } from './ITable';
import type { SortOrder } from './useColumnSortSearch';

export interface WithSortAndSearchParams {
    sortState: Record<string, SortOrder>;
    onSort: (key: string) => void;
    openSearchColumn: string | null;
    onToggleSearch: (key: string) => void;
    onCloseSearch: () => void;
    getSearchValue: (key: string) => string;
    onSearch: (key: string, value: string) => void;
}

// Mirrors AntD's native sorter UX: unsorted -> ascend -> descend -> unsorted
const renderSortIcon = (colKey: string, sortState: Record<string, SortOrder>, onSort: (key: string) => void) => {
    const order = sortState[colKey] ?? null;
    const tooltipTitle = order === null ? 'Click to sort ascending' : order === 'ascend' ? 'Click to sort descending' : 'Click to cancel sort';

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSort(colKey);
    };

    return (
        <Tooltip title={tooltipTitle} placement="top">
            <span className="users-table__sort-icon" onClick={handleClick}>
                <CaretUpOutlined className={`users-table__sort-icon__up ${order === 'ascend' ? 'users-table__sort-icon__up--active' : ''}`} />
                <CaretDownOutlined className={`users-table__sort-icon__down ${order === 'descend' ? 'users-table__sort-icon__down--active' : ''}`} />
            </span>
        </Tooltip>
    );
};

/**
 * Given a page's base `ITableColumn[]`, wraps any column that declares a
 * `sorter` and/or `searchType` with a custom header: the label, a click-to-sort
 * indicator, and a `ColumnSearchModal`-triggering search icon. Columns with
 * neither are passed through untouched (e.g. an avatar column or an Actions
 * column you append separately).
 *
 * Pair with `useColumnSortSearch()` for the state and `getSortedTableData()`
 * to apply the resulting `sortState` to your data before pagination.
 */
export const withSortAndSearch = (
    columns: ITableColumn[],
    { sortState, onSort, openSearchColumn, onToggleSearch, onCloseSearch, getSearchValue, onSearch }: WithSortAndSearchParams,
): ITableColumn[] =>
    columns.map((col) => {
        if (!col.sorter && !col.searchType) {
            return col;
        }

        const columnTitleStr = typeof col.title === 'string' ? col.title : 'Column';
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip AntD's native sorter so it doesn't render its own sort UI
        const { sorter: _omitAntdSorter, ...columnForTable } = col;

        const customTitle = (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <span style={{ flex: 1 }}>{col.title}</span>

                {col.sorter && renderSortIcon(col.key, sortState, onSort)}

                {col.searchType && (
                    <ColumnSearchModal
                        open={openSearchColumn === col.key}
                        onClose={onCloseSearch}
                        onSearch={(value) => {
                            onSearch(col.key, value);
                            onCloseSearch();
                        }}
                        columnTitle={columnTitleStr}
                        initialValue={getSearchValue(col.key)}
                        searchType={col.searchType}
                        disableFutureDates={col.disableFutureDates}
                        triggerElement={
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleSearch(col.key);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="users-table__sort-icon__search"
                                title="Search"
                            >
                                <SearchOutlined
                                    className={`users-table__sort-icon__search-icon ${openSearchColumn === col.key || getSearchValue(col.key) ? 'users-table__sort-icon__search-icon--active' : ''}`}
                                />
                            </button>
                        }
                    />
                )}
            </div>
        );

        return { ...columnForTable, title: customTitle };
    });
