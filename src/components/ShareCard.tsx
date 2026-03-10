"use client";

import { useRef, useState } from "react";
import { haptic } from "@/lib/haptic";

interface ShareCardProps {
  totalMeals: number;
  totalOffsetDollars: number;
  currentStreak: number;
  monthLabel: string; // e.g. "March 2026"
}

const APP_URL = "https://plate2offset.vercel.app";

export default function ShareCard({
  totalMeals,
  totalOffsetDollars,
  currentStreak,
  monthLabel,
}: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `I\u2019ve offset ${totalMeals} meal${totalMeals !== 1 ? "s" : ""} with Plate2Offset! $${totalOffsetDollars.toFixed(2)} donated to help farmed animals.`;

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

    ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`$${totalOffsetDollars.toFixed(2)}`, 30 + colW / 2, statsY);
    ctx.font = "13px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillText("total donated", 30 + colW / 2, statsY + 22);

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

  function drawScaleLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(-28, -4);
    ctx.lineTo(28, -8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-5, 6);
    ctx.lineTo(5, 6);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(0, 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, 14);
    ctx.lineTo(10, 14);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(-28, -4, 12, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(28, -8, 12, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  async function handleShare() {
    haptic("light");

    // Try native Web Share API first (mobile)
    try {
      const canvas = drawCard();
      if (canvas && navigator.share && navigator.canShare) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
        if (blob) {
          const file = new File([blob], "plate2offset-impact.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: "My Plate2Offset Impact",
              text: shareText,
              files: [file],
            });
            haptic("success");
            return;
          }
        }
      }
    } catch {
      // User cancelled or not supported — fall through to menu
    }

    // Desktop / fallback: show social sharing menu
    setShowShareMenu(true);
  }

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(`${shareText} ${APP_URL}`);
      haptic("success");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
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
  }

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(APP_URL);

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-center text-white shadow-lg">
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

      {/* Share & save buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M13 4.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm0 11a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zM2 10a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm10.036-4.04a.75.75 0 01-.036.14l-4.5 3a.75.75 0 01-.832-1.248l4.5-3a.75.75 0 011.018.258l-.15-.15zm-.068 8.08a.75.75 0 01.068-.14l.15-.15a.75.75 0 01-1.018.258l-4.5-3a.75.75 0 11.832-1.248l4.5 3a.75.75 0 01-.032.28z" />
          </svg>
          Share
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 rounded-full border border-stone-300 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
          Save
        </button>
      </div>

      {/* Social sharing panel (desktop fallback) */}
      {showShareMenu && (
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-stone-700">Share on</p>
            <button
              onClick={() => setShowShareMenu(false)}
              className="p-1 text-stone-400 hover:text-stone-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {/* X / Twitter */}
            <a
              href={`https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-lg p-3 hover:bg-stone-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <span className="text-xs text-stone-600">X</span>
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-lg p-3 hover:bg-stone-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <span className="text-xs text-stone-600">Facebook</span>
            </a>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${APP_URL}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-lg p-3 hover:bg-stone-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <span className="text-xs text-stone-600">WhatsApp</span>
            </a>

            {/* LinkedIn */}
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-lg p-3 hover:bg-stone-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A66C2] text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </div>
              <span className="text-xs text-stone-600">LinkedIn</span>
            </a>

            {/* Reddit */}
            <a
              href={`https://reddit.com/submit?url=${encodedUrl}&title=${encodedText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 rounded-lg p-3 hover:bg-stone-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF4500] text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 0-.462.342.342 0 0 0-.461 0c-.545.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.206-.095z" />
                </svg>
              </div>
              <span className="text-xs text-stone-600">Reddit</span>
            </a>

            {/* Email */}
            <a
              href={`mailto:?subject=${encodeURIComponent("Check out Plate2Offset!")}&body=${encodeURIComponent(`${shareText}\n\n${APP_URL}`)}`}
              className="flex flex-col items-center gap-1.5 rounded-lg p-3 hover:bg-stone-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-600 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                  <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                </svg>
              </div>
              <span className="text-xs text-stone-600">Email</span>
            </a>

            {/* Copy text */}
            <button
              onClick={handleCopyText}
              className="flex flex-col items-center gap-1.5 rounded-lg p-3 hover:bg-stone-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-400 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                  <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.44A1.5 1.5 0 008.378 6H4.5z" />
                </svg>
              </div>
              <span className="text-xs text-stone-600">
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>

            {/* Save image */}
            <button
              onClick={handleDownload}
              className="flex flex-col items-center gap-1.5 rounded-lg p-3 hover:bg-stone-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
              </div>
              <span className="text-xs text-stone-600">Save</span>
            </button>
          </div>

          <p className="text-xs text-stone-400 text-center">
            Save the image first, then attach it to your post
          </p>
        </div>
      )}
    </div>
  );
}
