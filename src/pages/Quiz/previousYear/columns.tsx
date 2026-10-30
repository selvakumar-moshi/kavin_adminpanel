import { Tooltip } from 'antd';
import type { ITableColumn } from '../../../components/Table/ITable';
import { renderTruncatedCellWithTooltip } from '../../../utils/tableCellRender';
import { compareText } from '../quizTableUtils';
import type { QuizRecord } from '../Constant';

// More than two levels shows as "first/.../last" with the whole path on hover; one or two levels show as they are
const renderSubFolderPath = (record: QuizRecord) => {
    const path = record.subFolderPath || record.subFolderName;
    if (!path) return '-';
    const parts = path.split('/').filter(Boolean);
    if (parts.length <= 2) return renderTruncatedCellWithTooltip(path, { emptyDisplay: '-' });
    return (
        <Tooltip title={parts.join('/')}>
            <span>{`${parts[0]}/.../${parts[parts.length - 1]}`}</span>
        </Tooltip>
    );
};

// Previous Year, Syllabus Wise and School Book tabs: the quizzes live in a folder and sub folder
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
        render: (_: string | null, record: QuizRecord) => renderSubFolderPath(record),
    },
];
