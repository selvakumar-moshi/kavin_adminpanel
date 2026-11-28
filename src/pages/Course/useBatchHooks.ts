import { useState, useEffect } from 'react';
import type { UploadFile } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getBatches, createBatch, updateBatch, deleteBatch } from '../../services/LearningAction';
import type { BatchRecord } from './Constant';
import { getBatchTableColumns, BATCH_SEARCH_INPUT_FIELDS, dayjsToISOString } from './Constant';
import { useClientSideTableSortSearch } from '../../components/Table/useColumnSortSearch';
import { BATCH_VALIDATION_RULES } from '../../utils/validationUtils';

export const useBatchManagement = (courseId: string | undefined) => {
    const dispatch = useDispatch();
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

    const [isBatchModalVisible, setIsBatchModalVisible] = useState(false);
    const [isBatchDeleteModalVisible, setIsBatchDeleteModalVisible] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(null);
    const [batchFormValues, setBatchFormValues] = useState<Record<string, any>>({});
    const [batchFormErrors, setBatchFormErrors] = useState<Record<string, string>>({});
    // The optional PDF; when editing, the saved one is shown until it is removed (replacingFile)
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [replacingFile, setReplacingFile] = useState(false);
    const [operationType, setOperationType] = useState<'create' | 'edit' | 'delete' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchValue, setSearchValue] = useState('');

    const { BatchesData, apiStatus } = useSelector(
        (state: RootState) => state.learning
    );

    // Server-paginated response: { items: BatchRecord[], pageNumber, pageSize, totalCount, totalPages }
    const batchesArray: BatchRecord[] = Array.isArray(BatchesData?.items) ? BatchesData.items : [];
    const totalBatches: number = BatchesData?.totalCount ?? 0;
    const batchStatus = apiStatus.BatchesData;

    // Column-level sort & search (client-side — the Batch list has no server-side search contract)
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

    const displayBatches = applyToData(batchesArray, getBatchTableColumns());

    const trimmedSearchTerm = searchValue.trim();

    // Switching course or search term always starts back at page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [courseId, trimmedSearchTerm]);

    useEffect(() => {
        if (courseId) {
            dispatch(getBatches({ courseId, searchTerm: trimmedSearchTerm || undefined, pageNumber: currentPage, pageSize }) as any);
        }
    }, [dispatch, courseId, currentPage, pageSize, trimmedSearchTerm]);

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

    useEffect(() => {
        if (!operationType) return;

        if (batchStatus?.success) {
            if (operationType === 'create') {
                showSuccess('Batch created successfully!');
                setIsBatchModalVisible(false);
            } else if (operationType === 'edit') {
                showSuccess('Batch updated successfully!');
                setIsBatchModalVisible(false);
            } else if (operationType === 'delete') {
                showSuccess('Batch deleted successfully!');
                setIsBatchDeleteModalVisible(false);
            }
            setBatchFormValues({});
            setBatchFormErrors({});
            setFileList([]);
            setReplacingFile(false);
            setSelectedBatch(null);
            setOperationType(null);
            if (courseId) {
                dispatch(getBatches({ courseId, searchTerm: trimmedSearchTerm || undefined, pageNumber: currentPage, pageSize }) as any);
            }
        }

        if (batchStatus?.error) {
            showError(batchStatus.error);
            setOperationType(null);
        }
    }, [batchStatus, operationType, showSuccess, showError, dispatch, courseId, currentPage, pageSize, trimmedSearchTerm]);

    const openCreateBatchModal = () => {
        setSelectedBatch(null);
        setBatchFormValues({});
        setBatchFormErrors({});
        setFileList([]);
        setReplacingFile(false);
        setIsBatchModalVisible(true);
    };

    const openEditBatchModal = (batch: BatchRecord) => {
        setSelectedBatch(batch);
        setBatchFormValues({
            title: batch.title || '',
            batchFrom: batch.batchFrom || null,
            batchTo: batch.batchTo || null,
            whatsAppLink: batch.whatsAppLink || '',
            telegramLink: batch.telegramLink || '',
            description: batch.description || '',
        });
        setBatchFormErrors({});
        setFileList([]);
        setReplacingFile(false);
        setIsBatchModalVisible(true);
    };

    const closeBatchModal = () => {
        setIsBatchModalVisible(false);
        setSelectedBatch(null);
        setBatchFormValues({});
        setBatchFormErrors({});
        setFileList([]);
        setReplacingFile(false);
    };

    const openDeleteBatchModal = (batch: BatchRecord) => {
        setSelectedBatch(batch);
        setIsBatchDeleteModalVisible(true);
    };

    const closeDeleteBatchModal = () => {
        setIsBatchDeleteModalVisible(false);
        setSelectedBatch(null);
    };

    const validateSingleBatchField = (field: string, rawValue: string): string => {
        const rule = BATCH_VALIDATION_RULES[field];
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

    const handleBatchInputChange = (name: string, value: any) => {
        setBatchFormValues(prev => ({ ...prev, [name]: value }));

        const error = validateSingleBatchField(name, value);
        setBatchFormErrors(prev => {
            const newErrors = { ...prev };
            if (error) {
                newErrors[name] = error;
            } else {
                delete newErrors[name];
            }
            return newErrors;
        });
    };

    const validateBatchForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        Object.keys(BATCH_VALIDATION_RULES).forEach((field) => {
            const error = validateSingleBatchField(field, batchFormValues[field]);
            if (error) {
                newErrors[field] = error;
            }
        });

        if (!batchFormValues.batchFrom) {
            newErrors.batchFrom = 'Batch start date is required';
        }

        if (!batchFormValues.batchTo) {
            newErrors.batchTo = 'Batch end date is required';
        }

        if (
            batchFormValues.batchFrom &&
            batchFormValues.batchTo &&
            dayjsToISOString(batchFormValues.batchTo) < dayjsToISOString(batchFormValues.batchFrom)
        ) {
            newErrors.batchTo = 'Batch end date must be after the start date';
        }

        setBatchFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleBatchSubmit = () => {
        if (!courseId) return;

        if (!validateBatchForm()) {
            return;
        }

        const batchFrom = dayjsToISOString(batchFormValues.batchFrom);
        const batchTo = dayjsToISOString(batchFormValues.batchTo);

        const whatsAppLink = String(batchFormValues.whatsAppLink || '').trim();
        const telegramLink = String(batchFormValues.telegramLink || '').trim();
        const description = String(batchFormValues.description || '').trim();

        const formData = new FormData();
        formData.append('title', batchFormValues.title || '');
        formData.append('courseId', courseId);
        formData.append('batchFrom', batchFrom);
        formData.append('batchTo', batchTo);
        formData.append('whatsAppLink', whatsAppLink);
        formData.append('telegramLink', telegramLink);
        formData.append('description', description);

        // Optional PDF: a newly picked file, or (when no new one is picked) the saved one removed
        const file = fileList[0]?.originFileObj;
        if (file) formData.append('file', file);

        if (selectedBatch) {
            if (replacingFile && !file) formData.append('removeFile', 'true');
            setOperationType('edit');
            dispatch(updateBatch({ id: selectedBatch.id, formData }) as any);
        } else {
            setOperationType('create');
            dispatch(createBatch(formData) as any);
        }
    };

    const handleDeleteBatchConfirm = () => {
        if (!selectedBatch) return;
        setOperationType('delete');
        dispatch(deleteBatch({ id: selectedBatch.id }) as any);
    };

    // Create: enabled once any field has a value. Edit: enabled once a value differs from the loaded batch.
    const hasBatchFormChanges = selectedBatch
        ? (
            String(batchFormValues.title || '') !== (selectedBatch.title || '') ||
            dayjsToISOString(batchFormValues.batchFrom) !== dayjsToISOString(selectedBatch.batchFrom) ||
            dayjsToISOString(batchFormValues.batchTo) !== dayjsToISOString(selectedBatch.batchTo) ||
            String(batchFormValues.whatsAppLink || '') !== (selectedBatch.whatsAppLink || '') ||
            String(batchFormValues.telegramLink || '') !== (selectedBatch.telegramLink || '') ||
            String(batchFormValues.description || '') !== (selectedBatch.description || '') ||
            fileList.length > 0 ||
            (replacingFile && Boolean(selectedBatch.pdfUrl))
        )
        : (
            Boolean(String(batchFormValues.title || '').trim()) ||
            Boolean(batchFormValues.batchFrom) ||
            Boolean(batchFormValues.batchTo) ||
            Boolean(String(batchFormValues.whatsAppLink || '').trim()) ||
            Boolean(String(batchFormValues.telegramLink || '').trim()) ||
            Boolean(String(batchFormValues.description || '').trim()) ||
            fileList.length > 0
        );

    return {
        batchesArray: displayBatches,
        batchLoading: batchStatus?.loading || false,
        currentPage,
        pageSize,
        totalBatches,
        handlePaginationChange,
        searchField: BATCH_SEARCH_INPUT_FIELDS,
        searchValue,
        handleSearchChange,
        isBatchModalVisible,
        isBatchDeleteModalVisible,
        selectedBatch,
        batchFormValues,
        batchFormErrors,
        hasBatchFormChanges,
        fileList,
        setFileList,
        replacingFile,
        setReplacingFile,
        openCreateBatchModal,
        openEditBatchModal,
        closeBatchModal,
        openDeleteBatchModal,
        closeDeleteBatchModal,
        handleBatchInputChange,
        handleBatchSubmit,
        handleDeleteBatchConfirm,

        // Column sort & search
        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,

        toastMessages,
        hideToast,
    };
};
