import type { ITableColumn } from '../../components/Table/ITable';
import dayjs from 'dayjs';
import { renderTruncatedCellWithTooltip } from '../../utils/tableCellRender';

export interface CourseRecord {
    id: string;
    courseName: string;
    courseDescription: string;
    courseAmount: number;
    createdAt?: string;
    updatedAt?: string | null;
}

export const COURSE_INPUT_FIELDS = [
    {
        name: 'courseName',
        label: 'Course Name',
        placeholder: 'Enter course name',
        required: true,
        type: 'text' as const,
    },
    {
        name: 'courseDescription',
        label: 'Description',
        placeholder: 'Enter course description',
        required: false,
        type: 'text' as const,
    },
    {
        name: 'courseAmount',
        label: 'Amount',
        placeholder: 'Enter course amount',
        required: true,
        type: 'number' as const,
    },
];

export type CourseDetailRecord = CourseRecord;

export const EDIT_COURSE_FIELDS = COURSE_INPUT_FIELDS;

export interface BatchRecord {
    id: string;
    title: string;
    courseId: string;
    courseName?: string;
    batchFrom: string;
    batchTo: string;
    whatsAppLink?: string | null;
    telegramLink?: string | null;
    createdAt?: string;
    updatedAt?: string | null;
    isExpired: boolean;
}

export const BATCH_SEARCH_INPUT_FIELDS = [
    {
        name: 'search',
        label: '',
        placeholder: 'Search by batch title',
        type: 'text' as const,
        search: true,
    },
];

export const BATCH_TITLE_FIELD = [
    {
        name: 'title',
        label: 'Batch Title',
        placeholder: 'Enter batch title',
        required: true,
        type: 'text' as const,
    },
];

export const BATCH_LINK_FIELDS = [
    {
        name: 'whatsAppLink',
        label: 'WhatsApp Link',
        placeholder: 'Enter WhatsApp link',
        hint: 'eg: https://chat.whatsapp.com/AbCdEf123456',
        type: 'text' as const,
    },
    {
        name: 'telegramLink',
        label: 'Telegram Link',
        placeholder: 'Enter Telegram link',
        hint: 'eg: https://t.me/yourgroupname',
        type: 'text' as const,
    },
];

export const BATCH_DATE_FIELDS = [
    {
        name: 'batchFrom',
        label: 'Batch From',
        placeholder: 'Select start date',
        required: true,
    },
    {
        name: 'batchTo',
        label: 'Batch To',
        placeholder: 'Select end date',
        required: true,
    },
];

const compareText = (a?: string | null, b?: string | null) =>
    (a || '').toLowerCase().localeCompare((b || '').toLowerCase());

// Define columns without the actions render function (formatDate/Tag render is added by the page)
export const getBatchTableColumns = (): ITableColumn[] => [
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        searchType: 'text',
        sorter: (a: BatchRecord, b: BatchRecord) => compareText(a.title, b.title),
        render: (title: string) => renderTruncatedCellWithTooltip(title),
    },
    {
        title: 'Batch From',
        dataIndex: 'batchFrom',
        key: 'batchFrom',
        searchType: 'date',
        sorter: (a: BatchRecord, b: BatchRecord) => compareText(a.batchFrom, b.batchFrom),
    },
    {
        title: 'Batch To',
        dataIndex: 'batchTo',
        key: 'batchTo',
        searchType: 'date',
        sorter: (a: BatchRecord, b: BatchRecord) => compareText(a.batchTo, b.batchTo),
    },
    {
        title: 'Status',
        dataIndex: 'isExpired',
        key: 'isExpired',
        searchType: 'text',
        sorter: (a: BatchRecord, b: BatchRecord) => Number(a.isExpired) - Number(b.isExpired),
    },
];

export const dayjsToISOString = (value: any): string => {
    if (!value) return '';
    if (dayjs.isDayjs(value)) return value.toISOString();
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.toISOString() : '';
};
