import { useEffect, useRef, useState } from 'react';
import { Dropdown, Image } from 'antd';
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
import InfoItem from '../../components/InfoItem/InfoItem';
import { useUserDetailManagement, ALLOWED_BATCH_SEPARATOR } from './useUserDetailHooks';
import { usePageBodyClass } from '../../utils/pageBodyClass';
import { useResetPassword } from '../Users/useResetPassword';
import ResetPasswordModals from '../Users/ResetPasswordModals';
import type { UserSyllabusMaterial } from './Constants';
import { EDIT_USER_FIELDS, EDIT_USER_MODE_OPTIONS, EDIT_USER_PAYMENT_REQUIRED_OPTIONS, EDIT_USER_REASON_FIELDS, TRANSFER_MODE, PENDING_ENROLLMENT_STATUS_OPTIONS, DISTRICT_OPTIONS, UserDetailMainTabs, SYLLABUS_PAYMENT_STATUS_OPTIONS, COURSE_DETAILS_TAB_KEY, SYLLABUS_DETAILS_TAB_KEY } from './Constants';
import { formatDate } from '../../utils/dateUtils';
import dot_Icon from '../../assets/dot_Icon.svg';
import person_add_Icon from '../../assets/person_add_Icon.svg'
import calendar_Icon from '../../assets/calendar_Icon.svg';
import email_Icon from '../../assets/email_Icon.svg';
import manage_acc_Icon from "../../assets/manage_acc_Icon.svg";
import arrow_drop_down_Icon from "../../assets/arrow_drop_down_Icon.svg";
import arrow_drop_right_Icon from "../../assets/arrow_drop_right_Icon.svg";
import NoDataFound from '../../components/NoDataFound/NoDataFound';
import { richValueToHtml, sanitizeRichText, richTextToPlain } from '../../utils/richText';

/** Applied to document.body while this page is shown; user.scss targets this. */
const USER_DETAIL_PAGE_BODY_CLASS = 'user-detail-page';

// The payment screenshot is shown right in the page; clicking it opens a larger view (no new tab)
const renderPaymentProof = (url?: string | null) => (
    <div className="payment-card__proof">
        {url ? (
            <Image src={url} alt="Payment screenshot" className="payment-card__proof-img" preview={{ mask: 'View' }} />
        ) : (
            <div className="payment-card__proof-empty">
                <FileImageOutlined />
                <span>No screenshot uploaded</span>
            </div>
        )}
    </div>
);

// One label / value pair of a payment card (`keepCase` for values like a transaction reference)
const renderDetail = (label: string, value?: string | null, keepCase = false) => (
    <div className="payment-card__detail">
        <dt>{label}</dt>
        <dd className={keepCase ? 'payment-card__value--keep-case' : undefined}>{value || '-'}</dd>
    </div>
);

// The syllabus materials of a payment's folder, shown inside its card
const renderPaymentMaterials = (materials: UserSyllabusMaterial[]) => (
    <div className="payment-card__materials">
        <div className="payment-card__materials-title">Syllabus Material ({materials.length})</div>
        {materials.length === 0 ? (
            <div className="payment-card__materials-empty">No syllabus material</div>
        ) : (
            <table className="payment-card__materials-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Sub Folder</th>
                        <th>PDF</th>
                        <th>Created At</th>
                    </tr>
                </thead>
                <tbody>
                    {materials.map((material) => (
                        <tr key={material.id}>
                            <td>{material.title}</td>
                            <td>{richTextToPlain(material.description || '') || '-'}</td>
                            <td>{material.subFolderPath || material.subFolderName || '-'}</td>
                            <td>
                                <a href={material.pdfUrl} target="_blank" rel="noopener noreferrer">
                                    <FilePdfOutlined /> View
                                </a>
                            </td>
                            <td>{material.createdAt ? formatDate(material.createdAt) : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
    </div>
);

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
    // The course / payment cards that are open (all start collapsed); enrollment and payment ids don't clash
    const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());
    const toggleCard = (id: string) => {
        setExpandedCardIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };
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

    const getActiveMaterialTab = (enrollmentId: string) => activeMaterialTabs[enrollmentId] || 'study';

    const setActiveMaterialTab = (enrollmentId: string, key: string) => {
        setActiveMaterialTabs(prev => ({ ...prev, [enrollmentId]: key }));
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

    // A verified payment shows its badge with an edit icon (the dropdown opens once the change is confirmed); any other
    // payment shows the dropdown straight away. Picking a status saves it.
    const renderPaymentStatus = (status: string, record: { paymentId: string; planTitle: string }) => {
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
    };

    const syllabusMaterials = userDetail.syllabusMaterials || [];
    // A payment shows the materials of its own folder; the materials no payment's folder covers go on the payments whose
    // folder has none (so nothing the user has access to is left out)
    const otherMaterials = syllabusMaterials.filter(
        (material) => !syllabusPayments.some((payment) => payment.folderId && payment.folderId === material.folderId)
    );
    const materialsOfPayment = (folderId: string | null) => {
        const own = folderId ? syllabusMaterials.filter((material) => material.folderId === folderId) : [];
        return own.length > 0 ? own : otherMaterials;
    };

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
                            const isExpanded = expandedCardIds.has(course.enrollmentId);
                            const activeTab = getActiveMaterialTab(course.enrollmentId);
                            const studyMaterials = course.studyMaterials || [];
                            const questionPapers = course.questionPapers || [];
                            const videoMaterials = course.videoMaterials || [];
                            const materialTabs = [
                                { key: 'study', label: `Study Materials (${studyMaterials.length})` },
                                { key: 'questionPaper', label: `Question Papers (${questionPapers.length})` },
                                { key: 'video', label: `Videos (${videoMaterials.length})` },
                            ];
                            return (
                                <div className="payment-card" key={course.enrollmentId}>
                                    <div
                                        className={`payment-card__header payment-card__header--toggle${isExpanded ? '' : ' payment-card__header--collapsed'}`}
                                        onClick={() => toggleCard(course.enrollmentId)}
                                        aria-expanded={isExpanded}
                                    >
                                        <img className="payment-card__arrow" src={isExpanded ? arrow_drop_down_Icon : arrow_drop_right_Icon} alt={isExpanded ? 'Collapse' : 'Expand'} />
                                        <img src={manage_acc_Icon} alt="" />
                                        <span className="payment-card__title">{course.batchTitle ? `${course.courseName} - ${course.batchTitle}` : course.courseName}</span>
                                        <span className="payment-card__amount">₹{Number(course.amount ?? 0).toLocaleString()}</span>
                                        <div className="user-course__payment-status" onClick={(e) => e.stopPropagation()}>
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

                                    {isExpanded && (<>
                                    {/* Payment and batch details */}
                                    <div className="payment-card__body">
                                        {renderPaymentProof(course.paymentScreenshot)}
                                        {/* Details, then the materials, beside the screenshot */}
                                        <div className="payment-card__main">
                                        <dl className="payment-card__details">
                                            {renderDetail('Batch', course.batchTitle)}
                                            {renderDetail('Payment Method', course.paymentMethod)}
                                            {renderDetail('Transaction Reference', course.transactionReference, true)}
                                            {renderDetail('Enrolled At', course.enrolledAt ? formatDate(course.enrolledAt) : null)}
                                            {renderDetail('Verified At', course.verifiedAt ? formatDate(course.verifiedAt) : null)}
                                            {course.transferredFromBatchTitle && renderDetail('Transferred From', `${course.transferredFromBatchTitle}${course.transferredAt ? ` (${formatDate(course.transferredAt)})` : ''}`)}
                                            {course.transferReason && renderDetail('Transfer Reason', course.transferReason)}
                                        </dl>

                                    {/* The course's materials */}
                                    <div className="payment-card__materials">
                                        <TabsComponent
                                            items={materialTabs}
                                            activeKey={activeTab}
                                            onChange={(key) => setActiveMaterialTab(course.enrollmentId, key)}
                                        />
                                        {activeTab === 'questionPaper' ? (
                                            questionPapers.length > 0 ? (
                                                <ul className="user-detail-course__materials">
                                                    {questionPapers.map((paper) => (
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
                                        ) : activeTab === 'video' ? (
                                            videoMaterials.length > 0 ? (
                                                <ul className="user-detail-course__materials">
                                                    {videoMaterials.map((video) => (
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
                                        ) : (
                                            studyMaterials.length > 0 ? (
                                                <ul className="user-detail-course__materials">
                                                    {studyMaterials.map((material) => (
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
                                        )}
                                    </div>
                                        </div>
                                    </div>
                                    </>)}
                                </div>
                            );
                        })}
                    </>
                )}
                </div>
                )}

                {activeMainTab === SYLLABUS_DETAILS_TAB_KEY && (
                    <div className="user-syllabus-details">
                        <div className="user-syllabus-section">
                            {syllabusPayments.length === 0 ? (
                                <NoDataFound type="nodata" description={syllabusMaterials.length === 0 ? 'No syllabus details' : 'No syllabus wise payments'} />
                            ) : (
                                <div className="payment-cards">
                                {syllabusPayments.map((payment) => {
                                    const isExpanded = expandedCardIds.has(payment.paymentId);
                                    return (
                                    <div className="payment-card" key={payment.paymentId}>
                                        <div
                                            className={`payment-card__header payment-card__header--toggle${isExpanded ? '' : ' payment-card__header--collapsed'}`}
                                            onClick={() => toggleCard(payment.paymentId)}
                                            aria-expanded={isExpanded}
                                        >
                                            <img className="payment-card__arrow" src={isExpanded ? arrow_drop_down_Icon : arrow_drop_right_Icon} alt={isExpanded ? 'Collapse' : 'Expand'} />
                                            <span className="payment-card__title">{payment.planTitle}</span>
                                            <span className="payment-card__amount">₹{Number(payment.amount).toLocaleString()}</span>
                                            <div className="user-course__payment-status" onClick={(e) => e.stopPropagation()}>
                                                <span className="user-detail__info-item-label2">Payment Status:</span>
                                                {renderPaymentStatus(payment.paymentStatus, payment)}
                                            </div>
                                        </div>
                                        {isExpanded && (
                                        <div className="payment-card__body">
                                            {renderPaymentProof(payment.paymentScreenshot)}
                                            {/* Details, then this plan's materials, beside the screenshot */}
                                            <div className="payment-card__main">
                                                <dl className="payment-card__details">
                                                    {renderDetail('Payment Method', payment.paymentMethod)}
                                                    {renderDetail('Transaction Reference', payment.transactionReference, true)}
                                                    {renderDetail('Verified At', payment.verifiedAt ? formatDate(payment.verifiedAt) : null)}
                                                    {renderDetail('Paid On', payment.createdAt ? formatDate(payment.createdAt) : null)}
                                                </dl>
                                                {renderPaymentMaterials(materialsOfPayment(payment.folderId))}
                                            </div>
                                        </div>
                                        )}
                                    </div>
                                    );
                                })}
                            </div>
                            )}
                        </div>
                        {/* Materials with no payment to sit under */}
                        {syllabusPayments.length === 0 && syllabusMaterials.length > 0 && (
                            <div className="user-syllabus-section">
                                {renderPaymentMaterials(syllabusMaterials)}
                            </div>
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
