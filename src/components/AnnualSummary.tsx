"use client";

/**
 * AnnualSummary — shareable year-in-review card.
 */

import type { AnnualSummary as AnnualSummaryType } from "@/lib/analytics";

const CATEGORY_LABELS: Record<string, string> = {
  "red-meat": "Red meat",
  pork: "Pork",
  poultry: "Poultry",
  "fish-seafood": "Fish & seafood",
  eggs: "Eggs",
  dairy: "Dairy",
};

export default function AnnualSummary({ summary }: { summary: AnnualSummaryType }) {
  const dollars = (summary.totalCents / 100).toFixed(2);
  const avgDollars = (summary.avgCentsPerMeal / 100).toFixed(2);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white shadow-lg space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{summary.year} Year in Review</h2>
        <span className="text-xs text-emerald-200 font-medium">Plate2Offset</span>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-3xl font-bold">${dollars}</p>
          <p className="text-xs text-emerald-200">total offset</p>
        </div>
        <div>
          <p className="text-3xl font-bold">{summary.totalMeals}</p>
          <p className="text-xs text-emerald-200">meals logged</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{summary.totalDays}</p>
          <p className="text-xs text-emerald-200">active days</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{summary.longestStreak}</p>
          <p className="text-xs text-emerald-200">day best streak</p>
        </div>
      </div>

      {/* Avg per meal */}
      <div className="rounded-xl bg-white/10 px-4 py-3">
        <p className="text-sm">
          Average offset: <span className="font-bold">${avgDollars}</span> per meal
        </p>
      </div>

      {/* Top categories */}
      {summary.topCategories.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-emerald-200 font-medium">Top categories</p>
          <div className="flex gap-2">
            {summary.topCategories.map((cat) => (
              <span
                key={cat.category}
                className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium"
              >
                {CATEGORY_LABELS[cat.category] ?? cat.category} {cat.percentage}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Best month */}
      {summary.bestMonth && (
        <p className="text-sm text-emerald-200">
          Best month: <span className="text-white font-medium">{summary.bestMonth.label}</span> ({summary.bestMonth.mealCount} meals)
        </p>
      )}
    </div>
  );
}
