import { Badge } from 'antd';
import Button from '../../components/Button/Button';
import TableWithPagination from '../../components/Table/TableWithPagination';
import { withSortAndSearch } from '../../components/Table/withSortAndSearch';
import ActionIcons from '../../components/Table/ActionIcons';
import PopupModal from '../../components/PopupModal/PopupModal';
import InputFields from '../../components/InputFields/InputFields';
import DateFieldsSection from '../../components/DateFieldsSection/DateFieldsSection';
import FilterModal from '../../components/FilterModal/FilterModal';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import PageTitle from '../../components/PageTitle';
import { useQuizManagement } from './useQuizHooks';
import { getQuizTableColumns, QUIZ_EXPIRES_AT_FIELD, type QuizRecord } from './Constant';
import add_Icon from '../../assets/add_Icon.svg';
import filter_Icon from '../../assets/filter_Icon.svg';
import NoDataFound from '../../components/NoDataFound/NoDataFound';

const Quiz = () => {
    const {
        quizzesArray,
        loading,
        currentPage,
        pageSize,
        totalQuizzes,
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
        isDeleteModalVisible,
        isPublishModalVisible,
        selectedQuiz,
        publishExpiresAt,
        publishExpiresAtError,
        openCreateQuiz,
        openEditQuiz,
        openDeleteModal,
        closeDeleteModal,
        handleDeleteConfirm,
        openPublishModal,
        closePublishModal,
        handlePublishExpiresAtChange,
        handlePublishConfirm,
        toastMessages,
        hideToast,
    } = useQuizManagement();

    const baseColumns = withSortAndSearch(getQuizTableColumns(), {
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
            render: (_: unknown, record: QuizRecord) => (
                <ActionIcons
                    actions={['publish', 'edit', 'delete']}
                    disabledActions={record.status === 'Published' ? ['publish'] : []}
                    onActionClick={(action) => {
                        if (action.toLowerCase() === 'edit') {
                            openEditQuiz(record);
                        } else if (action.toLowerCase() === 'publish') {
                            openPublishModal(record);
                        } else if (action.toLowerCase() === 'delete') {
                            openDeleteModal(record);
                        }
                    }}
                    record={record}
                />
            ),
        },
    ];

    if (loading && quizzesArray.length === 0) {
        return <Loader size="large" spinning={true} fullScreen={false} />;
    }

    return (
        <div className="quiz-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />
            <div className="report_main">
                <PageTitle title="Quiz" />
                <Button icon={<img src={add_Icon} alt="add-icon" />} variant="primary" className="page-title__button" onClick={openCreateQuiz}>
                    Add Quiz
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
                dataSource={quizzesArray.map((quiz) => ({ ...quiz, key: quiz.id }))}
                loading={loading}
                currentPage={currentPage}
                pageSize={pageSize}
                total={totalQuizzes}
                onPageChange={handlePaginationChange}
                locale={{
                    emptyText: <NoDataFound type="nodata" description="No quiz found" style={{ height: 'unset' }} />
                }}
            />

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
                    Are you sure you want to delete the quiz <b>"{selectedQuiz?.title}"</b>?
                </div>
            </PopupModal>

            {/* Publish Confirmation Modal */}
            <PopupModal
                open={isPublishModalVisible}
                onClose={closePublishModal}
                onSubmit={handlePublishConfirm}
                title="Confirm Publish"
                subtitle=""
                primaryButtonText="Publish"
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={loading}
                primaryButtonDisabled={loading}
                contentHeight="auto"
                minHeight={200}
            >
                <div className="popup-modal__content-content-text">
                    Are you sure you want to publish the quiz <b>"{selectedQuiz?.title}"</b>? Once published, students can attempt it.
                </div>
                <div style={{ padding: '0 8px' }}>
                    <DateFieldsSection
                        fields={QUIZ_EXPIRES_AT_FIELD}
                        showTime
                        format="YYYY-MM-DD HH:mm"
                        values={{ expiresAt: publishExpiresAt }}
                        errors={publishExpiresAtError ? { expiresAt: publishExpiresAtError } : {}}
                        onChange={handlePublishExpiresAtChange}
                        disabled={loading}
                    />
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

export default Quiz;
