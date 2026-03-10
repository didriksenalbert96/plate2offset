"use client";

import { useState } from "react";
import { haptic } from "@/lib/haptic";

interface DonateModalProps {
  amount: number;
  frequency: "ONCE" | "MONTHLY";
  onClose: () => void;
  onDonationComplete: () => void;
}

/**
 * In-app donation modal using Every.org's embed widget.
 *
 * Every.org provides an embeddable donation form via iframe.
 * The widget URL format: https://www.every.org/farmkind/donate?amount=X&frequency=Y
 * Using their /donate path with embedded=true gives a clean form.
 */
export default function DonateModal({
  amount,
  frequency,
  onClose,
  onDonationComplete,
}: DonateModalProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLocal] = useState(() =>
    typeof window !== "undefined" &&
    (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  );

  const embedUrl = `https://www.every.org/farmkind/donate?amount=${amount.toFixed(2)}&frequency=${frequency}#/donate`;

  function handleDone() {
    setShowConfirmation(true);
  }

  function handleConfirmDonated() {
    haptic("success");
    onDonationComplete();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h3 className="font-semibold text-stone-900">
            Donate ${amount.toFixed(2)} to FarmKind
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Iframe or confirmation */}
        {showConfirmation ? (
          <div className="p-6 space-y-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-emerald-600">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="font-medium text-stone-900">
              Did you complete the donation?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmDonated}
                className="flex-1 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Yes, clear my jar
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 rounded-full border border-stone-300 px-4 py-3 text-sm text-stone-700 hover:bg-stone-100"
              >
                Go back
              </button>
            </div>
          </div>
        ) : (
          <>
            {isLocal ? (
              <div className="p-6 space-y-4 text-center">
                <p className="text-sm text-stone-600">
                  The Every.org donation form can&apos;t load on localhost.
                  Click below to donate in a new tab:
                </p>
                <a
                  href={embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Open Every.org &rarr;
                </a>
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <iframe
                  src={embedUrl}
                  className="w-full h-[500px] border-0"
                  title="Donate via Every.org"
                  allow="payment"
                />
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-4 border-t border-stone-200 space-y-2">
              <button
                onClick={handleDone}
                className="w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                I&apos;ve finished donating
              </button>
              <p className="text-center text-xs text-stone-400">
                Donations go directly to FarmKind via Every.org
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
