import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getUsers, deleteUser } from '../../services/SuperSalesAction';
import type { UserRecord } from './Constants';
import { SEARCH_INPUT_FIELDS, getUserTableColumns } from './Constants';
import { USER_FILTER_FIELDS } from '../../utils/filterUtils';
import { useColumnSortSearch, getSortedTableData } from '../../components/Table/useColumnSortSearch';

// Column keys that don't map 1:1 to a backend filter field name
const COLUMN_FILTER_FIELD_MAP: Record<string, string> = {
    userName: 'firstName',
};

export const useUserManagement = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Modal states
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<UserRecord | null>(null);

    // Track which operation is in progress
    const [operationType, setOperationType] = useState<'delete' | null>(null);
    const [needsRefresh, setNeedsRefresh] = useState(false);

    // Search & filter state
    const [searchValue, setSearchValue] = useState('');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
    const activeFilterCount = Object.values(appliedFilters).filter(value => value && value.trim() !== '').length;

    // Redux state
    const { UsersData, loading, apiStatus } = useSelector(
        (state: RootState) => state.superSales
    );

    // Server-paginated response: { items: UserRecord[], pageNumber, pageSize, totalCount, totalPages }
    const usersArray: any[] = Array.isArray(UsersData?.items) ? UsersData.items : [];
    const totalUsers: number = UsersData?.totalCount ?? 0;

    const buildGlobalFilter = (filters: Record<string, string>): Record<string, string> =>
        Object.fromEntries(
            Object.entries(filters).filter(([, value]) => value && value.trim() !== '')
        );

    const trimmedSearchTerm = searchValue.trim();

    // Search/filter changes always start back at page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [trimmedSearchTerm, appliedFilters]);

    // Single source of truth: (re)fetch whenever page, page size, search term, or filters change
    useEffect(() => {
        dispatch(getUsers({
            searchTerm: trimmedSearchTerm || undefined,
            globalFilter: buildGlobalFilter(appliedFilters),
            pageNumber: currentPage,
            pageSize,
        }) as any);
    }, [dispatch, currentPage, pageSize, trimmedSearchTerm, appliedFilters]);

    const handleSearchChange = (_name: string, value: string) => {
        setSearchValue(value);
    };

    const toggleFilterDropdown = () => {
        setIsFilterDropdownOpen(prev => !prev);
    };

    const closeFilterModal = () => {
        setIsFilterDropdownOpen(false);
    };

    const handleApplyFilters = (filters: Record<string, string>) => {
        setAppliedFilters(filters);
    };

    const handleResetFilters = () => {
        setAppliedFilters({});
    };

    // Handle API status changes
    useEffect(() => {
        if (apiStatus.UsersData?.success && operationType === 'delete') {
            showSuccess('User deleted successfully!');
            handleDeleteModalClose();
            setOperationType(null);
            setNeedsRefresh(true);
        }

        if (apiStatus.UsersData?.error) {
            showError(apiStatus.UsersData.error);
            setOperationType(null);
        }
    }, [apiStatus.UsersData, operationType, showSuccess, showError]);

    // Refresh data when needed
    useEffect(() => {
        if (needsRefresh) {
            dispatch(getUsers({
                searchTerm: trimmedSearchTerm || undefined,
                globalFilter: buildGlobalFilter(appliedFilters),
                pageNumber: currentPage,
                pageSize,
            }) as any);
            setNeedsRefresh(false);
        }
    }, [needsRefresh, dispatch, currentPage, pageSize, trimmedSearchTerm, appliedFilters]);

    // Shared column-level sort & per-column search state (reusable across any table)
    const {
        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,
    } = useColumnSortSearch({
        fieldMap: COLUMN_FILTER_FIELD_MAP,
        getSearchValue: (field) => appliedFilters[field] || '',
        onSearch: (field, value) => {
            setAppliedFilters(prev => {
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

    // Data is already paginated server-side; only sort the current page client-side
    const getPaginatedData = () => getSortedTableData(usersArray, getUserTableColumns(), sortState);

    const handlePaginationChange = (page: number, newPageSize: number) => {
        setCurrentPage(page);
        if (newPageSize !== pageSize) {
            setPageSize(newPageSize);
            setCurrentPage(1);
        }
    };

    const handleActionClick = (action: string, record: UserRecord) => {
        switch (action.toLowerCase()) {
            case 'edit':
                navigate(`/user/${record.userId}`);
                break;
            case 'delete':
                setSelectedRecord(record);
                setIsDeleteModalVisible(true);
                break;
            default:
                break;
        }
    };

    // Close delete modal
    const handleDeleteModalClose = () => {
        setIsDeleteModalVisible(false);
        setSelectedRecord(null);
    };

    const handleDeleteConfirm = () => {
        if (!selectedRecord) return;
        setOperationType('delete');
        dispatch(deleteUser({ id: selectedRecord.userId }) as any);
    };

    return {
        // State
        currentPage,
        pageSize,
        isDeleteModalVisible,
        selectedRecord,
        usersArray,
        totalUsers,
        loading,
        getPaginatedData,

        // Search & filter
        searchField: SEARCH_INPUT_FIELDS,
        searchValue,
        activeFilterCount,
        isFilterDropdownOpen,
        filterField: USER_FILTER_FIELDS,
        appliedFilters,
        sortState,
        openSearchColumn,

        // Handlers
        handlePaginationChange,
        handleActionClick,
        handleDeleteModalClose,
        handleDeleteConfirm,
        handleSearchChange,
        toggleFilterDropdown,
        closeFilterModal,
        handleApplyFilters,
        handleResetFilters,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,

        // Toast
        toastMessages,
        hideToast,
    };
};
