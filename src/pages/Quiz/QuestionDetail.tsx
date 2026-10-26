import Button from '../../components/Button/Button';
import InputFields from '../../components/InputFields/InputFields';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import Breadcrumbs from '../../components/Breadcrumb/Breadcrumbs';
import PageTitle from '../../components/PageTitle';
import QuestionsEditor from './QuestionsEditor';
import QuizDocumentUpload from './QuizDocumentUpload';
import CompetitiveQuizFields from './competitive/CompetitiveQuizFields';
import PreviousYearQuizFields from './previousYear/PreviousYearQuizFields';
import { useQuestionDetailManagement } from './useQuestionDetailHooks';
import { useFolderSelector } from './previousYear/useFolderSelectorHooks';
import { QUIZ_TITLE_FIELD, QUIZ_ATTEMPT_FIELD, getQuizPageTitle } from './Constant';

// Add / Edit Quiz page. The title, questions editor and Word import are the same for every quiz; the fields on the
// left that differ per quiz type live in ./competitive and ./previousYear.
const QuestionDetail = () => {
    const {
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
        isQuizToViewFixed,
        isDaily,
        quizAttempt,
        quizAttemptError,
        handleQuizAttemptChange,
        batchError,
        quizType,
        isFolderQuiz,
        items,
        questionCount,
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
        handleCancel,
        toastMessages,
        hideToast,
    } = useQuestionDetailManagement();

    // Previous Year, Syllabus Wise and School Book quizzes: Folder / Sub Folder / Nested Sub Folder replace Quiz To View,
    // Course and Batch (pre-filled when editing)
    const { getFolderFields, ...folderSelector } = useFolderSelector({
        enabled: isFolderQuiz,
        initial: isEditMode && isFolderQuiz && quizDetail
            ? { folderId: quizDetail.folderId, subFolderId: quizDetail.subFolderId }
            : undefined,
    });

    // Each quiz type adds its own fields to the request
    const handleUpdateOrCreate = () => {
        if (isFolderQuiz) {
            const fields = getFolderFields();
            if (fields) handleSubmit(fields);
        } else {
            handleSubmit();
        }
    };

    // "Add Competitive Quiz" / "Edit School Quiz" / ... — used for the breadcrumb and the page title
    const pageTitle = getQuizPageTitle(isEditMode, quizType);

    const courseOptions = coursesArray.map((course) => ({ value: course.id, label: course.courseName }));
    const batchOptions = batchesArray.map((batch) => ({ value: batch.id, label: batch.title }));

    if (isEditMode && loading && !quizDetail) {
        return <Loader size="large" />;
    }

    return (
        <div className="question-detail-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />

            <Breadcrumbs
                items={[
                    { label: 'Quiz', path: '/quiz' },
                    { label: pageTitle, path: '/quiz' },
                ]}
                onNavigate={() => handleCancel()}
            />

            <div className="report_main">
                <PageTitle title={pageTitle} />
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

                    <InputFields
                        fields={QUIZ_ATTEMPT_FIELD}
                        values={{ quizAttempt }}
                        errors={quizAttemptError ? { quizAttempt: quizAttemptError } : {}}
                        onChange={handleQuizAttemptChange}
                        disabled={isSaving}
                    />

                    {isFolderQuiz ? (
                        <PreviousYearQuizFields
                            {...folderSelector}
                            disabled={isSaving}
                            onFolderChange={folderSelector.handleFolderChange}
                            onSubFolderChange={folderSelector.handleSubFolderChange}
                            onNestedSubFolderChange={folderSelector.handleNestedSubFolderChange}
                        />
                    ) : (
                        <CompetitiveQuizFields
                            isEditMode={isEditMode}
                            disabled={isSaving}
                            quizToView={quizToView}
                            hideQuizToView={isQuizToViewFixed}
                            quizToViewError={quizToViewError}
                            onQuizToViewChange={handleQuizToViewChange}
                            showCourseBatch={!isDaily}
                            courseBatchRequired={!isEditMode}
                            courseName={quizDetail?.courseName}
                            courseId={courseId}
                            courseError={courseError}
                            batchError={batchError}
                            courseOptions={courseOptions}
                            onCourseChange={handleCourseChange}
                            batchId={batchId}
                            batchOptions={batchOptions}
                            batchesLoading={batchesLoading}
                            onBatchChange={handleBatchChange}
                        />
                    )}

                    {/* Optional: questions are read from the uploaded file and filled in on the right */}
                    {!isEditMode && (
                        <QuizDocumentUpload
                            fileList={quizFileList}
                            isImporting={isImporting}
                            warnings={importWarnings}
                            onFileChange={handleQuizFileChange}
                        />
                    )}
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
                <Button variant="primary" className="popup-modal__button" onClick={handleUpdateOrCreate} loading={isSaving} disabled={isSaving || isImporting}>
                    {isEditMode ? 'Update' : 'Create'}
                </Button>
            </div>
        </div>
    );
};

export default QuestionDetail;
