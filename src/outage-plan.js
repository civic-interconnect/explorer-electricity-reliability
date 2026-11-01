// @ts-check
/** @param {number} value @param {number} min @param {number} [max] */
function inRange(value, min, max = Number.MAX_VALUE) {
  return Number.isFinite(value) && value >= min && value <= max;
}

/** Household assumptions only; no reliability indices enter these calculations.
 * @param {{dailyKwh: number, essentialPercent: number, days: number}} inputs
 */
export function electricityPlan({ dailyKwh, essentialPercent, days }) {
  if (!inRange(dailyKwh, 0) || !inRange(essentialPercent, 0, 100) || !inRange(days, Number.MIN_VALUE)) return null;
  const essentialDaily = dailyKwh * essentialPercent / 100;
  const normalTotal = dailyKwh * days;
  const essentialTotal = essentialDaily * days;
  if (![essentialDaily, normalTotal, essentialTotal].every(Number.isFinite)) return null;
  return { essentialDaily, normalTotal, essentialTotal };
}

/** Fixed draft assumptions: 80% starting fill and 20% nominal-capacity reserve.
 * Burn rate and operating hours are independent user inputs, not derived from kWh.
 * @param {{burnRate: number, hoursPerDay: number, otherPerDay: number, tankGallons: number, days: number}} inputs
 */
export function propanePlan({ burnRate, hoursPerDay, otherPerDay, tankGallons, days }) {
  if (!inRange(burnRate, 0) || !inRange(hoursPerDay, 0, 24) || !inRange(otherPerDay, 0) ||
    !inRange(tankGallons, Number.MIN_VALUE) || !inRange(days, Number.MIN_VALUE)) return null;
  const dailyGallons = burnRate * hoursPerDay + otherPerDay;
  const usableGallons = tankGallons * 0.6;
  const neededGallons = dailyGallons * days;
  const enduranceDays = dailyGallons > 0 ? usableGallons / dailyGallons : null;
  if (![dailyGallons, usableGallons, neededGallons].every(Number.isFinite) ||
    (enduranceDays !== null && !Number.isFinite(enduranceDays))) return null;
  return {
    dailyGallons, usableGallons, neededGallons, enduranceDays,
    balanceGallons: usableGallons - neededGallons, coversFuel: usableGallons >= neededGallons
  };
}
