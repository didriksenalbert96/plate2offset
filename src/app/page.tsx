"use client";

import { useState } from "react";
import MealInput from "@/components/MealInput";
import PhotoUpload from "@/components/PhotoUpload";
import AnalyzingSpinner from "@/components/AnalyzingSpinner";
import ReviewScreen from "@/components/ReviewScreen";
import type { MealItem } from "@/lib/types";
import Link from "next/link";
import { calculateOffset, itemContribution } from "@/lib/calculate-offset";
import { buildDonateLink } from "@/lib/donate-link";

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

  const hasInput = description.trim().length > 0 || photoBase64 !== null;

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
    setStep("donate");
  }

  function handleStartOver() {
    setStep("input");
    setItems([]);
    setDescription("");
    setPhotoBase64(null);
    setError(null);
    setDonationAmount(0);
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
              with a small donation.
            </p>
          </div>

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
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-stone-50 to-emerald-50 px-4 py-12">
      <main className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-900">
            Suggested donation
          </h2>
          <p className="mt-1 text-stone-600">
            Based on your meal, here&apos;s a suggested amount to help farmed
            animals through FarmKind.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200 text-center space-y-4">
          <p className="text-5xl font-bold text-emerald-600">
            ${donationAmount.toFixed(2)}
          </p>
          <p className="text-sm text-stone-500">
            This is just a suggestion. Donate any amount you&apos;re comfortable with.
          </p>
          {donationAmount < MIN_DONATION && (
            <p className="text-sm text-stone-400">
              Note: Every.org has a minimum donation of $0.50.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <a
            href={buildDonateLink(Math.max(MIN_DONATION, donationAmount))}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-full bg-emerald-600 px-6 py-3 text-center text-lg font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Donate via Every.org
          </a>

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
            Start over
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
