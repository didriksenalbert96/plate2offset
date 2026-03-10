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
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  // Derive current from props — first achievement not yet hidden
  const current = achievements.find((a) => !hiddenKeys.has(a.key)) ?? null;
  const currentKey = current?.key ?? null;

  useEffect(() => {
    if (!currentKey) return;

    haptic("success");
    markAchievementsSeen(achievements.map((a) => a.key));

    const timer = setTimeout(() => {
      setHiddenKeys((prev) => new Set([...prev, currentKey]));
    }, 4000);
    return () => clearTimeout(timer);
  }, [currentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null;

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
          onClick={() => setHiddenKeys((prev) => new Set([...prev, current.key]))}
          className="ml-auto text-stone-300 hover:text-stone-500 text-lg leading-none"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
