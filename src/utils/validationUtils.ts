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
        pattern: /^[a-zA-Z\s]*$/,
        errorMessages: {
            required: 'First Name is required',
            pattern: 'First Name can only contain alphabetic characters.',
        },
    },
    lastName: {
        required: true,
        pattern: /^[a-zA-Z\s]*$/,
        errorMessages: {
            required: 'Last Name is required',
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
        errorMessages: {
            required: 'Course Name is required',
        },
    },
    courseDescription: {
        errorMessages: {},
    },
};

export const BATCH_VALIDATION_RULES: Record<string, ValidationRule> = {
    title: {
        required: true,
        errorMessages: {
            required: 'Batch Title is required',
        },
    },
    // Optional — only checked when filled in
    whatsAppLink: {
        pattern: /^https?:\/\/(chat\.whatsapp\.com|wa\.me|api\.whatsapp\.com|whatsapp\.com)\/\S+$/i,
        errorMessages: {
            pattern: 'Enter a valid WhatsApp link, eg: https://chat.whatsapp.com/AbCdEf123456',
        },
    },
    telegramLink: {
        pattern: /^https?:\/\/(t\.me|telegram\.me|telegram\.dog)\/\S+$/i,
        errorMessages: {
            pattern: 'Enter a valid Telegram link, eg: https://t.me/yourgroupname',
        },
    },
};

export const STUDY_MATERIAL_VALIDATION_RULES: Record<string, ValidationRule> = {
    title: {
        required: true,
        errorMessages: {
            required: 'Title is required',
        },
    },
    description: {
        errorMessages: {},
    },
};

export const VIDEO_MATERIAL_VALIDATION_RULES: Record<string, ValidationRule> = {
    title: {
        required: true,
        errorMessages: {
            required: 'Title is required',
        },
    },
    description: {
        errorMessages: {},
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
    notificationType: {
        errorMessages: {
        },
    },
    title: {
        errorMessages: {
        },
    },
    description: {
        errorMessages: {
        },
    },
    link: {
        pattern: /^https?:\/\/.+/i,
        errorMessages: {
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
    quizToView: {
        required: true,
        errorMessages: {
            required: 'Quiz To View is required',
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
    // Optional: a question may have only three options (e.g. imported from a document with Option D missing)
    optionD: {
        errorMessages: {},
    },
    correctOption: {
        required: true,
        errorMessages: { required: 'Required' },
    },
    mark: {
        required: true,
        pattern: /^\d+(\.\d+)?$/,
        errorMessages: {
            required: 'Required',
            pattern: 'Enter a number like 1 or 1.5',
        },
    },
};
