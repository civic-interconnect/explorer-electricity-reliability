// @ts-check

import { t } from "../i18n.js";
import { formatNumber, formatYear } from "../format.js";
import { selectMetricSeries } from "../metric-series.js";
import { trailingAverage } from "../metric-insights.js";

/**
 * @param {{
 *   records: import("../reliability.js").ReliabilityRecord[],
 *   state: string,
 *   standard: string,
 *   variant: string,
 *   locale: string
 * }} options
 * @returns {HTMLElement}
 */
export function historicalSummaryTable({
  records, state, standard, variant, locale,
}) {
  const stateRecords = records.filter((record) => record.state === state);
  const latestYear = Math.max(...stateRecords.map((record) => record.year));

  const windows = [
    { years: 1, label: t("summary.latest") },
    { years: 3, label: t("summary.three") },
    { years: 5, label: t("summary.five") },
  ];

  const table = document.createElement("table");

  const caption = document.createElement("caption");
  caption.textContent = t("summary.title");
  table.append(caption);

  const thead = document.createElement("thead");
  const headingRow = document.createElement("tr");

  for (const label of [
    t("summary.metric"),
    ...windows.map(({ years, label }) => {
      const start = formatYear(latestYear - years + 1, locale);
      const end = formatYear(latestYear, locale);
      return `${label} (${years === 1 ? end : `${start}-${end}`})`;
    }),
  ]) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = label;
    headingRow.append(th);
  }

  thead.append(headingRow);
  table.append(thead);

  const tbody = document.createElement("tbody");

  /** @type {(keyof import("../reliability.js").Indices)[]} */
  const metrics = ["saidi", "saifi", "caidi"];

  for (const metric of metrics) {
    const series = selectMetricSeries(records, {
      state, standard, variant, metric,
    });

    const row = document.createElement("tr");
    const heading = document.createElement("th");
    heading.scope = "row";
    heading.textContent = t(`metric.${metric}`);
    row.append(heading);

    for (const { years } of windows) {
      const average = trailingAverage(series, years);
      const cell = document.createElement("td");

      cell.textContent = average === null
        ? t("summary.incomplete")
        : formatNumber(average, locale, metric === "saifi" ? 3 : 2);

      row.append(cell);
    }

    tbody.append(row);
  }

  table.append(tbody);

  const wrapper = document.createElement("div");
  wrapper.className = "table-scroll";
  wrapper.tabIndex = 0;
  wrapper.setAttribute("role", "region");
  wrapper.setAttribute("aria-label", t("summary.title"));
  wrapper.append(table);

  return wrapper;
}
