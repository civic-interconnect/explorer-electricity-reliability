// @ts-check
/** Pure descriptive statistics. No forecasts, causal attribution, or imputation.
 * @param {import("./metric-series.js").Observation[]} series
 */
export function metricInsights(series) {
  const reported = series.filter((point) => point.status === "reported" && point.value !== null);
  const values = reported.map((point) => /** @type {number} */ (point.value));
  const minimum = values.length ? Math.min(...values) : null;
  const maximum = values.length ? Math.max(...values) : null;
  return {
    latest: series.at(-1) ?? null,
    reportedCount: reported.length,
    missingYears: series.filter((point) => point.status === "missing").map((point) => point.year),
    discrepancyYears: series.filter((point) => point.status === "invalid" || point.status === "duplicate").map((point) => point.year),
    lowest: { value: minimum, years: reported.filter((point) => point.value === minimum).map((point) => point.year) },
    highest: { value: maximum, years: reported.filter((point) => point.value === maximum).map((point) => point.year) },
  };
}
