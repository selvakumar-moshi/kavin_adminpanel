import InputFields from '../../components/InputFields/InputFields';
import { RichTextEditor } from '../../components/RichTextEditor';
import { COURSE_NAME_FIELDS, COURSE_DESCRIPTION_FIELD, COURSE_AMOUNT_FIELDS } from './Constant';

interface CourseFormFieldsProps {
    values: Record<string, string>;
    errors: Record<string, string>;
    onChange: (name: string, value: string) => void;
    disabled: boolean;
}

// Course name, description (rich text) and amount, shared by the Add and Edit course forms
const CourseFormFields = ({ values, errors, onChange, disabled }: CourseFormFieldsProps) => (
    <>
        <InputFields fields={COURSE_NAME_FIELDS} values={values} errors={errors} onChange={onChange} disabled={disabled} />
        <RichTextEditor
            {...COURSE_DESCRIPTION_FIELD}
            value={values.courseDescription || ''}
            error={errors.courseDescription}
            onChange={(value) => onChange('courseDescription', value)}
            disabled={disabled}
        />
        <InputFields fields={COURSE_AMOUNT_FIELDS} values={values} errors={errors} onChange={onChange} disabled={disabled} />
    </>
);

export default CourseFormFields;
