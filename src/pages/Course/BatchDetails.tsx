import { Empty } from 'antd';
import Button from '../../components/Button/Button';
import TableWithPagination from '../../components/Table/TableWithPagination';
import { withSortAndSearch } from '../../components/Table/withSortAndSearch';
import PopupModal from '../../components/PopupModal/PopupModal';
import InputFields from '../../components/InputFields/InputFields';
import DateFieldsSection from '../../components/DateFieldsSection/DateFieldsSection';
import ActionIcons from '../../components/Table/ActionIcons';
import StatusBadge from '../../components/Table/StatusBadge';
import ToastMessages from '../../components/ToastMessages';
import PageTitle from '../../components/PageTitle';
import { useBatchManagement } from './useBatchHooks';
import { BATCH_TITLE_FIELD, BATCH_DATE_FIELDS, BATCH_LINK_FIELDS, getBatchTableColumns, type BatchRecord } from './Constant';
import { formatDate } from '../../utils/dateUtils';
import add_Icon from '../../assets/add_Icon.svg';
import NoDataFound from '../../components/NoDataFound/NoDataFound';

export interface BatchDetailsProps {
    courseId: string;
}

const BatchDetails: React.FC<BatchDetailsProps> = ({ courseId }) => {
    const {
        batchesArray,
        batchLoading,
        currentPage,
        pageSize,
        totalBatches,
        handlePaginationChange,
        searchField,
        searchValue,
        handleSearchChange,
        isBatchModalVisible,
        isBatchDeleteModalVisible,
        selectedBatch,
        batchFormValues,
        batchFormErrors,
        hasBatchFormChanges,
        openCreateBatchModal,
        openEditBatchModal,
        closeBatchModal,
        openDeleteBatchModal,
        closeDeleteBatchModal,
        handleBatchInputChange,
        handleBatchSubmit,
        handleDeleteBatchConfirm,
        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,
        toastMessages,
        hideToast,
    } = useBatchManagement(courseId);

    const baseColumns = getBatchTableColumns();

    const batchColumns = [
        ...withSortAndSearch(baseColumns, {
            sortState,
            onSort: handleSort,
            openSearchColumn,
            onToggleSearch: toggleSearchColumn,
            onCloseSearch: closeSearchColumn,
            getSearchValue: getColumnSearchValue,
            onSearch: handleColumnSearch,
        }).map((col) => {
            if (col.key === 'batchFrom' || col.key === 'batchTo') {
                return { ...col, render: (value: string) => formatDate(value) };
            }
            if (col.key === 'isExpired') {
                return {
                    ...col,
                    render: (isExpired: boolean) => (
                        <StatusBadge status={isExpired ? 'Expired' : 'Active'} />
                    ),
                };
            }
            return col;
        }),
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, batch: BatchRecord) => (
                <ActionIcons
                    actions={['edit', 'delete']}
                    disabledActions={[]}
                    onActionClick={(action) => {
                        if (action.toLowerCase() === 'edit') {
                            openEditBatchModal(batch);
                        } else if (action.toLowerCase() === 'delete') {
                            openDeleteBatchModal(batch);
                        }
                    }}
                    record={batch}
                />
            ),
        },
    ];

    return (
        <div className="batch-details-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />

            <div className="report_main">
                <PageTitle title="Batches" />
                <div className="dl_filter_main">
                    <InputFields
                        fields={searchField.map(field => ({ ...field }))}
                        onChange={handleSearchChange}
                        values={{ search: searchValue }}
                    />
                    <Button icon={<img src={add_Icon} alt="add-icon" />} variant="primary" className="page-title__button" onClick={openCreateBatchModal}>
                        Add Batch
                    </Button>
                </div>
            </div>

            <div className="batch-table-section">
                <TableWithPagination
                    columns={batchColumns}
                    dataSource={batchesArray.map(batch => ({ ...batch, key: batch.id }))}
                    loading={batchLoading}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    total={totalBatches}
                    onPageChange={handlePaginationChange}
                    locale={{
                        emptyText: <NoDataFound type="nodata" description="No batches found" style={{ height: 'calc(100vh - 408px)' }} />
                    }}
                />
            </div>

            {/* Batch Create/Edit Modal */}
            <PopupModal
                open={isBatchModalVisible}
                onClose={closeBatchModal}
                onSubmit={handleBatchSubmit}
                title={selectedBatch ? 'Edit Batch' : 'Add Batch'}
                subtitle=""
                primaryButtonText={selectedBatch ? 'Update' : 'Create'}
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={batchLoading}
                primaryButtonDisabled={batchLoading || !hasBatchFormChanges}
                contentHeight="auto"
                minHeight={250}
            >
                <div style={{ padding: '0 8px' }}>
                    <InputFields
                        fields={BATCH_TITLE_FIELD}
                        values={batchFormValues}
                        errors={batchFormErrors}
                        onChange={handleBatchInputChange}
                        disabled={batchLoading}
                    />
                    <DateFieldsSection
                        className="date-fields-section--row"
                        fields={BATCH_DATE_FIELDS}
                        values={batchFormValues}
                        errors={batchFormErrors}
                        onChange={handleBatchInputChange}
                        disabled={batchLoading}
                    />
                    <InputFields
                        fields={BATCH_LINK_FIELDS}
                        values={batchFormValues}
                        errors={batchFormErrors}
                        onChange={handleBatchInputChange}
                        disabled={batchLoading}
                    />
                </div>
            </PopupModal>

            {/* Batch Delete Confirmation Modal */}
            <PopupModal
                open={isBatchDeleteModalVisible}
                onClose={closeDeleteBatchModal}
                onSubmit={handleDeleteBatchConfirm}
                title="Confirm Deletion"
                subtitle=""
                primaryButtonText="Delete"
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={batchLoading}
                primaryButtonDisabled={batchLoading}
                contentHeight="auto"
                minHeight={100}
            >
                <div className="popup-modal__content-content-text">
                    Are you sure you want to delete the batch <b>"{selectedBatch?.title}"</b>?
                </div>
            </PopupModal>
        </div>
    );
};

export default BatchDetails;
