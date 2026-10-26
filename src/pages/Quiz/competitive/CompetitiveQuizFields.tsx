import DropdownField from '../../../components/DropdownField/DropdownField';
import { MATERIAL_TO_VIEW_OPTIONS } from '../../StudyMaterial/Constants';

type Option = { value: string; label: string };
type OnChange = (value: string | string[]) => void;

export interface CompetitiveQuizFieldsProps {
    isEditMode: boolean;
    disabled: boolean;
    // Quiz To View
    quizToView: string;
    /** The tab already decides it (Add Quiz), so the dropdown is hidden */
    hideQuizToView?: boolean;
    quizToViewError: string;
    onQuizToViewChange: OnChange;
    // Course and batch (competitive quizzes, Paid and Free; Daily quizzes have neither)
    showCourseBatch: boolean;
    // Creating a quiz needs both
    courseBatchRequired: boolean;
    courseName?: string;
    courseId: string;
    courseError: string;
    batchError: string;
    courseOptions: Option[];
    onCourseChange: OnChange;
    batchId: string;
    batchOptions: Option[];
    batchesLoading: boolean;
    onBatchChange: OnChange;
}

// Left-hand fields of a Competitive / Daily quiz (add and edit): Quiz To View, and for paid quizzes the course and batch
const CompetitiveQuizFields = ({
    isEditMode,
    disabled,
    quizToView,
    hideQuizToView = false,
    quizToViewError,
    onQuizToViewChange,
    showCourseBatch,
    courseBatchRequired,
    courseName,
    courseId,
    courseError,
    batchError,
    courseOptions,
    onCourseChange,
    batchId,
    batchOptions,
    batchesLoading,
    onBatchChange,
}: CompetitiveQuizFieldsProps) => (
    <>
        {!hideQuizToView && (
        <DropdownField
            fields={[
                {
                    name: 'quizToView',
                    label: 'Quiz To View',
                    placeholder: 'Select quiz to view',
                    required: true,
                    options: MATERIAL_TO_VIEW_OPTIONS,
                    disabled,
                },
            ]}
            values={{ quizToView }}
            errors={quizToViewError ? { quizToView: quizToViewError } : {}}
            onChange={(_, value) => onQuizToViewChange(value)}
        />
        )}

        {/* Course and batch apply to competitive quizzes, Paid and Free */}
        {showCourseBatch && (
            <>
                {isEditMode ? (
                    <div className="question-detail-form__readonly-course">
                        Course: <span>{courseName || '-'}</span>
                    </div>
                ) : (
                    <DropdownField
                        fields={[
                            {
                                name: 'courseId',
                                label: 'Course',
                                placeholder: 'Select course',
                                required: courseBatchRequired,
                                options: courseOptions,
                            },
                        ]}
                        values={{ courseId }}
                        errors={courseError ? { courseId: courseError } : {}}
                        onChange={(_, value) => onCourseChange(value)}
                    />
                )}

                <DropdownField
                    fields={[
                        {
                            name: 'batchId',
                            label: 'Batch',
                            placeholder: 'Select batch',
                            required: courseBatchRequired,
                            options: batchOptions,
                            loading: batchesLoading,
                            disabled: disabled || !courseId,
                        },
                    ]}
                    values={{ batchId }}
                    errors={batchError ? { batchId: batchError } : {}}
                    onChange={(_, value) => onBatchChange(value)}
                />
            </>
        )}
    </>
);

export default CompetitiveQuizFields;
