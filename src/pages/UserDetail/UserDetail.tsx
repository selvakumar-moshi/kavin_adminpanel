import { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'antd';
import { FilePdfOutlined, FileImageOutlined, EditOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import TabsComponent from '../../components/Tabs/Tabs';
import PopupModal from '../../components/PopupModal/PopupModal';
import InputFields from '../../components/InputFields/InputFields';
import DropdownField from '../../components/DropdownField/DropdownField';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import Breadcrumbs from '../../components/Breadcrumb/Breadcrumbs';
import StatusBadge from '../../components/Table/StatusBadge';
import TableWithPagination from '../../components/Table/TableWithPagination';
import type { ITableColumn } from '../../components/Table/ITable';
import InfoItem from '../../components/InfoItem/InfoItem';
import { useUserDetailManagement, ALLOWED_BATCH_SEPARATOR } from './useUserDetailHooks';
import { usePageBodyClass } from '../../utils/pageBodyClass';
import { useResetPassword } from '../Users/useResetPassword';
import ResetPasswordModals from '../Users/ResetPasswordModals';
import { EDIT_USER_FIELDS, EDIT_USER_MODE_OPTIONS, EDIT_USER_PAYMENT_REQUIRED_OPTIONS, EDIT_USER_REASON_FIELDS, TRANSFER_MODE, PENDING_ENROLLMENT_STATUS_OPTIONS, UserDetailtabs, DISTRICT_OPTIONS, UserDetailMainTabs, SYLLABUS_PAYMENT_STATUS_OPTIONS, COURSE_DETAILS_TAB_KEY, SYLLABUS_WISE_TAB_KEY, SYLLABUS_MATERIAL_TAB_KEY } from './Constants';
import { formatDate } from '../../utils/dateUtils';
import dot_Icon from '../../assets/dot_Icon.svg';
import person_add_Icon from '../../assets/person_add_Icon.svg'
import calendar_Icon from '../../assets/calendar_Icon.svg';
import email_Icon from '../../assets/email_Icon.svg';
import arrow_drop_down_Icon from "../../assets/arrow_drop_down_Icon.svg";
import arrow_drop_right_Icon from "../../assets/arrow_drop_right_Icon.svg";
import manage_acc_Icon from "../../assets/manage_acc_Icon.svg";
import NoDataFound from '../../components/NoDataFound/NoDataFound';
import { richValueToHtml, sanitizeRichText } from '../../utils/richText';

/** Applied to document.body while this page is shown; user.scss targets this. */
const USER_DETAIL_PAGE_BODY_CLASS = 'user-detail-page';

const SYLLABUS_MATERIAL_COLUMNS: ITableColumn[] = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Description', dataIndex: 'description', key: 'description', render: (value: string) => value || '-' },
    { title: 'Folder', dataIndex: 'folderName', key: 'folderName', render: (value: string | null) => value || '-' },
    { title: 'Sub Folder', dataIndex: 'subFolderPath', key: 'subFolderPath', render: (_: string | null, record: { subFolderPath?: string | null; subFolderName?: string | null }) => record.subFolderPath || record.subFolderName || '-' },
    {
        title: 'PDF',
        dataIndex: 'pdfUrl',
        key: 'pdfUrl',
        render: (pdfUrl: string) => (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <FilePdfOutlined /> View
            </a>
        ),
    },
    { title: 'Created At', dataIndex: 'createdAt', key: 'createdAt', render: (value: string) => (value ? formatDate(value) : '-') },
];

const SYLLABUS_PAYMENT_COLUMNS: ITableColumn[] = [
    { title: 'Plan', dataIndex: 'planTitle', key: 'planTitle' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (amount: number) => `₹${Number(amount).toLocaleString()}` },
    { title: 'Payment Method', dataIndex: 'paymentMethod', key: 'paymentMethod', render: (value: string | null) => value || '-' },
    { title: 'Transaction Reference', dataIndex: 'transactionReference', key: 'transactionReference', render: (value: string | null) => value || '-' },
    {
        title: 'Transaction File',
        dataIndex: 'paymentScreenshot',
        key: 'paymentScreenshot',
        // The payment screenshot opens in a new tab
        render: (url: string | null) => (url ? (
            <a href={url} target="_blank" rel="noopener noreferrer">
                <FileImageOutlined /> View
            </a>
        ) : '-'),
    },
    { title: 'Verified At', dataIndex: 'verifiedAt', key: 'verifiedAt', render: (value: string | null) => (value ? formatDate(value) : '-') },
    { title: 'Paid On', dataIndex: 'createdAt', key: 'createdAt', render: (value: string) => (value ? formatDate(value) : '-') },
];

const UserDetail = () => {
    usePageBodyClass(USER_DETAIL_PAGE_BODY_CLASS);

    const {
        userDetail,
        enrollments,
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
        allowedBatchSelections,
        handleAllowedBatchChange,
        handleEditSubmit,
        updatingEnrollmentId,
        handleStatusChange,
        updatingPaymentId,
        handlePaymentStatusChange,
        toastMessages,
        showError,
        hideToast,
    } = useUserDetailManagement();

    const resetPassword = useResetPassword(showError);

    const [activeMainTab, setActiveMainTab] = useState(COURSE_DETAILS_TAB_KEY);
    const [expandedCourseIds, setExpandedCourseIds] = useState<Set<string>>(new Set());
    const [activeMaterialTabs, setActiveMaterialTabs] = useState<Record<string, string>>({});
    // Syllabus Wise payments: the one whose status change is being confirmed, and the verified ones that were then opened
    // for a change (a payment that is not verified always shows the dropdown)
    const [paymentToEdit, setPaymentToEdit] = useState<{ paymentId: string; planTitle: string } | null>(null);
    const [editingPaymentIds, setEditingPaymentIds] = useState<Set<string>>(new Set());
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

    // One combined list of every purchased course's allowed batches; the label carries the course name
    const allowedBatchOptions = (userDetail?.courses || []).flatMap((c) =>
        (c.allowedBatches || []).map((batch) => ({
            value: `${c.courseId}${ALLOWED_BATCH_SEPARATOR}${batch.batchId}`,
            label: `${batch.title} - ${c.courseName} (${formatDate(batch.batchFrom)} - ${formatDate(batch.batchTo)})`,
        }))
    );
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

    const syllabusPayments = userDetail.syllabusWisePayments || [];

    const confirmPaymentStatusEdit = () => {
        if (!paymentToEdit) return;
        setEditingPaymentIds((prev) => new Set(prev).add(paymentToEdit.paymentId));
        setPaymentToEdit(null);
    };

    // Payment Status is the last column. A verified payment shows its badge with an edit icon (the dropdown opens once the
    // change is confirmed); any other payment shows the dropdown straight away. Picking a status saves it.
    const syllabusPaymentColumns: ITableColumn[] = [
        ...SYLLABUS_PAYMENT_COLUMNS,
        {
            title: 'Payment Status',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (status: string, record: { paymentId: string; planTitle: string }) => {
                const isVerified = status === 'Verified';
                if (isVerified && !editingPaymentIds.has(record.paymentId)) {
                    return (
                        <span className="user-course__status-with-edit">
                            <StatusBadge status={status} />
                            <button
                                type="button"
                                className="user-course__status-edit-btn"
                                onClick={() => setPaymentToEdit({ paymentId: record.paymentId, planTitle: record.planTitle })}
                                aria-label={`Change payment status for ${record.planTitle}`}
                            >
                                <EditOutlined />
                            </button>
                        </span>
                    );
                }
                const saving = updatingPaymentId === record.paymentId;
                return (
                    <DropdownField
                        className="user-course__status-dropdown"
                        fields={[{
                            name: 'paymentStatus',
                            label: '',
                            placeholder: 'Select status',
                            options: SYLLABUS_PAYMENT_STATUS_OPTIONS,
                            loading: saving,
                            disabled: saving,
                            allowClear: false,
                        }]}
                        values={{ paymentStatus: status }}
                        onChange={async (_, value) => {
                            const next = Array.isArray(value) ? value[0] || '' : value;
                            if (!next || next === status) {
                                // Same status picked again: nothing to save, a verified payment goes back to its badge
                                setEditingPaymentIds((prev) => { const n = new Set(prev); n.delete(record.paymentId); return n; });
                                return;
                            }
                            if (await handlePaymentStatusChange(record.paymentId, next)) {
                                setEditingPaymentIds((prev) => { const n = new Set(prev); n.delete(record.paymentId); return n; });
                            }
                        }}
                    />
                );
            },
        },
    ];
    const syllabusMaterials = userDetail.syllabusMaterials || [];

    const menuItems: MenuProps['items'] = [
        {
            key: 'edit',
            label: 'Edit',
            onClick: openEditModal,
        },
        {
            key: 'resetPassword',
            label: 'Reset Password',
            onClick: () => resetPassword.openConfirm({ userId: userDetail.userId, name: `${userDetail.firstName} ${userDetail.lastName}`.trim() }),
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
                        <InfoItem icon={email_Icon} label="Email:" value={userDetail.email} valueClassName="user-detail__info-item-value--keep-case" />
                        <InfoItem icon={person_add_Icon} label="Phone:" value={userDetail.phoneNumber} />
                        <InfoItem icon={person_add_Icon} label="District:" value={userDetail.district} />
                        <InfoItem icon={calendar_Icon} label="Joined Date:" value={userDetail.createdAt ? formatDate(userDetail.createdAt) : ''} />
                    </div>
                </div>

                <div className="user-detail-main-tabs">
                    <TabsComponent items={UserDetailMainTabs} activeKey={activeMainTab} onChange={setActiveMainTab} />
                </div>

                {activeMainTab === COURSE_DETAILS_TAB_KEY && (
                <div className="user-detail-course-list">
                {enrollments.length === 0 ? (
                    <NoDataFound type="nodata" description="No courses enrolled" />
                ) : (
                    <>
                        {enrollments.map((course) => {
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
                                            <span className="user-course__module-title">{course.batchTitle ? `${course.courseName} - ${course.batchTitle}` : course.courseName}</span>
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
                                                            <li className='user-detail__info-item-label2'>Amount:
                                                                <span className='user-detail__info-item-value2'> ₹{Number(course.amount ?? 0).toLocaleString()}</span>
                                                            </li>
                                                            {course.enrolledAt && (
                                                                <li className='user-detail__info-item-label2'>Enrolled At:
                                                                    <span className='user-detail__info-item-value2'> {formatDate(course.enrolledAt)}</span>
                                                                </li>
                                                            )}
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
                                                                            <div className='user-detail-course__materials-desc rich-text-content' dangerouslySetInnerHTML={{ __html: `— ${sanitizeRichText(richValueToHtml(material.description))}` }} />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <NoDataFound type="nodata" description="No study material" />
                                                        )
                                                    ) : getActiveMaterialTab(course.enrollmentId) === 'questionPaper' ? (
                                                        course.questionPapers && course.questionPapers.length > 0 ? (
                                                            <ul className="user-detail-course__materials">
                                                                {course.questionPapers.map((paper) => (
                                                                    <div key={paper.id} className="user-detail-course__materials-main">
                                                                        <FilePdfOutlined /> {' '}
                                                                        <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                                            {paper.title}
                                                                        </a>
                                                                        {paper.description && (
                                                                            <div className='user-detail-course__materials-desc rich-text-content' dangerouslySetInnerHTML={{ __html: `— ${sanitizeRichText(richValueToHtml(paper.description))}` }} />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <NoDataFound type="nodata" description="No question papers" />
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
                                                                {course.transferredFromBatchTitle && (
                                                                    <li className='user-detail__info-item-label2'>Transferred From:
                                                                        <span className='user-detail__info-item-value2'> {course.transferredFromBatchTitle}{course.transferredAt ? ` (${formatDate(course.transferredAt)})` : ''}</span>
                                                                    </li>
                                                                )}
                                                                {course.transferReason && (
                                                                    <li className='user-detail__info-item-label2'>Transfer Reason:
                                                                        <span className='user-detail__info-item-value2'> {course.transferReason}</span>
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        ) : (
                                                            <NoDataFound type="nodata" description="No batch assigned" />
                                                        )
                                                    ) : (
                                                        course.paymentScreenshot || course.transactionReference ? (
                                                            <>
                                                                {course.transactionReference && (
                                                                    <ul className="user-detail-course__amounts">
                                                                        <li className='user-detail__info-item-label2'>Transaction Reference:
                                                                            <span className='user-detail__info-item-value2'> {course.transactionReference}</span>
                                                                        </li>
                                                                    </ul>
                                                                )}
                                                                {course.paymentScreenshot && (
                                                                    <div className="user-detail-course__payment-screenshot">
                                                                        <a href={course.paymentScreenshot} target="_blank" rel="noopener noreferrer">
                                                                            <img src={course.paymentScreenshot} alt="Payment Screenshot" />
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <NoDataFound type="nodata" description="No payment details" />
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
                )}

                {activeMainTab === SYLLABUS_WISE_TAB_KEY && (
                    <div className="user-syllabus-list">
                        {syllabusPayments.length === 0 ? (
                            <NoDataFound type="nodata" description="No syllabus wise payments" />
                        ) : (
                            <TableWithPagination
                                columns={syllabusPaymentColumns}
                                dataSource={syllabusPayments.map((payment) => ({ ...payment, key: payment.paymentId }))}
                            />
                        )}
                    </div>
                )}

                {activeMainTab === SYLLABUS_MATERIAL_TAB_KEY && (
                    <div className="user-syllabus-list">
                        {syllabusMaterials.length === 0 ? (
                            <NoDataFound type="nodata" description="No syllabus materials" />
                        ) : (
                            <TableWithPagination
                                columns={SYLLABUS_MATERIAL_COLUMNS}
                                dataSource={syllabusMaterials.map((material) => ({ ...material, key: material.id }))}
                            />
                        )}
                    </div>
                )}

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
                        {enrollments.length === 0 && selectedCourses.length === 0 ? (
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
                                {enrollments.some((c) => c.batchTitle) && (
                                    <DropdownField
                                        fields={[
                                            {
                                                name: 'purchasedBatches',
                                                label: 'Batch',
                                                placeholder: 'No batch assigned',
                                                mode: 'multiple',
                                                options: enrollments
                                                    .filter((c) => c.batchTitle)
                                                    .map((c) => ({
                                                        value: c.enrollmentId,
                                                        label: `${c.batchTitle} (${c.courseName} - ${c.enrollmentStatus})`,
                                                    })),
                                                disabled: true,
                                            },
                                        ]}
                                        values={{
                                            purchasedBatches: enrollments
                                                .filter((c) => c.batchTitle)
                                                .map((c) => c.enrollmentId),
                                        }}
                                    />
                                )}
                                {/* Other batches of an already-purchased course that the backend lists as allowed — selectable, sent on Update */}
                                {allowedBatchOptions.length > 0 && (
                                    <DropdownField
                                        fields={[
                                            {
                                                name: 'allowedBatches',
                                                label: 'Allowed Batches',
                                                placeholder: 'Select batch',
                                                mode: 'multiple',
                                                options: allowedBatchOptions,
                                                disabled: isUpdating,
                                            },
                                        ]}
                                        values={{ allowedBatches: allowedBatchSelections }}
                                        onChange={(_, value) => handleAllowedBatchChange(Array.isArray(value) ? value : [value])}
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
                        {/* How the courses / batches above are added (all optional; sent with each of them) */}
                        <DropdownField
                            fields={[
                                {
                                    name: 'mode',
                                    label: 'Mode',
                                    placeholder: 'Select mode',
                                    options: EDIT_USER_MODE_OPTIONS,
                                    disabled: isUpdating,
                                },
                                {
                                    name: 'paymentRequired',
                                    label: 'Payment Required',
                                    placeholder: 'Select payment required',
                                    options: EDIT_USER_PAYMENT_REQUIRED_OPTIONS,
                                    disabled: isUpdating,
                                },
                            ]}
                            values={{ mode: formValues.mode || '', paymentRequired: formValues.paymentRequired || '' }}
                            onChange={(name, value) => {
                                const next = Array.isArray(value) ? value[0] || '' : value;
                                handleInputChange(name, next);
                                // The from batch only applies to a transfer
                                if (name === 'mode' && next !== TRANSFER_MODE) handleInputChange('fromBatchId', '');
                            }}
                        />
                        {/* Only a transfer moves the user out of a batch, so the field is shown for that mode alone */}
                        {formValues.mode === TRANSFER_MODE && (
                            <DropdownField
                                fields={[
                                    {
                                        name: 'fromBatchId',
                                        label: 'From Batch',
                                        placeholder: 'Select from batch',
                                        // The batches the user is in now (a batch listed once, whatever its course)
                                        options: enrollments
                                            .filter((enrollment, index, all) => enrollment.batchId && all.findIndex((other) => other.batchId === enrollment.batchId) === index)
                                            .map((enrollment) => ({ value: enrollment.batchId as string, label: `${enrollment.batchTitle} (${enrollment.courseName})` })),
                                        disabled: isUpdating,
                                    },
                                ]}
                                values={{ fromBatchId: formValues.fromBatchId || '' }}
                                onChange={(_, value) => handleInputChange('fromBatchId', Array.isArray(value) ? value[0] || '' : value)}
                            />
                        )}
                        <InputFields
                            fields={EDIT_USER_REASON_FIELDS}
                            values={formValues}
                            errors={formErrors}
                            onChange={handleInputChange}
                            disabled={isUpdating}
                        />
                    </div>
                </PopupModal>

                {/* Confirm changing a Syllabus Wise payment status */}
                <PopupModal
                    open={Boolean(paymentToEdit)}
                    onClose={() => setPaymentToEdit(null)}
                    onSubmit={confirmPaymentStatusEdit}
                    title="Confirm Status Change"
                    subtitle=""
                    primaryButtonText="Yes"
                    secondaryButtonText="No"
                    showFooter={true}
                    contentHeight="auto"
                    minHeight={100}
                >
                    <div className="popup-modal__content-content-text">
                        Are you sure you want to change the verified payment status? Do you want to continue?
                    </div>
                </PopupModal>

                <ResetPasswordModals reset={resetPassword} />

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
