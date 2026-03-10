"use client";

/**
 * Supabase Sync — background sync between localStorage and Supabase.
 *
 * When authenticated:
 * - On mount: pulls data from Supabase into localStorage (Supabase = source of truth)
 * - On writes: localStorage is updated immediately (fast), then pushed to Supabase
 *
 * Uses a custom event system so the sync hook can be notified of local writes.
 */

import { useEffect, useCallback, useRef } from "react";
import { getSupabaseBrowserClient } from "./client";
import { getHistory, type MealEntry } from "../meal-history";
import { getJar } from "../offset-jar";
import { getDonationSettings } from "../donation-settings";
import type { MealItem } from "../types";
import type { User } from "@supabase/supabase-js";

const SYNC_KEY = "plate2offset_last_sync";
const SYNC_QUEUE_KEY = "plate2offset_sync_queue";

interface SyncQueueItem {
  type: "meal_add" | "meal_delete" | "jar_clear" | "settings_update" | "profile_update";
  payload: Record<string, unknown>;
  timestamp: number;
}

function getSyncQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToSyncQueue(item: SyncQueueItem) {
  const queue = getSyncQueue();
  queue.push(item);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

function clearSyncQueue() {
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

/**
 * Push a new meal to Supabase (call after addMeal writes to localStorage).
 */
export function queueMealSync(entry: MealEntry) {
  addToSyncQueue({
    type: "meal_add",
    payload: {
      id: entry.id,
      items: entry.items,
      offset_cents: entry.offsetCents,
      logged_at: new Date(entry.timestamp).toISOString(),
    },
    timestamp: Date.now(),
  });
  // Dispatch event so useSync can pick it up
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("plate2offset:sync"));
  }
}

/**
 * Queue a meal deletion for Supabase sync.
 */
export function queueMealDeleteSync(mealId: string) {
  addToSyncQueue({
    type: "meal_delete",
    payload: { id: mealId },
    timestamp: Date.now(),
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("plate2offset:sync"));
  }
}

/**
 * Queue a jar clear (donation event) for Supabase sync.
 */
export function queueDonationSync(amountCents: number) {
  addToSyncQueue({
    type: "jar_clear",
    payload: { amount_cents: amountCents },
    timestamp: Date.now(),
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("plate2offset:sync"));
  }
}

/**
 * Queue a settings update for Supabase sync.
 */
export function queueSettingsSync() {
  const settings = getDonationSettings();
  const jar = getJar();
  addToSyncQueue({
    type: "settings_update",
    payload: {
      auto_threshold_cents: settings.autoThresholdCents,
      subscription_mode: settings.subscriptionMode,
      meals_per_day: jar.mealsPerDay,
    },
    timestamp: Date.now(),
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("plate2offset:sync"));
  }
}

/**
 * Process the sync queue — push pending items to Supabase.
 */
async function processSyncQueue(userId: string): Promise<void> {
  const queue = getSyncQueue();
  if (queue.length === 0) return;

  const supabase = getSupabaseBrowserClient();
  const processed: number[] = [];

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    try {
      switch (item.type) {
        case "meal_add": {
          const { error } = await supabase.from("meals").upsert({
            id: item.payload.id as string,
            user_id: userId,
            items: item.payload.items,
            offset_cents: item.payload.offset_cents as number,
            logged_at: item.payload.logged_at as string,
          });
          if (!error) processed.push(i);
          break;
        }
        case "meal_delete": {
          const { error } = await supabase
            .from("meals")
            .delete()
            .eq("id", item.payload.id as string)
            .eq("user_id", userId);
          if (!error) processed.push(i);
          break;
        }
        case "jar_clear": {
          const { error } = await supabase.from("donations").insert({
            user_id: userId,
            amount_cents: item.payload.amount_cents as number,
          });
          if (!error) processed.push(i);
          break;
        }
        case "settings_update": {
          const { error } = await supabase
            .from("profiles")
            .update({
              auto_threshold_cents: item.payload.auto_threshold_cents as number,
              subscription_mode: item.payload.subscription_mode as boolean,
              meals_per_day: item.payload.meals_per_day as number,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
          if (!error) processed.push(i);
          break;
        }
      }
    } catch {
      // Network error — leave in queue for next sync
      break;
    }
  }

  // Remove processed items
  if (processed.length === queue.length) {
    clearSyncQueue();
  } else {
    const remaining = queue.filter((_, i) => !processed.includes(i));
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
  }
}

/**
 * Pull meals from Supabase and hydrate localStorage.
 * Supabase is source of truth for authenticated users.
 */
async function pullFromSupabase(userId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  // Fetch all meals
  const { data: meals, error } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(500);

  if (error || !meals) return;

  // Convert Supabase rows to MealEntry format and write to localStorage
  const entries: MealEntry[] = meals.map((m) => ({
    id: m.id,
    timestamp: new Date(m.logged_at).getTime(),
    items: m.items as MealItem[],
    offsetCents: m.offset_cents,
  }));

  if (entries.length > 0) {
    localStorage.setItem("plate2offset_history", JSON.stringify(entries));
  }

  // Fetch profile for settings
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profile) {
    // Update jar mealsPerDay
    const jar = getJar();
    jar.mealsPerDay = profile.meals_per_day;
    localStorage.setItem("plate2offset_jar", JSON.stringify(jar));

    // Update donation settings
    localStorage.setItem(
      "plate2offset_donation_settings",
      JSON.stringify({
        autoThresholdCents: profile.auto_threshold_cents,
        subscriptionMode: profile.subscription_mode,
      })
    );
  }

  // Compute jar from meals + donations
  const { data: lastDonation } = await supabase
    .from("donations")
    .select("donated_at")
    .eq("user_id", userId)
    .order("donated_at", { ascending: false })
    .limit(1);

  const lastDonationTime = lastDonation?.[0]?.donated_at;

  let jarMeals = meals;
  if (lastDonationTime) {
    jarMeals = meals.filter((m) => m.logged_at > lastDonationTime);
  }

  const jarTotalCents = jarMeals.reduce((sum, m) => sum + m.offset_cents, 0);
  const currentJar = getJar();
  currentJar.totalCents = jarTotalCents;
  currentJar.mealCount = jarMeals.length;
  localStorage.setItem("plate2offset_jar", JSON.stringify(currentJar));

  localStorage.setItem(SYNC_KEY, new Date().toISOString());
}

/**
 * Hook: run in your root layout to keep localStorage synced with Supabase.
 *
 * - On mount (if authenticated): pull from Supabase, process any pending queue
 * - On sync events: process the queue
 * - Returns a `refresh` function to force a full pull
 */
export function useSync(user: User | null) {
  const userRef = useRef(user);
  userRef.current = user;

  const processQueue = useCallback(async () => {
    if (!userRef.current) return;
    await processSyncQueue(userRef.current.id);
  }, []);

  const refresh = useCallback(async () => {
    if (!userRef.current) return;
    await pullFromSupabase(userRef.current.id);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Initial sync: pull from Supabase, then process any pending writes
    pullFromSupabase(user.id)
      .then(() => processSyncQueue(user.id))
      .catch(() => {});

    // Listen for local write events
    const handleSync = () => {
      processSyncQueue(user.id).catch(() => {});
    };

    window.addEventListener("plate2offset:sync", handleSync);
    window.addEventListener("online", handleSync);

    return () => {
      window.removeEventListener("plate2offset:sync", handleSync);
      window.removeEventListener("online", handleSync);
    };
  }, [user]);

  return { refresh, processQueue };
}
