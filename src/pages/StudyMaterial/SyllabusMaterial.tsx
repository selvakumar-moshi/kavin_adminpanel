import { useEffect, useState } from 'react';
import Button from '../../components/Button/Button';
import TableWithPagination from '../../components/Table/TableWithPagination';
import { withSortAndSearch } from '../../components/Table/withSortAndSearch';
import PopupModal from '../../components/PopupModal/PopupModal';
import InputFields from '../../components/InputFields/InputFields';
import FileUploadSection from '../../components/FileUploadSection/FileUploadSection';
import FileUploadDisplay from '../../components/FileUploadDisplay/FileUploadDisplay';
import ActionIcons from '../../components/Table/ActionIcons';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import NoDataFound from '../../components/NoDataFound/NoDataFound';
import PreviousYearQuizFields from '../Quiz/previousYear/PreviousYearQuizFields';
import { useSyllabusMaterialManagement } from './useSyllabusMaterialHooks';
import { SYLLABUS_MATERIAL_TEXT_FIELDS, getSyllabusMaterialTableColumns, type SyllabusMaterialProps, type SyllabusMaterialRecord } from './Constants';
import add_Icon from '../../assets/add_Icon.svg';

const SyllabusMaterial: React.FC<SyllabusMaterialProps> = ({ searchTerm = '' }) => {
    const {
        materials,
        loading,
        isSaving,
        currentPage,
        pageSize,
        totalCount,
        handlePaginationChange,
        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,
        isModalVisible,
        isDeleteModalVisible,
        selectedMaterial,
        formValues,
        formErrors,
        fileList,
        hasFormChanges,
        folderSelector,
        openCreateModal,
        openEditModal,
        closeModal,
        openDeleteModal,
        closeDeleteModal,
        handleInputChange,
        handleFileChange,
        handleSubmit,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    } = useSyllabusMaterialManagement(searchTerm);

    // Editing shows the saved PDF until its delete icon is clicked
    const [replacingFile, setReplacingFile] = useState(false);

    useEffect(() => {
        if (isModalVisible) {
            setReplacingFile(false);
        }
    }, [isModalVisible]);

    const baseColumns = withSortAndSearch(getSyllabusMaterialTableColumns(), {
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
            onHeaderCell: () => ({ style: { width: 90, minWidth: 90, maxWidth: 90 } }),
            onCell: () => ({ style: { width: 90, minWidth: 90, maxWidth: 90 } }),
            render: (_: unknown, record: SyllabusMaterialRecord) => (
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

    if (loading && materials.length === 0) {
        return <Loader size="large" spinning={true} fullScreen={false} />;
    }

    return (
        <div className="study-material-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />

            <div className="report_main">
                <Button icon={<img src={add_Icon} alt="add-icon" />} variant="primary" className="page-title__button" onClick={openCreateModal}>
                    Add Syllabus Material
                </Button>
            </div>

            <TableWithPagination
                columns={columns}
                dataSource={materials.map((material) => ({ ...material, key: material.id }))}
                loading={loading}
                currentPage={currentPage}
                pageSize={pageSize}
                total={totalCount}
                onPageChange={handlePaginationChange}
                locale={{
                    emptyText: <NoDataFound type="nodata" description="No syllabus material found" style={{ height: 'unset' }} />
                }}
            />

            {/* Create/Edit Modal */}
            <PopupModal
                open={isModalVisible}
                onClose={closeModal}
                onSubmit={handleSubmit}
                title={selectedMaterial ? 'Edit Syllabus Material' : 'Add Syllabus Material'}
                subtitle=""
                primaryButtonText={selectedMaterial ? 'Update' : 'Create'}
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={isSaving}
                primaryButtonDisabled={isSaving || !hasFormChanges}
                contentHeight="auto"
                minHeight={520}
                maxHeight="calc(100vh - 200px)"
            >
                <div style={{ padding: '0 8px' }}>
                    <InputFields
                        fields={SYLLABUS_MATERIAL_TEXT_FIELDS}
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={isSaving}
                    />
                    <PreviousYearQuizFields
                        {...folderSelector}
                        disabled={isSaving}
                        onFolderChange={folderSelector.handleFolderChange}
                        onLevelChange={folderSelector.handleLevelChange}
                    />
                    {selectedMaterial && fileList.length === 0 && !replacingFile ? (
                        <FileUploadDisplay
                            label="PDF File"
                            fileName={selectedMaterial.pdfFileName}
                            onDelete={() => setReplacingFile(true)}
                        />
                    ) : (
                        <FileUploadSection
                            label="PDF File"
                            required={!selectedMaterial}
                            acceptedFormats="PDF"
                            allowedExtensions={['.pdf']}
                            fileList={fileList}
                            onFileChange={handleFileChange}
                        />
                    )}
                    {formErrors.file && (
                        <div className="form-fields-section__error-message">{formErrors.file}</div>
                    )}
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
                primaryButtonLoading={isSaving}
                primaryButtonDisabled={isSaving}
                contentHeight="auto"
                minHeight={100}
            >
                <div className="popup-modal__content-content-text">
                    Are you sure you want to delete the syllabus material <b>"{selectedMaterial?.title}"</b>?
                </div>
            </PopupModal>
        </div>
    );
};

export default SyllabusMaterial;
