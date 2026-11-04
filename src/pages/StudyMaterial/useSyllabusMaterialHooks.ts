import { useState, useEffect, useCallback, useRef } from 'react';
import type { UploadFile } from 'antd';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import { useClientSideTableSortSearch } from '../../components/Table/useColumnSortSearch';
import { useFolderSelector } from '../Quiz/previousYear/useFolderSelectorHooks';
import superSalesAPI from '../../services/LearningAPI';
import { getSyllabusMaterialTableColumns, type SyllabusMaterialRecord } from './Constants';

const errorText = (error: any, fallback: string) => error?.response?.data?.message || error?.message || fallback;

export const useSyllabusMaterialManagement = (searchTerm = '') => {
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

    const [records, setRecords] = useState<SyllabusMaterialRecord[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    // Create / update / delete requests in flight
    const [isSaving, setIsSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<SyllabusMaterialRecord | null>(null);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    // Folder -> Sub Folder -> nested sub folders, the same selector the folder based quizzes use. It only loads while the
    // form is open, and starts from the saved folder / sub folder when editing.
    const { getFolderFields, ...folderSelector } = useFolderSelector({
        enabled: isModalVisible,
        initial: isModalVisible && selectedMaterial
            ? { folderId: selectedMaterial.folderId, subFolderId: selectedMaterial.subFolderId }
            : undefined,
    });

    // Column-level sort & search (client-side, over the loaded page)
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

    // Only the newest request may fill the table, however slowly the earlier ones come back
    const latestRequestRef = useRef(0);

    const loadRecords = useCallback(async () => {
        const requestId = ++latestRequestRef.current;
        setLoading(true);
        try {
            const res = await superSalesAPI.searchSyllabusMaterials(searchTerm.trim(), '', '', currentPage, pageSize);
            if (requestId !== latestRequestRef.current) return;
            const data = res?.data?.data;
            setRecords(Array.isArray(data?.items) ? data.items : []);
            setTotalCount(data?.totalCount ?? 0);
        } catch (error: any) {
            if (requestId !== latestRequestRef.current) return;
            showError(errorText(error, 'Failed to load syllabus materials'));
        } finally {
            if (requestId === latestRequestRef.current) setLoading(false);
        }
    }, [searchTerm, currentPage, pageSize, showError]);

    // A new search starts back at page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    const handlePaginationChange = (page: number, newPageSize: number) => {
        setCurrentPage(page);
        if (newPageSize !== pageSize) {
            setPageSize(newPageSize);
            setCurrentPage(1);
        }
    };

    const validateTitle = (value: string) => (value.trim() ? '' : 'Title is required');

    const handleInputChange = (name: string, value: string) => {
        setFormValues((prev) => ({ ...prev, [name]: value }));
        if (name === 'title') {
            const error = validateTitle(value);
            setFormErrors((prev) => {
                const next = { ...prev };
                if (error) next.title = error;
                else delete next.title;
                return next;
            });
        }
    };

    const handleFileChange = (files: UploadFile[]) => {
        setFileList(files);
        if (formErrors.file) {
            setFormErrors((prev) => {
                const next = { ...prev };
                delete next.file;
                return next;
            });
        }
    };

    const resetForm = () => {
        setFormValues({});
        setFormErrors({});
        setFileList([]);
    };

    const openCreateModal = () => {
        setSelectedMaterial(null);
        resetForm();
        // Clears the folder chosen the last time the form was open
        folderSelector.handleFolderChange('');
        setIsModalVisible(true);
    };

    const openEditModal = (material: SyllabusMaterialRecord) => {
        setSelectedMaterial(material);
        setFormValues({ title: material.title || '', description: material.description || '' });
        setFormErrors({});
        setFileList([]);
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setSelectedMaterial(null);
        resetForm();
    };

    const openDeleteModal = (material: SyllabusMaterialRecord) => {
        setSelectedMaterial(material);
        setIsDeleteModalVisible(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalVisible(false);
        setSelectedMaterial(null);
    };

    const handleSubmit = async () => {
        const errors: Record<string, string> = {};
        const titleError = validateTitle(formValues.title || '');
        if (titleError) errors.title = titleError;
        if (!selectedMaterial && fileList.length === 0) errors.file = 'PDF file is required';
        setFormErrors(errors);

        // Run the folder check too, so every missing field shows at once
        const folderFields = getFolderFields();
        if (Object.keys(errors).length > 0 || !folderFields) return;

        const formData = new FormData();
        formData.append('title', formValues.title.trim());
        formData.append('description', (formValues.description || '').trim());
        Object.entries(folderFields).forEach(([name, value]) => formData.append(name, value));
        const file = fileList[0]?.originFileObj;
        if (file) formData.append('file', file);

        setIsSaving(true);
        try {
            const res = selectedMaterial
                ? await superSalesAPI.updateSyllabusMaterial(selectedMaterial.id, formData)
                : await superSalesAPI.createSyllabusMaterial(formData);
            showSuccess(res?.data?.message || (selectedMaterial ? 'Syllabus material updated successfully' : 'Syllabus material created successfully'));
            closeModal();
            await loadRecords();
        } catch (error: any) {
            showError(errorText(error, selectedMaterial ? 'Failed to update the syllabus material' : 'Failed to create the syllabus material'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedMaterial) return;

        setIsSaving(true);
        try {
            const res = await superSalesAPI.deleteSyllabusMaterial(selectedMaterial.id);
            showSuccess(res?.data?.message || 'Syllabus material deleted successfully');
            closeDeleteModal();
            // Deleting the only row of a later page steps back a page (which reloads); otherwise reload this one
            if (records.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
            else await loadRecords();
        } catch (error: any) {
            showError(errorText(error, 'Failed to delete the syllabus material'));
        } finally {
            setIsSaving(false);
        }
    };

    // Create: enabled once anything is filled in. Edit: enabled once a value differs from the saved material.
    const deepestLevel = folderSelector.levels[folderSelector.levels.length - 1];
    const hasFormChanges = selectedMaterial
        ? (
            (formValues.title || '') !== (selectedMaterial.title || '') ||
            (formValues.description || '') !== (selectedMaterial.description || '') ||
            folderSelector.folderId !== (selectedMaterial.folderId || '') ||
            (Boolean(deepestLevel) && deepestLevel.value !== (selectedMaterial.subFolderId || '')) ||
            fileList.length > 0
        )
        : (
            Boolean(formValues.title?.trim()) ||
            Boolean(formValues.description?.trim()) ||
            Boolean(folderSelector.folderId) ||
            fileList.length > 0
        );

    return {
        materials: applyToData(records, getSyllabusMaterialTableColumns()),
        loading,
        isSaving,
        currentPage,
        pageSize,
        totalCount,
        handlePaginationChange,

        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,

        isModalVisible,
        isDeleteModalVisible,
        selectedMaterial,
        formValues,
        formErrors,
        fileList,
        hasFormChanges,
        folderSelector,
        openCreateModal,
        openEditModal,
        closeModal,
        openDeleteModal,
        closeDeleteModal,
        handleInputChange,
        handleFileChange,
        handleSubmit,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    };
};
