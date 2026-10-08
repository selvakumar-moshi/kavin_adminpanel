import type { ITableColumn } from '../../../components/Table/ITable';
import { renderTruncatedCellWithTooltip } from '../../../utils/tableCellRender';
import { compareText } from '../quizTableUtils';
import type { QuizRecord } from '../Constant';

// School Book tab: the quizzes belong to a subject, standard and part
export const schoolBookScopeColumns: ITableColumn[] = [
    {
        title: 'Subject',
        dataIndex: 'subject',
        key: 'subject',
        searchType: 'text',
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.subject, b.subject),
        render: (subject: string | null) => renderTruncatedCellWithTooltip(subject, { emptyDisplay: '-' }),
    },
    {
        title: 'Standard',
        dataIndex: 'standard',
        key: 'standard',
        searchType: 'text',
        sorter: (a: QuizRecord, b: QuizRecord) => Number(a.standard ?? 0) - Number(b.standard ?? 0),
        render: (standard: number | string | null) => renderTruncatedCellWithTooltip(standard, { emptyDisplay: '-' }),
    },
    {
        title: 'Part',
        dataIndex: 'part',
        key: 'part',
        searchType: 'text',
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.part, b.part),
        render: (part: string | null) => renderTruncatedCellWithTooltip(part, { emptyDisplay: '-' }),
    },
];
