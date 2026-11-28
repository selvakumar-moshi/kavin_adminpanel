import { useState, useEffect } from 'react';
import type { UploadFile } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getNotifications, createNotification, updateNotification, deleteNotification } from '../../services/LearningAction';
import type { NotificationRecord } from './Constant';
import dayjs from 'dayjs';
import { getNotificationTableColumns, dayjsToISOString, NOTIFICATION_SEARCH_INPUT_FIELDS, FLASH_NOTIFICATION_TYPE, JOB_NOTIFICATION_TYPE } from './Constant';
import { NOTIFICATION_FILTER_FIELDS } from '../../utils/filterUtils';
import { useClientSideTableSortSearch } from '../../components/Table/useColumnSortSearch';
import { NOTIFICATION_VALIDATION_RULES } from '../../utils/validationUtils';
import { useCourseBatchOptions } from '../../utils/useCourseBatchOptions';
import superSalesAPI from '../../services/LearningAPI';

export const useNotificationManagement = () => {
    const dispatch = useDispatch();
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<NotificationRecord | null>(null);
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    // The optional file; when editing, the saved one is shown until it is removed (replacingFile)
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [replacingFile, setReplacingFile] = useState(false);
    // Send push / cancel push: the notification being confirmed, and whether the call is running
    const [pushTarget, setPushTarget] = useState<{ type: 'send' | 'cancel'; notification: NotificationRecord } | null>(null);
    const [isPushing, setIsPushing] = useState(false);
    const [operationType, setOperationType] = useState<'create' | 'edit' | 'delete' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchValue, setSearchValue] = useState('');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
    const activeFilterCount = Object.values(appliedFilters).filter(value => value && value.trim() !== '').length;

    // Course / batch dropdowns, and the users the notification can be sent to (loaded the first time the form opens)
    const { courses, batches, batchesLoading, loadBatches } = useCourseBatchOptions(showError);
    const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    // Once a batch is chosen, only its users are listed
    const [batchRecipients, setBatchRecipients] = useState<{ id: string; name: string }[]>([]);
    const [recipientsLoading, setRecipientsLoading] = useState(false);

    const { NotificationsData, apiStatus } = useSelector(
        (state: RootState) => state.learning
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

    // Search/filter changes always start back at page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [searchValue, appliedFilters]);

    useEffect(() => {
        dispatch(getNotifications({
            searchTerm: searchValue.trim() || undefined,
            globalFilter: appliedFilters,
            pageNumber: currentPage,
            pageSize,
        }) as any);
    }, [dispatch, currentPage, pageSize, searchValue, appliedFilters]);

    const handlePaginationChange = (page: number, newPageSize: number) => {
        setCurrentPage(page);
        if (newPageSize !== pageSize) {
            setPageSize(newPageSize);
            setCurrentPage(1);
        }
    };

    const handleSearchChange = (_name: string, value: string) => {
        setSearchValue(value);
    };

    const toggleFilterDropdown = () => {
        setIsFilterDropdownOpen(prev => !prev);
    };

    const closeFilterModal = () => {
        setIsFilterDropdownOpen(false);
    };

    const handleApplyFilters = (filters: Record<string, string>) => {
        setAppliedFilters(filters);
    };

    const handleResetFilters = () => {
        setAppliedFilters({});
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
            setFileList([]);
            setReplacingFile(false);
            setSelectedNotification(null);
            setOperationType(null);
            dispatch(getNotifications({
                searchTerm: searchValue.trim() || undefined,
                globalFilter: appliedFilters,
                pageNumber: currentPage,
                pageSize,
            }) as any);
        }

        if (notificationStatus?.error) {
            showError(notificationStatus.error);
            setOperationType(null);
        }
    }, [notificationStatus, operationType, showSuccess, showError, dispatch, currentPage, pageSize, searchValue, appliedFilters]);

    // Users are listed by name, 1000 at a time (the Users API is paged); each keeps its id for the request
    const loadUsers = async () => {
        if (users.length > 0 || usersLoading) return;
        setUsersLoading(true);
        try {
            const res = await superSalesAPI.getUsers('', {}, 1, 1000);
            const items: any[] = Array.isArray(res?.data?.data?.items) ? res.data.data.items : [];
            setUsers(items.map((user) => ({
                id: user.userId,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() + (user.applicationNo ? ` (${user.applicationNo})` : ''),
            })));
        } catch (error: any) {
            showError(error?.response?.data?.message || error?.message || 'Failed to load users');
        } finally {
            setUsersLoading(false);
        }
    };

    // The users of the chosen batch (GET /Notification/recipients), listed by name
    const loadRecipients = async (batchId: string) => {
        if (!batchId) {
            setBatchRecipients([]);
            return;
        }
        setRecipientsLoading(true);
        try {
            const res = await superSalesAPI.getNotificationRecipients(batchId);
            const items: any[] = Array.isArray(res?.data?.data) ? res.data.data : [];
            setBatchRecipients(items.map((user) => ({
                id: user.userId,
                name: `${user.name || ''}${user.applicationNo ? ` (${user.applicationNo})` : ''}`.trim(),
            })));
        } catch (error: any) {
            setBatchRecipients([]);
            showError(error?.response?.data?.message || error?.message || 'Failed to load batch users');
        } finally {
            setRecipientsLoading(false);
        }
    };

    const openCreateModal = () => {
        loadBatches('');
        setBatchRecipients([]);
        loadUsers();
        setSelectedNotification(null);
        setFormValues({});
        setFormErrors({});
        setFileList([]);
        setReplacingFile(false);
        setIsModalVisible(true);
    };

    const openEditModal = (notification: NotificationRecord) => {
        loadBatches(notification.courseId || '');
        loadUsers();
        loadRecipients(notification.batchId || '');
        setSelectedNotification(notification);
        setFormValues({
            notificationType: notification.notificationType || '',
            title: notification.title || '',
            description: notification.description || '',
            link: notification.link || '',
            startDate: notification.startDate || null,
            endDate: notification.endDate || null,
            courseType: notification.courseType || '',
            courseId: notification.courseId || '',
            batchId: notification.batchId || '',
            sendPush: typeof notification.sendPush === 'boolean' ? notification.sendPush : undefined,
            userIds: notification.userIds ?? (notification.userId ? [notification.userId] : []),
            pushScheduledAt: notification.pushScheduledAt || null,
            pushStartDate: notification.pushStartDate || null,
            pushEndDate: notification.pushEndDate || null,
        });
        setFormErrors({});
        setFileList([]);
        setReplacingFile(false);
        setIsModalVisible(true);
    };

    const closeModal = () => {
        loadBatches('');
        setIsModalVisible(false);
        setSelectedNotification(null);
        setFormValues({});
        setFormErrors({});
        setFileList([]);
        setReplacingFile(false);
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

    const handleFileChange = (files: UploadFile[]) => {
        setFileList(files);
    };

    const handleInputChange = (name: string, value: any) => {
        setFormValues(prev => {
            const next = { ...prev, [name]: value };
            // Another course means another set of batches; the chosen batch no longer applies
            if (name === 'courseId') next.batchId = '';
            // Another batch means another set of users
            if (name === 'courseId' || name === 'batchId') next.userIds = [];
            return next;
        });
        if (name === 'courseId') {
            loadBatches(value || '');
            loadRecipients('');
        }
        if (name === 'batchId') loadRecipients(value || '');

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

        // Both dates are optional; when both are given the end can't be before the start
        if (formValues.notificationType !== FLASH_NOTIFICATION_TYPE && formValues.startDate && formValues.endDate && dayjs(formValues.endDate).isBefore(dayjs(formValues.startDate))) {
            newErrors.endDate = 'End Date must not be before Start Date';
        }
        if (formValues.pushStartDate && formValues.pushEndDate && dayjs(formValues.pushEndDate).isBefore(dayjs(formValues.pushStartDate))) {
            newErrors.pushEndDate = 'Push End Date must not be before Push Start Date';
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }

        // Fields hidden for the chosen type are not sent (a Flash Notification has no dates; a Job Notification has no targeting)
        const isFlash = formValues.notificationType === FLASH_NOTIFICATION_TYPE;
        const isJob = formValues.notificationType === JOB_NOTIFICATION_TYPE;
        // The dates are just days
        const toPayloadDate = (value: unknown) => (value ? dayjsToISOString(dayjs(value as string).startOf('day')) : '');
        const startDate = isFlash ? '' : toPayloadDate(formValues.startDate);
        const endDate = isFlash ? '' : toPayloadDate(formValues.endDate);

        const formData = new FormData();
        formData.append('title', formValues.title || '');
        formData.append('description', formValues.description || '');
        formData.append('link', formValues.link || '');
        // A date that wasn't picked is left out
        if (startDate) formData.append('startDate', startDate);
        if (endDate) formData.append('endDate', endDate);
        formData.append('notificationType', formValues.notificationType || '');
        // Targeting is optional: only what was chosen is sent
        if (!isJob) {
            if (formValues.courseType) formData.append('courseType', formValues.courseType);
            if (formValues.courseId) formData.append('courseId', formValues.courseId);
            if (formValues.batchId) formData.append('batchId', formValues.batchId);
            // One user goes as `userId`; several go as `userIds` (one entry each)
            const userIds = (formValues.userIds as string[] | undefined) || [];
            if (userIds.length === 1) formData.append('userId', userIds[0]);
            else userIds.forEach((userId) => formData.append('userIds', userId));
        }
        if (typeof formValues.sendPush === 'boolean') formData.append('sendPush', String(formValues.sendPush));
        const pushScheduledAt = dayjsToISOString(formValues.pushScheduledAt);
        const pushStartDate = dayjsToISOString(formValues.pushStartDate);
        const pushEndDate = dayjsToISOString(formValues.pushEndDate);
        if (pushStartDate) formData.append('pushStartDate', pushStartDate);
        if (pushEndDate) formData.append('pushEndDate', pushEndDate);
        if (pushScheduledAt) formData.append('pushScheduledAt', pushScheduledAt);

        // A Flash Notification has no file
        const file = isFlash ? undefined : fileList[0]?.originFileObj;
        if (file) {
            formData.append('file', file);
        }

        if (selectedNotification) {
            setOperationType('edit');
            dispatch(updateNotification({ id: selectedNotification.id, formData }) as any);
        } else {
            setOperationType('create');
            dispatch(createNotification(formData) as any);
        }
    };

    const openPushModal = (type: 'send' | 'cancel', notification: NotificationRecord) => setPushTarget({ type, notification });
    const closePushModal = () => {
        if (!isPushing) setPushTarget(null);
    };

    const handlePushConfirm = async () => {
        if (!pushTarget) return;
        const { type, notification } = pushTarget;
        setIsPushing(true);
        try {
            if (type === 'send') await superSalesAPI.sendNotificationPush(notification.id);
            else await superSalesAPI.cancelNotificationPush(notification.id);
            showSuccess(type === 'send' ? 'Push sent successfully!' : 'Push cancelled successfully!');
            setPushTarget(null);
            dispatch(getNotifications({
                searchTerm: searchValue.trim() || undefined,
                globalFilter: appliedFilters,
                pageNumber: currentPage,
                pageSize,
            }) as any);
        } catch (error: any) {
            showError(error?.response?.data?.message || error?.message || (type === 'send' ? 'Failed to send push' : 'Failed to cancel push'));
        } finally {
            setIsPushing(false);
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
            String(formValues.notificationType || '') !== (selectedNotification.notificationType || '') ||
            String(formValues.title || '') !== (selectedNotification.title || '') ||
            String(formValues.description || '') !== (selectedNotification.description || '') ||
            String(formValues.link || '') !== (selectedNotification.link || '') ||
            fileList.length > 0 ||
            dayjsToISOString(formValues.startDate) !== dayjsToISOString(selectedNotification.startDate) ||
            dayjsToISOString(formValues.endDate) !== dayjsToISOString(selectedNotification.endDate) ||
            String(formValues.courseType || '') !== (selectedNotification.courseType || '') ||
            String(formValues.courseId || '') !== (selectedNotification.courseId || '') ||
            String(formValues.batchId || '') !== (selectedNotification.batchId || '') ||
            Boolean(formValues.sendPush) !== Boolean(selectedNotification.sendPush) ||
            [...(formValues.userIds || [])].sort().join(',') !== [...(selectedNotification.userIds ?? (selectedNotification.userId ? [selectedNotification.userId] : []))].sort().join(',') ||
            dayjsToISOString(formValues.pushScheduledAt) !== dayjsToISOString(selectedNotification.pushScheduledAt) ||
            dayjsToISOString(formValues.pushStartDate) !== dayjsToISOString(selectedNotification.pushStartDate) ||
            dayjsToISOString(formValues.pushEndDate) !== dayjsToISOString(selectedNotification.pushEndDate)
        )
        : (
            Boolean(formValues.notificationType) ||
            Boolean(String(formValues.title || '').trim()) ||
            Boolean(String(formValues.description || '').trim()) ||
            Boolean(String(formValues.link || '').trim()) ||
            fileList.length > 0 ||
            Boolean(formValues.startDate) ||
            Boolean(formValues.endDate) ||
            Boolean(formValues.courseType) ||
            Boolean(formValues.courseId) ||
            Boolean(formValues.batchId) ||
            Boolean(formValues.sendPush) ||
            (formValues.userIds || []).length > 0 ||
            Boolean(formValues.pushScheduledAt) ||
            Boolean(formValues.pushStartDate) ||
            Boolean(formValues.pushEndDate)
        );

    return {
        notificationsArray: displayNotifications,
        loading: notificationStatus?.loading || false,
        currentPage,
        pageSize,
        totalNotifications,
        handlePaginationChange,

        // Global search & filter modal
        searchField: NOTIFICATION_SEARCH_INPUT_FIELDS,
        searchValue,
        activeFilterCount,
        isFilterDropdownOpen,
        filterField: NOTIFICATION_FILTER_FIELDS,
        appliedFilters,
        handleSearchChange,
        toggleFilterDropdown,
        closeFilterModal,
        handleApplyFilters,
        handleResetFilters,

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
        courses,
        batches,
        batchesLoading,
        // The batch's users once a batch is chosen, otherwise everyone
        users: formValues.batchId ? batchRecipients : users,
        usersLoading: usersLoading || recipientsLoading,
        fileList,
        replacingFile,
        setReplacingFile,
        handleFileChange,
        openCreateModal,
        openEditModal,
        closeModal,
        openDeleteModal,
        closeDeleteModal,
        pushTarget,
        isPushing,
        openPushModal,
        closePushModal,
        handlePushConfirm,
        handleInputChange,
        handleSubmit,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    };
};
