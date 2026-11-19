import { useMemo } from 'react';
import { Badge } from 'antd';
import TableWithPagination from '../../components/Table/TableWithPagination';
import ActionIcons from '../../components/Table/ActionIcons';
import PopupModal from '../../components/PopupModal/PopupModal';
import Button from '../../components/Button/Button';
import DropdownField from '../../components/DropdownField/DropdownField';
import ResetPasswordModals from './ResetPasswordModals';
import InputFields from '../../components/InputFields/InputFields';
import FilterModal from '../../components/FilterModal/FilterModal';
import { withSortAndSearch } from '../../components/Table/withSortAndSearch';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import { useUserManagement } from './useUserHooks';
import { getUserTableColumns, CREATE_USER_PERSONAL_FIELDS, CREATE_USER_DISTRICT_FIELD, CREATE_USER_PASSWORD_FIELDS, type UserRecord } from './Constants';
import { DISTRICT_OPTIONS } from '../UserDetail/Constants';
import filter_Icon from '../../assets/filter_Icon.svg';
import add_Icon from '../../assets/add_Icon.svg';
import download_Icon from '../../assets/pngDownload.svg';
import PageTitle from '../../components/PageTitle';
import NoDataFound from '../../components/NoDataFound/NoDataFound';

const Users = () => {
    const {
        currentPage,
        pageSize,
        isDeleteModalVisible,
        selectedRecord,
        usersArray,
        totalUsers,
        loading,
        getPaginatedData,
        handlePaginationChange,
        handleActionClick,
        handleDeleteModalClose,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
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
        isCreateModalVisible,
        createValues,
        createErrors,
        isCreating,
        openCreateModal,
        closeCreateModal,
        handleCreateChange,
        handleCreateSubmit,
        resetPassword,
        isDownloading,
        handleDownload,
        deviceResetUser,
        isResettingDevice,
        closeResetDevice,
        handleResetDeviceConfirm,
    } = useUserManagement();

    // Prepare columns with sort icons, per-column search, and action handlers
    const columns = useMemo(() => {
        const baseColumns = getUserTableColumns().map((col) => {
            if (col.key === 'applicationNo') {
                return {
                    ...col,
                    render: (value: string, record: UserRecord) => (
                        <span
                            className="users-table__application-no-link"
                            onClick={() => handleActionClick('edit', record)}
                        >
                            {value}
                        </span>
                    ),
                };
            }
            return col;
        });

        const withCustomHeaders = withSortAndSearch(baseColumns, {
            sortState,
            onSort: handleSort,
            openSearchColumn,
            onToggleSearch: toggleSearchColumn,
            onCloseSearch: closeSearchColumn,
            getSearchValue: getColumnSearchValue,
            onSearch: handleColumnSearch,
        });

        return [
            ...withCustomHeaders,
            {
                title: 'Actions',
                key: 'actions',
                onHeaderCell: () => ({ style: { width: 160, minWidth: 160, maxWidth: 160 } }),
                onCell: () => ({ style: { width: 120, minWidth: 120, maxWidth: 120 } }),
                render: (_: any, record: any) => (
                    <ActionIcons
                        actions={['edit', 'reset-password', 'reset-device', 'delete']}
                        disabledActions={[]}
                        onActionClick={(action, record) => handleActionClick(action, record)}
                        record={record}
                    />
                ),
            },
        ];
    }, [handleActionClick, sortState, openSearchColumn, appliedFilters]);

    if (loading && usersArray.length === 0) {
        return <Loader size="large" spinning={true} fullScreen={false} />;
    }

    return (
        <div className="users-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />
            <div className="report_main">
                <PageTitle title="Users" />
                <div className="dl_filter_main">
                  <Button icon={<img src={add_Icon} alt="add-icon" />} variant="primary" className="page-title__button" onClick={openCreateModal}>
                      Create User
                  </Button>
                </div>
            </div>

            <div className="dl_filter_main">
                <div
                    className={`quiz-rank-list__download${isDownloading ? ' quiz-rank-list__download--disabled' : ''}`}
                    onClick={isDownloading ? undefined : handleDownload}
                    aria-disabled={isDownloading}
                    data-testid="download-users"
                >
                    <img src={download_Icon} alt="Download" />
                    {isDownloading ? 'Downloading...' : 'Download'}
                </div>
                <InputFields
                      fields={searchField.map(field => ({
                        ...field,
                        }))}
                        onChange={handleSearchChange}
                      values={{ search: searchValue }}
                  />
                  <Badge count={activeFilterCount} size="small" color="#dc1132">
                    <div className="dl_filter_main__filter_icon" onClick={toggleFilterDropdown}  data-testid="filter-icon">
                        <img src={filter_Icon} alt="filter" />
                    </div>
                  </Badge>
            </div>
            

            <TableWithPagination
                columns={columns}
                dataSource={getPaginatedData()}
                loading={loading}
                bordered={false}
                currentPage={currentPage}
                pageSize={pageSize}
                total={totalUsers}
                onPageChange={handlePaginationChange}
                size="middle"
                showHeader={true}
                locale={{
                    emptyText: <NoDataFound type="nodata" description="No users found" style={{ height: 'unset' }} />
                }}
            />

            {/* Create User Modal */}
            <PopupModal
                open={isCreateModalVisible}
                onClose={closeCreateModal}
                onSubmit={handleCreateSubmit}
                title="Create User"
                subtitle=""
                primaryButtonText="Create"
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={isCreating}
                primaryButtonDisabled={isCreating}
                contentHeight="auto"
                minHeight={430}
                maxHeight="calc(100vh - 200px)"
            >
                <div style={{ padding: '0 8px' }}>
                    <InputFields
                        fields={CREATE_USER_PERSONAL_FIELDS}
                        values={createValues}
                        errors={createErrors}
                        onChange={handleCreateChange}
                        disabled={isCreating}
                    />
                    <DropdownField
                        fields={[{ ...CREATE_USER_DISTRICT_FIELD, options: DISTRICT_OPTIONS, disabled: isCreating }]}
                        values={{ district: createValues.district || '' }}
                        errors={createErrors.district ? { district: createErrors.district } : {}}
                        onChange={(_, value) => handleCreateChange('district', value)}
                    />
                    <InputFields
                        fields={CREATE_USER_PASSWORD_FIELDS}
                        values={createValues}
                        errors={createErrors}
                        onChange={handleCreateChange}
                        disabled={isCreating}
                    />
                </div>
            </PopupModal>

            <ResetPasswordModals reset={resetPassword} />

            {/* Reset Device Confirmation Modal */}
            <PopupModal
                open={Boolean(deviceResetUser)}
                onClose={closeResetDevice}
                onSubmit={handleResetDeviceConfirm}
                title="Reset Device"
                subtitle=""
                primaryButtonText="Reset"
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={isResettingDevice}
                primaryButtonDisabled={isResettingDevice}
                contentHeight="auto"
                minHeight={100}
            >
                <div className="popup-modal__content-content-text">
                    Are you sure you want to reset the device of <b>"{deviceResetUser?.firstName} {deviceResetUser?.lastName}"</b>?
                </div>
            </PopupModal>

            {/* Delete Confirmation Modal */}
            <PopupModal
                open={isDeleteModalVisible}
                onClose={handleDeleteModalClose}
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
                    Are you sure you want to delete the user <b>"{selectedRecord?.firstName} {selectedRecord?.lastName}"</b>?
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

export default Users;