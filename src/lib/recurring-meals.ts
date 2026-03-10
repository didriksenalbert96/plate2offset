/**
 * Recurring Meals — surfaces frequent past meals for one-tap re-logging.
 *
 * Analyzes meal history to find commonly repeated ingredient combinations
 * and offers them as quick-log options.
 */

import type { MealItem } from "./types";
import { getHistory, type MealEntry } from "./meal-history";

export interface RecurringMeal {
  /** Display name (derived from main animal product items) */
  label: string;
  /** The full ingredient list to re-use */
  items: MealItem[];
  /** How many times this combination appeared */
  count: number;
  /** Most recent occurrence timestamp */
  lastUsed: number;
  /** The offset in cents from the original meal */
  offsetCents: number;
}

/**
 * Generate a fingerprint for a meal based on its animal product items.
 * Plant-based items are excluded since they don't affect the offset.
 */
function mealFingerprint(items: MealItem[]): string {
  return items
    .filter((i) => i.category !== "other")
    .map((i) => `${i.name.toLowerCase().trim()}|${i.category}`)
    .sort()
    .join(";");
}

/**
 * Get up to `limit` recent/frequent meals that the user can re-log with one tap.
 * Prioritizes frequency first, then recency.
 */
export function getRecurringMeals(limit = 3): RecurringMeal[] {
  const history = getHistory();
  if (history.length < 2) return []; // Need at least 2 meals to show recurrences

  // Group by fingerprint
  const groups = new Map<
    string,
    { entries: MealEntry[]; label: string }
  >();

  for (const entry of history) {
    const fp = mealFingerprint(entry.items);
    if (!fp) continue; // Skip all-plant meals

    if (!groups.has(fp)) {
      // Build label from animal product names
      const animalNames = entry.items
        .filter((i) => i.category !== "other")
        .map((i) => i.name)
        .slice(0, 3);
      const label =
        animalNames.length > 2
          ? `${animalNames.slice(0, 2).join(", ")} +${animalNames.length - 2} more`
          : animalNames.join(", ");
      groups.set(fp, { entries: [], label });
    }
    groups.get(fp)!.entries.push(entry);
  }

  // Convert to RecurringMeal, filter to those with 2+ occurrences, sort by count then recency
  const recurring: RecurringMeal[] = [];
  for (const [, { entries, label }] of groups) {
    if (entries.length < 2) continue;
    const latest = entries[0]; // history is already sorted newest-first
    recurring.push({
      label,
      items: latest.items,
      count: entries.length,
      lastUsed: latest.timestamp,
      offsetCents: latest.offsetCents,
    });
  }

  return recurring
    .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
    .slice(0, limit);
}

/**
 * Get the most recent meal (for "Same as last meal" feature).
 */
export function getLastMeal(): RecurringMeal | null {
  const history = getHistory();
  if (history.length === 0) return null;

  const latest = history[0];
  const animalNames = latest.items
    .filter((i) => i.category !== "other")
    .map((i) => i.name);
  if (animalNames.length === 0) return null;

  return {
    label:
      animalNames.length > 2
        ? `${animalNames.slice(0, 2).join(", ")} +${animalNames.length - 2} more`
        : animalNames.join(", "),
    items: latest.items,
    count: 1,
    lastUsed: latest.timestamp,
    offsetCents: latest.offsetCents,
  };
}
