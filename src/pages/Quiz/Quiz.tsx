import { useState } from 'react';
import QuizPreviewModal from './QuizPreviewModal';
import { Badge, TimePicker } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import TabsComponent from '../../components/Tabs/Tabs';
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
import { useQuizManagement } from './useQuizHooks';
import SchoolBookQuiz from './schoolBook/SchoolBookQuiz';
import { TIME_FORMAT } from '../../components/LiveClasses/Constant';
import { getQuizTableColumns, QUIZ_PUBLISH_DATE_FIELD, QUIZ_PUBLISH_TIME_FIELDS, QUIZ_COPY_TITLE_FIELD, QUIZ_TO_VIEW_PAID, QUIZ_TAB_FREE, QUIZ_TYPE_SCHOOL, isCourseLessQuizType, FREE_QUIZ_KINDS, usesFolderSelector, type QuizRecord, Quiz_TAB_ITEMS } from './Constant';
import add_Icon from '../../assets/add_Icon.svg';
import filter_Icon from '../../assets/filter_Icon.svg';
import NoDataFound from '../../components/NoDataFound/NoDataFound';

const Quiz = () => {
    const [showSchoolQuizForm, setShowSchoolQuizForm] = useState(false);
    const [previewQuiz, setPreviewQuiz] = useState<QuizRecord | null>(null);

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
        isCopyModalVisible,
        copyTitle,
        copyCourseId,
        copyCourseOptions,
        handleCopyCourseChange,
        copyBatchId,
        copyQuizToView,
        copyErrors,
        copyBatchOptions,
        copyBatchesLoading,
        openCopyModal,
        closeCopyModal,
        handleCopyTitleChange,
        handleCopyBatchChange,
        handleCopyConfirm,
        selectedQuiz,
        publishSchedule,
        publishScheduleErrors,
        handlePublishScheduleChange,
        activeTab,
        setActiveTab,
        listQuizType,
        freeKind,
        handleFreeKindChange,
        openCreateQuiz,
        handleSchoolQuizCreated,
        openEditQuiz,
        openDeleteModal,
        closeDeleteModal,
        handleDeleteConfirm,
        openPublishModal,
        closePublishModal,
        handlePublishConfirm,
        toastMessages,
        hideToast,
    } = useQuizManagement();

    const baseColumns = withSortAndSearch(getQuizTableColumns(listQuizType), {
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
            width: 190,
            render: (_: unknown, record: QuizRecord) => (
                <ActionIcons
                    actions={['view', 'publish', 'copy', 'edit', 'delete']}
                    disabledActions={record.status === 'Published' ? ['publish'] : []}
                    onActionClick={(action) => {
                        if (action.toLowerCase() === 'view') {
                            setPreviewQuiz(record);
                        } else if (action.toLowerCase() === 'edit') {
                            openEditQuiz(record);
                        } else if (action.toLowerCase() === 'publish') {
                            openPublishModal(record);
                        } else if (action.toLowerCase() === 'copy') {
                            openCopyModal(record);
                        } else if (action.toLowerCase() === 'delete') {
                            openDeleteModal(record);
                        }
                    }}
                    record={record}
                />
            ),
        },
    ];

    if (showSchoolQuizForm) {
        return (
            <SchoolBookQuiz
                onCancel={() => setShowSchoolQuizForm(false)}
                onCreated={() => {
                    setShowSchoolQuizForm(false);
                    handleSchoolQuizCreated();
                }}
            />
        );
    }

    if (loading && quizzesArray.length === 0) {
        return <Loader size="large" spinning={true} fullScreen={false} />;
    }

    return (
        <div className="quiz-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />
            <div className="report_main">
                <PageTitle title="Quiz" />
                <Button icon={<img src={add_Icon} alt="add-icon" />} variant="primary" className="page-title__button" onClick={listQuizType === QUIZ_TYPE_SCHOOL ? () => setShowSchoolQuizForm(true) : openCreateQuiz}>
                    Add Quiz
                </Button>
            </div>

            <div className='report_main'>
                <TabsComponent items={Quiz_TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} />
                <div className="dl_filter_main">
                    {/* The Free MCQ tab holds several kinds of quiz; this picks which one the table lists */}
                    {activeTab === QUIZ_TAB_FREE && (
                        <DropdownField
                            className="material-course-filter"
                            fields={[
                                {
                                    name: 'freeKind',
                                    label: '',
                                    placeholder: 'Select type',
                                    options: FREE_QUIZ_KINDS,
                                    allowClear: false,
                                    width: 180,
                                },
                            ]}
                            values={{ freeKind }}
                            onChange={(_, value) => handleFreeKindChange(value)}
                        />
                    )}
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

            <QuizPreviewModal quiz={previewQuiz} onClose={() => setPreviewQuiz(null)} />

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
                maxHeight="calc(100vh - 200px)"
            >
                <div className="popup-modal__content-content-text">
                    Are you sure you want to publish the quiz <b>"{selectedQuiz?.title}"</b>? Once published, students can attempt it.
                </div>
                <div style={{ padding: '0 8px' }}>
                    {/* Optional: the date and the start / end time of the quiz */}
                    <DateFieldsSection
                        fields={QUIZ_PUBLISH_DATE_FIELD}
                        values={publishSchedule}
                        onChange={handlePublishScheduleChange}
                        disabled={loading}
                    />
                    <div className="date-fields-section date-fields-section--row">
                        <div className="date-fields-section__form">
                            <div className="date-fields-section__fields-container">
                                {QUIZ_PUBLISH_TIME_FIELDS.map((field) => (
                                    <div key={field.name} className="date-fields-section__field">
                                        <label className="date-fields-section__label">{field.label}</label>
                                        <TimePicker
                                            data-testid={`publish-time-picker-${field.name}`}
                                            className="date-fields-section__date-picker"
                                            placeholder={field.placeholder}
                                            status={publishScheduleErrors[field.name] ? 'error' : undefined}
                                            suffixIcon={<ClockCircleOutlined />}
                                            format="hh:mm A"
                                            use12Hours
                                            needConfirm={false}
                                            value={publishSchedule[field.name] ? dayjs(`2000-01-01T${publishSchedule[field.name]}`) : null}
                                            onChange={(time) => handlePublishScheduleChange(field.name, time ? time.format(TIME_FORMAT) : '')}
                                            disabled={loading}
                                        />
                                        {publishScheduleErrors[field.name] && (
                                            <div className="form-fields-section__error-message">{publishScheduleErrors[field.name]}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </PopupModal>

            {/* Copy Quiz Modal */}
            <PopupModal
                open={isCopyModalVisible}
                onClose={closeCopyModal}
                onSubmit={handleCopyConfirm}
                title="Copy Quiz"
                subtitle=""
                primaryButtonText="Copy"
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={loading}
                primaryButtonDisabled={loading}
                contentHeight="auto"
                minHeight={250}
                maxHeight="calc(100vh - 200px)"
            >
                <div style={{ padding: '0 8px' }}>
                    <InputFields
                        fields={QUIZ_COPY_TITLE_FIELD}
                        values={{ title: copyTitle }}
                        errors={copyErrors.title ? { title: copyErrors.title } : {}}
                        onChange={handleCopyTitleChange}
                        disabled={loading}
                    />
                    {/* Course and batch: required for a Paid copy (Competitive tab), optional for a Free one (Daily).
                        Folder based quizzes (School / Previous Year / Syllabus Wise) have neither. */}
                    {!usesFolderSelector(listQuizType) && !isCourseLessQuizType(listQuizType) && (
                        <>
                            <DropdownField
                                fields={[
                                    {
                                        name: 'courseId',
                                        label: 'Course',
                                        placeholder: 'Select course',
                                        required: copyQuizToView === QUIZ_TO_VIEW_PAID,
                                        options: copyCourseOptions,
                                        disabled: loading,
                                    },
                                ]}
                                values={{ courseId: copyCourseId }}
                                errors={copyErrors.courseId ? { courseId: copyErrors.courseId } : {}}
                                onChange={(_, value) => handleCopyCourseChange(value)}
                            />
                            <DropdownField
                                fields={[
                                    {
                                        name: 'batchId',
                                        label: 'Batch',
                                        placeholder: 'Select batch',
                                        required: copyQuizToView === QUIZ_TO_VIEW_PAID,
                                        options: copyBatchOptions,
                                        loading: copyBatchesLoading,
                                        disabled: loading || !copyCourseId,
                                    },
                                ]}
                                values={{ batchId: copyBatchId }}
                                errors={copyErrors.batchId ? { batchId: copyErrors.batchId } : {}}
                                onChange={(_, value) => handleCopyBatchChange(value)}
                            />
                        </>
                    )}
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
