import type { ITableColumn } from '../Table/ITable';
import { formatDate } from '../../utils/dateUtils';
import { renderTruncatedCellWithTooltip } from '../../utils/tableCellRender';
import type { ValidationRule } from '../../utils/validationUtils';

export interface SyllabusRecord {
    id: string;
    title: string;
    description: string;
    amount: number;
    folderId: string;
    folderName?: string | null;
    createdAt?: string;
    updatedAt?: string | null;
}

export const SYLLABUS_SEARCH_FIELDS = ['title', 'description', 'folderName'];

export const SYLLABUS_SEARCH_INPUT_FIELDS = [
    {
        name: 'search',
        label: '',
        placeholder: 'Search by title, description or folder',
        type: 'text' as const,
        search: true,
    },
];

export const SYLLABUS_INPUT_FIELDS = [
    {
        name: 'title',
        label: 'Title',
        placeholder: 'Enter title',
        required: true,
        type: 'text' as const,
    },
];

// A rich text box (bold / italic / underline / link), so it is not part of the plain input fields
export const SYLLABUS_DESCRIPTION_FIELD = {
    name: 'description',
    label: 'Description',
    placeholder: 'Enter description',
};

export const SYLLABUS_AMOUNT_FIELD = {
    name: 'amount',
    label: 'Amount',
    placeholder: 'Enter amount',
    required: true,
    type: 'text' as const,
    singleLine: true,
};

export const SYLLABUS_FOLDER_FIELD = {
    name: 'folderId',
    label: 'Folder',
    placeholder: 'Select folder',
    required: true,
};

export const SYLLABUS_VALIDATION_RULES: Record<string, ValidationRule> = {
    title: {
        required: true,
        errorMessages: { required: 'Title is required' },
    },
    description: {
        errorMessages: {},
    },
    amount: {
        required: true,
        pattern: /^\d+(\.\d{1,2})?$/,
        errorMessages: {
            required: 'Amount is required',
            pattern: 'Enter a valid amount, e.g. 2000 or 1500.50',
        },
    },
    folderId: {
        required: true,
        errorMessages: { required: 'Folder is required' },
    },
};

export const formatAmount = (amount: number | string | null | undefined) =>
    amount === null || amount === undefined || amount === '' ? '-' : `₹${Number(amount).toLocaleString()}`;

const compareText = (a?: string | null, b?: string | null) =>
    (a || '').toLowerCase().localeCompare((b || '').toLowerCase());

export const getSyllabusTableColumns = (): ITableColumn[] => [
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        searchType: 'text',
        sorter: (a: SyllabusRecord, b: SyllabusRecord) => compareText(a.title, b.title),
        render: (title: string) => renderTruncatedCellWithTooltip(title),
    },
    {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        searchType: 'text',
        sorter: (a: SyllabusRecord, b: SyllabusRecord) => compareText(a.description, b.description),
        render: (description: string) => renderTruncatedCellWithTooltip(description),
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        searchType: 'text',
        sorter: (a: SyllabusRecord, b: SyllabusRecord) => (a.amount ?? 0) - (b.amount ?? 0),
        render: (amount: number) => formatAmount(amount),
    },
    {
        title: 'Folder',
        dataIndex: 'folderName',
        key: 'folderName',
        searchType: 'text',
        sorter: (a: SyllabusRecord, b: SyllabusRecord) => compareText(a.folderName, b.folderName),
        render: (folderName: string | null) => renderTruncatedCellWithTooltip(folderName),
    },
    {
        title: 'Created At',
        dataIndex: 'createdAt',
        key: 'createdAt',
        searchType: 'date',
        disableFutureDates: true,
        sorter: (a: SyllabusRecord, b: SyllabusRecord) => compareText(a.createdAt, b.createdAt),
        render: (value: string) => (value ? formatDate(value) : '-'),
    },
];
