import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../../services/SuperSalesAction';
import type { CourseRecord } from './Constant';
import { COURSE_VALIDATION_RULES } from '../../utils/validationUtils';

export const useCourseManagement = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<CourseRecord | null>(null);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [operationType, setOperationType] = useState<'create' | 'edit' | 'delete' | null>(null);

    const { CoursesData, apiStatus } = useSelector(
        (state: RootState) => state.superSales
    );

    const coursesArray = Array.isArray(CoursesData) ? CoursesData : [];
    const loading = apiStatus.CoursesData?.loading || false;

    useEffect(() => {
        dispatch(getCourses() as any);
    }, [dispatch]);

    useEffect(() => {
        if (!operationType) return;

        if (apiStatus.CoursesData?.success) {
            if (operationType === 'create') {
                showSuccess('Course created successfully!');
                setIsCreateModalVisible(false);
            } else if (operationType === 'edit') {
                showSuccess('Course updated successfully!');
                setIsEditModalVisible(false);
            } else if (operationType === 'delete') {
                showSuccess('Course deleted successfully!');
                setIsDeleteModalVisible(false);
            }
            setFormValues({});
            setFormErrors({});
            setSelectedCourse(null);
            setOperationType(null);
            dispatch(getCourses() as any);
        }

        if (apiStatus.CoursesData?.error) {
            showError(apiStatus.CoursesData.error);
            setOperationType(null);
        }
    }, [apiStatus.CoursesData, operationType, showSuccess, showError, dispatch]);

    const openCreateModal = () => {
        setFormValues({});
        setFormErrors({});
        setIsCreateModalVisible(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalVisible(false);
        setFormValues({});
        setFormErrors({});
    };

    const openEditModal = (course: CourseRecord) => {
        setSelectedCourse(course);
        setFormValues({
            courseName: course.courseName || '',
            courseDescription: course.courseDescription || '',
            courseAmount: course.courseAmount !== undefined ? String(course.courseAmount) : '',
        });
        setFormErrors({});
        setIsEditModalVisible(true);
    };

    const closeEditModal = () => {
        setIsEditModalVisible(false);
        setFormValues({});
        setFormErrors({});
        setSelectedCourse(null);
    };

    const openDeleteModal = (course: CourseRecord) => {
        setSelectedCourse(course);
        setIsDeleteModalVisible(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalVisible(false);
        setSelectedCourse(null);
    };

    const validateSingleField = (field: string, rawValue: string): string => {
        const rule = COURSE_VALIDATION_RULES[field];
        if (!rule) return '';

        const value = (rawValue || '').trim();

        if (rule.required && !value) {
            return rule.errorMessages.required || 'This field is required';
        }
        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
            return rule.errorMessages.maxLength || `Must not exceed ${rule.maxLength} characters.`;
        }
        if (rule.pattern && value && !rule.pattern.test(value)) {
            return rule.errorMessages.pattern || 'Invalid format.';
        }
        return '';
    };

    const handleInputChange = (name: string, value: string) => {
        setFormValues(prev => ({ ...prev, [name]: value }));

        const error = validateSingleField(name, value);
        setFormErrors(prev => {
            const newErrors = { ...prev };
            if (error) {
                newErrors[name] = error;
            } else {
                delete newErrors[name];
            }
            return newErrors;
        });
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        Object.keys(COURSE_VALIDATION_RULES).forEach((field) => {
            const error = validateSingleField(field, formValues[field]);
            if (error) {
                newErrors[field] = error;
            }
        });

        if (!formValues.courseAmount || formValues.courseAmount.trim() === '') {
            newErrors.courseAmount = 'Amount is required';
        } else if (Number.isNaN(Number(formValues.courseAmount)) || Number(formValues.courseAmount) < 0) {
            newErrors.courseAmount = 'Amount must be a valid positive number';
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateSubmit = () => {
        if (!validateForm()) {
            return;
        }

        setOperationType('create');
        dispatch(createCourse({
            courseName: formValues.courseName,
            courseDescription: formValues.courseDescription || '',
            courseAmount: Number(formValues.courseAmount),
        }) as any);
    };

    const handleEditSubmit = () => {
        if (!selectedCourse) return;

        if (!validateForm()) {
            return;
        }

        setOperationType('edit');
        dispatch(updateCourse({
            id: selectedCourse.id,
            courseName: formValues.courseName,
            courseDescription: formValues.courseDescription || '',
            courseAmount: Number(formValues.courseAmount),
        }) as any);
    };

    const handleDeleteConfirm = () => {
        if (!selectedCourse) return;
        setOperationType('delete');
        dispatch(deleteCourse({ id: selectedCourse.id }) as any);
    };

    const handleCardClick = (id: string) => {
        navigate(`/course/${id}`);
    };

    // Create: enabled once any field has a value. Edit: enabled once a value differs from the loaded course.
    const hasFormChanges = selectedCourse
        ? (
            formValues.courseName !== (selectedCourse.courseName || '') ||
            formValues.courseDescription !== (selectedCourse.courseDescription || '') ||
            formValues.courseAmount !== (selectedCourse.courseAmount !== undefined ? String(selectedCourse.courseAmount) : '')
        )
        : (
            Boolean(formValues.courseName?.trim()) ||
            Boolean(formValues.courseDescription?.trim()) ||
            Boolean(formValues.courseAmount?.trim())
        );

    return {
        coursesArray,
        loading,
        isCreateModalVisible,
        isEditModalVisible,
        isDeleteModalVisible,
        selectedCourse,
        formValues,
        formErrors,
        isSaving: loading,
        hasFormChanges,
        openCreateModal,
        closeCreateModal,
        openEditModal,
        closeEditModal,
        openDeleteModal,
        closeDeleteModal,
        handleInputChange,
        handleCreateSubmit,
        handleEditSubmit,
        handleDeleteConfirm,
        handleCardClick,
        toastMessages,
        hideToast,
    };
};
