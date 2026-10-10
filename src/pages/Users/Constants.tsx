import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { ITableColumn } from '../../components/Table/ITable';
import { formatDate } from '../../utils/dateUtils';
import { renderTruncatedCellWithTooltip } from '../../utils/tableCellRender';

export interface UserRecord {
    userId: string;
    firstName: string;
    lastName: string;
    applicationNo: string;
    phoneNumber: string;
    email: string;
    role: string;
    profileImage?: string | null;
    district?: string;
    createdAt?: string;
    updatedAt?: string;
}

const compareText = (a?: string | null, b?: string | null) =>
    (a || '').toLowerCase().localeCompare((b || '').toLowerCase());

export const SEARCH_INPUT_FIELDS = [
    {
        name: 'search',
        label: '',
        placeholder: 'Search by name, email or phone',
        type: 'text' as const,
        search: true,
    },
];

// Define columns without the actions render function
export const getUserTableColumns = (): ITableColumn[] => [
    {
        title: 'Profile',
        dataIndex: 'profileImage',
        key: 'profileImage',
        render: (profileImage: string | null) => (
            <Avatar src={profileImage || undefined} icon={!profileImage ? <UserOutlined /> : undefined} />
        ),
    },
    {
        title: 'Application No',
        dataIndex: 'applicationNo',
        key: 'applicationNo',
        searchType: 'text',
        sorter: (a: UserRecord, b: UserRecord) => compareText(a.applicationNo, b.applicationNo),
    },
    {
        title: 'User Name',
        dataIndex: 'firstName',
        key: 'userName',
        searchType: 'text',
        sorter: (a: UserRecord, b: UserRecord) =>
            compareText(`${a.firstName || ''} ${a.lastName || ''}`.trim(), `${b.firstName || ''} ${b.lastName || ''}`.trim()),
        render: (_: string, record: UserRecord) =>
            renderTruncatedCellWithTooltip(`${record.firstName || ''} ${record.lastName || ''}`.trim()),
    },
    {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        searchType: 'text',
        sorter: (a: UserRecord, b: UserRecord) => compareText(a.email, b.email),
        // E-mail addresses keep their own case
        render: (email: string) => renderTruncatedCellWithTooltip(email, { className: 'keep-case' }),
    },
    {
        title: 'District',
        dataIndex: 'district',
        key: 'district',
        searchType: 'text',
        disableFutureDates: true,
        sorter: (a: UserRecord, b: UserRecord) => compareText(a.district, b.district),
        render: (district: string) => renderTruncatedCellWithTooltip(district),
    },
    {
        title: 'Phone Number',
        dataIndex: 'phoneNumber',
        key: 'phoneNumber',
        searchType: 'text',
        sorter: (a: UserRecord, b: UserRecord) => compareText(a.phoneNumber, b.phoneNumber),
    },
    // {
    //     title: 'Role',
    //     dataIndex: 'role',
    //     key: 'role',
    //     searchType: 'text',
    //     sorter: (a: UserRecord, b: UserRecord) => compareText(a.role, b.role),
    // },
    {
        title: 'Created At',
        dataIndex: 'createdAt',
        key: 'createdAt',
        searchType: 'date',
        disableFutureDates: true,
        sorter: (a: UserRecord, b: UserRecord) => compareText(a.createdAt, b.createdAt),
        render: (text: string) => formatDate(text),
    },
];