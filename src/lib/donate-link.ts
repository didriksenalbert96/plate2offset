/**
 * Builds a donate link for FarmKind on Every.org.
 *
 * Every.org supports URL parameters:
 *   - amount: pre-filled dollar amount
 *   - frequency: "ONCE" or "MONTHLY"
 *   - #donate anchor scrolls straight to the donate widget
 */

export function buildDonateLink(amount: number, frequency: "ONCE" | "MONTHLY" = "ONCE"): string {
  return `https://www.every.org/farmkind?amount=${amount}&frequency=${frequency}#donate`;
}
