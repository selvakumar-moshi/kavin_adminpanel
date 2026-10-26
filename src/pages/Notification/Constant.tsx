import type { ITableColumn } from '../../components/Table/ITable';
import { formatDate } from '../../utils/dateUtils';
import dayjs from 'dayjs';
import { renderTruncatedCellWithTooltip } from '../../utils/tableCellRender';

export interface NotificationRecord {
    id: string;
    title: string;
    description: string;
    link: string;
    notificationType?: string;
    // The attached file, when there is one
    attachmentName?: string | null;
    attachmentUrl?: string | null;
    startDate: string;
    endDate: string;
    createdAt?: string;
    updatedAt?: string | null;
}

export const NOTIFICATION_SEARCH_INPUT_FIELDS = [
    {
        name: 'search',
        label: '',
        placeholder: 'Search by title, description or link',
        type: 'text' as const,
        search: true,
    },
];

// Only this type is scheduled for a time of day; the others (Job Notification) are just dated
export const FLASH_NOTIFICATION_TYPE = 'Flash Notification';

export const NOTIFICATION_TYPE_OPTIONS = [
    { value: FLASH_NOTIFICATION_TYPE, label: 'Flash Notification' },
    { value: 'Job Notification', label: 'Job Notification' },
];

export const NOTIFICATION_TYPE_FIELD = [
    {
        name: 'notificationType',
        label: 'Notification Type',
        placeholder: 'Select Notification Type',
        required: true,
        options: NOTIFICATION_TYPE_OPTIONS,
    },
];

export const NOTIFICATION_INPUT_FIELDS = [
    {
        name: 'title',
        label: 'Title',
        placeholder: 'Enter notification title',
        required: true,
        type: 'text' as const,
    },
    {
        name: 'description',
        label: 'Description',
        placeholder: 'Enter notification description',
        required: true,
        type: 'textarea' as const,
    },
    {
        name: 'link',
        label: 'Link',
        placeholder: 'Enter link URL',
        required: true,
        type: 'text' as const,
    },
];

export const NOTIFICATION_DATE_FIELD = [
    {
        name: 'startDate',
        label: 'Start Date',
        placeholder: 'Select start date',
        required: true,
    },
    {
        name: 'endDate',
        label: 'End Date',
        placeholder: 'Select end date',
        required: true,
    },
];

export const dayjsToISOString = (value: unknown): string => {
    if (!value) return '';
    if (dayjs.isDayjs(value)) return value.toISOString();
    const parsed = dayjs(value as string);
    return parsed.isValid() ? parsed.toISOString() : '';
};

const compareText = (a?: string | null, b?: string | null) =>
    (a || '').toLowerCase().localeCompare((b || '').toLowerCase());

export const getNotificationTableColumns = (): ITableColumn[] => [
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        searchType: 'text',
        sorter: (a: NotificationRecord, b: NotificationRecord) => compareText(a.title, b.title),
        render: (title: string) => renderTruncatedCellWithTooltip(title),
    },
    {
        title: 'Notification Type',
        dataIndex: 'notificationType',
        key: 'notificationType',
        searchType: 'text',
        sorter: (a: NotificationRecord, b: NotificationRecord) => compareText(a.notificationType, b.notificationType),
    },
    {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        searchType: 'text',
        sorter: (a: NotificationRecord, b: NotificationRecord) => compareText(a.description, b.description),
        render: (description: string) => renderTruncatedCellWithTooltip(description),
    },
    {
        title: 'Link',
        dataIndex: 'link',
        key: 'link',
        searchType: 'text',
        render: (link: string) => (
            <a href={link} target="_blank" rel="noopener noreferrer" className="keep-case">{renderTruncatedCellWithTooltip(link)}</a>
        ),
    },
    {
        title: 'Start Date',
        dataIndex: 'startDate',
        key: 'startDate',
        searchType: 'date',
        sorter: (a: NotificationRecord, b: NotificationRecord) => compareText(a.startDate, b.startDate),
        render: (value: string) => (value ? formatDate(value) : '-'),
    },
    {
        title: 'End Date',
        dataIndex: 'endDate',
        key: 'endDate',
        searchType: 'date',
        sorter: (a: NotificationRecord, b: NotificationRecord) => compareText(a.endDate, b.endDate),
        render: (value: string) => (value ? formatDate(value) : '-'),
    },
    {
        title: 'Created At',
        dataIndex: 'createdAt',
        key: 'createdAt',
        searchType: 'date',
        disableFutureDates: true,
        sorter: (a: NotificationRecord, b: NotificationRecord) => compareText(a.createdAt, b.createdAt),
        render: (value: string) => (value ? formatDate(value) : '-'),
    },
    // {
    //     title: 'Updated At',
    //     dataIndex: 'updatedAt',
    //     key: 'updatedAt',
    //     searchType: 'date',
    //     disableFutureDates: true,
    //     sorter: (a: NotificationRecord, b: NotificationRecord) => compareText(a.updatedAt, b.updatedAt),
    //     render: (value: string | null) => (value ? formatDate(value) : '-'),
    // },
];
