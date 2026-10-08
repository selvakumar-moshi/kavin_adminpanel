// Case-insensitive text comparison used by the Quiz tables' column sorters
export const compareText = (a?: string | null, b?: string | null) =>
    (a || '').toLowerCase().localeCompare((b || '').toLowerCase());
