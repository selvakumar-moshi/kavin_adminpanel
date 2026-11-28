import { Badge } from 'antd';
import Button from '../../components/Button/Button';
import TableWithPagination from '../../components/Table/TableWithPagination';
import { withSortAndSearch } from '../../components/Table/withSortAndSearch';
import ActionIcons from '../../components/Table/ActionIcons';
import PopupModal from '../../components/PopupModal/PopupModal';
import InputFields from '../../components/InputFields/InputFields';
import DropdownField from '../../components/DropdownField/DropdownField';
import DateFieldsSection from '../../components/DateFieldsSection/DateFieldsSection';
import FileUploadSection from '../../components/FileUploadSection/FileUploadSection';
import FileUploadDisplay from '../../components/FileUploadDisplay/FileUploadDisplay';
import Checkbox from '../../components/Checkbox/Checkbox';
import FilterModal from '../../components/FilterModal/FilterModal';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import PageTitle from '../../components/PageTitle';
import NoDataFound from '../../components/NoDataFound/NoDataFound';
import { useNotificationManagement } from './useNotification';
import { RichTextEditor } from '../../components/RichTextEditor';
import { getNotificationTableColumns, NOTIFICATION_TYPE_FIELD, NOTIFICATION_INPUT_FIELDS, NOTIFICATION_DESCRIPTION_FIELD, NOTIFICATION_LINK_FIELDS, NOTIFICATION_DATE_FIELD, NOTIFICATION_COURSE_TYPE_FIELD, NOTIFICATION_COURSE_FIELD, NOTIFICATION_BATCH_FIELD, NOTIFICATION_USER_FIELD, NOTIFICATION_PUSH_DATE_FIELD, NOTIFICATION_PUSH_SCHEDULED_FIELD, SEND_PUSH_LABEL, FLASH_NOTIFICATION_TYPE, JOB_NOTIFICATION_TYPE, type NotificationRecord } from './Constant';
import add_Icon from '../../assets/add_Icon.svg';
import filter_Icon from '../../assets/filter_Icon.svg';

interface NotificationProps {
    pageTitle?: string;
}

const Notification = ({ pageTitle = 'Notifications' }: NotificationProps) => {
    const {
        notificationsArray,
        loading,
        currentPage,
        pageSize,
        totalNotifications,
        handlePaginationChange,
        searchField,
        searchValue,
        activeFilterCount,
        isFilterDropdownOpen,
        filterField,
        appliedFilters,
        handleSearchChange,
        toggleFilterDropdown,
        closeFilterModal,
        handleApplyFilters,
        handleResetFilters,
        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,
        isModalVisible,
        isDeleteModalVisible,
        selectedNotification,
        formValues,
        formErrors,
        hasFormChanges,
        courses,
        batches,
        batchesLoading,
        users,
        usersLoading,
        fileList,
        replacingFile,
        setReplacingFile,
        handleFileChange,
        openCreateModal,
        openEditModal,
        closeModal,
        openDeleteModal,
        closeDeleteModal,
        pushTarget,
        isPushing,
        openPushModal,
        closePushModal,
        handlePushConfirm,
        handleInputChange,
        handleSubmit,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    } = useNotificationManagement();

    // Flash Notification: no start / end date. Job Notification: no course type, course, batch or users.
    const showDates = formValues.notificationType !== FLASH_NOTIFICATION_TYPE;
    const showTargeting = formValues.notificationType !== JOB_NOTIFICATION_TYPE;
    // A Flash Notification has no file
    const showFile = formValues.notificationType !== FLASH_NOTIFICATION_TYPE;

    const baseColumns = withSortAndSearch(getNotificationTableColumns(), {
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
            render: (_: unknown, record: NotificationRecord) => (
                <ActionIcons
                    actions={['send-push', 'cancel-push', 'edit', 'delete']}
                    onActionClick={(action) => {
                        if (action.toLowerCase() === 'edit') {
                            openEditModal(record);
                        } else if (action.toLowerCase() === 'delete') {
                            openDeleteModal(record);
                        } else if (action === 'send-push') {
                            openPushModal('send', record);
                        } else if (action === 'cancel-push') {
                            openPushModal('cancel', record);
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
                Add Notification
            </Button>
        </div>
    );

    if (loading && notificationsArray.length === 0) {
        return (
            <div className="notification-container">
                {header}
                <Loader size="large" spinning={true} fullScreen={false} />
            </div>
        );
    }

    return (
        <div className="notification-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />
            {header}

            <div className="report_main">
                <div className="dl_filter_main2" style={{ marginLeft: 'auto' }}>
                    <InputFields
                        fields={searchField.map(field => ({ ...field }))}
                        onChange={handleSearchChange}
                        values={{ search: searchValue }}
                    />
                    <Badge count={activeFilterCount} size="small" color="#dc1132">
                        <div className="dl_filter_main__filter_icon" onClick={toggleFilterDropdown} data-testid="filter-icon">
                            <img src={filter_Icon} alt="filter" />
                        </div>
                    </Badge>
                </div>
            </div>

            <TableWithPagination
                columns={columns}
                dataSource={notificationsArray.map((notification) => ({ ...notification, key: notification.id }))}
                loading={loading}
                currentPage={currentPage}
                pageSize={pageSize}
                total={totalNotifications}
                onPageChange={handlePaginationChange}
                locale={{
                    emptyText: <NoDataFound type="nodata" description="No notifications found" style={{ height: 'unset' }} />
                }}
            />

            {/* Create/Edit Notification Modal */}
            <PopupModal
                open={isModalVisible}
                onClose={closeModal}
                onSubmit={handleSubmit}
                title={selectedNotification ? 'Edit Notification' : 'Add Notification'}
                subtitle=""
                primaryButtonText={selectedNotification ? 'Update' : 'Create'}
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={loading}
                primaryButtonDisabled={loading || !hasFormChanges}
                contentHeight="auto"
                minHeight={430}
                // The form is taller than PopupModal's default 431px cap, so it scrolled; let it grow up to the window height instead
                maxHeight="calc(100vh - 200px)"
            >
                <div style={{ padding: '0 8px' }}>
                    {/* Type and Send Push share a row */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <DropdownField
                                fields={NOTIFICATION_TYPE_FIELD.map(field => ({ ...field, disabled: loading }))}
                                values={{ notificationType: formValues.notificationType || '' }}
                                errors={formErrors.notificationType ? { notificationType: formErrors.notificationType } : {}}
                                onChange={(_, value) => handleInputChange('notificationType', Array.isArray(value) ? value[0] || '' : value)}
                            />
                        </div>
                        {/* As tall as the dropdown, with the dropdown's bottom margin, so the box lines up with it */}
                        <div style={{ height: 40, marginBottom: 12, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            <Checkbox
                                label={SEND_PUSH_LABEL}
                                checked={Boolean(formValues.sendPush)}
                                onChange={(checked) => handleInputChange('sendPush', checked)}
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <InputFields
                        fields={NOTIFICATION_INPUT_FIELDS}
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    <RichTextEditor
                        {...NOTIFICATION_DESCRIPTION_FIELD}
                        value={formValues.description || ''}
                        error={formErrors.description}
                        onChange={(value) => handleInputChange('description', value)}
                        disabled={loading}
                    />
                    <InputFields
                        fields={NOTIFICATION_LINK_FIELDS}
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    {showDates && (
                        <DateFieldsSection
                            className="date-fields-section--row"
                            fields={NOTIFICATION_DATE_FIELD}
                            format="YYYY-MM-DD"
                            values={formValues}
                            errors={formErrors}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                    )}
                    {/* Targeting: all optional */}
                    {showTargeting && (
                        <>
                            <DropdownField
                                fields={[
                                    { ...NOTIFICATION_COURSE_TYPE_FIELD, disabled: loading },
                                    {
                                        ...NOTIFICATION_COURSE_FIELD,
                                        options: courses.map((course) => ({ value: course.id, label: course.courseName })),
                                        disabled: loading,
                                    },
                                    {
                                        ...NOTIFICATION_BATCH_FIELD,
                                        options: batches.map((batch) => ({ value: batch.id, label: batch.title })),
                                        loading: batchesLoading,
                                        disabled: loading || !formValues.courseId,
                                    },
                                ]}
                                values={{
                                    courseType: formValues.courseType || '',
                                    courseId: formValues.courseId || '',
                                    batchId: formValues.batchId || '',
                                }}
                                onChange={(name, value) => handleInputChange(name, Array.isArray(value) ? value[0] || '' : value)}
                            />
                            {/* Users are listed by name (the chosen batch's users); their ids are what is sent */}
                            <DropdownField
                                fields={[{
                                    ...NOTIFICATION_USER_FIELD,
                                    mode: 'multiple',
                                    options: users.map((user) => ({ value: user.id, label: user.name })),
                                    loading: usersLoading,
                                    disabled: loading,
                                }]}
                                values={{ userId: formValues.userIds || [] }}
                                onChange={(_, value) => handleInputChange('userIds', Array.isArray(value) ? value : value ? [value] : [])}
                            />
                        </>
                    )}
                    <DateFieldsSection
                        className="date-fields-section--row"
                        fields={NOTIFICATION_PUSH_DATE_FIELD}
                        showTime
                        format="YYYY-MM-DD HH:mm"
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    <DateFieldsSection
                        fields={NOTIFICATION_PUSH_SCHEDULED_FIELD}
                        showTime
                        format="YYYY-MM-DD HH:mm"
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    {/* Optional file; when editing, the saved one is shown until it is removed */}
                    {showFile && (selectedNotification?.attachmentName && fileList.length === 0 && !replacingFile ? (
                        <FileUploadDisplay
                            label="File"
                            fileName={selectedNotification.attachmentName}
                            onDelete={() => setReplacingFile(true)}
                        />
                    ) : (
                        <FileUploadSection
                            label="File"
                            fileList={fileList}
                            onFileChange={handleFileChange}
                        />
                    ))}
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
                primaryButtonLoading={loading}
                primaryButtonDisabled={loading}
                contentHeight="auto"
                minHeight={100}
            >
                <div className="popup-modal__content-content-text">
                    Are you sure you want to delete the notification <b>"{selectedNotification?.title}"</b>?
                </div>
            </PopupModal>

            {/* Confirm sending / cancelling a push */}
            <PopupModal
                open={Boolean(pushTarget)}
                onClose={closePushModal}
                onSubmit={handlePushConfirm}
                title={pushTarget?.type === 'cancel' ? 'Confirm Cancel Push' : 'Confirm Send Push'}
                subtitle=""
                primaryButtonText={pushTarget?.type === 'cancel' ? 'Cancel Push' : 'Send Push'}
                secondaryButtonText="Close"
                showFooter={true}
                primaryButtonLoading={isPushing}
                primaryButtonDisabled={isPushing}
                contentHeight="auto"
                minHeight={100}
            >
                <div className="popup-modal__content-content-text">
                    {pushTarget?.type === 'cancel' ? 'Are you sure you want to cancel the push of the notification ' : 'Are you sure you want to send the push of the notification '}
                    <b>"{pushTarget?.notification.title}"</b>?
                </div>
            </PopupModal>

            {/* Filter Modal */}
            <FilterModal
                visible={isFilterDropdownOpen}
                onClose={closeFilterModal}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                columns={filterField}
                initialValues={appliedFilters}
            />
        </div>
    );
};

export default Notification;
