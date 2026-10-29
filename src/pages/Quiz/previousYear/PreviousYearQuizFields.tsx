import DropdownField from '../../../components/DropdownField/DropdownField';
import type { FolderLevel } from './useFolderSelectorHooks';

type Option = { value: string; label: string };
type OnChange = (value: string | string[]) => void;

export interface PreviousYearQuizFieldsProps {
    disabled: boolean;
    folderId: string;
    folderOptions: Option[];
    /** One dropdown per level below the folder: sub folder, nested sub folder, ... */
    levels: FolderLevel[];
    foldersLoading: boolean;
    subFoldersLoading: boolean;
    loadError: string;
    errors: Record<string, string>;
    showSubFolder: boolean;
    onFolderChange: OnChange;
    onLevelChange: (index: number, value: string | string[]) => void;
}

// Left-hand fields of a folder based quiz (add and edit): the folder it lives in, then a dropdown for each level
// below it (sub folder, nested sub folders, ...) while the chosen one has something inside
const PreviousYearQuizFields = ({
    disabled,
    folderId,
    folderOptions,
    levels,
    foldersLoading,
    subFoldersLoading,
    loadError,
    errors,
    showSubFolder,
    onFolderChange,
    onLevelChange,
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

        {showSubFolder && levels.map((level, index) => (
            <DropdownField
                key={`${index}-${level.label}`}
                fields={[
                    {
                        name: `level${index}`,
                        label: level.label,
                        placeholder: `Select ${level.label.toLowerCase()}`,
                        required: true,
                        options: level.options,
                        loading: index === 0 && subFoldersLoading,
                        disabled,
                    },
                ]}
                values={{ [`level${index}`]: level.value }}
                errors={errors[`level${index}`] ? { [`level${index}`]: errors[`level${index}`] } : {}}
                onChange={(_, value) => onLevelChange(index, value)}
            />
        ))}
    </>
);

export default PreviousYearQuizFields;
