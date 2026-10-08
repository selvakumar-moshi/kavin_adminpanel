import Button from '../../../components/Button/Button';
import Breadcrumbs from '../../../components/Breadcrumb/Breadcrumbs';
import InputFields from '../../../components/InputFields/InputFields';
import ToastMessages from '../../../components/ToastMessages';
import PageTitle from '../../../components/PageTitle';
import QuestionsEditor from '../QuestionsEditor';
import QuizDocumentUpload from '../QuizDocumentUpload';
import SchoolBookSelectors from './SchoolBookSelectors';
import { useSchoolBookQuizManagement } from './useSchoolBookQuizHooks';
import { useQuestionDetailManagement } from '../useQuestionDetailHooks';
import { QUIZ_TITLE_FIELD, QUIZ_TYPE_SCHOOL, getQuizPageTitle } from '../Constant';

// "Add School Quiz": the breadcrumb and the page title
const ADD_TITLE = getQuizPageTitle(false, QUIZ_TYPE_SCHOOL);

export interface SchoolBookQuizProps {
    /** Closes the form and returns to the quiz list */
    onCancel: () => void;
    /** Called once the quiz has been created (the host closes the form and refreshes the list) */
    onCreated: () => void;
}

// Add Quiz form for the "School Book Revision" tab, rendered inside the Quiz page (no route of its own)
const SchoolBookQuiz = ({ onCancel, onCreated }: SchoolBookQuizProps) => {
    const { getSelectionFields, handleCancel, ...selectors } = useSchoolBookQuizManagement(onCancel);

    // Questions editor + Word import share their state and behaviour with the regular Add Quiz page
    const {
        isSaving,
        isImporting,
        title,
        titleError,
        handleTitleChange,
        items,
        questionCount,
        questionErrors,
        applyMarkToAll,
        quizFileList,
        importWarnings,
        handleQuizFileChange,
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
        submitSchoolBookQuiz,
        toastMessages,
        hideToast,
    } = useQuestionDetailManagement(onCreated);

    // Every selector that is showing must be chosen before the questions are checked and the quiz is created
    const handleCreate = () => {
        const fields = getSelectionFields();
        if (!fields) return;
        submitSchoolBookQuiz(fields);
    };

    return (
        <div className="question-detail-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />

            {/* Embedded form (the URL stays /quiz), so the second item uses a placeholder path to be the "current" one
                and clicking "Quiz" closes the form instead of navigating */}
            <Breadcrumbs
                items={[
                    { label: 'Quiz', path: '/quiz' },
                    { label: ADD_TITLE, path: '/quiz/add' },
                ]}
                currentPath="/quiz/add"
                onNavigate={() => handleCancel()}
            />

            <div className="report_main">
                <PageTitle title={ADD_TITLE} />
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

                    <SchoolBookSelectors {...selectors} disabled={isSaving} />

                    {/* Questions in the Word file are read and filled into the editor on the right */}
                    <QuizDocumentUpload
                        fileList={quizFileList}
                        isImporting={isImporting}
                        warnings={importWarnings}
                        onFileChange={handleQuizFileChange}
                    />
                </div>

                <QuestionsEditor
                    items={items}
                    questionCount={questionCount}
                    questionErrors={questionErrors}
                    applyMarkToAll={applyMarkToAll}
                    isSaving={isSaving}
                    addQuestionAfter={addQuestionAfter}
                    addSectionAfter={addSectionAfter}
                    removeItem={removeItem}
                    handleQuestionFieldChange={handleQuestionFieldChange}
                    handleMarkChange={handleMarkChange}
                    handleApplyMarkToAllChange={handleApplyMarkToAllChange}
                    handleSectionFieldChange={handleSectionFieldChange}
                    handleImageChange={handleImageChange}
                    handleImageRemove={handleImageRemove}
                    applySmartOptionsPaste={applySmartOptionsPaste}
                />
            </div>

            <div className="question-detail-actions">
                <Button variant="secondary" className="popup-modal__button" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                </Button>
                <Button variant="primary" className="popup-modal__button" onClick={handleCreate} loading={isSaving} disabled={isSaving || isImporting}>
                    Create
                </Button>
            </div>
        </div>
    );
};

export default SchoolBookQuiz;
