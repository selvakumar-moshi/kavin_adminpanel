// Capitalises the first letter of every word and leaves the rest as typed ("test folder_01" -> "Test Folder_01").
// For names put into a plain-text message, where CSS can't style just the name.
export const toTitleCase = (value: string | null | undefined): string =>
    (value ?? '').replace(/(^|\s)(\S)/g, (_match, space: string, char: string) => `${space}${char.toUpperCase()}`);
