"use client";

/**
 * AchievementToast — celebratory notification when a new achievement unlocks.
 */

import { useState, useEffect } from "react";
import type { Achievement } from "@/lib/achievements";
import { markAchievementsSeen } from "@/lib/achievements";
import { haptic } from "@/lib/haptic";

interface AchievementToastProps {
  achievements: Achievement[];
}

export default function AchievementToast({ achievements }: AchievementToastProps) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<Achievement | null>(null);

  useEffect(() => {
    if (achievements.length === 0) return;

    // Show the first new achievement
    setCurrent(achievements[0]);
    setVisible(true);
    haptic("success");

    // Mark all as seen
    markAchievementsSeen(achievements.map((a) => a.key));

    // Auto-hide after 4 seconds
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [achievements]);

  if (!visible || !current) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
      <div className="rounded-2xl bg-white shadow-xl ring-1 ring-emerald-200 px-5 py-4 flex items-center gap-3 min-w-[280px]">
        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
          {current.icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-900">{current.label}</p>
          <p className="text-xs text-stone-500">{current.description}</p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="ml-auto text-stone-300 hover:text-stone-500 text-lg leading-none"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
