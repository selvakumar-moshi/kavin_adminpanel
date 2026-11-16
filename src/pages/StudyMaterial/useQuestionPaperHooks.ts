import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { UploadFile } from 'antd';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getQuestionPapers, createQuestionPaper, updateQuestionPaper, deleteQuestionPaper, getBatches,} from '../../services/LearningAction';
import type { QuestionPaperRecord } from './Constants';
import { getStudyMaterialTableColumns } from './Constants';
import type { CourseRecord, BatchRecord } from '../Course/Constant';
import { useClientSideTableSortSearch } from '../../components/Table/useColumnSortSearch';
import { STUDY_MATERIAL_VALIDATION_RULES } from '../../utils/validationUtils';

export const useQuestionPaperManagement = (searchTerm = '', appliedFilters: Record<string, string> = {}, courseId = '') => {
    const dispatch = useDispatch();
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<QuestionPaperRecord | null>(null);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [operationType, setOperationType] = useState<'create' | 'edit' | 'delete' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { QuestionPaperData, CoursesData, BatchesData, apiStatus } = useSelector(
        (state: RootState) => state.learning
    );

    // Server-paginated response: { items: QuestionPaperRecord[], pageNumber, pageSize, totalCount, totalPages }
    const questionPapersArray = Array.isArray(QuestionPaperData?.items) ? (QuestionPaperData.items as QuestionPaperRecord[]) : [];
    const totalQuestionPapers: number = QuestionPaperData?.totalCount ?? 0;
    const coursesArray = Array.isArray(CoursesData) ? (CoursesData as CourseRecord[]) : [];
    // Batch dropdown for the selected course — request a large page so it's never truncated
    const batchesArray = Array.isArray(BatchesData?.items) ? (BatchesData.items as BatchRecord[]) : [];
    const loading = apiStatus.QuestionPaperData?.loading || false;
    const batchesLoading = apiStatus.BatchesData?.loading || false;

    // Column-level sort & search (client-side — the Study Material list has no server-side search contract)
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

    const getCourseName = (courseId: string) => coursesArray.find(c => c.id === courseId)?.courseName || '-';
    const columns = getStudyMaterialTableColumns(getCourseName);
    const displayQuestionPapers = applyToData(questionPapersArray, columns);

    // Courses are fetched once by the parent Material page (shared with the header course filter)
    // — fetching again here would double the request while this tab is active.

    // Search/filter/course changes always start back at page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, appliedFilters, courseId]);

    // Fetch whenever page, page size, search term, filters, or course change
    useEffect(() => {
        dispatch(getQuestionPapers({
            searchTerm: searchTerm.trim() || undefined,
            courseId: courseId || undefined,
            globalFilter: appliedFilters,
            pageNumber: currentPage,
            pageSize,
        }) as any);
    }, [dispatch, currentPage, pageSize, searchTerm, appliedFilters, courseId]);

    const handlePaginationChange = (page: number, newPageSize: number) => {
        setCurrentPage(page);
        if (newPageSize !== pageSize) {
            setPageSize(newPageSize);
            setCurrentPage(1);
        }
    };

    useEffect(() => {
        if (!operationType) return;

        if (apiStatus.QuestionPaperData?.success) {
            if (operationType === 'create') {
                showSuccess('Question paper created successfully!');
                setIsModalVisible(false);
            } else if (operationType === 'edit') {
                showSuccess('Question paper updated successfully!');
                setIsModalVisible(false);
            } else if (operationType === 'delete') {
                showSuccess('Question paper deleted successfully!');
                setIsDeleteModalVisible(false);
            }
            setFormValues({});
            setFormErrors({});
            setFileList([]);
            setSelectedMaterial(null);
            setOperationType(null);
            dispatch(getQuestionPapers({
                searchTerm: searchTerm.trim() || undefined,
                courseId: courseId || undefined,
                globalFilter: appliedFilters,
                pageNumber: currentPage,
                pageSize,
            }) as any);
        }

        if (apiStatus.QuestionPaperData?.error) {
            showError(apiStatus.QuestionPaperData.error);
            setOperationType(null);
        }
    }, [apiStatus.QuestionPaperData, operationType, showSuccess, showError, dispatch, currentPage, pageSize, searchTerm, appliedFilters, courseId]);

    const openCreateModal = () => {
        setSelectedMaterial(null);
        setFormValues({});
        setFormErrors({});
        setFileList([]);
        setIsModalVisible(true);
    };

    const openEditModal = (material: QuestionPaperRecord) => {
        setSelectedMaterial(material);
        setFormValues({
            title: material.title || '',
            description: material.description || '',
            courseId: material.courseId || '',
            batchId: material.batchId || '',
            materialToView: material.materialToView || '',
        });
        setFormErrors({});
        setFileList([]);
        if (material.courseId) {
            dispatch(getBatches({ courseId: material.courseId, pageSize: 100 }) as any);
        }
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setSelectedMaterial(null);
        setFormValues({});
        setFormErrors({});
        setFileList([]);
    };

    const openDeleteModal = (material: QuestionPaperRecord) => {
        setSelectedMaterial(material);
        setIsDeleteModalVisible(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalVisible(false);
        setSelectedMaterial(null);
    };

    const validateSingleField = (field: string, rawValue: string): string => {
        const rule = STUDY_MATERIAL_VALIDATION_RULES[field];
        if (!rule) return '';

        const value = (rawValue || '').trim();

        if (rule.required && !value) {
            return rule.errorMessages.required || 'This field is required';
        }
        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
            return rule.errorMessages.maxLength || `Must not exceed ${rule.maxLength} characters.`;
        }
        if (rule.pattern && value && !rule.pattern.test(value)) {
            return rule.errorMessages.pattern || 'Invalid format.';
        }
        return '';
    };

    const handleInputChange = (name: string, value: string) => {
        setFormValues(prev => ({ ...prev, [name]: value }));

        const error = validateSingleField(name, value);
        setFormErrors(prev => {
            const newErrors = { ...prev };
            if (error) {
                newErrors[name] = error;
            } else {
                delete newErrors[name];
            }
            return newErrors;
        });
    };

    const handleDropdownChange = (name: string, value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] || '' : value;
        setFormValues(prev => ({ ...prev, [name]: stringValue }));
        if (formErrors[name]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        if (name === 'courseId') {
            setFormValues(prev => ({ ...prev, batchId: '' }));
            if (stringValue) {
                dispatch(getBatches({ courseId: stringValue, pageSize: 100 }) as any);
            }
        }
    };

    const handleFileChange = (files: UploadFile[]) => {
        setFileList(files);
        if (formErrors.pdffile) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.pdffile;
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        Object.keys(STUDY_MATERIAL_VALIDATION_RULES).forEach((field) => {
            const error = validateSingleField(field, formValues[field]);
            if (error) {
                newErrors[field] = error;
            }
        });

        if (!formValues.courseId) {
            newErrors.courseId = 'Course is required';
        }

        if (!formValues.materialToView) {
            newErrors.materialToView = 'Material to view is required';
        }

        if (!selectedMaterial && fileList.length === 0) {
            newErrors.pdffile = 'PDF file is required';
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Create: enabled once any field has a value. Edit: enabled once a value differs from the loaded material.
    const hasFormChanges = selectedMaterial
        ? (
            (formValues.title || '') !== (selectedMaterial.title || '') ||
            (formValues.description || '') !== (selectedMaterial.description || '') ||
            (formValues.courseId || '') !== (selectedMaterial.courseId || '') ||
            (formValues.batchId || '') !== (selectedMaterial.batchId || '') ||
            (formValues.materialToView || '') !== (selectedMaterial.materialToView || '') ||
            fileList.length > 0
        )
        : (
            Boolean(formValues.title?.trim()) ||
            Boolean(formValues.description?.trim()) ||
            Boolean(formValues.courseId) ||
            Boolean(formValues.batchId) ||
            Boolean(formValues.materialToView) ||
            fileList.length > 0
        );

    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }

        const formData = new FormData();
        formData.append('title', formValues.title);
        formData.append('courseId', formValues.courseId);
        formData.append('description', formValues.description || '');
        formData.append('batchId', formValues.batchId || '');
        formData.append('materialToView', formValues.materialToView);

        const file = fileList[0]?.originFileObj;
        if (file) {
            formData.append('pdffile', file);
        }

        if (selectedMaterial) {
            setOperationType('edit');
            dispatch(updateQuestionPaper({ id: selectedMaterial.id, formData }) as any);
        } else {
            setOperationType('create');
            dispatch(createQuestionPaper(formData) as any);
        }
    };

    const handleDeleteConfirm = () => {
        if (!selectedMaterial) return;
        setOperationType('delete');
        dispatch(deleteQuestionPaper({ id: selectedMaterial.id }) as any);
    };

    return {
        questionPapersArray: displayQuestionPapers,
        coursesArray,
        batchesArray,
        loading,
        batchesLoading,
        currentPage,
        pageSize,
        totalQuestionPapers,
        handlePaginationChange,
        isModalVisible,
        isDeleteModalVisible,
        selectedMaterial,
        formValues,
        formErrors,
        fileList,
        hasFormChanges,
        getCourseName,

        // Column sort & search
        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,

        openCreateModal,
        openEditModal,
        closeModal,
        openDeleteModal,
        closeDeleteModal,
        handleInputChange,
        handleDropdownChange,
        handleFileChange,
        handleSubmit,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    };
};
