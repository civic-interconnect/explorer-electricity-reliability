// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { setStrings, t } from "../src/i18n.js";

test("t returns the string for a known key", () => {
  setStrings({ "nav.search": "Find a utility" });
  assert.equal(t("nav.search"), "Find a utility");
});

test("t returns the key itself when a string is missing", () => {
  setStrings({});
  assert.equal(t("nav.missing"), "nav.missing");
});
