import { useEffect, useState } from 'react';
import superSalesAPI from '../../../services/LearningAPI';

const toList = <T,>(res: any): T[] => (Array.isArray(res?.data?.data) ? res.data.data : []);
const toValue = (value: string | string[]) => (Array.isArray(value) ? value[0] || '' : value);

interface NamedRecord {
    id: string;
    name: string;
    /** Nested sub folders (each with its own id, and possibly more inside); only present on sub folders */
    subFolders?: NamedRecord[];
}

export interface FolderSelectorOptions {
    /** Set false to skip loading (the quiz isn't a folder-based one) */
    enabled?: boolean;
    /** Values to start from, e.g. the saved folder / sub folder when editing */
    initial?: { folderId?: string | null; subFolderId?: string | null };
}

// One dropdown below the Folder: the sub folders, then the nested sub folders of the chosen one, and so on
export interface FolderLevel {
    label: string;
    value: string;
    options: { value: string; label: string }[];
}

const levelLabel = (index: number) => (index === 0 ? 'Sub Folder' : index === 1 ? 'Nested Sub Folder' : `Nested Sub Folder ${index}`);

// The ids from the first sub folder down to `targetId`, or null when it isn't in the tree
const findPath = (nodes: NamedRecord[], targetId: string): string[] | null => {
    for (const node of nodes) {
        if (node.id === targetId) return [node.id];
        const below = findPath(node.subFolders ?? [], targetId);
        if (below) return [node.id, ...below];
    }
    return null;
};

// Folder -> Sub Folder -> nested sub folders (as deep as the folder structure goes) dropdowns for quizzes that live
// in a folder; the deepest one picked is what the quiz is saved under
export const useFolderSelector = ({ enabled = true, initial }: FolderSelectorOptions = {}) => {
    const [folders, setFolders] = useState<NamedRecord[]>([]);
    const [subFolders, setSubFolders] = useState<NamedRecord[]>([]);
    const [foldersLoading, setFoldersLoading] = useState(false);
    const [subFoldersLoading, setSubFoldersLoading] = useState(false);
    const [loadError, setLoadError] = useState('');

    const [folderId, setFolderId] = useState('');
    // The chosen id at each level below the folder: [sub folder, nested, nested, ...]
    const [path, setPath] = useState<string[]>([]);
    // Editing: the saved (deepest) id, turned into a path once the sub folders have loaded
    const [pendingId, setPendingId] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Editing: start from the saved values once they arrive
    const initialKey = initial ? `${initial.folderId ?? ''}|${initial.subFolderId ?? ''}` : '';
    useEffect(() => {
        if (!initial) return;
        setFolderId(initial.folderId || '');
        setPath([]);
        setPendingId(initial.subFolderId || '');
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

    // A saved quiz stores the deepest choice; split it back into one choice per level
    useEffect(() => {
        if (!pendingId || subFolders.length === 0) return;
        setPath(findPath(subFolders, pendingId) ?? []);
        setPendingId('');
    }, [subFolders, pendingId]);

    // One dropdown per level: it appears once the level above is chosen and only if there is something to pick
    const levels: FolderLevel[] = [];
    let options = subFolders;
    for (let index = 0; options.length > 0; index++) {
        const value = path[index] ?? '';
        levels.push({ label: levelLabel(index), value, options: options.map((item) => ({ value: item.id, label: item.name })) });
        const chosen = options.find((item) => item.id === value);
        if (!chosen) break;
        options = chosen.subFolders ?? [];
    }

    const handleFolderChange = (value: string | string[]) => {
        setFolderId(toValue(value));
        setPath([]);
        setErrors({});
    };

    // Choosing a level clears everything below it
    const handleLevelChange = (index: number, value: string | string[]) => {
        setPath((prev) => [...prev.slice(0, index), toValue(value)]);
        setErrors((prev) => ({ ...prev, [`level${index}`]: '' }));
    };

    // A folder is required, and so is every level that has something to pick. Returns the values to send,
    // or null when something is missing
    const getFolderFields = (): Record<string, string> | null => {
        const nextErrors: Record<string, string> = {};
        if (!folderId) nextErrors.folderId = 'Folder is required';
        else {
            const missing = levels.findIndex((level) => !level.value);
            if (missing >= 0) nextErrors[`level${missing}`] = `${levels[missing].label} is required`;
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return null;

        // The deepest folder picked is what the quiz is saved under
        const deepestId = levels.length > 0 ? levels[levels.length - 1].value : '';
        return { folderId, ...(deepestId ? { subFolderId: deepestId } : {}) };
    };

    return {
        folderId,
        folderOptions: folders.map((item) => ({ value: item.id, label: item.name })),
        levels,
        foldersLoading,
        subFoldersLoading,
        loadError,
        errors,
        showSubFolder: Boolean(folderId),
        handleFolderChange,
        handleLevelChange,
        getFolderFields,
    };
};
