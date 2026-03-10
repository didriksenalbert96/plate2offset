"use client";

import { useState } from "react";
import Link from "next/link";
import {
  getHistory,
  groupByDate,
  getCategoryBreakdown,
  getStreakInfo,
  exportToCsv,
  deleteMeal,
  clearHistory,
  type MealEntry,
  type CategoryBreakdown,
  type StreakInfo,
} from "@/lib/meal-history";
import { getChallengeProgress, startChallenge, stopChallenge, type ChallengeProgress } from "@/lib/challenge";
import { getJar, estimateYearlyOffset } from "@/lib/offset-jar";
import ShareCard from "@/components/ShareCard";

const CATEGORY_COLORS: Record<string, string> = {
  "red-meat": "bg-red-500",
  pork: "bg-pink-400",
  poultry: "bg-orange-400",
  "fish-seafood": "bg-blue-400",
  eggs: "bg-yellow-400",
  dairy: "bg-sky-300",
};

const CATEGORY_TEXT_COLORS: Record<string, string> = {
  "red-meat": "text-red-700",
  pork: "text-pink-700",
  poultry: "text-orange-700",
  "fish-seafood": "text-blue-700",
  eggs: "text-yellow-700",
  dairy: "text-sky-700",
};

export default function HistoryPage() {
  const [entries, setEntries] = useState<MealEntry[]>(() => getHistory());
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>(() => getCategoryBreakdown(getHistory()));
  const [streak, setStreak] = useState<StreakInfo>(() => getStreakInfo(getHistory()));
  const [confirmClear, setConfirmClear] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeProgress | null>(() => getChallengeProgress());
  const [showShareCard, setShowShareCard] = useState(false);

  function reload() {
    const h = getHistory();
    setEntries(h);
    setBreakdown(getCategoryBreakdown(h));
    setStreak(getStreakInfo(h));
    setChallenge(getChallengeProgress());
  }

  function handleDelete(id: string) {
    deleteMeal(id);
    reload();
  }

  function handleClearAll() {
    clearHistory();
    reload();
    setConfirmClear(false);
  }

  function handleExport() {
    const csv = exportToCsv(entries);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plate2offset-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const grouped = groupByDate(entries);
  const totalDollars = entries.reduce((s, e) => s + e.offsetCents, 0) / 100;
  const jar = getJar();
  const yearlyEst = estimateYearlyOffset(jar);

  if (entries.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-50 to-emerald-50 px-4 py-12">
        <main className="w-full max-w-md text-center space-y-6">
          <h1 className="text-2xl font-bold text-stone-900">Meal History</h1>
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200 space-y-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-stone-500">No meals logged yet.</p>
            <p className="text-sm text-stone-400">
              Analyze your first meal to start building your history.
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
      <main className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-700">
            &larr; Back
          </Link>
          <h1 className="text-xl font-bold text-stone-900">Meal History</h1>
          <div className="w-12" /> {/* spacer */}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total offset"
            value={`$${totalDollars.toFixed(2)}`}
            sub={`${streak.totalMeals} meals`}
          />
          <StatCard
            label="Yearly estimate"
            value={yearlyEst !== null ? `~$${yearlyEst.toFixed(0)}` : "—"}
            sub={yearlyEst !== null ? `$${(yearlyEst / 12).toFixed(2)}/mo` : "log more meals"}
          />
          <StatCard
            label="Current streak"
            value={`${streak.currentStreak}`}
            sub={streak.currentStreak === 1 ? "day" : "days"}
          />
          <StatCard
            label="Longest streak"
            value={`${streak.longestStreak}`}
            sub={streak.longestStreak === 1 ? "day" : "days"}
          />
        </div>

        {/* Milestone badges */}
        <Milestones totalMeals={streak.totalMeals} currentStreak={streak.currentStreak} />

        {/* 30-Day Challenge */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 space-y-4">
          <h2 className="text-sm font-semibold text-stone-700">30-Day Challenge</h2>
          {challenge && challenge.active ? (
            <div className="space-y-3">
              <p className="text-sm text-stone-600">
                Offset every meal for 30 days straight.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">
                  {challenge.daysCompleted}/{challenge.targetDays} days
                </span>
                <span className="font-medium text-purple-700">
                  {Math.round((challenge.daysCompleted / challenge.targetDays) * 100)}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-purple-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: `${(challenge.daysCompleted / challenge.targetDays) * 100}%` }}
                />
              </div>
              {/* Day grid — visual calendar of 30 days */}
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 30 }, (_, i) => {
                  const completed = i < challenge.daysCompleted;
                  const isToday = i === challenge.totalDays - 1;
                  return (
                    <div
                      key={i}
                      className={`h-5 w-full rounded-sm text-center text-[10px] leading-5 font-medium ${
                        completed
                          ? "bg-purple-500 text-white"
                          : isToday
                            ? "bg-purple-200 text-purple-700 ring-1 ring-purple-400"
                            : i < challenge.totalDays
                              ? "bg-red-100 text-red-400"
                              : "bg-stone-100 text-stone-300"
                      }`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>
                  Today: {challenge.todayMeals}/{challenge.todayTarget} meals
                </span>
                {challenge.isComplete && (
                  <span className="font-bold text-purple-600">Challenge complete!</span>
                )}
              </div>
              <button
                onClick={() => { stopChallenge(); reload(); }}
                className="text-xs text-stone-400 underline underline-offset-2 hover:text-red-500"
              >
                End challenge
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-stone-600">
                Can you offset every meal for 30 days? Start a challenge to find out.
              </p>
              <button
                onClick={() => {
                  const jar = getJar();
                  startChallenge(jar.mealsPerDay || 3);
                  reload();
                }}
                className="w-full rounded-full bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
              >
                Start 30-day challenge
              </button>
            </div>
          )}
        </div>

        {/* Share impact card */}
        <div className="space-y-3">
          <button
            onClick={() => setShowShareCard(!showShareCard)}
            className="w-full rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            {showShareCard ? "Hide impact card" : "Share your impact"}
          </button>
          {showShareCard && (
            <ShareCard
              totalMeals={streak.totalMeals}
              totalOffsetDollars={totalDollars}
              currentStreak={streak.currentStreak}
              monthLabel={new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            />
          )}
        </div>

        {/* Category breakdown */}
        {breakdown.length > 0 && (
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 space-y-4">
            <h2 className="text-sm font-semibold text-stone-700">Offset by category</h2>
            {/* Stacked bar */}
            <div className="flex h-4 overflow-hidden rounded-full">
              {breakdown.map((b) => (
                <div
                  key={b.category}
                  className={`${CATEGORY_COLORS[b.category] ?? "bg-stone-300"} transition-all`}
                  style={{ width: `${b.percentage}%` }}
                  title={`${b.label}: ${b.percentage}%`}
                />
              ))}
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {breakdown.map((b) => (
                <div key={b.category} className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${CATEGORY_COLORS[b.category] ?? "bg-stone-300"}`} />
                  <span className={CATEGORY_TEXT_COLORS[b.category] ?? "text-stone-600"}>
                    {b.label}
                  </span>
                  <span className="ml-auto text-stone-400">{b.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-stone-700">Timeline</h2>
          {grouped.map(({ date, meals }) => (
            <div key={date} className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                {date}
              </p>
              {meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} onDelete={handleDelete} />
              ))}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleExport}
            className="w-full rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
          >
            Export to CSV
          </button>

          {confirmClear ? (
            <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-200 space-y-3 text-center">
              <p className="text-sm font-medium text-red-800">
                Delete all meal history? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClearAll}
                  className="flex-1 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Yes, delete all
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 rounded-full border border-stone-300 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="w-full text-center text-sm text-stone-400 underline underline-offset-2 hover:text-red-500"
            >
              Clear all history
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 text-center">
      <p className="text-2xl font-bold text-emerald-600">{value}</p>
      <p className="text-xs text-stone-500 mt-0.5">{sub}</p>
      <p className="text-xs font-medium text-stone-400 mt-1">{label}</p>
    </div>
  );
}

function MealCard({ meal, onDelete }: { meal: MealEntry; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(meal.timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const dollars = (meal.offsetCents / 100).toFixed(2);
  const animalItems = meal.items.filter((i) => i.category !== "other");
  const summary = animalItems.length > 0
    ? animalItems.map((i) => i.name).join(", ")
    : meal.items.map((i) => i.name).join(", ");

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-stone-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-900 truncate">{summary}</p>
          <p className="text-xs text-stone-400">{time}</p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <span className="text-sm font-semibold text-emerald-600">${dollars}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 text-stone-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-stone-100 px-4 py-3 space-y-2">
          {meal.items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className={item.category === "other" ? "text-stone-400" : "text-stone-600"}>
                {item.name}
              </span>
              <span className="text-stone-400">
                {item.amount} {item.unit} · {item.category}
              </span>
            </div>
          ))}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(meal.id);
            }}
            className="mt-1 text-xs text-red-400 hover:text-red-600 underline underline-offset-2"
          >
            Delete this meal
          </button>
        </div>
      )}
    </div>
  );
}

function Milestones({ totalMeals, currentStreak }: { totalMeals: number; currentStreak: number }) {
  const badges: { icon: string; label: string; earned: boolean }[] = [
    { icon: "1", label: "First meal", earned: totalMeals >= 1 },
    { icon: "10", label: "10 meals", earned: totalMeals >= 10 },
    { icon: "50", label: "50 meals", earned: totalMeals >= 50 },
    { icon: "100", label: "Century", earned: totalMeals >= 100 },
    { icon: "7d", label: "Week streak", earned: currentStreak >= 7 },
    { icon: "30d", label: "Month streak", earned: currentStreak >= 30 },
  ];

  const earned = badges.filter((b) => b.earned);
  if (earned.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 space-y-3">
      <h2 className="text-sm font-semibold text-stone-700">Milestones</h2>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <div
            key={badge.label}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-all ${
              badge.earned
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-stone-50 text-stone-300 ring-stone-200"
            }`}
          >
            <span className={`font-bold ${badge.earned ? "text-emerald-600" : "text-stone-300"}`}>
              {badge.icon}
            </span>
            {badge.label}
          </div>
        ))}
      </div>
    </div>
  );
}
