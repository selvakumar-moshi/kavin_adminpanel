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
    phoneNumber: string;
    role: string;
    profileImage?: string | null;
    createdAt?: string;
    updatedAt?: string;
    courses: EnrolledCourse[];
}

export const ENROLLMENT_STATUS_OPTIONS = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Verified', label: 'Verified' },
    // { value: 'Rejected', label: 'Rejected' },
];

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
        key: 'study',
        label: 'Study Materials',
    },
    {
        key: 'video',
        label: 'Video Materials',
    },
]
