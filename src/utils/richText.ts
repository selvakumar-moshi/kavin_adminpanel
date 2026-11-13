// Allow-list sanitizer for the rich text (bold / italic / underline / link / line breaks / tables only)
const ALLOWED_TAGS: Record<string, string> = {
    B: 'b',
    STRONG: 'b',
    I: 'i',
    EM: 'i',
    U: 'u',
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

const sanitizeNode = (source: Node, target: Node, doc: Document) => {
    source.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
            target.appendChild(doc.createTextNode(child.textContent || ''));
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

export const richTextToPlain = (html: string): string => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // Cells would otherwise run together ("NameAge"), so each one ends with a space
    doc.querySelectorAll('td, th').forEach((cell) => cell.append(' '));
    return (doc.body.textContent || '').replace(/\xA0/g, ' ');
};

// '' when the editor holds no real content (e.g. just "<br>" left after deleting everything)
export const cleanRichTextValue = (html: string): string => {
    const sanitized = sanitizeRichText(html);
    // A table counts as content even while all of its cells are still empty
    return richTextToPlain(sanitized).trim() || sanitized.includes('<table') ? sanitized : '';
};
