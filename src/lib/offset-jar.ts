/**
 * Offset Jar — a localStorage-based accumulator for small donation amounts.
 *
 * Stores only a running dollar total (in cents), a meal count, and
 * a user-set meals-per-day preference (for yearly projection).
 * No meal details, photos, or descriptions are ever persisted.
 */

const STORAGE_KEY = "plate2offset_jar";

export interface JarState {
  totalCents: number;
  mealCount: number;
  /** User's typical meals per day (for yearly estimate). Defaults to 3. */
  mealsPerDay: number;
}

const EMPTY: JarState = { totalCents: 0, mealCount: 0, mealsPerDay: 3 };

function read(): JarState {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return {
      totalCents: typeof parsed.totalCents === "number" ? parsed.totalCents : 0,
      mealCount: typeof parsed.mealCount === "number" ? parsed.mealCount : 0,
      mealsPerDay: typeof parsed.mealsPerDay === "number" ? parsed.mealsPerDay : 3,
    };
  } catch {
    return { ...EMPTY };
  }
}

function write(state: JarState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getJar(): JarState {
  return read();
}

export function addToJar(cents: number): JarState {
  const jar = read();
  jar.totalCents = Math.round(jar.totalCents + cents);
  jar.mealCount += 1;
  write(jar);
  return jar;
}

export function clearJar(): void {
  const jar = read();
  // Preserve mealsPerDay preference across clears
  write({ ...EMPTY, mealsPerDay: jar.mealsPerDay });
}

export function setMealsPerDay(mealsPerDay: number): JarState {
  const jar = read();
  jar.mealsPerDay = mealsPerDay;
  write(jar);
  return jar;
}

/**
 * Estimate the yearly offset based on the jar's average cents per meal
 * and the user's stated meals-per-day. Returns null if no meals logged.
 */
export function estimateYearlyOffset(jar: JarState): number | null {
  if (jar.mealCount === 0) return null;

  const centsPerMeal = jar.totalCents / jar.mealCount;
  const yearlyCents = jar.mealsPerDay * centsPerMeal * 365;

  return Math.round(yearlyCents) / 100;
}
