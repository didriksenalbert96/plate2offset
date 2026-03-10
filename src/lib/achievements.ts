/**
 * Achievements — expanded badge/achievement system.
 *
 * Checks meal history and streak data against achievement thresholds.
 * Tracks which achievements are newly unlocked (for toast notifications).
 */

import type { MealEntry } from "./meal-history";
import type { Category } from "./types";

const SEEN_KEY = "plate2offset_achievements_seen";

export interface Achievement {
  key: string;
  icon: string;
  label: string;
  description: string;
  earned: boolean;
  category: "volume" | "streak" | "offset" | "diversity" | "challenge";
}

interface AchievementInput {
  totalMeals: number;
  currentStreak: number;
  longestStreak: number;
  totalCents: number;
  entries: MealEntry[];
  challengeCompleted: boolean;
}

/**
 * Get all achievements with their earned status.
 */
export function getAchievements(input: AchievementInput): Achievement[] {
  const { totalMeals, longestStreak, totalCents, entries, challengeCompleted } = input;

  // Unique categories logged
  const categories = new Set<Category>();
  for (const entry of entries) {
    for (const item of entry.items) {
      if (item.category !== "other") categories.add(item.category);
    }
  }

  // Check if user has logged at least 1 meal every day of a calendar month
  const monthlyConsistency = checkMonthlyConsistency(entries);

  return [
    // Volume
    { key: "meal-1", icon: "1", label: "First meal", description: "Log your first meal", earned: totalMeals >= 1, category: "volume" },
    { key: "meal-10", icon: "10", label: "Getting started", description: "Log 10 meals", earned: totalMeals >= 10, category: "volume" },
    { key: "meal-50", icon: "50", label: "Committed", description: "Log 50 meals", earned: totalMeals >= 50, category: "volume" },
    { key: "meal-100", icon: "100", label: "Century", description: "Log 100 meals", earned: totalMeals >= 100, category: "volume" },
    { key: "meal-250", icon: "250", label: "Dedicated", description: "Log 250 meals", earned: totalMeals >= 250, category: "volume" },
    { key: "meal-500", icon: "500", label: "Legend", description: "Log 500 meals", earned: totalMeals >= 500, category: "volume" },

    // Streaks
    { key: "streak-3", icon: "3d", label: "Hattrick", description: "3-day streak", earned: longestStreak >= 3, category: "streak" },
    { key: "streak-7", icon: "7d", label: "Full week", description: "7-day streak", earned: longestStreak >= 7, category: "streak" },
    { key: "streak-14", icon: "14d", label: "Fortnight", description: "14-day streak", earned: longestStreak >= 14, category: "streak" },
    { key: "streak-30", icon: "30d", label: "Monthly hero", description: "30-day streak", earned: longestStreak >= 30, category: "streak" },
    { key: "streak-60", icon: "60d", label: "Iron will", description: "60-day streak", earned: longestStreak >= 60, category: "streak" },
    { key: "streak-90", icon: "90d", label: "Unstoppable", description: "90-day streak", earned: longestStreak >= 90, category: "streak" },

    // Offset amounts
    { key: "offset-1", icon: "$1", label: "First dollar", description: "Offset $1 total", earned: totalCents >= 100, category: "offset" },
    { key: "offset-5", icon: "$5", label: "High five", description: "Offset $5 total", earned: totalCents >= 500, category: "offset" },
    { key: "offset-10", icon: "$10", label: "Ten spot", description: "Offset $10 total", earned: totalCents >= 1000, category: "offset" },
    { key: "offset-25", icon: "$25", label: "Quarter century", description: "Offset $25 total", earned: totalCents >= 2500, category: "offset" },
    { key: "offset-50", icon: "$50", label: "Half century", description: "Offset $50 total", earned: totalCents >= 5000, category: "offset" },
    { key: "offset-100", icon: "$100", label: "Centurion", description: "Offset $100 total", earned: totalCents >= 10000, category: "offset" },

    // Diversity
    { key: "cat-3", icon: "3c", label: "Explorer", description: "Log 3 different categories", earned: categories.size >= 3, category: "diversity" },
    { key: "cat-all", icon: "6c", label: "Completionist", description: "Log all 6 categories", earned: categories.size >= 6, category: "diversity" },

    // Challenge & consistency
    { key: "challenge-done", icon: "30", label: "Challenger", description: "Complete a 30-day challenge", earned: challengeCompleted, category: "challenge" },
    { key: "monthly", icon: "Mo", label: "Full month", description: "Log every day of a calendar month", earned: monthlyConsistency, category: "challenge" },
  ];
}

/**
 * Get achievements that were earned but not yet seen (for toast notifications).
 */
export function getNewAchievements(achievements: Achievement[]): Achievement[] {
  const seen = getSeenAchievements();
  return achievements.filter((a) => a.earned && !seen.has(a.key));
}

/**
 * Mark achievements as seen (so toast doesn't show again).
 */
export function markAchievementsSeen(keys: string[]): void {
  const seen = getSeenAchievements();
  for (const key of keys) seen.add(key);
  if (typeof window !== "undefined") {
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen)));
  }
}

function getSeenAchievements(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

/**
 * Check if user has logged at least 1 meal every day of any calendar month.
 */
function checkMonthlyConsistency(entries: MealEntry[]): boolean {
  if (entries.length < 28) return false;

  const daysByMonth = new Map<string, Set<number>>();
  for (const entry of entries) {
    const d = new Date(entry.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!daysByMonth.has(key)) daysByMonth.set(key, new Set());
    daysByMonth.get(key)!.add(d.getDate());
  }

  for (const [key, days] of daysByMonth) {
    const [year, month] = key.split("-").map(Number);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    if (days.size >= daysInMonth) return true;
  }

  return false;
}
