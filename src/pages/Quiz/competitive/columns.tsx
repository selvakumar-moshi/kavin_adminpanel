import type { ITableColumn } from '../../../components/Table/ITable';
import { renderTruncatedCellWithTooltip } from '../../../utils/tableCellRender';
import { compareText } from '../quizTableUtils';
import type { QuizRecord } from '../Constant';

// Competitive / Daily tab: the quizzes belong to a course and batch
export const competitiveScopeColumns: ITableColumn[] = [
    {
        title: 'Course',
        dataIndex: 'courseName',
        key: 'courseName',
        searchType: 'text',
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.courseName, b.courseName),
        render: (courseName: string) => renderTruncatedCellWithTooltip(courseName),
    },
    {
        title: 'Batch',
        dataIndex: 'batchTitle',
        key: 'batchTitle',
        searchType: 'text',
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.batchTitle, b.batchTitle),
        render: (batchTitle: string) => renderTruncatedCellWithTooltip(batchTitle),
    },
];
