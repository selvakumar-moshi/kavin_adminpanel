import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { cleanRichTextValue, normalizeUrl, sanitizeRichText } from '../../utils/richText';
import { getPastedImage } from '../../utils/clipboardImage';
import SymbolPicker from './SymbolPicker';
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
  // Size highlighted in the table picker while the pointer moves over it
  const [pickerSize, setPickerSize] = useState({ rows: 0, cols: 0 });

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === lastEmittedRef.current) return;
    editor.innerHTML = sanitizeRichText(value);
    lastEmittedRef.current = value;
  }, [value]);

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
    document.addEventListener('selectionchange', refreshActiveCommands);
    return () => document.removeEventListener('selectionchange', refreshActiveCommands);
  }, [refreshActiveCommands]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const cleaned = cleanRichTextValue(editor.innerHTML);
    // Drop the stray <br> browsers leave behind once everything is deleted, so the placeholder shows again
    if (!cleaned && editor.innerHTML) editor.innerHTML = '';
    lastEmittedRef.current = cleaned;
    onChange(cleaned);
  };

  const runCommand = (command: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    emitChange();
    refreshActiveCommands();
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
    const image = onPasteImage ? getPastedImage(e.clipboardData) : null;
    if (image && onPasteImage) {
      e.preventDefault();
      onPasteImage(image);
      return;
    }
    // A table copied from Word / Excel / a web page comes in as a real table (cleaned down to the allowed tags, so only
    // its rows, cells and text are kept; the borders come from the editor's own style). Not inside an existing table.
    const html = e.clipboardData.getData('text/html');
    if (editorRef.current && /<table[\s>]/i.test(html) && !getCurrentCell(editorRef.current)) {
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
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
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
                  aria-multiline="true"
                  aria-label={label}
                  data-placeholder={placeholder}
                  data-testid={`input-${name}`}
                  onInput={emitChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                />
                <div className="rich-text-editor__toolbar">
                  {FORMAT_BUTTONS.map(({ command, tooltip, icon }) => (
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
              </div>
              {error && <div className="form-fields-section__error-message">{error}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
