/**
 * Calculates a suggested donation amount from a list of confirmed ingredients.
 *
 * How it works:
 *   1. For each ingredient, convert amount to grams (if needed)
 *   2. Multiply grams × cents-per-gram for that category
 *   3. Add them all up
 *   4. Round to the nearest $0.50 (minimum $0.50)
 *
 * Returns the donation amount in dollars (e.g. 2.50).
 */

import type { MealItem } from "./types";
import { CENTS_PER_GRAM } from "./coefficients";

/** Rough conversion factors to grams. */
function toGrams(amount: number, unit: string): number {
  switch (unit) {
    case "g":
      return amount;
    case "oz":
      return amount * 28.35;
    case "ml":
      return amount; // approximate: 1ml ≈ 1g for most foods
    case "cups":
      return amount * 240;
    case "pieces":
      return amount * 50; // rough estimate: 1 egg ≈ 50g
    case "servings":
      return amount * 100; // rough estimate
    default:
      return amount;
  }
}

/** Returns the dollar contribution of a single item (before rounding). */
export function itemContribution(item: MealItem): number {
  const grams = toGrams(item.amount, item.unit);
  const rate = CENTS_PER_GRAM[item.category] ?? 0;
  return (grams * rate) / 100;
}

export function calculateOffset(items: MealItem[]): number {
  let totalCents = 0;

  for (const item of items) {
    const grams = toGrams(item.amount, item.unit);
    const rate = CENTS_PER_GRAM[item.category] ?? 0;
    totalCents += grams * rate;
  }

  // Convert cents to dollars, round to nearest cent
  const dollars = Math.round(totalCents) / 100;
  return dollars;
}
