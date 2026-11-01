// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { rememberUtility, recalledUtilityHash } from "../src/last-utility.js";
import { parseHash } from "../src/state.js";

function memoryStorage() {
  let value = "";
  return {
    getItem: () => value,
    /** @param {string} key @param {string} next */
    setItem: (key, next) => { value = next; },
  };
}

test("new visitors have no recall; returning visitors restore the latest utility", () => {
  const storage = memoryStorage();
  assert.equal(recalledUtilityHash("", () => storage), null);
  rememberUtility(parseHash("#/us/eia-utility-id/8840"), () => storage);
  assert.equal(recalledUtilityHash("", () => storage), "#/us/eia-utility-id/8840");
  rememberUtility(parseHash("#/us/eia-utility-id/123"), () => storage);
  assert.equal(recalledUtilityHash("#", () => storage), "#/us/eia-utility-id/123");
});

test("shared links and the explicit picker override remembered selections", () => {
  const storage = memoryStorage();
  rememberUtility(parseHash("#/us/eia-utility-id/8840"), () => storage);
  for (const hash of ["#/", "#/method", "#/us/eia-utility-id/123", "#/unknown"]) {
    assert.equal(recalledUtilityHash(hash, () => storage), null);
  }
});

test("invalid saved values are ignored", () => {
  const storage = memoryStorage();
  for (const value of ["broken", "#/us/eia-utility-id/abc", "#/ca/eia-utility-id/1", "#/compare/us/eia-utility-id/1", "#/method"]) {
    storage.setItem("unused", value);
    assert.equal(recalledUtilityHash("", () => storage), null);
  }
});

test("non-utility navigation does not overwrite the last utility", () => {
  const storage = memoryStorage();
  rememberUtility(parseHash("#/us/eia-utility-id/8840"), () => storage);
  rememberUtility(parseHash("#/"), () => storage);
  assert.equal(recalledUtilityHash("", () => storage), "#/us/eia-utility-id/8840");
});

test("blocked storage and quota errors never break navigation", () => {
  const blocked = () => { throw new Error("Storage blocked"); };
  assert.doesNotThrow(() => rememberUtility(parseHash("#/us/eia-utility-id/8840"), blocked));
  assert.equal(recalledUtilityHash("", blocked), null);
  const full = () => ({ getItem: () => null, setItem: () => { throw new Error("Quota exceeded"); } });
  assert.doesNotThrow(() => rememberUtility(parseHash("#/us/eia-utility-id/8840"), full));
});
