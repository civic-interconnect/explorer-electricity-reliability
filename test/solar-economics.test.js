// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateSolarEconomics } from "../src/calculations/solar-economics.js";

// Synthetic accounting fixture, not a production estimate or a household quote.
const example = { dailyKwh: 30, annualGenerationKwh: 10000, selfConsumedFraction: .6, retailRate: .2, exportRate: .05, installedCost: 20000, annualMaintenance: 100 };

test("annual accounting values self-consumption and exports separately", () => {
  const result = estimateSolarEconomics(example);
  assert.ok(result);
  assert.equal(result.annualUseKwh, 10950);
  assert.equal(result.selfConsumedKwh, 6000);
  assert.equal(result.exportedKwh, 4000);
  assert.equal(result.annualSavings, 1300);
  assert.equal(result.simplePaybackYears, 20000 / 1300);
});
test("zero and negative savings never manufacture a payback", () => {
  assert.equal(estimateSolarEconomics({ ...example, annualMaintenance: 1400 })?.simplePaybackYears, null);
  const loss = estimateSolarEconomics({ ...example, annualMaintenance: 1500 });
  assert.equal(loss?.annualSavings, -100);
  assert.equal(loss?.simplePaybackYears, null);
});
test("generation equivalent can exceed 100% without treating it as self-consumption", () => {
  const result = estimateSolarEconomics({ ...example, annualGenerationKwh: 20000, selfConsumedFraction: .5 });
  assert.ok(result && result.generationPercentOfUse !== null);
  assert.ok(result.generationPercentOfUse > 100);
  assert.equal(result.selfConsumedKwh, 10000);
  assert.equal(estimateSolarEconomics({ ...example, annualGenerationKwh: 20000 }), null);
});
test("zero use and generation are handled without dividing by zero", () => {
  const result = estimateSolarEconomics({ ...example, dailyKwh: 0, annualGenerationKwh: 0 });
  assert.equal(result?.generationPercentOfUse, null);
  assert.equal(result?.simplePaybackYears, null);
  assert.equal(estimateSolarEconomics({ ...example, installedCost: 0 })?.simplePaybackYears, 0);
});
test("missing, negative, invalid-share, and overflowing solar inputs are rejected", () => {
  for (const change of [{ annualGenerationKwh: NaN }, { retailRate: -1 }, { exportRate: Infinity }, { installedCost: -1 }, { annualMaintenance: NaN }, { selfConsumedFraction: 1.1 }, { dailyKwh: Number.MAX_VALUE }]) {
    assert.equal(estimateSolarEconomics({ ...example, ...change }), null);
  }
});
