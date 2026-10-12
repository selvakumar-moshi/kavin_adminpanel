import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined, FolderOpenOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';
import { Spin, Tooltip } from 'antd';
import PopupModal from '../PopupModal/PopupModal';
import InputFields from '../InputFields/InputFields';
import ToastMessages from '../ToastMessages';
import { useFolderStructureManagement } from './useFolderStructureHooks';
import { FOLDER_NAME_FIELD, type FolderRecord, type SubFolderRecord } from './Constant';
import { toTitleCase } from '../../utils/textUtils';

// "Folders" tab: pick a folder on the left; on the right manage its sub folders, each expandable to show its nested sub folders
const FolderStructure = () => {
    const {
        folders,
        foldersLoading,
        selectedFolder,
        setSelectedFolderId,
        subFolders,
        subFoldersLoading,
        expandedIds,
        toggleExpanded,
        isModalVisible,
        isDeleteModalVisible,
        isEdit,
        modalTitle,
        deleteMessage,
        name,
        nameError,
        isSaving,
        openAddModal,
        openEditModal,
        openEditNestedModal,
        openDeleteNestedModal,
        closeModal,
        handleNameChange,
        handleSubmit,
        openDeleteModal,
        closeDeleteModal,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    } = useFolderStructureManagement();

    // Small edit / delete icons shown on every row
    const renderRowActions = (label: string, onEdit: () => void, onDelete: () => void) => (
        <span className="folder-structure__item-actions">
            <Tooltip title="Edit">
                <button
                    type="button"
                    className="school-book__chip-btn"
                    onClick={(event) => {
                        event.stopPropagation();
                        onEdit();
                    }}
                    aria-label={`Edit ${label}`}
                >
                    <EditOutlined />
                </button>
            </Tooltip>
            <Tooltip title="Delete">
                <button
                    type="button"
                    className="school-book__chip-btn"
                    onClick={(event) => {
                        event.stopPropagation();
                        onDelete();
                    }}
                    aria-label={`Delete ${label}`}
                >
                    <DeleteOutlined />
                </button>
            </Tooltip>
        </span>
    );

    const renderFolder = (folder: FolderRecord) => {
        const isActive = folder.id === selectedFolder?.id;
        return (
            <div
                key={folder.id}
                className={`folder-structure__item${isActive ? ' folder-structure__item--active' : ''}`}
                onClick={() => setSelectedFolderId(folder.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') setSelectedFolderId(folder.id);
                }}
            >
                {isActive ? <FolderOpenOutlined /> : <FolderOutlined />}
                <span className="folder-structure__item-name">{folder.name}</span>
                {renderRowActions(folder.name, () => openEditModal('folder', folder), () => openDeleteModal('folder', folder))}
            </div>
        );
    };

    const renderSubFolder = (subFolder: SubFolderRecord) => {
        const isExpanded = expandedIds.has(subFolder.id);
        return (
            <div key={subFolder.id} className="folder-structure__group">
                <div
                    className="folder-structure__item folder-structure__item--plain folder-structure__item--toggle"
                    onClick={() => toggleExpanded(subFolder.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') toggleExpanded(subFolder.id);
                    }}
                >
                    <span className="folder-structure__chevron">{isExpanded ? <DownOutlined /> : <RightOutlined />}</span>
                    {isExpanded ? <FolderOpenOutlined /> : <FolderOutlined />}
                    <span className="folder-structure__item-name">{subFolder.name}</span>
                    {subFolder.subFolders.length > 0 && <span className="folder-structure__count">{subFolder.subFolders.length}</span>}
                    {renderRowActions(subFolder.name, () => openEditModal('subfolder', subFolder), () => openDeleteModal('subfolder', subFolder))}
                </div>

                {isExpanded && (
                    <div className="folder-structure__nested">
                        {subFolder.subFolders.map((nestedName, index) => (
                            <div key={`${nestedName}-${index}`} className="folder-structure__item folder-structure__item--plain folder-structure__item--nested">
                                <FolderOutlined />
                                <span className="folder-structure__item-name">{nestedName}</span>
                                {renderRowActions(nestedName, () => openEditNestedModal(subFolder, index), () => openDeleteNestedModal(subFolder, index))}
                            </div>
                        ))}
                        {subFolder.subFolders.length === 0 && <div className="folder-structure__empty">No nested sub folders yet.</div>}
                        <button type="button" className="school-book__add folder-structure__add-nested" onClick={() => openAddModal('nested', subFolder)}>
                            <PlusOutlined /> Add Nested Sub Folder
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="folder-structure">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />

            <div className="folder-structure__layout">
                {/* Folders */}
                <section className="folder-structure__panel folder-structure__panel--folders">
                    <div className="folder-structure__head">
                        <span className="folder-structure__title">Folders</span>
                        <button type="button" className="school-book__add" onClick={() => openAddModal('folder')}>
                            <PlusOutlined /> Add Folder
                        </button>
                    </div>

                    <Spin spinning={foldersLoading}>
                        {folders.length === 0 && !foldersLoading ? (
                            <div className="folder-structure__empty">No folders yet. Use "Add Folder" to create the first one.</div>
                        ) : (
                            folders.map(renderFolder)
                        )}
                    </Spin>
                </section>

                {/* Sub folders of the selected folder */}
                <section className="folder-structure__panel folder-structure__panel--subs">
                    <div className="folder-structure__head">
                        <span className="folder-structure__title">
                            {selectedFolder ? <>Sub Folders in "{toTitleCase(selectedFolder.name)}"</> : 'Sub Folders'}
                        </span>
                        {selectedFolder && (
                            <button type="button" className="school-book__add" onClick={() => openAddModal('subfolder')}>
                                <PlusOutlined /> Add Sub Folder
                            </button>
                        )}
                    </div>

                    {!selectedFolder ? (
                        <div className="folder-structure__empty">Select a folder to see its sub folders.</div>
                    ) : (
                        <Spin spinning={subFoldersLoading}>
                            {subFolders.length === 0 && !subFoldersLoading ? (
                                <div className="folder-structure__empty">No sub folders yet. Use "Add Sub Folder" to create one.</div>
                            ) : (
                                subFolders.map(renderSubFolder)
                            )}
                        </Spin>
                    )}
                </section>
            </div>

            {/* Add / Edit (a folder or a sub folder) */}
            <PopupModal
                open={isModalVisible}
                onClose={closeModal}
                onSubmit={handleSubmit}
                title={modalTitle}
                subtitle=""
                primaryButtonText={isEdit ? 'Update' : 'Create'}
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={isSaving}
                primaryButtonDisabled={isSaving}
                contentHeight="auto"
                minHeight={150}
            >
                <div style={{ padding: '0 8px' }}>
                    <InputFields
                        fields={[FOLDER_NAME_FIELD]}
                        values={{ name }}
                        errors={nameError ? { name: nameError } : {}}
                        onChange={handleNameChange}
                        disabled={isSaving}
                    />
                </div>
            </PopupModal>

            {/* Delete confirmation */}
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
                <div className="popup-modal__content-content-text">{deleteMessage}</div>
            </PopupModal>
        </div>
    );
};

export default FolderStructure;
