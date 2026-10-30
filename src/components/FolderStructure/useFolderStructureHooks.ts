import { useCallback, useEffect, useState } from 'react';
import superSalesAPI from '../../services/LearningAPI';
import { useToastMessages } from '../ToastMessages/useToastMessages';
import { toTitleCase } from '../../utils/textUtils';
import {
    FOLDER_LABELS,
    NAME_MAX_LENGTH,
    addNode,
    getChildren,
    getNodeAt,
    normalizeSubFolder,
    removeNode,
    renameNode,
    toFolderChildrenPayload,
    toSubFolderChildrenPayload,
    type FolderKind,
    type FolderNode,
    type FolderRecord,
    type SubFolderRecord,
} from './Constant';

const toList = (res: any): any[] => (Array.isArray(res?.data?.data) ? res.data.data : []);
const errorText = (error: any, fallback: string) => error?.response?.data?.message || error?.message || fallback;
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// What the open Add / Edit modal or delete confirmation is about:
//   folder / subfolder: `record` is null while adding
//   nested: `parent` is the sub folder whose tree it lives in and `path` addresses it inside that tree:
//           while adding, the path of the node that gets the new child ([] = the sub folder itself),
//           while editing / deleting, the path of the node itself
interface FolderTarget {
    kind: FolderKind;
    record: FolderRecord | SubFolderRecord | null;
    parent?: SubFolderRecord;
    path?: number[];
    isAdd?: boolean;
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
    // Rows (sub folders and nested sub folders) opened to show what is inside them
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

    const [formTarget, setFormTarget] = useState<FolderTarget | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<FolderTarget | null>(null);
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Keeps the current folder selected when it still exists, otherwise falls back to the first one
    const loadFolders = useCallback(async () => {
        setFoldersLoading(true);
        try {
            const list = toList(await superSalesAPI.getFolders()) as FolderRecord[];
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
                if (!cancelled) setSubFolders(toList(res).map(normalizeSubFolder));
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

    const toggleExpanded = (key: string) => {
        setExpandedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    // --- Add / Edit modal ---------------------------------------------------------------------------------------

    const openAddModal = (kind: 'folder' | 'subfolder') => {
        setFormTarget({ kind, record: null });
        setName('');
        setNameError('');
    };

    // Adds a nested sub folder under the node at `path` of `parent`'s tree ([] = directly under the sub folder)
    const openAddNestedModal = (parent: SubFolderRecord, path: number[], expandKey: string) => {
        setFormTarget({ kind: 'nested', record: null, parent, path, isAdd: true });
        setExpandedKeys((prev) => new Set(prev).add(expandKey));
        setName('');
        setNameError('');
    };

    const openEditModal = (kind: 'folder' | 'subfolder', record: FolderRecord | SubFolderRecord) => {
        setFormTarget({ kind, record });
        setName(record.name);
        setNameError('');
    };

    const openEditNestedModal = (parent: SubFolderRecord, path: number[]) => {
        setFormTarget({ kind: 'nested', record: null, parent, path });
        setName(getNodeAt(parent.subFolders, path)?.name ?? '');
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

    // Another item with the same name next to this one (same folder / same sub folder / same parent), ignoring the
    // item being edited
    const findDuplicate = (target: FolderTarget, value: string): boolean => {
        if (target.kind === 'folder') {
            return folders.some((folder) => folder.id !== target.record?.id && sameName(folder.name, value));
        }
        if (target.kind === 'subfolder') {
            return subFolders.some((subFolder) => subFolder.id !== target.record?.id && sameName(subFolder.name, value));
        }
        const path = target.path ?? [];
        const parentPath = target.isAdd ? path : path.slice(0, -1);
        const ownIndex = target.isAdd ? -1 : path[path.length - 1];
        return getChildren(target.parent?.subFolders ?? [], parentPath).some((node, index) => index !== ownIndex && sameName(node.name, value));
    };

    // A nested sub folder is saved by sending the changed tree through the sub folder it sits in
    const saveTree = (parent: SubFolderRecord, tree: FolderNode[]) =>
        superSalesAPI.updateSubFolder(parent.id, parent.name, parent.folderId, toSubFolderChildrenPayload(tree));

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
        if (findDuplicate(formTarget, trimmed)) {
            setNameError(`A ${FOLDER_LABELS[formTarget.kind].toLowerCase()} named "${toTitleCase(trimmed)}" already exists here`);
            return;
        }

        const { kind, record, parent, path = [], isAdd } = formTarget;
        const label = FOLDER_LABELS[kind];
        const isEditing = kind === 'nested' ? !isAdd : Boolean(record);

        setIsSaving(true);
        try {
            if (kind === 'folder') {
                if (record) {
                    // The update body carries the folder's sub folders, so send the current ones back unchanged
                    const current = toList(await superSalesAPI.getSubFolders(record.id)).map(normalizeSubFolder);
                    await superSalesAPI.updateFolder(record.id, trimmed, toFolderChildrenPayload(current));
                } else {
                    const res = await superSalesAPI.createFolder(trimmed, []);
                    // Jump to the folder that was just created so its sub folders can be added straight away
                    const createdId = res?.data?.data?.id;
                    if (createdId) setSelectedFolderId(createdId);
                }
                await loadFolders();
            } else if (kind === 'subfolder') {
                if (record) {
                    const subFolder = record as SubFolderRecord;
                    await superSalesAPI.updateSubFolder(subFolder.id, trimmed, subFolder.folderId, toSubFolderChildrenPayload(subFolder.subFolders));
                } else {
                    await superSalesAPI.createSubFolder(trimmed, selectedFolderId, []);
                }
                setSubFoldersVersion((version) => version + 1);
            } else if (parent) {
                if (isAdd) {
                    // POST /SubFolder with the id of the folder it goes under as `folderId`: only this one is created
                    const holderId = path.length === 0 ? parent.id : getNodeAt(parent.subFolders, path)?.id;
                    if (holderId) await superSalesAPI.createSubFolder(trimmed, holderId, []);
                    else await saveTree(parent, addNode(parent.subFolders, path, trimmed));
                } else {
                    // PUT /SubFolder/{id}, `folderId` being the folder it sits under
                    const node = getNodeAt(parent.subFolders, path);
                    const holderId = path.length === 1 ? parent.id : getNodeAt(parent.subFolders, path.slice(0, -1))?.id;
                    if (node?.id && holderId) await superSalesAPI.updateSubFolder(node.id, trimmed, holderId, toSubFolderChildrenPayload(node.subFolders));
                    else await saveTree(parent, renameNode(parent.subFolders, path, trimmed));
                }
                setSubFoldersVersion((version) => version + 1);
            }
            showSuccess(`${label} ${isEditing ? 'updated' : 'created'} successfully!`);
            closeModal();
        } catch (error: any) {
            showError(errorText(error, `Failed to save ${label.toLowerCase()}`));
        } finally {
            setIsSaving(false);
        }
    };

    // --- Delete ---------------------------------------------------------------------------------------------------

    const openDeleteModal = (kind: 'folder' | 'subfolder', record: FolderRecord | SubFolderRecord) => setDeleteTarget({ kind, record });
    const openDeleteNestedModal = (parent: SubFolderRecord, path: number[]) => setDeleteTarget({ kind: 'nested', record: null, parent, path });
    const closeDeleteModal = () => setDeleteTarget(null);

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;

        const { kind, record, parent, path = [] } = deleteTarget;
        const label = FOLDER_LABELS[kind];

        setIsSaving(true);
        try {
            if (kind === 'folder' && record) {
                await superSalesAPI.deleteFolder(record.id);
                await loadFolders();
            } else if (kind === 'subfolder' && record) {
                await superSalesAPI.deleteSubFolder(record.id);
                setSubFoldersVersion((version) => version + 1);
            } else if (kind === 'nested' && parent) {
                // Delete by its own id; only a node the API gave no id falls back to saving the tree without it
                const nodeId = getNodeAt(parent.subFolders, path)?.id;
                if (nodeId) await superSalesAPI.deleteSubFolder(nodeId);
                else await saveTree(parent, removeNode(parent.subFolders, path));
                setSubFoldersVersion((version) => version + 1);
            } else {
                return;
            }
            showSuccess(`${label} deleted successfully!`);
            closeDeleteModal();
        } catch (error: any) {
            showError(errorText(error, `Failed to delete ${label.toLowerCase()}`));
        } finally {
            setIsSaving(false);
        }
    };

    // Texts for the two modals; a nested sub folder says which sub folder it belongs to
    const isEdit = formTarget ? (formTarget.kind === 'nested' ? !formTarget.isAdd : Boolean(formTarget.record)) : false;

    const modalTitle = formTarget
        ? formTarget.kind === 'nested'
            ? `${isEdit ? 'Edit' : 'Add'} Nested Sub Folder in "${toTitleCase(
                formTarget.isAdd && (formTarget.path?.length ?? 0) > 0
                    ? getNodeAt(formTarget.parent?.subFolders ?? [], formTarget.path ?? [])?.name
                    : formTarget.parent?.name,
            )}"`
            : `${isEdit ? 'Edit' : 'Add'} ${FOLDER_LABELS[formTarget.kind]}`
        : '';

    const deleteMessage = (() => {
        if (!deleteTarget) return '';
        if (deleteTarget.kind === 'nested') {
            const node = getNodeAt(deleteTarget.parent?.subFolders ?? [], deleteTarget.path ?? []);
            const inside = node && node.subFolders.length > 0 ? ' Everything inside it will be removed too.' : '';
            return `Are you sure you want to delete the nested sub folder "${toTitleCase(node?.name)}"?${inside}`;
        }
        if (!deleteTarget.record) return '';
        return deleteTarget.kind === 'folder'
            ? `Are you sure you want to delete the folder "${toTitleCase(deleteTarget.record.name)}"? Sub folders inside it may be removed too.`
            : `Are you sure you want to delete the sub folder "${toTitleCase(deleteTarget.record.name)}"? Nested sub folders inside it may be removed too.`;
    })();

    return {
        folders,
        foldersLoading,
        selectedFolder,
        setSelectedFolderId,
        subFolders,
        subFoldersLoading,
        expandedKeys,
        toggleExpanded,
        isModalVisible: Boolean(formTarget),
        isDeleteModalVisible: Boolean(deleteTarget),
        isEdit,
        modalTitle,
        deleteMessage,
        name,
        nameError,
        isSaving,
        openAddModal,
        openAddNestedModal,
        openEditModal,
        openEditNestedModal,
        closeModal,
        handleNameChange,
        handleSubmit,
        openDeleteModal,
        openDeleteNestedModal,
        closeDeleteModal,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    };
};
