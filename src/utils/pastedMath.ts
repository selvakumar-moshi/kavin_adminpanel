import { latexToUnicode } from './latexToUnicode';
import { EQUATION_CLASS } from './richTextEquation';

// $$ … $$, \[ … \] and \( … \) are always LaTeX
const DELIMITED_LATEX = [/\$\$([\s\S]+?)\$\$/g, /\\\[([\s\S]+?)\\\]/g, /\\\(([\s\S]+?)\\\)/g];
// A single $ … $ only counts when what is inside looks like LaTeX, so prices such as "$5 and $10" are left alone
const SINGLE_DOLLAR_LATEX = /\$([^$\n]+?)\$/g;
const looksLikeLatex = (text: string) => /[\\^_{}]/.test(text);

// Plain text with any LaTeX in it turned into Unicode, or null when there was none
export const convertMathText = (text: string): string | null => {
    let changed = false;
    let result = text;
    DELIMITED_LATEX.forEach((pattern) => {
        result = result.replace(pattern, (_match, latex: string) => {
            changed = true;
            return latexToUnicode(latex);
        });
    });
    result = result.replace(SINGLE_DOLLAR_LATEX, (match, latex: string) => {
        if (!looksLikeLatex(latex)) return match;
        changed = true;
        return latexToUnicode(latex);
    });
    return changed ? result : null;
};

// What to insert when something is pasted into a plain text box, or null for an ordinary paste. It covers an equation
// copied from the rich text editor (its HTML carries the equation's LaTeX) and LaTeX text such as "$$ a^{m+1} $$",
// which is what the equation editor's own box copies.
export const getPastedMathText = (clipboard: DataTransfer | null): string | null => {
    if (!clipboard) return null;

    const html = clipboard.getData('text/html');
    if (html.includes(EQUATION_CLASS)) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const equations = doc.querySelectorAll(`.${EQUATION_CLASS}[data-latex]`);
        if (equations.length > 0) {
            equations.forEach((equation) => equation.replaceWith(doc.createTextNode(latexToUnicode(equation.getAttribute('data-latex') || ''))));
            return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
        }
    }

    return convertMathText(clipboard.getData('text/plain'));
};
