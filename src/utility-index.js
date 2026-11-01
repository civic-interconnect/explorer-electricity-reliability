// @ts-check
import { assertSupportedSchema, loadJson } from "./data.js";

/** @typedef {{id: string | number, name: string, state?: string | null}} UtilityIndexRow */

/**
 * Validate the compact utility directory used by the search UI.
 * This is a selection index, not a replacement for annual reliability records.
 *
 * @param {unknown} input
 * @returns {UtilityIndexRow[]}
 */
export function parseUtilityIndex(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Utility index must be a JSON object.");
  }
  const document = /** @type {{schemaVersion?: unknown, utilities?: unknown}} */ (input);
  if (typeof document.schemaVersion !== "string") {
    throw new Error("Utility index needs a schemaVersion string.");
  }
  assertSupportedSchema(document.schemaVersion);
  if (!Array.isArray(document.utilities)) {
    throw new Error("Utility index needs a utilities array.");
  }
  return document.utilities.map((value, index) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Utility index entry ${index} must be an object.`);
    }
    const row = /** @type {{id?: unknown, name?: unknown, state?: unknown}} */ (value);
    if (
      (typeof row.id !== "number" && typeof row.id !== "string") ||
      String(row.id).trim() === "" ||
      typeof row.name !== "string" ||
      row.name.trim() === "" ||
      (row.state !== undefined && row.state !== null && typeof row.state !== "string")
    ) {
      throw new Error(`Utility index entry ${index} has an invalid id, name, or state.`);
    }
    const state = typeof row.state === "string" ? row.state.trim().toUpperCase() : "";
    return { id: String(row.id).trim(), name: row.name.trim(), state };
  });
}

/**
 * The import-relative path works both at the repository root (local preview)
 * and when the full static app is copied under /app/ (GitHub Pages).
 *
 * @returns {Promise<UtilityIndexRow[]>}
 */
export async function loadUtilityIndex() {
  const url = new URL("../data/utilities.json", import.meta.url);
  return parseUtilityIndex(await loadJson(url.href));
}
