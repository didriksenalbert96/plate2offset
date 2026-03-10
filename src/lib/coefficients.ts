/**
 * Offset coefficients — how many cents (USD) per gram of each category.
 *
 * These are rough starting estimates. The "Decisions to make later" section
 * in PLAN.md tracks calibration work for these numbers.
 *
 * The idea: red meat has the highest animal welfare impact per gram,
 * so it has the highest offset rate. Plant-based ("other") is zero.
 */

import type { Category } from "./types";

/** Cents per gram for each animal-product category. */
export const CENTS_PER_GRAM: Record<Category, number> = {
  "red-meat": 0.10,     // highest impact
  "pork": 0.07,
  "poultry": 0.06,
  "fish-seafood": 0.05,
  "eggs": 0.04,
  "dairy": 0.03,
  "other": 0,           // plant-based or unknown — no offset needed
};
