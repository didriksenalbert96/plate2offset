/**
 * Meal History — localStorage-based log of analyzed meals.
 *
 * Stores a list of past meals with their items, offset amount, and timestamp.
 * Privacy-first: no photos or descriptions are stored, only the confirmed
 * ingredient list and calculated offset.
 */

import type { MealItem, Category } from "./types";

const STORAGE_KEY = "plate2offset_history";
const MAX_MEALS = 500; // keep history manageable

export interface MealEntry {
  id: string;
  timestamp: number; // ms since epoch
  items: MealItem[];
  offsetCents: number;
}

export interface CategoryBreakdown {
  category: Category;
  label: string;
  totalCents: number;
  percentage: number;
}

export interface StreakInfo {
  currentStreak: number; // consecutive days with at least one meal
  longestStreak: number;
  totalMeals: number;
  totalDays: number;
}

const CATEGORY_LABELS: Record<Category, string> = {
  "red-meat": "Red meat",
  pork: "Pork",
  poultry: "Poultry",
  "fish-seafood": "Fish & seafood",
  eggs: "Eggs",
  dairy: "Dairy",
  other: "Plant-based",
};

function readHistory(): MealEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: MealEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getHistory(): MealEntry[] {
  return readHistory().sort((a, b) => b.timestamp - a.timestamp);
}

export function addMeal(items: MealItem[], offsetCents: number): MealEntry {
  const entries = readHistory();
  const entry: MealEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    items,
    offsetCents,
  };
  entries.push(entry);
  // Trim to max size (keep newest)
  if (entries.length > MAX_MEALS) {
    entries.splice(0, entries.length - MAX_MEALS);
  }
  writeHistory(entries);
  return entry;
}

export function deleteMeal(id: string): void {
  const entries = readHistory().filter((e) => e.id !== id);
  writeHistory(entries);
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Get category breakdown across all meals (or a filtered subset). */
export function getCategoryBreakdown(entries: MealEntry[]): CategoryBreakdown[] {
  const totals: Partial<Record<Category, number>> = {};

  for (const entry of entries) {
    for (const item of entry.items) {
      if (item.category === "other") continue;
      totals[item.category] = (totals[item.category] ?? 0) +
        itemCentsContribution(item);
    }
  }

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
  if (grandTotal === 0) return [];

  return (Object.entries(totals) as [Category, number][])
    .map(([category, totalCents]) => ({
      category,
      label: CATEGORY_LABELS[category],
      totalCents,
      percentage: Math.round((totalCents / grandTotal) * 100),
    }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

/** Calculate cents contributed by a single item. */
function itemCentsContribution(item: MealItem): number {
  // Import would be circular, so inline the rates
  const RATES: Record<string, number> = {
    "red-meat": 0.10, pork: 0.07, poultry: 0.06,
    "fish-seafood": 0.05, eggs: 0.04, dairy: 0.03, other: 0,
  };
  const grams = toGrams(item.amount, item.unit);
  return grams * (RATES[item.category] ?? 0);
}

function toGrams(amount: number, unit: string): number {
  switch (unit) {
    case "g": return amount;
    case "oz": return amount * 28.35;
    case "ml": return amount;
    case "cups": return amount * 240;
    case "pieces": return amount * 50;
    case "servings": return amount * 100;
    default: return amount;
  }
}

/** Calculate streak info from meal history. */
export function getStreakInfo(entries: MealEntry[]): StreakInfo {
  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalMeals: 0, totalDays: 0 };
  }

  // Get unique days (in local timezone)
  const daySet = new Set<string>();
  for (const entry of entries) {
    const d = new Date(entry.timestamp);
    daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }

  const days = Array.from(daySet)
    .map((key) => {
      const [y, m, d] = key.split("-").map(Number);
      return new Date(y, m, d).getTime();
    })
    .sort((a, b) => b - a); // newest first

  const ONE_DAY = 86400000;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  // Current streak: count consecutive days ending today (or yesterday)
  let currentStreak = 0;
  let checkDate = todayStart;

  // Allow starting from today or yesterday
  if (days[0] === checkDate || days[0] === checkDate - ONE_DAY) {
    checkDate = days[0];
    for (const day of days) {
      if (day === checkDate) {
        currentStreak++;
        checkDate -= ONE_DAY;
      } else if (day < checkDate) {
        break;
      }
    }
  }

  // Longest streak
  let longestStreak = 0;
  let streak = 1;
  const sortedAsc = [...days].sort((a, b) => a - b);
  for (let i = 1; i < sortedAsc.length; i++) {
    if (sortedAsc[i] - sortedAsc[i - 1] === ONE_DAY) {
      streak++;
    } else {
      longestStreak = Math.max(longestStreak, streak);
      streak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, streak);

  return {
    currentStreak,
    longestStreak,
    totalMeals: entries.length,
    totalDays: days.length,
  };
}

/** Group meals by date (local timezone), newest first. */
export function groupByDate(entries: MealEntry[]): { date: string; meals: MealEntry[] }[] {
  const groups = new Map<string, MealEntry[]>();

  for (const entry of entries) {
    const d = new Date(entry.timestamp);
    const key = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }

  return Array.from(groups.entries()).map(([date, meals]) => ({ date, meals }));
}

/** Export history as CSV string. */
export function exportToCsv(entries: MealEntry[]): string {
  const rows = ["Date,Time,Item,Category,Amount,Unit,Meal Offset ($)"];

  for (const entry of entries) {
    const d = new Date(entry.timestamp);
    const date = d.toLocaleDateString("en-US");
    const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const offset = (entry.offsetCents / 100).toFixed(2);

    for (const item of entry.items) {
      // Escape CSV fields
      const name = item.name.includes(",") ? `"${item.name}"` : item.name;
      rows.push(`${date},${time},${name},${item.category},${item.amount},${item.unit},${offset}`);
    }
  }

  return rows.join("\n");
}
