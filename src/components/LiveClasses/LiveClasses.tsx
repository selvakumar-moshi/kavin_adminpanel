import type { ReactNode } from 'react';
import { TimePicker } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Button from '../Button/Button';
import TableWithPagination from '../Table/TableWithPagination';
import { withSortAndSearch } from '../Table/withSortAndSearch';
import ActionIcons from '../Table/ActionIcons';
import PopupModal from '../PopupModal/PopupModal';
import InputFields from '../InputFields/InputFields';
import DropdownField from '../DropdownField/DropdownField';
import DateFieldsSection from '../DateFieldsSection/DateFieldsSection';
import { RichTextEditor } from '../RichTextEditor';
import Loader from '../Loader/Loader';
import ToastMessages from '../ToastMessages';
import PageTitle from '../PageTitle';
import NoDataFound from '../NoDataFound/NoDataFound';
import { useLiveClasses } from './useLiveClasses';
import {
    getLiveClassTableColumns,
    toDateValue,
    LIVE_CLASS_INPUT_FIELDS,
    LIVE_CLASS_DESCRIPTION_FIELD,
    LIVE_CLASS_LINK_FIELDS,
    LIVE_CLASS_DATE_FIELD,
    LIVE_CLASS_TIME_FIELDS,
    LIVE_CLASS_STATUS_FIELD,
    LIVE_CLASS_STATUS_OPTIONS,
    TIME_FORMAT,
    type LiveClassRecord,
} from './Constant';
import add_Icon from '../../assets/add_Icon.svg';

interface LiveClassesProps {
    pageTitle: string;
    /** The Notification page's tab switcher, shown on the search row */
    tabs: ReactNode;
}

const LiveClasses = ({ pageTitle, tabs }: LiveClassesProps) => {
    const {
        records,
        loading,
        isSaving,
        currentPage,
        pageSize,
        total,
        handlePaginationChange,
        searchField,
        searchValue,
        handleSearchChange,
        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,
        isModalVisible,
        isDeleteModalVisible,
        selectedRecord,
        formValues,
        formErrors,
        hasFormChanges,
        openCreateModal,
        openEditModal,
        closeModal,
        openDeleteModal,
        closeDeleteModal,
        handleInputChange,
        handleSubmit,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    } = useLiveClasses();

    const baseColumns = withSortAndSearch(getLiveClassTableColumns(), {
        sortState,
        onSort: handleSort,
        openSearchColumn,
        onToggleSearch: toggleSearchColumn,
        onCloseSearch: closeSearchColumn,
        getSearchValue: getColumnSearchValue,
        onSearch: handleColumnSearch,
    });

    const columns = [
        ...baseColumns,
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: LiveClassRecord) => (
                <ActionIcons
                    actions={['edit', 'delete']}
                    onActionClick={(action) => {
                        if (action.toLowerCase() === 'edit') {
                            openEditModal(record);
                        } else if (action.toLowerCase() === 'delete') {
                            openDeleteModal(record);
                        }
                    }}
                    record={record}
                />
            ),
        },
    ];

    const header = (
        <div className="report_main">
            <PageTitle title={pageTitle} />
            <Button icon={<img src={add_Icon} alt="add-icon" />} variant="primary" className="page-title__button" onClick={openCreateModal}>
                Add Live Class
            </Button>
        </div>
    );

    if (loading && records.length === 0) {
        return (
            <div className="notification-container">
                {header}
                <div className="report_main">{tabs}</div>
                <Loader size="large" spinning={true} fullScreen={false} />
            </div>
        );
    }

    return (
        <div className="notification-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />
            {header}

            <div className="report_main">
                {tabs}
                <div className="dl_filter_main2">
                    <InputFields
                        fields={searchField.map(field => ({ ...field }))}
                        onChange={handleSearchChange}
                        values={{ search: searchValue }}
                    />
                </div>
            </div>

            <TableWithPagination
                columns={columns}
                dataSource={records.map((record) => ({ ...record, key: record.id }))}
                loading={loading}
                currentPage={currentPage}
                pageSize={pageSize}
                total={total}
                onPageChange={handlePaginationChange}
                locale={{
                    emptyText: <NoDataFound type="nodata" description="No live classes found" style={{ height: 'unset' }} />
                }}
            />

            {/* Create/Edit Modal */}
            <PopupModal
                open={isModalVisible}
                onClose={closeModal}
                onSubmit={handleSubmit}
                title={selectedRecord ? 'Edit Live Classes' : 'Add Live Classes'}
                subtitle=""
                primaryButtonText={selectedRecord ? 'Update' : 'Create'}
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={isSaving}
                primaryButtonDisabled={isSaving || !hasFormChanges}
                contentHeight="auto"
                minHeight={430}
                maxHeight="calc(100vh - 200px)"
            >
                <div style={{ padding: '0 8px' }}>
                    <InputFields
                        fields={LIVE_CLASS_INPUT_FIELDS}
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={isSaving}
                    />
                    <RichTextEditor
                        {...LIVE_CLASS_DESCRIPTION_FIELD}
                        value={formValues.description || ''}
                        error={formErrors.description}
                        onChange={(value) => handleInputChange('description', value)}
                        disabled={isSaving}
                    />
                    <InputFields
                        fields={LIVE_CLASS_LINK_FIELDS}
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={isSaving}
                    />
                    <DateFieldsSection
                        fields={LIVE_CLASS_DATE_FIELD}
                        values={formValues}
                        errors={formErrors}
                        onChange={(name, value) => handleInputChange(name, toDateValue(value))}
                        disabled={isSaving}
                    />
                    {/* Start and end time side by side, laid out like the date fields */}
                    <div className="date-fields-section date-fields-section--row">
                        <div className="date-fields-section__form">
                            <div className="date-fields-section__fields-container">
                                {LIVE_CLASS_TIME_FIELDS.map((field) => (
                                    <div key={field.name} className="date-fields-section__field">
                                        <label className="date-fields-section__label">
                                            {field.label}
                                            <span className="date-fields-section__required">*</span>
                                        </label>
                                        <TimePicker
                                            data-testid={`time-picker-${field.name}`}
                                            className="date-fields-section__date-picker"
                                            placeholder={field.placeholder}
                                            status={formErrors[field.name] ? 'error' : undefined}
                                            suffixIcon={<ClockCircleOutlined />}
                                            format="hh:mm A"
                                            use12Hours
                                            needConfirm={false}
                                            value={formValues[field.name] ? dayjs(`2000-01-01T${formValues[field.name]}`) : null}
                                            onChange={(time) => handleInputChange(field.name, time ? time.format(TIME_FORMAT) : '')}
                                            disabled={isSaving}
                                        />
                                        {formErrors[field.name] && (
                                            <div className="form-fields-section__error-message">{formErrors[field.name]}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DropdownField
                        fields={[{
                            ...LIVE_CLASS_STATUS_FIELD,
                            options: LIVE_CLASS_STATUS_OPTIONS,
                            disabled: isSaving,
                        }]}
                        values={{ status: formValues.status || '' }}
                        errors={formErrors.status ? { status: formErrors.status } : {}}
                        onChange={(_, value) => handleInputChange('status', value)}
                    />
                </div>
            </PopupModal>

            {/* Delete Confirmation Modal */}
            <PopupModal
                open={isDeleteModalVisible}
                onClose={closeDeleteModal}
                onSubmit={handleDeleteConfirm}
                title="Confirm Deletion"
                subtitle=""
                primaryButtonText="Delete"
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={isSaving}
                primaryButtonDisabled={isSaving}
                contentHeight="auto"
                minHeight={100}
            >
                <div className="popup-modal__content-content-text">
                    Are you sure you want to delete the live class <b>"{selectedRecord?.title}"</b>?
                </div>
            </PopupModal>
        </div>
    );
};

export default LiveClasses;
