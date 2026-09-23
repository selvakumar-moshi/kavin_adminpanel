import { useMemo } from 'react';
import { Badge } from 'antd';
import TableWithPagination from '../../components/Table/TableWithPagination';
import ActionIcons from '../../components/Table/ActionIcons';
import PopupModal from '../../components/PopupModal/PopupModal';
import InputFields from '../../components/InputFields/InputFields';
import FilterModal from '../../components/FilterModal/FilterModal';
import { withSortAndSearch } from '../../components/Table/withSortAndSearch';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import { useUserManagement } from './useUserHooks';
import { getUserTableColumns, type UserRecord } from './Constants';
import filter_Icon from '../../assets/filter_Icon.svg';
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
                onHeaderCell: () => ({ style: { width: 90, minWidth: 90, maxWidth: 90 } }),
                onCell: () => ({ style: { width: 90, minWidth: 90, maxWidth: 90 } }),
                render: (_: any, record: any) => (
                    <ActionIcons
                        actions={['edit', 'delete']}
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