import { PlusOutlined, EditOutlined, DeleteOutlined, FolderOutlined, FolderOpenOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { Spin, Tooltip } from 'antd';
import PopupModal from '../PopupModal/PopupModal';
import InputFields from '../InputFields/InputFields';
import ToastMessages from '../ToastMessages';
import { useFolderStructureManagement } from './useFolderStructureHooks';
import { FOLDER_NAME_FIELD, MAX_FOLDER_DEPTH, canHaveChildren, getNodeAt, type FolderNode, type FolderRecord, type SubFolderRecord } from './Constant';
import { toTitleCase } from '../../utils/textUtils';

// "Folders" tab: pick a folder on the left; on the right manage its sub folders, each expandable to show its nested sub
// folders, which open in turn (up to MAX_FOLDER_DEPTH levels)
const FolderStructure = () => {
    const {
        folders,
        foldersLoading,
        selectedFolder,
        setSelectedFolderId,
        subFolders,
        subFoldersLoading,
        expandedKeys,
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
        openAddNestedModal,
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

    // One nested sub folder and, when it is open, everything inside it (down to the last level)
    const renderNode = (root: SubFolderRecord, node: FolderNode, path: number[]): ReactNode => {
        const key = node.id || `${root.id}/${path.join('.')}`;
        const isExpanded = expandedKeys.has(key);
        return (
            <div key={key} className="folder-structure__group">
                <div
                    className="folder-structure__item folder-structure__item--plain folder-structure__item--toggle folder-structure__item--nested"
                    onClick={() => toggleExpanded(key)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') toggleExpanded(key);
                    }}
                >
                    <span className="folder-structure__chevron">{isExpanded ? <DownOutlined /> : <RightOutlined />}</span>
                    {isExpanded ? <FolderOpenOutlined /> : <FolderOutlined />}
                    <span className="folder-structure__item-name">{node.name}</span>
                    {node.subFolders.length > 0 && <span className="folder-structure__count">{node.subFolders.length}</span>}
                    {renderRowActions(node.name, () => openEditNestedModal(root, path), () => openDeleteNestedModal(root, path))}
                </div>
                {isExpanded && renderChildren(root, node.subFolders, path)}
            </div>
        );
    };

    // What is inside the sub folder / nested sub folder at `path`: its nested sub folders and the Add button
    const renderChildren = (root: SubFolderRecord, children: FolderNode[], path: number[]): ReactNode => (
        <div className="folder-structure__nested">
            {children.map((child, index) => renderNode(root, child, [...path, index]))}
            {children.length === 0 && <div className="folder-structure__empty">No nested sub folders yet.</div>}
            {canHaveChildren(path) ? (
                <button
                    type="button"
                    className="school-book__add folder-structure__add-nested"
                    onClick={() => openAddNestedModal(root, path, path.length === 0 ? root.id : getNodeAt(root.subFolders, path)?.id || `${root.id}/${path.join('.')}`)}
                >
                    <PlusOutlined /> Add Nested Sub Folder
                </button>
            ) : (
                <div className="folder-structure__empty">Last level ({MAX_FOLDER_DEPTH}) reached.</div>
            )}
        </div>
    );

    const renderSubFolder = (subFolder: SubFolderRecord) => {
        const isExpanded = expandedKeys.has(subFolder.id);
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

                {isExpanded && renderChildren(subFolder, subFolder.subFolders, [])}
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
