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
    videoMaterials: VideoMaterial[];
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
        key: 'study',
        label: 'Study Materials',
    },
    {
        key: 'video',
        label: 'Video Materials',
    },
    {
        key: 'Batch',
        label: 'Batch Details',
    },
    {
        key: 'payment',
        label: 'Payment Details',
    },
]
