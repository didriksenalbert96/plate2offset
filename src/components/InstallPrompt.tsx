"use client";

import { useState, useEffect } from "react";
import { haptic } from "@/lib/haptic";

/**
 * PWA Install Prompt — shows a banner encouraging the user to install
 * the app on their home screen. Only appears on supported browsers
 * when the app is not already installed.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return !!localStorage.getItem("plate2offset_install_dismissed");
    } catch { return false; }
  });
  const [isStandalone] = useState(() =>
    typeof window !== "undefined" &&
    !!(window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone))
  );

  useEffect(() => {
    function handlePrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    haptic("medium");
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      haptic("success");
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setDismissed(true);
    setDeferredPrompt(null);
    try {
      localStorage.setItem("plate2offset_install_dismissed", "1");
    } catch { /* ignore */ }
  }

  // Don't show if already installed, dismissed, or no prompt available
  if (isStandalone || dismissed || !deferredPrompt) return null;

  return (
    <div className="rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-emerald-800">
            Add to home screen
          </p>
          <p className="text-xs text-emerald-600">
            Quick access — snap &amp; offset in seconds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-[0.97]"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-emerald-400 hover:text-emerald-600"
            aria-label="Dismiss install prompt"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
