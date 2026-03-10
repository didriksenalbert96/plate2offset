"use client";

/**
 * GroupJar — visual jar showing combined group offset total.
 */

import { buildDonateLink } from "@/lib/donate-link";

interface GroupJarProps {
  jarCents: number;
  memberCount: number;
  totalMeals: number;
}

export default function GroupJar({ jarCents, memberCount, totalMeals }: GroupJarProps) {
  const dollars = jarCents / 100;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 p-5 ring-1 ring-emerald-200 space-y-4">
      <h3 className="text-sm font-semibold text-stone-700">Group Jar</h3>

      {/* Jar visual */}
      <div className="flex items-end justify-center gap-1 h-24">
        <div className="relative w-20 h-20 rounded-xl border-2 border-emerald-300 bg-white overflow-hidden">
          <div
            className="absolute bottom-0 w-full bg-emerald-400/30 transition-all duration-500"
            style={{ height: `${Math.min(100, (dollars / 50) * 100)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-emerald-700">
              ${dollars.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div>
          <p className="font-bold text-stone-700">{memberCount}</p>
          <p className="text-stone-400">{memberCount === 1 ? "member" : "members"}</p>
        </div>
        <div>
          <p className="font-bold text-stone-700">{totalMeals}</p>
          <p className="text-stone-400">total meals</p>
        </div>
      </div>

      {dollars >= 0.5 && (
        <a
          href={buildDonateLink(dollars, "ONCE")}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
          Donate ${dollars.toFixed(2)} together
        </a>
      )}
    </div>
  );
}
