import type { ITableColumn } from '../../../components/Table/ITable';
import { renderTruncatedCellWithTooltip } from '../../../utils/tableCellRender';
import { compareText } from '../quizTableUtils';
import type { QuizRecord } from '../Constant';

// Previous Year tab: the quizzes live in a folder and sub folder
export const previousYearScopeColumns: ITableColumn[] = [
    {
        title: 'Folder',
        dataIndex: 'folderName',
        key: 'folderName',
        searchType: 'text',
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.folderName, b.folderName),
        render: (folderName: string | null) => renderTruncatedCellWithTooltip(folderName, { emptyDisplay: '-' }),
    },
    {
        title: 'Sub Folder',
        dataIndex: 'subFolderName',
        key: 'subFolderName',
        searchType: 'text',
        sorter: (a: QuizRecord, b: QuizRecord) => compareText(a.subFolderName, b.subFolderName),
        render: (subFolderName: string | null) => renderTruncatedCellWithTooltip(subFolderName, { emptyDisplay: '-' }),
    },
];
