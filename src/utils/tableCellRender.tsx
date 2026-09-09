import React from "react";
import { Tooltip } from "antd";
import type { TooltipProps } from "antd";

const DEFAULT_MAX_LENGTH = 30;

// On smaller screens the character cap keeps text short enough that a table column never needs
// to grow wide enough to trigger horizontal scroll. On larger screens there's enough spare
// column width that the cap can relax (or drop entirely) without causing that overflow. Applies
// as the default for every `renderTruncatedCellWithTooltip` call that doesn't pass its own `maxLength`.
const RESPONSIVE_MAX_LENGTH_BREAKPOINTS: { minWidth: number; maxLength: number }[] = [
  { minWidth: 2560, maxLength: Infinity },
  { minWidth: 1920, maxLength: 65 },
  { minWidth: 1700, maxLength: 55 },
  { minWidth: 1600, maxLength: 40 },
];

export function getResponsiveMaxLength(): number {
  const width = typeof window !== "undefined" ? window.innerWidth : 0;
  const match = RESPONSIVE_MAX_LENGTH_BREAKPOINTS.find((bp) => width >= bp.minWidth);
  return match ? match.maxLength : DEFAULT_MAX_LENGTH;
}

export type RenderTruncatedCellOptions = {
  maxLength?: number;
  tooltipPlacement?: TooltipProps["placement"];
  /** Applied to the inner span that wraps the visible (possibly truncated) text */
  className?: string;
  /** Shown when the value is null/undefined/empty after string coercion */
  emptyDisplay?: string;
  /** Browser `title` tooltip instead of Ant Design `Tooltip` */
  useNativeTitle?: boolean;
  /** Test ID for component testing */
  testId?: string;
  /** Shown in the tooltip instead of the full (untruncated) `value` */
  tooltipValue?: unknown;
  /** Show the tooltip even when the display text isn't truncated (e.g. `tooltipValue` differs from `value`) */
  forceTooltip?: boolean;
};

/**
 * Truncates a cell value with an ellipsis. Use for plain string columns or as the display half of {@link renderTruncatedCellWithTooltip}.
 */
export function truncateTableCellText(
  value: unknown,
  maxLength: number = DEFAULT_MAX_LENGTH
): string {
  const text = String(value ?? "");
  if (!text) {
    return "";
  }
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Renders truncated text with a full-value tooltip when the text exceeds `maxLength`. Also
 * applies a CSS ellipsis (`.table-cell-ellipsis`) as a second layer, so a column that's
 * narrower than `maxLength` characters still clips cleanly instead of wrapping/overflowing.
 */
export function renderTruncatedCellWithTooltip(
  value: unknown,
  options?: RenderTruncatedCellOptions
): React.ReactNode {
  const maxLength = options?.maxLength ?? getResponsiveMaxLength();
  const full = String(value ?? "");
  const truncated = truncateTableCellText(full, maxLength);
  const display = truncated || (options?.emptyDisplay ?? "");
  const {
    className,
    tooltipPlacement = "topLeft",
    useNativeTitle,
    testId,
    tooltipValue,
    forceTooltip,
  } = options ?? {};

  const tooltipText = tooltipValue !== undefined ? String(tooltipValue ?? "") : full;
  const isTruncated = full.length > maxLength;
  const showTooltip = isTruncated || Boolean(forceTooltip);
  const cellClassName = ["table-cell-ellipsis", className].filter(Boolean).join(" ");

  if (!showTooltip) {
    return (
      <span className={cellClassName} data-testid={testId}>{display}</span>
    );
  }

  if (useNativeTitle) {
    return (
      <span className={cellClassName} title={tooltipText} data-testid={testId}>
        {display}
      </span>
    );
  }

  return (
    <Tooltip title={tooltipText} placement={tooltipPlacement}>
      <span className={cellClassName} data-testid={testId}>{display}</span>
    </Tooltip>
  );
}
