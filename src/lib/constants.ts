/**
 * Shared constants used across the app.
 */

import type { Category } from "./types";

/** Milliseconds in one day. */
export const ONE_DAY = 86400000;

/** Human-readable labels for each animal-product category. */
export const CATEGORY_LABELS: Record<Category, string> = {
  "red-meat": "Red meat",
  pork: "Pork",
  poultry: "Poultry",
  "fish-seafood": "Fish & seafood",
  eggs: "Eggs",
  dairy: "Dairy",
  other: "Plant-based",
};

/** Tailwind background-color classes for each category (charts/bars). */
export const CATEGORY_COLORS: Record<string, string> = {
  "red-meat": "bg-red-500",
  pork: "bg-pink-400",
  poultry: "bg-orange-400",
  "fish-seafood": "bg-blue-400",
  eggs: "bg-yellow-400",
  dairy: "bg-sky-300",
};
