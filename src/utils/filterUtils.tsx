export interface FilterColumnConfig {
    key: string;
    title: string;
    searchType?: 'text' | 'date';
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
        key: 'courseId',
        title: 'Course',
        displayOrder: 3,
    },
    {
        key: 'batchTitle',
        title: 'Batch',
        displayOrder: 4,
    },
];
