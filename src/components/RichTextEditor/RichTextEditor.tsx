import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Input, Popover, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  LinkOutlined,
  TableOutlined,
  InsertRowBelowOutlined,
  InsertRowRightOutlined,
  DeleteRowOutlined,
  DeleteColumnOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { cleanRichTextValue, htmlToRichValue, normalizeUrl, richValueToHtml, sanitizeRichText, toInlineHtml } from '../../utils/richText';
import { getPastedImage } from '../../utils/clipboardImage';
import SymbolPicker from './SymbolPicker';
import { EQUATION_CLASS, buildEquationHtml, decorateEquations, readSingleLatex } from '../../utils/richTextEquation';

// The equation editor (and the library behind it) is only downloaded the first time it is opened
const EquationDialog = lazy(() => import('./EquationDialog'));
import {
  addColumnRight,
  addRowBelow,
  adjacentCell,
  buildTableHtml,
  deleteColumn,
  deleteRow,
  deleteTable,
  getCurrentCell,
  placeCaretIn,
} from '../../utils/richTextTable';

export interface RichTextEditorProps {
  name: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onPasteImage?: (file: File) => void;
  /** Called with pasted text first; return true when it was handled (e.g. lines spread over several fields) */
  onPasteText?: (text: string) => boolean;
  /**
   * A one-line field (the options of a question): no always-visible toolbar (it appears while editing), no tables, and a
   * value without any markup is kept as plain text, so it stays a plain string for everything that reads it.
   */
  compact?: boolean;
}

type FormatCommand = 'bold' | 'italic' | 'underline' | 'superscript' | 'subscript';

const FORMAT_BUTTONS: { command: FormatCommand; tooltip: string; icon: React.ReactNode }[] = [
  { command: 'bold', tooltip: 'Bold (Ctrl+B)', icon: <BoldOutlined /> },
  { command: 'italic', tooltip: 'Italic (Ctrl+I)', icon: <ItalicOutlined /> },
  { command: 'underline', tooltip: 'Underline (Ctrl+U)', icon: <UnderlineOutlined /> },
  { command: 'superscript', tooltip: 'Superscript', icon: <span>x<sup>2</sup></span> },
  { command: 'subscript', tooltip: 'Subscript', icon: <span>x<sub>2</sub></span> },
];

// Size of the grid in the "Insert table" picker
const TABLE_PICKER_ROWS = 8;
const TABLE_PICKER_COLS = 8;

type TableAction = { key: string; tooltip: string; icon: React.ReactNode; run: (cell: HTMLTableCellElement) => HTMLTableCellElement | null };

// Shown only while the caret is inside a table
const TABLE_ACTIONS: TableAction[] = [
  { key: 'addRow', tooltip: 'Add row below', icon: <InsertRowBelowOutlined />, run: addRowBelow },
  { key: 'addColumn', tooltip: 'Add column to the right', icon: <InsertRowRightOutlined />, run: addColumnRight },
  { key: 'deleteRow', tooltip: 'Delete row', icon: <DeleteRowOutlined />, run: deleteRow },
  { key: 'deleteColumn', tooltip: 'Delete column', icon: <DeleteColumnOutlined />, run: deleteColumn },
  { key: 'deleteTable', tooltip: 'Delete table', icon: <DeleteOutlined />, run: deleteTable },
];

// Mirrors the Google Forms question box: Enter starts a new line, with Bold / Italic / Underline / Link / Clear formatting
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  name,
  label,
  placeholder,
  value,
  onChange,
  required,
  disabled = false,
  error,
  onPasteImage,
  onPasteText,
  compact = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  // The last value this editor emitted; a different incoming value means it was changed from outside (import, reset ...)
  const lastEmittedRef = useRef<string | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [activeCommands, setActiveCommands] = useState<Record<FormatCommand, boolean>>({ bold: false, italic: false, underline: false, superscript: false, subscript: false });
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isInTable, setIsInTable] = useState(false);
  const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);
  const [isSymbolPickerOpen, setIsSymbolPickerOpen] = useState(false);
  // The equation editor: closed (null), inserting a new equation (target null) or editing the one in `target`
  const [equationDialog, setEquationDialog] = useState<{ initialLatex: string; target: HTMLElement | null } | null>(null);
  // Size highlighted in the table picker while the pointer moves over it
  const [pickerSize, setPickerSize] = useState({ rows: 0, cols: 0 });
  const [isFocused, setIsFocused] = useState(false);
  // Busy editing: the cursor is in the field, or a picker / dialog opened from it is (the cursor is in that then).
  // Selection tracking and, in a compact field, the toolbar only exist while this is true, so hundreds of idle fields cost little.
  const isEditing = isFocused || isLinkOpen || isTablePickerOpen || isSymbolPickerOpen || Boolean(equationDialog);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === lastEmittedRef.current) return;
    editor.innerHTML = sanitizeRichText(compact ? richValueToHtml(value) : value);
    decorateEquations(editor);
    lastEmittedRef.current = value;
  }, [value, compact]);

  const selectionInsideEditor = () => {
    const selection = globalThis.getSelection();
    const editor = editorRef.current;
    return Boolean(selection && selection.rangeCount > 0 && editor?.contains(selection.anchorNode));
  };

  const refreshActiveCommands = useCallback(() => {
    const selection = globalThis.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current?.contains(selection.anchorNode)) return;
    setActiveCommands({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      superscript: document.queryCommandState('superscript'),
      subscript: document.queryCommandState('subscript'),
    });
    setIsInTable(Boolean(getCurrentCell(editorRef.current)));
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    document.addEventListener('selectionchange', refreshActiveCommands);
    return () => document.removeEventListener('selectionchange', refreshActiveCommands);
  }, [isEditing, refreshActiveCommands]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const cleaned = cleanRichTextValue(editor.innerHTML);
    // Drop the stray <br> browsers leave behind once everything is deleted, so the placeholder shows again
    if (!cleaned && editor.innerHTML) editor.innerHTML = '';
    // A compact field saves plain text unless the content needs markup
    const stored = compact ? htmlToRichValue(cleaned) : cleaned;
    lastEmittedRef.current = stored;
    onChange(stored);
  };

  const runCommand = (command: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    emitChange();
    refreshActiveCommands();
  };

  // Opens the equation editor for a new equation at the cursor, or for the equation that was double-clicked
  const openEquationDialog = (target: HTMLElement | null = null) => {
    const selection = globalThis.getSelection();
    savedRangeRef.current = !target && selectionInsideEditor() && selection ? selection.getRangeAt(0).cloneRange() : null;
    setEquationDialog({ initialLatex: target?.getAttribute('data-latex') ?? '', target });
  };

  const closeEquationDialog = () => setEquationDialog(null);

  // Inserts HTML where the cursor was (savedRangeRef), or at the cursor when nothing was saved
  const insertHtmlAtSavedRange = (html: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = globalThis.getSelection();
    if (savedRangeRef.current && selection) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
    document.execCommand('insertHTML', false, html);
    // The browser drops the editing marks of equations that come in with the HTML
    decorateEquations(editor);
    emitChange();
  };

  // "$$ a^{m+1} $$" pasted as text (what the equation editor's own box copies) becomes a real equation. The conversion
  // library is only downloaded when this happens.
  const pasteLatexAsEquation = async (latex: string, originalText: string) => {
    const selection = globalThis.getSelection();
    savedRangeRef.current = selectionInsideEditor() && selection ? selection.getRangeAt(0).cloneRange() : null;
    try {
      const { convertLatexToMathMl, validateLatex } = await import('mathlive');
      if (validateLatex(latex).length === 0) {
        insertHtmlAtSavedRange(`${buildEquationHtml(latex, convertLatexToMathMl(latex))}${compact ? '' : '&nbsp;'}`);
        return;
      }
    } catch {
      // The library could not load: the text is pasted as it is
    }
    insertHtmlAtSavedRange(sanitizeRichText(originalText));
  };

  const submitEquation = (latex: string, mathMl: string) => {
    const editor = editorRef.current;
    const target = equationDialog?.target;
    setEquationDialog(null);
    if (!editor) return;

    if (target) {
      // Editing: the equation is swapped in place
      const holder = document.createElement('div');
      holder.innerHTML = buildEquationHtml(latex, mathMl);
      if (holder.firstElementChild) target.replaceWith(holder.firstElementChild);
      emitChange();
    } else {
      insertHtmlAtSavedRange(`${buildEquationHtml(latex, mathMl)}&nbsp;`);
    }
  };

  const removeEquation = () => {
    equationDialog?.target?.remove();
    setEquationDialog(null);
    emitChange();
  };

  // Double-clicking an equation reopens it in the equation editor
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const equation = (e.target as Element).closest?.(`.${EQUATION_CLASS}`);
    if (equation instanceof HTMLElement && editorRef.current?.contains(equation)) openEquationDialog(equation);
  };

  const openSymbolPicker = (open: boolean) => {
    if (!open) {
      setIsSymbolPickerOpen(false);
      return;
    }
    const selection = globalThis.getSelection();
    savedRangeRef.current = selectionInsideEditor() && selection ? selection.getRangeAt(0).cloneRange() : null;
    setIsSymbolPickerOpen(true);
  };

  // Puts the symbol at the cursor (where it was when the picker opened, or after the last symbol inserted)
  const insertSymbol = (character: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    const selection = globalThis.getSelection();
    if (savedRangeRef.current && selection) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
    document.execCommand('insertText', false, character);
    emitChange();
    // The next symbol continues from here
    savedRangeRef.current = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
  };

  const openTablePicker = (open: boolean) => {
    if (!open) {
      setIsTablePickerOpen(false);
      return;
    }
    const selection = globalThis.getSelection();
    savedRangeRef.current = selectionInsideEditor() && selection ? selection.getRangeAt(0).cloneRange() : null;
    setPickerSize({ rows: 0, cols: 0 });
    setIsTablePickerOpen(true);
  };

  const insertTable = (rows: number, cols: number) => {
    const editor = editorRef.current;
    setIsTablePickerOpen(false);
    if (!editor) return;

    editor.focus();
    const selection = globalThis.getSelection();
    if (savedRangeRef.current && selection) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
    const tablesBefore = new Set(Array.from(editor.querySelectorAll('table')));
    document.execCommand('insertHTML', false, buildTableHtml(rows, cols));
    emitChange();

    // The caret goes into the first cell, ready to type a heading
    const created = Array.from(editor.querySelectorAll('table')).find((table) => !tablesBefore.has(table));
    placeCaretIn(created?.querySelector('th, td'));
    refreshActiveCommands();
  };

  // Add / delete a row, column or the whole table, relative to the cell the caret is in
  const runTableAction = (run: TableAction['run']) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const cell = getCurrentCell(editor);
    if (!cell) return;

    placeCaretIn(run(cell));
    emitChange();
    refreshActiveCommands();
  };

  // Tab / Shift+Tab move between cells; Tab in the last cell adds a row
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (compact && e.key === 'Enter') {
      e.preventDefault();
      return;
    }
    if (e.key !== 'Tab' || !editorRef.current) return;
    const cell = getCurrentCell(editorRef.current);
    if (!cell) return;

    e.preventDefault();
    const next = adjacentCell(cell, e.shiftKey) ?? (e.shiftKey ? null : addRowBelow(cell));
    if (next) {
      placeCaretIn(next);
      emitChange();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboard = e.clipboardData;
    const image = onPasteImage ? getPastedImage(clipboard) : null;
    if (image && onPasteImage) {
      e.preventDefault();
      onPasteImage(image);
      return;
    }

    const text = clipboard.getData('text/plain');
    if (onPasteText?.(text)) {
      e.preventDefault();
      return;
    }

    // Equations copied from a rich text box (this one, the question text ...) stay equations. Only the allowed tags are
    // kept, so nothing else from the source comes with them.
    const html = clipboard.getData('text/html');
    if (html.includes(EQUATION_CLASS)) {
      const cleaned = sanitizeRichText(html);
      if (cleaned.includes(EQUATION_CLASS)) {
        e.preventDefault();
        const selection = globalThis.getSelection();
        savedRangeRef.current = selectionInsideEditor() && selection ? selection.getRangeAt(0).cloneRange() : null;
        insertHtmlAtSavedRange(compact ? toInlineHtml(cleaned) : cleaned);
        return;
      }
    }

    // A single equation pasted as LaTeX text
    const latex = readSingleLatex(text);
    if (latex) {
      e.preventDefault();
      void pasteLatexAsEquation(latex, text);
      return;
    }

    // A table copied from Word / Excel / a web page comes in as a real table (cleaned down to the allowed tags, so only
    // its rows, cells and text are kept; the borders come from the editor's own style). Not inside an existing table,
    // and not in a one-line field.
    if (!compact && editorRef.current && /<table[\s>]/i.test(html) && !getCurrentCell(editorRef.current)) {
      const cleaned = sanitizeRichText(html);
      if (cleaned.includes('<table')) {
        e.preventDefault();
        // A trailing line gives the caret somewhere to go below a table that ends the paste
        document.execCommand('insertHTML', false, cleaned.endsWith('</table>') ? `${cleaned}<div><br></div>` : cleaned);
        emitChange();
        return;
      }
    }

    // Anything else is pasted as plain text so formatting from Word / web pages doesn't leak in
    e.preventDefault();
    document.execCommand('insertText', false, compact ? text.replace(/\s*\n+\s*/g, ' ') : text);
  };

  const openLinkPopover = (open: boolean) => {
    if (!open) {
      setIsLinkOpen(false);
      return;
    }
    const selection = globalThis.getSelection();
    savedRangeRef.current = selectionInsideEditor() && selection ? selection.getRangeAt(0).cloneRange() : null;
    setLinkUrl('');
    setIsLinkOpen(true);
  };

  const applyLink = () => {
    const url = normalizeUrl(linkUrl);
    setIsLinkOpen(false);
    if (!url) return;

    editorRef.current?.focus();
    const selection = globalThis.getSelection();
    if (savedRangeRef.current && selection) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
    if (selection && selection.isCollapsed) {
      // Nothing selected: insert the address itself as the link text
      const safeUrl = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      runCommand('insertHTML', `<a href="${safeUrl}">${safeUrl}</a>`);
    } else {
      runCommand('createLink', url);
    }
  };

  const hasError = Boolean(error);
  const wrapperClassName = [
    'rich-text-editor',
    hasError ? 'rich-text-editor--error' : '',
    disabled ? 'rich-text-editor--disabled' : '',
    compact ? 'rich-text-editor--compact' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="form-fields-section">
      <div className="form-fields-section__form">
        <div className="form-fields-section__field">
          <div className="ant-row ant-form-item">
            <div className="ant-form-item-label">
              <label className={required ? 'ant-form-item-required' : ''}>
                {label}
                {required && <span className="form-fields-section__required">*</span>}
              </label>
            </div>
            <div className="ant-form-item-control">
              <div className={wrapperClassName}>
                <div
                  ref={editorRef}
                  className="rich-text-editor__content"
                  contentEditable={!disabled}
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline={!compact}
                  aria-label={label}
                  data-placeholder={placeholder}
                  data-testid={`input-${name}`}
                  onInput={emitChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onDoubleClick={handleDoubleClick}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                />
                {(!compact || isEditing) && (
                <div className="rich-text-editor__toolbar">
                  {FORMAT_BUTTONS.filter(({ command }) => !compact || command === 'superscript' || command === 'subscript').map(({ command, tooltip, icon }) => (
                    <Tooltip key={command} title={tooltip}>
                      <button
                        type="button"
                        className={`rich-text-editor__btn${activeCommands[command] ? ' rich-text-editor__btn--active' : ''}`}
                        // Keeps the text selection while the button is clicked
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => runCommand(command)}
                        aria-label={tooltip}
                        disabled={disabled}
                      >
                        {icon}
                      </button>
                    </Tooltip>
                  ))}
                  {!compact && (
                  <>
                  <Popover
                    open={isLinkOpen}
                    onOpenChange={openLinkPopover}
                    trigger="click"
                    placement="bottomLeft"
                    content={(
                      <div className="rich-text-editor__link-popover">
                        <Input
                          autoFocus
                          placeholder="Paste or type a link"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          onPressEnter={applyLink}
                        />
                        <button type="button" className="rich-text-editor__link-apply" onClick={applyLink}>
                          Apply
                        </button>
                      </div>
                    )}
                  >
                    <Tooltip title="Insert link">
                      <button
                        type="button"
                        className="rich-text-editor__btn"
                        onMouseDown={(e) => e.preventDefault()}
                        aria-label="Insert link"
                        disabled={disabled}
                      >
                        <LinkOutlined />
                      </button>
                    </Tooltip>
                  </Popover>
                  <Popover
                    open={isTablePickerOpen}
                    onOpenChange={openTablePicker}
                    trigger="click"
                    placement="bottomLeft"
                    content={(
                      <div className="rich-text-editor__table-picker">
                        <div className="rich-text-editor__table-grid" onMouseLeave={() => setPickerSize({ rows: 0, cols: 0 })}>
                          {Array.from({ length: TABLE_PICKER_ROWS * TABLE_PICKER_COLS }, (_, index) => {
                            const row = Math.floor(index / TABLE_PICKER_COLS) + 1;
                            const col = (index % TABLE_PICKER_COLS) + 1;
                            const isHighlighted = row <= pickerSize.rows && col <= pickerSize.cols;
                            return (
                              <button
                                key={index}
                                type="button"
                                className={`rich-text-editor__table-cell${isHighlighted ? ' rich-text-editor__table-cell--active' : ''}`}
                                onMouseEnter={() => setPickerSize({ rows: row, cols: col })}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => insertTable(row, col)}
                                aria-label={`${row} rows by ${col} columns`}
                              />
                            );
                          })}
                        </div>
                        <div className="rich-text-editor__table-size">
                          {pickerSize.rows > 0 ? `${pickerSize.rows} × ${pickerSize.cols}` : 'Choose table size'}
                        </div>
                      </div>
                    )}
                  >
                    <Tooltip title={isInTable ? 'Already inside a table' : 'Insert table'}>
                      <button
                        type="button"
                        className="rich-text-editor__btn"
                        onMouseDown={(e) => e.preventDefault()}
                        aria-label="Insert table"
                        disabled={disabled || isInTable}
                      >
                        <TableOutlined />
                      </button>
                    </Tooltip>
                  </Popover>
                  {isInTable && !disabled && (
                    <>
                      <span className="rich-text-editor__divider" />
                      {TABLE_ACTIONS.map(({ key, tooltip, icon, run }) => (
                        <Tooltip key={key} title={tooltip}>
                          <button
                            type="button"
                            className="rich-text-editor__btn"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => runTableAction(run)}
                            aria-label={tooltip}
                          >
                            {icon}
                          </button>
                        </Tooltip>
                      ))}
                    </>
                  )}
                  </>
                  )}
                  <Popover
                    open={isSymbolPickerOpen}
                    onOpenChange={openSymbolPicker}
                    trigger="click"
                    placement="bottomLeft"
                    content={<SymbolPicker onPick={insertSymbol} />}
                  >
                    <Tooltip title="Insert symbol">
                      <button
                        type="button"
                        className="rich-text-editor__btn rich-text-editor__btn--text"
                        onMouseDown={(e) => e.preventDefault()}
                        aria-label="Insert symbol"
                        disabled={disabled}
                      >
                        Ω
                      </button>
                    </Tooltip>
                  </Popover>
                  <Tooltip title="Insert equation">
                    <button
                      type="button"
                      className="rich-text-editor__btn rich-text-editor__btn--text"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => openEquationDialog()}
                      aria-label="Insert equation"
                      disabled={disabled}
                    >
                      √x
                    </button>
                  </Tooltip>
                  <Tooltip title="Remove formatting">
                    <button
                      type="button"
                      className="rich-text-editor__btn rich-text-editor__btn--text"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        document.execCommand('removeFormat');
                        runCommand('unlink');
                      }}
                      aria-label="Remove formatting"
                      disabled={disabled}
                    >
                      T<sub>x</sub>
                    </button>
                  </Tooltip>
                </div>
                )}
              </div>
              {error && <div className="form-fields-section__error-message">{error}</div>}
              {equationDialog && (
                <Suspense fallback={null}>
                  <EquationDialog
                    initialLatex={equationDialog.initialLatex}
                    onClose={closeEquationDialog}
                    onSubmit={submitEquation}
                    onRemove={equationDialog.target ? removeEquation : undefined}
                  />
                </Suspense>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
