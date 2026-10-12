import { useEffect, useState } from 'react';
import superSalesAPI from '../../../services/LearningAPI';

const toList = <T,>(res: any): T[] => (Array.isArray(res?.data?.data) ? res.data.data : []);
const toValue = (value: string | string[]) => (Array.isArray(value) ? value[0] || '' : value);

interface NamedRecord {
    id: string;
    name: string;
    /** Nested sub folders (each with its own id); only present on sub folders */
    subFolders?: NamedRecord[];
}

export interface FolderSelectorOptions {
    /** Set false to skip loading (the quiz isn't a folder-based one) */
    enabled?: boolean;
    /** Values to start from, e.g. the saved folder / sub folder when editing */
    initial?: { folderId?: string | null; subFolderId?: string | null };
}

// Folder -> Sub Folder -> Nested Sub Folder dropdowns for quizzes that live in a folder (the "Previous Year" tab)
export const useFolderSelector = ({ enabled = true, initial }: FolderSelectorOptions = {}) => {
    const [folders, setFolders] = useState<NamedRecord[]>([]);
    const [subFolders, setSubFolders] = useState<NamedRecord[]>([]);
    const [foldersLoading, setFoldersLoading] = useState(false);
    const [subFoldersLoading, setSubFoldersLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    const [folderId, setFolderId] = useState('');
    const [subFolderId, setSubFolderId] = useState('');
    const [nestedSubFolderId, setNestedSubFolderId] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Editing: start from the saved values once they arrive
    const initialKey = initial ? `${initial.folderId ?? ''}|${initial.subFolderId ?? ''}` : '';
    useEffect(() => {
        if (!initial) return;
        setFolderId(initial.folderId || '');
        setSubFolderId(initial.subFolderId || '');
        setNestedSubFolderId('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialKey]);

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;
        setFoldersLoading(true);
        superSalesAPI.getFolders()
            .then((res) => {
                if (!cancelled) setFolders(toList<NamedRecord>(res));
            })
            .catch((error: any) => {
                if (!cancelled) setLoadError(error?.response?.data?.message || error?.message || 'Failed to load folders');
            })
            .finally(() => {
                if (!cancelled) setFoldersLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [enabled]);

    // Sub folders of the chosen folder
    useEffect(() => {
        if (!enabled || !folderId) {
            setSubFolders([]);
            return;
        }

        let cancelled = false;
        setSubFoldersLoading(true);
        superSalesAPI.getSubFolders(folderId)
            .then((res) => {
                if (!cancelled) setSubFolders(toList<NamedRecord>(res));
            })
            .catch((error: any) => {
                if (!cancelled) setLoadError(error?.response?.data?.message || error?.message || 'Failed to load sub folders');
            })
            .finally(() => {
                if (!cancelled) setSubFoldersLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [enabled, folderId]);

    // A saved quiz stores the deepest choice in subFolderId; when that is a nested sub folder, split it back into parent + nested
    useEffect(() => {
        if (!subFolderId || subFolders.length === 0 || subFolders.some((item) => item.id === subFolderId)) return;
        const parent = subFolders.find((item) => item.subFolders?.some((nested) => nested.id === subFolderId));
        if (parent) {
            setSubFolderId(parent.id);
            setNestedSubFolderId(subFolderId);
        }
    }, [subFolders, subFolderId]);

    const nestedSubFolders = subFolders.find((item) => item.id === subFolderId)?.subFolders ?? [];

    const handleFolderChange = (value: string | string[]) => {
        setFolderId(toValue(value));
        setSubFolderId('');
        setNestedSubFolderId('');
        setErrors({});
    };

    const handleSubFolderChange = (value: string | string[]) => {
        setSubFolderId(toValue(value));
        setNestedSubFolderId('');
        setErrors((prev) => ({ ...prev, subFolderId: '', nestedSubFolderId: '' }));
    };

    const handleNestedSubFolderChange = (value: string | string[]) => {
        setNestedSubFolderId(toValue(value));
        setErrors((prev) => ({ ...prev, nestedSubFolderId: '' }));
    };

    // A folder is required, and so is a sub folder when the chosen folder has any. Returns the values to send,
    // or null when something is missing
    const getFolderFields = (): Record<string, string> | null => {
        const nextErrors: Record<string, string> = {};
        if (!folderId) nextErrors.folderId = 'Folder is required';
        else if (subFolders.length > 0 && !subFolderId) nextErrors.subFolderId = 'Sub Folder is required';
        else if (nestedSubFolders.length > 0 && !nestedSubFolderId) nextErrors.nestedSubFolderId = 'Nested Sub Folder is required';
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return null;

        // The deepest folder picked is what the quiz is saved under
        const deepestId = nestedSubFolderId || subFolderId;
        return { folderId, ...(deepestId ? { subFolderId: deepestId } : {}) };
    };

    return {
        folderId,
        subFolderId,
        nestedSubFolderId,
        folderOptions: folders.map((item) => ({ value: item.id, label: item.name })),
        subFolderOptions: subFolders.map((item) => ({ value: item.id, label: item.name })),
        nestedSubFolderOptions: nestedSubFolders.map((item) => ({ value: item.id, label: item.name })),
        foldersLoading,
        subFoldersLoading,
        loadError,
        errors,
        showSubFolder: Boolean(folderId),
        handleFolderChange,
        handleSubFolderChange,
        handleNestedSubFolderChange,
        getFolderFields,
    };
};
