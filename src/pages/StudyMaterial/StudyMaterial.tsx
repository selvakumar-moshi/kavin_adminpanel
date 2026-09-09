import { useEffect, useState } from 'react';
import Button from '../../components/Button/Button';
import TableWithPagination from '../../components/Table/TableWithPagination';
import { withSortAndSearch } from '../../components/Table/withSortAndSearch';
import PopupModal from '../../components/PopupModal/PopupModal';
import InputFields from '../../components/InputFields/InputFields';
import DropdownField from '../../components/DropdownField/DropdownField';
import FileUploadSection from '../../components/FileUploadSection/FileUploadSection';
import FileUploadDisplay from '../../components/FileUploadDisplay/FileUploadDisplay';
import ActionIcons from '../../components/Table/ActionIcons';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import { useStudyMaterialManagement } from './useStudyMaterialHooks';
import { STUDY_MATERIAL_TEXT_FIELDS, getStudyMaterialTableColumns, type StudyMaterialProps, type StudyMaterialRecord } from './Constants';
import add_Icon from '../../assets/add_Icon.svg';
import NoDataFound from '../../components/NoDataFound/NoDataFound';

const StudyMaterial: React.FC<StudyMaterialProps> = ({ searchTerm = '', appliedFilters = {} }) => {
    const {
        studyMaterialsArray,
        coursesArray,
        batchesArray,
        loading,
        batchesLoading,
        currentPage,
        pageSize,
        totalStudyMaterials,
        handlePaginationChange,
        isModalVisible,
        isDeleteModalVisible,
        selectedMaterial,
        formValues,
        formErrors,
        fileList,
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
        handleFileChange,
        handleSubmit,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    } = useStudyMaterialManagement(searchTerm, appliedFilters);

    const [replacingFile, setReplacingFile] = useState(false);

    useEffect(() => {
        if (isModalVisible) {
            setReplacingFile(false);
        }
    }, [isModalVisible]);

    const baseColumns = withSortAndSearch(getStudyMaterialTableColumns(getCourseName), {
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
            render: (_: unknown, record: StudyMaterialRecord) => (
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

    if (loading && studyMaterialsArray.length === 0) {
        return <Loader size="large" spinning={true} fullScreen={false} />;
    }

    return (
        <div className="study-material-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />

            <div className="report_main">
                <Button icon={<img src={add_Icon} alt="add-icon" />} variant="primary" className="page-title__button" onClick={openCreateModal}>
                    Add Study Material
                </Button>
            </div>

            <TableWithPagination
                columns={columns}
                dataSource={studyMaterialsArray.map(material => ({ ...material, key: material.id }))}
                loading={loading}
                currentPage={currentPage}
                pageSize={pageSize}
                total={totalStudyMaterials}
                onPageChange={handlePaginationChange}
                locale={{
                    emptyText: <NoDataFound type="nodata" description="No study material found" style={{ height: 'unset' }} />
                }}
            />

            {/* Create/Edit Modal */}
            <PopupModal
                open={isModalVisible}
                onClose={closeModal}
                onSubmit={handleSubmit}
                title={selectedMaterial ? 'Edit Study Material' : 'Add Study Material'}
                subtitle=""
                primaryButtonText={selectedMaterial ? 'Update' : 'Create'}
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={loading}
                primaryButtonDisabled={loading || !hasFormChanges}
                contentHeight="auto"
                minHeight={450}
            >
                <div style={{ padding: '0 8px' }}>
                    <InputFields
                        fields={STUDY_MATERIAL_TEXT_FIELDS}
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
                            fileList={fileList}
                            onFileChange={handleFileChange}
                        />
                    )}
                    {formErrors.pdffile && (
                        <div className="form-fields-section__error-message">{formErrors.pdffile}</div>
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
                primaryButtonLoading={loading}
                primaryButtonDisabled={loading}
                contentHeight="auto"
                minHeight={100}
            >
                <div className="popup-modal__content-content-text">
                    Are you sure you want to delete the study material <b>"{selectedMaterial?.title}"</b>?
                </div>
            </PopupModal>
        </div>
    );
};

export default StudyMaterial;
