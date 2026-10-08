export interface FolderRecord {
    id: string;
    name: string;
}

export interface SubFolderRecord {
    id: string;
    name: string;
    folderId: string;
}

export type FolderKind = 'folder' | 'subfolder';

export const NAME_MAX_LENGTH = 100;

// Singular names used in modal titles and toast messages
export const FOLDER_LABELS: Record<FolderKind, string> = {
    folder: 'Folder',
    subfolder: 'Sub Folder',
};

export const FOLDER_NAME_FIELD = {
    name: 'name',
    label: 'Name',
    placeholder: 'Enter name',
    required: true,
    type: 'text' as const,
    maxLength: NAME_MAX_LENGTH,
};
