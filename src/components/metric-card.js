// @ts-check
import { formatNumber, formatYear } from "../format.js";
import { t } from "../i18n.js";

/** Generic presentation of the latest reporting year, even when its value is missing.
 * @param {{label: string, unit: string, context: string, latest: import("../metric-series.js").Observation | null, locale: string}} options
 */
export function metricCard({ label, unit, context, latest, locale }) {
  const card = document.createElement("section");
  card.className = "metric-card";
  card.setAttribute("aria-label", label);
  const heading = document.createElement("h3");
  heading.textContent = label;
  const period = document.createElement("p");
  period.textContent = latest ? formatYear(latest.year, locale) + " · " + t("metric.reportingYear") : t("metric.noYears");
  const value = document.createElement("p");
  value.className = "metric-value";
  value.textContent = formatNumber(latest?.value, locale) ?? t("value.missing");
  if (latest?.status === "invalid" || latest?.status === "duplicate") value.textContent = t("metric.discrepancy");
  const units = document.createElement("p");
  units.textContent = unit;
  const detail = document.createElement("p");
  detail.className = "metric-context";
  detail.textContent = context;
  card.append(heading, period, value, units, detail);
  return card;
}
