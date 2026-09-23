import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import PopupModal from '../../components/PopupModal/PopupModal';
import InputFields from '../../components/InputFields/InputFields';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import Breadcrumbs from '../../components/Breadcrumb/Breadcrumbs';
import { useCourseDetailManagement } from './useCourseDetailHooks';
import { EDIT_COURSE_FIELDS } from './Constant';
import { formatDate } from '../../utils/dateUtils';
import BatchDetails from './BatchDetails';
import dot_Icon from '../../assets/dot_Icon.svg'
import person_add_Icon from '../../assets/person_add_Icon.svg'
import { usePageBodyClass } from '../../utils/pageBodyClass';
import InfoItem from '../../components/InfoItem/InfoItem';
import NoDataFound from '../../components/NoDataFound/NoDataFound';

/** Applied to document.body while this page is shown; user.scss/Breadcrumbs.scss/Sidebar.scss target this for the hero-banner chrome. */
const COURSE_DETAIL_PAGE_BODY_CLASS = 'user-detail-page';

const CourseDetail = () => {
    usePageBodyClass(COURSE_DETAIL_PAGE_BODY_CLASS);

    const {
        courseDetail,
        loading,
        isSaving,
        isEditModalVisible,
        isDeleteModalVisible,
        formValues,
        formErrors,
        hasFormChanges,
        openEditModal,
        closeEditModal,
        openDeleteModal,
        closeDeleteModal,
        handleInputChange,
        handleEditSubmit,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    } = useCourseDetailManagement();

    if (loading && !courseDetail) {
        return <Loader size="large" spinning={true} fullScreen={false} />;
    }

    if (!courseDetail) {
        return <NoDataFound type="nodata" description="Course Not found" />;
    }

    const menuItems: MenuProps['items'] = [
        {
            key: 'edit',
            label: 'Edit',
            onClick: openEditModal,
        },
        {
            key: 'delete',
            label: 'Delete',
            onClick: openDeleteModal,
        },
    ];

    return (
        <div className="course-detail-container">
            <div className="course-detail-container">
                <ToastMessages messages={toastMessages} onMessageClose={hideToast} />

                <Breadcrumbs
                    items={[
                        { label: 'Courses', path: '/course' },
                        { label: courseDetail.courseName, path: `/course/${courseDetail.id}` },
                    ]}
                />

                <div className='organization--user-details-view organization--user-profile-view'>
                    <div className='organization__user-details-main'></div>
                    <div className='organization__user-details-header'>
                        <div className='user-detail__info-main'>
                            <div className='organization__user-left-initial'>{courseDetail.courseName.substring(0, 2)}</div>
                            <div className='user-detail__info-item-value'>{courseDetail.courseName}</div>
                        </div>

                        <Dropdown menu={{ items: menuItems }} overlayClassName="organization__user-details-actions-dropdown" trigger={['click']} placement="bottomRight">
                            <button type="button" className="dot-icon">
                                <img src={dot_Icon} alt="dot-icon" />
                            </button>
                        </Dropdown>
                    </div>
                    <div className='organization__user-details-content'>
                        <div className='organization__user-details-content-items'>
                            <InfoItem icon={person_add_Icon} label="Course Name:" value={courseDetail.courseName} />
                            {/* <InfoItem icon={person_add_Icon} label="Description:" value={courseDetail.courseDescription} /> */}
                            <InfoItem icon={person_add_Icon} label="Course Amount:" value={`₹${courseDetail.courseAmount}`} />
                            <InfoItem icon={person_add_Icon} label="Created At:" value={courseDetail.createdAt ? formatDate(courseDetail.createdAt) : ''} />
                            <InfoItem icon={person_add_Icon} label="Updated At:" value={courseDetail.updatedAt ? formatDate(courseDetail.updatedAt) : ''} />
                        </div>
                    </div>
                </div>

                <BatchDetails courseId={courseDetail.id} />

                {/* Edit Modal */}
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
                            fields={EDIT_COURSE_FIELDS}
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
                        Are you sure you want to delete the course <b>"{courseDetail.courseName}"</b>?
                    </div>
                </PopupModal>
            </div>          
        </div>
    );
};

export default CourseDetail;
