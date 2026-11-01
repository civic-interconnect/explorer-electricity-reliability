// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHash, parseHash } from "../src/state.js";

test("empty hash is the search view", () => {
  assert.deepEqual(parseHash(""), { view: "search" });
  assert.deepEqual(parseHash("#/"), { view: "search" });
});

test("fixed views parse", () => {
  assert.deepEqual(parseHash("#/method"), { view: "method" });
  assert.deepEqual(parseHash("#/glossary"), { view: "glossary" });
});

test("a utility route parses to jurisdiction, scheme and value", () => {
  assert.deepEqual(parseHash("#/us/eia-utility-id/12345"), {
    view: "utility",
    jurisdiction: "us",
    scheme: "eia-utility-id",
    value: "12345",
  });
});

test("a compare route parses", () => {
  assert.deepEqual(parseHash("#/compare/us/eia-utility-id/12345"), {
    view: "compare",
    jurisdiction: "us",
    scheme: "eia-utility-id",
    value: "12345",
  });
});

test("unknown, empty-segment and malformed hashes fall back to search", () => {
  assert.deepEqual(parseHash("#/nonsense/a"), { view: "search" });
  assert.deepEqual(parseHash("#/us//12345"), { view: "search" });
  assert.deepEqual(parseHash("#/us/eia/%E0%A4%A"), { view: "search" });
});

test("buildHash and parseHash round-trip, including awkward characters", () => {
  /** @type {import("../src/state.js").Route[]} */
  const routes = [
    { view: "search" },
    { view: "method" },
    { view: "glossary" },
    { view: "utility", jurisdiction: "us", scheme: "eia-utility-id", value: "12345" },
    { view: "utility", jurisdiction: "us", scheme: "example", value: "a/b c" },
    { view: "compare", jurisdiction: "us", scheme: "example", value: "9" },
  ];
  for (const route of routes) {
    assert.deepEqual(parseHash(buildHash(route)), route);
  }
});

test("buildHash refuses an incomplete utility route", () => {
  assert.throws(() => buildHash({ view: "utility", jurisdiction: "us" }), /needs jurisdiction, scheme and value/);
});
