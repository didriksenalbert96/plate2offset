/**
 * Impact Factors — converts dollar offsets into tangible impact equivalents.
 *
 * Based on published cost-effectiveness estimates from animal charity evaluators.
 * These are rough illustrative numbers to make offset amounts feel concrete.
 *
 * Sources:
 * - Animal Charity Evaluators: ~$1-5 spares one animal from factory farming
 * - FarmKind focuses on corporate welfare campaigns and direct advocacy
 */

export interface ImpactEquivalent {
  label: string;
  value: string;
  icon: string; // SVG path or emoji placeholder
}

/** Cost in cents to spare one animal from factory farming (rough ACE median). */
const CENTS_PER_ANIMAL_SPARED = 200; // ~$2 per animal

/** Cost in cents per hour of funded advocacy work. */
const CENTS_PER_ADVOCACY_HOUR = 2500; // ~$25/hour

/** Cost in cents per corporate campaign day funded. */
const CENTS_PER_CAMPAIGN_DAY = 5000; // ~$50/day

/**
 * Convert a total offset amount (in cents) to tangible impact equivalents.
 * Returns up to 3 most relevant equivalents based on the amount.
 */
export function getImpactEquivalents(totalCents: number): ImpactEquivalent[] {
  if (totalCents <= 0) return [];

  const results: ImpactEquivalent[] = [];

  // Animals spared
  const animalsSpared = totalCents / CENTS_PER_ANIMAL_SPARED;
  if (animalsSpared >= 0.1) {
    results.push({
      label: animalsSpared >= 2 ? "animals potentially spared" : "animal potentially spared",
      value: animalsSpared >= 10 ? `~${Math.round(animalsSpared)}` : `~${animalsSpared.toFixed(1)}`,
      icon: "animal",
    });
  }

  // Advocacy hours funded
  const advocacyHours = totalCents / CENTS_PER_ADVOCACY_HOUR;
  if (advocacyHours >= 0.1) {
    results.push({
      label: advocacyHours >= 2 ? "hours of advocacy funded" : "hour of advocacy funded",
      value: advocacyHours >= 10 ? `~${Math.round(advocacyHours)}` : `~${advocacyHours.toFixed(1)}`,
      icon: "megaphone",
    });
  }

  // Campaign days
  const campaignDays = totalCents / CENTS_PER_CAMPAIGN_DAY;
  if (campaignDays >= 0.1) {
    results.push({
      label: campaignDays >= 2 ? "days of campaign work funded" : "day of campaign work funded",
      value: campaignDays >= 10 ? `~${Math.round(campaignDays)}` : `~${campaignDays.toFixed(1)}`,
      icon: "calendar",
    });
  }

  return results.slice(0, 3);
}

/**
 * Get a single headline impact statement for sharing/display.
 */
export function getImpactHeadline(totalCents: number): string {
  if (totalCents <= 0) return "Start logging meals to see your impact.";

  const animalsSpared = totalCents / CENTS_PER_ANIMAL_SPARED;
  if (animalsSpared >= 1) {
    return `Your offsets could help spare ~${Math.round(animalsSpared)} animals from factory farming.`;
  }
  if (animalsSpared >= 0.5) {
    return "You're halfway to sparing your first animal from factory farming.";
  }
  return "Every meal logged helps build toward real impact for farmed animals.";
}
