// @ts-check
/** Annual accounting, not a solar-production or hourly dispatch model.
 * Annual generation must come from a location-specific estimate such as PVWatts.
 * @param {{dailyKwh: number, annualGenerationKwh: number, selfConsumedFraction: number, retailRate: number, exportRate: number, installedCost: number, annualMaintenance: number}} input
 */
export function estimateSolarEconomics(input) {
  const { dailyKwh, annualGenerationKwh, selfConsumedFraction, retailRate, exportRate, installedCost, annualMaintenance } = input;
  if (![dailyKwh, annualGenerationKwh, selfConsumedFraction, retailRate, exportRate, installedCost, annualMaintenance].every((n) => Number.isFinite(n) && n >= 0) || selfConsumedFraction > 1) return null;
  const annualUseKwh = dailyKwh * 365;
  const selfConsumedKwh = annualGenerationKwh * selfConsumedFraction;
  // An assumed self-consumption share cannot exceed total household consumption.
  if (selfConsumedKwh > annualUseKwh) return null;
  const exportedKwh = annualGenerationKwh - selfConsumedKwh;
  const annualSavings = selfConsumedKwh * retailRate + exportedKwh * exportRate - annualMaintenance;
  const generationPercentOfUse = annualUseKwh > 0 ? annualGenerationKwh / annualUseKwh * 100 : null;
  const simplePaybackYears = annualSavings > 0 ? installedCost / annualSavings : null;
  if (![annualUseKwh, selfConsumedKwh, exportedKwh, annualSavings].every(Number.isFinite) ||
      (generationPercentOfUse !== null && !Number.isFinite(generationPercentOfUse)) ||
      (simplePaybackYears !== null && !Number.isFinite(simplePaybackYears))) return null;
  return { annualUseKwh, annualGenerationKwh, selfConsumedKwh, exportedKwh, generationPercentOfUse, annualSavings, simplePaybackYears };
}
