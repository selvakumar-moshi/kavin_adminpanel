import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getQuizzes, deleteQuiz, publishQuiz, copyQuiz, getBatches, getCourses } from '../../services/LearningAction';
import type { QuizRecord } from './Constant';
import type { BatchRecord, CourseRecord } from '../Course/Constant';
import { getQuizTableColumns, QUIZ_TYPE_DAILY, dayjsToISOString, QUIZ_SEARCH_INPUT_FIELDS, QUIZ_TO_VIEW_PAID, DEFAULT_FREE_KIND, getQuizScope, getTabForQuiz, usesFolderSelector } from './Constant';
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
    const [isCopyModalVisible, setIsCopyModalVisible] = useState(false);
    const [copyTitle, setCopyTitle] = useState('');
    const [copyCourseId, setCopyCourseId] = useState('');
    const [copyBatchId, setCopyBatchId] = useState('');
    const [copyQuizToView, setCopyQuizToView] = useState('');
    const [copyErrors, setCopyErrors] = useState<Record<string, string>>({});
    const [operationType, setOperationType] = useState<'delete' | 'publish' | 'copy' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchValue, setSearchValue] = useState('');
    // Two tabs: Competitive (Paid) and Free MCQ. The Free MCQ tab has a dropdown for the kind of free quiz (Daily by
    // default). Coming back from the Add / Edit Quiz page, that quiz's type and view are passed in, so the list opens
    // on the tab (and kind) it belongs to.
    const returnedState = location.state as { quizType?: string; quizToView?: string } | null;
    const [initialScope] = useState(() => getTabForQuiz(returnedState?.quizType, returnedState?.quizToView));
    const [activeTab, setActiveTab] = useState(initialScope.tab);
    const [freeKind, setFreeKind] = useState(initialScope.freeKind || DEFAULT_FREE_KIND);
    // What the search API is asked for (`quizType` + `quizToView`) and which columns the table shows
    const { quizType: listQuizType, quizToView: listQuizToView } = getQuizScope(activeTab, freeKind);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
    const activeFilterCount = Object.values(appliedFilters).filter(value => value && value.trim() !== '').length;

    const { QuizzesData, BatchesData, CoursesData, apiStatus } = useSelector(
        (state: RootState) => state.learning
    );

    // Server-paginated response: { items: QuizRecord[], pageNumber, pageSize, totalCount, totalPages }
    const quizzesArray: QuizRecord[] = Array.isArray(QuizzesData?.items) ? QuizzesData.items : [];
    const totalQuizzes: number = QuizzesData?.totalCount ?? 0;
    const loading = apiStatus.QuizzesData?.loading || false;
    // Folder based and Daily quizzes have no course / batch to copy into
    const copyHasCourseBatch = !usesFolderSelector(listQuizType) && listQuizType !== QUIZ_TYPE_DAILY;
    const copyCourseOptions = (Array.isArray(CoursesData) ? (CoursesData as CourseRecord[]) : [])
        .map((course) => ({ value: course.id, label: course.courseName }));
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

    const displayQuizzes = applyToData(quizzesArray, getQuizTableColumns(listQuizType));

    // Search/filter/tab changes always start back at page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [searchValue, appliedFilters, listQuizType, listQuizToView]);

    useEffect(() => {
        dispatch(getQuizzes({
            searchTerm: searchValue.trim() || undefined,
            globalFilter: appliedFilters,
            pageNumber: currentPage,
            pageSize,
            quizType: listQuizType,
            quizToView: listQuizToView,
        }) as any);
    }, [dispatch, currentPage, pageSize, searchValue, appliedFilters, listQuizType, listQuizToView]);

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
                quizType: listQuizType,
            quizToView: listQuizToView,
            }) as any);
        }

        if (apiStatus.QuizzesData?.error) {
            showError(apiStatus.QuizzesData.error);
            setOperationType(null);
        }
    }, [apiStatus.QuizzesData, operationType, showSuccess, showError, dispatch, currentPage, pageSize, searchValue, appliedFilters, listQuizType, listQuizToView]);

    // A quiz was created from the embedded School Book Revision form: confirm it and reload the list
    const handleSchoolQuizCreated = () => {
        showSuccess('Quiz created successfully!');
        dispatch(getQuizzes({
            searchTerm: searchValue.trim() || undefined,
            globalFilter: appliedFilters,
            pageNumber: currentPage,
            pageSize,
            quizType: listQuizType,
            quizToView: listQuizToView,
        }) as any);
    };

    // The Add Quiz page is tagged with what is being viewed: Competitive = competitive / Paid; Free MCQ = the kind chosen
    // in its dropdown (Daily = competitive) / Free. They decide the page's title and are sent as `quizType` and
    // `quizToView` on Create.
    const openCreateQuiz = () => {
        navigate('/quiz/create', { state: { quizType: listQuizType, quizToView: listQuizToView } });
    };

    const handleFreeKindChange = (value: string | string[]) => {
        setFreeKind(Array.isArray(value) ? value[0] || DEFAULT_FREE_KIND : value || DEFAULT_FREE_KIND);
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
        setCopyCourseId(quiz.courseId || '');
        setCopyBatchId('');
        // Copies keep the view of the tab being looked at (Competitive = Paid, Free MCQ = Free), so it isn't asked for
        setCopyQuizToView(listQuizToView);
        setCopyErrors({});
        setIsCopyModalVisible(true);
        if (copyHasCourseBatch) {
            dispatch(getCourses() as any);
            if (quiz.courseId) {
                dispatch(getBatches({ courseId: quiz.courseId, pageSize: 100 }) as any);
            }
        }
    };

    const closeCopyModal = () => {
        setIsCopyModalVisible(false);
        setSelectedQuiz(null);
        setCopyTitle('');
        setCopyCourseId('');
        setCopyBatchId('');
        setCopyQuizToView('');
        setCopyErrors({});
    };

    // Picking another course clears the batch and loads that course's batches
    const handleCopyCourseChange = (value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] || '' : value;
        setCopyCourseId(stringValue);
        setCopyBatchId('');
        setCopyErrors((prev) => ({ ...prev, courseId: '', batchId: '' }));
        if (stringValue) {
            dispatch(getBatches({ courseId: stringValue, pageSize: 100 }) as any);
        }
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
        const isPaid = copyQuizToView === QUIZ_TO_VIEW_PAID;
        // Course and batch are required for a Paid copy; a Free one may leave them empty
        if (isPaid && copyHasCourseBatch && !copyCourseId) errors.courseId = 'Course is required';
        if (isPaid && !copyBatchId) errors.batchId = 'Batch is required';
        if (Object.keys(errors).length > 0) {
            setCopyErrors(errors);
            return;
        }

        setOperationType('copy');
        dispatch(copyQuiz({
            quizId: selectedQuiz.id,
            courseId: copyCourseId,
            batchId: copyBatchId,
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
        copyCourseId,
        copyCourseOptions,
        handleCopyCourseChange,
        copyBatchId,
        copyQuizToView,
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
        listQuizType,
        freeKind,
        handleFreeKindChange,
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
