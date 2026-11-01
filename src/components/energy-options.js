// @ts-check
import { t } from "../i18n.js";
import { formatNumber } from "../format.js";
import { estimateBatteryBackup, checkBatteryPower } from "../calculations/battery-backup.js";
import { estimateSolarEconomics } from "../calculations/solar-economics.js";
import { solarBatteryBaseline } from "../calculations/solar-battery.js";

/** @param {string} tag @param {string} [key] */
function node(tag, key) {
  const element = document.createElement(tag);
  if (key) element.textContent = t("options." + key);
  return element;
}

/** Additive section sharing the planner's live household assumptions.
 * @param {() => {dailyKwh: number, essentialPercent: number, days: number}} household
 */
export function createEnergyOptions(household) {
  const section = node("section");
  section.className = "energy-options";
  section.setAttribute("aria-labelledby", "energy-options-title");
  const heading = node("h3", "title");
  heading.id = "energy-options-title";
  const selectorLabel = node("label", "choose");
  selectorLabel.setAttribute("for", "energy-option");
  const selector = document.createElement("select");
  selector.id = "energy-option";
  for (const value of ["battery", "solar", "combined"]) selector.append(new Option(t("options." + value), value));
  section.append(heading, node("p", "intro"), selectorLabel, selector);

  /** @type {Map<string, HTMLInputElement>} */
  const fields = new Map();
  /** @param {HTMLElement} parent @param {string} key @param {string} [value] @param {number} [max] @param {string} [type] */
  function field(parent, key, value = "", max, type = "number") {
    const wrapper = node("div");
    const label = node("label", key);
    const input = document.createElement("input");
    input.id = "option-" + key;
    label.setAttribute("for", input.id);
    input.type = type;
    input.defaultValue = value;
    if (type === "number") { input.min = "0"; input.step = "any"; }
    if (max !== undefined) input.max = String(max);
    fields.set(key, input);
    wrapper.append(label, input);
    parent.append(wrapper);
  }
  /** @param {HTMLElement} parent */
  function grid(parent) {
    const element = node("div");
    element.className = "plan-inputs";
    parent.append(element);
    return element;
  }
  const battery = node("div");
  battery.append(node("h4", "batteryInputs"));
  const batteryInputs = grid(battery);
  field(batteryInputs, "capacity", "15");
  field(batteryInputs, "available", "100", 100);
  field(batteryInputs, "efficiency", "90", 100);
  battery.append(node("p", "capacityHint"));
  const power = node("details");
  power.append(node("summary", "powerTitle"), node("p", "powerHint"));
  const powerInputs = grid(power);
  for (const key of ["continuous", "surge", "running", "starting"]) field(powerInputs, key);
  battery.append(power);

  const solar = node("div");
  solar.append(node("h4", "solarInputs"), node("p", "solarHint"));
  const sourceLink = document.createElement("a");
  sourceLink.href = "https://pvwatts.nlr.gov/";
  sourceLink.target = "_blank";
  sourceLink.rel = "noopener noreferrer";
  sourceLink.textContent = t("options.pvwattsLink");
  solar.append(sourceLink);
  const solarInputs = grid(solar);
  field(solarInputs, "location", "", undefined, "text");
  field(solarInputs, "array", "8");
  field(solarInputs, "generation");
  field(solarInputs, "selfConsumed", "", 100);
  field(solarInputs, "retail");
  field(solarInputs, "export");
  for (const key of ["location", "array"]) fields.get(key)?.addEventListener("input", () => {
    const generation = fields.get("generation");
    if (generation) generation.value = "";
  });
  solar.append(node("p", "productionHint"), node("p", "selfConsumedHint"));

  const economicsInputs = node("details");
  economicsInputs.setAttribute("open", "");
  economicsInputs.append(node("summary", "costs"));
  const costGrid = grid(economicsInputs);
  // Separate costs avoid silently carrying a battery quote into solar payback.
  const batteryCost = node("div");
  const solarCost = node("div");
  const combinedCost = node("div");
  field(batteryCost, "batteryCost");
  field(solarCost, "solarCost");
  field(combinedCost, "combinedCost");
  costGrid.append(batteryCost, solarCost, combinedCost);
  const maintenance = node("div");
  field(maintenance, "maintenance");
  costGrid.append(maintenance);

  const results = node("div");
  results.setAttribute("aria-live", "polite");
  section.append(battery, solar, economicsInputs, results);
  /** @param {string} key */
  function value(key) {
    const input = fields.get(key);
    return !input || input.value.trim() === "" || !input.validity.valid ? NaN : Number(input.value);
  }
  const locale = document.documentElement.lang || "en";
  /** @param {number | null} n */
  const number = (n) => n === null ? t("options.notCalculated") : formatNumber(n, locale, 1) ?? "";
  /** @param {HTMLElement} target @param {string} key @param {number | null} amount @param {string} unit */
  function stat(target, key, amount, unit) {
    const card = node("div");
    card.className = "plan-result";
    const display = node("p");
    display.className = "plan-number";
    display.textContent = number(amount) + (amount === null ? "" : " " + unit);
    card.append(node("h4", key), display);
    target.append(card);
  }
  /** @param {string} key */
  function message(key) { results.append(node("p", key)); }
  function resultGrid() {
    const element = node("div");
    element.className = "plan-results";
    results.append(element);
    return element;
  }
  function update() {
    const mode = selector.value;
    const hasBattery = mode !== "solar";
    const hasSolar = mode !== "battery";
    battery.hidden = !hasBattery;
    solar.hidden = !hasSolar;
    batteryCost.hidden = mode !== "battery";
    solarCost.hidden = mode !== "solar";
    combinedCost.hidden = mode !== "combined";
    maintenance.hidden = !hasSolar;
    for (const input of fields.values()) input.setAttribute("aria-invalid", String(input.value !== "" && !input.validity.valid));
    const shared = household();
    const essentialKwhPerDay = Number.isFinite(shared.essentialPercent) && shared.essentialPercent >= 0 && shared.essentialPercent <= 100
      ? shared.dailyKwh * shared.essentialPercent / 100 : NaN;
    results.replaceChildren(node("h4", "resilience"));
    if (hasBattery) {
      const input = { essentialKwhPerDay, outageDays: shared.days, usableBatteryKwh: value("capacity"),
        availableFraction: value("available") / 100, deliveryEfficiency: value("efficiency") / 100 };
      const estimate = mode === "combined" ? solarBatteryBaseline(input).batteryOnly : estimateBatteryBackup(input);
      if (estimate) {
        const group = resultGrid();
        stat(group, "delivered", estimate.deliveredKwh, "kWh");
        stat(group, mode === "combined" ? "baselineHours" : "backupHours", estimate.backupHours, t("options.hoursUnit"));
        stat(group, "shortfall", estimate.shortfallKwh, "kWh");
        if (estimate.backupHours === null) message("zeroLoad");
        message("batteryLimit");
      } else message("batteryInvalid");
      const checked = checkBatteryPower({ continuousKw: value("continuous"), surgeKw: value("surge"), runningKw: value("running"), startingKw: value("starting") });
      message("power." + checked);
      if (mode === "combined") message("combinedLimit");
    } else message("solarResilience");
    results.append(node("h4", "economics"));
    const cost = value(mode === "battery" ? "batteryCost" : mode === "solar" ? "solarCost" : "combinedCost");
    if (mode === "battery") {
      if (Number.isFinite(cost)) stat(resultGrid(), "enteredCost", cost, "USD");
      message("batteryEconomics");
      return;
    }
    const generation = value("generation");
    const array = value("array");
    const location = fields.get("location")?.value.trim();
    const productionReady = Boolean(location) && Number.isFinite(array) && array > 0 && Number.isFinite(generation) && generation >= 0;
    if (!productionReady) { message("productionMissing"); return; }
    const production = resultGrid();
    stat(production, "annualGeneration", generation, "kWh");
    const annualUse = shared.dailyKwh * 365;
    stat(production, "annualUse", Number.isFinite(annualUse) && annualUse >= 0 ? annualUse : null, "kWh");
    const ratio = annualUse > 0 ? generation / annualUse * 100 : NaN;
    stat(production, "generationEquivalent", Number.isFinite(ratio) ? ratio : null, "%");
    message("generationLimit");
    const financial = estimateSolarEconomics({ dailyKwh: shared.dailyKwh, annualGenerationKwh: generation,
      selfConsumedFraction: value("selfConsumed") / 100, retailRate: value("retail"), exportRate: value("export"),
      installedCost: cost, annualMaintenance: value("maintenance") });
    if (!financial) { message("economicsMissing"); return; }
    const finances = resultGrid();
    stat(finances, "selfConsumedResult", financial.selfConsumedKwh, "kWh");
    stat(finances, "exportedResult", financial.exportedKwh, "kWh");
    stat(finances, "savings", financial.annualSavings, t("options.usdYear"));
    const payback = resultGrid();
    stat(payback, "enteredCost", cost, "USD");
    stat(payback, "payback", financial.simplePaybackYears, t("options.yearsUnit"));
    if (financial.simplePaybackYears === null) message("noPayback");
    message("economicsLimit");
    if (mode === "combined") message("combinedEconomics");
  }
  return { element: section, update };
}
