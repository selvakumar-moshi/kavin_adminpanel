import { useCallback, useEffect, useState } from 'react';
import superSalesAPI from '../../services/LearningAPI';
import { useToastMessages } from '../ToastMessages/useToastMessages';
import { FOLDER_LABELS, NAME_MAX_LENGTH, type FolderKind, type FolderRecord, type SubFolderRecord } from './Constant';

const toList = <T,>(res: any): T[] => (Array.isArray(res?.data?.data) ? res.data.data : []);
const errorText = (error: any, fallback: string) => error?.response?.data?.message || error?.message || fallback;

// What the open Add / Edit modal or delete confirmation is about; `record` is null while adding
interface FolderTarget {
    kind: FolderKind;
    record: FolderRecord | SubFolderRecord | null;
}

export const useFolderStructureManagement = () => {
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

    const [folders, setFolders] = useState<FolderRecord[]>([]);
    const [foldersLoading, setFoldersLoading] = useState(true);
    const [selectedFolderId, setSelectedFolderId] = useState('');

    const [subFolders, setSubFolders] = useState<SubFolderRecord[]>([]);
    const [subFoldersLoading, setSubFoldersLoading] = useState(false);
    // Bumped to reload the selected folder's sub folders after a change
    const [subFoldersVersion, setSubFoldersVersion] = useState(0);

    const [formTarget, setFormTarget] = useState<FolderTarget | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<FolderTarget | null>(null);
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Keeps the current folder selected when it still exists, otherwise falls back to the first one
    const loadFolders = useCallback(async () => {
        setFoldersLoading(true);
        try {
            const list = toList<FolderRecord>(await superSalesAPI.getFolders());
            setFolders(list);
            setSelectedFolderId((current) => (list.some((folder) => folder.id === current) ? current : list[0]?.id ?? ''));
        } catch (error: any) {
            showError(errorText(error, 'Failed to load folders'));
        } finally {
            setFoldersLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        loadFolders();
    }, [loadFolders]);

    // Sub folders of the selected folder (an older response is ignored if the selection moved on meanwhile)
    useEffect(() => {
        if (!selectedFolderId) {
            setSubFolders([]);
            return;
        }

        let cancelled = false;
        setSubFoldersLoading(true);
        superSalesAPI.getSubFolders(selectedFolderId)
            .then((res) => {
                if (!cancelled) setSubFolders(toList<SubFolderRecord>(res));
            })
            .catch((error: any) => {
                if (!cancelled) showError(errorText(error, 'Failed to load sub folders'));
            })
            .finally(() => {
                if (!cancelled) setSubFoldersLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [selectedFolderId, subFoldersVersion, showError]);

    const selectedFolder = folders.find((folder) => folder.id === selectedFolderId) ?? null;

    const openAddModal = (kind: FolderKind) => {
        setFormTarget({ kind, record: null });
        setName('');
        setNameError('');
    };

    const openEditModal = (kind: FolderKind, record: FolderRecord | SubFolderRecord) => {
        setFormTarget({ kind, record });
        setName(record.name);
        setNameError('');
    };

    const closeModal = () => {
        setFormTarget(null);
        setName('');
        setNameError('');
    };

    const handleNameChange = (_field: string, value: string) => {
        setName(value);
        if (nameError) setNameError('');
    };

    const handleSubmit = async () => {
        if (!formTarget) return;

        const trimmed = name.trim();
        if (!trimmed) {
            setNameError('Name is required');
            return;
        }
        if (trimmed.length > NAME_MAX_LENGTH) {
            setNameError(`Name must not exceed ${NAME_MAX_LENGTH} characters.`);
            return;
        }

        const { kind, record } = formTarget;
        const label = FOLDER_LABELS[kind];

        setIsSaving(true);
        try {
            if (kind === 'folder') {
                if (record) {
                    await superSalesAPI.updateFolder(record.id, trimmed);
                } else {
                    const res = await superSalesAPI.createFolder(trimmed);
                    // Jump to the folder that was just created so its sub folders can be added straight away
                    const createdId = res?.data?.data?.id;
                    if (createdId) setSelectedFolderId(createdId);
                }
                await loadFolders();
            } else {
                if (record) {
                    await superSalesAPI.updateSubFolder(record.id, trimmed, (record as SubFolderRecord).folderId);
                } else {
                    await superSalesAPI.createSubFolder(trimmed, selectedFolderId);
                }
                setSubFoldersVersion((version) => version + 1);
            }
            showSuccess(`${label} ${record ? 'updated' : 'created'} successfully!`);
            closeModal();
        } catch (error: any) {
            showError(errorText(error, `Failed to save ${label.toLowerCase()}`));
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteModal = (kind: FolderKind, record: FolderRecord | SubFolderRecord) => setDeleteTarget({ kind, record });
    const closeDeleteModal = () => setDeleteTarget(null);

    const handleDeleteConfirm = async () => {
        if (!deleteTarget?.record) return;

        const { kind, record } = deleteTarget;
        const label = FOLDER_LABELS[kind];

        setIsSaving(true);
        try {
            if (kind === 'folder') {
                await superSalesAPI.deleteFolder(record.id);
                await loadFolders();
            } else {
                await superSalesAPI.deleteSubFolder(record.id);
                setSubFoldersVersion((version) => version + 1);
            }
            showSuccess(`${label} deleted successfully!`);
            closeDeleteModal();
        } catch (error: any) {
            showError(errorText(error, `Failed to delete ${label.toLowerCase()}`));
        } finally {
            setIsSaving(false);
        }
    };

    const modalTitle = formTarget ? `${formTarget.record ? 'Edit' : 'Add'} ${FOLDER_LABELS[formTarget.kind]}` : '';

    const deleteMessage = deleteTarget?.record
        ? deleteTarget.kind === 'folder'
            ? `Delete the folder "${deleteTarget.record.name}"? Sub folders inside it may be removed too.`
            : `Delete the sub folder "${deleteTarget.record.name}"?`
        : '';

    return {
        folders,
        foldersLoading,
        selectedFolder,
        setSelectedFolderId,
        subFolders,
        subFoldersLoading,
        isModalVisible: Boolean(formTarget),
        isDeleteModalVisible: Boolean(deleteTarget),
        isEdit: Boolean(formTarget?.record),
        modalTitle,
        deleteMessage,
        name,
        nameError,
        isSaving,
        openAddModal,
        openEditModal,
        closeModal,
        handleNameChange,
        handleSubmit,
        openDeleteModal,
        closeDeleteModal,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    };
};
