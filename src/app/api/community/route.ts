/**
 * Community stats API route — returns anonymous aggregate stats.
 * Cached with ISR (revalidate every 5 minutes) to avoid hammering Supabase.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 300; // 5 minutes

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If Supabase isn't configured, return empty stats
  if (!url || !key) {
    return NextResponse.json({
      total_users: 0,
      total_meals: 0,
      total_offset_cents: 0,
      active: false,
    });
  }

  try {
    const supabase = createClient(url, key);

    const [usersResult, mealsResult] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("meals").select("offset_cents"),
    ]);

    const totalUsers = usersResult.count ?? 0;
    const totalMeals = mealsResult.data?.length ?? 0;
    const totalOffsetCents = mealsResult.data?.reduce(
      (s: number, m: { offset_cents: number }) => s + m.offset_cents, 0
    ) ?? 0;

    return NextResponse.json({
      total_users: totalUsers,
      total_meals: totalMeals,
      total_offset_cents: totalOffsetCents,
      active: true,
    });
  } catch {
    return NextResponse.json({
      total_users: 0,
      total_meals: 0,
      total_offset_cents: 0,
      active: false,
    });
  }
}
