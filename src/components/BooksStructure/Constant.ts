// Types and constants of the Books structure (subjects, categories, standards, parts)
export type StructureTab = 'subjects' | 'categories' | 'standards' | 'parts';

// The API lists a subject's / category's standards either as plain numbers or as { standard, parts } objects
export type RawStandardEntry = number | { standard: number; parts?: string[] | null };

// Parts that came embedded with the standards of a subject / category, keyed by standard number
export type EmbeddedStandardParts = Record<number, string[]>;

export interface SubjectRecord {
    id: string;
    name: string;
    standards: number[];
    standardParts?: EmbeddedStandardParts;
}

export interface CategoryRecord {
    id: string;
    name: string;
    subject: string;
    standards: number[];
    standardParts?: EmbeddedStandardParts;
}

export interface StandardRecord {
    id: string;
    standard: number;
    parts: string[];
}

export interface PartRecord {
    id: string;
    name: string;
}

export type StructureRecord = SubjectRecord | CategoryRecord | StandardRecord | PartRecord;

// Singular name used in button / modal / toast text, and the URL segment of each list's API
export const STRUCTURE_META: Record<StructureTab, { singular: string; apiPath: string }> = {
    subjects: { singular: 'Subject', apiPath: 'subjects' },
    categories: { singular: 'Category', apiPath: 'categories' },
    standards: { singular: 'Standards', apiPath: 'standards' },
    parts: { singular: 'Part', apiPath: 'parts' },
};

export const formatStandard = (standard: number | string) => `${standard}th Standard`;

export const NAME_MAX_LENGTH = 100;

// Form field definitions (the dropdowns' options are filled in by the page from the loaded lists)
export const STRUCTURE_NAME_FIELD = {
    name: 'name',
    label: 'Name',
    placeholder: 'Enter name',
    required: true,
    type: 'text' as const,
    maxLength: NAME_MAX_LENGTH,
};

export const STRUCTURE_STANDARD_NUMBER_FIELD = {
    name: 'standard',
    label: 'Standard',
    placeholder: 'Enter standard number, e.g. 6',
    required: true,
    type: 'number' as const,
};
