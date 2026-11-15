// Equations in rich text. Each one is saved as a small element that carries both forms:
//   <span class="math-equation" data-latex="\frac{a}{b}"><math>…MathML…</math></span>
// `data-latex` is the source of truth: the editor reopens it, and the mobile app draws it with its own LaTeX renderer.
// The MathML inside is what web browsers draw, with no library needed.
export const EQUATION_CLASS = 'math-equation';
export const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
export const MAX_LATEX_LENGTH = 2000;

// The MathML the equation editor produces uses these elements and attributes; nothing else is kept
export const MATHML_ELEMENTS = new Set([
    'math', 'mfrac', 'mi', 'mn', 'mo', 'mover', 'mroot', 'mrow', 'mspace', 'msqrt', 'msub', 'msubsup', 'msup',
    'mtable', 'mtd', 'mtr', 'munder', 'munderover', 'mtext', 'mstyle',
]);
export const MATHML_ATTRIBUTES = new Set([
    'accent', 'columnalign', 'width', 'display', 'mathvariant', 'stretchy', 'fence', 'separator', 'lspace', 'rspace',
    'linethickness', 'displaystyle', 'scriptlevel',
]);
export const SAFE_MATHML_VALUE = /^[\w\s.%+-]{1,300}$/;

const escapeAttribute = (value: string) =>
    value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export const EQUATION_TITLE = 'Double-click to edit the equation';

// `mathMl` is the markup MathLive's convertLatexToMathMl returns (it has no <math> root of its own)
export const buildEquationHtml = (latex: string, mathMl: string): string =>
    `<span class="${EQUATION_CLASS}" data-latex="${escapeAttribute(latex)}" contenteditable="false" title="${EQUATION_TITLE}"><math>${mathMl}</math></span>`;

// The editor shows each equation as one unit (it can be deleted, but not typed into) and says how to change it
export const decorateEquations = (root: HTMLElement) => {
    root.querySelectorAll(`.${EQUATION_CLASS}`).forEach((equation) => {
        equation.setAttribute('contenteditable', 'false');
        equation.setAttribute('title', EQUATION_TITLE);
    });
};
