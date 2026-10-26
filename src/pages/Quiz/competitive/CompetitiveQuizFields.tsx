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
    // Course and batch (for Paid and Free quizzes; the course is only required for Paid)
    isPaid: boolean;
    courseName?: string;
    courseId: string;
    courseError: string;
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
    isPaid,
    courseName,
    courseId,
    courseError,
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

        {/* Course and batch apply to Paid and Free quizzes */}
        {(
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
                                required: isPaid,
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
                            options: batchOptions,
                            loading: batchesLoading,
                            disabled: disabled || !courseId,
                        },
                    ]}
                    values={{ batchId }}
                    onChange={(_, value) => onBatchChange(value)}
                />
            </>
        )}
    </>
);

export default CompetitiveQuizFields;
