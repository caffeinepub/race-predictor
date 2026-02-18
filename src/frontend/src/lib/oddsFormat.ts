/**
 * Formats a numeric odds value as a fractional string in the format "X/1"
 * @param odds - The numeric odds value (numerator)
 * @returns Formatted fractional odds string (e.g., "5/1", "29/1")
 */
export function formatOdds(odds: number): string {
    return `${odds}/1`;
}

/**
 * Formats odds for display with a placeholder when empty
 * @param odds - The numeric odds value (numerator), or 0 if empty
 * @returns Formatted fractional odds string or "-/1" for empty
 */
export function formatOddsWithPlaceholder(odds: number): string {
    return odds > 0 ? formatOdds(odds) : '-/1';
}
