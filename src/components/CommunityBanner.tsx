"use client";

/**
 * CommunityBanner — shows anonymous aggregate community stats.
 * Only renders when Supabase is configured and stats are available.
 */

import { useState, useEffect } from "react";

interface CommunityStats {
  total_users: number;
  total_meals: number;
  total_offset_cents: number;
  active: boolean;
}

export default function CommunityBanner() {
  const [stats, setStats] = useState<CommunityStats | null>(null);

  useEffect(() => {
    fetch("/api/community")
      .then((r) => r.json())
      .then((data: CommunityStats) => {
        if (data.active && data.total_users > 0) {
          setStats(data);
        }
      })
      .catch(() => {}); // silently fail
  }, []);

  if (!stats) return null;

  const dollars = (stats.total_offset_cents / 100).toFixed(0);

  return (
    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-center">
      <p className="text-sm text-emerald-700">
        Join{" "}
        <span className="font-bold">{stats.total_users.toLocaleString()}</span>{" "}
        {stats.total_users === 1 ? "person" : "people"} who{" "}
        {stats.total_users === 1 ? "has" : "have"} offset{" "}
        <span className="font-bold">{stats.total_meals.toLocaleString()}</span>{" "}
        meals
        {stats.total_offset_cents > 0 && (
          <>
            {" "}totaling{" "}
            <span className="font-bold">${dollars}</span>
          </>
        )}
      </p>
    </div>
  );
}
