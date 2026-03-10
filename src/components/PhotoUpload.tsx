import { useRef } from "react";

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

export default function PhotoUpload({ photoBase64, onPhotoChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const base64 = await resizeImage(file, IMAGE_MAX_SIZE);
    onPhotoChange(base64);
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-700">
        Upload a meal photo
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
            onClick={() => onPhotoChange(null)}
            className="absolute top-2 right-2 rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-stone-700 shadow hover:bg-white"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-stone-300 py-8 text-stone-500 transition-colors hover:border-emerald-400 hover:text-emerald-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5m-9-9V3m0 5.25l3-3m-3 3l-3-3" />
          </svg>
          <span className="text-sm font-medium">Tap to upload a photo</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
