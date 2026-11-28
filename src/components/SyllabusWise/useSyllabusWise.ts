import { useState, useEffect, useCallback } from 'react';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import { useClientSideTableSortSearch, searchAcrossFields } from '../../components/Table/useColumnSortSearch';
import superSalesAPI from '../../services/LearningAPI';
import { saveBlobResponse } from '../../utils/downloadFile';
import { richTextToPlain } from '../../utils/richText';
import { getSyllabusTableColumns, SYLLABUS_SEARCH_FIELDS, SYLLABUS_SEARCH_INPUT_FIELDS, SYLLABUS_VALIDATION_RULES, type SyllabusRecord } from './Constant';

interface FolderOption {
    id: string;
    name: string;
}

const toList = <T,>(res: any): T[] => (Array.isArray(res?.data?.data) ? res.data.data : []);
const errorText = (error: any, fallback: string) => error?.response?.data?.message || error?.message || fallback;

export const useSyllabusWise = () => {
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

    // Download: GET /SyllabusWise/payments/download, saved as a file
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const res = await superSalesAPI.getSyllabusWisePaymentsDownload();
            saveBlobResponse(res, 'SyllabusWisePayments.xlsx');
        } catch (error: any) {
            showError(errorText(error, 'Failed to download syllabus wise payments'));
        } finally {
            setIsDownloading(false);
        }
    };

    const [records, setRecords] = useState<SyllabusRecord[]>([]);
    const [loading, setLoading] = useState(false);
    // Covers create / update / delete requests and fetching a plan before it is edited
    const [isSaving, setIsSaving] = useState(false);
    const [folders, setFolders] = useState<FolderOption[]>([]);
    const [foldersLoading, setFoldersLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchValue, setSearchValue] = useState('');

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<SyllabusRecord | null>(null);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const {
        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch: applyColumnSearch,
        applyToData,
    } = useClientSideTableSortSearch();

    const loadRecords = useCallback(async () => {
        setLoading(true);
        try {
            // The description is saved as rich text (HTML); the table, its search and its sort work on the plain text
            setRecords(toList<SyllabusRecord>(await superSalesAPI.getSyllabusWiseList()).map((record) => ({
                ...record,
                description: richTextToPlain(record.description || ''),
            })));
        } catch (error: any) {
            showError(errorText(error, 'Failed to load syllabus wise plans'));
        } finally {
            setLoading(false);
        }
    }, [showError]);

    const loadFolders = useCallback(async () => {
        setFoldersLoading(true);
        try {
            setFolders(toList<FolderOption>(await superSalesAPI.getFolders()));
        } catch (error: any) {
            showError(errorText(error, 'Failed to load folders'));
        } finally {
            setFoldersLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        loadRecords();
        loadFolders();
    }, [loadRecords, loadFolders]);

    // Search over the loaded list, then the column sort / search, then the page that is shown
    const filteredRecords = applyToData(
        searchAcrossFields(records, SYLLABUS_SEARCH_FIELDS, searchValue),
        getSyllabusTableColumns(),
    );
    const pagedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handlePaginationChange = (page: number, newPageSize: number) => {
        if (newPageSize !== pageSize) {
            setPageSize(newPageSize);
            setCurrentPage(1);
            return;
        }
        setCurrentPage(page);
    };

    const handleSearchChange = (_name: string, value: string) => {
        setSearchValue(value);
        setCurrentPage(1);
    };

    const handleColumnSearch = (key: string, value: string) => {
        applyColumnSearch(key, value);
        setCurrentPage(1);
    };

    // The Folder dropdown lists the folder names only (the id is the value that is sent)
    const folderOptions = folders.map((folder) => ({ value: folder.id, label: folder.name }));

    const validateField = (field: string, rawValue: string): string => {
        const rule = SYLLABUS_VALIDATION_RULES[field];
        if (!rule) return '';

        const value = (rawValue || '').trim();
        if (rule.required && !value) return rule.errorMessages.required || 'This field is required';
        if (rule.pattern && value && !rule.pattern.test(value)) return rule.errorMessages.pattern || 'Invalid format.';
        if (field === 'amount' && value && Number(value) <= 0) return 'Amount must be greater than 0';
        return '';
    };

    const handleInputChange = (name: string, value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] || '' : value;
        setFormValues((prev) => ({ ...prev, [name]: stringValue }));

        const error = validateField(name, stringValue);
        setFormErrors((prev) => {
            const next = { ...prev };
            if (error) next[name] = error;
            else delete next[name];
            return next;
        });
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        Object.keys(SYLLABUS_VALIDATION_RULES).forEach((field) => {
            const error = validateField(field, formValues[field]);
            if (error) newErrors[field] = error;
        });
        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setSelectedRecord(null);
        setFormValues({});
        setFormErrors({});
    };

    const openCreateModal = () => {
        setSelectedRecord(null);
        setFormValues({});
        setFormErrors({});
        setIsModalVisible(true);
    };

    // The plan is fetched by id so the form always starts from what is saved
    const openEditModal = async (record: SyllabusRecord) => {
        setIsSaving(true);
        try {
            const res = await superSalesAPI.getSyllabusWiseById(record.id);
            const plan: SyllabusRecord = res?.data?.data || record;
            setSelectedRecord(plan);
            setFormValues({
                title: plan.title || '',
                description: plan.description || '',
                amount: plan.amount === null || plan.amount === undefined ? '' : String(plan.amount),
                folderId: plan.folderId || '',
            });
            setFormErrors({});
            setIsModalVisible(true);
        } catch (error: any) {
            showError(errorText(error, 'Failed to load the plan'));
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteModal = (record: SyllabusRecord) => {
        setSelectedRecord(record);
        setIsDeleteModalVisible(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalVisible(false);
        setSelectedRecord(null);
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const payload = {
            title: (formValues.title || '').trim(),
            description: (formValues.description || '').trim(),
            amount: Number(formValues.amount),
            folderId: formValues.folderId,
        };

        setIsSaving(true);
        try {
            const res = selectedRecord
                ? await superSalesAPI.updateSyllabusWise(selectedRecord.id, payload)
                : await superSalesAPI.createSyllabusWise(payload);
            showSuccess(res?.data?.message || (selectedRecord ? 'Plan updated successfully' : 'Plan created successfully'));
            closeModal();
            await loadRecords();
        } catch (error: any) {
            showError(errorText(error, selectedRecord ? 'Failed to update the plan' : 'Failed to create the plan'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedRecord) return;

        setIsSaving(true);
        try {
            const res = await superSalesAPI.deleteSyllabusWise(selectedRecord.id);
            showSuccess(res?.data?.message || 'Plan deleted successfully');
            closeDeleteModal();
            // Deleting the last row of the last page would leave an empty page behind
            const remaining = filteredRecords.length - 1;
            setCurrentPage((page) => Math.max(1, Math.min(page, Math.ceil(remaining / pageSize))));
            await loadRecords();
        } catch (error: any) {
            showError(errorText(error, 'Failed to delete the plan'));
        } finally {
            setIsSaving(false);
        }
    };

    // Create: enabled once something is filled in. Edit: enabled once a value differs from the saved plan.
    const hasFormChanges = selectedRecord
        ? (
            (formValues.title || '') !== (selectedRecord.title || '') ||
            (formValues.description || '') !== (selectedRecord.description || '') ||
            (formValues.amount || '') !== String(selectedRecord.amount ?? '') ||
            (formValues.folderId || '') !== (selectedRecord.folderId || '')
        )
        : Object.values(formValues).some((value) => Boolean((value || '').trim()));

    return {
        isDownloading,
        handleDownload,
        records: pagedRecords,
        loading,
        isSaving,
        currentPage,
        pageSize,
        total: filteredRecords.length,
        handlePaginationChange,

        searchField: SYLLABUS_SEARCH_INPUT_FIELDS,
        searchValue,
        handleSearchChange,

        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,

        folderOptions,
        foldersLoading,
        isModalVisible,
        isDeleteModalVisible,
        selectedRecord,
        formValues,
        formErrors,
        hasFormChanges,
        openCreateModal,
        openEditModal,
        closeModal,
        openDeleteModal,
        closeDeleteModal,
        handleInputChange,
        handleSubmit,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    };
};
