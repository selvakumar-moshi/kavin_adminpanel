import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { RootState } from '../../services/Store';
import { getVideoMaterials, createVideoMaterial, updateVideoMaterial, deleteVideoMaterial, getBatches } from '../../services/LearningAction';
import type { VideoMaterialRecord } from './Constants';
import { getVideoMaterialTableColumns } from './Constants';
import type { CourseRecord, BatchRecord } from '../Course/Constant';
import { useClientSideTableSortSearch } from '../../components/Table/useColumnSortSearch';
import { VIDEO_MATERIAL_VALIDATION_RULES } from '../../utils/validationUtils';

export const useVideoMaterialManagement = (searchTerm = '', appliedFilters: Record<string, string> = {}, courseId = '') => {
    const dispatch = useDispatch();
    const { messages: toastMessages, showSuccess, showError, hideToast } = useToastMessages();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<VideoMaterialRecord | null>(null);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [operationType, setOperationType] = useState<'create' | 'edit' | 'delete' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { VideoMaterialsData, CoursesData, BatchesData, apiStatus } = useSelector(
        (state: RootState) => state.learning
    );

    // Server-paginated response: { items: VideoMaterialRecord[], pageNumber, pageSize, totalCount, totalPages }
    const videoMaterialsArray = Array.isArray(VideoMaterialsData?.items) ? (VideoMaterialsData.items as VideoMaterialRecord[]) : [];
    const totalVideoMaterials: number = VideoMaterialsData?.totalCount ?? 0;
    const coursesArray = Array.isArray(CoursesData) ? (CoursesData as CourseRecord[]) : [];
    // Batch dropdown for the selected course — request a large page so it's never truncated
    const batchesArray = Array.isArray(BatchesData?.items) ? (BatchesData.items as BatchRecord[]) : [];
    const loading = apiStatus.VideoMaterialsData?.loading || false;
    const batchesLoading = apiStatus.BatchesData?.loading || false;

    // Column-level sort & search (client-side — the Video Material list has no server-side search contract)
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

    const getCourseName = (courseId: string) => coursesArray.find(c => c.id === courseId)?.courseName || '-';
    const columns = getVideoMaterialTableColumns(getCourseName);
    const displayVideoMaterials = applyToData(videoMaterialsArray, columns);

    // Courses are fetched once by the parent Material page (shared with the header course filter)
    // — fetching again here would double the request while this tab is active.

    // Search/filter/course changes always start back at page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, appliedFilters, courseId]);

    // Fetch whenever page, page size, search term, filters, or course change
    useEffect(() => {
        dispatch(getVideoMaterials({
            searchTerm: searchTerm.trim() || undefined,
            courseId: courseId || undefined,
            material: 'video',
            globalFilter: appliedFilters,
            pageNumber: currentPage,
            pageSize,
        }) as any);
    }, [dispatch, currentPage, pageSize, searchTerm, appliedFilters, courseId]);

    const handlePaginationChange = (page: number, newPageSize: number) => {
        setCurrentPage(page);
        if (newPageSize !== pageSize) {
            setPageSize(newPageSize);
            setCurrentPage(1);
        }
    };

    useEffect(() => {
        if (!operationType) return;

        if (apiStatus.VideoMaterialsData?.success) {
            if (operationType === 'create') {
                showSuccess('Video material created successfully!');
                setIsModalVisible(false);
            } else if (operationType === 'edit') {
                showSuccess('Video material updated successfully!');
                setIsModalVisible(false);
            } else if (operationType === 'delete') {
                showSuccess('Video material deleted successfully!');
                setIsDeleteModalVisible(false);
            }
            setFormValues({});
            setFormErrors({});
            setSelectedVideo(null);
            setOperationType(null);
            dispatch(getVideoMaterials({
                searchTerm: searchTerm.trim() || undefined,
                courseId: courseId || undefined,
                material: 'video',
                globalFilter: appliedFilters,
                pageNumber: currentPage,
                pageSize,
            }) as any);
        }

        if (apiStatus.VideoMaterialsData?.error) {
            showError(apiStatus.VideoMaterialsData.error);
            setOperationType(null);
        }
    }, [apiStatus.VideoMaterialsData, operationType, showSuccess, showError, dispatch, currentPage, pageSize, searchTerm, appliedFilters, courseId]);

    const openCreateModal = () => {
        setSelectedVideo(null);
        setFormValues({});
        setFormErrors({});
        setIsModalVisible(true);
    };

    const openEditModal = (video: VideoMaterialRecord) => {
        setSelectedVideo(video);
        setFormValues({
            title: video.title || '',
            description: video.description || '',
            courseId: video.courseId || '',
            batchId: video.batchId || '',
            youtubeLink: video.youtubeLink || '',
            materialToView: video.materialToView || '',
        });
        setFormErrors({});
        if (video.courseId) {
            dispatch(getBatches({ courseId: video.courseId, pageSize: 100 }) as any);
        }
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setSelectedVideo(null);
        setFormValues({});
        setFormErrors({});
    };

    const openDeleteModal = (video: VideoMaterialRecord) => {
        setSelectedVideo(video);
        setIsDeleteModalVisible(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalVisible(false);
        setSelectedVideo(null);
    };

    const validateSingleField = (field: string, rawValue: string): string => {
        const rule = VIDEO_MATERIAL_VALIDATION_RULES[field];
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

    const handleDropdownChange = (name: string, value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] || '' : value;
        setFormValues(prev => ({ ...prev, [name]: stringValue }));
        if (formErrors[name]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        if (name === 'courseId') {
            setFormValues(prev => ({ ...prev, batchId: '' }));
            if (stringValue) {
                dispatch(getBatches({ courseId: stringValue, pageSize: 100 }) as any);
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        Object.keys(VIDEO_MATERIAL_VALIDATION_RULES).forEach((field) => {
            const error = validateSingleField(field, formValues[field]);
            if (error) {
                newErrors[field] = error;
            }
        });

        if (!formValues.courseId) {
            newErrors.courseId = 'Course is required';
        }

        if (!formValues.materialToView) {
            newErrors.materialToView = 'Material to view is required';
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Create: enabled once any field has a value. Edit: enabled once a value differs from the loaded video.
    const hasFormChanges = selectedVideo
        ? (
            (formValues.title || '') !== (selectedVideo.title || '') ||
            (formValues.description || '') !== (selectedVideo.description || '') ||
            (formValues.courseId || '') !== (selectedVideo.courseId || '') ||
            (formValues.batchId || '') !== (selectedVideo.batchId || '') ||
            (formValues.youtubeLink || '') !== (selectedVideo.youtubeLink || '') ||
            (formValues.materialToView || '') !== (selectedVideo.materialToView || '')
        )
        : (
            Boolean(formValues.title?.trim()) ||
            Boolean(formValues.description?.trim()) ||
            Boolean(formValues.courseId) ||
            Boolean(formValues.batchId) ||
            Boolean(formValues.youtubeLink?.trim()) ||
            Boolean(formValues.materialToView)
        );

    const handleSubmit = () => {
        if (!validateForm()) {
            return;
        }

        const payload = {
            title: formValues.title,
            description: formValues.description || '',
            courseId: formValues.courseId,
            batchId: formValues.batchId || '',
            youtubeLink: formValues.youtubeLink,
            materialToView: formValues.materialToView,
        };

        if (selectedVideo) {
            setOperationType('edit');
            dispatch(updateVideoMaterial({ id: selectedVideo.id, ...payload }) as any);
        } else {
            setOperationType('create');
            dispatch(createVideoMaterial(payload) as any);
        }
    };

    const handleDeleteConfirm = () => {
        if (!selectedVideo) return;
        setOperationType('delete');
        dispatch(deleteVideoMaterial({ id: selectedVideo.id }) as any);
    };

    return {
        videoMaterialsArray: displayVideoMaterials,
        coursesArray,
        batchesArray,
        loading,
        batchesLoading,
        currentPage,
        pageSize,
        totalVideoMaterials,
        handlePaginationChange,
        isModalVisible,
        isDeleteModalVisible,
        selectedVideo,
        formValues,
        formErrors,
        hasFormChanges,
        getCourseName,

        // Column sort & search
        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,

        openCreateModal,
        openEditModal,
        closeModal,
        openDeleteModal,
        closeDeleteModal,
        handleInputChange,
        handleDropdownChange,
        handleSubmit,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    };
};
