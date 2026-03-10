"use client";

/**
 * Migration — one-time import of localStorage data into Supabase.
 *
 * Runs when a user signs in for the first time and has existing
 * localStorage data. Imports meal history, donation settings, and
 * active challenge into Supabase.
 */

import { getSupabaseBrowserClient } from "./client";
import { getHistory } from "../meal-history";
import { getJar } from "../offset-jar";
import { getDonationSettings } from "../donation-settings";

const MIGRATED_KEY = "plate2offset_migrated";

export function hasMigrated(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(MIGRATED_KEY) === "true";
}

function markMigrated() {
  localStorage.setItem(MIGRATED_KEY, "true");
}

/**
 * Import all localStorage data into Supabase for the given user.
 * Only runs once (guarded by MIGRATED_KEY flag).
 */
export async function migrateToSupabase(userId: string): Promise<void> {
  if (hasMigrated()) return;

  const supabase = getSupabaseBrowserClient();

  try {
    // 1. Import meal history
    const history = getHistory();
    if (history.length > 0) {
      for (const entry of history) {
        const { error } = await supabase.from("meals").upsert({
          id: entry.id,
          user_id: userId,
          items: entry.items,
          offset_cents: entry.offsetCents,
          logged_at: new Date(entry.timestamp).toISOString(),
        });

        if (error) {
          console.error("Migration: failed to import meal:", error.message);
        }
      }
    }

    // 2. Import profile settings
    const jar = getJar();
    const settings = getDonationSettings();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        meals_per_day: jar.mealsPerDay,
        auto_threshold_cents: settings.autoThresholdCents,
        subscription_mode: settings.subscriptionMode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Migration: failed to update profile:", profileError.message);
    }

    // 3. Mark as migrated
    markMigrated();
  } catch (err) {
    console.error("Migration failed:", err);
    // Don't mark as migrated on failure — will retry next time
  }
}
