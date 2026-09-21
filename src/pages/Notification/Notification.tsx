import Button from '../../components/Button/Button';
import TableWithPagination from '../../components/Table/TableWithPagination';
import { withSortAndSearch } from '../../components/Table/withSortAndSearch';
import ActionIcons from '../../components/Table/ActionIcons';
import PopupModal from '../../components/PopupModal/PopupModal';
import InputFields from '../../components/InputFields/InputFields';
import DateFieldsSection from '../../components/DateFieldsSection/DateFieldsSection';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import PageTitle from '../../components/PageTitle';
import NoDataFound from '../../components/NoDataFound/NoDataFound';
import { useNotificationManagement } from './useNotification';
import { getNotificationTableColumns, NOTIFICATION_INPUT_FIELDS, NOTIFICATION_DATE_FIELD, type NotificationRecord } from './Constant';
import add_Icon from '../../assets/add_Icon.svg';

const Notification = () => {
    const {
        notificationsArray,
        loading,
        currentPage,
        pageSize,
        totalNotifications,
        handlePaginationChange,
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
    } = useNotificationManagement();

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

    if (loading && notificationsArray.length === 0) {
        return <Loader size="large" spinning={true} fullScreen={false} />;
    }

    return (
        <div className="notification-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />
            <div className="report_main">
                <PageTitle title="Notifications" />
                <Button icon={<img src={add_Icon} alt="add-icon" />} variant="primary" className="page-title__button" onClick={openCreateModal}>
                    Add Notification
                </Button>
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
                minHeight={320}
            >
                <div style={{ padding: '0 8px' }}>
                    <InputFields
                        fields={NOTIFICATION_INPUT_FIELDS}
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    <DateFieldsSection
                        fields={NOTIFICATION_DATE_FIELD}
                        showTime
                        format="YYYY-MM-DD HH:mm"
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={loading}
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
                primaryButtonLoading={loading}
                primaryButtonDisabled={loading}
                contentHeight="auto"
                minHeight={100}
            >
                <div className="popup-modal__content-content-text">
                    Are you sure you want to delete the notification <b>"{selectedNotification?.title}"</b>?
                </div>
            </PopupModal>
        </div>
    );
};

export default Notification;
