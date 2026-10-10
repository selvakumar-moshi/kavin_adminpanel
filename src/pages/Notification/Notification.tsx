import { Badge } from 'antd';
import Button from '../../components/Button/Button';
import TableWithPagination from '../../components/Table/TableWithPagination';
import { withSortAndSearch } from '../../components/Table/withSortAndSearch';
import ActionIcons from '../../components/Table/ActionIcons';
import PopupModal from '../../components/PopupModal/PopupModal';
import InputFields from '../../components/InputFields/InputFields';
import DropdownField from '../../components/DropdownField/DropdownField';
import DateFieldsSection from '../../components/DateFieldsSection/DateFieldsSection';
import FilterModal from '../../components/FilterModal/FilterModal';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import PageTitle from '../../components/PageTitle';
import NoDataFound from '../../components/NoDataFound/NoDataFound';
import { useNotificationManagement } from './useNotification';
import { getNotificationTableColumns, NOTIFICATION_TYPE_FIELD, NOTIFICATION_INPUT_FIELDS, NOTIFICATION_DATE_FIELD, PUSH_NOTIFICATION_TYPE, type NotificationRecord } from './Constant';
import add_Icon from '../../assets/add_Icon.svg';
import filter_Icon from '../../assets/filter_Icon.svg';

const Notification = () => {
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

    // The date picker only asks for a time on Push Notifications
    const isPushNotification = formValues.notificationType === PUSH_NOTIFICATION_TYPE;

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

            <div className="dl_filter_main2">
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
                maxHeight={480}
            >
                <div style={{ padding: '0 8px' }}>
                    <DropdownField
                        fields={NOTIFICATION_TYPE_FIELD.map(field => ({ ...field, disabled: loading }))}
                        values={{ notificationType: formValues.notificationType || '' }}
                        errors={formErrors.notificationType ? { notificationType: formErrors.notificationType } : {}}
                        onChange={(_, value) => handleInputChange('notificationType', Array.isArray(value) ? value[0] || '' : value)}
                    />
                    <InputFields
                        fields={NOTIFICATION_INPUT_FIELDS}
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    <DateFieldsSection
                        fields={NOTIFICATION_DATE_FIELD}
                        // Only a Push Notification goes out at a set time; a Job Notification just has a date
                        showTime={isPushNotification}
                        format={isPushNotification ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'}
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
