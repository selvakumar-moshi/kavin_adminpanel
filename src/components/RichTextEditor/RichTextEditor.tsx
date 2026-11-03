import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Input, Popover, Tooltip } from 'antd';
import { BoldOutlined, ItalicOutlined, UnderlineOutlined, LinkOutlined } from '@ant-design/icons';
import { cleanRichTextValue, normalizeUrl, sanitizeRichText } from '../../utils/richText';

export interface RichTextEditorProps {
  name: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

type FormatCommand = 'bold' | 'italic' | 'underline';

const FORMAT_BUTTONS: { command: FormatCommand; tooltip: string; icon: React.ReactNode }[] = [
  { command: 'bold', tooltip: 'Bold (Ctrl+B)', icon: <BoldOutlined /> },
  { command: 'italic', tooltip: 'Italic (Ctrl+I)', icon: <ItalicOutlined /> },
  { command: 'underline', tooltip: 'Underline (Ctrl+U)', icon: <UnderlineOutlined /> },
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
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  // The last value this editor emitted; a different incoming value means it was changed from outside (import, reset ...)
  const lastEmittedRef = useRef<string | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [activeCommands, setActiveCommands] = useState<Record<FormatCommand, boolean>>({ bold: false, italic: false, underline: false });
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

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
    });
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

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Paste as plain text so formatting from Word / web pages doesn't leak in
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
