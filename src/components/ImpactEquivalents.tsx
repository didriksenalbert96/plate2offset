"use client";

/**
 * ImpactEquivalents — displays tangible impact translations for offset amounts.
 */

import type { ReactNode } from "react";
import { getImpactEquivalents, getImpactHeadline, type ImpactEquivalent } from "@/lib/impact-factors";

const ICONS: Record<string, ReactNode> = {
  animal: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  ),
  megaphone: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.53 13.72a2 2 0 01-.77-2.72l.08-.14a2 2 0 012.72-.77l12.5 7.22a2 2 0 01.77 2.72l-.08.14a2 2 0 01-2.72.77L3.53 13.72zM18 3a2 2 0 012 2v2a2 2 0 01-2 2 2 2 0 01-2-2V5a2 2 0 012-2z" />
    </svg>
  ),
  calendar: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V9h14v10z" />
    </svg>
  ),
};

export default function ImpactEquivalents({ totalCents }: { totalCents: number }) {
  const equivalents = getImpactEquivalents(totalCents);
  const headline = getImpactHeadline(totalCents);

  if (equivalents.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 text-center">
        <p className="text-sm text-stone-500">{headline}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 space-y-4">
      <h2 className="text-sm font-semibold text-stone-700">Your impact</h2>
      <p className="text-sm text-emerald-700">{headline}</p>

      <div className="grid gap-3">
        {equivalents.map((eq: ImpactEquivalent) => (
          <div
            key={eq.label}
            className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100"
          >
            <div className="text-emerald-500 flex-shrink-0">
              {ICONS[eq.icon] ?? ICONS.animal}
            </div>
            <div>
              <span className="text-lg font-bold text-emerald-700">{eq.value}</span>{" "}
              <span className="text-sm text-emerald-600">{eq.label}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-stone-400 leading-tight">
        Estimates based on published cost-effectiveness data from animal charity evaluators.
        Actual impact varies.
      </p>
    </div>
  );
}
