/**
 * Donation Settings — localStorage-based preferences for donation behavior.
 *
 * Manages auto-donate threshold and subscription mode settings.
 */

const STORAGE_KEY = "plate2offset_donation_settings";

export interface DonationSettings {
  /** Auto-donate when jar reaches this amount in cents. 0 = disabled. */
  autoThresholdCents: number;
  /** Whether subscription (recurring monthly) mode is preferred. */
  subscriptionMode: boolean;
}

const DEFAULTS: DonationSettings = {
  autoThresholdCents: 0,
  subscriptionMode: false,
};

function read(): DonationSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      autoThresholdCents:
        typeof parsed.autoThresholdCents === "number"
          ? parsed.autoThresholdCents
          : 0,
      subscriptionMode:
        typeof parsed.subscriptionMode === "boolean"
          ? parsed.subscriptionMode
          : false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function write(settings: DonationSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getDonationSettings(): DonationSettings {
  return read();
}

export function setAutoThreshold(dollars: number): DonationSettings {
  const settings = read();
  settings.autoThresholdCents = Math.round(dollars * 100);
  write(settings);
  return settings;
}

export function setSubscriptionMode(enabled: boolean): DonationSettings {
  const settings = read();
  settings.subscriptionMode = enabled;
  write(settings);
  return settings;
}

/** Predefined threshold options in dollars. */
export const THRESHOLD_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 2, label: "$2" },
  { value: 5, label: "$5" },
  { value: 10, label: "$10" },
  { value: 20, label: "$20" },
];
