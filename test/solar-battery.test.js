// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { solarBatteryBaseline } from "../src/calculations/solar-battery.js";

test("combined option reports only the battery baseline until hourly simulation exists", () => {
  const result = solarBatteryBaseline({ essentialKwhPerDay: 12, outageDays: 3, usableBatteryKwh: 15, availableFraction: 1, deliveryEfficiency: .9 });
  assert.equal(result.batteryOnly?.backupHours, 27);
  assert.equal(result.additionalSolarBackupHours, null);
  assert.equal(result.hourlySimulationStatus, "not-modeled");
});
test("combined option does not conceal invalid battery assumptions", () => {
  const result = solarBatteryBaseline({ essentialKwhPerDay: NaN, outageDays: 3, usableBatteryKwh: 15, availableFraction: 1, deliveryEfficiency: .9 });
  assert.equal(result.batteryOnly, null);
  assert.equal(result.additionalSolarBackupHours, null);
});
