import { useCallback, useEffect, useState } from 'react';
import superSalesAPI from '../../services/LearningAPI';
import { useToastMessages } from '../ToastMessages/useToastMessages';
import { STRUCTURE_META, NAME_MAX_LENGTH, formatStandard, type StructureTab, type StructureRecord, type RawStandardEntry, type EmbeddedStandardParts, type SubjectRecord, type CategoryRecord, type StandardRecord, type PartRecord } from './Constant';

const toList = <T,>(res: any): T[] => (Array.isArray(res?.data?.data) ? res.data.data : []);
const toArray = (value: unknown): string[] => (Array.isArray(value) ? (value as string[]) : value ? [String(value)] : []);

// Accepts `standards` as numbers or as { standard, parts } objects and returns the plain numbers
// (the shape the forms use) plus any parts that came embedded
const normalizeStandards = (raw: unknown): { standards: number[]; standardParts: EmbeddedStandardParts } => {
    const standards: number[] = [];
    const standardParts: EmbeddedStandardParts = {};

    (Array.isArray(raw) ? (raw as RawStandardEntry[]) : []).forEach((entry) => {
        const number = typeof entry === 'number' ? entry : entry?.standard;
        if (typeof number !== 'number' || Number.isNaN(number)) return;
        standards.push(number);
        if (typeof entry === 'object' && Array.isArray(entry.parts)) standardParts[number] = entry.parts;
    });

    return { standards, standardParts };
};

// A category / subject with its standards resolved (each with its parts), ready to render
export type CategoryNode = CategoryRecord & { standardRows: StandardRecord[] };
export interface SubjectNode extends SubjectRecord {
    categories: CategoryNode[];
    standardRows: StandardRecord[];
}

// Subjects and categories both own a list of standards, each with its own parts
export type StandardOwnerKind = 'subjects' | 'categories';
type StandardOwner = SubjectNode | CategoryNode;

// A standard inside one subject / category (its parts belong to that owner); `standard` is null while adding a new one
interface OwnerStandardTarget {
    kind: StandardOwnerKind;
    owner: StandardOwner;
    standard: number | null;
}

type OwnerStandardPayload = { standard: number; parts: string[] };
const toOwnerStandards = (rows: { standard: number; parts: string[] }[]): OwnerStandardPayload[] =>
    rows.map((row) => ({ standard: row.standard, parts: row.parts }));

// What a subject / category update has to send besides its standards
const ownerBaseFields = (kind: StandardOwnerKind, owner: StandardOwner): Record<string, unknown> =>
    kind === 'categories' ? { name: owner.name, subject: (owner as CategoryNode).subject } : { name: owner.name };

export const useSchoolBookRevisionManagement = () => {
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

    const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
    const [categories, setCategories] = useState<CategoryRecord[]>([]);
    const [standards, setStandards] = useState<StandardRecord[]>([]);
    const [parts, setParts] = useState<PartRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // What the open Add / Edit / Delete modal is about
    const [entity, setEntity] = useState<StructureTab>('subjects');
    // Set while the modal edits / adds a standard inside a subject or category (saved through that owner's update API)
    const [ownerStandard, setOwnerStandard] = useState<OwnerStandardTarget | null>(null);
    // Set while the delete modal asks to take a standard off a subject / category
    const [removeTarget, setRemoveTarget] = useState<{ kind: StandardOwnerKind; owner: StandardOwner; standard: number } | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<StructureRecord | null>(null);
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Subjects, standards and parts feed each other's dropdowns, and categories are listed per subject,
    // so everything is (re)loaded together
    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [subjectsRes, standardsRes, partsRes] = await Promise.all([
                superSalesAPI.getQuizStructure('subjects'),
                superSalesAPI.getQuizStructure('standards'),
                superSalesAPI.getQuizStructure('parts'),
            ]);
            // The API can leave a list out (or send null) for an item with nothing in it; treat that as empty
            const subjectList = toList<SubjectRecord>(subjectsRes).map((item) => ({ ...item, ...normalizeStandards(item.standards) }));
            const categoryResponses = await Promise.all(
                subjectList.map((subject) => superSalesAPI.getQuizStructure('categories', { subject: subject.name }))
            );

            setSubjects(subjectList);
            setStandards(toList<StandardRecord>(standardsRes).map((item) => ({ ...item, parts: item.parts ?? [] })));
            setParts(toList<PartRecord>(partsRes));
            setCategories(
                categoryResponses
                    .flatMap((res) => toList<CategoryRecord>(res))
                    .map((item) => ({ ...item, ...normalizeStandards(item.standards) }))
            );
        } catch (error: any) {
            showError(error?.response?.data?.message || error?.message || 'Failed to load school book data');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // Standards a subject / category lists by number, resolved to their records (with parts). Parts embedded with
    // the owner win when present; a standard missing from the standards list still shows
    const resolveStandards = (numbers: number[], embedded: EmbeddedStandardParts = {}): StandardRecord[] =>
        numbers.map((number) => {
            const record = standards.find((item) => item.standard === number);
            const embeddedParts = embedded[number];
            const resolvedParts = embeddedParts && embeddedParts.length > 0 ? embeddedParts : record?.parts ?? [];
            return record ? { ...record, parts: resolvedParts } : { id: '', standard: number, parts: resolvedParts };
        });

    const tree: SubjectNode[] = subjects.map((subject) => ({
        ...subject,
        standardRows: resolveStandards(subject.standards, subject.standardParts),
        categories: categories
            .filter((category) => category.subject === subject.name)
            .map((category) => ({ ...category, standardRows: resolveStandards(category.standards, category.standardParts) })),
    }));

    // Options for the form dropdowns
    const subjectOptions = subjects.map((item) => ({ value: item.name, label: item.name }));
    const standardOptions = standards.map((item) => ({ value: String(item.standard), label: formatStandard(item.standard) }));
    const partOptions = parts.map((item) => ({ value: item.name, label: item.name }));

    const singular = STRUCTURE_META[entity].singular;

    const openCreateModal = (forEntity: StructureTab, context?: { subject?: SubjectRecord }) => {
        setEntity(forEntity);
        setSelectedRecord(null);
        setOwnerStandard(null);
        // A category added inside a subject already knows its subject
        setFormValues(forEntity === 'categories' && context?.subject ? { subject: context.subject.name } : {});
        setFormErrors({});
        setIsModalVisible(true);
    };

    // For a subject / category being edited: which parts each of its standards currently has
    const partsByStandardOf = (record: StructureRecord): Record<string, string[]> => {
        const rows = 'standardRows' in record ? (record as StandardOwner).standardRows : [];
        return Object.fromEntries(rows.map((row) => [String(row.standard), row.parts]));
    };

    const openEditModal = (forEntity: StructureTab, record: StructureRecord) => {
        setEntity(forEntity);
        setSelectedRecord(record);
        setOwnerStandard(null);
        setFormErrors({});

        if (forEntity === 'subjects') {
            const item = record as SubjectRecord;
            setFormValues({ name: item.name, standards: item.standards.map(String), partsByStandard: partsByStandardOf(record) });
        } else if (forEntity === 'categories') {
            const item = record as CategoryRecord;
            setFormValues({
                name: item.name,
                subject: item.subject,
                standards: item.standards.map(String),
                partsByStandard: partsByStandardOf(record),
            });
        } else if (forEntity === 'standards') {
            const item = record as StandardRecord;
            setFormValues({ standard: String(item.standard), parts: item.parts });
        } else {
            setFormValues({ name: (record as PartRecord).name });
        }
        setIsModalVisible(true);
    };

    // Edit (standard given) or add (null) a standard inside a subject / category
    const openOwnerStandardModal = (kind: StandardOwnerKind, owner: StandardOwner, standard: number | null = null) => {
        const current = standard === null ? undefined : owner.standardRows.find((row) => row.standard === standard);
        setEntity(kind);
        setSelectedRecord(null);
        setOwnerStandard({ kind, owner, standard });
        setFormValues({ standard: standard === null ? '' : String(standard), parts: current?.parts ?? [] });
        setFormErrors({});
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setSelectedRecord(null);
        setOwnerStandard(null);
        setFormValues({});
        setFormErrors({});
    };

    const openDeleteModal = (forEntity: StructureTab, record: StructureRecord) => {
        setEntity(forEntity);
        setSelectedRecord(record);
        setRemoveTarget(null);
        setIsDeleteModalVisible(true);
    };

    // "Delete" on a standard inside a subject / category takes it off that owner; it doesn't delete the standard itself
    const openRemoveStandardModal = (kind: StandardOwnerKind, owner: StandardOwner, standard: number) => {
        setSelectedRecord(null);
        setRemoveTarget({ kind, owner, standard });
        setIsDeleteModalVisible(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalVisible(false);
        setSelectedRecord(null);
        setRemoveTarget(null);
    };

    const handleInputChange = (name: string, value: any) => {
        setFormValues((prev) => ({ ...prev, [name]: value }));
        setFormErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
    };

    // Parts picked for one of the standards in the subject / category form
    const handleStandardPartsChange = (standard: string, value: string[]) => {
        setFormValues((prev) => ({ ...prev, partsByStandard: { ...(prev.partsByStandard || {}), [standard]: value } }));
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (ownerStandard || entity === 'standards') {
            const standard = String(formValues.standard ?? '').trim();
            if (!standard) errors.standard = 'Standard is required';
            else if (!/^[1-9]\d*$/.test(standard)) errors.standard = 'Enter a whole number, e.g. 6';
            else if (ownerStandard && ownerStandard.standard === null
                && ownerStandard.owner.standardRows.some((row) => row.standard === Number(standard))) {
                errors.standard = `${formatStandard(standard)} is already added to ${ownerStandard.owner.name}`;
            }
        } else {
            const name = String(formValues.name ?? '').trim();
            if (!name) errors.name = 'Name is required';
            else if (name.length > NAME_MAX_LENGTH) errors.name = `Name must not exceed ${NAME_MAX_LENGTH} characters.`;
        }

        if (entity === 'categories' && !ownerStandard && !formValues.subject) errors.subject = 'Subject is required';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // The owner's whole standards list with the one being edited / added applied
    const ownerStandardsWithChange = (target: OwnerStandardTarget): OwnerStandardPayload[] => {
        const number = Number(formValues.standard);
        const newParts = toArray(formValues.parts);
        const rows = toOwnerStandards(target.owner.standardRows);

        if (target.standard === null) return [...rows, { standard: number, parts: newParts }];
        return rows.map((row) => (row.standard === target.standard ? { standard: number, parts: newParts } : row));
    };

    const buildPayload = (): Record<string, unknown> => {
        const numbers = (value: unknown) => toArray(value).map(Number).filter((n) => !Number.isNaN(n));
        // Each chosen standard goes out with the parts picked for it in the form
        const standardsWithParts = () =>
            numbers(formValues.standards).map((standard) => ({
                standard,
                parts: toArray(formValues.partsByStandard?.[String(standard)]),
            }));

        if (entity === 'subjects') {
            return { name: String(formValues.name).trim(), standards: standardsWithParts() };
        }
        if (entity === 'categories') {
            return { name: String(formValues.name).trim(), subject: formValues.subject, standards: standardsWithParts() };
        }
        if (entity === 'standards') {
            return { standard: Number(formValues.standard), parts: toArray(formValues.parts) };
        }
        return { name: String(formValues.name).trim() };
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            if (ownerStandard) {
                const { kind, owner } = ownerStandard;
                await superSalesAPI.updateQuizStructure(STRUCTURE_META[kind].apiPath, owner.id, {
                    ...ownerBaseFields(kind, owner),
                    standards: ownerStandardsWithChange(ownerStandard),
                });
                showSuccess(ownerStandard.standard === null ? 'Standard added successfully!' : 'Standard updated successfully!');
            } else {
                const { apiPath } = STRUCTURE_META[entity];
                const payload = buildPayload();
                if (selectedRecord) {
                    await superSalesAPI.updateQuizStructure(apiPath, selectedRecord.id, payload);
                    showSuccess(`${singular} updated successfully!`);
                } else {
                    await superSalesAPI.createQuizStructure(apiPath, payload);
                    showSuccess(`${singular} created successfully!`);
                }
            }
            closeModal();
            await loadAll();
        } catch (error: any) {
            showError(error?.response?.data?.message || error?.message || `Failed to save ${singular.toLowerCase()}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        setIsSaving(true);
        try {
            if (removeTarget) {
                const { kind, owner, standard } = removeTarget;
                await superSalesAPI.updateQuizStructure(STRUCTURE_META[kind].apiPath, owner.id, {
                    ...ownerBaseFields(kind, owner),
                    standards: toOwnerStandards(owner.standardRows.filter((row) => row.standard !== standard)),
                });
                showSuccess('Standard removed successfully!');
            } else if (selectedRecord) {
                await superSalesAPI.deleteQuizStructure(STRUCTURE_META[entity].apiPath, selectedRecord.id);
                showSuccess(`${singular} deleted successfully!`);
            } else {
                return;
            }
            closeDeleteModal();
            await loadAll();
        } catch (error: any) {
            showError(error?.response?.data?.message || error?.message || `Failed to delete ${singular.toLowerCase()}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Texts for the two modals
    const modalTitle = ownerStandard
        ? ownerStandard.standard === null
            ? `Add Standard to ${ownerStandard.owner.name}`
            : `Edit ${formatStandard(ownerStandard.standard)} (${ownerStandard.owner.name})`
        : `${selectedRecord ? 'Edit' : 'Add'} ${singular}`;

    const deleteMessage = removeTarget
        ? `Remove ${formatStandard(removeTarget.standard)} from ${removeTarget.owner.name}?`
        : selectedRecord
            ? `Are you sure you want to delete the ${singular.toLowerCase()} "${
                'standard' in selectedRecord ? formatStandard(selectedRecord.standard) : selectedRecord.name
            }"?`
            : '';

    return {
        entity,
        singular,
        tree,
        parts,
        standards: [...standards].sort((a, b) => a.standard - b.standard),
        loading,
        subjectOptions,
        standardOptions,
        partOptions,
        isModalVisible,
        isDeleteModalVisible,
        selectedRecord,
        ownerStandard,
        removeTarget,
        modalTitle,
        deleteMessage,
        formValues,
        formErrors,
        isSaving,
        openCreateModal,
        openEditModal,
        openOwnerStandardModal,
        closeModal,
        openDeleteModal,
        openRemoveStandardModal,
        closeDeleteModal,
        handleInputChange,
        handleStandardPartsChange,
        handleSubmit,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    };
};
