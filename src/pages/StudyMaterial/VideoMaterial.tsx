import Button from '../../components/Button/Button';
import TableWithPagination from '../../components/Table/TableWithPagination';
import { withSortAndSearch } from '../../components/Table/withSortAndSearch';
import PopupModal from '../../components/PopupModal/PopupModal';
import InputFields from '../../components/InputFields/InputFields';
import DropdownField from '../../components/DropdownField/DropdownField';
import ActionIcons from '../../components/Table/ActionIcons';
import ToastMessages from '../../components/ToastMessages';
import { useVideoMaterialManagement } from './useVideoMaterialHooks';
import { VIDEO_MATERIAL_TEXT_FIELDS, getVideoMaterialTableColumns, type VideoMaterialProps, type VideoMaterialRecord } from './Constants';
import add_Icon from '../../assets/add_Icon.svg'
import NoDataFound from '../../components/NoDataFound/NoDataFound';
import Loader from '../../components/Loader/Loader';

const VideoMaterial: React.FC<VideoMaterialProps> = ({ searchTerm = '', appliedFilters = {} }) => {
    const {
        videoMaterialsArray,
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
    } = useVideoMaterialManagement(searchTerm, appliedFilters);

    const baseColumns = withSortAndSearch(getVideoMaterialTableColumns(getCourseName), {
        sortState,
        onSort: handleSort,
        openSearchColumn,
        onToggleSearch: toggleSearchColumn,
        onCloseSearch: closeSearchColumn,
        getSearchValue: getColumnSearchValue,
        onSearch: handleColumnSearch,
    });

    const columns = [
        ...baseColumns,
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: VideoMaterialRecord) => (
                <ActionIcons
                    actions={['edit', 'delete']}
                    disabledActions={[]}
                    onActionClick={(action) => {
                        if (action.toLowerCase() === 'edit') {
                            openEditModal(record);
                        } else if (action.toLowerCase() === 'delete') {
                            openDeleteModal(record);
                        }
                    }}
                    record={record}
                />
            ),
        },
    ];

    const courseOptions = coursesArray.map(course => ({ value: course.id, label: course.courseName }));
    const batchOptions = batchesArray.map(batch => ({ value: batch.id, label: batch.title }));

    if (loading && videoMaterialsArray.length === 0) {
        return <Loader size="large" spinning={true} fullScreen={false} />;
    }

    return (
        <div className="video-material-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />

            <div className="report_main">
                <Button icon={<img src={add_Icon} alt="add-icon" />} variant="primary" className="page-title__button" onClick={openCreateModal}>
                    Add Video Material
                </Button>
            </div>

            <TableWithPagination
                columns={columns}
                dataSource={videoMaterialsArray.map(video => ({ ...video, key: video.id }))}
                loading={loading}
                currentPage={currentPage}
                pageSize={pageSize}
                total={totalVideoMaterials}
                onPageChange={handlePaginationChange}
                locale={{
                    emptyText: <NoDataFound type="nodata" description="No video material found" style={{ height: 'unset' }} />
                }}
            />

            {/* Create/Edit Modal */}
            <PopupModal
                open={isModalVisible}
                onClose={closeModal}
                onSubmit={handleSubmit}
                title={selectedVideo ? 'Edit Video Material' : 'Add Video Material'}
                subtitle=""
                primaryButtonText={selectedVideo ? 'Update' : 'Create'}
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={loading}
                primaryButtonDisabled={loading || !hasFormChanges}
                contentHeight="auto"
                minHeight={350}
            >
                <div style={{ padding: '0 8px' }}>
                    <InputFields
                        fields={VIDEO_MATERIAL_TEXT_FIELDS}
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    <DropdownField
                        fields={[
                            {
                                name: 'courseId',
                                label: 'Course',
                                placeholder: 'Select course',
                                required: true,
                                options: courseOptions,
                            },
                            {
                                name: 'batchId',
                                label: 'Batch',
                                placeholder: 'Select batch (optional)',
                                options: batchOptions,
                                loading: batchesLoading,
                                disabled: !formValues.courseId,
                            },
                        ]}
                        values={formValues}
                        errors={formErrors}
                        onChange={handleDropdownChange}
                    />
                </div>
            </PopupModal>

            {/* Delete Confirmation Modal */}
            <PopupModal
                open={isDeleteModalVisible}
                onClose={closeDeleteModal}
                onSubmit={handleDeleteConfirm}
                title="Confirm Deletion"
                subtitle=""
                primaryButtonText="Delete"
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={loading}
                primaryButtonDisabled={loading}
                contentHeight="auto"
                minHeight={100}
            >
                <div className="popup-modal__content-content-text">
                    Are you sure you want to delete the video material <b>"{selectedVideo?.title}"</b>?
                </div>
            </PopupModal>
        </div>
    );
};

export default VideoMaterial;
