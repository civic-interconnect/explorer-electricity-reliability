// @ts-check
import { assertSupportedSchema, loadJson } from "./data.js";

/** @typedef {{saidi: number | null, saifi: number | null, caidi: number | null}} Indices */
/** @typedef {{state: string, year: number, standard: string, entityType: string, customers: number | null, metrics: Record<string, Indices>}} ReliabilityRecord */
/** @typedef {{id: string, name: string, records: ReliabilityRecord[]}} UtilityReliability */

/** The variants the explorer can show, in the order they appear in the selector. */
export const VARIANTS = [
  "including-major-event-days",
  "excluding-major-event-days",
  "including-major-event-days-excluding-loss-of-supply",
];

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isNumberOrNull(value) {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

/**
 * Validate one utility's reliability file.
 *
 * @param {unknown} input
 * @returns {UtilityReliability}
 */
export function parseUtilityReliability(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Reliability file must be a JSON object.");
  }
  const document = /** @type {{schemaVersion?: unknown, id?: unknown, name?: unknown, records?: unknown}} */ (input);
  if (typeof document.schemaVersion !== "string") {
    throw new Error("Reliability file needs a schemaVersion string.");
  }
  assertSupportedSchema(document.schemaVersion);
  if (typeof document.id !== "string" || document.id === "") {
    throw new Error("Reliability file needs an id string.");
  }
  if (typeof document.name !== "string" || document.name === "") {
    throw new Error("Reliability file needs a name string.");
  }
  if (!Array.isArray(document.records)) {
    throw new Error("Reliability file needs a records array.");
  }

  /** @type {ReliabilityRecord[]} */
  const records = [];
  document.records.forEach((value, index) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Reliability record ${index} must be an object.`);
    }
    const row = /** @type {{state?: unknown, year?: unknown, standard?: unknown, entityType?: unknown, customers?: unknown, metrics?: unknown}} */ (value);
    if (
      typeof row.state !== "string" ||
      typeof row.year !== "number" ||
      !Number.isInteger(row.year) ||
      typeof row.standard !== "string" ||
      typeof row.entityType !== "string" ||
      !isNumberOrNull(row.customers) ||
      row.metrics === null ||
      typeof row.metrics !== "object" ||
      Array.isArray(row.metrics)
    ) {
      throw new Error(`Reliability record ${index} has an invalid field.`);
    }

    /** @type {Record<string, Indices>} */
    const metrics = {};
    for (const [variant, indices] of Object.entries(row.metrics)) {
      const values = /** @type {{saidi?: unknown, saifi?: unknown, caidi?: unknown}} */ (indices);
      if (
        values === null ||
        typeof values !== "object" ||
        !isNumberOrNull(values.saidi) ||
        !isNumberOrNull(values.saifi) ||
        !isNumberOrNull(values.caidi)
      ) {
        throw new Error(`Reliability record ${index} has invalid indices for ${variant}.`);
      }
      metrics[variant] = {
        saidi: /** @type {number | null} */ (values.saidi),
        saifi: /** @type {number | null} */ (values.saifi),
        caidi: /** @type {number | null} */ (values.caidi),
      };
    }

    records.push({
      state: row.state,
      year: row.year,
      standard: row.standard,
      entityType: row.entityType,
      customers: /** @type {number | null} */ (row.customers),
      metrics,
    });
  });

  return { id: document.id, name: document.name, records };
}

/**
 * Load the reliability file for one utility.
 * The ID comes from the URL, so it must be digits only before it is used in a path.
 * The import-relative path works both at the repository root (local preview)
 * and when the full static app is copied under /app/ (GitHub Pages).
 *
 * @param {string} utilityId EIA utility ID, digits only.
 * @returns {Promise<UtilityReliability>}
 */
export async function loadUtilityReliability(utilityId) {
  if (!/^\d+$/.test(utilityId)) {
    throw new Error("Invalid utility ID: " + utilityId);
  }
  const url = new URL("../data/reliability/" + utilityId + ".json", import.meta.url);
  return parseUtilityReliability(await loadJson(url.href));
}
