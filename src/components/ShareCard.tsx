"use client";

import { useRef, useState } from "react";
import { haptic } from "@/lib/haptic";

interface ShareCardProps {
  totalMeals: number;
  totalOffsetDollars: number;
  currentStreak: number;
  monthLabel: string; // e.g. "March 2026"
}

/**
 * Generates a beautiful shareable impact card using Canvas API.
 * User can download as PNG or share via Web Share API.
 */
export default function ShareCard({
  totalMeals,
  totalOffsetDollars,
  currentStreak,
  monthLabel,
}: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);

  function drawCard(): HTMLCanvasElement | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const W = 600;
    const H = 400;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background gradient (emerald)
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#059669");
    grad.addColorStop(1, "#047857");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 24);
    ctx.fill();

    // Subtle pattern overlay
    ctx.globalAlpha = 0.05;
    for (let x = 0; x < W; x += 40) {
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // White card area
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.roundRect(30, 30, W - 60, H - 60, 16);
    ctx.fill();

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Plate2Offset", W / 2, 80);

    // Month
    ctx.font = "16px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText(monthLabel, W / 2, 108);

    // Main stat
    ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${totalMeals}`, W / 2, 195);

    ctx.font = "20px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(
      totalMeals === 1 ? "meal offset" : "meals offset",
      W / 2,
      225,
    );

    // Stats row
    const statsY = 290;
    const colW = (W - 60) / 2;

    // Donated
    ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`$${totalOffsetDollars.toFixed(2)}`, 30 + colW / 2, statsY);
    ctx.font = "14px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText("total donated", 30 + colW / 2, statsY + 22);

    // Streak
    ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      `${currentStreak} day${currentStreak !== 1 ? "s" : ""}`,
      30 + colW + colW / 2,
      statsY,
    );
    ctx.font = "14px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText("current streak", 30 + colW + colW / 2, statsY + 22);

    // Divider between stats
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2, statsY - 25);
    ctx.lineTo(W / 2, statsY + 30);
    ctx.stroke();

    // Footer
    ctx.font = "13px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText(
      "plate2offset.vercel.app",
      W / 2,
      H - 30,
    );

    return canvas;
  }

  async function handleShare() {
    setGenerating(true);
    haptic("light");
    const canvas = drawCard();
    if (!canvas) {
      setGenerating(false);
      return;
    }

    try {
      // Try Web Share API first (mobile)
      if (navigator.share && navigator.canShare) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
        if (blob) {
          const file = new File([blob], "plate2offset-impact.png", {
            type: "image/png",
          });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: "My Plate2Offset Impact",
              text: `I've offset ${totalMeals} meals this month with Plate2Offset!`,
              files: [file],
            });
            haptic("success");
            setGenerating(false);
            return;
          }
        }
      }

      // Fallback: download
      handleDownload();
    } catch {
      // User cancelled share or error — fall through
    }
    setGenerating(false);
  }

  function handleDownload() {
    const canvas = drawCard();
    if (!canvas) return;

    haptic("light");
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "plate2offset-impact.png";
    a.click();
    setGenerating(false);
  }

  return (
    <div className="space-y-3">
      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview card (CSS version) */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-center text-white shadow-lg">
        <p className="text-sm font-medium opacity-80">{monthLabel}</p>
        <p className="mt-1 text-5xl font-bold">{totalMeals}</p>
        <p className="text-sm opacity-90">
          {totalMeals === 1 ? "meal offset" : "meals offset"}
        </p>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <div>
            <p className="font-bold text-lg">${totalOffsetDollars.toFixed(2)}</p>
            <p className="opacity-75">donated</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="font-bold text-lg">{currentStreak} day{currentStreak !== 1 ? "s" : ""}</p>
            <p className="opacity-75">streak</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleShare}
          disabled={generating}
          className="flex-1 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {generating ? "Generating..." : "Share"}
        </button>
        <button
          onClick={handleDownload}
          className="rounded-full border border-stone-300 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100"
        >
          Download
        </button>
      </div>
    </div>
  );
}
