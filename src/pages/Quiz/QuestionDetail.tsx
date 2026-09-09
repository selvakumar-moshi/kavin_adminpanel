import { useEffect, useRef, useState } from 'react';
import Button from '../../components/Button/Button';
import InputFields from '../../components/InputFields/InputFields';
import DropdownField from '../../components/DropdownField/DropdownField';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import Breadcrumbs from '../../components/Breadcrumb/Breadcrumbs';
import PageTitle from '../../components/PageTitle';
import { useQuestionDetailManagement } from './useQuestionDetailHooks';
import { QUIZ_TITLE_FIELD, CORRECT_OPTION_CHOICES, type QuizQuestion } from './Constant';
import add_Icon from '../../assets/add_Icon.svg';
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
    } = useQuestionDetailManagement();

    const courseOptions = coursesArray.map((course) => ({ value: course.id, label: course.courseName }));

    const prevQuestionCountRef = useRef(questions.length);
    const lastQuestionRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (questions.length > prevQuestionCountRef.current) {
            lastQuestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        prevQuestionCountRef.current = questions.length;
    }, [questions.length]);

    // Elevates the sticky header with a shadow once the list beneath it has scrolled
    const [isQuestionsListScrolled, setIsQuestionsListScrolled] = useState(false);

    const handleQuestionsListScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setIsQuestionsListScrolled(e.currentTarget.scrollTop > 0);
    };

    if (isEditMode && loading && !quizDetail) {
        return <Loader size="large" />;
    }

    return (
        <div className="question-detail-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />

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
                </div>

                <div className="question-detail-questions">
                    <div className={`question-detail-questions__header${isQuestionsListScrolled ? ' question-detail-questions__header--scrolled' : ''}`}>
                        <PageTitle title="Questions" />
                        <Button icon={<img src={add_Icon} alt="add-icon" />} variant="primary" className="page-title__button" onClick={addQuestion}>
                            Add Question
                        </Button>
                    </div>

                    <div className="question-detail-questions__list" onScroll={handleQuestionsListScroll}>
                        {questions.map((question, index) => {
                        const errors = questionErrors[index] || {};
                        const textFieldName = `question-${question._key}-text`;
                        const correctOptionFieldName = `question-${question._key}-correctOption`;
                        const isLastQuestion = index === questions.length - 1;
                        return (
                            <div
                                key={question._key}
                                className="question-detail-card"
                                ref={isLastQuestion ? lastQuestionRef : undefined}
                            >
                                <div className="question-detail-card__header">
                                   Question: {index + 1}
                                    {questions.length > 1 && (
                                        <button
                                            type="button"
                                            className="question-detail-card__remove"
                                            data-testid={`remove-question-${index}`}
                                            onClick={() => removeQuestion(index)}
                                            aria-label={`Remove question ${index + 1}`}
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
                                        onChange={(_, value) => handleQuestionFieldChange(index, 'questionText', value)}
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="question-detail-card__options">
                                    {(['optionA', 'optionB', 'optionC', 'optionD'] as (keyof QuizQuestion)[]).map((optionKey, optionIdx) => {
                                        const optionLabel = String.fromCodePoint(65 + optionIdx);
                                        const optionFieldName = `question-${question._key}-${optionKey}`;
                                        return (
                                            <div key={optionKey} className="question-detail-card__field">
                                                <InputFields
                                                    fields={[{
                                                        name: optionFieldName,
                                                        label: `Option ${optionLabel}`,
                                                        placeholder: `Enter option ${optionLabel}`,
                                                        required: true,
                                                    }]}
                                                    values={{ [optionFieldName]: question[optionKey] as string }}
                                                    errors={errors[optionKey] ? { [optionFieldName]: errors[optionKey] } : {}}
                                                    onChange={(_, value) => handleQuestionFieldChange(index, optionKey, value)}
                                                    disabled={isSaving}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

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
                                        onChange={(_, value) => handleQuestionFieldChange(index, 'correctOption', value as string)}
                                    />
                                    {errors.correctOption && <div className="form-fields-section__error-message">{errors.correctOption}</div>}
                                </div>
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
