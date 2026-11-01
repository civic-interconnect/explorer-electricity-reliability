// @ts-check
import { t } from "../i18n.js";
import { rememberUtility } from "../last-utility.js";
import { formatNumber, formatYear } from "../format.js";
import { loadUtilityReliability, VARIANTS } from "../reliability.js";
import { isVisibleRecord, selectMetricSeries } from "../metric-series.js";
import { metricInsights } from "../metric-insights.js";
import { metricCard } from "../components/metric-card.js";
import { yearlyBarChart } from "../components/yearly-bar-chart.js";
import { DEFAULT_JURISDICTION, UTILITY_SCHEME } from "../identifiers.js";
import { historicalSummaryTable } from "../components/historical-summary-table.js";

/** Counts calls so a slow earlier load cannot overwrite a newer page. */
let latestRequest = 0;
/** @type {(() => void)[]} */
let chartCleanups = [];
function clearCharts() {
  chartCleanups.forEach((cleanup) => cleanup());
  chartCleanups = [];
}

/**
 * @param {string} tagName
 * @param {string} text
 * @returns {HTMLElement}
 */
function textElement(tagName, text) {
  const element = document.createElement(tagName);
  element.textContent = text;
  return element;
}

/**
 * The first view of a selected utility.
 *
 * @param {HTMLElement} container
 * @param {import("../state.js").Route} route
 * @returns {void}
 */
export function render(container, route) {
  clearCharts();
  latestRequest += 1;
  const request = latestRequest;
  showUtility(container, route, request).catch((error) => {
    if (request === latestRequest) {
      container.replaceChildren(
        textElement("p", t("utility.error") + " " + String(error)),
      );
    }
  });
}

/**
 * @param {HTMLElement} container
 * @param {import("../state.js").Route} route
 * @param {number} request
 * @returns {Promise<void>}
 */
async function showUtility(container, route, request) {
  if (
    route.jurisdiction !== DEFAULT_JURISDICTION ||
    route.scheme !== UTILITY_SCHEME ||
    route.value === undefined
  ) {
    container.replaceChildren(textElement("p", t("utility.unsupported")));
    return;
  }

  container.replaceChildren(textElement("p", t("utility.loading")));
  const utility = await loadUtilityReliability(route.value);
  if (request !== latestRequest) {
    return;
  }
  drawUtility(container, utility);
  rememberUtility(route);
}

/**
 * @param {HTMLElement} container
 * @param {import("../reliability.js").UtilityReliability} utility
 * @returns {void}
 */
function drawUtility(container, utility) {
  const locale = document.documentElement.lang || "en";

  const heading = textElement("h2", utility.name);
  const identifier = textElement("p", t("utility.idLabel") + " " + utility.id);
  const limits = textElement("p", t("limits.short"));

  const selectorGroup = document.createElement("div");
  selectorGroup.className = "control-group";
  const selectorLabel = document.createElement("label");
  selectorLabel.htmlFor = "variant-select";
  selectorLabel.textContent = t("utility.variantLabel");
  const variantSelect = document.createElement("select");
  variantSelect.id = "variant-select";
  for (const variant of VARIANTS) {
    variantSelect.append(new Option(t("variant." + variant), variant));
  }
  selectorGroup.append(selectorLabel, variantSelect);

  const results = document.createElement("div");
  /** @type {Map<string, string>} */
  const selectedMethods = new Map();

  container.replaceChildren(
    heading,
    identifier,
    limits,
    selectorGroup,
    results,
  );

  function drawTables() {
    clearCharts();
    const variant = variantSelect.value;
    const states = [
      ...new Set(utility.records.map((record) => record.state)),
    ].sort();
    const sections = [];

    for (const state of states) {
      const stateSection = document.createElement("section");
      stateSection.className = "reliability-section";
      stateSection.append(textElement("h3", state));
      const visibleRecords = utility.records.filter(
        (record) => record.state === state && isVisibleRecord(record),
      );
      const methods = [
        ...new Set(visibleRecords.map((record) => record.standard)),
      ].sort();
      const methodLabel = document.createElement("label");
      const methodSelect = document.createElement("select");
      methodSelect.id = "method-" + state;
      methodLabel.htmlFor = methodSelect.id;
      methodLabel.textContent = t("metric.methodLabel");
      for (const method of methods)
        methodSelect.append(new Option(methodName(method), method));
      const previousMethod = selectedMethods.get(state);
      if (previousMethod && methods.includes(previousMethod))
        methodSelect.value = previousMethod;
      const methodControl = document.createElement("div");
      methodControl.className = "control-group";
      methodControl.append(methodLabel, methodSelect);
      const presentation = document.createElement("div");
      presentation.className = "metric-presentation";
      presentation.setAttribute("aria-live", "polite");
      /** @type {(() => void)[]} */
      let disconnectCharts = [];

      function drawMetric() {
        disconnectCharts.forEach((disconnect) => disconnect());
        disconnectCharts = [];
        const standard = methodSelect.value;
        selectedMethods.set(state, standard);
        const context =
          state +
          " · " +
          methodName(standard) +
          " · " +
          t("variant." + variant);

        const cards = document.createElement("div");
        cards.className = "metric-cards";

        const histories = document.createElement("div");
        histories.className = "metric-histories";
        /** @type {(keyof import("../reliability.js").Indices)[]} */

        const metrics = ["saidi", "saifi", "caidi"];
        for (const metric of metrics) {
          const unit = t("metric." + metric + "Unit");
          const series = selectMetricSeries(utility.records, {
            state,
            standard,
            variant,
            metric,
          });
          const insights = metricInsights(series);
          cards.append(
            metricCard({
              label: t("metric." + metric),
              unit,
              context,
              latest: insights.latest,
              locale,
            }),
          );
          const history = document.createElement("section");
          history.className = "metric-history";
          history.append(textElement("h4", t("metric." + metric)));
          const chart = yearlyBarChart({
            series,
            label: metric.toUpperCase(),
            unit,
            context,
            locale,
          });
          disconnectCharts.push(chart.disconnect);
          const summary = document.createElement("div");
          summary.className = "metric-insights";
          if (insights.reportedCount === 0)
            summary.append(textElement("p", t("metric.noObservations")));
          else if (insights.reportedCount === 1)
            summary.append(textElement("p", t("metric.single")));
          else {
            appendExtreme(
              summary,
              t("metric.highest"),
              insights.highest,
              unit,
              locale,
            );
            appendExtreme(
              summary,
              t("metric.lowest"),
              insights.lowest,
              unit,
              locale,
            );
          }
          if (insights.missingYears.length)
            summary.append(
              textElement(
                "p",
                t("metric.missingYears") +
                ": " +
                insights.missingYears
                  .map((year) => formatYear(year, locale))
                  .join(", "),
              ),
            );
          if (insights.discrepancyYears.length)
            summary.append(
              textElement(
                "p",
                t("metric.discrepancyYears") +
                ": " +
                insights.discrepancyYears
                  .map((year) => formatYear(year, locale))
                  .join(", "),
              ),
            );
          history.append(
            chart.element,
            summary,
            textElement("p", t("metric." + metric + "Meaning")),
          );
          histories.append(history);
        }
        const years = utility.records
          .filter((record) => record.state === state)
          .map((record) => record.year);
        const coverage = years.length
          ? t("metric.coverage") +
          ": " +
          formatYear(Math.min(...years), locale) +
          "-" +
          formatYear(Math.max(...years), locale)
          : t("metric.noYears");

        const historical = historicalSummaryTable({
          records: utility.records,
          state,
          standard,
          variant,
          locale,
        });
        presentation.replaceChildren(
          textElement("p", coverage),
          cards,
          historical,
          textElement("p", t("summary.note")),
          textElement("h3", t("metric.history")),
          textElement("p", t("metric.scales")),
          histories,
          textElement("p", t("metric.meaning")),
        );
      }

      methodSelect.addEventListener("change", drawMetric);
      chartCleanups.push(() =>
        disconnectCharts.forEach((disconnect) => disconnect()),
      );

      drawMetric();
      stateSection.append(methodControl, presentation);
      const table = document.createElement("table");
      table.append(
        textElement(
          "caption",
          state + " · " + t("metric.table") + " · " + t("variant." + variant),
        ),
      );

      const headerRow = document.createElement("tr");
      for (const key of [
        "table.year",
        "table.method",
        "table.saidi",
        "table.saifi",
        "table.caidi",
        "table.customers",
      ]) {
        const cell = textElement("th", t(key));
        cell.setAttribute("scope", "col");
        headerRow.append(cell);
      }
      const head = document.createElement("thead");
      head.append(headerRow);

      const body = document.createElement("tbody");
      const stateRecords = utility.records
        .filter((record) => record.state === state && isVisibleRecord(record))
        .sort(
          (a, b) => a.year - b.year || a.standard.localeCompare(b.standard),
        );

      for (const record of stateRecords) {
        const indices = record.metrics[variant];
        const row = document.createElement("tr");
        const values = [
          formatYear(record.year, locale),
          methodName(record.standard),
          formatNumber(indices?.saidi, locale),
          formatNumber(indices?.saifi, locale),
          formatNumber(indices?.caidi, locale),
          formatNumber(record.customers, locale, 0),
        ];
        for (const value of values) {
          row.append(textElement("td", value ?? t("value.missing")));
        }
        body.append(row);
      }

      table.append(head, body);
      const tableScroll = document.createElement("div");
      tableScroll.className = "table-scroll";
      tableScroll.tabIndex = 0;
      tableScroll.setAttribute("role", "region");
      tableScroll.setAttribute("aria-label", state + " · " + t("metric.table"));
      tableScroll.append(table);
      stateSection.append(tableScroll, textElement("p", t("metric.tableNote")));
      sections.push(stateSection);
    }

    results.replaceChildren(...sections);
  }

  variantSelect.addEventListener("change", drawTables);
  drawTables();
}

/** @param {string} method */
function methodName(method) {
  return method === "ieee_standard" || method === "other_standard"
    ? t("method." + method)
    : method;
}

/** @param {HTMLElement} container @param {string} label @param {{value: number | null, years: number[]}} extreme @param {string} unit @param {string} locale */
function appendExtreme(container, label, extreme, unit, locale) {
  container.append(
    textElement(
      "p",
      label +
      ": " +
      formatNumber(extreme.value, locale, 3) +
      " " +
      unit +
      " (" +
      extreme.years.map((year) => formatYear(year, locale)).join(", ") +
      ").",
    ),
  );
}
