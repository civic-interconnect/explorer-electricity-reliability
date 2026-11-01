// @ts-check
import { formatNumber, formatYear } from "../format.js";
import { t } from "../i18n.js";

/** A zero-based scale with four intervals; an all-zero or empty series uses 0–1.
 * @param {import("../metric-series.js").Observation[]} series
 */
export function chartScale(series) {
  const maximum = Math.max(0, ...series.map((point) => point.value ?? 0));
  const magnitude = maximum > 0 ? 10 ** Math.floor(Math.log10(maximum)) : 1;
  const upper = maximum > 0 ? Math.ceil(maximum / magnitude) * magnitude : 1;
  return { upper, ticks: Array.from({ length: 5 }, (_, index) => upper * index / 4) };
}

/** @param {string} name @param {Record<string, string | number>} attributes @param {string} [text] */
function svgElement(name, attributes, text) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  if (text !== undefined) element.textContent = text;
  return element;
}

/** Responsive SVG with a text equivalent in the adjacent yearly table.
 * @param {{series: import("../metric-series.js").Observation[], label: string, unit: string, context: string, locale: string}} options
 * @returns {{element: HTMLElement, disconnect: () => void}}
 */
export function yearlyBarChart({ series, label, unit, context, locale }) {
  const figure = document.createElement("figure");
  figure.className = "yearly-chart";
  const caption = document.createElement("figcaption");
  caption.textContent = label + " · " + unit + " · " + context;
  const svg = svgElement("svg", { role: "img", "aria-label": caption.textContent });
  const legend = document.createElement("p");
  legend.className = "chart-legend";
  legend.textContent = t("chart.legend");
  figure.append(caption, svg, legend);

  /** @param {number} width */
  function draw(width) {
    width = Math.max(280, width);
    const left = 52;
    const baseline = 244;
    const plotHeight = 208;
    const slot = (width - left - 12) / Math.max(series.length, 1);
    const scale = chartScale(series);
    svg.setAttribute("viewBox", `0 0 ${width} 310`);
    svg.replaceChildren(svgElement("title", {}, caption.textContent ?? ""), svgElement("desc", {}, t("chart.legend")));
    for (const tick of scale.ticks) {
      const y = baseline - tick / scale.upper * plotHeight;
      svg.append(svgElement("line", { x1: left, x2: width - 12, y1: y, y2: y, class: "chart-grid" }));
      svg.append(svgElement("text", { x: left - 8, y: y + 4, "text-anchor": "end" }, formatNumber(tick, locale, 3) ?? ""));
    }
    series.forEach((point, index) => {
      const x = left + slot * (index + 0.5);
      const year = formatYear(point.year, locale);
      const description = year + ": " + (point.value === null ? t(point.status === "missing" ? "value.missing" : "metric.discrepancy") : formatNumber(point.value, locale, 3) + " " + unit);
      const group = svgElement("g", {});
      group.append(svgElement("title", {}, description));
      if (point.value === null) {
        group.append(svgElement("text", { x, y: baseline - 8, "text-anchor": "middle", class: "chart-gap" }, point.status === "missing" ? "-" : "!"));
      } else if (point.value === 0) {
        group.append(svgElement("circle", { cx: x, cy: baseline, r: 3, class: "chart-zero" }));
      } else {
        const height = point.value / scale.upper * plotHeight;
        group.append(svgElement("rect", { x: x - slot * 0.32, y: baseline - height, width: slot * 0.64, height, class: "chart-bar" }));
      }
      const rotate = slot < 42;
      group.append(svgElement("text", { x, y: baseline + 20, "text-anchor": rotate ? "end" : "middle", ...(rotate ? { transform: `rotate(-55 ${x} ${baseline + 20})` } : {}) }, year));
      svg.append(group);
    });
  }
  draw(640);
  const observer = new ResizeObserver((entries) => draw(entries[0].contentRect.width));
  observer.observe(figure);
  return { element: figure, disconnect: () => observer.disconnect() };
}
