// @ts-check
import { estimateBatteryBackup } from "./battery-backup.js";

/** Stage C boundary: annual PV output cannot establish outage recharge.
 * A future hourly model needs production/load profiles, islanding capability,
 * charge/discharge power limits, efficiencies, and initial state of charge.
 * @param {import("./battery-backup.js").BatteryInputs} input
 */
export function solarBatteryBaseline(input) {
  return { batteryOnly: estimateBatteryBackup(input), additionalSolarBackupHours: null,
    hourlySimulationStatus: "not-modeled" };
}
