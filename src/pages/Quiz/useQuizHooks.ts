import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getQuizzes, deleteQuiz, publishQuiz } from '../../services/SuperSalesAction';
import type { QuizRecord } from './Constant';
import { getQuizTableColumns, dayjsToISOString, QUIZ_SEARCH_INPUT_FIELDS } from './Constant';
import { QUIZ_FILTER_FIELDS } from '../../utils/filterUtils';
import { useClientSideTableSortSearch } from '../../components/Table/useColumnSortSearch';

export const useQuizManagement = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [isPublishModalVisible, setIsPublishModalVisible] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<QuizRecord | null>(null);
    const [publishExpiresAt, setPublishExpiresAt] = useState<unknown>(null);
    const [publishExpiresAtError, setPublishExpiresAtError] = useState('');
    const [operationType, setOperationType] = useState<'delete' | 'publish' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchValue, setSearchValue] = useState('');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
    const activeFilterCount = Object.values(appliedFilters).filter(value => value && value.trim() !== '').length;

    const { QuizzesData, apiStatus } = useSelector(
        (state: RootState) => state.superSales
    );

    // Server-paginated response: { items: QuizRecord[], pageNumber, pageSize, totalCount, totalPages }
    const quizzesArray: QuizRecord[] = Array.isArray(QuizzesData?.items) ? QuizzesData.items : [];
    const totalQuizzes: number = QuizzesData?.totalCount ?? 0;
    const loading = apiStatus.QuizzesData?.loading || false;

    // Column-level sort & search (client-side — applied over the currently loaded page)
    const {
        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,
        applyToData,
    } = useClientSideTableSortSearch();

    const displayQuizzes = applyToData(quizzesArray, getQuizTableColumns());

    // Search/filter changes always start back at page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [searchValue, appliedFilters]);

    useEffect(() => {
        dispatch(getQuizzes({
            searchTerm: searchValue.trim() || undefined,
            globalFilter: appliedFilters,
            pageNumber: currentPage,
            pageSize,
        }) as any);
    }, [dispatch, currentPage, pageSize, searchValue, appliedFilters]);

    // Picks up a success toast handed off via navigation state (e.g. from the Create/Edit Quiz
    // page, which unmounts immediately on navigate and can't keep its own toast alive long enough).
    useEffect(() => {
        const navState = location.state as { toastMessage?: string } | undefined | null;
        if (!navState?.toastMessage) return;

        showSuccess(navState.toastMessage);
        navigate(location.pathname, { replace: true, state: null });
    }, [location, navigate, showSuccess]);

    const handlePaginationChange = (page: number, newPageSize: number) => {
        setCurrentPage(page);
        if (newPageSize !== pageSize) {
            setPageSize(newPageSize);
            setCurrentPage(1);
        }
    };

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

    useEffect(() => {
        if (!operationType) return;

        if (apiStatus.QuizzesData?.success) {
            if (operationType === 'delete') {
                showSuccess('Quiz deleted successfully!');
                setIsDeleteModalVisible(false);
            } else if (operationType === 'publish') {
                showSuccess('Quiz published successfully!');
                setIsPublishModalVisible(false);
            }
            setSelectedQuiz(null);
            setOperationType(null);
            dispatch(getQuizzes({
                searchTerm: searchValue.trim() || undefined,
                globalFilter: appliedFilters,
                pageNumber: currentPage,
                pageSize,
            }) as any);
        }

        if (apiStatus.QuizzesData?.error) {
            showError(apiStatus.QuizzesData.error);
            setOperationType(null);
        }
    }, [apiStatus.QuizzesData, operationType, showSuccess, showError, dispatch, currentPage, pageSize, searchValue, appliedFilters]);

    const openCreateQuiz = () => {
        navigate('/quiz/create');
    };

    const openEditQuiz = (quiz: QuizRecord) => {
        navigate(`/quiz/${quiz.id}`);
    };

    const openDeleteModal = (quiz: QuizRecord) => {
        setSelectedQuiz(quiz);
        setIsDeleteModalVisible(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalVisible(false);
        setSelectedQuiz(null);
    };

    const handleDeleteConfirm = () => {
        if (!selectedQuiz) return;
        setOperationType('delete');
        dispatch(deleteQuiz({ id: selectedQuiz.id }) as any);
    };

    const openPublishModal = (quiz: QuizRecord) => {
        setSelectedQuiz(quiz);
        setPublishExpiresAt(null);
        setPublishExpiresAtError('');
        setIsPublishModalVisible(true);
    };

    const closePublishModal = () => {
        setIsPublishModalVisible(false);
        setSelectedQuiz(null);
        setPublishExpiresAt(null);
        setPublishExpiresAtError('');
    };

    const handlePublishExpiresAtChange = (_name: string, value: unknown) => {
        setPublishExpiresAt(value);
        if (publishExpiresAtError) setPublishExpiresAtError('');
    };

    const handlePublishConfirm = () => {
        if (!selectedQuiz) return;

        const expiresAt = dayjsToISOString(publishExpiresAt);
        if (!expiresAt) {
            setPublishExpiresAtError('Expiry date & time is required');
            return;
        }

        setOperationType('publish');
        dispatch(publishQuiz({ id: selectedQuiz.id, expiresAt }) as any);
    };

    return {
        quizzesArray: displayQuizzes,
        loading,
        currentPage,
        pageSize,
        totalQuizzes,
        handlePaginationChange,

        // Global search & filter modal
        searchField: QUIZ_SEARCH_INPUT_FIELDS,
        searchValue,
        activeFilterCount,
        isFilterDropdownOpen,
        filterField: QUIZ_FILTER_FIELDS,
        appliedFilters,
        handleSearchChange,
        toggleFilterDropdown,
        closeFilterModal,
        handleApplyFilters,
        handleResetFilters,

        // Column sort & search
        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,

        isDeleteModalVisible,
        isPublishModalVisible,
        selectedQuiz,
        publishExpiresAt,
        publishExpiresAtError,
        openCreateQuiz,
        openEditQuiz,
        openDeleteModal,
        closeDeleteModal,
        handleDeleteConfirm,
        openPublishModal,
        closePublishModal,
        handlePublishExpiresAtChange,
        handlePublishConfirm,
        toastMessages,
        hideToast,
    };
};
