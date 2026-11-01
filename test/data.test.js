// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { assertSupportedSchema, loadDataFile, majorVersion } from "../src/data.js";

test("majorVersion reads the first number", () => {
  assert.equal(majorVersion("1.2.3"), 1);
  assert.equal(majorVersion("12.0.0"), 12);
});

test("assertSupportedSchema accepts any minor and patch of the supported major", () => {
  assert.doesNotThrow(() => assertSupportedSchema("1.0.0"));
  assert.doesNotThrow(() => assertSupportedSchema("1.7.3"));
});

test("assertSupportedSchema refuses other majors and malformed versions", () => {
  assert.throws(() => assertSupportedSchema("2.0.0"), /Unsupported schemaVersion/);
  assert.throws(() => assertSupportedSchema("0.9.0"), /Unsupported schemaVersion/);
  assert.throws(() => assertSupportedSchema("one"), /Invalid schemaVersion/);
  assert.throws(() => assertSupportedSchema(/** @type {any} */ (undefined)), /Invalid schemaVersion/);
});

test("loadDataFile refuses a file with an unsupported schemaVersion", async () => {
  const originalFetch = globalThis.fetch;
  /** @type {any} */ (globalThis).fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ schemaVersion: "2.0.0" }),
  });
  try {
    await assert.rejects(() => loadDataFile("https://example.invalid/file.json"), /Unsupported schemaVersion/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("loadDataFile returns a file with a supported schemaVersion", async () => {
  const originalFetch = globalThis.fetch;
  /** @type {any} */ (globalThis).fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ schemaVersion: "1.0.0", records: [] }),
  });
  try {
    const data = await loadDataFile("https://example.invalid/file.json");
    assert.deepEqual(data.records, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("loadDataFile reports an HTTP failure", async () => {
  const originalFetch = globalThis.fetch;
  /** @type {any} */ (globalThis).fetch = async () => ({ ok: false, status: 404 });
  try {
    await assert.rejects(() => loadDataFile("https://example.invalid/missing.json"), /HTTP 404/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
