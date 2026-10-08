import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { UploadFile } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getQuizById, createQuiz, updateQuiz, getCourses, getBatches } from '../../services/LearningAction';
import superSalesAPI from '../../services/LearningAPI';
import { emptyQuestion, parsePastedOptionsList, QUESTION_OPTION_KEYS, IMAGE_FIELD_NAMES, IMAGE_URL_FIELD_NAMES, type QuizQuestion, type QuizQuestionImages, type QuizQuestionImageFiles, type QuizRecord } from './Constant';
import type { CourseRecord, BatchRecord } from '../Course/Constant';
import { QUIZ_VALIDATION_RULES, QUIZ_QUESTION_VALIDATION_RULES, type ValidationRule } from '../../utils/validationUtils';

type QuestionErrors = Record<number, Partial<Record<keyof QuizQuestion, string>>>;

// Client-only identity + image state — `images`/`imageFiles` are never sent as-is (handleSubmit
// rebuilds the multipart payload from imageFiles, and derives text fields directly from `question`)
export type KeyedQuizQuestion = QuizQuestion & { _key: number; images: QuizQuestionImages; imageFiles: QuizQuestionImageFiles };

// "Quiz To View" value that makes Course and Batch applicable
const PAID_QUIZ = 'Paid';
// School Book Revision quizzes are always created as Free
const SCHOOL_QUIZ_TO_VIEW = 'Free';
// `quizType` values (same as the Quiz tab keys)
const DEFAULT_QUIZ_TYPE = 'competitive';
const FOLDER_QUIZ_TYPE = 'previousYear';
const FOLDER_QUIZ_TO_VIEW = 'Free';
const SCHOOL_QUIZ_TYPE = 'school';

// Shape of /Quiz/import's `data.questions` / `data.warnings` entries
interface ImportedQuestion {
    documentNumber: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
}

interface ImportWarning {
    documentNumber: number;
    reason: string;
}

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

export const useQuestionDetailManagement = (onSaved?: () => void) => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

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
            // API returns mark as a number; the form/validation treat it as a string
            mark: base.mark == null ? '' : String(base.mark),
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
    const [batchId, setBatchId] = useState('');
    const [quizToViewInput, setQuizToView] = useState('');
    const [items, setItems] = useState<ListItem[]>(() => [{ type: 'question', question: makeKeyedQuestion() }]);
    const [titleError, setTitleError] = useState('');
    const [courseError, setCourseError] = useState('');
    const [quizToViewError, setQuizToViewError] = useState('');
    const [questionErrors, setQuestionErrors] = useState<QuestionErrors>({});
    const [isSaving, setIsSaving] = useState(false);
    const [applyMarkToAll, setApplyMarkToAll] = useState(false);

    // Optional document (PDF etc.) the questions are imported from; also sent to the API when the quiz is created
    const [quizFileList, setQuizFileList] = useState<UploadFile[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    // Problems the import service flagged (e.g. a missing option) — listed under the upload for the admin to check
    const [importWarnings, setImportWarnings] = useState<ImportWarning[]>([]);

    // Snapshots of the as-loaded values, so editing an existing quiz never gets blocked by
    // validation rules (e.g. "mark") added after that quiz/question was already saved — only
    // fields the admin actually changes during this session are held to the current rules.
    const originalTitleRef = useRef('');
    const originalQuizToViewRef = useRef('');
    const originalQuestionValuesRef = useRef<Map<number, QuizQuestion>>(new Map());

    const { QuizDetailData, CoursesData, BatchesData, apiStatus } = useSelector(
        (state: RootState) => state.learning
    );

    const quizDetail = QuizDetailData as QuizRecord | null;

    // Create: the tab the Add Quiz button was clicked on (passed through navigation state).
    // Update: keeps the type the quiz already has. Falls back to "competitive" if neither is known.
    const createQuizType = (location.state as { quizType?: string } | null)?.quizType;
    const quizType = (isEditMode ? quizDetail?.quizType : createQuizType) || DEFAULT_QUIZ_TYPE;

    // Previous Year quizzes live in a folder instead of having a Quiz To View / course / batch: they are always Free
    const isFolderQuiz = quizType === FOLDER_QUIZ_TYPE;
    const quizToView = isFolderQuiz ? FOLDER_QUIZ_TO_VIEW : quizToViewInput;
    const isPaid = quizToView === PAID_QUIZ;
    const coursesArray = Array.isArray(CoursesData) ? (CoursesData as CourseRecord[]) : [];
    const batchesArray = Array.isArray(BatchesData?.items) ? (BatchesData.items as BatchRecord[]) : [];
    const loading = apiStatus.QuizDetailData?.loading || false;
    const batchesLoading = apiStatus.BatchesData?.loading || false;
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
            setBatchId(quizDetail.batchId || '');
            setQuizToView(quizDetail.quizToView || '');
            originalTitleRef.current = quizDetail.title || '';
            originalQuizToViewRef.current = quizDetail.quizToView || '';
            if (quizDetail.courseId) {
                dispatch(getBatches({ courseId: quizDetail.courseId, pageSize: 100 }) as any);
            }

            const keyedQuestions = quizDetail.questions && quizDetail.questions.length > 0
                ? quizDetail.questions.map((q) => makeKeyedQuestion(q))
                : [makeKeyedQuestion()];

            const originalValues = new Map<number, QuizQuestion>();
            keyedQuestions.forEach((kq) => originalValues.set(kq._key, { ...kq }));
            originalQuestionValuesRef.current = originalValues;

            setItems(keyedQuestions.map((question) => ({ type: 'question' as const, question })));
        }
    }, [isEditMode, quizDetail, id, dispatch]);

    useEffect(() => {
        if (!isSaving) return;

        if (saveStatus?.success) {
            setIsSaving(false);
            if (onSaved) {
                // Embedded form (School Book Revision): the host page closes the form and shows the toast
                onSaved();
            } else {
                // Toast is shown by the Quiz list page after landing there — this page unmounts
                // immediately on navigate, so a toast raised here would vanish before it's seen.
                navigate('/quiz', {
                    state: { toastMessage: isEditMode ? 'Quiz updated successfully!' : 'Quiz created successfully!', quizType },
                });
            }
        }

        if (saveStatus?.error) {
            showError(saveStatus.error);
            setIsSaving(false);
        }
    }, [saveStatus, isSaving, isEditMode, showError, navigate, onSaved, quizType]);

    const handleTitleChange = (_name: string, value: string) => {
        setTitle(value);
        if (titleError) setTitleError('');
    };

    const handleCourseChange = (value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] || '' : value;
        setCourseId(stringValue);
        if (courseError) setCourseError('');

        setBatchId('');
        if (stringValue) {
            dispatch(getBatches({ courseId: stringValue, pageSize: 100 }) as any);
        }
    };

    const handleBatchChange = (value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] || '' : value;
        setBatchId(stringValue);
    };

    const handleQuizToViewChange = (value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] || '' : value;
        setQuizToView(stringValue);
        if (quizToViewError) setQuizToViewError('');

        // Course and batch only apply to paid quizzes — switching to Free drops whatever was picked
        if (stringValue !== PAID_QUIZ) {
            setBatchId('');
            if (!isEditMode) setCourseId('');
            setCourseError('');
        }
    };

    const isBlankQuestion = (q: QuizQuestion) =>
        !q.questionText.trim() && !q.optionA.trim() && !q.optionB.trim() && !q.optionC.trim() && !q.optionD.trim() && !q.correctOption;

    // Keys of the questions that came from the uploaded file, so removing/replacing the file removes exactly those
    const importedKeysRef = useRef<Set<number>>(new Set());
    // Bumped on every upload/delete so a slow import response for a file that's since been removed or replaced is ignored
    const importRequestIdRef = useRef(0);

    // Drops the questions imported from the file; keeps anything the admin typed, and never leaves the list empty
    const removeImportedItems = () => {
        const keys = importedKeysRef.current;
        if (keys.size === 0) return;
        importedKeysRef.current = new Set();

        setItems((prev) => {
            const rest = prev.filter((it) => !keys.has(getItemKey(it)));
            return rest.length > 0 ? rest : [{ type: 'question', question: makeKeyedQuestion() }];
        });
        setQuestionErrors((prev) => {
            const next = { ...prev };
            keys.forEach((key) => delete next[key]);
            return next;
        });
    };

    // Reads the uploaded document through /Quiz/import and fills the question list from the response.
    // Blank placeholder questions are replaced; questions the admin already typed are kept and the imported ones follow.
    const importQuestionsFromFile = async (file: File) => {
        const requestId = ++importRequestIdRef.current;
        setIsImporting(true);
        setImportWarnings([]);
        try {
            const res = await superSalesAPI.importQuiz(file);
            if (requestId !== importRequestIdRef.current) return;

            const data = res?.data?.data;
            const importedQuestions: ImportedQuestion[] = Array.isArray(data?.questions) ? data.questions : [];

            if (importedQuestions.length === 0) {
                showError(res?.data?.message || 'No questions could be read from the document');
                setQuizFileList([]);
                return;
            }

            const imported: ListItem[] = importedQuestions.map((q) => ({
                type: 'question' as const,
                question: makeKeyedQuestion({
                    ...emptyQuestion(),
                    questionText: q.questionText || '',
                    optionA: q.optionA || '',
                    optionB: q.optionB || '',
                    optionC: q.optionC || '',
                    optionD: q.optionD || '',
                    correctOption: q.correctOption || '',
                }),
            }));

            // Anything from a previous import goes first, so a second upload never stacks on top of the first
            const previousKeys = importedKeysRef.current;
            importedKeysRef.current = new Set(imported.map(getItemKey));

            setItems((prev) => [
                ...prev.filter((it) => !previousKeys.has(getItemKey(it)) && (it.type === 'section' || !isBlankQuestion(it.question))),
                ...imported,
            ]);
            setQuestionErrors((prev) => {
                const next = { ...prev };
                previousKeys.forEach((key) => delete next[key]);
                return next;
            });
            showSuccess(res?.data?.message || `${importedQuestions.length} questions imported`);

            setImportWarnings(Array.isArray(data?.warnings) ? data.warnings : []);
        } catch (error: any) {
            if (requestId !== importRequestIdRef.current) return;
            showError(error?.response?.data?.message || error?.message || 'Failed to read questions from the document');
            setQuizFileList([]);
        } finally {
            if (requestId === importRequestIdRef.current) setIsImporting(false);
        }
    };

    const handleQuizFileChange = (files: UploadFile[]) => {
        setQuizFileList(files);

        if (files.length === 0) {
            // File removed: cancel any import still in flight and clear everything that came from it
            importRequestIdRef.current += 1;
            setIsImporting(false);
            setImportWarnings([]);
            removeImportedItems();
            return;
        }

        const file = files[0]?.originFileObj;
        if (file) {
            importQuestionsFromFile(file as File);
        }
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

        const value = String(rawValue ?? '').trim();

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

        // Edit mode: values the admin left untouched (e.g. an empty mark saved earlier) are not re-validated
        const titleValidationError = isEditMode && title === originalTitleRef.current
            ? ''
            : validateSingleField(QUIZ_VALIDATION_RULES, 'title', title);
        if (titleValidationError) {
            setTitleError(titleValidationError);
            isValid = false;
        }

        const quizToViewValidationError = isEditMode && quizToView === originalQuizToViewRef.current
            ? ''
            : validateSingleField(QUIZ_VALIDATION_RULES, 'quizToView', quizToView);
        if (quizToViewValidationError) {
            setQuizToViewError(quizToViewValidationError);
            isValid = false;
        }

        if (!isEditMode && isPaid && !courseId) {
            setCourseError('Course is required');
            isValid = false;
        }

        if (!validateQuestions()) {
            isValid = false;
        }

        return isValid;
    };

    // Checks every question (and that there is at least one); shows the errors on the cards
    const validateQuestions = (): boolean => {
        let isValid = questions.length > 0;

        const newQuestionErrors: QuestionErrors = {};
        questions.forEach((q) => {
            const original = isEditMode ? originalQuestionValuesRef.current.get(q._key) : undefined;
            const fieldErrors: Partial<Record<keyof QuizQuestion, string>> = {};
            (Object.keys(QUIZ_QUESTION_VALIDATION_RULES) as (keyof QuizQuestion)[]).forEach((field) => {
                if (original && original[field] === q[field]) return;
                const error = validateSingleField(QUIZ_QUESTION_VALIDATION_RULES, field, q[field] as string);
                if (error) fieldErrors[field] = error;
            });
            // Option D may be left empty, but then it can't be the correct answer
            if (q.correctOption === 'D' && !q.optionD.trim()) {
                fieldErrors.correctOption = 'Option D is empty';
            }
            if (Object.keys(fieldErrors).length > 0) {
                newQuestionErrors[q._key] = fieldErrors;
                isValid = false;
            }
        });
        setQuestionErrors(newQuestionErrors);

        return isValid;
    };

    // ASP.NET Core's [FromForm] binder expects dot notation for List<T> items (e.g. "questions[0].questionText"),
    // not bracket-in-bracket — IFormFile properties in particular only bind on an exact path match.
    const appendQuestionsToFormData = (formData: FormData) => {
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
    };

    // School Book Revision quiz: sent with its title, always as a Free quiz (no course/batch), the
    // subject / category / standard / part picked on that form, and the questions
    const submitSchoolBookQuiz = (fields: Record<string, string>) => {
        const titleValidationError = validateSingleField(QUIZ_VALIDATION_RULES, 'title', title);
        if (titleValidationError) setTitleError(titleValidationError);

        // Run the question check even when the title failed, so every error shows at once
        const questionsValid = validateQuestions();
        if (titleValidationError || !questionsValid) {
            showError(questions.length === 0 ? 'Please add at least one question' : 'Please fix the errors in the form');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('quizToView', SCHOOL_QUIZ_TO_VIEW);
        formData.append('quizType', SCHOOL_QUIZ_TYPE);
        Object.entries(fields).forEach(([name, value]) => formData.append(name, value));
        appendQuestionsToFormData(formData);

        setIsSaving(true);
        dispatch(createQuiz(formData) as any);
    };

    // `extraFields` are added to the request as-is (e.g. the subject / standard / part of a School Book quiz)
    const handleSubmit = (extraFields?: Record<string, string>) => {
        if (!validate()) {
            showError(questions.length === 0 ? 'Please add at least one question' : 'Please fix the errors in the form');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('quizToView', quizToView);
        formData.append('quizType', quizType);
        if (extraFields) Object.entries(extraFields).forEach(([name, value]) => formData.append(name, value));
        // Course / batch only exist for paid quizzes; a free quiz is sent without them
        if (isPaid) {
            formData.append('batchId', batchId);
            if (!isEditMode) formData.append('courseId', courseId);
        }

        // const quizFile = quizFileList[0]?.originFileObj;
        // if (!isEditMode && quizFile) formData.append('file', quizFile);

        appendQuestionsToFormData(formData);

        setIsSaving(true);

        if (isEditMode && id) {
            dispatch(updateQuiz({ id, formData }) as any);
        } else {
            dispatch(createQuiz(formData) as any);
        }
    };

    // Back to the list on the tab this quiz belongs to
    const handleCancel = () => {
        navigate('/quiz', { state: { quizType } });
    };

    return {
        isEditMode,
        quizDetail,
        coursesArray,
        batchesArray,
        batchesLoading,
        loading,
        isSaving,
        title,
        courseId,
        batchId,
        quizToView,
        isPaid,
        quizType,
        isFolderQuiz,
        items,
        questionCount: questions.length,
        titleError,
        courseError,
        quizToViewError,
        questionErrors,
        applyMarkToAll,
        quizFileList,
        isImporting,
        importWarnings,
        handleQuizFileChange,
        handleTitleChange,
        handleCourseChange,
        handleBatchChange,
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
        submitSchoolBookQuiz,
        handleCancel,
        toastMessages,
        hideToast,
    };
};
