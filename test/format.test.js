// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatNumber, formatYear } from "../src/format.js";

test("formatNumber follows the locale", () => {
  assert.equal(formatNumber(1234.56, "en"), "1,234.6");
  assert.equal(formatNumber(1234.56, "de"), "1.234,6");
});

test("formatNumber returns null for a missing value", () => {
  assert.equal(formatNumber(null, "en"), null);
  assert.equal(formatNumber(undefined, "en"), null);
});

test("formatNumber keeps zero, which is a real value", () => {
  assert.equal(formatNumber(0, "en"), "0");
});

test("formatYear has no thousands separator", () => {
  assert.equal(formatYear(2024, "en"), "2024");
});
