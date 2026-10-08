import DropdownField from '../../../components/DropdownField/DropdownField';

type OnChange = (value: string | string[]) => void;

export interface SchoolBookSelectorsProps {
    subject: string;
    category: string;
    standard: string;
    part: string;
    subjectOptions: { value: string; label: string }[];
    categoryOptions: { value: string; label: string }[];
    standardOptions: { value: string; label: string }[];
    partOptions: { value: string; label: string }[];
    categoriesLoading: boolean;
    categoriesError: string;
    selectionErrors: Record<string, string>;
    showCategory: boolean;
    showStandard: boolean;
    showPart: boolean;
    disabled?: boolean;
    handleSubjectChange: OnChange;
    handleCategoryChange: OnChange;
    handleStandardChange: OnChange;
    handlePartChange: OnChange;
}

// Subject -> (Category) -> Standard -> (Part) dropdowns, used when adding and when editing a School Book quiz
const SchoolBookSelectors = ({
    subject,
    category,
    standard,
    part,
    subjectOptions,
    categoryOptions,
    standardOptions,
    partOptions,
    categoriesLoading,
    categoriesError,
    selectionErrors,
    showCategory,
    showStandard,
    showPart,
    disabled = false,
    handleSubjectChange,
    handleCategoryChange,
    handleStandardChange,
    handlePartChange,
}: SchoolBookSelectorsProps) => (
    <>
        <DropdownField
            fields={[
                {
                    name: 'subject',
                    label: 'Select Subject',
                    placeholder: 'Select subject',
                    required: true,
                    options: subjectOptions,
                    loading: categoriesLoading,
                    disabled,
                },
            ]}
            values={{ subject }}
            errors={categoriesError || selectionErrors.subject ? { subject: categoriesError || selectionErrors.subject } : {}}
            onChange={(_, value) => handleSubjectChange(value)}
        />

        {showCategory && (
            <DropdownField
                fields={[
                    {
                        name: 'category',
                        label: 'Select Category',
                        placeholder: 'Select category',
                        required: true,
                        options: categoryOptions,
                        disabled,
                    },
                ]}
                values={{ category }}
                errors={selectionErrors.category ? { category: selectionErrors.category } : {}}
                onChange={(_, value) => handleCategoryChange(value)}
            />
        )}

        {showStandard && (
            <DropdownField
                fields={[
                    {
                        name: 'standard',
                        label: 'Select Standard',
                        placeholder: 'Select standard',
                        required: true,
                        options: standardOptions,
                        disabled,
                    },
                ]}
                values={{ standard }}
                errors={selectionErrors.standard ? { standard: selectionErrors.standard } : {}}
                onChange={(_, value) => handleStandardChange(value)}
            />
        )}

        {showPart && (
            <DropdownField
                fields={[
                    {
                        name: 'part',
                        label: 'Select Part',
                        placeholder: 'Select part',
                        required: true,
                        options: partOptions,
                        disabled,
                    },
                ]}
                values={{ part }}
                errors={selectionErrors.part ? { part: selectionErrors.part } : {}}
                onChange={(_, value) => handlePartChange(value)}
            />
        )}
    </>
);

export default SchoolBookSelectors;
