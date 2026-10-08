import { forwardRef, useImperativeHandle } from 'react';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import Button from '../Button/Button';
import TableWithPagination from '../Table/TableWithPagination';
import ActionIcons from '../Table/ActionIcons';
import PopupModal from '../PopupModal/PopupModal';
import InputFields from '../InputFields/InputFields';
import DropdownField from '../DropdownField/DropdownField';
import ToastMessages from '../ToastMessages';
import NoDataFound from '../NoDataFound/NoDataFound';
import { renderTruncatedCellWithTooltip } from '../../utils/tableCellRender';
import { useSchoolBookRevisionManagement, type SubjectNode, type CategoryNode, type StandardOwnerKind } from './useBookStructureHooks';
import { STRUCTURE_NAME_FIELD, STRUCTURE_STANDARD_NUMBER_FIELD, formatStandard, type StructureTab, type StructureRecord, type StandardRecord } from './Constant';

export interface BookTabHandle {
    openAddSubject: () => void;
}

const BooksStructure = forwardRef<BookTabHandle>((_props, ref) => {
    const {
        entity,
        tree,
        parts,
        standards,
        loading,
        subjectOptions,
        standardOptions,
        partOptions,
        isModalVisible,
        isDeleteModalVisible,
        selectedRecord,
        ownerStandard,
        removeTarget,
        modalTitle,
        deleteMessage,
        formValues,
        formErrors,
        isSaving,
        openCreateModal,
        openEditModal,
        openOwnerStandardModal,
        closeModal,
        openDeleteModal,
        openRemoveStandardModal,
        closeDeleteModal,
        handleInputChange,
        handleStandardPartsChange,
        handleSubmit,
        handleDeleteConfirm,
        toastMessages,
        hideToast,
    } = useSchoolBookRevisionManagement();

    useImperativeHandle(ref, () => ({ openAddSubject: () => openCreateModal('subjects') }));

    const isEdit = ownerStandard ? ownerStandard.standard !== null : Boolean(selectedRecord);

    const setupSteps = [
        {
            key: 'parts',
            title: 'Add parts',
            description: 'For example Part-1, Part-2, Part-3. Standards can be split into these.',
            done: parts.length > 0,
            buttonLabel: '+ Add Part',
            onAdd: () => openCreateModal('parts'),
        },
        {
            key: 'standards',
            title: 'Add standards',
            description: 'For example 6, 7, 8 ... 12. Pick which parts each standard has (optional).',
            done: standards.length > 0,
            buttonLabel: '+ Add Standard',
            onAdd: () => openCreateModal('standards'),
        },
        {
            key: 'subjects',
            title: 'Add subjects',
            description: 'For example Tamil or GK. Choose the standards each subject covers.',
            done: tree.length > 0,
            buttonLabel: '+ Add Subject',
            onAdd: () => openCreateModal('subjects'),
        },
    ];

    const renderActions = (forEntity: StructureTab, record: StructureRecord) => (
        <ActionIcons
            actions={['edit', 'delete']}
            disabledActions={[]}
            onActionClick={(action) => {
                if (action.toLowerCase() === 'edit') openEditModal(forEntity, record);
                else if (action.toLowerCase() === 'delete') openDeleteModal(forEntity, record);
            }}
            record={record}
        />
    );

    const addPill = (label: string, onClick: () => void) => (
        <button type="button" className="school-book__add" onClick={onClick}>
            <PlusOutlined /> {label}
        </button>
    );

    // A small pill with edit / delete buttons (used for the Parts and Standards lists on the left)
    const renderChip = (key: string, label: string, forEntity: StructureTab, record: StructureRecord, hint?: string) => (
        <span key={key} className="school-book__chip">
            <Tooltip title={hint} placement="top">
                <span>{label}</span>
            </Tooltip>
            <Tooltip title="Edit">
                <button type="button" className="school-book__chip-btn" onClick={() => openEditModal(forEntity, record)} aria-label={`Edit ${label}`}>
                    <EditOutlined />
                </button>
            </Tooltip>
            <Tooltip title="Delete">
                <button type="button" className="school-book__chip-btn" onClick={() => openDeleteModal(forEntity, record)} aria-label={`Delete ${label}`}>
                    <DeleteOutlined />
                </button>
            </Tooltip>
        </span>
    );

    // A line inside an opened subject: name, a short description, and its edit / delete icons
    const renderRow = (key: string, name: string, info: string, actions: React.ReactNode) => (
        <div key={key} className="school-book__row">
            <div className="school-book__row-name">{name}</div>
            <div className="school-book__row-info">{info}</div>
            <div className="school-book__row-actions">{actions}</div>
        </div>
    );

    // Edit / remove for a standard inside a subject or category: both change that owner (its own parts), not the shared standard
    const renderOwnerStandardActions = (kind: StandardOwnerKind, owner: SubjectNode | CategoryNode, standard: StandardRecord) => (
        <ActionIcons
            actions={['edit', 'delete']}
            disabledActions={[]}
            onActionClick={(action) => {
                if (action.toLowerCase() === 'edit') openOwnerStandardModal(kind, owner, standard.standard);
                else if (action.toLowerCase() === 'delete') openRemoveStandardModal(kind, owner, standard.standard);
            }}
            record={standard}
        />
    );

    // One line per standard of a subject / category, with its parts
    const renderOwnerStandardRows = (kind: StandardOwnerKind, owner: SubjectNode | CategoryNode) =>
        owner.standardRows.length === 0 ? (
            <div className="school-book__empty">No standards</div>
        ) : (
            owner.standardRows.map((standard: StandardRecord) =>
                renderRow(
                    `${kind}-${owner.id}-${standard.standard}`,
                    formatStandard(standard.standard),
                    standard.parts.length > 0 ? standard.parts.join(', ') : 'No parts',
                    renderOwnerStandardActions(kind, owner, standard)
                )
            )
        );

    const renderSubjectDetail = (subject: SubjectNode) => (
        <div className="school-book__detail">
            <div>
                <div className="school-book__section-head">
                    Categories
                    {addPill('Add Category', () => openCreateModal('categories', { subject }))}
                </div>
                {subject.categories.length === 0 ? (
                    <div className="school-book__empty">No categories</div>
                ) : (
                    subject.categories.map((category: CategoryNode) => (
                        <div key={category.id} className="school-book__category">
                            <div className="school-book__category-head">
                                <span className="school-book__category-name">{category.name}</span>
                                {addPill('Add Standard', () => openOwnerStandardModal('categories', category))}
                                <span className="school-book__row-actions">{renderActions('categories', category)}</span>
                            </div>
                            <div className="school-book__category-body">{renderOwnerStandardRows('categories', category)}</div>
                        </div>
                    ))
                )}
            </div>

            <div>
                <div className="school-book__section-head">
                    Standards
                    {addPill('Add Standard', () => openOwnerStandardModal('subjects', subject))}
                </div>
                {renderOwnerStandardRows('subjects', subject)}
            </div>
        </div>
    );

    const columns = [
        {
            title: 'Subject',
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => renderTruncatedCellWithTooltip(name),
        },
        {
            title: 'Overview',
            key: 'summary',
            render: (_: unknown, subject: SubjectNode) => (
                <span className="school-book__summary">
                    {subject.standardRows.length} standards · {subject.categories.length} categories
                </span>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 200,
            render: (_: unknown, subject: SubjectNode) => renderActions('subjects', subject),
        },
    ];

    // Fields of the Add/Edit modal for whatever is being edited
    const renderFormFields = () => {
        const standardsDropdown = (
            <DropdownField
                fields={[
                    {
                        name: 'standards',
                        label: 'Standards',
                        placeholder: 'Select standards',
                        mode: 'multiple',
                        options: standardOptions,
                        disabled: isSaving,
                    },
                ]}
                values={{ standards: formValues.standards || [] }}
                onChange={(_, value) => handleInputChange('standards', Array.isArray(value) ? value : [value])}
            />
        );

        // One Parts dropdown for each standard chosen in the subject / category form
        const partsPerStandard = (formValues.standards || []).map((standard: string) => (
            <DropdownField
                key={`parts-${standard}`}
                fields={[
                    {
                        name: `parts-${standard}`,
                        label: `Parts for ${formatStandard(standard)}`,
                        placeholder: 'Select parts',
                        mode: 'multiple',
                        options: partOptions,
                        disabled: isSaving,
                    },
                ]}
                values={{ [`parts-${standard}`]: formValues.partsByStandard?.[standard] || [] }}
                onChange={(_, value) => handleStandardPartsChange(standard, Array.isArray(value) ? value : [value])}
            />
        ));

        // A standard of the shared list, or one inside a subject / category (its number is fixed once it exists)
        if (entity === 'standards' || ownerStandard) {
            const numberIsFixed = Boolean(ownerStandard && ownerStandard.standard !== null);
            return (
                <>
                    <InputFields
                        fields={[{ ...STRUCTURE_STANDARD_NUMBER_FIELD, disabled: numberIsFixed }]}
                        values={formValues}
                        errors={formErrors}
                        onChange={handleInputChange}
                        disabled={isSaving}
                    />
                    <DropdownField
                        fields={[
                            {
                                name: 'parts',
                                label: 'Parts',
                                placeholder: 'Select parts',
                                mode: 'multiple',
                                options: partOptions,
                                disabled: isSaving,
                            },
                        ]}
                        values={{ parts: formValues.parts || [] }}
                        onChange={(_, value) => handleInputChange('parts', Array.isArray(value) ? value : [value])}
                    />
                </>
            );
        }

        return (
            <>
                <InputFields
                    fields={[STRUCTURE_NAME_FIELD]}
                    values={formValues}
                    errors={formErrors}
                    onChange={handleInputChange}
                    disabled={isSaving}
                />
                {entity === 'categories' && (
                    <DropdownField
                        fields={[
                            {
                                name: 'subject',
                                label: 'Subject',
                                placeholder: 'Select subject',
                                required: true,
                                options: subjectOptions,
                                disabled: isSaving,
                            },
                        ]}
                        values={{ subject: formValues.subject || '' }}
                        errors={formErrors.subject ? { subject: formErrors.subject } : {}}
                        onChange={(_, value) => handleInputChange('subject', Array.isArray(value) ? value[0] || '' : value)}
                    />
                )}
                {(entity === 'subjects' || entity === 'categories') && (
                    <>
                        {standardsDropdown}
                        {partsPerStandard}
                    </>
                )}
            </>
        );
    };

    return (
        <div className="school-book">
            <ToastMessages messages={toastMessages} onMessageClose={hideToast} />

            {!loading && setupSteps.some((step) => !step.done) && (
                <div className="school-book__guide">
                    <div className="school-book__guide-title">Get started</div>
                    <div className="school-book__guide-text">
                        Set these up in order. Each step offers what you created in the one before it.
                    </div>
                    <ol className="school-book__guide-steps">
                        {setupSteps.map((step, index) => {
                            const isNext = !step.done && setupSteps.findIndex((item) => !item.done) === index;
                            return (
                                <li key={step.key} className={`school-book__guide-step${step.done ? ' school-book__guide-step--done' : ''}`}>
                                    <span className="school-book__guide-badge">{step.done ? <CheckOutlined /> : index + 1}</span>
                                    <div className="school-book__guide-step-text">
                                        <b>{step.title}</b>
                                        <span>{step.description}</span>
                                    </div>
                                    {!step.done && (
                                        <Button variant={isNext ? 'primary' : 'secondary'} onClick={step.onAdd}>
                                            {step.buttonLabel}
                                        </Button>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </div>
            )}

            {/* Parts and standards on the left, the subjects table on the right */}
            <div className="school-book__layout">
                <aside className="school-book__side">
                    <div className="school-book__parts">
                        <div className="school-book__parts_head">
                            <div className="school-book__parts-label">Parts</div>
                            <div>{addPill('Add Part', () => openCreateModal('parts'))}</div>
                        </div>
                        <div className="school-book__chips">
                            {parts.map((part) => renderChip(part.id, part.name, 'parts', part))}
                        </div>
                    </div>

                    <div className="school-book__parts">
                        <div className="school-book__parts_head">
                            <div className="school-book__parts-label">Standards</div>
                            <div>{addPill('Add Standard', () => openCreateModal('standards'))}</div>
                        </div>
                        <div className="school-book__chips">
                            {standards.map((standard: StandardRecord) =>
                                renderChip(
                                    standard.id,
                                    formatStandard(standard.standard),
                                    'standards',
                                    standard,
                                    standard.parts.length > 0 ? standard.parts.join(', ') : 'No parts'
                                )
                            )}
                        </div>
                    </div>
                </aside>

                <div className="school-book__main">
                    <TableWithPagination
                        columns={columns}
                        dataSource={tree.map((subject) => ({ ...subject, key: subject.id }))}
                        loading={loading}
                        pagination={false}
                        expandable={{
                            expandedRowRender: (subject: SubjectNode) => renderSubjectDetail(subject),
                            rowExpandable: () => true,
                        }}
                        locale={{
                            emptyText: (
                                <NoDataFound
                                    type="nodata"
                                    description="No subjects yet. Use + Add Subject to create the first one."
                                    style={{ height: 'unset' }}
                                />
                            ),
                        }}
                    />
                </div>
            </div>

            {/* Add / Edit modal (one form for every kind of item) */}
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
                minHeight={250}
            >
                <div style={{ padding: '0 8px' }}>{renderFormFields()}</div>
            </PopupModal>

            {/* Delete / remove confirmation modal */}
            <PopupModal
                open={isDeleteModalVisible}
                onClose={closeDeleteModal}
                onSubmit={handleDeleteConfirm}
                title="Confirm Deletion"
                subtitle=""
                primaryButtonText={removeTarget ? 'Remove' : 'Delete'}
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
});

BooksStructure.displayName = 'BookTab';

export default BooksStructure;
