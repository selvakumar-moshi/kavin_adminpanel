// Symbols for the rich text editor's symbol picker: [character, name used by the search box]
export type SymbolEntry = [character: string, name: string];

export interface SymbolCategory {
    key: string;
    label: string;
    symbols: SymbolEntry[];
}

export const SYMBOL_CATEGORIES: SymbolCategory[] = [
    {
        key: 'math',
        label: 'Math',
        symbols: [
            ['±', 'plus minus'], ['∓', 'minus plus'], ['×', 'multiply times'], ['÷', 'divide'], ['≠', 'not equal'],
            ['≈', 'approximately equal'], ['≡', 'identical congruent'], ['≤', 'less than or equal'], ['≥', 'greater than or equal'],
            ['≪', 'much less'], ['≫', 'much greater'], ['∞', 'infinity'], ['∑', 'sum sigma'], ['∏', 'product'], ['∫', 'integral'],
            ['∬', 'double integral'], ['∮', 'contour integral'], ['√', 'square root'], ['∛', 'cube root'], ['∜', 'fourth root'],
            ['∂', 'partial derivative'], ['∆', 'delta increment'], ['∇', 'nabla'], ['∝', 'proportional'], ['∴', 'therefore'],
            ['∵', 'because'], ['∈', 'element of'], ['∉', 'not element of'], ['⊂', 'subset'], ['⊃', 'superset'], ['⊆', 'subset equal'],
            ['⊇', 'superset equal'], ['∪', 'union'], ['∩', 'intersection'], ['∅', 'empty set'], ['∀', 'for all'], ['∃', 'exists'],
            ['¬', 'not'], ['∧', 'and'], ['∨', 'or'], ['∠', 'angle'], ['⊥', 'perpendicular'], ['∥', 'parallel'], ['△', 'triangle'],
            ['°', 'degree'], ['′', 'prime minutes'], ['″', 'double prime seconds'], ['%', 'percent'], ['‰', 'per mille'], ['‱', 'per ten thousand'],
            ['ℕ', 'natural numbers'], ['ℤ', 'integers'], ['ℚ', 'rational numbers'], ['ℝ', 'real numbers'], ['ℂ', 'complex numbers'],
        ],
    },
    {
        key: 'greek',
        label: 'Greek',
        symbols: [
            ['α', 'alpha'], ['β', 'beta'], ['γ', 'gamma'], ['δ', 'delta'], ['ε', 'epsilon'], ['ζ', 'zeta'], ['η', 'eta'], ['θ', 'theta'],
            ['ι', 'iota'], ['κ', 'kappa'], ['λ', 'lambda'], ['μ', 'mu micro'], ['ν', 'nu'], ['ξ', 'xi'], ['ο', 'omicron'], ['π', 'pi'],
            ['ρ', 'rho'], ['σ', 'sigma'], ['τ', 'tau'], ['υ', 'upsilon'], ['φ', 'phi'], ['χ', 'chi'], ['ψ', 'psi'], ['ω', 'omega'],
            ['Γ', 'capital gamma'], ['Δ', 'capital delta'], ['Θ', 'capital theta'], ['Λ', 'capital lambda'], ['Ξ', 'capital xi'],
            ['Π', 'capital pi'], ['Σ', 'capital sigma'], ['Φ', 'capital phi'], ['Ψ', 'capital psi'], ['Ω', 'capital omega ohm'],
        ],
    },
    {
        key: 'scripts',
        label: 'Super / Sub',
        symbols: [
            ['⁰', 'superscript 0'], ['¹', 'superscript 1'], ['²', 'superscript 2 squared'], ['³', 'superscript 3 cubed'], ['⁴', 'superscript 4'],
            ['⁵', 'superscript 5'], ['⁶', 'superscript 6'], ['⁷', 'superscript 7'], ['⁸', 'superscript 8'], ['⁹', 'superscript 9'],
            ['⁺', 'superscript plus'], ['⁻', 'superscript minus'], ['⁼', 'superscript equals'], ['⁽', 'superscript open bracket'],
            ['⁾', 'superscript close bracket'], ['ⁿ', 'superscript n'], ['ⁱ', 'superscript i'],
            ['₀', 'subscript 0'], ['₁', 'subscript 1'], ['₂', 'subscript 2'], ['₃', 'subscript 3'], ['₄', 'subscript 4'],
            ['₅', 'subscript 5'], ['₆', 'subscript 6'], ['₇', 'subscript 7'], ['₈', 'subscript 8'], ['₉', 'subscript 9'],
            ['₊', 'subscript plus'], ['₋', 'subscript minus'], ['₌', 'subscript equals'], ['₍', 'subscript open bracket'], ['₎', 'subscript close bracket'],
        ],
    },
    {
        key: 'fractions',
        label: 'Fractions',
        symbols: [
            ['½', 'one half'], ['⅓', 'one third'], ['⅔', 'two thirds'], ['¼', 'one quarter'], ['¾', 'three quarters'], ['⅕', 'one fifth'],
            ['⅖', 'two fifths'], ['⅗', 'three fifths'], ['⅘', 'four fifths'], ['⅙', 'one sixth'], ['⅚', 'five sixths'], ['⅐', 'one seventh'],
            ['⅛', 'one eighth'], ['⅜', 'three eighths'], ['⅝', 'five eighths'], ['⅞', 'seven eighths'], ['⅑', 'one ninth'], ['⅒', 'one tenth'],
            ['⁄', 'fraction slash'],
        ],
    },
    {
        key: 'arrows',
        label: 'Arrows',
        symbols: [
            ['←', 'left arrow'], ['↑', 'up arrow'], ['→', 'right arrow'], ['↓', 'down arrow'], ['↔', 'left right arrow'], ['↕', 'up down arrow'],
            ['⇐', 'double left arrow'], ['⇑', 'double up arrow'], ['⇒', 'implies double right arrow'], ['⇓', 'double down arrow'],
            ['⇔', 'if and only if double arrow'], ['↦', 'maps to'], ['↗', 'up right arrow'], ['↘', 'down right arrow'], ['↖', 'up left arrow'],
            ['↙', 'down left arrow'], ['⟶', 'long right arrow'], ['⟵', 'long left arrow'],
        ],
    },
    {
        key: 'currency',
        label: 'Currency / Units',
        symbols: [
            ['₹', 'rupee'], ['$', 'dollar'], ['€', 'euro'], ['£', 'pound'], ['¥', 'yen'], ['¢', 'cent'], ['°', 'degree'], ['µ', 'micro'],
            ['Å', 'angstrom'], ['Ω', 'ohm'], ['℃', 'degree celsius'], ['℉', 'degree fahrenheit'], ['№', 'number'], ['©', 'copyright'],
            ['®', 'registered'], ['™', 'trademark'], ['ℓ', 'litre'], ['㎏', 'kilogram'], ['㎝', 'centimetre'], ['㎜', 'millimetre'], ['㎞', 'kilometre'],
        ],
    },
    {
        key: 'general',
        label: 'General',
        symbols: [
            ['•', 'bullet'], ['·', 'middle dot'], ['…', 'ellipsis'], ['–', 'en dash'], ['—', 'em dash'], ['«', 'left guillemet'], ['»', 'right guillemet'],
            ['‘', 'left single quote'], ['’', 'right single quote'], ['“', 'left double quote'], ['”', 'right double quote'], ['§', 'section'],
            ['¶', 'paragraph'], ['†', 'dagger'], ['‡', 'double dagger'], ['★', 'star'], ['☆', 'outline star'], ['✓', 'check tick'], ['✗', 'cross'],
            ['♠', 'spade'], ['♣', 'club'], ['♥', 'heart'], ['♦', 'diamond'], ['□', 'square'], ['■', 'filled square'], ['○', 'circle'], ['●', 'filled circle'],
        ],
    },
];

const RECENT_KEY = 'richTextRecentSymbols';
const MAX_RECENT = 12;

export const loadRecentSymbols = (): string[] => {
    try {
        const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
        return Array.isArray(stored) ? stored.filter((item) => typeof item === 'string').slice(0, MAX_RECENT) : [];
    } catch {
        return [];
    }
};

// Most recent first, no duplicates
export const rememberSymbol = (character: string): string[] => {
    const next = [character, ...loadRecentSymbols().filter((item) => item !== character)].slice(0, MAX_RECENT);
    try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
        // Storage unavailable (private mode): the list just isn't remembered
    }
    return next;
};

// Characters whose name contains every word typed in the search box
export const searchSymbols = (query: string): SymbolEntry[] => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    const seen = new Set<string>();
    return SYMBOL_CATEGORIES.flatMap((category) => category.symbols).filter(([character, name]) => {
        if (seen.has(character)) return false;
        const matches = words.every((word) => name.includes(word) || character === word);
        if (matches) seen.add(character);
        return matches;
    });
};
