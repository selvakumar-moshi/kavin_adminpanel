import DropdownField from '../../../components/DropdownField/DropdownField';

type Option = { value: string; label: string };
type OnChange = (value: string | string[]) => void;

export interface PreviousYearQuizFieldsProps {
    disabled: boolean;
    folderId: string;
    subFolderId: string;
    folderOptions: Option[];
    subFolderOptions: Option[];
    foldersLoading: boolean;
    subFoldersLoading: boolean;
    loadError: string;
    errors: Record<string, string>;
    showSubFolder: boolean;
    onFolderChange: OnChange;
    onSubFolderChange: OnChange;
}

// Left-hand fields of a Previous Year quiz (add and edit): the folder it lives in and, once a folder is picked, its sub folder
const PreviousYearQuizFields = ({
    disabled,
    folderId,
    subFolderId,
    folderOptions,
    subFolderOptions,
    foldersLoading,
    subFoldersLoading,
    loadError,
    errors,
    showSubFolder,
    onFolderChange,
    onSubFolderChange,
}: PreviousYearQuizFieldsProps) => (
    <>
        <DropdownField
            fields={[
                {
                    name: 'folderId',
                    label: 'Folder',
                    placeholder: 'Select folder',
                    required: true,
                    options: folderOptions,
                    loading: foldersLoading,
                    disabled,
                },
            ]}
            values={{ folderId }}
            errors={loadError || errors.folderId ? { folderId: loadError || errors.folderId } : {}}
            onChange={(_, value) => onFolderChange(value)}
        />

        {showSubFolder && (
            <DropdownField
                fields={[
                    {
                        name: 'subFolderId',
                        label: 'Sub Folder',
                        placeholder: 'Select sub folder',
                        required: subFolderOptions.length > 0,
                        options: subFolderOptions,
                        loading: subFoldersLoading,
                        disabled,
                    },
                ]}
                values={{ subFolderId }}
                errors={errors.subFolderId ? { subFolderId: errors.subFolderId } : {}}
                onChange={(_, value) => onSubFolderChange(value)}
            />
        )}
    </>
);

export default PreviousYearQuizFields;
