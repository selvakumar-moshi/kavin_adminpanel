// Types and constants of the Folder structure: Folder -> Sub Folder -> nested sub folder (3 levels)

export interface FolderRecord {
    id: string;
    name: string;
}

export interface SubFolderRecord {
    id: string;
    name: string;
    folderId: string;
    /** Names of the nested sub folders inside this sub folder (the deepest level: names only) */
    subFolders: string[];
}

export type FolderKind = 'folder' | 'subfolder' | 'nested';

export const NAME_MAX_LENGTH = 100;

// Singular names used in modal titles and toast messages
export const FOLDER_LABELS: Record<FolderKind, string> = {
    folder: 'Folder',
    subfolder: 'Sub Folder',
    nested: 'Nested Sub Folder',
};

export const FOLDER_NAME_FIELD = {
    name: 'name',
    label: 'Name',
    placeholder: 'Enter name',
    required: true,
    type: 'text' as const,
    maxLength: NAME_MAX_LENGTH,
};

// --- API payload shapes -------------------------------------------------------------------------------------------

// A child of a Folder in the Folder create / update body: { name, subFolders: [names] }
export interface FolderChildPayload {
    name: string;
    subFolders: string[];
}

// The API may list nested sub folders as plain names or as { name, subFolders } objects; the UI only needs the names
export const normalizeSubFolder = (raw: any): SubFolderRecord => ({
    id: raw?.id ?? '',
    name: raw?.name ?? '',
    folderId: raw?.folderId ?? '',
    subFolders: (Array.isArray(raw?.subFolders) ? raw.subFolders : [])
        .map((child: unknown) => (typeof child === 'string' ? child : (child as { name?: string })?.name ?? ''))
        .filter(Boolean),
});

// Folder create / update body: the folder's sub folders, each with the names nested inside it
export const toFolderChildrenPayload = (subFolders: SubFolderRecord[]): FolderChildPayload[] =>
    subFolders.map((subFolder) => ({ name: subFolder.name, subFolders: subFolder.subFolders }));

// Sub Folder create / update body: its nested sub folders, each as { name, subFolders: [] }
export const toSubFolderChildrenPayload = (names: string[]): FolderChildPayload[] =>
    names.map((name) => ({ name, subFolders: [] }));
