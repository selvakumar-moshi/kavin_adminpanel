import { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'antd';
import { FilePdfOutlined, EditOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import TabsComponent from '../../components/Tabs/Tabs';
import PopupModal from '../../components/PopupModal/PopupModal';
import InputFields from '../../components/InputFields/InputFields';
import DropdownField from '../../components/DropdownField/DropdownField';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import Breadcrumbs from '../../components/Breadcrumb/Breadcrumbs';
import StatusBadge from '../../components/Table/StatusBadge';
import InfoItem from '../../components/InfoItem/InfoItem';
import { useUserDetailManagement } from './useUserDetailHooks';
import { usePageBodyClass } from '../../utils/pageBodyClass';
import { EDIT_USER_FIELDS, PENDING_ENROLLMENT_STATUS_OPTIONS, UserDetailtabs, DISTRICT_OPTIONS } from './Constants';
import { formatDate } from '../../utils/dateUtils';
import dot_Icon from '../../assets/dot_Icon.svg';
import person_add_Icon from '../../assets/person_add_Icon.svg'
import calendar_Icon from '../../assets/calendar_Icon.svg';
import email_Icon from '../../assets/email_Icon.svg';
import arrow_drop_down_Icon from "../../assets/arrow_drop_down_Icon.svg";
import arrow_drop_right_Icon from "../../assets/arrow_drop_right_Icon.svg";
import manage_acc_Icon from "../../assets/manage_acc_Icon.svg";
import NoDataFound from '../../components/NoDataFound/NoDataFound';

/** Applied to document.body while this page is shown; user.scss targets this. */
const USER_DETAIL_PAGE_BODY_CLASS = 'user-detail-page';

const UserDetail = () => {
    usePageBodyClass(USER_DETAIL_PAGE_BODY_CLASS);

    const {
        userDetail,
        coursesArray,
        selectedCourses,
        batchesByCourse,
        batchesLoadingByCourse,
        loading,
        isEditModalVisible,
        formValues,
        formErrors,
        isUpdating,
        hasFormChanges,
        openEditModal,
        closeEditModal,
        handleInputChange,
        handleCourseSelectionChange,
        handleCourseBatchChange,
        handleEditSubmit,
        updatingEnrollmentId,
        handleStatusChange,
        toastMessages,
        hideToast,
    } = useUserDetailManagement();

    const [expandedCourseIds, setExpandedCourseIds] = useState<Set<string>>(new Set());
    const [activeMaterialTabs, setActiveMaterialTabs] = useState<Record<string, string>>({});
    const [courseToDrop, setCourseToDrop] = useState<{ enrollmentId: string; courseName: string } | null>(null);

    // Auto-close the drop confirmation once its status update finishes (success or error is
    // already surfaced by the hook's own toast — we just don't want the modal hanging open).
    const prevUpdatingEnrollmentIdRef = useRef<string | null>(null);
    useEffect(() => {
        const finished = prevUpdatingEnrollmentIdRef.current;
        if (finished && !updatingEnrollmentId) {
            setCourseToDrop((current) => (current?.enrollmentId === finished ? null : current));
        }
        prevUpdatingEnrollmentIdRef.current = updatingEnrollmentId;
    }, [updatingEnrollmentId]);

    const openDropConfirm = (course: { enrollmentId: string; courseName: string }) => {
        setCourseToDrop({ enrollmentId: course.enrollmentId, courseName: course.courseName });
    };

    const closeDropConfirm = () => {
        setCourseToDrop(null);
    };

    const handleDropConfirm = () => {
        if (!courseToDrop) return;
        handleStatusChange(courseToDrop.enrollmentId, 'Dropped');
    };

    const getActiveMaterialTab = (enrollmentId: string) => activeMaterialTabs[enrollmentId] || 'purchased';

    const setActiveMaterialTab = (enrollmentId: string, key: string) => {
        setActiveMaterialTabs(prev => ({ ...prev, [enrollmentId]: key }));
    };

    const toggleCourseExpand = (enrollmentId: string) => {
        setExpandedCourseIds(prev => {
            const next = new Set(prev);
            if (next.has(enrollmentId)) {
                next.delete(enrollmentId);
            } else {
                next.add(enrollmentId);
            }
            return next;
        });
    };

    // Shown pre-checked in the "Add Courses" multiselect below so already-purchased courses are
    // visible when editing — but never fed back into selectedCourses/the update payload, since
    // that would resend existing enrollments and we have no confirmed contract for what the
    // backend does with a courseId it already has (risk of duplicating/altering an enrollment).
    const purchasedCourseIds = new Set((userDetail?.courses || []).map(c => c.courseId));
    const availableCourseOptions = coursesArray.map(course => ({
        value: course.id,
        label: course.courseName,
    }));

    if (loading && !userDetail) {
        return <Loader size="large" spinning={true} fullScreen={false} />;
    }

    if (!userDetail) {
        return <NoDataFound type="nodata" /> ;
    }

    const menuItems: MenuProps['items'] = [
        {
            key: 'edit',
            label: 'Edit',
            onClick: openEditModal,
        },
    ];

    return (
        <div className="user-detail-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />

            <Breadcrumbs
                items={[
                    { label: 'Users', path: '/users' },
                    { label: `${userDetail.firstName} ${userDetail.lastName}`, path: `/user/${userDetail.userId}` },
                ]}
            />
            <div className='organization--user-details-view organization--user-profile-view'>
                <div className='organization__user-details-main'></div>
                <div className='organization__user-details-header'>
                    <div className='user-detail__info-main'>
                        <div className='organization__user-left-initial'>{`${userDetail.firstName.charAt(0)}${userDetail.lastName.charAt(0)}`}</div>
                        <div className='user-detail__info-item-value'>{userDetail.applicationNo}</div>
                        {/* <div className='user-detail__info-item-value'>-</div>
                        <div className='user-detail__info-item-value'>{userDetail.firstName} {userDetail.lastName}</div> */}
                    </div>
                    
                    <Dropdown menu={{ items: menuItems }} overlayClassName="organization__user-details-actions-dropdown" trigger={['click']} placement="bottomRight">
                        <button type="button" className="dot-icon">
                            <img src={dot_Icon} alt="dot-icon" />
                        </button>
                    </Dropdown>
                </div>
                <div className='organization__user-details-content'>
                    <div className='organization__user-details-content-items'>
                    <InfoItem icon={person_add_Icon} label="Username:" value={`${userDetail.firstName} ${userDetail.lastName}`} />
                        <InfoItem icon={email_Icon} label="Email:" value={userDetail.email} />
                        <InfoItem icon={person_add_Icon} label="Phone:" value={userDetail.phoneNumber} />
                        <InfoItem icon={person_add_Icon} label="District:" value={userDetail.district} />
                        <InfoItem icon={calendar_Icon} label="Joined Date:" value={userDetail.createdAt ? formatDate(userDetail.createdAt) : ''} />
                    </div>
                </div>

                <h2 className="user-course-title">Course Details</h2>

                <div className="user-detail-course-list">
                {(!userDetail.courses || userDetail.courses.length === 0) ? (
                    <NoDataFound type="nodata" description="No courses enrolled" />
                ) : (
                    <>
                        {userDetail.courses.map((course) => {
                            const isExpanded = expandedCourseIds.has(course.enrollmentId);
                            return (
                                <div className='user-course__module-div' key={course.enrollmentId}>
                                    <div className='user-course__module-header' onClick={() => toggleCourseExpand(course.enrollmentId)}>
                                        <div className={`user-course__module-section${isExpanded ? ' user-course__module-section--expanded' : ''}`}>
                                            <span className="user-course__module-arrow">
                                            {isExpanded ? (
                                                <img src={arrow_drop_down_Icon} alt="arrow-down" />
                                            ) : (
                                                <img src={arrow_drop_right_Icon} alt="arrow-right" />
                                            )}
                                            </span>
                                            <img src={manage_acc_Icon} alt="manage-acc-icon" />
                                            <span className="user-course__module-title">{course.courseName}</span>
                                            <div className="user-course__payment-status" style={{ marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}>
                                                <span className="user-detail__info-item-label2">Payment Status:</span>
                                                {course.enrollmentStatus === 'Pending' ? (
                                                    <DropdownField
                                                        className="user-course__status-dropdown"
                                                        fields={[
                                                            {
                                                                name: 'enrollmentStatus',
                                                                label: '',
                                                                placeholder: 'Select status',
                                                                options: PENDING_ENROLLMENT_STATUS_OPTIONS,
                                                                loading: updatingEnrollmentId === course.enrollmentId,
                                                                disabled: updatingEnrollmentId === course.enrollmentId,
                                                                allowClear: false,
                                                            },
                                                        ]}
                                                        values={{ enrollmentStatus: course.enrollmentStatus }}
                                                        onChange={(_, value) => handleStatusChange(course.enrollmentId, Array.isArray(value) ? value[0] || '' : value)}
                                                    />
                                                ) : (
                                                    <span className="user-course__status-with-edit">
                                                        <StatusBadge status={course.enrollmentStatus} />
                                                        {course.enrollmentStatus !== 'Dropped' && (
                                                            <button
                                                                type="button"
                                                                className="user-course__status-edit-btn"
                                                                onClick={() => openDropConfirm(course)}
                                                                aria-label={`Change status for ${course.courseName}`}
                                                            >
                                                                <EditOutlined />
                                                            </button>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="user-detail-course">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <TabsComponent
                                                        items={UserDetailtabs}
                                                        activeKey={getActiveMaterialTab(course.enrollmentId)}
                                                        onChange={(key) => setActiveMaterialTab(course.enrollmentId, key)}
                                                    />

                                                    {getActiveMaterialTab(course.enrollmentId) === 'purchased' ? (
                                                        <ul className="user-detail-course__amounts">
                                                            <li className='user-detail__info-item-label2'>Course Amount:
                                                                <span className='user-detail__info-item-value2'> ₹{course.courseAmount.toLocaleString()}</span>
                                                            </li>

                                                            <li className='user-detail__info-item-label2'>Total Amount:
                                                                <span className='user-detail__info-item-value2'> ₹{course.totalAmount.toLocaleString()}</span>
                                                            </li>
                                                            {course.verifiedAt && (
                                                                <li className='user-detail__info-item-label2'>Verified At:
                                                                    <span className='user-detail__info-item-value2'> {formatDate(course.verifiedAt)}</span>
                                                                </li>
                                                            )}
                                                        </ul>
                                                    ) : getActiveMaterialTab(course.enrollmentId) === 'study' ? (
                                                        course.studyMaterials && course.studyMaterials.length > 0 ? (
                                                            <ul className="user-detail-course__materials">
                                                                {course.studyMaterials.map((material) => (
                                                                    <div key={material.id} className="user-detail-course__materials-main">
                                                                        <FilePdfOutlined /> {' '}
                                                                        <a href={material.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                                            {material.title}
                                                                        </a>
                                                                        {material.description && (
                                                                            <div  className='user-detail-course__materials-desc'> — {material.description}</div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <NoDataFound type="nodata" description="No study material" />
                                                        )
                                                    ) : getActiveMaterialTab(course.enrollmentId) === 'video' ? (
                                                        course.videoMaterials && course.videoMaterials.length > 0 ? (
                                                            <ul className="user-detail-course__materials">
                                                                {course.videoMaterials.map((video) => (
                                                                    <li key={video.id}>
                                                                        <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                                                                            {video.title}
                                                                        </a>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <NoDataFound type="nodata" description="No video material" />
                                                        )
                                                    ) : getActiveMaterialTab(course.enrollmentId) === 'Batch' ? (
                                                        course.batchTitle ? (
                                                            <ul className="user-detail-course__amounts">
                                                                <li className='user-detail__info-item-label2'>Batch:
                                                                    <span className='user-detail__info-item-value2'> {course.batchTitle}</span>
                                                                </li>
                                                            </ul>
                                                        ) : (
                                                            <NoDataFound type="nodata" description="No batch assigned" />
                                                        )
                                                    ) : (
                                                        course.paymentScreenshot ? (
                                                            <div className="user-detail-course__payment-screenshot">
                                                                <a href={course.paymentScreenshot} target="_blank" rel="noopener noreferrer">
                                                                    <img src={course.paymentScreenshot} alt="Payment Screenshot" />
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <NoDataFound type="nodata" description="No payment screenshot" />
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
                </div>

                {/* Edit Modal */}
                <PopupModal
                    open={isEditModalVisible}
                    onClose={closeEditModal}
                    onSubmit={handleEditSubmit}
                    title="Edit User"
                    subtitle=""
                    primaryButtonText="Update"
                    secondaryButtonText="Cancel"
                    showFooter={true}
                    primaryButtonLoading={isUpdating}
                    primaryButtonDisabled={isUpdating || !hasFormChanges}
                    minHeight={500}
                >
                    <div style={{ padding: '0 8px' }}>
                        <InputFields
                            fields={EDIT_USER_FIELDS}
                            values={formValues}
                            errors={formErrors}
                            onChange={handleInputChange}
                            disabled={isUpdating}
                        />
                        <DropdownField
                            fields={[
                                {
                                    name: 'district',
                                    label: 'District',
                                    placeholder: 'Select district',
                                    required: true,
                                    options: DISTRICT_OPTIONS,
                                    disabled: isUpdating,
                                },
                            ]}
                            values={{ district: formValues.district || '' }}
                            errors={formErrors.district ? { district: formErrors.district } : {}}
                            onChange={(_, value) => handleInputChange('district', Array.isArray(value) ? value[0] || '' : value)}
                        />
                        <DropdownField
                            fields={[
                                {
                                    name: 'courseIds',
                                    label: 'Add Courses',
                                    placeholder: 'Select course',
                                    mode: 'multiple',
                                    options: availableCourseOptions,
                                    noOptionsContent: 'No courses available',
                                },
                            ]}
                            values={{ courseIds: Array.from(new Set([...purchasedCourseIds, ...selectedCourses.map(c => c.courseId)])) }}
                            onChange={(_, value) => {
                                const ids = Array.isArray(value) ? value : [value];
                                handleCourseSelectionChange(ids.filter((courseId) => !purchasedCourseIds.has(courseId)));
                            }}
                        />
                        {(userDetail.courses || []).length === 0 && selectedCourses.length === 0 ? (
                            <DropdownField
                                fields={[
                                    {
                                        name: 'batch-placeholder',
                                        label: 'Batch',
                                        placeholder: 'Select a course first',
                                        options: [],
                                        disabled: true,
                                    },
                                ]}
                                values={{ 'batch-placeholder': '' }}
                            />
                        ) : (
                            <>
                                {/* Already-purchased enrollments' batches — reference only, not editable here */}
                                {(userDetail.courses || []).some((c) => c.batchTitle) && (
                                    <DropdownField
                                        fields={[
                                            {
                                                name: 'purchasedBatches',
                                                label: 'Batch',
                                                placeholder: 'No batch assigned',
                                                mode: 'multiple',
                                                options: (userDetail.courses || [])
                                                    .filter((c) => c.batchTitle)
                                                    .map((c) => ({
                                                        value: c.enrollmentId,
                                                        label: `${c.batchTitle} (${c.courseName} - ${c.enrollmentStatus})`,
                                                    })),
                                                disabled: true,
                                            },
                                        ]}
                                        values={{
                                            purchasedBatches: (userDetail.courses || [])
                                                .filter((c) => c.batchTitle)
                                                .map((c) => c.enrollmentId),
                                        }}
                                    />
                                )}
                                {selectedCourses.map((entry) => {
                                    const course = coursesArray.find(c => c.id === entry.courseId);
                                    const batchOptions = (batchesByCourse[entry.courseId] || []).map(batch => ({ value: batch.id, label: batch.title }));
                                    return (
                                        <DropdownField
                                            key={entry.courseId}
                                            fields={[
                                                {
                                                    name: `batch-${entry.courseId}`,
                                                    label: `Batch for ${course?.courseName || entry.courseId}`,
                                                    placeholder: 'Select batch',
                                                    options: batchOptions,
                                                    loading: batchesLoadingByCourse[entry.courseId],
                                                    required: true,
                                                },
                                            ]}
                                            values={{ [`batch-${entry.courseId}`]: entry.batchId }}
                                            onChange={(_, value) => handleCourseBatchChange(entry.courseId, Array.isArray(value) ? value[0] || '' : value)}
                                        />
                                    );
                                })}
                            </>
                        )}
                        {formErrors.courses && (
                            <div className="form-fields-section__error-message">{formErrors.courses}</div>
                        )}
                    </div>
                </PopupModal>

                {/* Confirm Drop Status Modal */}
                <PopupModal
                    open={Boolean(courseToDrop)}
                    onClose={closeDropConfirm}
                    onSubmit={handleDropConfirm}
                    title="Confirm Status Change"
                    subtitle=""
                    primaryButtonText="Confirm"
                    secondaryButtonText="Cancel"
                    showFooter={true}
                    primaryButtonLoading={updatingEnrollmentId === courseToDrop?.enrollmentId}
                    primaryButtonDisabled={updatingEnrollmentId === courseToDrop?.enrollmentId}
                    contentHeight="auto"
                    minHeight={100}
                >
                    <div className="popup-modal__content-content-text">
                        Are you sure you want to change the payment status for <b>"{courseToDrop?.courseName}"</b> to <b>Dropped</b>?
                    </div>
                </PopupModal>
            </div>
        </div>
    );
};

export default UserDetail;
