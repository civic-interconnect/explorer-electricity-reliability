// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("CITATION.cff version, when present, matches package.json", async (context) => {
  const packageText = await readFile(new URL("../package.json", import.meta.url), "utf8");
  const citationText = await readFile(new URL("../CITATION.cff", import.meta.url), "utf8");
  const packageVersion = JSON.parse(packageText).version;
  const match = /^version:\s*["']?([^"'\s]+)["']?\s*$/m.exec(citationText);
  if (match === null) {
    context.skip("CITATION.cff has no version yet (before the first release).");
    return;
  }
  assert.equal(match[1], packageVersion);
});
