import type { ITableColumn } from '../../components/Table/ITable';
import { formatDate } from '../../utils/dateUtils';
import StatusBadge from '../../components/Table/StatusBadge';

export interface QuizQuestion {
    questionNumber?: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
}

export interface QuizRecord {
    id: string;
    courseId: string;
    courseName: string;
    title: string;
    status: string;
    publishedAt: string | null;
    questions: QuizQuestion[];
    questionCount: string;
    createdAt: string;
    updatedAt: string | null;
    expiresAt: string | null;
    isExpired: boolean;
    timeLeftSeconds: number | null;
}

export const CORRECT_OPTION_CHOICES = [
    { value: 'A', label: 'Option A' },
    { value: 'B', label: 'Option B' },
    { value: 'C', label: 'Option C' },
    { value: 'D', label: 'Option D' },
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
});

const compareText = (a?: string | null, b?: string | null) =>
    (a || '').toLowerCase().localeCompare((b || '').toLowerCase());

export const getQuizTableColumns = (): ITableColumn[] => [
    {
        title: 'Course',
        dataIndex: 'courseName',
        key: 'courseName',
        searchType: 'text',
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.courseName, b.courseName),
    },
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        searchType: 'text',
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.title, b.title),
    },
    {
        title: 'Questions',
        dataIndex: 'questions',
        key: 'questionCount',
        searchType: 'text',
        render: (questions: QuizQuestion[]) => questions?.length || 0,
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.questionCount, b.questionCount),
    },
    {
        title: 'Published At',
        dataIndex: 'publishedAt',
        key: 'publishedAt',
        searchType: 'date',
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.publishedAt, b.publishedAt),
        render: (value: string | null) => (value ? formatDate(value) : '-'),
    },
    {
        title: 'Created At',
        dataIndex: 'createdAt',
        key: 'createdAt',
        searchType: 'date',
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.createdAt, b.createdAt),
        render: (value: string) => formatDate(value),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        searchType: 'text',
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.status, b.status),
        render: (status: string) => <StatusBadge status={status} />,
    }
];
