import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { UploadFile } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getQuizById, createQuiz, updateQuiz, getCourses, getBatches } from '../../services/LearningAction';
import superSalesAPI from '../../services/LearningAPI';
import { savingOverlay, waitForPaint } from '../../components/SavingOverlay/SavingOverlay';
import { usesFolderSelector, isCourseLessQuizType, emptyQuestion, parsePastedOptionsList, QUESTION_OPTION_KEYS, IMAGE_FIELD_NAMES, IMAGE_URL_FIELD_NAMES, type QuizQuestion, type QuizQuestionImages, type QuizQuestionImageFiles, type QuizRecord } from './Constant';
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
const FOLDER_QUIZ_TO_VIEW = 'Free';
const SCHOOL_QUIZ_TYPE = 'school';
// uid of the already-saved document shown in the upload box while editing
const SAVED_SOURCE_FILE_UID = 'saved-source-file';

// Which image slot can stand in for a text field of a question
const TEXT_FIELD_IMAGE_KEYS: Partial<Record<keyof QuizQuestion, string>> = {
    questionText: 'question',
    optionA: 'optionA',
    optionB: 'optionB',
    optionC: 'optionC',
    optionD: 'optionD',
};

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
    const [batchError, setBatchError] = useState('');
    const [quizAttempt, setQuizAttempt] = useState('');
    const [quizAttemptError, setQuizAttemptError] = useState('');
    const [quizToViewError, setQuizToViewError] = useState('');
    const [questionErrors, setQuestionErrors] = useState<QuestionErrors>({});
    const [isSaving, setIsSaving] = useState(false);
    // On by default: the first question's mark is used for every question until the admin unchecks it
    const [applyMarkToAll, setApplyMarkToAll] = useState(true);
    // Latest values for the async import, which outlives the render that started it
    const itemsRef = useRef(items);
    const applyMarkToAllRef = useRef(applyMarkToAll);
    useEffect(() => {
        itemsRef.current = items;
        applyMarkToAllRef.current = applyMarkToAll;
    }, [items, applyMarkToAll]);

    // Optional document (PDF etc.) the questions are imported from; also sent to the API when the quiz is created
    const [quizFileList, setQuizFileList] = useState<UploadFile[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    // Confirmation shown before the saved document is removed from the quiz
    const [isRemoveDocumentOpen, setIsRemoveDocumentOpen] = useState(false);
    const [isRemovingDocument, setIsRemovingDocument] = useState(false);
    // Problems the import service flagged (e.g. a missing option) — listed under the upload for the admin to check
    const [importWarnings, setImportWarnings] = useState<ImportWarning[]>([]);
    // Questions the import service could not read (with the reason), and how many it found in the document
    const [importSkipped, setImportSkipped] = useState<ImportWarning[]>([]);
    const [importTotalFound, setImportTotalFound] = useState(0);

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
    const createState = location.state as { quizType?: string; quizToView?: string } | null;
    const createQuizType = createState?.quizType;
    // Create: Quiz To View comes from the tab (Competitive = Paid, Free MCQ = Free), so it isn't asked for again
    const fixedQuizToView = !isEditMode ? createState?.quizToView : undefined;
    const quizType = (isEditMode ? quizDetail?.quizType : createQuizType) || DEFAULT_QUIZ_TYPE;

    // Previous Year quizzes live in a folder instead of having a Quiz To View / course / batch: they are always Free
    const isFolderQuiz = usesFolderSelector(quizType);
    // Daily and Current Affairs quizzes belong to no course / batch
    const isCourseLess = isCourseLessQuizType(quizType);
    // Creating a competitive quiz (Paid or Free) needs a course and a batch
    const courseBatchRequired = !isEditMode && !isFolderQuiz && !isCourseLess;
    const quizToView = isFolderQuiz ? FOLDER_QUIZ_TO_VIEW : fixedQuizToView ?? quizToViewInput;
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
            setQuizAttempt(quizDetail.quizAttempt == null ? '' : String(quizDetail.quizAttempt));
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
            // A saved quiz whose questions carry different marks must not be flattened (or have its marks locked)
            setApplyMarkToAll(keyedQuestions.every((q) => q.mark === keyedQuestions[0].mark));

            // The document this quiz was created from is listed in the upload box (no originFileObj, so it is never re-imported)
            setQuizFileList(quizDetail.sourceFileName
                ? [{ uid: SAVED_SOURCE_FILE_UID, name: quizDetail.sourceFileName, status: 'done', url: quizDetail.sourceFileUrl || undefined }]
                : []);
        }
    }, [isEditMode, quizDetail, id, dispatch]);

    useEffect(() => {
        if (!isSaving) return;

        if (saveStatus?.success) {
            setIsSaving(false);
            savingOverlay.hide();
            if (onSaved) {
                // Embedded form (School Book Revision): the host page closes the form and shows the toast
                onSaved();
            } else {
                // Toast is shown by the Quiz list page after landing there — this page unmounts
                // immediately on navigate, so a toast raised here would vanish before it's seen.
                navigate('/quiz', {
                    state: { toastMessage: isEditMode ? 'Quiz updated successfully!' : 'Quiz created successfully!', quizType, quizToView },
                });
            }
        }

        if (saveStatus?.error) {
            showError(saveStatus.error);
            setIsSaving(false);
            savingOverlay.hide();
        }
    }, [saveStatus, isSaving, isEditMode, showError, navigate, onSaved, quizType, quizToView]);

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
        if (batchError) setBatchError('');
    };

    const handleQuizAttemptChange = (_name: string, value: string) => {
        setQuizAttempt(value);
        if (quizAttemptError) setQuizAttemptError('');
    };

    // Optional; when filled it must be a whole number of at least 1
    const validateQuizAttempt = (): boolean => {
        const value = quizAttempt.trim();
        if (value && !/^[1-9]\d*$/.test(value)) {
            setQuizAttemptError('Enter a whole number of 1 or more');
            return false;
        }
        return true;
    };

    const appendQuizAttempt = (formData: FormData) => {
        const value = quizAttempt.trim();
        if (value) formData.append('quizAttempt', value);
    };

    const handleQuizToViewChange = (value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] || '' : value;
        setQuizToView(stringValue);
        if (quizToViewError) setQuizToViewError('');
        // Course and batch are only required for Paid; a Free quiz may still carry them
        if (stringValue !== PAID_QUIZ) setCourseError('');
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
        setImportSkipped([]);
        setImportTotalFound(0);
        try {
            const res = await superSalesAPI.importQuiz(file);
            if (requestId !== importRequestIdRef.current) return;

            const data = res?.data?.data;
            const importedQuestions: ImportedQuestion[] = Array.isArray(data?.questions) ? data.questions : [];
            // Shown under the upload, even when nothing could be read
            setImportSkipped(Array.isArray(data?.skipped) ? data.skipped : []);
            setImportTotalFound(Number(data?.totalFoundInDocument) || 0);

            if (importedQuestions.length === 0) {
                showError(res?.data?.message || 'No questions could be read from the document');
                setQuizFileList([]);
                return;
            }

            // Taken from the questions as they are now, i.e. before a blank placeholder that holds the mark is replaced
            const markForImported = applyMarkToAllRef.current
                ? (itemsRef.current.find((it) => it.type === 'question') as { question: KeyedQuizQuestion } | undefined)?.question.mark || ''
                : '';
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
                    mark: markForImported,
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

    // Deleting the saved document: the quiz is updated right away with { removeSourceFile: true }, and the questions
    // on the right (they came from that document) are cleared. The file stays listed if the request fails.
    const removeSavedSourceFile = async () => {
        if (!id) return;
        setIsRemovingDocument(true);
        try {
            const res = await superSalesAPI.removeQuizSourceFile(id);
            setQuizFileList([]);
            setItems([{ type: 'question', question: makeKeyedQuestion() }]);
            setQuestionErrors({});
            originalQuestionValuesRef.current = new Map();
            importedKeysRef.current = new Set();
            showSuccess(res?.data?.message || 'Document removed');
        } catch (error: any) {
            showError(error?.response?.data?.message || error?.message || 'Failed to remove the document');
        } finally {
            setIsRemovingDocument(false);
            setIsRemoveDocumentOpen(false);
        }
    };

    const handleQuizFileChange = (files: UploadFile[]) => {
        // Editing: a listed file that was not just picked is the saved one; deleting it asks first, then calls the API
        const hasSavedFile = isEditMode && quizFileList.some((file) => !file.originFileObj);
        if (hasSavedFile && files.length === 0) {
            setIsRemoveDocumentOpen(true);
            return;
        }

        setQuizFileList(files);

        if (files.length === 0) {
            // File removed: cancel any import still in flight and clear everything that came from it
            importRequestIdRef.current += 1;
            setIsImporting(false);
            setImportWarnings([]);
            setImportSkipped([]);
            setImportTotalFound(0);
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

    // Mark of the first question, which new and imported questions copy while "applicable for all" is checked
    const sharedMark = () => {
        if (!applyMarkToAll) return '';
        const first = items.find((it): it is { type: 'question'; question: KeyedQuizQuestion } => it.type === 'question');
        return first?.question.mark || '';
    };

    const addQuestionAfter = (afterKey: number) =>
        insertItemAfter(afterKey, { type: 'question', question: makeKeyedQuestion({ ...emptyQuestion(), mark: sharedMark() }) });

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
        // The picture takes the place of that text, so a "Required" error on it no longer applies
        const textField = imageKey === 'question' ? 'questionText' : imageKey;
        setQuestionErrors((prev) => {
            if (!prev[key]?.[textField as keyof QuizQuestion]) return prev;
            const next = { ...prev, [key]: { ...prev[key] } };
            delete next[key][textField as keyof QuizQuestion];
            return next;
        });
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

        if (courseBatchRequired && !courseId) {
            setCourseError('Course is required');
            isValid = false;
        }
        if (courseBatchRequired && !batchId) {
            setBatchError('Batch is required');
            isValid = false;
        }

        if (!validateQuizAttempt()) {
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
                // The question text and the options may be an image instead of text
                if (field !== 'mark' && field !== 'correctOption' && q.images[TEXT_FIELD_IMAGE_KEYS[field] as keyof QuizQuestionImages]) return;
                const error = validateSingleField(QUIZ_QUESTION_VALIDATION_RULES, field, q[field] as string);
                if (error) fieldErrors[field] = error;
            });
            // Option D may be left empty, but then it can't be the correct answer
            if (q.correctOption === 'D' && !q.optionD.trim() && !q.images.optionD) {
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

    // A newly uploaded document, sent as `sourceFile` on create and update (the saved one has no file object, so it is never re-sent)
    const appendSourceFile = (formData: FormData) => {
        const sourceFile = quizFileList[0]?.originFileObj;
        if (!sourceFile) return;
        // formData.append('file', sourceFile);
        formData.append('sourceFile', sourceFile);
    };

    // Full-screen "Saving..." indicator, painted before the heavy work of a save begins; it stays until the request ends
    // (success leaves the page, a failure hides it)
    const beginSaving = async () => {
        savingOverlay.show(isEditMode ? 'Updating quiz...' : 'Creating quiz...');
        await waitForPaint();
    };

    // School Book Revision quiz: sent with its title, always as a Free quiz (no course/batch), the
    // folder / sub folder picked on that form, and the questions
    const submitSchoolBookQuiz = async (fields: Record<string, string>) => {
        // The indicator goes up before the (slow, for a big quiz) check and request building start
        await beginSaving();
        const titleValidationError = validateSingleField(QUIZ_VALIDATION_RULES, 'title', title);
        if (titleValidationError) setTitleError(titleValidationError);
        const attemptValid = validateQuizAttempt();

        // Run the question check even when the title failed, so every error shows at once
        const questionsValid = validateQuestions();
        if (titleValidationError || !attemptValid || !questionsValid) {
            savingOverlay.hide();
            showError(questions.length === 0 ? 'Please add at least one question' : 'Please fix the errors in the form');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('quizToView', SCHOOL_QUIZ_TO_VIEW);
        formData.append('quizType', SCHOOL_QUIZ_TYPE);
        appendQuizAttempt(formData);
        Object.entries(fields).forEach(([name, value]) => formData.append(name, value));
        appendSourceFile(formData);
        appendQuestionsToFormData(formData);

        setIsSaving(true);
        dispatch(createQuiz(formData) as any);
    };

    // `extraFields` are added to the request as-is (e.g. the folder / sub folder of a folder based quiz)
    const handleSubmit = async (extraFields?: Record<string, string>) => {
        // The indicator goes up before the (slow, for a big quiz) check and request building start
        await beginSaving();
        if (!validate()) {
            savingOverlay.hide();
            showError(questions.length === 0 ? 'Please add at least one question' : 'Please fix the errors in the form');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('quizToView', quizToView);
        formData.append('quizType', quizType);
        if (extraFields) Object.entries(extraFields).forEach(([name, value]) => formData.append(name, value));
        appendQuizAttempt(formData);
        // Course / batch go with competitive quizzes, Paid and Free alike (the course can't change once the quiz exists);
        // a Daily quiz has neither
        if (!isCourseLess && !isFolderQuiz) {
            if (isPaid || batchId) formData.append('batchId', batchId);
            if (!isEditMode && courseId) formData.append('courseId', courseId);
        }

        appendSourceFile(formData);

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
        navigate('/quiz', { state: { quizType, quizToView } });
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
        isQuizToViewFixed: fixedQuizToView !== undefined,
        isPaid,
        quizType,
        isFolderQuiz,
        items,
        questionCount: questions.length,
        titleError,
        courseError,
        batchError,
        quizAttempt,
        quizAttemptError,
        handleQuizAttemptChange,
        isCourseLess,
        quizToViewError,
        questionErrors,
        applyMarkToAll,
        quizFileList,
        isImporting,
        importWarnings,
        importSkipped,
        importTotalFound,
        handleQuizFileChange,
        documentRemoval: {
            open: isRemoveDocumentOpen,
            loading: isRemovingDocument,
            onConfirm: removeSavedSourceFile,
            onCancel: () => setIsRemoveDocumentOpen(false),
        },
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
