// Types and constants of the Folder structure: Folder -> Sub Folder -> nested sub folders, up to MAX_FOLDER_DEPTH levels

export interface FolderRecord {
    id: string;
    name: string;
}

// A nested sub folder (level 3 and deeper); it can hold further nested sub folders
export interface FolderNode {
    id: string;
    name: string;
    subFolders: FolderNode[];
}

// A sub folder (level 2) of a folder; the tree below it is saved through it
export interface SubFolderRecord extends FolderNode {
    folderId: string;
}

export type FolderKind = 'folder' | 'subfolder' | 'nested';

// Folder is level 1, Sub Folder level 2, then nested sub folders down to level 10
export const MAX_FOLDER_DEPTH = 10;
const SUB_FOLDER_DEPTH = 2;

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

// --- Reading the API -----------------------------------------------------------------------------------------------

// The API lists nested sub folders as { id, name, subFolders } objects (older responses used plain names)
export const normalizeNode = (raw: any): FolderNode => ({
    id: typeof raw === 'object' ? raw?.id ?? '' : '',
    name: typeof raw === 'string' ? raw : raw?.name ?? '',
    subFolders: (Array.isArray(raw?.subFolders) ? raw.subFolders : []).map(normalizeNode).filter((node: FolderNode) => node.name),
});

export const normalizeSubFolder = (raw: any): SubFolderRecord => ({
    ...normalizeNode(raw),
    folderId: raw?.folderId ?? '',
});

// --- Editing the tree below a sub folder -----------------------------------------------------------------------------
// A node is addressed by its path: the index at each level, starting from the sub folder ([] is the sub folder itself)

// The depth (level) of the node at `path`: the sub folder is level 2, its children level 3, ...
export const depthOfPath = (path: number[]): number => SUB_FOLDER_DEPTH + path.length;

// Whether a node at `path` may still get children without going past the last level
export const canHaveChildren = (path: number[]): boolean => depthOfPath(path) < MAX_FOLDER_DEPTH;

export const getChildren = (nodes: FolderNode[], path: number[]): FolderNode[] =>
    path.length === 0 ? nodes : getChildren(nodes[path[0]]?.subFolders ?? [], path.slice(1));

export const getNodeAt = (nodes: FolderNode[], path: number[]): FolderNode | undefined =>
    path.length === 1 ? nodes[path[0]] : getNodeAt(nodes[path[0]]?.subFolders ?? [], path.slice(1));

// Each helper returns a new tree (the old one is left untouched)
export const addNode = (nodes: FolderNode[], parentPath: number[], name: string): FolderNode[] =>
    parentPath.length === 0
        ? [...nodes, { id: '', name, subFolders: [] }]
        : nodes.map((node, index) => (index === parentPath[0] ? { ...node, subFolders: addNode(node.subFolders, parentPath.slice(1), name) } : node));

export const renameNode = (nodes: FolderNode[], path: number[], name: string): FolderNode[] =>
    nodes.map((node, index) => {
        if (index !== path[0]) return node;
        return path.length === 1 ? { ...node, name } : { ...node, subFolders: renameNode(node.subFolders, path.slice(1), name) };
    });

export const removeNode = (nodes: FolderNode[], path: number[]): FolderNode[] =>
    path.length === 1
        ? nodes.filter((_node, index) => index !== path[0])
        : nodes.map((node, index) => (index === path[0] ? { ...node, subFolders: removeNode(node.subFolders, path.slice(1)) } : node));

// --- Writing the API -------------------------------------------------------------------------------------------------

export interface FolderTreePayload {
    name: string;
    subFolders: FolderTreePayload[];
}

// Sub Folder create / update body: its nested sub folders, each as { name, subFolders: [...] } all the way down
export const toSubFolderChildrenPayload = (nodes: FolderNode[]): FolderTreePayload[] =>
    nodes.map((node) => ({ name: node.name, subFolders: toSubFolderChildrenPayload(node.subFolders) }));

// Folder create / update body: the folder's sub folders; the names directly inside a sub folder are plain strings,
// anything deeper than that goes as { name, subFolders } objects
export const toFolderChildrenPayload = (subFolders: SubFolderRecord[]): { name: string; subFolders: (string | FolderTreePayload)[] }[] =>
    subFolders.map((subFolder) => ({
        name: subFolder.name,
        subFolders: subFolder.subFolders.map((node) => (node.subFolders.length === 0 ? node.name : { name: node.name, subFolders: toSubFolderChildrenPayload(node.subFolders) })),
    }));
