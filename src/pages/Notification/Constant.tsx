import type { ITableColumn } from '../../components/Table/ITable';
import { formatDate } from '../../utils/dateUtils';
import dayjs from 'dayjs';
import { renderTruncatedCellWithTooltip } from '../../utils/tableCellRender';
import { richTextToPlain } from '../../utils/richText';

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
    courseType?: string | null;
    courseId?: string | null;
    batchId?: string | null;
    sendPush?: boolean | null;
    audienceType?: string | null;
    // The users the notification is for (when the audience is Users)
    userIds?: string[] | null;
    userId?: string | null;
    pushScheduledAt?: string | null;
    createdAt?: string;
    updatedAt?: string | null;
}

export const NOTIFICATION_TAB_KEY = 'notification';
export const SYLLABUS_WISE_TAB_KEY = 'syllabusWise';
export const LIVE_CLASSES_TAB_KEY = 'liveClasses';

export const NOTIFICATION_PAGE_TABS = [
    { key: NOTIFICATION_TAB_KEY, label: 'Notification', title: 'Notifications' },
    { key: SYLLABUS_WISE_TAB_KEY, label: 'Syllabus Wise', title: 'Syllabus Wise' },
    { key: LIVE_CLASSES_TAB_KEY, label: 'Live Classes', title: 'Live Classes' },
];

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
        options: NOTIFICATION_TYPE_OPTIONS,
    },
];

export const NOTIFICATION_INPUT_FIELDS = [
    {
        name: 'title',
        label: 'Title',
        placeholder: 'Enter notification title',
        type: 'text' as const,
    },
];

// A rich text box (bold / italic / underline / link / ...), so it is not one of the plain input fields
export const NOTIFICATION_DESCRIPTION_FIELD = {
    name: 'description',
    label: 'Description',
    placeholder: 'Enter notification description',
};

export const NOTIFICATION_LINK_FIELDS = [
    {
        name: 'link',
        label: 'Link',
        placeholder: 'Enter link URL',
        type: 'text' as const,
    },
];

export const NOTIFICATION_DATE_FIELD = [
    {
        name: 'startDate',
        label: 'Start Date',
        placeholder: 'Select start date',
    },
    {
        name: 'endDate',
        label: 'End Date',
        placeholder: 'Select end date',
    },
];

// Targeting (all optional): the course / batch the notification is for, and who gets the push
export const NOTIFICATION_COURSE_TYPE_FIELD = {
    name: 'courseType',
    label: 'Course Type',
    placeholder: 'Select course type',
    options: [
        { value: 'Paid', label: 'Paid' },
        { value: 'Free', label: 'Free' },
    ],
};

export const NOTIFICATION_COURSE_FIELD = {
    name: 'courseId',
    label: 'Course',
    placeholder: 'Select course',
};

export const NOTIFICATION_BATCH_FIELD = {
    name: 'batchId',
    label: 'Batch',
    placeholder: 'Select batch',
};

export const SEND_PUSH_LABEL = 'Send Push Notification';

export const AUDIENCE_USERS = 'Users';

export const NOTIFICATION_AUDIENCE_FIELD = {
    name: 'audienceType',
    label: 'Audience Type',
    placeholder: 'Select audience type',
    options: [
        { value: AUDIENCE_USERS, label: 'Users' },
    ],
};

// Shown for the Users audience: the names are listed, the ids are what is sent
export const NOTIFICATION_USER_FIELD = {
    name: 'userId',
    label: 'Users',
    placeholder: 'Select users',
};

export const NOTIFICATION_PUSH_SCHEDULED_FIELD = [
    {
        name: 'pushScheduledAt',
        label: 'Push Scheduled At',
        placeholder: 'Select date & time',
        disablePastDates: true,
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
        // The description is saved as rich text (HTML); the table shows, sorts and searches its plain text
        sorter: (a: NotificationRecord, b: NotificationRecord) => compareText(richTextToPlain(a.description || ''), richTextToPlain(b.description || '')),
        render: (description: string) => renderTruncatedCellWithTooltip(richTextToPlain(description || '')),
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
