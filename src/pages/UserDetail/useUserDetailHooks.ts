import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getUserById, updateUser, updateEnrollmentStatus, getCourses } from '../../services/LearningAction';
import superSalesAPI from '../../services/LearningAPI';
import type { UserDetailRecord } from './Constants';
import { EDIT_USER_VALIDATION_RULES } from '../../utils/validationUtils';
import type { CourseRecord, BatchRecord } from '../Course/Constant';

export interface SelectedCourseEntry {
    courseId: string;
    batchId: string;
}

export const useUserDetailManagement = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isUpdating, setIsUpdating] = useState(false);

    // Newly-added course/batch enrollments chosen in the edit modal (already-purchased courses are shown disabled, not selectable)
    const [selectedCourses, setSelectedCourses] = useState<SelectedCourseEntry[]>([]);
    const [batchesByCourse, setBatchesByCourse] = useState<Record<string, BatchRecord[]>>({});
    const [batchesLoadingByCourse, setBatchesLoadingByCourse] = useState<Record<string, boolean>>({});

    // Enrollment whose status-change API call is currently in flight
    const [updatingEnrollmentId, setUpdatingEnrollmentId] = useState<string | null>(null);

    const { UserDetailData, CoursesData, apiStatus } = useSelector(
        (state: RootState) => state.learning
    );

    const userDetail = UserDetailData as UserDetailRecord | null;
    const coursesArray = Array.isArray(CoursesData) ? (CoursesData as CourseRecord[]) : [];
    const detailStatus = apiStatus.UserDetailData;
    const updateStatus = apiStatus.UsersData;
    const enrollmentStatusApi = apiStatus.EnrollmentStatusData;

    useEffect(() => {
        if (id) {
            dispatch(getUserById(id) as any);
        }
    }, [dispatch, id]);

    useEffect(() => {
        dispatch(getCourses() as any);
    }, [dispatch]);

    useEffect(() => {
        if (!isUpdating) return;

        if (updateStatus?.success) {
            showSuccess('User updated successfully!');
            setIsEditModalVisible(false);
            setIsUpdating(false);
            setSelectedCourses([]);
            setBatchesByCourse({});
            setBatchesLoadingByCourse({});
            if (id) {
                dispatch(getUserById(id) as any);
            }
        }

        if (updateStatus?.error) {
            showError(updateStatus.error);
            setIsUpdating(false);
        }
    }, [updateStatus, isUpdating, showSuccess, showError, dispatch, id]);

    useEffect(() => {
        if (!updatingEnrollmentId) return;

        if (enrollmentStatusApi?.success) {
            showSuccess('Enrollment status updated successfully!');
            setUpdatingEnrollmentId(null);
            if (id) {
                dispatch(getUserById(id) as any);
            }
        }

        if (enrollmentStatusApi?.error) {
            showError(enrollmentStatusApi.error);
            setUpdatingEnrollmentId(null);
        }
    }, [enrollmentStatusApi, updatingEnrollmentId, showSuccess, showError, dispatch, id]);

    const openEditModal = () => {
        if (!userDetail) return;
        setFormValues({
            firstName: userDetail.firstName || '',
            lastName: userDetail.lastName || '',
            phoneNumber: userDetail.phoneNumber || '',
            district: userDetail.district || '',
        });
        setFormErrors({});
        setSelectedCourses([]);
        setBatchesByCourse({});
        setBatchesLoadingByCourse({});
        setIsEditModalVisible(true);
    };

    const closeEditModal = () => {
        setIsEditModalVisible(false);
        setFormValues({});
        setFormErrors({});
        setSelectedCourses([]);
        setBatchesByCourse({});
        setBatchesLoadingByCourse({});
    };

    const fetchBatchesForCourse = async (courseId: string) => {
        setBatchesLoadingByCourse(prev => ({ ...prev, [courseId]: true }));
        try {
            const res = await superSalesAPI.getBatches(courseId, undefined, undefined, 1, 100);
            setBatchesByCourse(prev => ({ ...prev, [courseId]: res?.data?.data?.items || [] }));
        } catch {
            setBatchesByCourse(prev => ({ ...prev, [courseId]: [] }));
        } finally {
            setBatchesLoadingByCourse(prev => ({ ...prev, [courseId]: false }));
        }
    };

    const handleCourseSelectionChange = (courseIds: string[]) => {
        setSelectedCourses(prev =>
            courseIds.map(courseId => prev.find(c => c.courseId === courseId) || { courseId, batchId: '' })
        );
        if (formErrors.courses) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.courses;
                return newErrors;
            });
        }

        courseIds.forEach(courseId => {
            if (!batchesByCourse[courseId]) {
                fetchBatchesForCourse(courseId);
            }
        });
    };

    const handleCourseBatchChange = (courseId: string, batchId: string) => {
        setSelectedCourses(prev => prev.map(c => (c.courseId === courseId ? { ...c, batchId } : c)));
        if (formErrors.courses) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.courses;
                return newErrors;
            });
        }
    };

    const validateSingleField = (field: string, rawValue: string): string => {
        const rule = (EDIT_USER_VALIDATION_RULES as Record<string, typeof EDIT_USER_VALIDATION_RULES[keyof typeof EDIT_USER_VALIDATION_RULES]>)[field];
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

        Object.keys(EDIT_USER_VALIDATION_RULES).forEach((field) => {
            const error = validateSingleField(field, formValues[field]);
            if (error) {
                newErrors[field] = error;
            }
        });

        if (selectedCourses.some(c => !c.batchId)) {
            newErrors.courses = 'Please select a batch for every chosen course';
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEditSubmit = () => {
        if (!userDetail) return;

        if (!validateForm()) {
            return;
        }

        setIsUpdating(true);
        dispatch(updateUser({
            id: userDetail.userId,
            firstName: formValues.firstName,
            lastName: formValues.lastName,
            phoneNumber: formValues.phoneNumber,
            district: formValues.district,
            courses: selectedCourses,
        }) as any);
    };

    const handleStatusChange = (enrollmentId: string, status: string) => {
        setUpdatingEnrollmentId(enrollmentId);
        dispatch(updateEnrollmentStatus({ enrollmentId, status, paymentMethod: '', transactionReference: '' }) as any);
    };

    // Update button stays disabled until something actually changes from the loaded user
    const hasFormChanges = Boolean(userDetail) && (
        formValues.firstName !== (userDetail?.firstName || '') ||
        formValues.lastName !== (userDetail?.lastName || '') ||
        formValues.phoneNumber !== (userDetail?.phoneNumber || '') ||
        formValues.district !== (userDetail?.district || '') ||
        selectedCourses.length > 0
    );

    return {
        userDetail,
        coursesArray,
        selectedCourses,
        batchesByCourse,
        batchesLoadingByCourse,
        loading: detailStatus?.loading || false,
        isEditModalVisible,
        formValues,
        formErrors,
        isUpdating,
        hasFormChanges,
        openEditModal,
        closeEditModal,
        handleInputChange,
        handleCourseSelectionChange,
        handleCourseBatchChange,
        handleEditSubmit,
        updatingEnrollmentId,
        handleStatusChange,
        toastMessages,
        hideToast,
    };
};
