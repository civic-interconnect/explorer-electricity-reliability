// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import { assertSupportedSchema } from "../src/data.js";

/**
 * @param {string} relativePath Path relative to the repository root.
 * @returns {Promise<any>}
 */
async function readJson(relativePath) {
  const text = await readFile(new URL("../" + relativePath, import.meta.url), "utf8");
  return JSON.parse(text);
}

/**
 * Ajv's CommonJS default export is typed as a namespace under NodeNext, so it is cast here.
 * @param {object} schema
 * @returns {import("ajv").ValidateFunction}
 */
function compile(schema) {
  const AjvClass = /** @type {any} */ (Ajv2020);
  const ajv = new AjvClass({ allErrors: true });
  return ajv.compile(schema);
}

test("the sample fixture validates against reliability.schema.json", async () => {
  const schema = await readJson("contracts/reliability.schema.json");
  const fixture = await readJson("test/fixtures/reliability-sample.json");
  const validate = compile(schema);
  assert.equal(validate(fixture), true, JSON.stringify(validate.errors));
});

test("the schema rejects a record with an unknown method", async () => {
  const schema = await readJson("contracts/reliability.schema.json");
  const fixture = await readJson("test/fixtures/reliability-sample.json");
  const broken = structuredClone(fixture);
  broken.records[0].method = "made-up";
  assert.equal(compile(schema)(broken), false);
});

test("the schema rejects an unknown metric variant", async () => {
  const schema = await readJson("contracts/reliability.schema.json");
  const fixture = await readJson("test/fixtures/reliability-sample.json");
  const broken = structuredClone(fixture);
  broken.records[0].metrics["made-up-variant"] = { saidi: 1, saifi: 1, caidi: 1 };
  assert.equal(compile(schema)(broken), false);
});

test("the schema rejects a negative index", async () => {
  const schema = await readJson("contracts/reliability.schema.json");
  const fixture = await readJson("test/fixtures/reliability-sample.json");
  const broken = structuredClone(fixture);
  broken.records[0].metrics["including-major-event-days"].saidi = -1;
  assert.equal(compile(schema)(broken), false);
});

test("the fixture uses a schemaVersion the app supports", async () => {
  const fixture = await readJson("test/fixtures/reliability-sample.json");
  assert.doesNotThrow(() => assertSupportedSchema(fixture.schemaVersion));
});

test("glossary files validate against glossary.schema.json", async () => {
  const schema = await readJson("contracts/glossary.schema.json");
  const validate = compile(schema);
  for (const file of ["glossary/concepts.json", "glossary/en.json"]) {
    const data = await readJson(file);
    assert.equal(validate(data), true, file + ": " + JSON.stringify(validate.errors));
  }
});

test("every method and metric variant in the schema has a glossary concept", async () => {
  const schema = await readJson("contracts/reliability.schema.json");
  const concepts = await readJson("glossary/concepts.json");
  const ids = new Set(concepts.concepts.map((/** @type {{ id: string }} */ concept) => concept.id));
  const methods = schema.$defs.record.properties.method.enum;
  const variants = schema.$defs.record.properties.metrics.propertyNames.enum;
  assert.ok(methods.length > 0 && variants.length > 0);
  for (const method of methods) {
    assert.ok(ids.has("method-" + method), "missing glossary concept method-" + method);
  }
  for (const variant of variants) {
    assert.ok(ids.has("variant-" + variant), "missing glossary concept variant-" + variant);
  }
  for (const metric of ["saidi", "saifi", "caidi"]) {
    assert.ok(ids.has(metric), "missing glossary concept " + metric);
  }
});

test("concepts and English glossary text cover exactly the same IDs", async () => {
  const concepts = await readJson("glossary/concepts.json");
  const english = await readJson("glossary/en.json");
  const conceptIds = concepts.concepts.map((/** @type {{ id: string }} */ concept) => concept.id).sort();
  const textIds = Object.keys(english.entries).sort();
  assert.deepEqual(textIds, conceptIds);
});

test("related concept IDs all exist", async () => {
  const concepts = await readJson("glossary/concepts.json");
  const ids = new Set(concepts.concepts.map((/** @type {{ id: string }} */ concept) => concept.id));
  for (const concept of concepts.concepts) {
    for (const related of concept.related ?? []) {
      assert.ok(ids.has(related), concept.id + " refers to missing concept " + related);
    }
  }
});

test("every UI string key used in src exists in locales/en.json", async () => {
  const locale = await readJson("locales/en.json");
  const names = await readdir(new URL("../src/", import.meta.url), { recursive: true });
  const keys = new Set();
  for (const name of names) {
    if (!name.endsWith(".js")) {
      continue;
    }
    const path = name.replaceAll("\\", "/");
    const source = await readFile(new URL("../src/" + path, import.meta.url), "utf8");
    for (const match of source.matchAll(/\bt\("([^"]+)"\)/g)) {
      keys.add(match[1]);
    }
    for (const match of source.matchAll(/labelKey: "([^"]+)"/g)) {
      keys.add(match[1]);
    }
  }
  assert.ok(keys.size > 0);
  for (const key of keys) {
    assert.ok(key in locale, "missing locale string " + String(key));
  }
});

test("jurisdiction label keys exist in locales/en.json", async () => {
  const locale = await readJson("locales/en.json");
  const registry = await readJson("config/jurisdictions.json");
  assert.doesNotThrow(() => assertSupportedSchema(registry.schemaVersion));
  for (const jurisdiction of registry.jurisdictions) {
    assert.ok(jurisdiction.labelKey in locale, "missing locale string " + jurisdiction.labelKey);
  }
});
