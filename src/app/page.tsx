"use client";

import { useState, useEffect } from "react";
import MealInput from "@/components/MealInput";
import PhotoUpload from "@/components/PhotoUpload";
import AnalyzingSpinner from "@/components/AnalyzingSpinner";
import ReviewScreen from "@/components/ReviewScreen";
import type { MealItem } from "@/lib/types";
import Link from "next/link";
import { calculateOffset, itemContribution } from "@/lib/calculate-offset";
import { buildDonateLink } from "@/lib/donate-link";
import { getJar, addToJar, clearJar, setMealsPerDay, estimateYearlyOffset, type JarState } from "@/lib/offset-jar";

const MIN_DONATION = 0.5;

// The app has four screens, shown one at a time:
//   "input"    → user types a description or uploads a photo
//   "loading"  → spinner while AI analyzes
//   "review"   → user sees & edits the ingredient list
//   "donate"   → shows suggested donation + link to Every.org
type Step = "input" | "loading" | "review" | "donate";

export default function Home() {
  const [step, setStep] = useState<Step>("input");
  const [description, setDescription] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [items, setItems] = useState<MealItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [jar, setJar] = useState<JarState>({ totalCents: 0, mealCount: 0, mealsPerDay: 3 });
  const [donateClicked, setDonateClicked] = useState(false);

  // Load jar state from localStorage on mount
  useEffect(() => {
    setJar(getJar());
  }, []);

  const hasInput = description.trim().length > 0 || photoBase64 !== null;
  const jarDollars = jar.totalCents / 100;
  const jarReady = jar.totalCents >= 50;

  async function handleAnalyze() {
    setError(null);
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
        setStep("input");
        return;
      }

      setItems(data.items);
      setStep("review");
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Could not connect to the server. Please check your connection."
          : "Something went wrong analyzing your meal. Please try again.";
      setError(message);
      setStep("input");
    }
  }

  function handleConfirm() {
    const amount = calculateOffset(items);
    setDonationAmount(amount);
    const updatedJar = addToJar(Math.round(amount * 100));
    setJar(updatedJar);
    setDonateClicked(false);
    setStep("donate");
  }

  function handleStartOver() {
    setStep("input");
    setItems([]);
    setDescription("");
    setPhotoBase64(null);
    setError(null);
    setDonationAmount(0);
    setDonateClicked(false);
    setShowExplanation(false);
    // Jar is NOT cleared — it persists across meals
  }

  function handleClearJar() {
    clearJar();
    setJar({ totalCents: 0, mealCount: 0, mealsPerDay: 3 });
  }

  function handleDonateClick() {
    setDonateClicked(true);
  }

  function handleConfirmDonated() {
    handleClearJar();
    handleStartOver();
  }

  // ── Input screen ──────────────────────────────────────────────
  if (step === "input") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-50 to-emerald-50 px-4 py-12">
        <main className="w-full max-w-md space-y-8">
          <div className="text-center">
            {/* Plate-as-scale logo */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60" className="mx-auto mb-4 h-24 w-28">
              {/* Balance beam - slightly tilted to show "offsetting" */}
              <line x1="12" y1="26" x2="68" y2="22" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round" />
              {/* Fulcrum triangle */}
              <polygon points="40,24 35,34 45,34" fill="#a8a29e" />
              {/* Left pan - plate with food */}
              <ellipse cx="18" cy="26" rx="14" ry="5" fill="none" stroke="#a8a29e" strokeWidth="1.5" />
              {/* Food on left plate: drumstick */}
              <ellipse cx="15" cy="23" rx="4" ry="2.5" fill="#f59e0b" transform="rotate(-20 15 23)" />
              <line x1="19" y1="22" x2="23" y2="19" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
              {/* Food on left plate: small circle (cheese/egg) */}
              <circle cx="12" cy="24" r="2" fill="#fbbf24" />
              {/* Right pan - heart + leaf */}
              <ellipse cx="62" cy="22" rx="14" ry="5" fill="none" stroke="#a8a29e" strokeWidth="1.5" />
              {/* Heart on right plate */}
              <path d="M62 17c-1.5-2-4-2.5-5-1s0 4 5 7c5-3 6-5.5 5-7s-3.5-1-5 1z" fill="#10b981" />
              {/* Leaf on right plate */}
              <path d="M57 20c-2-3-1.5-5-1.5-5s3 0.5 3.5 3z" fill="#34d399" />
              {/* Base */}
              <line x1="32" y1="34" x2="48" y2="34" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round" />
              {/* Stand */}
              <line x1="40" y1="34" x2="40" y2="40" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round" />
              <line x1="33" y1="40" x2="47" y2="40" stroke="#a8a29e" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <h1 className="text-3xl font-bold text-stone-900">Plate2Offset</h1>
            <p className="mt-2 text-stone-600">
              Offset the impact of your meals on farmed animals
              with a small donation. Log multiple meals to estimate
              your yearly offset.
            </p>
          </div>

          {jar.mealCount > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  Offset jar: ${jarDollars.toFixed(2)}
                </p>
                <p className="text-xs text-emerald-600">
                  from {jar.mealCount} {jar.mealCount === 1 ? "meal" : "meals"}
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

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 space-y-6">
            <PhotoUpload
              photoBase64={photoBase64}
              onPhotoChange={setPhotoBase64}
            />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-stone-200" />
              <span className="text-sm text-stone-400">and / or</span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>

            <MealInput value={description} onChange={setDescription} />

            <p className="text-xs text-stone-400">
              Tip: Describe multiple meals at once for a bigger offset.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            disabled={!hasInput}
            onClick={handleAnalyze}
            className="w-full rounded-full bg-emerald-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            Analyze my meal
          </button>

          <p className="text-center">
            <Link
              href="/about"
              className="text-sm text-stone-400 underline underline-offset-2 hover:text-stone-600"
            >
              What is this about?
            </Link>
          </p>
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-50 to-emerald-50 px-4 py-12">
      <main className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-900">
            {jarReady ? "Ready to donate" : "Added to your jar"}
          </h2>
          <p className="mt-1 text-stone-600">
            {jarReady
              ? "Your offset jar has reached a donatable amount."
              : "Keep logging meals to build up your offset."}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200 text-center space-y-4">
          {/* This meal amount */}
          <p className="text-sm text-stone-500">
            This meal: <span className="font-medium text-stone-700">${donationAmount.toFixed(2)}</span>
          </p>

          {/* Jar total — the main number */}
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
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
                <span>meals per day</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {donateClicked ? (
            <div className="rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200 space-y-4 text-center">
              <p className="font-medium text-stone-900">
                Did you complete the donation?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmDonated}
                  className="flex-1 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  Yes, clear my jar
                </button>
                <button
                  onClick={() => setDonateClicked(false)}
                  className="flex-1 rounded-full border border-stone-300 px-4 py-3 text-sm text-stone-700 transition-colors hover:bg-stone-100"
                >
                  Not yet
                </button>
              </div>
            </div>
          ) : (
            <>
              <a
                href={buildDonateLink(donateAmount)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDonateClick}
                className="block w-full rounded-full bg-emerald-600 px-6 py-3 text-center text-lg font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Donate ${donateAmount.toFixed(2)} via Every.org
              </a>

              {!jarReady && (
                <p className="text-center text-xs text-stone-400">
                  The minimum donation on Every.org is ${MIN_DONATION.toFixed(2)}.
                </p>
              )}
            </>
          )}

          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full text-center text-sm text-stone-500 underline underline-offset-2 hover:text-stone-700"
          >
            {showExplanation ? "Hide explanation" : "How is this calculated?"}
          </button>

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
        </div>

        <p className="text-center text-xs text-stone-400">
          Plate2Offset is not affiliated with FarmKind. Donations go directly
          to FarmKind via Every.org.
        </p>
      </main>
    </div>
  );
}
