import { useRef, useState, useEffect } from "react";
import { haptic } from "@/lib/haptic";

const IMAGE_MAX_SIZE = 768;
const IMAGE_QUALITY = 0.8;

interface PhotoUploadProps {
  photoBase64: string | null;
  onPhotoChange: (base64: string | null) => void;
}

/** Resize an image to fit within maxSize pixels on its longest side. */
function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Figure out the new dimensions (keep aspect ratio)
      let width = img.width;
      let height = img.height;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      // Draw resized image onto a canvas, then export as base64
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };

    img.src = url;
  });
}

/** Detect if we're on a mobile device (for showing camera button). */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    // Check for touch support and small screen as a proxy for mobile
    const mobile =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth < 768;
    setIsMobile(mobile);
  }, []);
  return isMobile;
}

export default function PhotoUpload({ photoBase64, onPhotoChange }: PhotoUploadProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    haptic("light");
    const base64 = await resizeImage(file, IMAGE_MAX_SIZE);
    onPhotoChange(base64);
    haptic("success");
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-700">
        {isMobile ? "Take or upload a meal photo" : "Upload a meal photo"}
      </label>

      {photoBase64 ? (
        <div className="relative">
          <img
            src={photoBase64}
            alt="Your meal"
            className="w-full rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={() => {
              onPhotoChange(null);
              haptic("light");
            }}
            className="absolute top-2 right-2 rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-stone-700 shadow hover:bg-white"
          >
            Remove
          </button>
        </div>
      ) : isMobile ? (
        /* Mobile: two prominent buttons — camera first */
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-50/50 py-4 text-emerald-600 transition-colors hover:border-emerald-500 hover:bg-emerald-50 active:scale-[0.98]"
          >
            {/* Camera icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <span className="text-sm font-semibold">Camera</span>
          </button>

          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-stone-300 py-4 text-stone-500 transition-colors hover:border-emerald-400 hover:text-emerald-600 active:scale-[0.98]"
          >
            {/* Gallery/upload icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <span className="text-sm font-medium">Gallery</span>
          </button>
        </div>
      ) : (
        /* Desktop: single upload button */
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="flex w-full flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-stone-300 py-5 text-stone-500 transition-colors hover:border-emerald-400 hover:text-emerald-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5m-9-9V3m0 5.25l3-3m-3 3l-3-3" />
          </svg>
          <span className="text-sm font-medium">Tap to upload a photo</span>
        </button>
      )}

      {/* Hidden file inputs */}
      {/* Camera input — uses capture="environment" for rear camera on mobile */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {/* Gallery input — no capture attribute, opens file picker / gallery */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
