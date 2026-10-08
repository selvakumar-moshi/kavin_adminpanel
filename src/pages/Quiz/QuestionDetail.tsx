import Button from '../../components/Button/Button';
import InputFields from '../../components/InputFields/InputFields';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import Breadcrumbs from '../../components/Breadcrumb/Breadcrumbs';
import PageTitle from '../../components/PageTitle';
import QuestionsEditor from './QuestionsEditor';
import QuizDocumentUpload from './QuizDocumentUpload';
import CompetitiveQuizFields from './competitive/CompetitiveQuizFields';
import SchoolBookSelectors from './schoolBook/SchoolBookSelectors';
import PreviousYearQuizFields from './previousYear/PreviousYearQuizFields';
import { useQuestionDetailManagement } from './useQuestionDetailHooks';
import { useSchoolBookQuizManagement } from './schoolBook/useSchoolBookQuizHooks';
import { useFolderSelector } from './previousYear/useFolderSelectorHooks';
import { QUIZ_TITLE_FIELD, QUIZ_TYPE_SCHOOL, getQuizPageTitle } from './Constant';

// Add / Edit Quiz page. The title, questions editor and Word import are the same for every quiz; the fields on the
// left that differ per quiz type live in ./competitive, ./schoolBook and ./previousYear.
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
        isPaid,
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

    // Editing a School Book quiz: Subject / Standard / Part (pre-filled, changeable) replace Quiz To View, Course and Batch
    const isSchoolQuiz = isEditMode && quizDetail?.quizType === QUIZ_TYPE_SCHOOL;
    const { getSelectionFields, handleCancel: _ignoredCancel, ...schoolSelectors } = useSchoolBookQuizManagement(handleCancel, {
        enabled: isSchoolQuiz,
        initial: isSchoolQuiz && quizDetail
            ? { subject: quizDetail.subject, category: quizDetail.category, standard: quizDetail.standard, part: quizDetail.part }
            : undefined,
    });

    // Previous Year quizzes: Folder / Sub Folder replace Quiz To View, Course and Batch (pre-filled when editing)
    const { getFolderFields, ...folderSelector } = useFolderSelector({
        enabled: isFolderQuiz,
        initial: isEditMode && isFolderQuiz && quizDetail
            ? { folderId: quizDetail.folderId, subFolderId: quizDetail.subFolderId }
            : undefined,
    });

    // Each quiz type adds its own fields to the request
    const handleUpdateOrCreate = () => {
        if (isSchoolQuiz) {
            const fields = getSelectionFields();
            if (fields) handleSubmit(fields);
        } else if (isFolderQuiz) {
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

                    {isSchoolQuiz ? (
                        <SchoolBookSelectors {...schoolSelectors} disabled={isSaving} />
                    ) : isFolderQuiz ? (
                        <PreviousYearQuizFields
                            {...folderSelector}
                            disabled={isSaving}
                            onFolderChange={folderSelector.handleFolderChange}
                            onSubFolderChange={folderSelector.handleSubFolderChange}
                        />
                    ) : (
                        <CompetitiveQuizFields
                            isEditMode={isEditMode}
                            disabled={isSaving}
                            quizToView={quizToView}
                            quizToViewError={quizToViewError}
                            onQuizToViewChange={handleQuizToViewChange}
                            isPaid={isPaid}
                            courseName={quizDetail?.courseName}
                            courseId={courseId}
                            courseError={courseError}
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
