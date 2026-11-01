import test from "node:test";
import assert from "node:assert/strict";
import { buildList } from "../src/selectors/list-builder.js";

test("generic list builder sorts, deduplicates, and ignores missing identifiers", () => {
  const rows = [
    { id: "2", name: "Zebra" },
    { id: "1", name: "Alpha" },
    { id: "2", name: "Zebra (later year)" },
    { id: "", name: "Unidentified" },
  ];
  assert.deepEqual(buildList(rows, { valueOf: r => r.id, labelOf: r => r.name }).map(x => x.label), ["Alpha", "Zebra"]);
});

test("numeric labels sort naturally", () => {
  const result = buildList([2, 10, 1], { valueOf: x => x, labelOf: x => `Year ${x}` });
  assert.deepEqual(result.map(x => x.value), ["1", "2", "10"]);
});
