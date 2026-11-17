import { useState, useEffect, useCallback } from 'react';
import { useToastMessages } from '../ToastMessages/useToastMessages';
import { useClientSideTableSortSearch, searchAcrossFields } from '../Table/useColumnSortSearch';
import superSalesAPI from '../../services/LearningAPI';
import {
    getLiveClassTableColumns,
    withPlainDescription,
    toDateValue,
    toTimeValue,
    toTimePayload,
    LIVE_CLASS_SEARCH_FIELDS,
    LIVE_CLASS_SEARCH_INPUT_FIELDS,
    LIVE_CLASS_VALIDATION_RULES,
    type LiveClassRecord,
} from './Constant';

// The list may come back as a plain array or as a page ({ items: [...] })
const toList = (res: any): LiveClassRecord[] => {
    const data = res?.data?.data;
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.items) ? data.items : [];
};
const errorText = (error: any, fallback: string) => error?.response?.data?.message || error?.message || fallback;

export const useLiveClasses = () => {
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

    const [records, setRecords] = useState<LiveClassRecord[]>([]);
    const [loading, setLoading] = useState(false);
    // Covers create / update / delete requests and fetching a class before it is edited
    const [isSaving, setIsSaving] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchValue, setSearchValue] = useState('');

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<LiveClassRecord | null>(null);
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
            setRecords(toList(await superSalesAPI.getLiveClasses()).map(withPlainDescription));
        } catch (error: any) {
            showError(errorText(error, 'Failed to load live classes'));
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    // Search over the loaded list, then the column sort / search, then the page that is shown
    const filteredRecords = applyToData(
        searchAcrossFields(records, LIVE_CLASS_SEARCH_FIELDS, searchValue),
        getLiveClassTableColumns(),
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

    const validateField = (field: string, rawValue: string, values: Record<string, string> = formValues): string => {
        const rule = LIVE_CLASS_VALIDATION_RULES[field];
        if (!rule) return '';

        const value = (rawValue || '').trim();
        if (rule.required && !value) return rule.errorMessages.required || 'This field is required';
        // The class can't end before (or when) it starts
        if (field === 'endTime' && value && values.startTime && value <= values.startTime) {
            return 'End time must be after the start time';
        }
        return '';
    };

    const handleInputChange = (name: string, value: any) => {
        const stringValue = Array.isArray(value) ? value[0] || '' : String(value ?? '');
        const nextValues = { ...formValues, [name]: stringValue };
        setFormValues(nextValues);

        setFormErrors((prev) => {
            const next = { ...prev };
            const error = validateField(name, stringValue, nextValues);
            if (error) next[name] = error;
            else delete next[name];
            // Moving the start time can fix (or break) the end time check
            if (name === 'startTime' && nextValues.endTime) {
                const endError = validateField('endTime', nextValues.endTime, nextValues);
                if (endError) next.endTime = endError;
                else delete next.endTime;
            }
            return next;
        });
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        Object.keys(LIVE_CLASS_VALIDATION_RULES).forEach((field) => {
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

    // The class is fetched by id so the form always starts from what is saved (with its full rich text description)
    const openEditModal = async (record: LiveClassRecord) => {
        setIsSaving(true);
        try {
            const res = await superSalesAPI.getLiveClassById(record.id);
            const liveClass: LiveClassRecord = res?.data?.data || record;
            const values = {
                title: liveClass.title || '',
                description: liveClass.description || '',
                date: toDateValue(liveClass.date),
                startTime: toTimeValue(liveClass.startTime),
                endTime: toTimeValue(liveClass.endTime),
                status: liveClass.status || '',
                youTubeLink: liveClass.youTubeLink || '',
                googleMeetLink: liveClass.googleMeetLink || '',
            };
            setSelectedRecord({ ...liveClass, ...values });
            setFormValues(values);
            setFormErrors({});
            setIsModalVisible(true);
        } catch (error: any) {
            showError(errorText(error, 'Failed to load the live class'));
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteModal = (record: LiveClassRecord) => {
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
            date: formValues.date,
            startTime: toTimePayload(formValues.startTime),
            endTime: toTimePayload(formValues.endTime),
            status: formValues.status,
            youTubeLink: (formValues.youTubeLink || '').trim(),
            googleMeetLink: (formValues.googleMeetLink || '').trim(),
        };

        setIsSaving(true);
        try {
            const res = selectedRecord
                ? await superSalesAPI.updateLiveClass(selectedRecord.id, payload)
                : await superSalesAPI.createLiveClass(payload);
            showSuccess(res?.data?.message || (selectedRecord ? 'Live class updated successfully' : 'Live class created successfully'));
            closeModal();
            await loadRecords();
        } catch (error: any) {
            showError(errorText(error, selectedRecord ? 'Failed to update the live class' : 'Failed to create the live class'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedRecord) return;

        setIsSaving(true);
        try {
            const res = await superSalesAPI.deleteLiveClass(selectedRecord.id);
            showSuccess(res?.data?.message || 'Live class deleted successfully');
            closeDeleteModal();
            // Deleting the last row of the last page would leave an empty page behind
            const remaining = filteredRecords.length - 1;
            setCurrentPage((page) => Math.max(1, Math.min(page, Math.ceil(remaining / pageSize))));
            await loadRecords();
        } catch (error: any) {
            showError(errorText(error, 'Failed to delete the live class'));
        } finally {
            setIsSaving(false);
        }
    };

    // Create: enabled once something is filled in. Edit: enabled once a value differs from the saved class.
    const hasFormChanges = selectedRecord
        ? (
            (formValues.title || '') !== (selectedRecord.title || '') ||
            (formValues.description || '') !== (selectedRecord.description || '') ||
            (formValues.date || '') !== (selectedRecord.date || '') ||
            (formValues.startTime || '') !== (selectedRecord.startTime || '') ||
            (formValues.endTime || '') !== (selectedRecord.endTime || '') ||
            (formValues.status || '') !== (selectedRecord.status || '') ||
            (formValues.youTubeLink || '') !== (selectedRecord.youTubeLink || '') ||
            (formValues.googleMeetLink || '') !== (selectedRecord.googleMeetLink || '')
        )
        : Object.values(formValues).some((value) => Boolean((value || '').trim()));

    return {
        records: pagedRecords,
        loading,
        isSaving,
        currentPage,
        pageSize,
        total: filteredRecords.length,
        handlePaginationChange,

        searchField: LIVE_CLASS_SEARCH_INPUT_FIELDS,
        searchValue,
        handleSearchChange,

        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,

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
