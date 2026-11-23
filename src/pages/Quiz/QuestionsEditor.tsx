import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Tooltip } from 'antd';
import { CloseCircleFilled, PictureOutlined } from '@ant-design/icons';
import InputFields from '../../components/InputFields/InputFields';
import { RichTextEditor } from '../../components/RichTextEditor';
import DropdownField from '../../components/DropdownField/DropdownField';
import Checkbox from '../../components/Checkbox/Checkbox';
import PageTitle from '../../components/PageTitle';
import Button from '../../components/Button/Button';
import { getItemKey, type ListItem } from './useQuestionDetailHooks';
import { CORRECT_OPTION_CHOICES, QUESTION_ITEM_RAIL_ACTIONS, type QuizQuestion, type QuizQuestionImages } from './Constant';
import delete_Icon from '../../assets/delete_Icon2.svg';

export interface QuestionsEditorProps {
    items: ListItem[];
    questionCount: number;
    questionErrors: Record<number, Partial<Record<keyof QuizQuestion, string>>>;
    passageErrors: Record<number, string>;
    applyMarkToAll: boolean;
    isSaving: boolean;
    addQuestionAfter: (afterKey: number) => void;
    addPassage: () => void;
    addQuestionAtEnd: () => void;
    handlePassageChange: (key: number, text: string) => void;
    addSectionAfter: (afterKey: number) => void;
    removeItem: (key: number) => void;
    handleQuestionFieldChange: (key: number, field: keyof QuizQuestion, value: string) => void;
    handleMarkChange: (key: number, value: string) => void;
    handleApplyMarkToAllChange: (checked: boolean) => void;
    handleSectionFieldChange: (key: number, field: 'title' | 'description', value: string) => void;
    handleImageChange: (key: number, imageKey: keyof QuizQuestionImages, file: File, previewUrl: string) => void;
    handleImageRemove: (key: number, imageKey: keyof QuizQuestionImages) => void;
    applySmartOptionsPaste: (key: number, pastedText: string) => boolean;
}

// The "Questions" panel (right-hand side) shared by the Add/Edit Quiz page and the School Book Revision form
const QuestionsEditor = ({
    items,
    questionCount,
    questionErrors,
    passageErrors,
    applyMarkToAll,
    isSaving,
    addQuestionAfter,
    addPassage,
    addQuestionAtEnd,
    handlePassageChange,
    addSectionAfter,
    removeItem,
    handleQuestionFieldChange,
    handleMarkChange,
    handleApplyMarkToAllChange,
    handleSectionFieldChange,
    handleImageChange,
    handleImageRemove,
    applySmartOptionsPaste,
}: QuestionsEditorProps) => {
    // Scrolls to whichever item key is new (append or mid-list insert via the rail's + / Tt buttons)
    const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const prevKeysRef = useRef<Set<number>>(new Set(items.map(getItemKey)));

    useEffect(() => {
        const currentKeys = items.map(getItemKey);
        const newKey = currentKeys.find((key) => !prevKeysRef.current.has(key));
        if (newKey !== undefined) {
            requestAnimationFrame(() => {
                itemRefs.current.get(newKey)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        }
        prevKeysRef.current = new Set(currentKeys);
    }, [items]);

    // Elevates the sticky header with a shadow once the list beneath it has scrolled
    const [isQuestionsListScrolled, setIsQuestionsListScrolled] = useState(false);

    const handleQuestionsListScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setIsQuestionsListScrolled(e.currentTarget.scrollTop > 0);
    };

    // Shared hidden file input: clicking any image button records the target, then opens the picker
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [pendingImageTarget, setPendingImageTarget] = useState<{ key: number; imageKey: keyof QuizQuestionImages } | null>(null);

    const openImagePicker = (key: number, imageKey: keyof QuizQuestionImages) => {
        setPendingImageTarget({ key, imageKey });
        imageInputRef.current?.click();
    };

    // Shared by the file picker and Ctrl+V: previews the file and hands it to the question
    const attachImage = (key: number, imageKey: keyof QuizQuestionImages, file: File) => {
        const reader = new FileReader();
        reader.onload = () => handleImageChange(key, imageKey, file, reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !pendingImageTarget) return;

        const { key, imageKey } = pendingImageTarget;
        attachImage(key, imageKey, file);
        setPendingImageTarget(null);
    };

    const railActionHandlers: Record<string, (key: number) => void> = {
        addQuestion: addQuestionAfter,
        addSection: addSectionAfter,
        addImage: (key: number) => openImagePicker(key, 'question'),
    };

    const passageKeys = new Set(items.flatMap((it) => (it.type === 'passage' ? [it.passage._key] : [])));

    const questionNumbers = (() => {
        const numbers = new Map<number, number>();
        let count = 0;
        items.forEach((item) => {
            if (item.type === 'question') {
                count += 1;
                numbers.set(getItemKey(item), count);
            }
        });
        return numbers;
    })();

    const renderItem = (item: ListItem): ReactNode => {
        const key = getItemKey(item);

        const rail = (
            <div className="question-detail-item__rail">
                {QUESTION_ITEM_RAIL_ACTIONS
                    .filter((action) => !action.onlyForQuestions || item.type === 'question')
                    .map((action) => (
                        <Tooltip key={action.key} title={action.tooltip}>
                            <button
                                type="button"
                                className={`question-detail-item__rail-btn${action.label ? ' question-detail-item__rail-btn--text' : ''}`}
                                onClick={() => railActionHandlers[action.key](key)}
                                aria-label={action.tooltip}
                                disabled={isSaving}
                            >
                                {action.icon ?? action.label}
                            </button>
                        </Tooltip>
                    ))}
            </div>
        );

        if (item.type === 'section') {
            const { section } = item;
            const titleFieldName = `section-${key}-title`;
            const descriptionFieldName = `section-${key}-description`;
            return (
                <div
                    key={key}
                    className="question-detail-item"
                    ref={(el) => {
                        if (el) itemRefs.current.set(key, el);
                        else itemRefs.current.delete(key);
                    }}
                >
                    <div className="question-detail-card question-detail-card--section">
                        <div className="question-detail-card__header">
                            Title and description
                            <button
                                type="button"
                                className="question-detail-card__remove"
                                onClick={() => removeItem(key)}
                                aria-label="Remove title and description block"
                            >
                                <img src={delete_Icon} alt='' />
                            </button>
                        </div>
                        <div className="question-detail-card__field">
                            <InputFields
                                fields={[{
                                    name: titleFieldName,
                                    label: 'Title',
                                    placeholder: 'Enter section title',
                                }]}
                                values={{ [titleFieldName]: section.title }}
                                onChange={(_, value) => handleSectionFieldChange(key, 'title', value)}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="question-detail-card__field">
                            <InputFields
                                fields={[{
                                    name: descriptionFieldName,
                                    label: 'Description',
                                    placeholder: 'Enter section description',
                                    type: 'textarea',
                                }]}
                                values={{ [descriptionFieldName]: section.description }}
                                onChange={(_, value) => handleSectionFieldChange(key, 'description', value)}
                                disabled={isSaving}
                            />
                        </div>
                    </div>
                    {rail}
                </div>
            );
        }

        // Passages are drawn by renderPassageGroup, together with their questions
        if (item.type === 'passage') return null;

        const question = item.question;
        const currentQuestionNumber = questionNumbers.get(key) as number;
        const errors = questionErrors[key] || {};
        const textFieldName = `question-${key}-text`;
        const correctOptionFieldName = `question-${key}-correctOption`;
        const markFieldName = `question-${key}-mark`;

        return (
            <div
                key={key}
                className="question-detail-item"
                ref={(el) => {
                    if (el) itemRefs.current.set(key, el);
                    else itemRefs.current.delete(key);
                }}
            >
                <div className="question-detail-card">
                    <div className="question-detail-card__header">
                        Question: {currentQuestionNumber}
                        {questionCount > 1 && (
                            <button
                                type="button"
                                className="question-detail-card__remove"
                                data-testid={`remove-question-${currentQuestionNumber}`}
                                onClick={() => removeItem(key)}
                                aria-label={`Remove question ${currentQuestionNumber}`}
                            >
                                <img src={delete_Icon} alt='' />
                            </button>
                        )}
                    </div>

                    <div className="question-detail-card__field">
                        <RichTextEditor
                            name={textFieldName}
                            label="Question Text"
                            placeholder="Enter question text"
                            // A picture can be used instead of text
                            required={!question.images?.question}
                            // A screenshot pasted into the question text becomes the question's image
                            onPasteImage={(file) => attachImage(key, 'question', file)}
                            value={question.questionText}
                            error={errors.questionText}
                            onChange={(value) => handleQuestionFieldChange(key, 'questionText', value)}
                            disabled={isSaving}
                        />
                    </div>

                    {question.images?.question && (
                        <div className="question-detail-card__image-preview">
                            <img src={question.images.question} alt="Question" />
                            <button
                                type="button"
                                className="question-detail-card__image-remove"
                                onClick={() => handleImageRemove(key, 'question')}
                                aria-label="Remove question image"
                                disabled={isSaving}
                            >
                                <CloseCircleFilled />
                            </button>
                        </div>
                    )}

                    <div className="question-detail-card__options">
                        {(['optionA', 'optionB', 'optionC', 'optionD'] as (keyof QuizQuestion)[]).map((optionKey, optionIdx) => {
                            const optionLabel = String.fromCodePoint(65 + optionIdx);
                            const optionFieldName = `question-${key}-${optionKey}`;
                            const optionImageKey = optionKey as keyof QuizQuestionImages;
                            const optionImage = question.images?.[optionImageKey];
                            return (
                                <div key={optionKey} className="question-detail-card__option">
                                    <div className="question-detail-card__field question-detail-card__row">
                                        <div className="question-detail-card__row-input">
                                            <RichTextEditor
                                                compact
                                                name={optionFieldName}
                                                label={`Option ${optionLabel}`}
                                                placeholder={`Enter option ${optionLabel}`}
                                                required={optionKey !== 'optionD' && !optionImage}
                                                value={question[optionKey] as string}
                                                error={errors[optionKey]}
                                                onChange={(value) => handleQuestionFieldChange(key, optionKey, value)}
                                                // A screenshot pasted into an option becomes that option's image
                                                onPasteImage={(file) => attachImage(key, optionImageKey, file)}
                                                // Several lines pasted into an option are spread over the options (A, B, C, D)
                                                onPasteText={(text) => applySmartOptionsPaste(key, text)}
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="question-detail-card__image-btn"
                                            onClick={() => openImagePicker(key, optionImageKey)}
                                            aria-label={`Add image for option ${optionLabel}`}
                                            disabled={isSaving}
                                        >
                                            <PictureOutlined />
                                        </button>
                                    </div>

                                    {optionImage && (
                                        <div className="question-detail-card__image-preview question-detail-card__image-preview--option">
                                            <img src={optionImage} alt={`Option ${optionLabel}`} />
                                            <button
                                                type="button"
                                                className="question-detail-card__image-remove"
                                                onClick={() => handleImageRemove(key, optionImageKey)}
                                                aria-label={`Remove image for option ${optionLabel}`}
                                                disabled={isSaving}
                                            >
                                                <CloseCircleFilled />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="question-detail-card__correct-mark-row">
                        <div className="question-detail-card__field question-detail-card__field--correct">
                            <DropdownField
                                className="question-detail-card__correct-option-dropdown"
                                data-testid={correctOptionFieldName}
                                fields={[{
                                    name: correctOptionFieldName,
                                    label: 'Correct Option',
                                    placeholder: 'Select correct option',
                                    required: true,
                                    options: CORRECT_OPTION_CHOICES,
                                    disabled: isSaving,
                                }]}
                                values={{ [correctOptionFieldName]: question.correctOption || '' }}
                                errors={errors.correctOption ? { [correctOptionFieldName]: errors.correctOption } : {}}
                                onChange={(_, value) => handleQuestionFieldChange(key, 'correctOption', value as string)}
                            />
                            {errors.correctOption && <div className="form-fields-section__error-message">{errors.correctOption}</div>}
                        </div>

                        <div className="question-detail-card__field question-detail-card__field--mark">
                            <InputFields
                                fields={[{
                                    name: markFieldName,
                                    label: 'Mark',
                                    placeholder: 'Enter mark, e.g. 1 or 0.5',
                                    required: true,
                                    singleLine: true,
                                }]}
                                values={{ [markFieldName]: question.mark || '' }}
                                errors={errors.mark ? { [markFieldName]: errors.mark } : {}}
                                onChange={(_, value) => handleMarkChange(key, value)}
                                disabled={isSaving || (applyMarkToAll && currentQuestionNumber !== 1)}
                            />
                        </div>
                        <div>
                            {currentQuestionNumber === 1 && (
                                <Checkbox
                                   label="If you check this, will be applicable for all Question"
                                   checked={applyMarkToAll}
                                   onChange={handleApplyMarkToAllChange}
                                   disabled={isSaving}
                                />
                            )}
                        </div>
                    </div>
                </div>
                {rail}
            </div>
        );
    };

    // A passage section: the passage text, then its own questions (each with the usual Add / Image rail) inside the same box
    const renderPassageGroup = (item: Extract<ListItem, { type: 'passage' }>) => {
        const key = item.passage._key;
        const groupQuestions = items.filter((it) => it.type === 'question' && it.question.passageKey === key);
        const numbers = groupQuestions.map((it) => questionNumbers.get(getItemKey(it)) as number);
        const lastQuestionKey = groupQuestions.length > 0 ? getItemKey(groupQuestions[groupQuestions.length - 1]) : key;
        const passageFieldName = `passage-${key}-text`;

        return (
            <div
                key={key}
                className="question-detail-passage"
                data-testid={`passage-section-${key}`}
                ref={(el) => {
                    if (el) itemRefs.current.set(key, el);
                    else itemRefs.current.delete(key);
                }}
            >
                <div className="question-detail-passage__header">
                    <span className="question-detail-passage__title">
                        Passage
                        {numbers.length > 0 && (
                            <span className="question-detail-passage__range">
                                {numbers.length === 1 ? `Question ${numbers[0]}` : `Questions ${numbers[0]} - ${numbers[numbers.length - 1]}`}
                            </span>
                        )}
                    </span>
                    <Tooltip title="Remove the passage (its questions stay as regular questions)">
                        <button
                            type="button"
                            className="question-detail-card__remove"
                            data-testid={`remove-passage-${key}`}
                            onClick={() => removeItem(key)}
                            aria-label="Remove passage"
                            disabled={isSaving}
                        >
                            <img src={delete_Icon} alt='' />
                        </button>
                    </Tooltip>
                </div>

                <div className="question-detail-card__field">
                    <RichTextEditor
                        name={passageFieldName}
                        label="Passage"
                        placeholder="Enter the passage the questions below are about"
                        required
                        value={item.passage.text}
                        error={passageErrors[key]}
                        onChange={(value) => handlePassageChange(key, value)}
                        disabled={isSaving}
                    />
                </div>

                <div className="question-detail-passage__questions">
                    {groupQuestions.map(renderItem)}
                </div>

                <button
                    type="button"
                    className="question-detail-passage__add"
                    data-testid={`add-passage-question-${key}`}
                    onClick={() => addQuestionAfter(lastQuestionKey)}
                    disabled={isSaving}
                >
                    + Add another question to this passage
                </button>
            </div>
        );
    };

    return (
        <div className="question-detail-questions">
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageFileSelected}
            />

            <div className={`question-detail-questions__header${isQuestionsListScrolled ? ' question-detail-questions__header--scrolled' : ''}`}>
                <PageTitle title="Questions" />
                <div className="question-detail-questions__actions">
                    <Button variant="secondary" className="popup-modal__button" onClick={addQuestionAtEnd} disabled={isSaving}>
                        + Add Question
                    </Button>
                    <Button variant="primary" className="popup-modal__button" onClick={addPassage} disabled={isSaving}>
                        Passage Quiz
                    </Button>
                </div>
            </div>

            <div className="question-detail-questions__list" onScroll={handleQuestionsListScroll}>
                {items.map((item) => {
                    if (item.type === 'passage') return renderPassageGroup(item);
                    // A question of a passage is drawn inside that passage's section
                    if (item.type === 'question' && item.question.passageKey !== undefined && passageKeys.has(item.question.passageKey)) return null;
                    return renderItem(item);
                })}
            </div>
        </div>
    );
};

export default QuestionsEditor;
