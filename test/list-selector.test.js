import test from "node:test";
import assert from "node:assert/strict";
import { selectList, findOption } from "../src/selectors/list-selector.js";

const options = [
  { value: "101", label: "Café Municipal (MN)", searchText: "101 MN" },
  { value: "102", label: "Central Power (WI)", searchText: "102 WI" },
  { value: "103", label: "Northern Electric (MN)", searchText: "103 MN" },
];

test("search matches multiple terms and diacritics", () => {
  assert.deepEqual(selectList(options, { query: "cafe 101" }).options.map(x => x.value), ["101"]);
});

test("optional predicate supports cascaded selectors", () => {
  assert.equal(selectList(options, { include: x => x.searchText.includes("MN") }).total, 2);
});

test("limits displayed options without hiding match count", () => {
  const result = selectList(options, { limit: 1 });
  assert.equal(result.options.length, 1);
  assert.equal(result.total, 3);
  assert.equal(result.truncated, true);
});

test("selection resolves exact value, not label", () => {
  assert.equal(findOption(options, "102")?.label, "Central Power (WI)");
  assert.equal(findOption(options, "999"), undefined);
});
