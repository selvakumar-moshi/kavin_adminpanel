// Turns LaTeX into plain Unicode text, for plain text boxes that cannot draw an equation (e.g. a1 option):
//   a^{m+1}  ->  aᵐ⁺¹        \frac{a}{b}  ->  a/b        \sqrt[3]{x}  ->  ∛x        \frac{1}{2}  ->  ½
// It reads what the equation editor produces (and ordinary LaTeX); anything it has no plain form for is written out in a
// readable way, such as x^(a+b), instead of being dropped.

const GREEK: Record<string, string> = {
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ',
    iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', varpi: 'ϖ', rho: 'ρ', varrho: 'ϱ', sigma: 'σ',
    varsigma: 'ς', tau: 'τ', upsilon: 'υ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
    Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
};

const SYMBOLS: Record<string, string> = {
    pm: '±', mp: '∓', times: '×', div: '÷', cdot: '·', ast: '*', star: '⋆', circ: '∘', bullet: '•',
    le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', approx: '≈', sim: '∼', simeq: '≃', cong: '≅', equiv: '≡',
    propto: '∝', ll: '≪', gg: '≫', infty: '∞', partial: '∂', nabla: '∇',
    sum: '∑', prod: '∏', coprod: '∐', int: '∫', iint: '∬', iiint: '∭', oint: '∮', bigcup: '⋃', bigcap: '⋂',
    cup: '∪', cap: '∩', in: '∈', notin: '∉', ni: '∋', subset: '⊂', supset: '⊃', subseteq: '⊆', supseteq: '⊇',
    emptyset: '∅', varnothing: '∅', forall: '∀', exists: '∃', neg: '¬', lnot: '¬', land: '∧', wedge: '∧', lor: '∨', vee: '∨',
    therefore: '∴', because: '∵', angle: '∠', perp: '⊥', parallel: '∥', triangle: '△', degree: '°', prime: '′',
    to: '→', rightarrow: '→', leftarrow: '←', leftrightarrow: '↔', Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔',
    implies: '⇒', iff: '⇔', mapsto: '↦', uparrow: '↑', downarrow: '↓', longrightarrow: '⟶', longleftarrow: '⟵',
    ldots: '…', cdots: '⋯', dots: '…', vdots: '⋮', ddots: '⋱', hbar: 'ℏ', ell: 'ℓ', Re: 'ℜ', Im: 'ℑ', aleph: 'ℵ',
    langle: '⟨', rangle: '⟩', lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉', Box: '□', square: '□', checkmark: '✓',
    colon: ':', mid: '|', vert: '|', Vert: '‖', setminus: '∖', oplus: '⊕', otimes: '⊗', dagger: '†',
};

// Characters that have no command of their own after a backslash
const ESCAPED: Record<string, string> = {
    ',': ' ', ';': ' ', ':': ' ', ' ': ' ', '!': '', '\\': ' ', '{': '{', '}': '}', '%': '%', $: '$', '#': '#', '&': '&', _: '_', '|': '‖',
};

const FUNCTION_NAMES = new Set([
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'coth', 'log', 'ln', 'lg',
    'exp', 'lim', 'limsup', 'liminf', 'max', 'min', 'sup', 'inf', 'det', 'gcd', 'deg', 'dim', 'ker', 'arg',
]);

// Commands that only change how their content looks
const PLAIN_WRAPPERS = new Set(['text', 'mathrm', 'mathbf', 'mathit', 'mathsf', 'mathtt', 'textbf', 'textit', 'operatorname', 'boldsymbol', 'bm', 'mbox']);
// Commands that only change spacing or size
const IGNORED = new Set(['limits', 'nolimits', 'displaystyle', 'textstyle', 'scriptstyle', 'big', 'Big', 'bigg', 'Bigg', 'bigl', 'bigr', 'Bigl', 'Bigr']);

const COMBINING: Record<string, string> = {
    hat: '̂', widehat: '̂', check: '̌', tilde: '̃', widetilde: '̃', bar: '̄', dot: '̇',
    ddot: '̈', vec: '⃗', overrightarrow: '⃗', acute: '́', grave: '̀', breve: '̆',
};

const BLACKBOARD: Record<string, string> = { R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ', P: 'ℙ', H: 'ℍ' };

const VULGAR_FRACTIONS: Record<string, string> = {
    '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙',
    '5/6': '⅚', '1/7': '⅐', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞', '1/9': '⅑', '1/10': '⅒',
};

const fromPairs = (from: string, to: string): Record<string, string> =>
    Object.fromEntries(Array.from(from).map((character, index) => [character, Array.from(to)[index]]));

const SUPERSCRIPT: Record<string, string> = {
    ...fromPairs('0123456789+-=()', '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾'),
    '−': '⁻',
    ...fromPairs('abcdefghijklmnoprstuvwxyz', 'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻ'),
    ...fromPairs('ABDEGHIJKLMNOPRTUVW', 'ᴬᴮᴰᴱᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᴿᵀᵁⱽᵂ'),
    ...fromPairs('βγδθφχ', 'ᵝᵞᵟᶿᵠᵡ'),
};

const SUBSCRIPT: Record<string, string> = {
    ...fromPairs('0123456789+-=()', '₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎'),
    '−': '₋',
    ...fromPairs('aehijklmnoprstuvx', 'ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ'),
    ...fromPairs('βγρφχ', 'ᵦᵧᵨᵩᵪ'),
};

// A raised / lowered piece: real Unicode characters when every character has one, otherwise a readable x^(..) form
const script = (text: string, map: Record<string, string>, marker: '^' | '_'): string => {
    const characters = Array.from(text.trim());
    if (characters.length === 0) return '';
    if (characters.every((character) => map[character] !== undefined)) return characters.map((character) => map[character]).join('');
    return characters.length === 1 ? `${marker}${characters[0]}` : `${marker}(${characters.join('')})`;
};

// A number, or letters (with their raised / lowered parts), needs no brackets. Letters mixed with digits do: "/2a" would
// read as "/2 then a".
const isSimple = (text: string) =>
    /^[\p{L}\p{M}²³¹⁰-₟′']+$/u.test(text) || /^\p{Nd}+([.,]\p{Nd}+)?$/u.test(text);

const fraction = (numerator: string, denominator: string): string => {
    const top = numerator.trim();
    const bottom = denominator.trim();
    const vulgar = VULGAR_FRACTIONS[`${top}/${bottom}`];
    if (vulgar) return vulgar;
    const wrap = (text: string) => (isSimple(text) ? text : `(${text})`);
    return `${wrap(top)}/${wrap(bottom)}`;
};

const radical = (argument: string, index?: string): string => {
    const content = argument.trim();
    const body = /^(\p{N}+|\p{L}\p{M}*)$/u.test(content) ? content : `(${content})`;
    const degree = index?.trim();
    if (!degree || degree === '2') return `√${body}`;
    if (degree === '3') return `∛${body}`;
    if (degree === '4') return `∜${body}`;
    return `${script(degree, SUPERSCRIPT, '^')}√${body}`;
};

const combine = (text: string, mark: string, eachCharacter: boolean): string => {
    const characters = Array.from(text);
    if (characters.length === 0) return '';
    if (eachCharacter) return characters.map((character) => character + mark).join('');
    // One mark goes on a single letter; for several characters it goes on the last one
    return text + mark;
};

const ENVIRONMENT_BRACKETS: Record<string, [string, string]> = {
    pmatrix: ['(', ')'], bmatrix: ['[', ']'], Bmatrix: ['{', '}'], vmatrix: ['|', '|'], Vmatrix: ['‖', '‖'],
    matrix: ['', ''], cases: ['{', '}'], array: ['', ''], aligned: ['', ''], align: ['', ''],
};

export const latexToUnicode = (latex: string): string => convert(latex).replace(/ {2,}/g, ' ').replace(/ ([_^]\()/g, '$1').trim();

function convert(source: string): string {
    let position = 0;

    const skipSpaces = () => {
        while (position < source.length && /\s/.test(source[position])) position++;
    };

    // At the character after a backslash: a command name (letters) or a single other character such as `,` or `{`
    const readCommandName = (): string => {
        const start = position;
        if (/[A-Za-z]/.test(source[position] ?? '')) {
            while (/[A-Za-z]/.test(source[position] ?? '')) position++;
            const name = source.slice(start, position);
            // Spaces after a command name only end the name
            skipSpaces();
            return name;
        }
        position++;
        return source.slice(start, position);
    };

    // One argument: a {group}, a \command or a single character
    const readArgument = (): string => {
        skipSpaces();
        if (position >= source.length) return '';
        if (source[position] === '{') {
            position++;
            return parseSequence(true);
        }
        if (source[position] === '\\') {
            position++;
            return runCommand(readCommandName());
        }
        return source[position++];
    };

    // An optional [argument], as in \sqrt[3]{x}
    const readOptionalArgument = (): string | undefined => {
        skipSpaces();
        if (source[position] !== '[') return undefined;
        const end = source.indexOf(']', position);
        if (end < 0) return undefined;
        const raw = source.slice(position + 1, end);
        position = end + 1;
        return convert(raw);
    };

    const readEnvironment = (): string => {
        skipSpaces();
        const nameEnd = source.indexOf('}', position);
        if (source[position] !== '{' || nameEnd < 0) return '';
        const name = source.slice(position + 1, nameEnd);
        position = nameEnd + 1;

        const endToken = `\\end{${name}}`;
        const endIndex = source.indexOf(endToken, position);
        const body = endIndex < 0 ? source.slice(position) : source.slice(position, endIndex);
        position = endIndex < 0 ? source.length : endIndex + endToken.length;

        const rows = body.split('\\\\').map((row) => row.trim()).filter(Boolean)
            .map((row) => row.split('&').map((cell) => convert(cell).trim()).join(', '));
        const [open, close] = ENVIRONMENT_BRACKETS[name] ?? ['', ''];
        return `${open}${rows.join('; ')}${close}`;
    };

    // `\left(` / `\right)`: only the bracket is written; `\right.` is an invisible one
    const readDelimiter = (): string => {
        skipSpaces();
        if (source[position] === '.') {
            position++;
            return '';
        }
        if (source[position] === '\\') {
            position++;
            return runCommand(readCommandName());
        }
        return source[position++] ?? '';
    };

    function runCommand(name: string): string {
        if (GREEK[name]) return GREEK[name];
        if (SYMBOLS[name]) return SYMBOLS[name];
        if (name in ESCAPED) return ESCAPED[name];
        if (FUNCTION_NAMES.has(name)) return `${name} `;
        if (IGNORED.has(name)) return '';
        if (COMBINING[name]) return combine(readArgument(), COMBINING[name], false);

        switch (name) {
            case 'frac':
            case 'tfrac':
            case 'dfrac':
                return fraction(readArgument(), readArgument());
            case 'binom':
                return `C(${readArgument().trim()}, ${readArgument().trim()})`;
            case 'sqrt': {
                const index = readOptionalArgument();
                return radical(readArgument(), index);
            }
            case 'left':
            case 'right':
                return readDelimiter();
            case 'mathbb': {
                const letter = readArgument().trim();
                return BLACKBOARD[letter] ?? letter;
            }
            case 'overline':
                return combine(readArgument(), '̅', true);
            case 'underline':
                return combine(readArgument(), '̲', true);
            case 'overbrace':
            case 'underbrace':
                // The ^ / _ that follows is written by the caller like any other script
                return readArgument();
            case 'overset':
            case 'stackrel': {
                const above = readArgument();
                return readArgument() + script(above, SUPERSCRIPT, '^');
            }
            case 'underset': {
                const below = readArgument();
                return readArgument() + script(below, SUBSCRIPT, '_');
            }
            case 'xrightarrow':
            case 'xleftarrow': {
                readOptionalArgument();
                return (name === 'xrightarrow' ? '→' : '←') + script(readArgument(), SUPERSCRIPT, '^');
            }
            case 'quad':
            case 'qquad':
                return ' ';
            case 'begin':
                return readEnvironment();
            case 'end':
                readArgument();
                return '';
            default:
                if (PLAIN_WRAPPERS.has(name)) return readArgument();
                // Unknown command: its name is the best plain form
                return name;
        }
    }

    function parseSequence(untilClosingBrace: boolean): string {
        let output = '';
        while (position < source.length) {
            const character = source[position];
            if (character === '}') {
                position++;
                if (untilClosingBrace) return output;
                continue;
            }
            if (character === '{') {
                position++;
                output += parseSequence(true);
            } else if (character === '\\') {
                position++;
                output += runCommand(readCommandName());
            } else if (character === '^' || character === '_') {
                position++;
                // "sin ⁻¹": the space a function name leaves behind goes, so the script sits against it
                output = output.replace(/ +$/, '') + (character === '^'
                    ? script(readArgument(), SUPERSCRIPT, '^')
                    : script(readArgument(), SUBSCRIPT, '_'));
            } else if (/\s/.test(character) || character === '~') {
                position++;
                output += ' ';
            } else {
                output += character;
                position++;
            }
        }
        return output;
    }

    return parseSequence(false);
}
