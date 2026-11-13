// Table editing for the rich text editor, done directly on the DOM (the browser has no table commands of its own).
// Every helper takes the cell the caret is in and returns the cell the caret should move to (or null).

const EMPTY_CELL_HTML = '<br>';

// A table with a header row; the trailing line gives the caret somewhere to go below the table
export const buildTableHtml = (rows: number, cols: number): string => {
    const row = (tag: 'th' | 'td') => `<tr>${`<${tag}>${EMPTY_CELL_HTML}</${tag}>`.repeat(cols)}</tr>`;
    return `<table><tbody>${row('th')}${row('td').repeat(Math.max(rows - 1, 0))}</tbody></table><div><br></div>`;
};

// The table cell the selection is in, or null when it is outside a table (or outside `editor`)
export const getCurrentCell = (editor: HTMLElement): HTMLTableCellElement | null => {
    const selection = globalThis.getSelection();
    const node = selection?.anchorNode;
    if (!node || !editor.contains(node)) return null;
    const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    const cell = element?.closest('td, th') as HTMLTableCellElement | null;
    return cell && editor.contains(cell) ? cell : null;
};

export const placeCaretIn = (element: Element | null | undefined) => {
    if (!element) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(true);
    const selection = globalThis.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
};

const createCell = (tag: string) => {
    const cell = document.createElement(tag);
    cell.innerHTML = EMPTY_CELL_HTML;
    return cell as HTMLTableCellElement;
};

const tableOf = (cell: HTMLTableCellElement) => cell.closest('table') as HTMLTableElement;
const rowOf = (cell: HTMLTableCellElement) => cell.parentElement as HTMLTableRowElement;

export const addRowBelow = (cell: HTMLTableCellElement): HTMLTableCellElement => {
    const row = rowOf(cell);
    const newRow = document.createElement('tr');
    Array.from(row.cells).forEach(() => newRow.appendChild(createCell('td')));
    row.after(newRow);
    return newRow.cells[Math.min(cell.cellIndex, newRow.cells.length - 1)];
};

export const addColumnRight = (cell: HTMLTableCellElement): HTMLTableCellElement => {
    const index = cell.cellIndex;
    let target = cell;
    Array.from(tableOf(cell).rows).forEach((row) => {
        const reference = row.cells[index];
        const added = createCell(reference ? reference.tagName.toLowerCase() : 'td');
        if (reference) reference.after(added);
        else row.appendChild(added);
        if (row === rowOf(cell)) target = added;
    });
    return target;
};

export const deleteTable = (cell: HTMLTableCellElement): null => {
    tableOf(cell).remove();
    return null;
};

export const deleteRow = (cell: HTMLTableCellElement): HTMLTableCellElement | null => {
    const table = tableOf(cell);
    if (table.rows.length <= 1) return deleteTable(cell);

    const row = rowOf(cell);
    const index = cell.cellIndex;
    const neighbour = (row.nextElementSibling ?? row.previousElementSibling) as HTMLTableRowElement;
    const target = neighbour.cells[Math.min(index, neighbour.cells.length - 1)];
    row.remove();
    return target;
};

export const deleteColumn = (cell: HTMLTableCellElement): HTMLTableCellElement | null => {
    const table = tableOf(cell);
    const index = cell.cellIndex;
    const rowIndex = rowOf(cell).rowIndex;
    Array.from(table.rows).forEach((row) => row.cells[index]?.remove());

    const rowAfter = table.rows[rowIndex];
    if (!rowAfter || rowAfter.cells.length === 0) {
        // That was the last column
        table.remove();
        return null;
    }
    return rowAfter.cells[Math.min(index, rowAfter.cells.length - 1)];
};

// Tab / Shift+Tab: the next / previous cell in reading order, or null at the ends
export const adjacentCell = (cell: HTMLTableCellElement, backwards: boolean): HTMLTableCellElement | null => {
    const cells = Array.from(tableOf(cell).querySelectorAll('td, th')) as HTMLTableCellElement[];
    return cells[cells.indexOf(cell) + (backwards ? -1 : 1)] ?? null;
};
