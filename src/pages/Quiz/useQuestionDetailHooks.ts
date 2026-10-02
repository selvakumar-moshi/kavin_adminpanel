import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getQuizById, createQuiz, updateQuiz, getCourses } from '../../services/LearningAction';
import { emptyQuestion, parsePastedOptionsList, QUESTION_OPTION_KEYS, IMAGE_FIELD_NAMES, IMAGE_URL_FIELD_NAMES, type QuizQuestion, type QuizQuestionImages, type QuizQuestionImageFiles, type QuizRecord } from './Constant';
import type { CourseRecord } from '../Course/Constant';
import { QUIZ_VALIDATION_RULES, QUIZ_QUESTION_VALIDATION_RULES, type ValidationRule } from '../../utils/validationUtils';

type QuestionErrors = Record<number, Partial<Record<keyof QuizQuestion, string>>>;

// Client-only identity + image state — `images`/`imageFiles` are never sent as-is (handleSubmit
// rebuilds the multipart payload from imageFiles, and derives text fields directly from `question`)
export type KeyedQuizQuestion = QuizQuestion & { _key: number; images: QuizQuestionImages; imageFiles: QuizQuestionImageFiles };

// Client-only "Title and description" organizer block — never sent to the API, purely for editor layout
export interface KeyedSection {
    _key: number;
    title: string;
    description: string;
}

export type ListItem =
    | { type: 'question'; question: KeyedQuizQuestion }
    | { type: 'section'; section: KeyedSection };

export const getItemKey = (item: ListItem): number => (item.type === 'question' ? item.question._key : item.section._key);

// Module-level (not a ref/state) so key generation never touches React's render/hook rules
let itemKeySeed = 0;
const nextItemKey = () => ++itemKeySeed;

export const useQuestionDetailManagement = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { messages: toastMessages, showError, hideToast } = useToastMessages();

    // Hydrates preview state from an existing question's S3 URLs (edit mode); blank for a new question
    const makeKeyedQuestion = (q?: QuizQuestion): KeyedQuizQuestion => {
        const base = q || emptyQuestion();
        const images: QuizQuestionImages = {};
        (Object.keys(IMAGE_URL_FIELD_NAMES) as (keyof QuizQuestionImages)[]).forEach((imageKey) => {
            const url = base[IMAGE_URL_FIELD_NAMES[imageKey]] as string | undefined;
            if (url) images[imageKey] = url;
        });

        return {
            ...base,
            _key: nextItemKey(),
            images,
            imageFiles: {},
        };
    };

    const makeKeyedSection = (): KeyedSection => ({
        _key: nextItemKey(),
        title: '',
        description: '',
    });

    const [title, setTitle] = useState('');
    const [courseId, setCourseId] = useState('');
    const [quizToView, setQuizToView] = useState('');
    const [items, setItems] = useState<ListItem[]>(() => [{ type: 'question', question: makeKeyedQuestion() }]);
    const [titleError, setTitleError] = useState('');
    const [courseError, setCourseError] = useState('');
    const [quizToViewError, setQuizToViewError] = useState('');
    const [questionErrors, setQuestionErrors] = useState<QuestionErrors>({});
    const [isSaving, setIsSaving] = useState(false);
    const [applyMarkToAll, setApplyMarkToAll] = useState(false);

    const { QuizDetailData, CoursesData, apiStatus } = useSelector(
        (state: RootState) => state.learning
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
            setQuizToView(quizDetail.quizToView || '');
            setItems(
                quizDetail.questions && quizDetail.questions.length > 0
                    ? quizDetail.questions.map((q) => ({ type: 'question' as const, question: makeKeyedQuestion(q) }))
                    : [{ type: 'question', question: makeKeyedQuestion() }]
            );
        }
    }, [isEditMode, quizDetail, id]);

    useEffect(() => {
        if (!isSaving) return;

        if (saveStatus?.success) {
            setIsSaving(false);
            // Toast is shown by the Quiz list page after landing there — this page unmounts
            // immediately on navigate, so a toast raised here would vanish before it's seen.
            navigate('/quiz', {
                state: { toastMessage: isEditMode ? 'Quiz updated successfully!' : 'Quiz created successfully!' },
            });
        }

        if (saveStatus?.error) {
            showError(saveStatus.error);
            setIsSaving(false);
        }
    }, [saveStatus, isSaving, isEditMode, showError, navigate]);

    const handleTitleChange = (_name: string, value: string) => {
        setTitle(value);
        if (titleError) setTitleError('');
    };

    const handleCourseChange = (value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] || '' : value;
        setCourseId(stringValue);
        if (courseError) setCourseError('');
    };

    const handleQuizToViewChange = (value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] || '' : value;
        setQuizToView(stringValue);
        if (quizToViewError) setQuizToViewError('');
    };

    const insertItemAfter = (afterKey: number, newItem: ListItem) => {
        setItems((prev) => {
            const idx = prev.findIndex((it) => getItemKey(it) === afterKey);
            if (idx === -1) return [...prev, newItem];
            const next = [...prev];
            next.splice(idx + 1, 0, newItem);
            return next;
        });
    };

    const addQuestionAfter = (afterKey: number) => insertItemAfter(afterKey, { type: 'question', question: makeKeyedQuestion() });

    const addSectionAfter = (afterKey: number) => insertItemAfter(afterKey, { type: 'section', section: makeKeyedSection() });

    const removeItem = (key: number) => {
        setItems((prev) => prev.filter((it) => getItemKey(it) !== key));
        setQuestionErrors((prev) => {
            if (!(key in prev)) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const handleQuestionFieldChange = (key: number, field: keyof QuizQuestion, value: string) => {
        setItems((prev) => prev.map((it) => (
            it.type === 'question' && it.question._key === key
                ? { ...it, question: { ...it.question, [field]: value } }
                : it
        )));
        setQuestionErrors((prev) => {
            if (!prev[key]?.[field]) return prev;
            const next = { ...prev, [key]: { ...prev[key] } };
            delete next[key][field];
            return next;
        });
    };

    // When "applicable for all question" is checked, editing any question's mark cascades to every question
    const handleMarkChange = (key: number, value: string) => {
        setItems((prev) => prev.map((it) => (
            it.type === 'question' && (applyMarkToAll || it.question._key === key)
                ? { ...it, question: { ...it.question, mark: value } }
                : it
        )));
        setQuestionErrors((prev) => {
            const next = { ...prev };
            let changed = false;
            Object.keys(next).forEach((k) => {
                const numKey = Number(k);
                if ((applyMarkToAll || numKey === key) && next[numKey]?.mark) {
                    next[numKey] = { ...next[numKey] };
                    delete next[numKey].mark;
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    };

    const handleApplyMarkToAllChange = (checked: boolean) => {
        setApplyMarkToAll(checked);
        if (!checked) return;

        const firstQuestion = items.find((it): it is { type: 'question'; question: KeyedQuizQuestion } => it.type === 'question');
        const markValue = firstQuestion?.question.mark || '';

        setItems((prev) => prev.map((it) => (
            it.type === 'question' ? { ...it, question: { ...it.question, mark: markValue } } : it
        )));
        setQuestionErrors((prev) => {
            const next = { ...prev };
            let changed = false;
            Object.keys(next).forEach((k) => {
                const numKey = Number(k);
                if (next[numKey]?.mark) {
                    next[numKey] = { ...next[numKey] };
                    delete next[numKey].mark;
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    };

    const handleSectionFieldChange = (key: number, field: keyof Omit<KeyedSection, '_key'>, value: string) => {
        setItems((prev) => prev.map((it) => (
            it.type === 'section' && it.section._key === key
                ? { ...it, section: { ...it.section, [field]: value } }
                : it
        )));
    };

    const handleImageChange = (key: number, imageKey: keyof QuizQuestionImages, file: File, previewUrl: string) => {
        setItems((prev) => prev.map((it) => (
            it.type === 'question' && it.question._key === key
                ? {
                    ...it,
                    question: {
                        ...it.question,
                        images: { ...it.question.images, [imageKey]: previewUrl },
                        imageFiles: { ...it.question.imageFiles, [imageKey]: file },
                    },
                }
                : it
        )));
    };

    const handleImageRemove = (key: number, imageKey: keyof QuizQuestionImages) => {
        setItems((prev) => prev.map((it) => {
            if (it.type !== 'question' || it.question._key !== key) return it;
            const images = { ...it.question.images };
            delete images[imageKey];
            const imageFiles = { ...it.question.imageFiles };
            delete imageFiles[imageKey];
            return { ...it, question: { ...it.question, images, imageFiles } };
        }));
    };

    // Applies a multi-line paste across option A-D in order (keeps each line's text as-is)
    const applySmartOptionsPaste = (key: number, pastedText: string): boolean => {
        if (!pastedText.includes('\n')) return false;
        const parsedLines = parsePastedOptionsList(pastedText);
        if (parsedLines.length < 2) return false;

        setItems((prev) => prev.map((it) => {
            if (it.type !== 'question' || it.question._key !== key) return it;
            const updatedQuestion = { ...it.question };
            QUESTION_OPTION_KEYS.forEach((optionKey, keyIndex) => {
                if (parsedLines[keyIndex] !== undefined) updatedQuestion[optionKey] = parsedLines[keyIndex];
            });
            return { ...it, question: updatedQuestion };
        }));
        setQuestionErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev, [key]: { ...prev[key] } };
            QUESTION_OPTION_KEYS.forEach((optionKey) => delete next[key][optionKey]);
            return next;
        });
        return true;
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

    const questions = items.filter((it): it is { type: 'question'; question: KeyedQuizQuestion } => it.type === 'question').map((it) => it.question);

    const validate = (): boolean => {
        let isValid = true;

        const titleValidationError = validateSingleField(QUIZ_VALIDATION_RULES, 'title', title);
        if (titleValidationError) {
            setTitleError(titleValidationError);
            isValid = false;
        }

        const quizToViewValidationError = validateSingleField(QUIZ_VALIDATION_RULES, 'quizToView', quizToView);
        if (quizToViewValidationError) {
            setQuizToViewError(quizToViewValidationError);
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
        questions.forEach((q) => {
            const fieldErrors: Partial<Record<keyof QuizQuestion, string>> = {};
            (Object.keys(QUIZ_QUESTION_VALIDATION_RULES) as (keyof QuizQuestion)[]).forEach((field) => {
                const error = validateSingleField(QUIZ_QUESTION_VALIDATION_RULES, field, q[field] as string);
                if (error) fieldErrors[field] = error;
            });
            if (Object.keys(fieldErrors).length > 0) {
                newQuestionErrors[q._key] = fieldErrors;
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

        const formData = new FormData();
        formData.append('title', title);
        formData.append('quizToView', quizToView);
        if (!isEditMode) formData.append('courseId', courseId);

        // ASP.NET Core's [FromForm] binder expects dot notation for List<T> items (e.g. "questions[0].questionText"),
        // not bracket-in-bracket — IFormFile properties in particular only bind on an exact path match.
        questions.forEach((q, index) => {
            formData.append(`questions[${index}].questionText`, q.questionText);
            formData.append(`questions[${index}].optionA`, q.optionA);
            formData.append(`questions[${index}].optionB`, q.optionB);
            formData.append(`questions[${index}].optionC`, q.optionC);
            formData.append(`questions[${index}].optionD`, q.optionD);
            formData.append(`questions[${index}].correctOption`, q.correctOption);
            formData.append(`questions[${index}].mark`, q.mark);

            (Object.keys(IMAGE_FIELD_NAMES) as (keyof QuizQuestionImages)[]).forEach((imageKey) => {
                const file = q.imageFiles[imageKey];
                if (file) formData.append(`questions[${index}].${IMAGE_FIELD_NAMES[imageKey]}`, file);
            });
        });

        setIsSaving(true);

        if (isEditMode && id) {
            dispatch(updateQuiz({ id, formData }) as any);
        } else {
            dispatch(createQuiz(formData) as any);
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
        quizToView,
        items,
        questionCount: questions.length,
        titleError,
        courseError,
        quizToViewError,
        questionErrors,
        applyMarkToAll,
        handleTitleChange,
        handleCourseChange,
        handleQuizToViewChange,
        addQuestionAfter,
        addSectionAfter,
        removeItem,
        handleQuestionFieldChange,
        handleMarkChange,
        handleApplyMarkToAllChange,
        handleSectionFieldChange,
        handleImageChange,
        handleImageRemove,
        applySmartOptionsPaste,
        handleSubmit,
        handleCancel,
        toastMessages,
        hideToast,
    };
};
