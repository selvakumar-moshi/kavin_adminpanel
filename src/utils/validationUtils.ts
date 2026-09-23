export type ValidationRule = {
    required?: boolean;
    maxLength?: number;
    pattern?: RegExp;
    errorMessages: {
        required?: string;
        maxLength?: string;
        pattern?: string;
    };
};

export const EDIT_USER_VALIDATION_RULES: Record<string, ValidationRule> = {
    firstName: {
        required: true,
        maxLength: 100,
        pattern: /^[a-zA-Z\s]*$/,
        errorMessages: {
            required: 'First Name is required',
            maxLength: 'First Name must not exceed 100 characters.',
            pattern: 'First Name can only contain alphabetic characters.',
        },
    },
    lastName: {
        required: true,
        maxLength: 100,
        pattern: /^[a-zA-Z\s]*$/,
        errorMessages: {
            required: 'Last Name is required',
            maxLength: 'Last Name must not exceed 100 characters.',
            pattern: 'Last Name can only contain alphabetic characters.',
        },
    },
    phoneNumber: {
        required: true,
        pattern: /^\d{10}$/,
        errorMessages: {
            required: 'Phone Number is required',
            pattern: 'Phone Number must be exactly 10 digits.',
        },
    },
    district: {
        required: true,
        errorMessages: {
            required: 'District is required',
        },
    },
};

export const COURSE_VALIDATION_RULES: Record<string, ValidationRule> = {
    courseName: {
        required: true,
        maxLength: 200,
        errorMessages: {
            required: 'Course Name is required',
            maxLength: 'Course Name must not exceed 200 characters.',
        },
    },
    courseDescription: {
        maxLength: 255,
        errorMessages: {
            maxLength: 'Description must not exceed 255 characters.',
        },
    },
};

export const BATCH_VALIDATION_RULES: Record<string, ValidationRule> = {
    title: {
        required: true,
        maxLength: 100,
        errorMessages: {
            required: 'Batch Title is required',
            maxLength: 'Batch Title must not exceed 100 characters.',
        },
    },
};

export const STUDY_MATERIAL_VALIDATION_RULES: Record<string, ValidationRule> = {
    title: {
        required: true,
        maxLength: 100,
        errorMessages: {
            required: 'Title is required',
            maxLength: 'Title must not exceed 100 characters.',
        },
    },
    description: {
        maxLength: 255,
        errorMessages: {
            maxLength: 'Description must not exceed 255 characters.',
        },
    },
};

export const VIDEO_MATERIAL_VALIDATION_RULES: Record<string, ValidationRule> = {
    title: {
        required: true,
        maxLength: 100,
        errorMessages: {
            required: 'Title is required',
            maxLength: 'Title must not exceed 100 characters.',
        },
    },
    description: {
        maxLength: 255,
        errorMessages: {
            maxLength: 'Description must not exceed 255 characters.',
        },
    },
    youtubeLink: {
        required: true,
        // pattern: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
        errorMessages: {
            required: 'YouTube Link is required',
            pattern: 'Enter a valid YouTube link.',
        },
    },
};

export const NOTIFICATION_VALIDATION_RULES: Record<string, ValidationRule> = {
    title: {
        required: true,
        maxLength: 200,
        errorMessages: {
            required: 'Title is required',
            maxLength: 'Title must not exceed 200 characters.',
        },
    },
    description: {
        required: true,
        maxLength: 500,
        errorMessages: {
            required: 'Description is required',
            maxLength: 'Description must not exceed 500 characters.',
        },
    },
    link: {
        required: true,
        pattern: /^https?:\/\/.+/i,
        errorMessages: {
            required: 'Link is required',
            pattern: 'Enter a valid URL starting with http:// or https://',
        },
    },
};

export const QUIZ_VALIDATION_RULES: Record<string, ValidationRule> = {
    title: {
        required: true,
        errorMessages: {
            required: 'Title is required',
        },
    },
};

export const QUIZ_QUESTION_VALIDATION_RULES: Record<string, ValidationRule> = {
    questionText: {
        required: true,
        errorMessages: { required: 'Required' },
    },
    optionA: {
        required: true,
        errorMessages: { required: 'Required' },
    },
    optionB: {
        required: true,
        errorMessages: { required: 'Required' },
    },
    optionC: {
        required: true,
        errorMessages: { required: 'Required' },
    },
    optionD: {
        required: true,
        errorMessages: { required: 'Required' },
    },
    correctOption: {
        required: true,
        errorMessages: { required: 'Required' },
    },
};
