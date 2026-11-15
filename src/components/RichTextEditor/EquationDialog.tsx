import { useEffect, useRef, useState } from 'react';
import { MathfieldElement, convertLatexToMarkup, convertLatexToMathMl, validateLatex, type VirtualKeyboardInterface } from 'mathlive';
// The editor's own fonts, bundled with the app (MathLive would otherwise try to download them from a folder next to it)
import 'mathlive/fonts.css';
import 'mathlive/static.css';
import PopupModal from '../PopupModal/PopupModal';
import { EQUATION_CATEGORIES, previewLatex } from './equationTemplates';
import { MAX_LATEX_LENGTH } from '../../utils/richTextEquation';

MathfieldElement.fontsDirectory = null;
MathfieldElement.soundsDirectory = null;

// MathLive keeps its on-screen math keyboard on window (it is only typed on the field element)
const getMathKeyboard = () => (globalThis as unknown as { mathVirtualKeyboard?: VirtualKeyboardInterface & EventTarget }).mathVirtualKeyboard;

// How far the dialog is moved up so the keyboard doesn't cover its buttons (see `.equation-modal` in the stylesheet)
const KEYBOARD_HEIGHT_VARIABLE = '--equation-keyboard-height';

interface EquationDialogProps {
  /** LaTeX of the equation being edited; empty when inserting a new one */
  initialLatex: string;
  onClose: () => void;
  /** `mathMl` is what the browser draws; `latex` is the source that is saved with it */
  onSubmit: (latex: string, mathMl: string) => void;
  /** Only passed when editing an existing equation */
  onRemove?: () => void;
}

// Word-style equation editor: pick a template from the gallery, then click the empty boxes and type. Loaded on demand,
// so the editor library is only downloaded the first time someone opens it.
const EquationDialog = ({ initialLatex, onClose, onSubmit, onRemove }: EquationDialogProps) => {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const fieldRef = useRef<MathfieldElement | null>(null);
  const [latex, setLatex] = useState(initialLatex);
  const [categoryKey, setCategoryKey] = useState(EQUATION_CATEGORIES[0].key);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!host) return;

    const field = new MathfieldElement();
    // The gallery below replaces the on-screen math keyboard
    field.mathVirtualKeyboardPolicy = 'manual';
    field.value = initialLatex;
    field.addEventListener('input', () => {
      setLatex(field.getValue('latex'));
      setError('');
    });
    host.appendChild(field);
    fieldRef.current = field;

    // The dialog is still opening, so give it a moment before taking the cursor
    const focusTimer = setTimeout(() => field.focus(), 100);
    return () => {
      clearTimeout(focusTimer);
      field.remove();
      fieldRef.current = null;
    };
  }, [host, initialLatex]);

  // The on-screen keyboard slides in from the bottom of the window; the dialog is lifted by its height while it is open
  useEffect(() => {
    const keyboard = getMathKeyboard();
    if (!keyboard) return;

    const root = document.documentElement;
    const updateOffset = () => root.style.setProperty(KEYBOARD_HEIGHT_VARIABLE, keyboard.visible ? `${Math.round(keyboard.boundingRect.height)}px` : '0px');
    keyboard.addEventListener('geometrychange', updateOffset);
    keyboard.addEventListener('virtual-keyboard-toggle', updateOffset);
    return () => {
      keyboard.removeEventListener('geometrychange', updateOffset);
      keyboard.removeEventListener('virtual-keyboard-toggle', updateOffset);
      // Closing the dialog closes the keyboard with it
      keyboard.hide({ animate: false });
      root.style.removeProperty(KEYBOARD_HEIGHT_VARIABLE);
    };
  }, []);

  const insertTemplate = (template: string) => {
    const field = fieldRef.current;
    if (!field) return;
    field.focus();
    // `#?` becomes an empty box to fill in, and the cursor jumps to the first one
    field.insert(template, { format: 'latex', selectionMode: 'placeholder' });
    setLatex(field.getValue('latex'));
    setError('');
  };

  const handleSubmit = () => {
    const value = (fieldRef.current?.getValue('latex') ?? latex).trim();
    if (!value) {
      setError('Build an equation first.');
      return;
    }
    if (value.includes('\\placeholder')) {
      setError('Fill in all the empty boxes first.');
      return;
    }
    if (value.length > MAX_LATEX_LENGTH || validateLatex(value).length > 0) {
      setError('This equation is not valid. Check it and try again.');
      return;
    }
    onSubmit(value, convertLatexToMathMl(value));
  };

  const category = EQUATION_CATEGORIES.find((item) => item.key === categoryKey) ?? EQUATION_CATEGORIES[0];

  return (
    <PopupModal
      open
      onClose={onClose}
      onSubmit={handleSubmit}
      className="equation-modal"
      title={onRemove ? 'Edit equation' : 'Insert equation'}
      subtitle=""
      primaryButtonText={onRemove ? 'Update' : 'Insert'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!latex.trim()}
      showFooter
      contentHeight="auto"
      minHeight={300}
      maxHeight="calc(100vh - 200px)"
    >
      <div className="equation-dialog">
        <div className="equation-dialog__field" ref={setHost} />
        {error && <div className="form-fields-section__error-message">{error}</div>}

        <div className="equation-dialog__tabs">
          {EQUATION_CATEGORIES.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`equation-dialog__tab${item.key === categoryKey ? ' equation-dialog__tab--active' : ''}`}
              onClick={() => setCategoryKey(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="equation-dialog__gallery">
          {category.templates.map((template) => (
            <button
              key={template.latex}
              type="button"
              className="equation-dialog__template"
              title={template.label}
              aria-label={template.label}
              onClick={() => insertTemplate(template.latex)}
              // The preview is MathLive's own output for a fixed template, not user input
              dangerouslySetInnerHTML={{ __html: convertLatexToMarkup(previewLatex(template.latex)) }}
            />
          ))}
        </div>

        {onRemove && (
          <button type="button" className="equation-dialog__remove" onClick={onRemove}>
            Remove this equation
          </button>
        )}
      </div>
    </PopupModal>
  );
};

export default EquationDialog;
