// The equation gallery, laid out like Word's Equation tab. Every template is LaTeX (the format the equations are saved
// in) with `#?` marking the boxes to fill in. Only standard LaTeX / KaTeX commands are used, so the mobile app can draw
// them with its own LaTeX renderer.
export interface EquationTemplate {
    label: string;
    latex: string;
}

export interface EquationCategory {
    key: string;
    label: string;
    templates: EquationTemplate[];
}

export const EQUATION_CATEGORIES: EquationCategory[] = [
    {
        key: 'fraction',
        label: 'Fraction',
        templates: [
            { label: 'Stacked fraction', latex: '\\frac{#?}{#?}' },
            { label: 'Small fraction', latex: '\\tfrac{#?}{#?}' },
            { label: 'Differential', latex: '\\frac{d#?}{d#?}' },
            { label: 'Partial differential', latex: '\\frac{\\partial #?}{\\partial #?}' },
            { label: 'Pi over 2', latex: '\\frac{\\pi}{2}' },
            { label: 'Binomial coefficient', latex: '\\binom{#?}{#?}' },
        ],
    },
    {
        key: 'script',
        label: 'Script',
        templates: [
            { label: 'Superscript', latex: '#?^{#?}' },
            { label: 'Subscript', latex: '#?_{#?}' },
            { label: 'Subscript-superscript', latex: '#?_{#?}^{#?}' },
            { label: 'Left subscript-superscript', latex: '{}_{#?}^{#?}#?' },
            { label: 'Subscript with superscript inside', latex: '#?_{#?^{#?}}' },
            { label: 'Exponential', latex: 'e^{-i\\omega t}' },
            { label: 'Squared', latex: 'x^{2}' },
            { label: 'Left scripts', latex: '{}_{1}^{n}Y' },
        ],
    },
    {
        key: 'radical',
        label: 'Radical',
        templates: [
            { label: 'Square root', latex: '\\sqrt{#?}' },
            { label: 'Root with degree', latex: '\\sqrt[#?]{#?}' },
            { label: 'Cube root', latex: '\\sqrt[3]{#?}' },
            { label: 'Fourth root', latex: '\\sqrt[4]{#?}' },
            { label: 'Quadratic formula', latex: '\\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}' },
            { label: 'Pythagoras', latex: '\\sqrt{a^{2}+b^{2}}' },
        ],
    },
    {
        key: 'integral',
        label: 'Integral',
        templates: [
            { label: 'Integral', latex: '\\int #?' },
            { label: 'Integral with limits', latex: '\\int_{#?}^{#?} #?' },
            { label: 'Double integral', latex: '\\iint #?' },
            { label: 'Double integral with limit', latex: '\\iint_{#?} #?' },
            { label: 'Triple integral', latex: '\\iiint #?' },
            { label: 'Contour integral', latex: '\\oint #?' },
            { label: 'Contour integral with limit', latex: '\\oint_{#?} #?' },
            { label: 'Integral over the real line', latex: '\\int_{-\\infty}^{\\infty} #?\\,dx' },
        ],
    },
    {
        key: 'operator',
        label: 'Large Operator',
        templates: [
            { label: 'Sum with limits', latex: '\\sum_{#?}^{#?} #?' },
            { label: 'Sum', latex: '\\sum_{#?} #?' },
            { label: 'Product with limits', latex: '\\prod_{#?}^{#?} #?' },
            { label: 'Product', latex: '\\prod_{#?} #?' },
            { label: 'Union', latex: '\\bigcup_{#?}^{#?} #?' },
            { label: 'Intersection', latex: '\\bigcap_{#?}^{#?} #?' },
        ],
    },
    {
        key: 'bracket',
        label: 'Bracket',
        templates: [
            { label: 'Parentheses', latex: '\\left(#?\\right)' },
            { label: 'Square brackets', latex: '\\left[#?\\right]' },
            { label: 'Braces', latex: '\\left\\{#?\\right\\}' },
            { label: 'Absolute value', latex: '\\left|#?\\right|' },
            { label: 'Norm', latex: '\\left\\|#?\\right\\|' },
            { label: 'Angle brackets', latex: '\\left\\langle #?\\right\\rangle' },
            { label: 'Floor', latex: '\\left\\lfloor #?\\right\\rfloor' },
            { label: 'Ceiling', latex: '\\left\\lceil #?\\right\\rceil' },
            { label: 'Cases', latex: '\\begin{cases}#? & #?\\\\ #? & #?\\end{cases}' },
        ],
    },
    {
        key: 'function',
        label: 'Function',
        templates: [
            { label: 'Sine', latex: '\\sin #?' },
            { label: 'Cosine', latex: '\\cos #?' },
            { label: 'Tangent', latex: '\\tan #?' },
            { label: 'Cotangent', latex: '\\cot #?' },
            { label: 'Secant', latex: '\\sec #?' },
            { label: 'Cosecant', latex: '\\csc #?' },
            { label: 'Inverse sine', latex: '\\sin^{-1} #?' },
            { label: 'Hyperbolic sine', latex: '\\sinh #?' },
            { label: 'Exponential', latex: '\\exp #?' },
        ],
    },
    {
        key: 'accent',
        label: 'Accent',
        templates: [
            { label: 'Hat', latex: '\\hat{#?}' },
            { label: 'Check', latex: '\\check{#?}' },
            { label: 'Tilde', latex: '\\tilde{#?}' },
            { label: 'Bar', latex: '\\bar{#?}' },
            { label: 'Dot', latex: '\\dot{#?}' },
            { label: 'Double dot', latex: '\\ddot{#?}' },
            { label: 'Vector', latex: '\\vec{#?}' },
            { label: 'Right arrow above', latex: '\\overrightarrow{#?}' },
            { label: 'Wide hat', latex: '\\widehat{#?}' },
            { label: 'Overbrace', latex: '\\overbrace{#?}^{#?}' },
            { label: 'Underbrace', latex: '\\underbrace{#?}_{#?}' },
        ],
    },
    {
        key: 'limit',
        label: 'Limit and Log',
        templates: [
            { label: 'Limit', latex: '\\lim_{#?\\to #?} #?' },
            { label: 'Limit to infinity', latex: '\\lim_{n\\to\\infty} #?' },
            { label: 'Logarithm with base', latex: '\\log_{#?} #?' },
            { label: 'Natural log', latex: '\\ln #?' },
            { label: 'Maximum', latex: '\\max_{#?} #?' },
            { label: 'Minimum', latex: '\\min_{#?} #?' },
        ],
    },
    {
        key: 'symbolOperator',
        label: 'Operator',
        templates: [
            { label: 'Colon equal', latex: ':=' },
            { label: 'Yields', latex: '\\xrightarrow{#?}' },
            { label: 'Yields (left)', latex: '\\xleftarrow{#?}' },
            { label: 'Delta equal', latex: '\\overset{\\Delta}{=}' },
            { label: 'Equal with text above', latex: '\\overset{#?}{=}' },
            { label: 'Equal with text below', latex: '\\underset{#?}{=}' },
        ],
    },
    {
        key: 'matrix',
        label: 'Matrix',
        templates: [
            { label: '2 × 2 matrix', latex: '\\begin{pmatrix}#? & #?\\\\ #? & #?\\end{pmatrix}' },
            { label: '3 × 3 matrix', latex: '\\begin{pmatrix}#? & #? & #?\\\\ #? & #? & #?\\\\ #? & #? & #?\\end{pmatrix}' },
            { label: '2 × 2 with brackets', latex: '\\begin{bmatrix}#? & #?\\\\ #? & #?\\end{bmatrix}' },
            { label: 'Determinant', latex: '\\begin{vmatrix}#? & #?\\\\ #? & #?\\end{vmatrix}' },
            { label: 'Identity matrix', latex: '\\begin{pmatrix}1 & 0\\\\ 0 & 1\\end{pmatrix}' },
            { label: 'Column vector', latex: '\\begin{pmatrix}#?\\\\ #?\\end{pmatrix}' },
        ],
    },
];

// What a gallery button shows: the template with every box drawn as an empty square
export const previewLatex = (latex: string): string => latex.replaceAll('#?', '\\square');

// A template with the boxes filled by a letter, to check that it is valid LaTeX
export const sampleLatex = (latex: string): string => latex.replaceAll('#?', 'x');
