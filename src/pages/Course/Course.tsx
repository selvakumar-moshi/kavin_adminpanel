import { Tooltip } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import Button from '../../components/Button/Button';
import EmptyValue from '../../components/EmptyValue/EmptyValue';
import PopupModal from '../../components/PopupModal/PopupModal';
import InputFields from '../../components/InputFields/InputFields';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import { useCourseManagement } from './useCourseHooks';
import { COURSE_INPUT_FIELDS, type CourseRecord } from './Constant';
import add_Icon from '../../assets/add_Icon.svg';
import PageTitle from '../../components/PageTitle';
import NoDataFound from '../../components/NoDataFound/NoDataFound';

const Course = () => {
    const {
        coursesArray,
        loading,
        isCreateModalVisible,
        isEditModalVisible,
        isDeleteModalVisible,
        selectedCourse,
        formValues,
        formErrors,
        isSaving,
        hasFormChanges,
        openCreateModal,
        closeCreateModal,
        closeEditModal,
        closeDeleteModal,
        handleInputChange,
        handleCreateSubmit,
        handleEditSubmit,
        handleDeleteConfirm,
        handleCardClick,
        toastMessages,
        hideToast,
    } = useCourseManagement();

    if (loading && coursesArray.length === 0) {
        return <Loader size="large" spinning={true} fullScreen={false} />;
    }

    return (
        <div className="course-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />
            <div className="report_main">
                <PageTitle title="Courses" />
                <Button icon={<img src={add_Icon} alt="add-icon" />} variant="primary" className="page-title__button"  onClick={openCreateModal}>
                    Add Course
                </Button>
            </div>

            {coursesArray.length === 0 ? (
                <NoDataFound type="nodata" description="No courses available" />
            ) : (
                <div className="course-grid">
                    {coursesArray.map((course: CourseRecord) => {
                        return (
                            <div
                                key={course.id}
                                className="course-card"
                                onClick={() => handleCardClick(course.id)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        handleCardClick(course.id);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                data-testid={`course-card-${course.id}`}
                            >
                                <div className="course-card__title" title={course.courseName}>{course.courseName}</div>
                                <EmptyValue className="course-card__description" value={course.courseDescription} fallback="No description" />

                                <div className="course-card__footer">
                                    <div className="course-card__amount">₹{course.courseAmount.toLocaleString()}</div>
                                    {/* The whole card opens the course; the arrow is the visible "go" affordance */}
                                    <Tooltip title="Open course" placement="top">
                                        <span className="course-card__arrow" aria-hidden="true">
                                            <ArrowRightOutlined />
                                        </span>
                                    </Tooltip>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Course Modal */}
            <PopupModal
                open={isCreateModalVisible}
                onClose={closeCreateModal}
                onSubmit={handleCreateSubmit}
                title="Add Course"
                subtitle=""
                primaryButtonText="Create"
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={isSaving}
                primaryButtonDisabled={isSaving || !hasFormChanges}
                contentHeight="auto"
                minHeight={200}
            >
                <div style={{ padding: '0 8px' }}>
                    <InputFields
                        fields={COURSE_INPUT_FIELDS}
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={isSaving}
                    />
                </div>
            </PopupModal>

            {/* Edit Course Modal */}
            <PopupModal
                open={isEditModalVisible}
                onClose={closeEditModal}
                onSubmit={handleEditSubmit}
                title="Edit Course"
                subtitle=""
                primaryButtonText="Update"
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={isSaving}
                primaryButtonDisabled={isSaving || !hasFormChanges}
                contentHeight="auto"
                minHeight={200}
            >
                <div style={{ padding: '0 8px' }}>
                    <InputFields
                        fields={COURSE_INPUT_FIELDS}
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={isSaving}
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
                    Are you sure you want to delete the course <b>"{selectedCourse?.courseName}"</b>?
                </div>
            </PopupModal>
        </div>
    );
};

export default Course;
