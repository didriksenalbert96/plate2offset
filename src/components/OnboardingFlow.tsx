"use client";

/**
 * OnboardingFlow — 3-step first-time user experience.
 * Shows once, tracked via localStorage flag.
 */

import { useState } from "react";

const ONBOARDING_KEY = "plate2offset_onboarding_done";

const STEPS = [
  {
    title: "Welcome to Plate2Offset",
    description:
      "Offset the impact of your meals on farmed animals with small, effective donations. No judgment — just positive action.",
  },
  {
    title: "How it works",
    description:
      "Take a photo of your meal or describe it. AI identifies the animal products. You see a suggested offset amount and can donate to FarmKind.",
  },
  {
    title: "Ready to start",
    description:
      "Log your first meal to see how it works. Every meal you offset helps fund advocacy for farmed animals.",
  },
];

export default function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(ONBOARDING_KEY) !== "true";
  });

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem(ONBOARDING_KEY, "true");
      setShow(false);
    }
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShow(false);
  }

  if (!show) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-5">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-emerald-500" : "w-1.5 bg-stone-200"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center space-y-3">
          <h2 className="text-lg font-bold text-stone-900">{current.title}</h2>
          <p className="text-sm text-stone-500 leading-relaxed">{current.description}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 transition"
          >
            {step === STEPS.length - 1 ? "Get started" : "Next"}
          </button>
          {step < STEPS.length - 1 && (
            <button
              onClick={handleSkip}
              className="py-3 px-4 text-sm text-stone-400 hover:text-stone-600 transition"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
