import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { ITableColumn } from '../../components/Table/ITable';
import { formatDate } from '../../utils/dateUtils';
import { renderTruncatedCellWithTooltip } from '../../utils/tableCellRender';
import { EDIT_USER_VALIDATION_RULES, type ValidationRule } from '../../utils/validationUtils';

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
    // When the user uploaded their payment (null until they have)
    paymentUploadedAt?: string | null;
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
    {
        title: 'Payment Date',
        dataIndex: 'paymentUploadedAt',
        key: 'paymentUploadedAt',
        searchType: 'date',
        disableFutureDates: true,
        sorter: (a: UserRecord, b: UserRecord) => compareText(a.paymentUploadedAt, b.paymentUploadedAt),
        render: (value: string | null) => (value ? formatDate(value) : '-'),
    },
];

// Create User form: the name / phone / district rules are the ones the Edit User form uses
export const CREATE_USER_PERSONAL_FIELDS = [
    { name: 'firstName', label: 'First Name', placeholder: 'Enter First name', required: true, type: 'text' as const, singleLine: true, autoComplete: 'off' },
    { name: 'lastName', label: 'Last Name', placeholder: 'Enter Last name', required: true, type: 'text' as const, singleLine: true, autoComplete: 'off' },
    { name: 'email', label: 'Email', placeholder: 'Enter Email', required: true, type: 'email' as const, autoComplete: 'off' },
    { name: 'phoneNumber', label: 'Phone Number', placeholder: 'Enter Phone Number', required: true, type: 'text' as const, singleLine: true, autoComplete: 'off' },
];

export const CREATE_USER_DISTRICT_FIELD = {
    name: 'district',
    label: 'District',
    placeholder: 'Select district',
    required: true,
};

// "new-password" tells the browser these are for a new account, so it never fills a saved login into them
export const CREATE_USER_PASSWORD_FIELDS = [
    { name: 'password', label: 'Password', placeholder: 'Enter Password', required: true, type: 'password' as const, autoComplete: 'new-password' },
    { name: 'confirmPassword', label: 'Confirm Password', placeholder: 'Re-enter Password', required: true, type: 'password' as const, autoComplete: 'new-password' },
];

export const MIN_PASSWORD_LENGTH = 6;

export const CREATE_USER_VALIDATION_RULES: Record<string, ValidationRule> = {
    firstName: EDIT_USER_VALIDATION_RULES.firstName,
    lastName: EDIT_USER_VALIDATION_RULES.lastName,
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        errorMessages: {
            required: 'Email is required',
            pattern: 'Enter a valid email address.',
        },
    },
    phoneNumber: EDIT_USER_VALIDATION_RULES.phoneNumber,
    district: EDIT_USER_VALIDATION_RULES.district,
    password: {
        required: true,
        errorMessages: { required: 'Password is required' },
    },
    confirmPassword: {
        required: true,
        errorMessages: { required: 'Confirm Password is required' },
    },
};
