/**
 * Monthly Challenge — track whether the user has offset every meal for 30 days.
 *
 * Uses meal history + meals-per-day preference to determine daily completion.
 */

import { getHistory, type MealEntry } from "./meal-history";

const STORAGE_KEY = "plate2offset_challenge";

export interface ChallengeState {
  /** Whether a challenge is currently active */
  active: boolean;
  /** When the challenge started (ms since epoch) */
  startedAt: number;
  /** Target meals per day */
  mealsPerDay: number;
}

export interface ChallengeProgress {
  active: boolean;
  startedAt: number;
  daysCompleted: number; // days where user hit their meal target
  totalDays: number; // days elapsed since start
  targetDays: number; // always 30
  todayMeals: number;
  todayTarget: number;
  isComplete: boolean;
}

function read(): ChallengeState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(state: ChallengeState | null): void {
  if (typeof window === "undefined") return;
  if (state === null) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export function startChallenge(mealsPerDay: number): ChallengeState {
  const state: ChallengeState = {
    active: true,
    startedAt: Date.now(),
    mealsPerDay,
  };
  write(state);
  return state;
}

export function stopChallenge(): void {
  write(null);
}

export function getChallengeProgress(): ChallengeProgress | null {
  const state = read();
  if (!state || !state.active) return null;

  const history = getHistory();
  const startDate = new Date(state.startedAt);
  const startDay = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  ).getTime();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const ONE_DAY = 86400000;
  const totalDays = Math.min(30, Math.floor((today - startDay) / ONE_DAY) + 1);

  // Count meals per day since challenge started
  const mealsByDay = new Map<number, number>();
  for (const entry of history) {
    if (entry.timestamp < state.startedAt) continue;
    const d = new Date(entry.timestamp);
    const dayMs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    mealsByDay.set(dayMs, (mealsByDay.get(dayMs) ?? 0) + 1);
  }

  // Count days where target was met
  let daysCompleted = 0;
  for (let dayMs = startDay; dayMs <= today; dayMs += ONE_DAY) {
    const mealsThisDay = mealsByDay.get(dayMs) ?? 0;
    if (mealsThisDay >= state.mealsPerDay) {
      daysCompleted++;
    }
  }

  const todayMeals = mealsByDay.get(today) ?? 0;

  // Auto-complete check
  const isComplete = totalDays >= 30 && daysCompleted >= 30;

  return {
    active: true,
    startedAt: state.startedAt,
    daysCompleted,
    totalDays,
    targetDays: 30,
    todayMeals,
    todayTarget: state.mealsPerDay,
    isComplete,
  };
}
