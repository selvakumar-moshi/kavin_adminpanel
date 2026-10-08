import type { ReactNode } from 'react';
import dayjs from 'dayjs';
import { PlusOutlined, PictureOutlined } from '@ant-design/icons';
import type { ITableColumn } from '../../components/Table/ITable';
import { formatDate } from '../../utils/dateUtils';
import StatusBadge from '../../components/Table/StatusBadge';
import { renderTruncatedCellWithTooltip } from '../../utils/tableCellRender';
import { compareText } from './quizTableUtils';
import { competitiveScopeColumns } from './competitive/columns';
import { schoolBookScopeColumns } from './schoolBook/columns';
import { previousYearScopeColumns } from './previousYear/columns';

export interface QuizQuestion {
    questionNumber?: number;
    questionText: string;
    questionImageUrl?: string;
    questionImageKey?: string;
    optionA: string;
    optionAImageUrl?: string;
    optionAImageKey?: string;
    optionB: string;
    optionBImageUrl?: string;
    optionBImageKey?: string;
    optionC: string;
    optionCImageUrl?: string;
    optionCImageKey?: string;
    optionD: string;
    optionDImageUrl?: string;
    optionDImageKey?: string;
    correctOption: string;
    mark: string;
}

// Client-side image state for a question and its options: `images` holds whatever should be
// previewed (an existing S3 URL loaded on edit, or a data URL for a freshly picked file), while
// `imageFiles` holds only newly picked files â€” the ones that actually need to be uploaded.
export interface QuizQuestionImages {
    question?: string;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
}

export interface QuizQuestionImageFiles {
    question?: File;
    optionA?: File;
    optionB?: File;
    optionC?: File;
    optionD?: File;
}

export const QUESTION_OPTION_KEYS: (keyof Pick<QuizQuestion, 'optionA' | 'optionB' | 'optionC' | 'optionD'>)[] = [
    'optionA',
    'optionB',
    'optionC',
    'optionD',
];

// Maps a client-side image slot to the multipart form field name the API expects for a new upload
export const IMAGE_FIELD_NAMES: Record<keyof QuizQuestionImages, string> = {
    question: 'questionImage',
    optionA: 'optionAImage',
    optionB: 'optionBImage',
    optionC: 'optionCImage',
    optionD: 'optionDImage',
};

// Maps a client-side image slot to the QuizQuestion field that holds its existing S3 URL (GET response)
export const IMAGE_URL_FIELD_NAMES: Record<keyof QuizQuestionImages, keyof QuizQuestion> = {
    question: 'questionImageUrl',
    optionA: 'optionAImageUrl',
    optionB: 'optionBImageUrl',
    optionC: 'optionCImageUrl',
    optionD: 'optionDImageUrl',
};

// Google Forms-style right-side rail shown on every question/section card. `onlyForQuestions`
// hides the action for section (Title and description) cards, where it doesn't apply.
export interface RailAction {
    key: 'addQuestion' | 'addSection' | 'addImage';
    tooltip: string;
    icon?: ReactNode;
    label?: string;
    onlyForQuestions?: boolean;
}

export const QUESTION_ITEM_RAIL_ACTIONS: RailAction[] = [
    { key: 'addQuestion', tooltip: 'Add Question', icon: <PlusOutlined /> },
    // { key: 'addSection', tooltip: 'Add Title and Description', label: 'Tt' },
    { key: 'addImage', tooltip: 'Add Question Image', icon: <PictureOutlined />, onlyForQuestions: true },
];

// Parses a multi-line paste (e.g. "(A) RNJ\n(B) SNK") into one option string per line.
// The label/marker (e.g. "(A)", "A.", "1.") is kept as part of the option text, not stripped.
export const parsePastedOptionsList = (text: string): string[] =>
    text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

// School Book Revision quiz options come from GET /Quiz/categories:
// Subject -> (optional) Category -> Standard -> (optional) Part. A level with an empty list is not shown.
export interface QuizStandardOption {
    standard: number;
    parts: string[];
}

export interface QuizCategoryOption {
    category: string;
    standards: QuizStandardOption[];
}

export interface QuizSubjectOption {
    subject: string;
    categories: QuizCategoryOption[];
    standards: QuizStandardOption[];
}

// "Quiz To View" value for which a batch applies (a Free quiz has no batch)
export const QUIZ_TO_VIEW_PAID = 'Paid';

export const QUIZ_COPY_TITLE_FIELD = [
    {
        name: 'title',
        label: 'Title',
        placeholder: 'Enter quiz title',
        required: true,
        type: 'text' as const,
    },
];

export interface QuizRecord {
    id: string;
    courseId: string;
    courseName: string;
    batchId?: string;
    batchTitle?: string;
    title: string;
    status: string;
    quizToView: string;
    quizType?: string;
    // Previous Year quizzes only
    folderId?: string | null;
    folderName?: string | null;
    subFolderId?: string | null;
    subFolderName?: string | null;
    // School Book quizzes only
    subject?: string | null;
    category?: string | null;
    standard?: number | string | null;
    part?: string | null;
    publishedAt: string | null;
    questions: QuizQuestion[];
    questionCount: string;
    createdAt: string;
    updatedAt: string | null;
    expiresAt: string | null;
    isExpired: boolean;
    timeLeftSeconds: number | null;
}

// Converts a dayjs value (or anything dayjs can parse) into an ISO string for the publish payload
export const dayjsToISOString = (value: unknown): string => {
    if (!value) return '';
    if (dayjs.isDayjs(value)) return value.toISOString();
    const parsed = dayjs(value as string);
    return parsed.isValid() ? parsed.toISOString() : '';
};

export const QUIZ_EXPIRES_AT_FIELD = [
    {
        name: 'expiresAt',
        label: 'Expires At',
        placeholder: 'Select expiry date & time',
        required: true,
        disablePastDates: true,
    },
];

export const CORRECT_OPTION_CHOICES = [
    { value: 'A', label: 'Option A' },
    { value: 'B', label: 'Option B' },
    { value: 'C', label: 'Option C' },
    { value: 'D', label: 'Option D' },
];

export const QUIZ_SEARCH_INPUT_FIELDS = [
    {
        name: 'search',
        label: '',
        placeholder: 'Search by title or course',
        type: 'text' as const,
        search: true,
    },
];

export const QUIZ_TITLE_FIELD = [
    {
        name: 'title',
        label: 'Quiz Title',
        placeholder: 'Enter quiz title',
        required: true,
        type: 'text' as const,
    },
];

export const emptyQuestion = (): QuizQuestion => ({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: '',
    mark: '',
});

// quizType / tab key of the School Book tab
export const QUIZ_TYPE_SCHOOL = 'school';

// quizType / tab key of the Previous Year tab
export const QUIZ_TYPE_PREVIOUS_YEAR = 'previousYear';

// Name of each quiz type as used in page titles ("Add Competitive Quiz", "Add School Quiz", ...)
export const QUIZ_TYPE_LABELS: Record<string, string> = {
    competitive: 'Competitive',
    school: 'School',
    previousYear: 'Previous Year',
};

// Title / breadcrumb text of the Add and Edit Quiz pages, e.g. "Add Previous Year Quiz"
export const getQuizPageTitle = (isEdit: boolean, quizType?: string) =>
    [isEdit ? 'Edit' : 'Add', QUIZ_TYPE_LABELS[quizType ?? ''], 'Quiz'].filter(Boolean).join(' ');

// The columns that differ per tab live next to that tab's code (competitive/, schoolBook/, previousYear/)
const getQuizScopeColumns = (quizType?: string): ITableColumn[] => {
    if (quizType === QUIZ_TYPE_PREVIOUS_YEAR) return previousYearScopeColumns;
    if (quizType === QUIZ_TYPE_SCHOOL) return schoolBookScopeColumns;
    return competitiveScopeColumns;
};

export const getQuizTableColumns = (quizType?: string): ITableColumn[] => [
    ...getQuizScopeColumns(quizType),
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        searchType: 'text',
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.title, b.title),
        render: (title: string) => renderTruncatedCellWithTooltip(title),
    },
    {
        title: 'Quest Count',
        dataIndex: 'questions',
        key: 'questionCount',
        searchType: 'text',
        render: (questions: QuizQuestion[]) => questions?.length || 0,
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.questionCount, b.questionCount),
    },
    {
        title: 'View',
        dataIndex: 'quizToView',
        key: 'quizToView',
        searchType: 'text',
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.quizToView, b.quizToView),
    },
    {
        title: 'Published At',
        dataIndex: 'publishedAt',
        key: 'publishedAt',
        searchType: 'date',
        disableFutureDates: true,
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.publishedAt, b.publishedAt),
        render: (value: string) => (value ? formatDate(value) : '-'),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        searchType: 'text',
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.status, b.status),
        render: (status: string) => <StatusBadge status={status} />,
    },
    {
        title: 'Expiry',
        dataIndex: 'isExpired',
        key: 'isExpired',
        searchType: 'text',
        sorter: (a: QuizRecord, b: QuizRecord) => Number(a.isExpired) - Number(b.isExpired),
        render: (isExpired: boolean) => <StatusBadge status={isExpired ? 'Expired' : 'Active'} />,
    },
];

export const Quiz_TAB_ITEMS = [
    { key: 'competitive', label: 'Competitive/Daily' },
    { key: 'school', label: 'School Book' },
    { key: 'previousYear', label: 'Previous Year' },
];
