import dayjs from 'dayjs';
import type { ITableColumn } from '../Table/ITable';
import StatusBadge from '../Table/StatusBadge';
import { formatDate } from '../../utils/dateUtils';
import { renderTruncatedCellWithTooltip } from '../../utils/tableCellRender';
import { richTextToPlain } from '../../utils/richText';
import type { ValidationRule } from '../../utils/validationUtils';

export interface LiveClassRecord {
    id: string;
    title: string;
    description: string;
    /** YYYY-MM-DD (the API may send a full date-time) */
    date: string;
    /** HH:mm or HH:mm:ss */
    startTime: string;
    /** HH:mm or HH:mm:ss */
    endTime: string;
    status: string;
    youTubeLink?: string | null;
    googleMeetLink?: string | null;
    createdAt?: string;
    updatedAt?: string | null;
}

// The values the Status dropdown offers (and sends as `status`)
export const LIVE_CLASS_STATUS_OPTIONS = [
    { value: 'Not Started', label: 'Not Started' },
    { value: 'Online', label: 'Online' },
    { value: 'Expired', label: 'Expired' },
];

// The table's search box looks in the plain text of these (the description is saved as rich text)
export const LIVE_CLASS_SEARCH_FIELDS = ['title', 'description', 'status'];

export const LIVE_CLASS_SEARCH_INPUT_FIELDS = [
    {
        name: 'search',
        label: '',
        placeholder: 'Search by title, description or status',
        type: 'text' as const,
        search: true,
    },
];

export const LIVE_CLASS_INPUT_FIELDS = [
    {
        name: 'title',
        label: 'Title',
        placeholder: 'Enter title',
        required: true,
        type: 'text' as const,
    },
];

// A rich text box (bold / italic / underline / link / ...), so it is not one of the plain input fields
export const LIVE_CLASS_DESCRIPTION_FIELD = {
    name: 'description',
    label: 'Description',
    placeholder: 'Enter description',
};

// Both links are optional
export const LIVE_CLASS_LINK_FIELDS = [
    {
        name: 'youTubeLink',
        label: 'YouTube Link',
        placeholder: 'Enter YouTube link',
        required: false,
        type: 'text' as const,
    },
    {
        name: 'googleMeetLink',
        label: 'Google Meet Link',
        placeholder: 'Enter Google Meet link',
        required: false,
        type: 'text' as const,
    },
];

export const LIVE_CLASS_DATE_FIELD = [
    {
        name: 'date',
        label: 'Date',
        placeholder: 'Select date',
        required: true,
    },
];

export const LIVE_CLASS_TIME_FIELDS = [
    { name: 'startTime', label: 'Start Time', placeholder: 'Select start time' },
    { name: 'endTime', label: 'End Time', placeholder: 'Select end time' },
];

export const LIVE_CLASS_STATUS_FIELD = {
    name: 'status',
    label: 'Status',
    placeholder: 'Select status',
    required: true,
};

export const LIVE_CLASS_VALIDATION_RULES: Record<string, ValidationRule> = {
    title: {
        required: true,
        errorMessages: { required: 'Title is required' },
    },
    description: {
        errorMessages: {},
    },
    date: {
        required: true,
        errorMessages: { required: 'Date is required' },
    },
    startTime: {
        required: true,
        errorMessages: { required: 'Start time is required' },
    },
    endTime: {
        required: true,
        errorMessages: { required: 'End time is required' },
    },
    status: {
        required: true,
        errorMessages: { required: 'Status is required' },
    },
};

export const TIME_FORMAT = 'HH:mm';

// "10:30:00" / "10:30" / "2026-01-05T10:30:00" -> "10:30" (what the time picker works with); '' when there is no time
export const toTimeValue = (value?: string | null): string => {
    const match = String(value ?? '').match(/(\d{1,2}):(\d{2})/);
    return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '';
};

// "2026-01-05" / "2026-01-05T00:00:00" -> "2026-01-05"; '' when there is no valid date
export const toDateValue = (value?: unknown): string => {
    if (!value) return '';
    const parsed = dayjs(value as string);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
};

// The API takes the time with seconds
export const toTimePayload = (value: string): string => (value ? `${toTimeValue(value)}:00` : '');

// "10:30" -> "10:30 AM" for the table
export const formatTime = (value?: string | null): string => {
    const time = toTimeValue(value);
    return time ? dayjs(`2000-01-01T${time}`).format('hh:mm A') : '-';
};

const compareText = (a?: string | null, b?: string | null) =>
    (a || '').toLowerCase().localeCompare((b || '').toLowerCase());

export const getLiveClassTableColumns = (): ITableColumn[] => [
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        searchType: 'text',
        sorter: (a: LiveClassRecord, b: LiveClassRecord) => compareText(a.title, b.title),
        render: (title: string) => renderTruncatedCellWithTooltip(title),
    },
    {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        searchType: 'text',
        sorter: (a: LiveClassRecord, b: LiveClassRecord) => compareText(a.description, b.description),
        render: (description: string) => renderTruncatedCellWithTooltip(description),
    },
    {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        searchType: 'date',
        sorter: (a: LiveClassRecord, b: LiveClassRecord) => compareText(a.date, b.date),
        render: (value: string) => (value ? formatDate(value) : '-'),
    },
    {
        title: 'Start Time',
        dataIndex: 'startTime',
        key: 'startTime',
        sorter: (a: LiveClassRecord, b: LiveClassRecord) => compareText(toTimeValue(a.startTime), toTimeValue(b.startTime)),
        render: (value: string) => formatTime(value),
    },
    {
        title: 'End Time',
        dataIndex: 'endTime',
        key: 'endTime',
        sorter: (a: LiveClassRecord, b: LiveClassRecord) => compareText(toTimeValue(a.endTime), toTimeValue(b.endTime)),
        render: (value: string) => formatTime(value),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        searchType: 'text',
        sorter: (a: LiveClassRecord, b: LiveClassRecord) => compareText(a.status, b.status),
        render: (status: string) => <StatusBadge status={status || ''} />,
    },
];

// The list keeps the description as plain text, because the table, its search and its sort all work on that
export const withPlainDescription = (record: LiveClassRecord): LiveClassRecord => ({
    ...record,
    description: richTextToPlain(record.description || ''),
});
