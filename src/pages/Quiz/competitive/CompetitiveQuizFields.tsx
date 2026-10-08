import DropdownField from '../../../components/DropdownField/DropdownField';
import { MATERIAL_TO_VIEW_OPTIONS } from '../../StudyMaterial/Constants';

type Option = { value: string; label: string };
type OnChange = (value: string | string[]) => void;

export interface CompetitiveQuizFieldsProps {
    isEditMode: boolean;
    disabled: boolean;
    // Quiz To View
    quizToView: string;
    quizToViewError: string;
    onQuizToViewChange: OnChange;
    // Course and batch (only for paid quizzes)
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

        {/* Course and batch only apply to paid quizzes */}
        {isPaid && (
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
                                required: true,
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
