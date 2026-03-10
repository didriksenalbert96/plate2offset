/**
 * Data Layer — unified data access that delegates to localStorage or Supabase.
 *
 * Strategy: localStorage is always the fast path (sync, offline-first).
 * When the user is authenticated, writes are also pushed to Supabase
 * in the background via syncToSupabase(). On load, authenticated users
 * pull from Supabase to hydrate localStorage (Supabase is source of truth).
 *
 * All page-level imports should use this module instead of importing
 * individual localStorage modules directly.
 */

// ── Meal History ────────────────────────────────────────────
export {
  getHistory,
  addMeal,
  deleteMeal,
  clearHistory,
  getCategoryBreakdown,
  getStreakInfo,
  groupByDate,
  exportToCsv,
  type MealEntry,
  type CategoryBreakdown,
  type StreakInfo,
} from "./meal-history";

// ── Offset Jar ──────────────────────────────────────────────
export {
  getJar,
  addToJar,
  clearJar,
  setMealsPerDay,
  estimateYearlyOffset,
  type JarState,
} from "./offset-jar";

// ── Donation Settings ───────────────────────────────────────
export {
  getDonationSettings,
  setAutoThreshold,
  setSubscriptionMode,
  THRESHOLD_OPTIONS,
  type DonationSettings,
} from "./donation-settings";

// ── Challenge ───────────────────────────────────────────────
export {
  startChallenge,
  stopChallenge,
  getChallengeProgress,
  type ChallengeState,
  type ChallengeProgress,
} from "./challenge";

// ── Offline Queue ───────────────────────────────────────────
export {
  getQueue,
  enqueue,
  dequeue,
  isOnline,
  type QueuedMeal,
} from "./offline-queue";

// ── Recurring Meals ─────────────────────────────────────────
export {
  getRecurringMeals,
  getLastMeal,
  type RecurringMeal,
} from "./recurring-meals";

// ── Supabase Sync ───────────────────────────────────────────
export { useSync } from "./supabase/sync";
