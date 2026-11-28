import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getUsers, deleteUser } from '../../services/LearningAction';
import superSalesAPI from '../../services/LearningAPI';
import type { UserRecord } from './Constants';
import { SEARCH_INPUT_FIELDS, getUserTableColumns, CREATE_USER_VALIDATION_RULES, MIN_PASSWORD_LENGTH } from './Constants';
import { useResetPassword } from './useResetPassword';
import { USER_FILTER_FIELDS } from '../../utils/filterUtils';
import { useColumnSortSearch, getSortedTableData } from '../../components/Table/useColumnSortSearch';
import { saveBlobResponse } from '../../utils/downloadFile';

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

    // Create User modal
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [createValues, setCreateValues] = useState<Record<string, string>>({});
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
    const [isCreating, setIsCreating] = useState(false);

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
        (state: RootState) => state.learning
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

    const resetPassword = useResetPassword(showError);

    const getCreateFieldError = (field: string, rawValue: string, values: Record<string, string>): string => {
        const rule = CREATE_USER_VALIDATION_RULES[field];
        const value = (rawValue || '').trim();
        if (rule?.required && !value) return rule.errorMessages.required || 'This field is required';
        if (rule?.pattern && value && !rule.pattern.test(value)) return rule.errorMessages.pattern || 'Invalid format.';
        if (field === 'password' && value && rawValue.length < MIN_PASSWORD_LENGTH) {
            return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
        }
        if (field === 'confirmPassword' && value && rawValue !== values.password) return 'Passwords do not match.';
        return '';
    };

    const openCreateModal = () => {
        setCreateValues({});
        setCreateErrors({});
        setIsCreateModalVisible(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalVisible(false);
        setCreateValues({});
        setCreateErrors({});
    };

    const handleCreateChange = (name: string, value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] || '' : value;
        const nextValues = { ...createValues, [name]: stringValue };
        setCreateValues(nextValues);

        setCreateErrors((prev) => {
            const next = { ...prev };
            const error = getCreateFieldError(name, stringValue, nextValues);
            if (error) next[name] = error;
            else delete next[name];
            // Changing the password changes whether the confirmation still matches
            if (name === 'password' && nextValues.confirmPassword) {
                const confirmError = getCreateFieldError('confirmPassword', nextValues.confirmPassword, nextValues);
                if (confirmError) next.confirmPassword = confirmError;
                else delete next.confirmPassword;
            }
            return next;
        });
    };

    const handleCreateSubmit = async () => {
        const errors: Record<string, string> = {};
        Object.keys(CREATE_USER_VALIDATION_RULES).forEach((field) => {
            const error = getCreateFieldError(field, createValues[field], createValues);
            if (error) errors[field] = error;
        });
        setCreateErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setIsCreating(true);
        try {
            // Called directly (not through the Redux thunk) so the login page's sign-up state is left alone
            const res = await superSalesAPI.getRegister(
                createValues.firstName.trim(),
                createValues.lastName.trim(),
                createValues.phoneNumber.trim(),
                createValues.email.trim(),
                createValues.password,
                createValues.district,
                createValues.confirmPassword,
            );
            showSuccess(res?.data?.message || 'User created successfully!');
            closeCreateModal();
            setNeedsRefresh(true);
        } catch (error: any) {
            showError(error?.response?.data?.message || error?.message || 'Failed to create the user');
        } finally {
            setIsCreating(false);
        }
    };

    // Download: GET /User/download, saved as a file
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const res = await superSalesAPI.getUsersDownload();
            saveBlobResponse(res, 'Users.xlsx');
        } catch (error: any) {
            showError(error?.response?.data?.message || error?.message || 'Failed to download users');
        } finally {
            setIsDownloading(false);
        }
    };

    // Reset device: asks first, then POST /User/{id}/reset-device
    const [deviceResetUser, setDeviceResetUser] = useState<UserRecord | null>(null);
    const [isResettingDevice, setIsResettingDevice] = useState(false);

    const handleResetDeviceConfirm = async () => {
        if (!deviceResetUser) return;
        setIsResettingDevice(true);
        try {
            const res = await superSalesAPI.resetUserDevice(deviceResetUser.userId);
            showSuccess(res?.data?.message);
            setDeviceResetUser(null);
        } catch (error: any) {
            showError(error?.response?.data?.message || error?.message || 'Failed to reset the device');
        } finally {
            setIsResettingDevice(false);
        }
    };

    const handleActionClick = (action: string, record: UserRecord) => {
        switch (action.toLowerCase()) {
            case 'reset-device':
                setDeviceResetUser(record);
                break;
            case 'reset-password':
                resetPassword.openConfirm({ userId: record.userId, name: `${record.firstName} ${record.lastName}`.trim() });
                break;
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

        // Create User
        isCreateModalVisible,
        createValues,
        createErrors,
        isCreating,
        openCreateModal,
        closeCreateModal,
        handleCreateChange,
        handleCreateSubmit,

        // Reset password
        resetPassword,
        isDownloading,
        handleDownload,
        deviceResetUser,
        isResettingDevice,
        closeResetDevice: () => setDeviceResetUser(null),
        handleResetDeviceConfirm,

        // Toast
        toastMessages,
        hideToast,
    };
};
