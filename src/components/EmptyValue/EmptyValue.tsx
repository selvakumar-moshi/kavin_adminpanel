export const EMPTY_VALUE_TEXT = '-';

export const isEmptyValue = (value: unknown): boolean =>
    value === null || value === undefined || String(value).trim() === '';

export interface EmptyValueProps {
    value?: unknown;
    /** Shown when `value` is missing; defaults to EMPTY_VALUE_TEXT */
    fallback?: string;
    className?: string;
}

// Renders `value`, or the shared "no value" text when there isn't one
const EmptyValue = ({ value, fallback = EMPTY_VALUE_TEXT, className }: EmptyValueProps) => (
    <span className={className}>{isEmptyValue(value) ? fallback : String(value)}</span>
);

export default EmptyValue;
