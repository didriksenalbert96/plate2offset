"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getHistory,
  getStreakInfo,
  getJar,
  estimateYearlyOffset,
  type MealEntry,
  type StreakInfo,
} from "@/lib/data-layer";
import {
  getWeeklyTotals,
  getMonthlyTotals,
  getCategoryTrend,
  getAnnualSummary,
  getAvgOffsetPerMeal,
  type PeriodTotal,
  type AnnualSummary as AnnualSummaryType,
} from "@/lib/analytics";
import TrendChart, { Sparkline } from "@/components/TrendChart";
import ImpactEquivalents from "@/components/ImpactEquivalents";
import AnnualSummary from "@/components/AnnualSummary";

const CATEGORY_COLORS: Record<string, string> = {
  "red-meat": "bg-red-500",
  pork: "bg-pink-400",
  poultry: "bg-orange-400",
  "fish-seafood": "bg-blue-400",
  eggs: "bg-yellow-400",
  dairy: "bg-sky-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  "red-meat": "Red meat",
  pork: "Pork",
  poultry: "Poultry",
  "fish-seafood": "Fish & seafood",
  eggs: "Eggs",
  dairy: "Dairy",
};

type TimeRange = "weekly" | "monthly";

export default function AnalyticsPage() {
  const [entries] = useState<MealEntry[]>(() => getHistory());
  const [streak] = useState<StreakInfo>(() => getStreakInfo(getHistory()));
  const [timeRange, setTimeRange] = useState<TimeRange>("weekly");

  const totalCents = entries.reduce((s, e) => s + e.offsetCents, 0);
  const totalDollars = totalCents / 100;
  const jar = getJar();
  const yearlyEst = estimateYearlyOffset(jar);
  const avgPerMeal = getAvgOffsetPerMeal(entries);

  const weeklyData = getWeeklyTotals(entries, 12);
  const monthlyData = getMonthlyTotals(entries, 12);
  const categoryTrend = getCategoryTrend(entries, 6);
  const annualSummary = getAnnualSummary(entries);

  const chartData: PeriodTotal[] = timeRange === "weekly" ? weeklyData : monthlyData;
  const sparkValues = weeklyData.map((w) => w.totalCents);

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-50 to-emerald-50 px-4 py-12">
        <main className="w-full max-w-md text-center space-y-6">
          <h1 className="text-2xl font-bold text-stone-900">Analytics</h1>
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200 space-y-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <p className="text-stone-500">No data yet.</p>
            <p className="text-sm text-stone-400">
              Log some meals to see your trends and impact analytics.
            </p>
          </div>
          <Link
            href="/"
            className="inline-block rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Log a meal
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-gradient-to-b from-stone-50 to-emerald-50 px-4 py-8">
      <main className="w-full max-w-md space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-700">
            &larr; Back
          </Link>
          <h1 className="text-xl font-bold text-stone-900">Analytics</h1>
          <Link href="/history" className="text-sm text-stone-500 hover:text-stone-700">
            History
          </Link>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 text-center">
            <p className="text-2xl font-bold text-emerald-600">${totalDollars.toFixed(2)}</p>
            <p className="text-xs text-stone-500 mt-0.5">{streak.totalMeals} meals</p>
            <p className="text-xs font-medium text-stone-400 mt-1">Total offset</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {yearlyEst !== null ? `~$${yearlyEst.toFixed(0)}` : "--"}
            </p>
            <div className="mt-0.5">
              <Sparkline data={sparkValues} />
            </div>
            <p className="text-xs font-medium text-stone-400 mt-1">Yearly estimate</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              ${(avgPerMeal / 100).toFixed(2)}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">per meal</p>
            <p className="text-xs font-medium text-stone-400 mt-1">Average offset</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 text-center">
            <p className="text-2xl font-bold text-emerald-600">{streak.currentStreak}</p>
            <p className="text-xs text-stone-500 mt-0.5">
              {streak.currentStreak === 1 ? "day" : "days"}
            </p>
            <p className="text-xs font-medium text-stone-400 mt-1">Current streak</p>
          </div>
        </div>

        {/* Trend chart */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700">Offset trend</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setTimeRange("weekly")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  timeRange === "weekly"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeRange("monthly")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  timeRange === "monthly"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-stone-400 hover:text-stone-600"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          <TrendChart data={chartData} showDollars={true} />
          <div className="flex justify-between text-[10px] text-stone-400">
            <span>
              {timeRange === "weekly" ? "Last 12 weeks" : "Last 12 months"}
            </span>
            <span>
              Total: ${(chartData.reduce((s, d) => s + d.totalCents, 0) / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Meal count trend */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 space-y-4">
          <h2 className="text-sm font-semibold text-stone-700">Meals per week</h2>
          <TrendChart data={weeklyData} showDollars={false} />
          <p className="text-[10px] text-stone-400">
            {weeklyData.reduce((s, d) => s + d.mealCount, 0)} meals in the last 12 weeks
          </p>
        </div>

        {/* Category trend */}
        {categoryTrend.length > 0 && (
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 space-y-4">
            <h2 className="text-sm font-semibold text-stone-700">Category mix by month</h2>
            <div className="space-y-2">
              {categoryTrend.map((month) => {
                const total = Object.values(month.categories).reduce((s, v) => s + v, 0);
                if (total === 0) return null;
                return (
                  <div key={month.label} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500 w-8">{month.label}</span>
                      <div className="flex h-3 flex-1 overflow-hidden rounded-full">
                        {Object.entries(month.categories).map(([cat, cents]) => (
                          <div
                            key={cat}
                            className={`${CATEGORY_COLORS[cat] ?? "bg-stone-300"} transition-all`}
                            style={{ width: `${(cents / total) * 100}%` }}
                            title={`${CATEGORY_LABELS[cat] ?? cat}: $${(cents / 100).toFixed(2)}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 text-[10px]">
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${color}`} />
                  <span className="text-stone-500">{CATEGORY_LABELS[cat]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact equivalents */}
        <ImpactEquivalents totalCents={totalCents} />

        {/* Annual summary */}
        {annualSummary && annualSummary.totalMeals >= 5 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-stone-700">Year in review</h2>
            <AnnualSummary summary={annualSummary} />
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/history"
            className="flex-1 text-center rounded-full border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 transition"
          >
            View history
          </Link>
          <Link
            href="/"
            className="flex-1 text-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
          >
            Log a meal
          </Link>
        </div>
      </main>
    </div>
  );
}
