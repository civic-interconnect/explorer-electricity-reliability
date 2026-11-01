// @ts-check
/** @typedef {{year: number, value: number | null, status: "reported" | "missing" | "invalid" | "duplicate"}} Observation */

/** Hide only entirely empty other-standard rows, across all variants.
 * @param {import("./reliability.js").ReliabilityRecord} record
 */
export function isVisibleRecord(record) {
  return record.standard !== "other_standard" || record.customers !== null ||
    Object.values(record.metrics).some((indices) =>
      Object.values(indices).some((value) => value !== null));
}

/** Select a single reporting series without merging methods, states, or variants.
 * Keep the state's full year range, including absent years and missing endpoints.
 * Duplicate observations are ambiguous, so never choose one silently.
 * @param {import("./reliability.js").ReliabilityRecord[]} records
 * @param {{state: string, standard: string, variant: string, metric: keyof import("./reliability.js").Indices}} selection
 * @returns {Observation[]}
 */
export function selectMetricSeries(records, selection) {
  const stateRows = records.filter((row) => row.state === selection.state);
  if (stateRows.length === 0) return [];
  const years = stateRows.map((row) => row.year);
  const start = Math.min(...years);
  const end = Math.max(...years);
  return Array.from({ length: end - start + 1 }, (_, offset) => {
    const year = start + offset;
    const rows = stateRows.filter((row) => row.year === year && row.standard === selection.standard);
    if (rows.length > 1) return { year, value: null, status: "duplicate" };
    const value = rows[0]?.metrics[selection.variant]?.[selection.metric];
    if (value === undefined || value === null) return { year, value: null, status: "missing" };
    if (!Number.isFinite(value) || value < 0) return { year, value: null, status: "invalid" };
    return { year, value, status: "reported" };
  });
}
