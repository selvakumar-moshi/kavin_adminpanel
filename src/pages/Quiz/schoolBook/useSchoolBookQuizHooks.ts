import { useEffect, useState } from 'react';
import superSalesAPI from '../../../services/LearningAPI';
import type { QuizSubjectOption } from '../Constant';

const toStringValue = (value: string | string[]) => (Array.isArray(value) ? value[0] || '' : value);

export interface SchoolBookSelection {
    subject?: string | null;
    category?: string | null;
    standard?: number | string | null;
    part?: string | null;
}

export interface SchoolBookQuizOptions {
    /** Set false to skip loading the options (e.g. when editing a quiz that isn't a School Book quiz) */
    enabled?: boolean;
    /** Values to start from, e.g. the saved subject / standard / part when editing */
    initial?: SchoolBookSelection;
}

export const useSchoolBookQuizManagement = (onCancel: () => void, { enabled = true, initial }: SchoolBookQuizOptions = {}) => {
    const [subjects, setSubjects] = useState<QuizSubjectOption[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(enabled);
    const [categoriesError, setCategoriesError] = useState('');

    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('');
    const [standard, setStandard] = useState('');
    const [part, setPart] = useState('');

    // Editing: start from the saved values once they arrive (plain setters, so the "clear everything below" rule
    // of the change handlers doesn't wipe them)
    const initialKey = initial ? [initial.subject, initial.category, initial.standard, initial.part].join('|') : '';
    useEffect(() => {
        if (!initial) return;
        setSubject(initial.subject || '');
        setCategory(initial.category || '');
        setStandard(initial.standard == null ? '' : String(initial.standard));
        setPart(initial.part || '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialKey]);

    // Subject / category / standard / part options all come from the API
    useEffect(() => {
        if (!enabled) return;
        setCategoriesLoading(true);
        let cancelled = false;
        superSalesAPI.getQuizCategories()
            .then((res) => {
                if (cancelled) return;
                setSubjects(Array.isArray(res?.data?.data?.subjects) ? res.data.data.subjects : []);
            })
            .catch((error: any) => {
                if (cancelled) return;
                setCategoriesError(error?.response?.data?.message || error?.message || 'Failed to load quiz categories');
            })
            .finally(() => {
                if (!cancelled) setCategoriesLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [enabled]);

    // Each level only appears once the one above it is chosen (and only if the API has options for it);
    // changing a level clears everything below it
    const selectedSubject = subjects.find((item) => item.subject === subject);
    const categories = selectedSubject?.categories ?? [];
    const showCategory = categories.length > 0;
    const selectedCategory = categories.find((item) => item.category === category);
    const standards = (showCategory ? selectedCategory?.standards : selectedSubject?.standards) ?? [];
    const showStandard = standards.length > 0;
    const parts = standards.find((item) => String(item.standard) === standard)?.parts ?? [];
    const showPart = parts.length > 0;

    const subjectOptions = subjects.map((item) => ({ value: item.subject, label: item.subject }));
    const categoryOptions = categories.map((item) => ({ value: item.category, label: item.category }));
    const standardOptions = standards.map((item) => ({ value: String(item.standard), label: `${item.standard}th Standard` }));
    const partOptions = parts.map((item) => ({ value: item, label: item }));

    const [selectionErrors, setSelectionErrors] = useState<Record<string, string>>({});

    const clearSelectionError = (field: string) => {
        setSelectionErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
    };

    const handleSubjectChange = (value: string | string[]) => {
        setSubject(toStringValue(value));
        setCategory('');
        setStandard('');
        setPart('');
        setSelectionErrors({});
    };

    const handleCategoryChange = (value: string | string[]) => {
        setCategory(toStringValue(value));
        setStandard('');
        setPart('');
        clearSelectionError('category');
    };

    const handleStandardChange = (value: string | string[]) => {
        setStandard(toStringValue(value));
        setPart('');
        clearSelectionError('standard');
    };

    const handlePartChange = (value: string | string[]) => {
        setPart(toStringValue(value));
        clearSelectionError('part');
    };

    // Every level that is currently shown must be chosen; returns the values to send, or null when something is missing
    const getSelectionFields = (): Record<string, string> | null => {
        const errors: Record<string, string> = {};
        if (!subject) errors.subject = 'Subject is required';
        if (showCategory && !category) errors.category = 'Category is required';
        if (showStandard && !standard) errors.standard = 'Standard is required';
        if (showPart && !part) errors.part = 'Part is required';
        setSelectionErrors(errors);
        if (Object.keys(errors).length > 0) return null;

        return {
            subject,
            ...(showCategory ? { category } : {}),
            ...(showStandard ? { standard } : {}),
            ...(showPart ? { part } : {}),
        };
    };

    return {
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
        getSelectionFields,
        showCategory,
        showStandard,
        showPart,
        handleSubjectChange,
        handleCategoryChange,
        handleStandardChange,
        handlePartChange,
        handleCancel: onCancel,
    };
};
