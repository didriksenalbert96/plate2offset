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
 * Generates a shareable impact card using Canvas API.
 * Share button uses Web Share API on mobile, or copies image on desktop.
 * Download button saves as PNG.
 */
export default function ShareCard({
  totalMeals,
  totalOffsetDollars,
  currentStreak,
  monthLabel,
}: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  function drawCard(): HTMLCanvasElement | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const W = 600;
    const H = 440;
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

    // Draw scale logo
    drawScaleLogo(ctx, W / 2, 72, 0.7);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Plate2Offset", W / 2, 110);

    // Personal headline
    ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("I offset my meat consumption!", W / 2, 135);

    // Month
    ctx.font = "14px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText(monthLabel, W / 2, 164);

    // Main stat
    ctx.font = "bold 60px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${totalMeals}`, W / 2, 235);

    ctx.font = "18px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(
      totalMeals === 1 ? "meal offset" : "meals offset",
      W / 2,
      260,
    );

    // Stats row
    const statsY = 325;
    const colW = (W - 60) / 2;

    // Donated
    ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`$${totalOffsetDollars.toFixed(2)}`, 30 + colW / 2, statsY);
    ctx.font = "13px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("total donated", 30 + colW / 2, statsY + 22);

    // Streak
    ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      `${currentStreak} day${currentStreak !== 1 ? "s" : ""}`,
      30 + colW + colW / 2,
      statsY,
    );
    ctx.font = "13px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("current streak", 30 + colW + colW / 2, statsY + 22);

    // Divider between stats
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2, statsY - 22);
    ctx.lineTo(W / 2, statsY + 28);
    ctx.stroke();

    // Footer
    ctx.font = "13px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("plate2offset.vercel.app", W / 2, H - 28);

    return canvas;
  }

  /** Draw a simplified scale/balance icon */
  function drawScaleLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    // Balance beam
    ctx.beginPath();
    ctx.moveTo(-28, -4);
    ctx.lineTo(28, -8);
    ctx.stroke();

    // Fulcrum triangle
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-5, 6);
    ctx.lineTo(5, 6);
    ctx.closePath();
    ctx.fill();

    // Base
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(0, 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, 14);
    ctx.lineTo(10, 14);
    ctx.stroke();

    // Left plate (food side)
    ctx.beginPath();
    ctx.ellipse(-28, -4, 12, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Right plate (heart/offset side)
    ctx.beginPath();
    ctx.ellipse(28, -8, 12, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  async function getBlob(): Promise<Blob | null> {
    const canvas = drawCard();
    if (!canvas) return null;
    return new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
  }

  async function handleShare() {
    setGenerating(true);
    haptic("light");

    try {
      const blob = await getBlob();
      if (!blob) { setGenerating(false); return; }

      const file = new File([blob], "plate2offset-impact.png", { type: "image/png" });

      // Try native Web Share API (mobile + some desktop browsers)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "My Plate2Offset Impact",
          text: `I\u2019ve offset ${totalMeals} meal${totalMeals !== 1 ? "s" : ""} with Plate2Offset!`,
          files: [file],
        });
        haptic("success");
        setGenerating(false);
        return;
      }

      // Desktop fallback: copy image to clipboard
      if (navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        haptic("success");
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        setGenerating(false);
        return;
      }

      // Final fallback: download
      handleDownload();
    } catch {
      // User cancelled or error — silently ignore
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
        {/* Scale icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40" className="mx-auto mb-1 h-8 w-14 opacity-80">
          <line x1="12" y1="18" x2="68" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="40,16 35,26 45,26" fill="white" />
          <line x1="40" y1="26" x2="40" y2="34" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="30" y1="34" x2="50" y2="34" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="12" cy="18" rx="12" ry="4" fill="none" stroke="white" strokeWidth="2" />
          <ellipse cx="68" cy="14" rx="12" ry="4" fill="none" stroke="white" strokeWidth="2" />
        </svg>

        <p className="font-bold text-lg">Plate2Offset</p>
        <p className="font-semibold text-sm mt-2">
          I offset my meat consumption!
        </p>

        <p className="text-xs opacity-80 mt-2">{monthLabel}</p>
        <p className="mt-1 text-5xl font-bold">{totalMeals}</p>
        <p className="text-sm opacity-90">
          {totalMeals === 1 ? "meal offset" : "meals offset"}
        </p>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <div>
            <p className="font-bold text-lg">${totalOffsetDollars.toFixed(2)}</p>
            <p className="opacity-70 text-xs">donated</p>
          </div>
          <div className="w-px bg-white/20" />
          <div>
            <p className="font-bold text-lg">{currentStreak} day{currentStreak !== 1 ? "s" : ""}</p>
            <p className="opacity-70 text-xs">streak</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleShare}
          disabled={generating}
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {/* Share icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M13 4.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm0 11a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zM2 10a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm10.036-4.04a.75.75 0 01-.036.14l-4.5 3a.75.75 0 01-.832-1.248l4.5-3a.75.75 0 011.018.258l-.15-.15zm-.068 8.08a.75.75 0 01.068-.14l.15-.15a.75.75 0 01-1.018.258l-4.5-3a.75.75 0 11.832-1.248l4.5 3a.75.75 0 01-.032.28z" />
          </svg>
          {generating ? "Sharing..." : copied ? "Copied to clipboard!" : "Share"}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 rounded-full border border-stone-300 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100"
        >
          {/* Download icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
          Save
        </button>
      </div>
    </div>
  );
}
