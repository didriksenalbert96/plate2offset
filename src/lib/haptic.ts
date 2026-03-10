/**
 * Haptic feedback utility — triggers vibration on supported devices.
 *
 * Uses the Vibration API (available on most Android browsers and
 * some iOS browsers). Silently does nothing on unsupported devices.
 */

type HapticStyle = "light" | "medium" | "heavy" | "success" | "error";

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],  // tap-pause-tap
  error: [50, 30, 50, 30, 50], // three pulses
};

export function haptic(style: HapticStyle = "light"): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(PATTERNS[style]);
  } catch {
    // Silently ignore — vibration is a nice-to-have
  }
}
