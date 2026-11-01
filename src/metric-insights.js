// @ts-check
/** Pure descriptive statistics. No forecasts, causal attribution, or imputation.
 * @param {import("./metric-series.js").Observation[]} series
 */
export function metricInsights(series) {
  const reported = series.filter((point) => point.status === "reported" && point.value !== null);
  const values = reported.map((point) => /** @type {number} */(point.value));
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

/**
 * Arithmetic mean over N consecutive calendar years ending
 * at the latest year in the selected reporting series.
 *
 * Never imputes missing observations or shifts the window.
 *
 * @param {import("./metric-series.js").Observation[]} series
 * @param {number} years
 * @returns {number | null}
 */
export function trailingAverage(series, years) {
  if (!Number.isInteger(years) || years < 1) return null;

  const end = series.at(-1)?.year;
  if (end === undefined) return null;

  const byYear = new Map(series.map((point) => [point.year, point]));

  let total = 0;

  for (let year = end - years + 1; year <= end; year++) {
    const point = byYear.get(year);

    if (point?.status !== "reported" || point.value === null) {
      return null;
    }

    total += point.value;
  }

  return total / years;
}
