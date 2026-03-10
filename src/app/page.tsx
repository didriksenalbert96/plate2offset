"use client";

import { useState, useEffect } from "react";
import MealInput from "@/components/MealInput";
import PhotoUpload from "@/components/PhotoUpload";
import AnalyzingSpinner from "@/components/AnalyzingSpinner";
import ReviewScreen from "@/components/ReviewScreen";
import DonateModal from "@/components/DonateModal";
import type { MealItem } from "@/lib/types";
import Link from "next/link";
import { calculateOffset, itemContribution } from "@/lib/calculate-offset";
import { buildDonateLink } from "@/lib/donate-link";
import {
  getJar, addToJar, clearJar, setMealsPerDay, estimateYearlyOffset, type JarState,
  addMeal, getHistory, getStreakInfo,
  enqueue, getQueue, dequeue, isOnline, type QueuedMeal,
  getDonationSettings, setAutoThreshold, setSubscriptionMode, THRESHOLD_OPTIONS, type DonationSettings,
  getRecurringMeals, getLastMeal, type RecurringMeal,
  getChallengeProgress, type ChallengeProgress,
} from "@/lib/data-layer";
import { haptic } from "@/lib/haptic";
import InstallPrompt from "@/components/InstallPrompt";
import ShareCard from "@/components/ShareCard";
import CommunityBanner from "@/components/CommunityBanner";
import AchievementToast from "@/components/AchievementToast";
import { getAchievements, getNewAchievements } from "@/lib/achievements";

const MIN_DONATION = 0.5;

type Step = "input" | "loading" | "review" | "donate";

export default function Home() {
  const [step, setStep] = useState<Step>("input");
  const [description, setDescription] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [items, setItems] = useState<MealItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [jar, setJar] = useState<JarState>(() => getJar());
  const [historyCount, setHistoryCount] = useState(() => getHistory().length);
  const [offlineQueue, setOfflineQueue] = useState<QueuedMeal[]>(() => getQueue());
  const [processingQueue, setProcessingQueue] = useState(false);

  // Donation settings
  const [donationSettings, setDonationSettingsState] = useState<DonationSettings>(() => getDonationSettings());
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Recurring meals
  const [recurringMeals, setRecurringMeals] = useState<RecurringMeal[]>(() => getRecurringMeals());
  const [lastMeal, setLastMealState] = useState<RecurringMeal | null>(() => getLastMeal());

  // Challenge
  const [challenge, setChallenge] = useState<ChallengeProgress | null>(() => getChallengeProgress());

  // Error recovery — keep photo/description on failure for retry
  const [canRetry, setCanRetry] = useState(false);

  // Process the next queued meal (shared by online listener and manual button)
  async function processNextQueued() {
    const queue = getQueue();
    if (queue.length === 0 || !isOnline()) return;
    setOfflineQueue(queue);
    setProcessingQueue(true);
    const item = queue[0];
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: item.description, photoBase64: item.photoBase64 }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        dequeue(item.id);
        setOfflineQueue(getQueue());
        setStep("review");
        haptic("success");
      }
    } catch { /* retry later */ }
    setProcessingQueue(false);
  }

  // When coming back online, process queued meals
  useEffect(() => {
    function handleOnline() {
      processNextQueued();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const hasInput = description.trim().length > 0 || photoBase64 !== null;
  const jarDollars = jar.totalCents / 100;
  const jarReady = jar.totalCents >= 50;

  async function handleAnalyze() {
    setError(null);
    setCanRetry(false);

    if (!isOnline()) {
      enqueue(description, photoBase64);
      setOfflineQueue(getQueue());
      haptic("medium");
      setDescription("");
      setPhotoBase64(null);
      setStep("input");
      return;
    }

    setStep("loading");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, photoBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setCanRetry(true); // Keep input for retry
        setStep("input");
        return;
      }

      setItems(data.items);
      setStep("review");
    } catch (err) {
      if (err instanceof TypeError) {
        enqueue(description, photoBase64);
        setOfflineQueue(getQueue());
        setDescription("");
        setPhotoBase64(null);
        setError("You appear to be offline. Your meal has been queued and will be analyzed when you reconnect.");
        setStep("input");
        haptic("medium");
        return;
      }
      // Error recovery: keep photo/description so user can retry
      setError("Something went wrong analyzing your meal. Please try again.");
      setCanRetry(true);
      setStep("input");
    }
  }

  function handleConfirm() {
    const amount = calculateOffset(items);
    setDonationAmount(amount);
    const cents = Math.round(amount * 100);
    const updatedJar = addToJar(cents);
    setJar(updatedJar);
    addMeal(items, cents);
    setHistoryCount((c) => c + 1);
    setStep("donate");
    haptic("success");
    setCanRetry(false);

    // Refresh recurring meals data
    setRecurringMeals(getRecurringMeals());
    setLastMealState(getLastMeal());
    setChallenge(getChallengeProgress());

    // Check auto-donate threshold
    const settings = getDonationSettings();
    if (settings.autoThresholdCents > 0 && updatedJar.totalCents >= settings.autoThresholdCents) {
      setShowDonateModal(true);
    }
  }

  function handleQuickLog(meal: RecurringMeal) {
    haptic("light");
    setItems(meal.items);
    setStep("review");
  }

  function handleStartOver() {
    setStep("input");
    setItems([]);
    setDescription("");
    setPhotoBase64(null);
    setError(null);
    setDonationAmount(0);
    setShowExplanation(false);
    setShowSettings(false);
    setCanRetry(false);
  }

  function handleClearJar() {
    clearJar();
    setJar({ totalCents: 0, mealCount: 0, mealsPerDay: 3 });
  }

  function handleDonationComplete() {
    setShowDonateModal(false);
    handleClearJar();
    handleStartOver();
  }

  // ── Input screen ──────────────────────────────────────────────
  if (step === "input") {
    return (
      <div className="flex min-h-screen items-start justify-center bg-gradient-to-b from-stone-50 to-emerald-50 px-4 py-6">
        <main className="w-full max-w-md space-y-5">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60" className="mx-auto mb-2 h-16 w-20">
              <line x1="12" y1="26" x2="68" y2="22" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round" />
              <polygon points="40,24 35,34 45,34" fill="#a8a29e" />
              <ellipse cx="18" cy="26" rx="14" ry="5" fill="none" stroke="#a8a29e" strokeWidth="1.5" />
              <ellipse cx="15" cy="23" rx="4" ry="2.5" fill="#f59e0b" transform="rotate(-20 15 23)" />
              <line x1="19" y1="22" x2="23" y2="19" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="24" r="2" fill="#fbbf24" />
              <ellipse cx="62" cy="22" rx="14" ry="5" fill="none" stroke="#a8a29e" strokeWidth="1.5" />
              <path d="M62 17c-1.5-2-4-2.5-5-1s0 4 5 7c5-3 6-5.5 5-7s-3.5-1-5 1z" fill="#10b981" />
              <path d="M57 20c-2-3-1.5-5-1.5-5s3 0.5 3.5 3z" fill="#34d399" />
              <line x1="32" y1="34" x2="48" y2="34" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round" />
              <line x1="40" y1="34" x2="40" y2="40" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round" />
              <line x1="33" y1="40" x2="47" y2="40" stroke="#a8a29e" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <h1 className="text-2xl font-bold text-stone-900">Plate2Offset</h1>
            <p className="mt-1 text-sm text-stone-600">
              Offset your meals&apos; impact on farmed animals with a small donation.
            </p>
          </div>

          <InstallPrompt />

          {/* Challenge progress banner */}
          {challenge && challenge.active && (
            <div className="rounded-xl bg-purple-50 px-4 py-3 ring-1 ring-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    30-Day Challenge
                  </p>
                  <p className="text-xs text-purple-600">
                    {challenge.daysCompleted}/{challenge.targetDays} days completed
                    {" "}&middot;{" "}
                    {challenge.todayMeals}/{challenge.todayTarget} meals today
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-700">
                    {Math.round((challenge.daysCompleted / challenge.targetDays) * 100)}%
                  </p>
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-purple-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: `${(challenge.daysCompleted / challenge.targetDays) * 100}%` }}
                />
              </div>
            </div>
          )}

          {jar.mealCount > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Offset jar: ${jarDollars.toFixed(2)}
                </p>
                <p className="text-xs text-emerald-600">
                  from {jar.mealCount} {jar.mealCount === 1 ? "meal" : "meals"}
                  {estimateYearlyOffset(jar) !== null && (
                    <span> &middot; ~${estimateYearlyOffset(jar)!.toFixed(0)}/yr</span>
                  )}
                  {donationSettings.autoThresholdCents > 0 && (
                    <span> &middot; auto at ${(donationSettings.autoThresholdCents / 100).toFixed(0)}</span>
                  )}
                </p>
              </div>
              <button
                onClick={handleClearJar}
                className="text-xs text-emerald-600 underline underline-offset-2 hover:text-emerald-800"
              >
                Clear
              </button>
            </div>
          )}

          {/* Quick log: recurring meals */}
          {(lastMeal || recurringMeals.length > 0) && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Quick log</p>
              {lastMeal && (
                <button
                  onClick={() => handleQuickLog(lastMeal)}
                  className="w-full flex items-center justify-between rounded-lg bg-white px-3 py-2.5 text-left ring-1 ring-stone-200 hover:ring-emerald-300 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      Same as last meal
                    </p>
                    <p className="text-xs text-stone-400 truncate">{lastMeal.label}</p>
                  </div>
                  <span className="ml-2 text-xs text-emerald-600 font-medium">
                    ${(lastMeal.offsetCents / 100).toFixed(2)}
                  </span>
                </button>
              )}
              {recurringMeals.map((meal) => (
                <button
                  key={meal.label}
                  onClick={() => handleQuickLog(meal)}
                  className="w-full flex items-center justify-between rounded-lg bg-white px-3 py-2.5 text-left ring-1 ring-stone-200 hover:ring-emerald-300 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {meal.label}
                    </p>
                    <p className="text-xs text-stone-400">
                      logged {meal.count} times
                    </p>
                  </div>
                  <span className="ml-2 text-xs text-emerald-600 font-medium">
                    ${(meal.offsetCents / 100).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 space-y-4">
            <PhotoUpload
              photoBase64={photoBase64}
              onPhotoChange={setPhotoBase64}
            />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-stone-200" />
              <span className="text-xs text-stone-400">and / or</span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>

            <MealInput value={description} onChange={setDescription} />

            <p className="text-xs text-stone-400">
              Tip: multiple meals at once, or mention a restaurant for accurate portions.
            </p>
          </div>

          {offlineQueue.length > 0 && (
            <div className="rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200 space-y-1">
              <p className="text-sm font-medium text-amber-800">
                {offlineQueue.length} queued {offlineQueue.length === 1 ? "meal" : "meals"}
              </p>
              <p className="text-xs text-amber-600">
                {isOnline()
                  ? processingQueue
                    ? "Processing queued meals..."
                    : "Ready to process — tap below"
                  : "Will be analyzed when you reconnect"}
              </p>
              {isOnline() && !processingQueue && (
                <button
                  onClick={processNextQueued}
                  className="mt-1 text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900"
                >
                  Process now
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 space-y-2">
              <p>{error}</p>
              {canRetry && (
                <button
                  onClick={handleAnalyze}
                  className="text-xs font-medium text-red-800 underline underline-offset-2 hover:text-red-900"
                >
                  Retry analysis
                </button>
              )}
            </div>
          )}

          <CommunityBanner />

          <button
            disabled={!hasInput && !canRetry}
            onClick={handleAnalyze}
            className="w-full rounded-full bg-emerald-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {!isOnline() && hasInput ? "Queue for later" : canRetry ? "Retry analysis" : "Analyze my meal"}
          </button>

          <AchievementToast
            achievements={getNewAchievements(
              getAchievements({
                totalMeals: historyCount,
                currentStreak: getStreakInfo(getHistory()).currentStreak,
                longestStreak: getStreakInfo(getHistory()).longestStreak,
                totalCents: getHistory().reduce((s, e) => s + e.offsetCents, 0),
                entries: getHistory(),
                challengeCompleted: false,
              })
            )}
          />

          <div className="flex items-center justify-center gap-4">
            {historyCount > 0 && (
              <>
                <Link
                  href="/history"
                  className="text-sm text-emerald-600 underline underline-offset-2 hover:text-emerald-700 font-medium"
                >
                  History ({historyCount})
                </Link>
                <Link
                  href="/analytics"
                  className="text-sm text-emerald-600 underline underline-offset-2 hover:text-emerald-700 font-medium"
                >
                  Analytics
                </Link>
              </>
            )}
            <Link
              href="/groups"
              className="text-sm text-emerald-600 underline underline-offset-2 hover:text-emerald-700 font-medium"
            >
              Groups
            </Link>
            <Link
              href="/about"
              className="text-sm text-stone-400 underline underline-offset-2 hover:text-stone-600"
            >
              What is this about?
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ── Loading screen ────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-50 to-emerald-50 px-4 py-12">
        <main className="w-full max-w-md">
          <AnalyzingSpinner />
        </main>
      </div>
    );
  }

  // ── Review screen ─────────────────────────────────────────────
  if (step === "review") {
    return (
      <ReviewScreen
        items={items}
        onItemsChange={setItems}
        onConfirm={handleConfirm}
        onStartOver={handleStartOver}
      />
    );
  }

  // ── Donation screen ───────────────────────────────────────────
  const donateAmount = jarReady ? jarDollars : MIN_DONATION;
  const yearlyEstimate = estimateYearlyOffset(jar);
  const frequency = donationSettings.subscriptionMode ? "MONTHLY" as const : "ONCE" as const;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-50 to-emerald-50 px-4 py-12">
      <main className="w-full max-w-md space-y-4">
        {/* Donate Modal */}
        {showDonateModal && (
          <DonateModal
            amount={donateAmount}
            frequency={frequency}
            onClose={() => setShowDonateModal(false)}
            onDonationComplete={handleDonationComplete}
          />
        )}

        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-900">
            {jarReady ? "Ready to donate" : "Added to your jar"}
          </h2>
          <p className="mt-1 text-stone-600">
            {donationSettings.autoThresholdCents > 0 && jar.totalCents >= donationSettings.autoThresholdCents
              ? "Your jar hit the auto-donate threshold!"
              : jarReady
                ? "Your offset jar has reached a donatable amount."
                : "Keep logging meals to build up your offset."}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 text-center space-y-3">
          <p className="text-sm text-stone-500">
            This meal: <span className="font-medium text-stone-700">${donationAmount.toFixed(2)}</span>
          </p>

          <p className="text-5xl font-bold text-emerald-600">
            ${jarDollars.toFixed(2)}
          </p>
          <p className="text-sm text-stone-500">
            offset jar total from {jar.mealCount} {jar.mealCount === 1 ? "meal" : "meals"}
          </p>

          {!jarReady && (
            <div className="space-y-2 pt-2">
              <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, (jar.totalCents / 50) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-stone-400">
                ${(MIN_DONATION - jarDollars).toFixed(2)} more to reach the ${MIN_DONATION.toFixed(2)} minimum
              </p>
            </div>
          )}

          {yearlyEstimate !== null && (
            <div className="pt-2 space-y-1">
              <p className="text-xs text-stone-400">
                Yearly estimate: <span className="font-medium text-stone-600">~${yearlyEstimate.toFixed(2)}</span>
                {donationSettings.subscriptionMode && (
                  <span className="text-emerald-600"> (monthly)</span>
                )}
              </p>
              <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
                <span>if you eat</span>
                <select
                  value={jar.mealsPerDay}
                  onChange={(e) => {
                    const updated = setMealsPerDay(Number(e.target.value));
                    setJar(updated);
                  }}
                  className="rounded border border-stone-200 bg-white px-1.5 py-0.5 text-xs text-stone-600"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span>meals per day</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Primary donate actions */}
          <button
            onClick={() => setShowDonateModal(true)}
            className="w-full rounded-full bg-emerald-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Donate ${donateAmount.toFixed(2)} {donationSettings.subscriptionMode ? "monthly" : ""} via Every.org
          </button>

          {/* Secondary links row */}
          <div className="flex items-center justify-center gap-3 text-xs text-stone-400">
            <a
              href={buildDonateLink(donateAmount, frequency)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-stone-600"
            >
              Open in new tab
            </a>
            <span>&middot;</span>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="underline underline-offset-2 hover:text-stone-600"
            >
              {showSettings ? "Hide settings" : "Settings"}
            </button>
            <span>&middot;</span>
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="underline underline-offset-2 hover:text-stone-600"
            >
              {showExplanation ? "Hide math" : "How calculated?"}
            </button>
          </div>

          {!jarReady && (
            <p className="text-center text-xs text-stone-400">
              Minimum donation on Every.org is ${MIN_DONATION.toFixed(2)}.
            </p>
          )}

          {showSettings && (
            <div className="rounded-xl bg-stone-100 px-5 py-4 space-y-4">
              {/* Auto-donate threshold */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">
                  Auto-donate when jar reaches:
                </label>
                <div className="flex flex-wrap gap-2">
                  {THRESHOLD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        const updated = setAutoThreshold(opt.value);
                        setDonationSettingsState(updated);
                        haptic("light");
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        donationSettings.autoThresholdCents === opt.value * 100
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-stone-600 ring-1 ring-stone-200 hover:ring-emerald-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-stone-400">
                  {donationSettings.autoThresholdCents > 0
                    ? `The donation modal will pop up automatically when your jar hits $${(donationSettings.autoThresholdCents / 100).toFixed(0)}.`
                    : "Disabled — you'll donate manually whenever you want."}
                </p>
              </div>

              {/* Subscription mode */}
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={donationSettings.subscriptionMode}
                    onChange={(e) => {
                      const updated = setSubscriptionMode(e.target.checked);
                      setDonationSettingsState(updated);
                      haptic("light");
                    }}
                    className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-stone-700">
                    Monthly recurring donation
                  </span>
                </label>
                <p className="text-xs text-stone-400 ml-7">
                  {donationSettings.subscriptionMode
                    ? `Your average monthly offset is ~$${yearlyEstimate ? (yearlyEstimate / 12).toFixed(2) : "0.00"}. Every.org will set up a recurring donation.`
                    : "One-time donations. Enable this to set up automatic monthly giving based on your average offset."}
                </p>
              </div>
            </div>
          )}

          {showExplanation && (
            <div className="rounded-xl bg-stone-100 px-5 py-4 text-sm text-stone-600 space-y-4">
              <p>
                Each animal product has an estimated offset rate based on its
                welfare impact (e.g. red meat is higher than dairy).
                We multiply the amount of each ingredient by its rate and
                add them up.
              </p>

              <div className="space-y-1.5">
                <p className="font-medium text-stone-700">Your meal breakdown:</p>
                {items.map((item, i) => {
                  const contribution = itemContribution(item);
                  return (
                    <div key={i} className="flex justify-between">
                      <span>{item.name} ({item.amount} {item.unit})</span>
                      <span className="text-stone-500">
                        {contribution < 0.01 ? "<$0.01" : `$${contribution.toFixed(2)}`}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between border-t border-stone-300 pt-1.5 font-medium text-stone-700">
                  <span>Total</span>
                  <span>${donationAmount.toFixed(2)}</span>
                </div>
              </div>

              <p>
                These rates are rough estimates meant as a reasonable starting
                point, not an exact science.{" "}
                <a
                  href="https://www.farmkind.giving"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 text-emerald-600 hover:text-emerald-700"
                >
                  Learn more about FarmKind
                </a>
              </p>
            </div>
          )}

          <button
            onClick={handleStartOver}
            className="w-full rounded-full border border-stone-300 px-6 py-3 text-stone-700 transition-colors hover:bg-stone-100"
          >
            Log another meal
          </button>

          {/* Share your impact */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 space-y-3">
            <p className="text-sm font-medium text-stone-700 text-center">
              Spread the word
            </p>
            <ShareCard
              totalMeals={jar.mealCount}
              totalOffsetDollars={jarDollars}
              currentStreak={getStreakInfo(getHistory()).currentStreak}
              monthLabel={new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              compact
            />
          </div>

          <Link
            href="/history"
            className="block w-full text-center text-sm text-emerald-600 underline underline-offset-2 hover:text-emerald-700 font-medium"
          >
            View meal history
          </Link>
        </div>

        <p className="text-center text-xs text-stone-400">
          Plate2Offset is not affiliated with FarmKind. Donations go directly
          to FarmKind via Every.org.
        </p>
      </main>
    </div>
  );
}
