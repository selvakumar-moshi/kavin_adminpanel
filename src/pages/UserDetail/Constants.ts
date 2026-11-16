import { getDistricts } from 'india-state-district';

export interface StudyMaterial {
    id: string;
    title: string;
    description: string;
    pdfUrl: string;
    pdfFileName: string;
    courseId: string;
    createdAt: string;
    updatedAt: string | null;
}

export interface VideoMaterial {
    id: string;
    title: string;
    description?: string;
    videoUrl: string;
    courseId: string;
}

export interface AllowedBatch {
    batchId: string;
    title: string;
    batchFrom: string;
    batchTo: string;
}

export interface EnrolledCourse {
    enrollmentId: string;
    courseId: string;
    courseName: string;
    batchId: string | null;
    batchTitle: string | null;
    courseAmount: number;
    totalAmount: number;
    paymentMethod: string | null;
    transactionReference: string | null;
    paymentScreenshot: string | null;
    enrollmentStatus: string;
    verifiedAt: string | null;
    studyMaterials: StudyMaterial[];
    // Same fields as a study material
    questionPapers?: StudyMaterial[];
    videoMaterials: VideoMaterial[];
    allowedBatches?: AllowedBatch[];
}

// A syllabus material the user has access to
export interface UserSyllabusMaterial {
    id: string;
    title: string;
    description: string;
    folderId: string;
    subFolderId?: string | null;
    pdfUrl: string;
    pdfKey?: string;
    pdfFileName: string;
    folderName?: string | null;
    subFolderName?: string | null;
    subFolderPath?: string | null;
    createdAt?: string;
    updatedAt?: string | null;
}

// A payment the user made for a Syllabus Wise plan
export interface SyllabusWisePayment {
    paymentId: string;
    userId: string;
    planId: string;
    planTitle: string;
    folderId: string | null;
    amount: number;
    paymentMethod: string | null;
    transactionReference: string | null;
    paymentStatus: string;
    verifiedAt: string | null;
    createdAt: string;
}

export interface UserDetailRecord {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    applicationNo: string;
    phoneNumber: string;
    role: string;
    profileImage?: string | null;
    district?: string;
    state?: string;
    createdAt?: string;
    updatedAt?: string;
    courses: EnrolledCourse[];
    syllabusWisePayments?: SyllabusWisePayment[];
    syllabusMaterials?: UserSyllabusMaterial[];
}

// Districts are scoped to Tamil Nadu only — state itself is never shown or sent to the API
const FIXED_STATE_CODE = 'TN';

export const DISTRICT_OPTIONS = getDistricts(FIXED_STATE_CODE).map((district) => ({ value: district, label: district }));

export const ENROLLMENT_STATUS_OPTIONS = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Verified', label: 'Verified' },
    { value: 'Dropped', label: 'Dropped' },
    { value: 'Rejected', label: 'Rejected' },
];

// Shown in the status dropdown only while an enrollment is Pending — Pending/Dropped aren't valid choices from there
export const PENDING_ENROLLMENT_STATUS_OPTIONS = ENROLLMENT_STATUS_OPTIONS.filter(
    (option) => option.value === 'Verified' || option.value === 'Rejected'
);

export const EDIT_USER_FIELDS = [
    {
        name: 'firstName',
        label: 'First Name',
        placeholder: 'Enter First name',
        required: true,
        type: 'text' as const,
    },
    {
        name: 'lastName',
        label: 'Last Name',
        placeholder: 'Enter Last name',
        required: true,
        type: 'text' as const,
    },
    {
        name: 'phoneNumber',
        label: 'Phone Number',
        placeholder: 'Enter Phone Number',
        required: true,
        type: 'text' as const,
    },
];

export const UserDetailtabs = [
    {
        key: 'purchased',
        label: 'Purchased Details',
    },
    {
        key: 'Batch',
        label: 'Batch Details',
    },
    {
        key: 'study',
        label: 'Study Materials',
    },
    {
        key: 'questionPaper',
        label: 'Question Papers',
    },
    {
        key: 'video',
        label: 'Video Materials',
    },
    {
        key: 'payment',
        label: 'Payment Details',
    },
]

// What the Payment Status dropdown of a Syllabus Wise payment offers
export const SYLLABUS_PAYMENT_STATUS_OPTIONS = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Verified', label: 'Verified' },
    { value: 'Rejected', label: 'Rejected' },
];

export const COURSE_DETAILS_TAB_KEY = 'courseDetails';
export const SYLLABUS_WISE_TAB_KEY = 'syllabusWise';
export const SYLLABUS_MATERIAL_TAB_KEY = 'syllabusMaterial';

export const UserDetailMainTabs = [
    { key: COURSE_DETAILS_TAB_KEY, label: 'Course Details' },
    { key: SYLLABUS_WISE_TAB_KEY, label: 'Syllabus Wise' },
    { key: SYLLABUS_MATERIAL_TAB_KEY, label: 'Syllabus Material' },
];
