import test from "node:test";
import assert from "node:assert/strict";
import { buildUtilityChoices } from "../src/components/utility-picker.js";

const rows = [
  { id: "007", name: "North Light", state: "MN" },
  { id: "007", name: "North Light", state: "MN" },
  { id: "007", name: "North Light", state: "WI" },
  { id: "100", name: "Valley Electric", state: "CA" },
];

test("same utility across years is one choice per state", () => {
  const built = buildUtilityChoices(rows);
  assert.equal(built.options.length, 3);
  assert.equal(built.options.filter(x => x.label.startsWith("North Light")).length, 2);
});

test("composite utility option identifies the reporting state", () => {
  const built = buildUtilityChoices(rows);
  const choice = built.options.find(x => x.label.includes("WI"));
  assert.ok(choice);
  assert.equal(built.lookup.get(choice.value)?.state, "WI");
  assert.equal(built.lookup.get(choice.value)?.id, "007");
});
