import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getQuizById, createQuiz, updateQuiz, getCourses } from '../../services/SuperSalesAction';
import { emptyQuestion, type QuizQuestion, type QuizRecord } from './Constant';
import type { CourseRecord } from '../Course/Constant';
import { QUIZ_VALIDATION_RULES, QUIZ_QUESTION_VALIDATION_RULES, type ValidationRule } from '../../utils/validationUtils';

type QuestionErrors = Record<number, Partial<Record<keyof QuizQuestion, string>>>;

// Client-only identity for stable React list keys — never sent to the API (stripped in handleSubmit)
export type KeyedQuizQuestion = QuizQuestion & { _key: number };

// Module-level (not a ref/state) so key generation never touches React's render/hook rules
let questionKeySeed = 0;
const nextQuestionKey = () => ++questionKeySeed;

export const useQuestionDetailManagement = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

    const makeKeyedQuestion = (q?: QuizQuestion): KeyedQuizQuestion => ({
        ...(q || emptyQuestion()),
        _key: nextQuestionKey(),
    });

    const [title, setTitle] = useState('');
    const [courseId, setCourseId] = useState('');
    const [questions, setQuestions] = useState<KeyedQuizQuestion[]>(() => [makeKeyedQuestion()]);
    const [titleError, setTitleError] = useState('');
    const [courseError, setCourseError] = useState('');
    const [questionErrors, setQuestionErrors] = useState<QuestionErrors>({});
    const [isSaving, setIsSaving] = useState(false);

    const { QuizDetailData, CoursesData, apiStatus } = useSelector(
        (state: RootState) => state.superSales
    );

    const quizDetail = QuizDetailData as QuizRecord | null;
    const coursesArray = Array.isArray(CoursesData) ? (CoursesData as CourseRecord[]) : [];
    const loading = apiStatus.QuizDetailData?.loading || false;
    const saveStatus = apiStatus.QuizzesData;

    useEffect(() => {
        dispatch(getCourses() as any);
    }, [dispatch]);

    useEffect(() => {
        if (id) {
            dispatch(getQuizById(id) as any);
        }
    }, [dispatch, id]);

    useEffect(() => {
        if (isEditMode && quizDetail && quizDetail.id === id) {
            setTitle(quizDetail.title || '');
            setCourseId(quizDetail.courseId || '');
            setQuestions(
                quizDetail.questions && quizDetail.questions.length > 0
                    ? quizDetail.questions.map((q) => makeKeyedQuestion(q))
                    : [makeKeyedQuestion()]
            );
        }
    }, [isEditMode, quizDetail, id]);

    useEffect(() => {
        if (!isSaving) return;

        if (saveStatus?.success) {
            showSuccess(isEditMode ? 'Quiz updated successfully!' : 'Quiz created successfully!');
            setIsSaving(false);
            navigate('/quiz');
        }

        if (saveStatus?.error) {
            showError(saveStatus.error);
            setIsSaving(false);
        }
    }, [saveStatus, isSaving, isEditMode, showSuccess, showError, navigate]);

    const handleTitleChange = (_name: string, value: string) => {
        setTitle(value);
        if (titleError) setTitleError('');
    };

    const handleCourseChange = (value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] || '' : value;
        setCourseId(stringValue);
        if (courseError) setCourseError('');
    };

    const addQuestion = () => {
        setQuestions((prev) => [...prev, makeKeyedQuestion()]);
    };

    const removeQuestion = (index: number) => {
        setQuestions((prev) => prev.filter((_, i) => i !== index));
        setQuestionErrors((prev) => {
            const next: QuestionErrors = {};
            Object.entries(prev).forEach(([key, value]) => {
                const keyIndex = Number(key);
                if (keyIndex < index) next[keyIndex] = value;
                else if (keyIndex > index) next[keyIndex - 1] = value;
            });
            return next;
        });
    };

    const handleQuestionFieldChange = (index: number, field: keyof QuizQuestion, value: string) => {
        setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
        setQuestionErrors((prev) => {
            if (!prev[index]?.[field]) return prev;
            const next = { ...prev, [index]: { ...prev[index] } };
            delete next[index][field];
            return next;
        });
    };

    const validateSingleField = (rules: Record<string, ValidationRule>, field: string, rawValue: string): string => {
        const rule = rules[field];
        if (!rule) return '';

        const value = (rawValue || '').trim();

        if (rule.required && !value) {
            return rule.errorMessages.required || 'This field is required';
        }
        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
            return rule.errorMessages.maxLength || `Must not exceed ${rule.maxLength} characters.`;
        }
        if (rule.pattern && value && !rule.pattern.test(value)) {
            return rule.errorMessages.pattern || 'Invalid format.';
        }
        return '';
    };

    const validate = (): boolean => {
        let isValid = true;

        const titleValidationError = validateSingleField(QUIZ_VALIDATION_RULES, 'title', title);
        if (titleValidationError) {
            setTitleError(titleValidationError);
            isValid = false;
        }

        if (!isEditMode && !courseId) {
            setCourseError('Course is required');
            isValid = false;
        }

        if (questions.length === 0) {
            isValid = false;
        }

        const newQuestionErrors: QuestionErrors = {};
        questions.forEach((q, index) => {
            const fieldErrors: Partial<Record<keyof QuizQuestion, string>> = {};
            (Object.keys(QUIZ_QUESTION_VALIDATION_RULES) as (keyof QuizQuestion)[]).forEach((field) => {
                const error = validateSingleField(QUIZ_QUESTION_VALIDATION_RULES, field, q[field] as string);
                if (error) fieldErrors[field] = error;
            });
            if (Object.keys(fieldErrors).length > 0) {
                newQuestionErrors[index] = fieldErrors;
                isValid = false;
            }
        });
        setQuestionErrors(newQuestionErrors);

        return isValid;
    };

    const handleSubmit = () => {
        if (!validate()) {
            showError(questions.length === 0 ? 'Please add at least one question' : 'Please fix the errors in the form');
            return;
        }

        const payloadQuestions = questions.map(({ questionText, optionA, optionB, optionC, optionD, correctOption }) => ({
            questionText,
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption,
        }));

        setIsSaving(true);

        if (isEditMode && id) {
            dispatch(updateQuiz({ id, title, questions: payloadQuestions }) as any);
        } else {
            dispatch(createQuiz({ courseId, title, questions: payloadQuestions }) as any);
        }
    };

    const handleCancel = () => {
        navigate('/quiz');
    };

    return {
        isEditMode,
        quizDetail,
        coursesArray,
        loading,
        isSaving,
        title,
        courseId,
        questions,
        titleError,
        courseError,
        questionErrors,
        handleTitleChange,
        handleCourseChange,
        addQuestion,
        removeQuestion,
        handleQuestionFieldChange,
        handleSubmit,
        handleCancel,
        toastMessages,
        hideToast,
    };
};
