import type { ReactNode } from 'react';
import Button from '../../components/Button/Button';
import TableWithPagination from '../../components/Table/TableWithPagination';
import { withSortAndSearch } from '../../components/Table/withSortAndSearch';
import ActionIcons from '../../components/Table/ActionIcons';
import PopupModal from '../../components/PopupModal/PopupModal';
import InputFields from '../../components/InputFields/InputFields';
import DropdownField from '../../components/DropdownField/DropdownField';
import { RichTextEditor } from '../../components/RichTextEditor';
import Loader from '../../components/Loader/Loader';
import ToastMessages from '../../components/ToastMessages';
import PageTitle from '../../components/PageTitle';
import NoDataFound from '../../components/NoDataFound/NoDataFound';
import { useSyllabusWise } from './useSyllabusWise';
import {
    getSyllabusTableColumns,
    SYLLABUS_INPUT_FIELDS,
    SYLLABUS_DESCRIPTION_FIELD,
    SYLLABUS_AMOUNT_FIELD,
    SYLLABUS_FOLDER_FIELD,
    type SyllabusRecord,
} from './Constant';
import add_Icon from '../../assets/add_Icon.svg';
import download_Icon from '../../assets/pngDownload.svg';

interface SyllabusWiseProps {
    pageTitle: string;
    /** The Course / Syllabus Wise tab switcher, shown on the search row */
    tabs: ReactNode;
}

const SyllabusWise = ({ pageTitle, tabs }: SyllabusWiseProps) => {
    const {
        isDownloading,
        handleDownload,
        records,
        loading,
        isSaving,
        currentPage,
        pageSize,
        total,
        handlePaginationChange,
        searchField,
        searchValue,
        handleSearchChange,
        sortState,
        openSearchColumn,
        handleSort,
        toggleSearchColumn,
        closeSearchColumn,
        getColumnSearchValue,
        handleColumnSearch,
        folderOptions,
        foldersLoading,
        isModalVisible,
        isDeleteModalVisible,
        selectedRecord,
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
    } = useSyllabusWise();

    const baseColumns = withSortAndSearch(getSyllabusTableColumns(), {
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
            render: (_: unknown, record: SyllabusRecord) => (
                <ActionIcons
                    actions={['edit', 'delete']}
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

    const header = (
        <div className="report_main">
            <PageTitle title={pageTitle} />
            <Button icon={<img src={add_Icon} alt="add-icon" />} variant="primary" className="page-title__button" onClick={openCreateModal}>
                Add Syllabus Wise
            </Button>
        </div>
    );

    if (loading && records.length === 0) {
        return (
            <div className="notification-container">
                {header}
                <div className="report_main">{tabs}</div>
                <Loader size="large" spinning={true} fullScreen={false} />
            </div>
        );
    }

    return (
        <div className="notification-container">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />
            {header}

            <div className="report_main">
                {tabs}
                <div className="dl_filter_main2">
                    <div
                        className={`quiz-rank-list__download${isDownloading ? ' quiz-rank-list__download--disabled' : ''}`}
                        onClick={isDownloading ? undefined : handleDownload}
                        aria-disabled={isDownloading}
                        data-testid="download-syllabus-wise"
                    >
                        <img src={download_Icon} alt="Download" />
                        {isDownloading ? 'Downloading...' : 'Download'}
                    </div>
                    <InputFields
                        fields={searchField.map(field => ({ ...field }))}
                        onChange={handleSearchChange}
                        values={{ search: searchValue }}
                    />
                </div>
            </div>

            <TableWithPagination
                columns={columns}
                dataSource={records.map((record) => ({ ...record, key: record.id }))}
                loading={loading}
                currentPage={currentPage}
                pageSize={pageSize}
                total={total}
                onPageChange={handlePaginationChange}
                locale={{
                    emptyText: <NoDataFound type="nodata" description="No syllabus wise plans found" style={{ height: 'unset' }} />
                }}
            />

            {/* Create/Edit Modal */}
            <PopupModal
                open={isModalVisible}
                onClose={closeModal}
                onSubmit={handleSubmit}
                title={selectedRecord ? 'Edit Syllabus Wise' : 'Add Syllabus Wise'}
                subtitle=""
                primaryButtonText={selectedRecord ? 'Update' : 'Create'}
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={isSaving}
                primaryButtonDisabled={isSaving || !hasFormChanges}
                contentHeight="auto"
                minHeight={430}
                maxHeight="calc(100vh - 200px)"
            >
                <div style={{ padding: '0 8px' }}>
                    <InputFields
                        fields={SYLLABUS_INPUT_FIELDS}
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={isSaving}
                    />
                    <RichTextEditor
                        {...SYLLABUS_DESCRIPTION_FIELD}
                        value={formValues.description || ''}
                        error={formErrors.description}
                        onChange={(value) => handleInputChange('description', value)}
                        disabled={isSaving}
                    />
                    <InputFields
                        fields={[SYLLABUS_AMOUNT_FIELD]}
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={isSaving}
                    />
                    <DropdownField
                        fields={[{
                            ...SYLLABUS_FOLDER_FIELD,
                            options: folderOptions,
                            loading: foldersLoading,
                            disabled: isSaving,
                            noOptionsContent: 'No folders available',
                        }]}
                        values={{ folderId: formValues.folderId || '' }}
                        errors={formErrors.folderId ? { folderId: formErrors.folderId } : {}}
                        onChange={(_, value) => handleInputChange('folderId', value)}
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
                primaryButtonLoading={isSaving}
                primaryButtonDisabled={isSaving}
                contentHeight="auto"
                minHeight={100}
            >
                <div className="popup-modal__content-content-text">
                    Are you sure you want to delete the plan <b>"{selectedRecord?.title}"</b>?
                </div>
            </PopupModal>
        </div>
    );
};

export default SyllabusWise;
