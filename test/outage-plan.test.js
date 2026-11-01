// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { electricityPlan, propanePlan } from "../src/outage-plan.js";
import { buildHash, parseHash } from "../src/state.js";
import { recalledUtilityHash } from "../src/last-utility.js";

const electricity = { dailyKwh: 30, essentialPercent: 40, days: 3 };
const fuel = { burnRate: 1, hoursPerDay: 24, otherPerDay: 6, tankGallons: 500, days: 3 };

test("illustrative energy inputs yield 12 kWh/day, 36 essential and 90 normal kWh", () => {
  assert.deepEqual(electricityPlan(electricity), { essentialDaily: 12, essentialTotal: 36, normalTotal: 90 });
  assert.equal(electricityPlan({ ...electricity, days: 7 })?.essentialTotal, 84);
  assert.equal(electricityPlan({ ...electricity, days: .5 })?.essentialTotal, 6);
});

test("zero and full essential shares preserve their meaning", () => {
  assert.equal(electricityPlan({ ...electricity, essentialPercent: 0 })?.essentialTotal, 0);
  assert.equal(electricityPlan({ ...electricity, essentialPercent: 100 })?.essentialTotal, 90);
  assert.equal(electricityPlan({ ...electricity, dailyKwh: 0 })?.essentialTotal, 0);
});

test("invalid energy assumptions never produce misleading results", () => {
  for (const change of [{ dailyKwh: NaN }, { dailyKwh: -1 }, { dailyKwh: Infinity }, { essentialPercent: 101 }, { essentialPercent: -1 }, { days: 0 }, { days: -1 }, { dailyKwh: Number.MAX_VALUE }]) {
    assert.equal(electricityPlan({ ...electricity, ...change }), null);
  }
});

test("fuel example uses nominal-capacity reserve and independently entered consumption", () => {
  assert.deepEqual(propanePlan(fuel), { dailyGallons: 30, usableGallons: 300, neededGallons: 90, enduranceDays: 10, balanceGallons: 210, coversFuel: true });
  assert.equal(propanePlan({ ...fuel, hoursPerDay: 12 })?.dailyGallons, 18);
  assert.equal(propanePlan({ ...fuel, tankGallons: 250 })?.usableGallons, 150);
});

test("fuel equality and shortfalls are distinguished", () => {
  assert.equal(propanePlan({ ...fuel, days: 10 })?.balanceGallons, 0);
  assert.equal(propanePlan({ ...fuel, days: 10 })?.coversFuel, true);
  assert.equal(propanePlan({ ...fuel, days: 11 })?.coversFuel, false);
  assert.equal(propanePlan({ ...fuel, days: 11 })?.balanceGallons, -30);
});

test("zero fuel consumption has no finite endurance estimate", () => {
  const result = propanePlan({ ...fuel, burnRate: 0, otherPerDay: 0 });
  assert.equal(result?.enduranceDays, null);
  assert.equal(result?.neededGallons, 0);
});

test("invalid fuel assumptions do not calculate", () => {
  for (const change of [{ burnRate: NaN }, { hoursPerDay: 25 }, { hoursPerDay: -1 }, { otherPerDay: -1 }, { tankGallons: 0 }, { days: 0 }, { burnRate: Number.MAX_VALUE }]) {
    assert.equal(propanePlan({ ...fuel, ...change }), null);
  }
});

test("planning uses the existing router and takes precedence over utility recall", () => {
  assert.deepEqual(parseHash("#/planning"), { view: "planning" });
  assert.equal(buildHash({ view: "planning" }), "#/planning");
  assert.equal(recalledUtilityHash("#/planning", () => { throw new Error("Should not read storage"); }), null);
});


test("planner template labels and dynamic messages have localized text", async () => {
  const source = await readFile(new URL("../src/views/planning.js", import.meta.url), "utf8");
  const locale = JSON.parse(await readFile(new URL("../locales/en.json", import.meta.url), "utf8"));
  const keys = [...source.matchAll(/"(planner\.[a-zA-Z]+)"/g)].map((match) => match[1]);
  assert.ok(keys.length > 20);
  for (const key of keys) assert.equal(typeof locale[key], "string", key);
});
