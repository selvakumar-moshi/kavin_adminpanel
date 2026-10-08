import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getQuizzes, deleteQuiz, publishQuiz, copyQuiz, getBatches } from '../../services/LearningAction';
import type { QuizRecord } from './Constant';
import type { BatchRecord } from '../Course/Constant';
import { getQuizTableColumns, dayjsToISOString, QUIZ_SEARCH_INPUT_FIELDS, QUIZ_TO_VIEW_PAID, QUIZ_TYPE_SCHOOL } from './Constant';
import { QUIZ_FILTER_FIELDS } from '../../utils/filterUtils';
import { useClientSideTableSortSearch } from '../../components/Table/useColumnSortSearch';

const DEFAULT_QUIZ_TAB = 'competitive';
const SCHOOL_COPY_QUIZ_TO_VIEW = 'Free';

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
    const [isCopyModalVisible, setIsCopyModalVisible] = useState(false);
    const [copyTitle, setCopyTitle] = useState('');
    const [copyBatchId, setCopyBatchId] = useState('');
    const [copyQuizToView, setCopyQuizToView] = useState('');
    const [copyErrors, setCopyErrors] = useState<Record<string, string>>({});
    const [operationType, setOperationType] = useState<'delete' | 'publish' | 'copy' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchValue, setSearchValue] = useState('');
    // Which Quiz tab is showing ("competitive" / "school" / ...); sent to the search API as `quizType`
    // Coming back from the Add / Edit Quiz page, the tab that quiz belongs to is passed in (so the list opens on it)
    const [activeTab, setActiveTab] = useState(
        () => (location.state as { quizType?: string } | null)?.quizType || DEFAULT_QUIZ_TAB
    );
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
    const activeFilterCount = Object.values(appliedFilters).filter(value => value && value.trim() !== '').length;

    const { QuizzesData, BatchesData, apiStatus } = useSelector(
        (state: RootState) => state.learning
    );

    // Server-paginated response: { items: QuizRecord[], pageNumber, pageSize, totalCount, totalPages }
    const quizzesArray: QuizRecord[] = Array.isArray(QuizzesData?.items) ? QuizzesData.items : [];
    const totalQuizzes: number = QuizzesData?.totalCount ?? 0;
    const loading = apiStatus.QuizzesData?.loading || false;
    const copyBatchOptions = (Array.isArray(BatchesData?.items) ? (BatchesData.items as BatchRecord[]) : [])
        .map((batch) => ({ value: batch.id, label: batch.title }));
    const copyBatchesLoading = apiStatus.BatchesData?.loading || false;

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

    const displayQuizzes = applyToData(quizzesArray, getQuizTableColumns(activeTab));

    // Search/filter/tab changes always start back at page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [searchValue, appliedFilters, activeTab]);

    useEffect(() => {
        dispatch(getQuizzes({
            searchTerm: searchValue.trim() || undefined,
            globalFilter: appliedFilters,
            pageNumber: currentPage,
            pageSize,
            quizType: activeTab,
        }) as any);
    }, [dispatch, currentPage, pageSize, searchValue, appliedFilters, activeTab]);

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
            } else if (operationType === 'copy') {
                showSuccess('Quiz copied successfully!');
                setIsCopyModalVisible(false);
            }
            setSelectedQuiz(null);
            setOperationType(null);
            dispatch(getQuizzes({
                searchTerm: searchValue.trim() || undefined,
                globalFilter: appliedFilters,
                pageNumber: currentPage,
                pageSize,
                quizType: activeTab,
            }) as any);
        }

        if (apiStatus.QuizzesData?.error) {
            showError(apiStatus.QuizzesData.error);
            setOperationType(null);
        }
    }, [apiStatus.QuizzesData, operationType, showSuccess, showError, dispatch, currentPage, pageSize, searchValue, appliedFilters, activeTab]);

    // A quiz was created from the embedded School Book Revision form: confirm it and reload the list
    const handleSchoolQuizCreated = () => {
        showSuccess('Quiz created successfully!');
        dispatch(getQuizzes({
            searchTerm: searchValue.trim() || undefined,
            globalFilter: appliedFilters,
            pageNumber: currentPage,
            pageSize,
            quizType: activeTab,
        }) as any);
    };

    const openCreateQuiz = () => {
        // The Add Quiz page tags the new quiz with the tab it was opened from
        navigate('/quiz/create', { state: { quizType: activeTab } });
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

    const openCopyModal = (quiz: QuizRecord) => {
        setSelectedQuiz(quiz);
        setCopyTitle(`${quiz.title} - Copy`);
        setCopyBatchId('');
        // School Book quizzes are always Free (the Quiz To View dropdown is hidden for them)
        setCopyQuizToView(activeTab === QUIZ_TYPE_SCHOOL ? SCHOOL_COPY_QUIZ_TO_VIEW : quiz.quizToView || '');
        setCopyErrors({});
        setIsCopyModalVisible(true);
        if (quiz.courseId) {
            dispatch(getBatches({ courseId: quiz.courseId, pageSize: 100 }) as any);
        }
    };

    const closeCopyModal = () => {
        setIsCopyModalVisible(false);
        setSelectedQuiz(null);
        setCopyTitle('');
        setCopyBatchId('');
        setCopyQuizToView('');
        setCopyErrors({});
    };

    const handleCopyQuizToViewChange = (value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] || '' : value;
        setCopyQuizToView(stringValue);
        // A free quiz has no batch, so drop any batch that was picked
        if (stringValue !== QUIZ_TO_VIEW_PAID) setCopyBatchId('');
        setCopyErrors((prev) => ({ ...prev, quizToView: '', batchId: '' }));
    };

    const handleCopyTitleChange = (_name: string, value: string) => {
        setCopyTitle(value);
        if (copyErrors.title) setCopyErrors((prev) => ({ ...prev, title: '' }));
    };

    const handleCopyBatchChange = (value: string | string[]) => {
        setCopyBatchId(Array.isArray(value) ? value[0] || '' : value);
        if (copyErrors.batchId) setCopyErrors((prev) => ({ ...prev, batchId: '' }));
    };

    const handleCopyConfirm = () => {
        if (!selectedQuiz) return;

        const errors: Record<string, string> = {};
        if (!copyTitle.trim()) errors.title = 'Title is required';
        if (!copyQuizToView) errors.quizToView = 'Quiz To View is required';
        const isPaid = copyQuizToView === QUIZ_TO_VIEW_PAID;
        if (isPaid && !copyBatchId) errors.batchId = 'Batch is required';
        if (Object.keys(errors).length > 0) {
            setCopyErrors(errors);
            return;
        }

        setOperationType('copy');
        dispatch(copyQuiz({
            quizId: selectedQuiz.id,
            batchId: isPaid ? copyBatchId : '',
            title: copyTitle.trim(),
            quizToView: copyQuizToView,
        }) as any);
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
        isCopyModalVisible,
        copyTitle,
        copyBatchId,
        copyQuizToView,
        handleCopyQuizToViewChange,
        copyErrors,
        copyBatchOptions,
        copyBatchesLoading,
        openCopyModal,
        closeCopyModal,
        handleCopyTitleChange,
        handleCopyBatchChange,
        handleCopyConfirm,
        selectedQuiz,
        publishExpiresAt,
        publishExpiresAtError,
        activeTab,
        setActiveTab,
        openCreateQuiz,
        handleSchoolQuizCreated,
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
