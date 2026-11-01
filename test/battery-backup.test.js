// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateBatteryBackup, checkBatteryPower } from "../src/calculations/battery-backup.js";

const example = { essentialKwhPerDay: 12, outageDays: 3, usableBatteryKwh: 15, availableFraction: 1, deliveryEfficiency: .9 };

test("battery example delivers 13.5 kWh and 27 hours, with 22.5 kWh shortfall", () => {
  assert.deepEqual(estimateBatteryBackup(example), { requiredKwh: 36, deliveredKwh: 13.5, backupHours: 27, shortfallKwh: 22.5 });
});
test("available energy, efficiency, and household changes update the estimate", () => {
  assert.equal(estimateBatteryBackup({ ...example, availableFraction: .5 })?.backupHours, 13.5);
  assert.equal(estimateBatteryBackup({ ...example, essentialKwhPerDay: 24 })?.backupHours, 13.5);
  assert.equal(estimateBatteryBackup({ ...example, outageDays: 1 })?.shortfallKwh, 0);
  assert.equal(estimateBatteryBackup({ ...example, deliveryEfficiency: 1 })?.deliveredKwh, 15);
});
test("empty capacity is zero energy; zero load has no finite duration", () => {
  assert.equal(estimateBatteryBackup({ ...example, usableBatteryKwh: 0 })?.backupHours, 0);
  assert.equal(estimateBatteryBackup({ ...example, availableFraction: 0 })?.deliveredKwh, 0);
  assert.equal(estimateBatteryBackup({ ...example, essentialKwhPerDay: 0 })?.backupHours, null);
});
test("invalid or overflowing battery inputs are rejected", () => {
  for (const change of [{ availableFraction: 1.1 }, { usableBatteryKwh: NaN }, { usableBatteryKwh: -1 }, { deliveryEfficiency: 0 }, { deliveryEfficiency: 1.1 }, { essentialKwhPerDay: Infinity }, { outageDays: 0 }, { essentialKwhPerDay: Number.MAX_VALUE }]) {
    assert.equal(estimateBatteryBackup({ ...example, ...change }), null);
  }
});
test("power screening keeps missing, inconsistent, and inadequate ratings distinct", () => {
  const ratings = { continuousKw: 5, surgeKw: 7, runningKw: 4, startingKw: 6 };
  assert.equal(checkBatteryPower(ratings), "within-entered-ratings");
  assert.equal(checkBatteryPower({ ...ratings, startingKw: 8 }), "insufficient");
  assert.equal(checkBatteryPower({ ...ratings, runningKw: 6 }), "insufficient");
  assert.equal(checkBatteryPower({ ...ratings, surgeKw: NaN }), "unknown");
  assert.equal(checkBatteryPower({ ...ratings, surgeKw: 3 }), "unknown");
  assert.equal(checkBatteryPower({ ...ratings, startingKw: 2 }), "unknown");
});
