import { useEffect, useRef, useState } from 'react';
import { Tooltip } from 'antd';
import { CloseCircleFilled, PictureOutlined } from '@ant-design/icons';
import Button from '../../components/Button/Button';
import InputFields from '../../components/InputFields/InputFields';
import DropdownField from '../../components/DropdownField/DropdownField';
import Checkbox from '../../components/Checkbox/Checkbox';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import Breadcrumbs from '../../components/Breadcrumb/Breadcrumbs';
import PageTitle from '../../components/PageTitle';
import { useQuestionDetailManagement, getItemKey } from './useQuestionDetailHooks';
import { QUIZ_TITLE_FIELD, CORRECT_OPTION_CHOICES, QUESTION_ITEM_RAIL_ACTIONS, type QuizQuestion, type QuizQuestionImages } from './Constant';
import { MATERIAL_TO_VIEW_OPTIONS } from '../StudyMaterial/Constants';
import delete_Icon from '../../assets/delete_Icon2.svg';

const QuestionDetail = () => {
    const {
        isEditMode,
        quizDetail,
        coursesArray,
        loading,
        isSaving,
        title,
        courseId,
        quizToView,
        items,
        questionCount,
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
    } = useQuestionDetailManagement();

    const courseOptions = coursesArray.map((course) => ({ value: course.id, label: course.courseName }));

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

    const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !pendingImageTarget) return;

        const { key, imageKey } = pendingImageTarget;
        const reader = new FileReader();
        reader.onload = () => handleImageChange(key, imageKey, file, reader.result as string);
        reader.readAsDataURL(file);
        setPendingImageTarget(null);
    };

    const handleOptionPaste = (key: number) => (e: React.ClipboardEvent<HTMLDivElement>) => {
        const pastedText = e.clipboardData.getData('text');
        if (applySmartOptionsPaste(key, pastedText)) {
            e.preventDefault();
        }
    };

    const railActionHandlers: Record<string, (key: number) => void> = {
        addQuestion: addQuestionAfter,
        addSection: addSectionAfter,
        addImage: (key: number) => openImagePicker(key, 'question'),
    };

    if (isEditMode && loading && !quizDetail) {
        return <Loader size="large" />;
    }

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

    return (
        <div className="question-detail-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />

            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageFileSelected}
            />

            <Breadcrumbs
                items={[
                    { label: 'Quiz', path: '/quiz' },
                    { label: isEditMode ? 'Edit Quiz' : 'Add Quiz', path: '/quiz' },
                ]}
            />

            <div className="report_main">
                <PageTitle title={isEditMode ? 'Edit Quiz' : 'Add Quiz'} />
            </div>

            <div className="question-detail-body">
                <div className="question-detail-form">
                    <InputFields
                        fields={QUIZ_TITLE_FIELD}
                        values={{ title }}
                        errors={titleError ? { title: titleError } : {}}
                        onChange={handleTitleChange}
                        disabled={isSaving}
                    />

                    {isEditMode ? (
                        <div className="question-detail-form__readonly-course">
                            Course: <span>{quizDetail?.courseName || '-'}</span>
                        </div>
                    ) : (
                        <DropdownField
                            fields={[
                                {
                                    name: 'courseId',
                                    label: 'Course',
                                    placeholder: 'Select course',
                                    required: true,
                                    options: courseOptions,
                                },
                            ]}
                            values={{ courseId }}
                            errors={courseError ? { courseId: courseError } : {}}
                            onChange={(_, value) => handleCourseChange(value)}
                        />
                    )}

                    <DropdownField
                        fields={[
                            {
                                name: 'quizToView',
                                label: 'Quiz To View',
                                placeholder: 'Select quiz to view',
                                required: true,
                                options: MATERIAL_TO_VIEW_OPTIONS,
                                disabled: isSaving,
                            },
                        ]}
                        values={{ quizToView }}
                        errors={quizToViewError ? { quizToView: quizToViewError } : {}}
                        onChange={(_, value) => handleQuizToViewChange(value)}
                    />
                </div>

                <div className="question-detail-questions">
                    <div className={`question-detail-questions__header${isQuestionsListScrolled ? ' question-detail-questions__header--scrolled' : ''}`}>
                        <PageTitle title="Questions" />
                    </div>

                    <div className="question-detail-questions__list" onScroll={handleQuestionsListScroll}>
                        {items.map((item) => {
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
                                            <InputFields
                                                fields={[{
                                                    name: textFieldName,
                                                    label: 'Question Text',
                                                    placeholder: 'Enter question text',
                                                    required: true,
                                                }]}
                                                values={{ [textFieldName]: question.questionText }}
                                                errors={errors.questionText ? { [textFieldName]: errors.questionText } : {}}
                                                onChange={(_, value) => handleQuestionFieldChange(key, 'questionText', value)}
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
                                                        <div className="question-detail-card__field question-detail-card__row" onPaste={handleOptionPaste(key)}>
                                                            <div className="question-detail-card__row-input">
                                                                <InputFields
                                                                    fields={[{
                                                                        name: optionFieldName,
                                                                        label: `Option ${optionLabel}`,
                                                                        placeholder: `Enter option ${optionLabel}`,
                                                                        required: true,
                                                                    }]}
                                                                    values={{ [optionFieldName]: question[optionKey] as string }}
                                                                    errors={errors[optionKey] ? { [optionFieldName]: errors[optionKey] } : {}}
                                                                    onChange={(_, value) => handleQuestionFieldChange(key, optionKey, value)}
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
                                                        placeholder: 'Enter mark, e.g. 1 or 1.5',
                                                        required: true,
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
                        })}
                    </div>
                </div>
            </div>

            <div className="question-detail-actions">
                <Button variant="secondary" className="popup-modal__button" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                </Button>
                <Button variant="primary" className="popup-modal__button" onClick={handleSubmit} loading={isSaving} disabled={isSaving}>
                    {isEditMode ? 'Update' : 'Create'}
                </Button>
            </div>
        </div>
    );
};

export default QuestionDetail;
