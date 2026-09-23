export interface FilterColumnConfig {
    key: string;
    title: string;
    searchType?: 'text' | 'date';
    /** For searchType 'date' only — disables picking a date after today. */
    disableFutureDates?: boolean;
    displayOrder?: number;
}

export const USER_FILTER_FIELDS: FilterColumnConfig[] = [
    {
        key: 'firstName',
        title: 'First Name',
        displayOrder: 1,
    },
    {
        key: 'lastName',
        title: 'Last Name',
        displayOrder: 2,
    },
    {
        key: 'email',
        title: 'Email',
        displayOrder: 3,
    },
    {
        key: 'phoneNumber',
        title: 'Phone Number',
        displayOrder: 4,
    },
];

export const MATERIAL_FILTER_FIELDS: FilterColumnConfig[] = [
    {
        key: 'title',
        title: 'Title',
        displayOrder: 1,
    },
    {
        key: 'description',
        title: 'Description',
        displayOrder: 2,
    },
    {
        key: 'batchTitle',
        title: 'Batch',
        displayOrder: 3,
    },
    {
        key: 'createdAt',
        title: 'Created At',
        displayOrder: 4,
        searchType: 'date',
        disableFutureDates: true,
    },
    {
        key: 'updatedAt',
        title: 'Updated At',
        displayOrder: 5,
        searchType: 'date',
        disableFutureDates: true,
    },
];

export const QUIZ_FILTER_FIELDS: FilterColumnConfig[] = [
    {
        key: 'title',
        title: 'Title',
        displayOrder: 1,
    },
    {
        key: 'courseName',
        title: 'Course',
        displayOrder: 2,
    },
    {
        key: 'createdAt',
        title: 'Created At',
        displayOrder: 3,
        searchType: 'date',
        disableFutureDates: true,
    },
    {
        key: 'publishedAt',
        title: 'Published At',
        displayOrder: 4,
        searchType: 'date',
        disableFutureDates: true,
    },
];

export const NOTIFICATION_FILTER_FIELDS: FilterColumnConfig[] = [
    {
        key: 'title',
        title: 'Title',
        displayOrder: 1,
    },
    {
        key: 'description',
        title: 'Description',
        displayOrder: 2,
    },
    {
        key: 'link',
        title: 'Link',
        displayOrder: 3,
    },
    {
        key: 'date',
        title: 'Date',
        displayOrder: 4,
        searchType: 'date',
    },
];
