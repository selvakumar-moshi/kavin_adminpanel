import { useState } from 'react';
import dayjs from 'dayjs';
import type { ITableColumn } from './ITable';

export type SortOrder = 'ascend' | 'descend' | null;

/**
 * Sorts `data` by whichever column (if any) is currently active in `sortState`,
 * using that column's own `sorter` comparator. Pure — safe to call from any
 * hook/page that owns a list + a `getXTableColumns()`-style column definition.
 */
export const getSortedTableData = <T,>(
    data: T[],
    columns: ITableColumn[],
    sortState: Record<string, SortOrder>,
): T[] => {
    const activeKey = Object.keys(sortState)[0];
    const activeOrder = activeKey ? sortState[activeKey] : null;
    if (!activeKey || !activeOrder) return data;

    const column = columns.find(c => c.key === activeKey);
    if (!column?.sorter) return data;

    const sorted = [...data].sort(column.sorter);
    return activeOrder === 'descend' ? sorted.reverse() : sorted;
};

/**
 * OR-across-fields text search (e.g. a single search box matching title OR
 * description), as opposed to `filterTableData`'s AND-across-columns matching.
 * Pure client-side — for lists whose backing API has no server-side search.
 */
export const searchAcrossFields = <T extends Record<string, any>>(
    data: T[],
    fields: string[],
    searchTerm: string,
): T[] => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return data;

    return data.filter((record) =>
        fields.some((field) => String(record[field] ?? '').toLowerCase().includes(term))
    );
};

/**
 * Filters `data` client-side against per-column text/date values, matching each
 * column's `dataIndex` (falling back to its `key`). Intended for tables whose
 * backing API has no server-side search contract — everything is already loaded,
 * so filtering happens in memory instead of round-tripping to the server.
 */
export const filterTableData = <T extends Record<string, any>>(
    data: T[],
    columns: ITableColumn[],
    filters: Record<string, string>,
): T[] => {
    const activeFilters = Object.entries(filters).filter(([, value]) => value && value.trim() !== '');
    if (activeFilters.length === 0) return data;

    return data.filter((record) =>
        activeFilters.every(([key, value]) => {
            const column = columns.find(c => c.key === key);
            const dataIndex = column?.dataIndex || key;
            const rawValue = record[dataIndex];
            if (rawValue === null || rawValue === undefined) return false;

            if (column?.searchType === 'date') {
                const parsed = dayjs(rawValue);
                return parsed.isValid() && parsed.format('YYYY-MM-DD') === value;
            }

            return String(rawValue).toLowerCase().includes(value.toLowerCase());
        })
    );
};

export interface UseColumnSortSearchOptions {
    /**
     * Maps a column key to the field name your filter store / API actually uses,
     * for columns whose key doesn't match 1:1 (e.g. a composite "userName" column
     * backed by a "firstName" field). Defaults to identity.
     */
    fieldMap?: Record<string, string>;
    /** Returns the currently applied value for a field, used to prefill/highlight a column's search icon. */
    getSearchValue: (field: string) => string;
    /** Called whenever a column-level search value changes, including clearing (value=''). */
    onSearch: (field: string, value: string) => void;
}

/**
 * Reusable column-level sort + per-column search state, shared across any table
 * that wants AntD-style click-to-sort headers and a `ColumnSearchModal` popover
 * per column, without re-implementing the state machine on every page.
 *
 * Pair with `withSortAndSearch()` to render the actual header UI, and
 * `getSortedTableData()` to apply `sortState` to your data before pagination.
 */
export const useColumnSortSearch = ({ fieldMap = {}, getSearchValue, onSearch }: UseColumnSortSearchOptions) => {
    // At most one column is ever populated (setting a new column's order replaces
    // the map), so `sortState[colKey]` reads that column's order and everything
    // else is implicitly unsorted.
    const [sortState, setSortState] = useState<Record<string, SortOrder>>({});
    const [openSearchColumn, setOpenSearchColumn] = useState<string | null>(null);

    // Cycles a column's order: unsorted -> ascend -> descend -> unsorted, mirroring AntD's native sorter UX
    const handleSort = (key: string) => {
        setSortState(prev => {
            const current = prev[key] ?? null;
            if (current === null) return { [key]: 'ascend' };
            if (current === 'ascend') return { [key]: 'descend' };
            return {};
        });
    };

    const toggleSearchColumn = (key: string) => {
        setOpenSearchColumn(prev => (prev === key ? null : key));
    };

    const closeSearchColumn = () => {
        setOpenSearchColumn(null);
    };

    const resolveField = (key: string) => fieldMap[key] || key;

    const getColumnSearchValue = (key: string) => getSearchValue(resolveField(key));

    const handleColumnSearch = (key: string, value: string) => {
        onSearch(resolveField(key), value);
    };

    return {
        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,
    };
};

/**
 * Batteries-included variant of `useColumnSortSearch` for tables whose backing
 * API has no server-side search/sort contract: it owns the per-column filter
 * values itself (client-side) and exposes `applyToData()` to filter + sort a
 * fully-loaded array in one call before pagination.
 */
export const useClientSideTableSortSearch = () => {
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

    const columnSortSearch = useColumnSortSearch({
        getSearchValue: (field) => columnFilters[field] || '',
        onSearch: (field, value) => {
            setColumnFilters(prev => {
                const next = { ...prev };
                if (value && value.trim() !== '') {
                    next[field] = value;
                } else {
                    delete next[field];
                }
                return next;
            });
        },
    });

    const applyToData = <T extends Record<string, any>>(data: T[], columns: ITableColumn[]): T[] =>
        getSortedTableData(filterTableData(data, columns, columnFilters), columns, columnSortSearch.sortState);

    return {
        ...columnSortSearch,
        columnFilters,
        applyToData,
    };
};
