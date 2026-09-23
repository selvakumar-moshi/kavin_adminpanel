import { FilePdfOutlined, YoutubeOutlined } from '@ant-design/icons';
import type { ITableColumn } from '../../components/Table/ITable';
import { formatDate } from '../../utils/dateUtils';

const compareText = (a?: string | null, b?: string | null) =>
    (a || '').toLowerCase().localeCompare((b || '').toLowerCase());

export const MATERIAL_SEARCH_INPUT_FIELDS = [
    {
        name: 'search',
        label: '',
        placeholder: 'Search by title or description',
        type: 'text' as const,
        search: true,
    },
];

export interface StudyMaterialRecord {
    id: string;
    title: string;
    description: string;
    pdfUrl: string;
    pdfFileName: string;
    courseId: string;
    batchId: string | null;
    batchTitle: string | null;
    materialToView?: string;
    createdAt?: string;
    updatedAt?: string | null;
}

export const MATERIAL_TO_VIEW_OPTIONS = [
    { value: 'Paid', label: 'Paid' },
    { value: 'Free', label: 'Free' },
];

export const STUDY_MATERIAL_TEXT_FIELDS = [
    {
        name: 'title',
        label: 'Title',
        placeholder: 'Enter title',
        required: true,
        type: 'text' as const,
    },
    {
        name: 'description',
        label: 'Description',
        placeholder: 'Enter description',
        required: false,
        type: 'text' as const,
    },
];

export const getStudyMaterialTableColumns = (getCourseName: (courseId: string) => string): ITableColumn[] => [
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        searchType: 'text',
        sorter: (a: StudyMaterialRecord, b: StudyMaterialRecord) => compareText(a.title, b.title),
    },
    // {
    //     title: 'Description',
    //     dataIndex: 'description',
    //     key: 'description',
    //     searchType: 'text',
    //     sorter: (a: StudyMaterialRecord, b: StudyMaterialRecord) => compareText(a.description, b.description),
    //     render: (value: string) => value || '-',
    // },
    {
        title: 'Course',
        dataIndex: 'courseId',
        key: 'courseId',
        render: (courseId: string) => getCourseName(courseId),
    },
    {
        title: 'Batch',
        dataIndex: 'batchTitle',
        key: 'batchTitle',
        searchType: 'text',
        sorter: (a: StudyMaterialRecord, b: StudyMaterialRecord) => compareText(a.batchTitle, b.batchTitle),
        render: (value: string | null) => value || 'All batches',
    },
    {
        title: 'PDF',
        dataIndex: 'pdfUrl',
        key: 'pdfUrl',
        render: (pdfUrl: string) => (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <FilePdfOutlined /> View
            </a>
        ),
    },
    {
        title: 'Material To View',
        dataIndex: 'materialToView',
        key: 'materialToView',
        searchType: 'text',
        sorter: (a: StudyMaterialRecord, b: StudyMaterialRecord) => compareText(a.materialToView, b.materialToView),
        render: (value: string | undefined) => value || '-',
    },
    {
        title: 'Created At',
        dataIndex: 'createdAt',
        key: 'createdAt',
        searchType: 'date',
        disableFutureDates: true,
        sorter: (a: StudyMaterialRecord, b: StudyMaterialRecord) => compareText(a.createdAt, b.createdAt),
        render: (value: string) => formatDate(value),
    },
    {
        title: 'Updated At',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        searchType: 'date',
        disableFutureDates: true,
        sorter: (a: StudyMaterialRecord, b: StudyMaterialRecord) => compareText(a.updatedAt, b.updatedAt),
        render: (value: string | null) => (value ? formatDate(value) : '-'),
    },
];

export interface VideoMaterialRecord {
    id: string;
    title: string;
    description: string;
    courseId: string;
    batchId: string | null;
    batchTitle: string | null;
    youtubeLink: string;
    materialToView?: string;
    createdAt?: string;
    updatedAt?: string | null;
}

export const VIDEO_MATERIAL_TEXT_FIELDS = [
    {
        name: 'title',
        label: 'Title',
        placeholder: 'Enter title',
        required: true,
        type: 'text' as const,
    },
    {
        name: 'description',
        label: 'Description',
        placeholder: 'Enter description',
        required: false,
        type: 'text' as const,
    },
    {
        name: 'youtubeLink',
        label: 'YouTube Link',
        placeholder: 'Enter YouTube video URL',
        required: true,
        type: 'text' as const,
    },
];

export const getVideoMaterialTableColumns = (getCourseName: (courseId: string) => string): ITableColumn[] => [
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        searchType: 'text',
        sorter: (a: VideoMaterialRecord, b: VideoMaterialRecord) => compareText(a.title, b.title),
    },
    // {
    //     title: 'Description',
    //     dataIndex: 'description',
    //     key: 'description',
    //     searchType: 'text',
    //     sorter: (a: VideoMaterialRecord, b: VideoMaterialRecord) => compareText(a.description, b.description),
    //     render: (value: string) => value || '-',
    // },
    {
        title: 'Course',
        dataIndex: 'courseId',
        key: 'courseId',
        render: (courseId: string) => getCourseName(courseId),
    },
    {
        title: 'Batch',
        dataIndex: 'batchTitle',
        key: 'batchTitle',
        searchType: 'text',
        sorter: (a: VideoMaterialRecord, b: VideoMaterialRecord) => compareText(a.batchTitle, b.batchTitle),
        render: (value: string | null) => value || 'All batches',
    },
    {
        title: 'Video',
        dataIndex: 'youtubeLink',
        key: 'youtubeLink',
        render: (youtubeLink: string) => (
            <a href={youtubeLink} target="_blank" rel="noopener noreferrer">
                <YoutubeOutlined /> Watch
            </a>
        ),
    },
    {
        title: 'Material To View',
        dataIndex: 'materialToView',
        key: 'materialToView',
        searchType: 'text',
        sorter: (a: VideoMaterialRecord, b: VideoMaterialRecord) => compareText(a.materialToView, b.materialToView),
        render: (value: string | undefined) => value || '-',
    },
    {
        title: 'Created At',
        dataIndex: 'createdAt',
        key: 'createdAt',
        searchType: 'date',
        disableFutureDates: true,
        sorter: (a: VideoMaterialRecord, b: VideoMaterialRecord) => compareText(a.createdAt, b.createdAt),
        render: (value: string) => formatDate(value),
    },
    {
        title: 'Updated At',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        searchType: 'date',
        disableFutureDates: true,
        sorter: (a: VideoMaterialRecord, b: VideoMaterialRecord) => compareText(a.updatedAt, b.updatedAt),
        render: (value: string | null) => (value ? formatDate(value) : '-'),
    },
];

export const MATERIAL_TAB_ITEMS = [
    { key: 'study', label: 'Study Material' },
    { key: 'video', label: 'Video Material' },
];

export interface StudyMaterialProps {
    searchTerm?: string;
    appliedFilters?: Record<string, string>;
    courseId?: string;
}

export interface VideoMaterialProps {
    searchTerm?: string;
    appliedFilters?: Record<string, string>;
    courseId?: string;
}
