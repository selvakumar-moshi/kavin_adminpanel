// Allow-list sanitizer for the rich text (bold / italic / underline / link / line breaks / tables only)
const ALLOWED_TAGS: Record<string, string> = {
    B: 'b',
    STRONG: 'b',
    I: 'i',
    EM: 'i',
    U: 'u',
    SUP: 'sup',
    SUB: 'sub',
    A: 'a',
    BR: 'br',
    DIV: 'div',
    P: 'div',
    TABLE: 'table',
    THEAD: 'thead',
    TBODY: 'tbody',
    TFOOT: 'tfoot',
    TR: 'tr',
    TH: 'th',
    TD: 'td',
};

const SAFE_URL = /^(https?:\/\/|mailto:)/i;

export const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (SAFE_URL.test(trimmed)) return trimmed;
    // "www.example.com" / "example.com" -> https://...; anything with another scheme (javascript:, data:) is rejected
    return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? '' : `https://${trimmed}`;
};

const TABLE_STRUCTURE_TAGS = ['TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR'];

// Merged cells (rowspan / colspan) are kept when they hold a sensible number
const readSpan = (element: HTMLElement, attribute: 'colspan' | 'rowspan'): string => {
    const span = Number.parseInt(element.getAttribute(attribute) || '', 10);
    return span > 1 && span <= 50 ? String(span) : '';
};

const sanitizeNode = (source: Node, target: Node, doc: Document) => {
    const sourceElement = source.nodeType === Node.ELEMENT_NODE ? (source as Element) : null;
    // Pasted tables (e.g. from Word) carry the source's indentation as text between their tags and line breaks inside cells
    const isTableStructure = Boolean(sourceElement && TABLE_STRUCTURE_TAGS.includes(sourceElement.tagName));
    const isInsideCell = Boolean(sourceElement?.closest('td, th'));

    source.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent || '';
            if (isTableStructure && !text.trim()) return;
            target.appendChild(doc.createTextNode(isInsideCell ? text.replace(/\s+/g, ' ') : text));
            return;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) return;

        const element = child as HTMLElement;
        const tag = ALLOWED_TAGS[element.tagName];
        // Unknown elements (span, font, script ...) are dropped but their text is kept
        if (!tag) {
            if (!['SCRIPT', 'STYLE'].includes(element.tagName)) sanitizeNode(element, target, doc);
            return;
        }

        const clean = doc.createElement(tag);
        if (tag === 'a') {
            const href = normalizeUrl(element.getAttribute('href') || '');
            if (!href) {
                sanitizeNode(element, target, doc);
                return;
            }
            clean.setAttribute('href', href);
            clean.setAttribute('target', '_blank');
            clean.setAttribute('rel', 'noopener noreferrer');
        }
        if (tag === 'td' || tag === 'th') {
            (['colspan', 'rowspan'] as const).forEach((attribute) => {
                const span = readSpan(element, attribute);
                if (span) clean.setAttribute(attribute, span);
            });
        }
        if (tag !== 'br') sanitizeNode(element, clean, doc);
        target.appendChild(clean);
    });
};

export const sanitizeRichText = (html: string): string => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const container = doc.createElement('div');
    sanitizeNode(doc.body, container, doc);
    return container.innerHTML;
};

const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ';
const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎';
const NORMAL_CHARACTERS = '0123456789+-=()ni';

// Characters without a Unicode form are left as they are
const mapCharacters = (text: string, mapped: string): string =>
    Array.from(text).map((character) => {
        const index = NORMAL_CHARACTERS.indexOf(character);
        return index >= 0 && index < mapped.length ? mapped[index] : character;
    }).join('');

export const richTextToPlain = (html: string): string => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // Cells would otherwise run together ("NameAge"), so each one ends with a space
    doc.querySelectorAll('td, th').forEach((cell) => cell.append(' '));
    // Without styling "10<sup>10</sup>" would read "1010", so powers and indices become their Unicode forms (10¹⁰)
    doc.querySelectorAll('sup').forEach((element) => { element.textContent = mapCharacters(element.textContent || '', SUPERSCRIPTS); });
    doc.querySelectorAll('sub').forEach((element) => { element.textContent = mapCharacters(element.textContent || '', SUBSCRIPTS); });
    return (doc.body.textContent || '').replace(/\xA0/g, ' ');
};

// '' when the editor holds no real content (e.g. just "<br>" left after deleting everything)
export const cleanRichTextValue = (html: string): string => {
    const sanitized = sanitizeRichText(html);
    // A table counts as content even while all of its cells are still empty
    return richTextToPlain(sanitized).trim() || sanitized.includes('<table') ? sanitized : '';
};
