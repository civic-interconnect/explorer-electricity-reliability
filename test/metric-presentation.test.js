// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseUtilityReliability } from "../src/reliability.js";
import { isVisibleRecord, selectMetricSeries } from "../src/metric-series.js";
import { metricInsights } from "../src/metric-insights.js";
import { chartScale } from "../src/components/yearly-bar-chart.js";

const utility = parseUtilityReliability(JSON.parse(await readFile(new URL("../data/reliability/8840.json", import.meta.url), "utf8")));
const selection = { state: "AR", standard: "ieee_standard", variant: "including-major-event-days", metric: /** @type {const} */ ("saidi") };

test("City of Hope selects actual IEEE observations, with the expected extrema and latest year", () => {
  const series = selectMetricSeries(utility.records, selection);
  assert.equal(series.length, 11);
  const insights = metricInsights(series);
  assert.deepEqual(insights.highest, { value: 211.11, years: [2022] });
  assert.deepEqual(insights.lowest, { value: 32.771, years: [2017] });
  assert.deepEqual(insights.latest, { year: 2025, value: 51.47, status: "reported" });
});

test("selection never substitutes another method, state, variant, or metric", () => {
  assert.ok(selectMetricSeries(utility.records, { ...selection, standard: "other_standard" }).every((p) => p.value === null));
  assert.deepEqual(selectMetricSeries(utility.records, { ...selection, state: "TX" }), []);
  const excluded = selectMetricSeries(utility.records, { ...selection, variant: "excluding-major-event-days" });
  assert.deepEqual(excluded[0], { year: 2015, value: null, status: "missing" });
  assert.equal(excluded.at(-1)?.value, 24.76);
  assert.equal(selectMetricSeries(utility.records, { ...selection, metric: "saifi" }).at(-1)?.value, .88);
});

test("absent years, explicit null, and missing latest values stay missing; zero is reported", () => {
  const records = structuredClone(utility.records).filter((r) => r.year !== 2018);
  const row = records.find((r) => r.year === 2015 && r.standard === selection.standard);
  const latest = records.find((r) => r.year === 2025 && r.standard === selection.standard);
  assert.ok(row && latest);
  row.metrics[selection.variant].saidi = 0;
  latest.metrics[selection.variant].saidi = null;
  const series = selectMetricSeries(records, selection);
  assert.equal(series.length, 11);
  assert.deepEqual(series[0], { year: 2015, value: 0, status: "reported" });
  assert.deepEqual(series[3], { year: 2018, value: null, status: "missing" });
  const insights = metricInsights(series);
  assert.equal(insights.latest?.value, null);
  assert.deepEqual(insights.lowest, { value: 0, years: [2015] });
  assert.deepEqual(insights.missingYears, [2018, 2025]);
});

test("only entirely empty other-standard records are hidden; zero customers remain visible", () => {
  const row = structuredClone(utility.records.find((r) => r.standard === "other_standard"));
  assert.ok(row);
  assert.equal(isVisibleRecord(row), false);
  row.customers = 0;
  assert.equal(isVisibleRecord(row), true);
  row.customers = null;
  row.metrics["excluding-major-event-days"] = { saidi: null, saifi: 0, caidi: null };
  assert.equal(isVisibleRecord(row), true);
  assert.equal(isVisibleRecord({ ...row, standard: "ieee_standard", metrics: {} }), true);
});

test("duplicates and negative values produce discrepancies rather than bars or statistics", () => {
  const records = structuredClone(utility.records);
  const row = records.find((r) => r.year === 2015 && r.standard === selection.standard);
  assert.ok(row);
  row.metrics[selection.variant].saidi = -1;
  const duplicate = records.find((r) => r.year === 2016 && r.standard === selection.standard);
  assert.ok(duplicate);
  records.push(structuredClone(duplicate));
  const series = selectMetricSeries(records, selection);
  assert.equal(series[0].status, "invalid");
  assert.equal(series[1].status, "duplicate");
  assert.deepEqual(metricInsights(series).discrepancyYears, [2015, 2016]);
});

test("scale starts at zero, contains every bar, and handles empty, zero, and fractional data", () => {
  const series = selectMetricSeries(utility.records, selection);
  const scale = chartScale(series);
  assert.equal(scale.ticks[0], 0);
  assert.equal(scale.upper, 300);
  assert.ok(series.every((p) => (p.value ?? 0) <= scale.upper));
  assert.equal(chartScale([]).upper, 1);
  assert.equal(chartScale([{ year: 2025, value: 0, status: "reported" }]).upper, 1);
  const fraction = chartScale([{ year: 2025, value: .03, status: "reported" }]);
  assert.ok(fraction.upper >= .03 && fraction.upper < 1);
});

test("insights handle no observations, a single observation, and ties without inventing trends", () => {
  assert.equal(metricInsights([]).latest, null);
  const empty = metricInsights([{ year: 2025, value: null, status: "missing" }]);
  assert.deepEqual(empty.highest, { value: null, years: [] });
  assert.equal(empty.reportedCount, 0);
  const single = metricInsights([{ year: 2025, value: 0, status: "reported" }]);
  assert.equal(single.reportedCount, 1);
  const ties = metricInsights([2023, 2024, 2025].map((year) => ({ year, value: 2, status: "reported" })));
  assert.deepEqual(ties.highest, { value: 2, years: [2023, 2024, 2025] });
  assert.deepEqual(ties.lowest, ties.highest);
});


test("SAIFI and CAIDI use reported values and never derive missing indices", () => {
  const saifi = selectMetricSeries(utility.records, { ...selection, metric: "saifi" });
  const caidi = selectMetricSeries(utility.records, { ...selection, metric: "caidi" });
  assert.equal(metricInsights(saifi).latest?.value, .88);
  assert.equal(metricInsights(caidi).latest?.value, 58.488636);
  assert.deepEqual(metricInsights(saifi).highest, { value: 2.37, years: [2019] });
  assert.deepEqual(metricInsights(caidi).highest, { value: 169.63899, years: [2018] });
  for (const metric of /** @type {const} */ (["saifi", "caidi"])) {
    const excluded = selectMetricSeries(utility.records, { ...selection, metric, variant: "excluding-major-event-days" });
    assert.deepEqual(excluded.find((point) => point.year === 2017), { year: 2017, value: null, status: "missing" });
  }
});

test("each metric is scaled independently", () => {
  const scales = ["saidi", "saifi", "caidi"].map((metric) => chartScale(selectMetricSeries(utility.records, { ...selection, metric: /** @type {keyof import("../src/reliability.js").Indices} */ (metric) })).upper);
  assert.deepEqual(scales, [300, 3, 200]);
});
