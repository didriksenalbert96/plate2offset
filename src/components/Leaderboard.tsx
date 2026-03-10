"use client";

/**
 * Leaderboard — ranked list of group members by offset amount.
 */

import type { GroupLeaderboardEntry } from "@/lib/groups";

interface LeaderboardProps {
  entries: GroupLeaderboardEntry[];
  currentUserId: string;
}

const RANK_STYLES = [
  "text-yellow-600 bg-yellow-50 ring-yellow-200", // 1st
  "text-stone-500 bg-stone-50 ring-stone-200",    // 2nd
  "text-amber-700 bg-amber-50 ring-amber-200",    // 3rd
];

export default function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 text-center">
        <p className="text-sm text-stone-500">No meals logged yet by any member.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 space-y-3">
      <h3 className="text-sm font-semibold text-stone-700">Leaderboard</h3>
      <div className="space-y-2">
        {entries.map((entry, i) => {
          const isCurrentUser = entry.user_id === currentUserId;
          const dollars = (entry.total_offset_cents / 100).toFixed(2);
          const name = entry.display_name || (isCurrentUser ? "You" : "Member");
          const rankStyle = i < 3 ? RANK_STYLES[i] : "text-stone-400 bg-white ring-stone-200";

          return (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ${
                isCurrentUser ? "ring-emerald-300 bg-emerald-50" : "ring-stone-100"
              }`}
            >
              {/* Rank */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-1 ${rankStyle}`}
              >
                {i + 1}
              </div>

              {/* Name + meals */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isCurrentUser ? "text-emerald-800" : "text-stone-700"}`}>
                  {name}
                  {isCurrentUser && entry.display_name && (
                    <span className="text-xs text-emerald-500 ml-1">(you)</span>
                  )}
                </p>
                <p className="text-xs text-stone-400">{entry.total_meals} meals</p>
              </div>

              {/* Offset amount */}
              <span className="text-sm font-semibold text-emerald-600">${dollars}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
