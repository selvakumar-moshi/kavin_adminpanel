import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getCourseById, updateCourse, deleteCourse } from '../../services/SuperSalesAction';
import type { CourseDetailRecord } from './Constant';
import { COURSE_VALIDATION_RULES } from '../../utils/validationUtils';

export const useCourseDetailManagement = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [operationType, setOperationType] = useState<'update' | 'delete' | null>(null);

    const { CourseDetailData, apiStatus } = useSelector(
        (state: RootState) => state.superSales
    );

    const courseDetail = CourseDetailData as CourseDetailRecord | null;
    const detailStatus = apiStatus.CourseDetailData;
    const mutationStatus = apiStatus.CoursesData;

    useEffect(() => {
        if (id) {
            dispatch(getCourseById(id) as any);
        }
    }, [dispatch, id]);

    useEffect(() => {
        if (!operationType) return;

        if (mutationStatus?.success) {
            if (operationType === 'update') {
                showSuccess('Course updated successfully!');
                setIsEditModalVisible(false);
                if (id) {
                    dispatch(getCourseById(id) as any);
                }
            } else if (operationType === 'delete') {
                showSuccess('Course deleted successfully!');
                setIsDeleteModalVisible(false);
                navigate('/course');
            }
            setOperationType(null);
        }

        if (mutationStatus?.error) {
            showError(mutationStatus.error);
            setOperationType(null);
        }
    }, [mutationStatus, operationType, showSuccess, showError, dispatch, id, navigate]);

    const openEditModal = () => {
        if (!courseDetail) return;
        setFormValues({
            courseName: courseDetail.courseName || '',
            courseDescription: courseDetail.courseDescription || '',
            courseAmount: courseDetail.courseAmount !== undefined ? String(courseDetail.courseAmount) : '',
        });
        setFormErrors({});
        setIsEditModalVisible(true);
    };

    const closeEditModal = () => {
        setIsEditModalVisible(false);
        setFormValues({});
        setFormErrors({});
    };

    const openDeleteModal = () => {
        setIsDeleteModalVisible(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalVisible(false);
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

    const handleEditSubmit = () => {
        if (!courseDetail) return;

        if (!validateForm()) {
            return;
        }

        setOperationType('update');
        dispatch(updateCourse({
            id: courseDetail.id,
            courseName: formValues.courseName,
            courseDescription: formValues.courseDescription || '',
            courseAmount: Number(formValues.courseAmount),
        }) as any);
    };

    const handleDeleteConfirm = () => {
        if (!courseDetail) return;
        setOperationType('delete');
        dispatch(deleteCourse({ id: courseDetail.id }) as any);
    };

    // Enabled once a value differs from the loaded course
    const hasFormChanges = Boolean(courseDetail) && (
        formValues.courseName !== (courseDetail?.courseName || '') ||
        formValues.courseDescription !== (courseDetail?.courseDescription || '') ||
        formValues.courseAmount !== (courseDetail?.courseAmount !== undefined ? String(courseDetail.courseAmount) : '')
    );

    return {
        courseDetail,
        loading: detailStatus?.loading || false,
        isSaving: mutationStatus?.loading || false,
        isEditModalVisible,
        isDeleteModalVisible,
        formValues,
        formErrors,
        hasFormChanges,
        openEditModal,
        closeEditModal,
        openDeleteModal,
        closeDeleteModal,
        handleInputChange,
        handleEditSubmit,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    };
};
