/**
 * Shared types for Plate2Offset.
 *
 * These define the "shape" of data flowing through the app:
 *   1. User uploads a photo or types a description
 *   2. AI returns a list of MealItems (ingredients with categories and amounts)
 *   3. User confirms/edits the list
 *   4. App calculates a suggested donation from the confirmed items
 */

/** Broad category for each ingredient — used to look up offset coefficients. */
export type Category =
  | "red-meat"      // beef, lamb, goat
  | "poultry"       // chicken, turkey, duck
  | "pork"
  | "fish-seafood"
  | "dairy"         // milk, cheese, butter, cream
  | "eggs"
  | "other"         // plant-based, unknown, or not applicable
  ;

/** Unit of measurement for an ingredient amount. */
export type Unit = "g" | "oz" | "ml" | "cups" | "pieces" | "servings";

/** A single ingredient identified by the AI (or edited by the user). */
export interface MealItem {
  /** Human-readable name, e.g. "cheddar cheese" */
  name: string;

  /** Which animal-product category this falls into */
  category: Category;

  /** Estimated amount */
  amount: number;

  /** Unit for the amount */
  unit: Unit;

  /** How confident the AI is (0–1). Below a threshold we show "unknown". */
  confidence: number;
}

/** The JSON shape returned by the Claude API call. */
export interface AnalyzeResponse {
  /** List of identified ingredients */
  items: MealItem[];

  /** Optional note from the AI when something is unclear */
  note?: string;
}
