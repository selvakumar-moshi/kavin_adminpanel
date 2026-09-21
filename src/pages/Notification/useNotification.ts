import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getNotifications, createNotification, updateNotification, deleteNotification } from '../../services/SuperSalesAction';
import type { NotificationRecord } from './Constant';
import { getNotificationTableColumns, dayjsToISOString } from './Constant';
import { useClientSideTableSortSearch } from '../../components/Table/useColumnSortSearch';
import { NOTIFICATION_VALIDATION_RULES } from '../../utils/validationUtils';

export const useNotificationManagement = () => {
    const dispatch = useDispatch();
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<NotificationRecord | null>(null);
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [operationType, setOperationType] = useState<'create' | 'edit' | 'delete' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { NotificationsData, apiStatus } = useSelector(
        (state: RootState) => state.superSales
    );

    // Server-paginated response: { items: NotificationRecord[], pageNumber, pageSize, totalCount, totalPages }
    const notificationsArray: NotificationRecord[] = Array.isArray(NotificationsData?.items) ? NotificationsData.items : [];
    const totalNotifications: number = NotificationsData?.totalCount ?? 0;
    const notificationStatus = apiStatus.NotificationsData;

    // Column-level sort & search (client-side — applied over the currently loaded page)
    const {
        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,
        applyToData,
    } = useClientSideTableSortSearch();

    const displayNotifications = applyToData(notificationsArray, getNotificationTableColumns());

    useEffect(() => {
        dispatch(getNotifications({ pageNumber: currentPage, pageSize }) as any);
    }, [dispatch, currentPage, pageSize]);

    const handlePaginationChange = (page: number, newPageSize: number) => {
        setCurrentPage(page);
        if (newPageSize !== pageSize) {
            setPageSize(newPageSize);
            setCurrentPage(1);
        }
    };

    useEffect(() => {
        if (!operationType) return;

        if (notificationStatus?.success) {
            if (operationType === 'create') {
                showSuccess('Notification created successfully!');
            } else if (operationType === 'edit') {
                showSuccess('Notification updated successfully!');
            } else if (operationType === 'delete') {
                showSuccess('Notification deleted successfully!');
            }
            setIsModalVisible(false);
            setIsDeleteModalVisible(false);
            setFormValues({});
            setFormErrors({});
            setSelectedNotification(null);
            setOperationType(null);
            dispatch(getNotifications({ pageNumber: currentPage, pageSize }) as any);
        }

        if (notificationStatus?.error) {
            showError(notificationStatus.error);
            setOperationType(null);
        }
    }, [notificationStatus, operationType, showSuccess, showError, dispatch, currentPage, pageSize]);

    const openCreateModal = () => {
        setSelectedNotification(null);
        setFormValues({});
        setFormErrors({});
        setIsModalVisible(true);
    };

    const openEditModal = (notification: NotificationRecord) => {
        setSelectedNotification(notification);
        setFormValues({
            title: notification.title || '',
            description: notification.description || '',
            link: notification.link || '',
            date: notification.date || null,
        });
        setFormErrors({});
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setSelectedNotification(null);
        setFormValues({});
        setFormErrors({});
    };

    const openDeleteModal = (notification: NotificationRecord) => {
        setSelectedNotification(notification);
        setIsDeleteModalVisible(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalVisible(false);
        setSelectedNotification(null);
    };

    const validateSingleField = (field: string, rawValue: string): string => {
        const rule = NOTIFICATION_VALIDATION_RULES[field];
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

    const handleInputChange = (name: string, value: any) => {
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

        Object.keys(NOTIFICATION_VALIDATION_RULES).forEach((field) => {
            const error = validateSingleField(field, formValues[field]);
            if (error) {
                newErrors[field] = error;
            }
        });

        if (!formValues.date) {
            newErrors.date = 'Date is required';
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }

        const date = dayjsToISOString(formValues.date);

        if (selectedNotification) {
            setOperationType('edit');
            dispatch(updateNotification({
                id: selectedNotification.id,
                title: formValues.title,
                description: formValues.description,
                link: formValues.link,
                date,
            }) as any);
        } else {
            setOperationType('create');
            dispatch(createNotification({
                title: formValues.title,
                description: formValues.description,
                link: formValues.link,
                date,
            }) as any);
        }
    };

    const handleDeleteConfirm = () => {
        if (!selectedNotification) return;
        setOperationType('delete');
        dispatch(deleteNotification({ id: selectedNotification.id }) as any);
    };

    // Create: enabled once any field has a value. Edit: enabled once a value differs from the loaded notification.
    const hasFormChanges = selectedNotification
        ? (
            String(formValues.title || '') !== (selectedNotification.title || '') ||
            String(formValues.description || '') !== (selectedNotification.description || '') ||
            String(formValues.link || '') !== (selectedNotification.link || '') ||
            dayjsToISOString(formValues.date) !== dayjsToISOString(selectedNotification.date)
        )
        : (
            Boolean(String(formValues.title || '').trim()) ||
            Boolean(String(formValues.description || '').trim()) ||
            Boolean(String(formValues.link || '').trim()) ||
            Boolean(formValues.date)
        );

    return {
        notificationsArray: displayNotifications,
        loading: notificationStatus?.loading || false,
        currentPage,
        pageSize,
        totalNotifications,
        handlePaginationChange,

        // Column sort & search
        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,

        isModalVisible,
        isDeleteModalVisible,
        selectedNotification,
        formValues,
        formErrors,
        hasFormChanges,
        openCreateModal,
        openEditModal,
        closeModal,
        openDeleteModal,
        closeDeleteModal,
        handleInputChange,
        handleSubmit,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    };
};
