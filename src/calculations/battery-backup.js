// @ts-check
/** @typedef {{essentialKwhPerDay: number, outageDays: number, usableBatteryKwh: number, availableFraction: number, deliveryEfficiency: number}} BatteryInputs */

/** Stored-energy estimate at a constant average load; no power adequacy claim.
 * Usable capacity already excludes the manufacturer's unusable capacity.
 * availableFraction is the share of that usable capacity available at outage start.
 * @param {BatteryInputs} input
 */
export function estimateBatteryBackup(input) {
  const { essentialKwhPerDay, outageDays, usableBatteryKwh, availableFraction, deliveryEfficiency } = input;
  if (![essentialKwhPerDay, outageDays, usableBatteryKwh, availableFraction, deliveryEfficiency].every(Number.isFinite) ||
      essentialKwhPerDay < 0 || outageDays <= 0 || usableBatteryKwh < 0 ||
      availableFraction < 0 || availableFraction > 1 || deliveryEfficiency <= 0 || deliveryEfficiency > 1) return null;
  const requiredKwh = essentialKwhPerDay * outageDays;
  const deliveredKwh = usableBatteryKwh * availableFraction * deliveryEfficiency;
  const backupHours = essentialKwhPerDay > 0 ? deliveredKwh / essentialKwhPerDay * 24 : null;
  if (![requiredKwh, deliveredKwh].every(Number.isFinite) || (backupHours !== null && !Number.isFinite(backupHours))) return null;
  return { requiredKwh, deliveredKwh, backupHours, shortfallKwh: Math.max(0, requiredKwh - deliveredKwh) };
}

/** A numeric screening only, using ratings in kW; equipment compatibility is separate.
 * @param {{continuousKw: number, surgeKw: number, runningKw: number, startingKw: number}} input
 * @returns {"unknown" | "insufficient" | "within-entered-ratings"}
 */
export function checkBatteryPower({ continuousKw, surgeKw, runningKw, startingKw }) {
  if (![continuousKw, surgeKw, runningKw, startingKw].every((n) => Number.isFinite(n) && n >= 0) ||
      continuousKw <= 0 || surgeKw < continuousKw || startingKw < runningKw) return "unknown";
  return runningKw <= continuousKw && startingKw <= surgeKw ? "within-entered-ratings" : "insufficient";
}
