/**
 * Analytics — aggregation functions for meal history data.
 *
 * Provides weekly/monthly/daily totals, category trends, and annual summaries.
 * All functions are pure and work on MealEntry arrays (from localStorage or Supabase).
 */

import type { MealEntry, CategoryBreakdown } from "./meal-history";
import { getCategoryBreakdown } from "./meal-history";
import type { Category } from "./types";

export interface PeriodTotal {
  /** Period label, e.g. "Mar 3" or "Feb 2026" */
  label: string;
  /** Start of period as ms timestamp */
  start: number;
  /** Total offset cents in this period */
  totalCents: number;
  /** Number of meals in this period */
  mealCount: number;
}

export interface AnnualSummary {
  year: number;
  totalMeals: number;
  totalCents: number;
  avgCentsPerMeal: number;
  topCategories: CategoryBreakdown[];
  bestMonth: { label: string; mealCount: number } | null;
  longestStreak: number;
  totalDays: number;
}

const ONE_DAY = 86400000;

/** Get the start of day (local timezone) for a timestamp. */
function dayStart(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Get the start of week (Monday) for a timestamp. */
function weekStart(ts: number): number {
  const d = new Date(ts);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff).getTime();
}

/** Get the start of month for a timestamp. */
function monthStart(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

/**
 * Get weekly totals for the last N weeks.
 */
export function getWeeklyTotals(entries: MealEntry[], weeks = 12): PeriodTotal[] {
  const now = Date.now();
  const currentWeekStart = weekStart(now);
  const cutoff = currentWeekStart - (weeks - 1) * 7 * ONE_DAY;

  // Initialize all weeks
  const weekMap = new Map<number, PeriodTotal>();
  for (let i = 0; i < weeks; i++) {
    const start = currentWeekStart - i * 7 * ONE_DAY;
    const d = new Date(start);
    weekMap.set(start, {
      label: `${d.toLocaleDateString("en-US", { month: "short" })} ${d.getDate()}`,
      start,
      totalCents: 0,
      mealCount: 0,
    });
  }

  // Fill in data
  for (const entry of entries) {
    if (entry.timestamp < cutoff) continue;
    const ws = weekStart(entry.timestamp);
    const week = weekMap.get(ws);
    if (week) {
      week.totalCents += entry.offsetCents;
      week.mealCount += 1;
    }
  }

  return Array.from(weekMap.values()).sort((a, b) => a.start - b.start);
}

/**
 * Get monthly totals for the last N months.
 */
export function getMonthlyTotals(entries: MealEntry[], months = 12): PeriodTotal[] {
  const now = new Date();

  // Initialize all months
  const monthMap = new Map<number, PeriodTotal>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.getTime();
    monthMap.set(start, {
      label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      start,
      totalCents: 0,
      mealCount: 0,
    });
  }

  // Fill in data
  for (const entry of entries) {
    const ms = monthStart(entry.timestamp);
    const month = monthMap.get(ms);
    if (month) {
      month.totalCents += entry.offsetCents;
      month.mealCount += 1;
    }
  }

  return Array.from(monthMap.values()).sort((a, b) => a.start - b.start);
}

/**
 * Get daily totals for the last N days.
 */
export function getDailyTotals(entries: MealEntry[], days = 30): PeriodTotal[] {
  const todayStart = dayStart(Date.now());
  const cutoff = todayStart - (days - 1) * ONE_DAY;

  const dayMap = new Map<number, PeriodTotal>();
  for (let i = 0; i < days; i++) {
    const start = todayStart - i * ONE_DAY;
    const d = new Date(start);
    dayMap.set(start, {
      label: d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
      start,
      totalCents: 0,
      mealCount: 0,
    });
  }

  for (const entry of entries) {
    if (entry.timestamp < cutoff) continue;
    const ds = dayStart(entry.timestamp);
    const day = dayMap.get(ds);
    if (day) {
      day.totalCents += entry.offsetCents;
      day.mealCount += 1;
    }
  }

  return Array.from(dayMap.values()).sort((a, b) => a.start - b.start);
}

/**
 * Get category trend — how a specific category's share changes over time.
 */
export function getCategoryTrend(
  entries: MealEntry[],
  months = 6
): { label: string; categories: Record<string, number> }[] {
  const now = new Date();
  const result: { label: string; categories: Record<string, number> }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthEntries = entries.filter(
      (e) => e.timestamp >= d.getTime() && e.timestamp < nextMonth.getTime()
    );

    const breakdown = getCategoryBreakdown(monthEntries);
    const categories: Record<string, number> = {};
    for (const b of breakdown) {
      categories[b.category] = b.totalCents;
    }

    result.push({
      label: d.toLocaleDateString("en-US", { month: "short" }),
      categories,
    });
  }

  return result;
}

/**
 * Generate an annual summary for a given year (or the current year).
 */
export function getAnnualSummary(entries: MealEntry[], year?: number): AnnualSummary | null {
  const targetYear = year ?? new Date().getFullYear();
  const yearEntries = entries.filter((e) => {
    const d = new Date(e.timestamp);
    return d.getFullYear() === targetYear;
  });

  if (yearEntries.length === 0) return null;

  const totalCents = yearEntries.reduce((s, e) => s + e.offsetCents, 0);
  const topCategories = getCategoryBreakdown(yearEntries).slice(0, 3);

  // Find best month
  const monthCounts = new Map<string, { label: string; count: number }>();
  for (const entry of yearEntries) {
    const d = new Date(entry.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString("en-US", { month: "long" });
    const existing = monthCounts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      monthCounts.set(key, { label, count: 1 });
    }
  }
  const bestMonth = Array.from(monthCounts.values()).sort((a, b) => b.count - a.count)[0] ?? null;

  // Count unique days
  const daySet = new Set<string>();
  for (const entry of yearEntries) {
    const d = new Date(entry.timestamp);
    daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }

  // Longest streak within the year
  const days = Array.from(daySet)
    .map((key) => {
      const [y, m, d] = key.split("-").map(Number);
      return new Date(y, m, d).getTime();
    })
    .sort((a, b) => a - b);

  let longestStreak = days.length > 0 ? 1 : 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] - days[i - 1] === ONE_DAY) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 1;
    }
  }

  return {
    year: targetYear,
    totalMeals: yearEntries.length,
    totalCents,
    avgCentsPerMeal: Math.round(totalCents / yearEntries.length),
    topCategories,
    bestMonth: bestMonth ? { label: bestMonth.label, mealCount: bestMonth.count } : null,
    longestStreak,
    totalDays: daySet.size,
  };
}

/**
 * Calculate the "average per meal" stat over time to show improvement.
 */
export function getAvgOffsetPerMeal(entries: MealEntry[]): number {
  if (entries.length === 0) return 0;
  const total = entries.reduce((s, e) => s + e.offsetCents, 0);
  return Math.round(total / entries.length);
}

/**
 * Get the all-time category list present in entries (for consistent chart colors).
 */
export function getAllCategories(entries: MealEntry[]): Category[] {
  const cats = new Set<Category>();
  for (const entry of entries) {
    for (const item of entry.items) {
      if (item.category !== "other") cats.add(item.category);
    }
  }
  return Array.from(cats);
}
