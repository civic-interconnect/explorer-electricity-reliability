// @ts-check
import { t } from "../i18n.js";
import { formatNumber } from "../format.js";
import { electricityPlan, propanePlan } from "../outage-plan.js";
import { createEnergyOptions } from "../components/energy-options.js";

/** @param {HTMLElement} container */
export function render(container) {
  const page = document.createElement("article");
  page.className = "outage-planner";
  // This template contains only static markup. Localized strings use textContent.
  page.innerHTML = `
    <p class="plan-eyebrow" data-text="planner.draft"></p>
    <h2 data-text="planner.title"></h2>
    <p class="plan-intro" data-text="planner.intro"></p>
    <p class="plan-note" data-text="planner.examples"></p>
    <form novalidate>
      <section aria-labelledby="plan-electricity-title">
        <h3 id="plan-electricity-title" data-text="planner.electricity"></h3>
        <div class="plan-inputs">
          <div><label for="plan-daily" data-text="planner.daily"></label>
            <input id="plan-daily" type="number" min="0" step="any" value="30" required aria-describedby="plan-daily-hint">
            <p id="plan-daily-hint" class="plan-hint" data-text="planner.dailyHint"></p></div>
          <div><label for="plan-share" data-text="planner.share"></label>
            <div class="plan-slider"><input id="plan-share" type="range" min="0" max="100" step="1" value="40"><output for="plan-share" id="plan-share-value">40%</output></div>
            <p class="plan-hint" data-text="planner.shareHint"></p></div>
          <div><label for="plan-days" data-text="planner.days"></label>
            <input id="plan-days" type="number" min="0.1" step="any" value="3" required aria-describedby="plan-days-hint">
            <div class="plan-presets" role="group" data-label="planner.scenarios">
              <button type="button" data-days="1" data-text="planner.oneDay"></button>
              <button type="button" data-days="3" data-text="planner.threeDays"></button>
              <button type="button" data-days="7" data-text="planner.sevenDays"></button>
            </div><p id="plan-days-hint" class="plan-hint" data-text="planner.daysHint"></p></div>
        </div>
        <p id="plan-energy-error" class="plan-error" role="alert" hidden data-text="planner.energyError"></p>
        <div id="plan-energy-results" aria-live="polite" aria-atomic="true">
          <div class="plan-results">
            <div class="plan-result plan-result-primary"><h4 data-text="planner.essentialTotal"></h4><p id="plan-essential-total" class="plan-number"></p><p id="plan-period"></p></div>
            <div class="plan-result"><h4 data-text="planner.essentialDaily"></h4><p id="plan-essential-daily" class="plan-number"></p><p data-text="planner.reduced"></p></div>
            <div class="plan-result"><h4 data-text="planner.normalTotal"></h4><p id="plan-normal-total" class="plan-number"></p><p data-text="planner.beforeReduction"></p></div>
          </div>
          <div class="plan-energy-bar" aria-hidden="true"><span id="plan-essential-bar"></span></div>
          <p id="plan-energy-caption" class="plan-hint"></p>
        </div>
        <p data-text="planner.energyLimit"></p>
      </section>
      <details class="plan-fuel">
        <summary data-text="planner.fuelTitle"></summary>
        <p data-text="planner.fuelIntro"></p>
        <div class="plan-inputs">
          <div><label for="plan-burn" data-text="planner.burn"></label><input id="plan-burn" type="number" min="0" step="any" value="1" required><p class="plan-hint" data-text="planner.burnHint"></p></div>
          <div><label for="plan-hours" data-text="planner.hours"></label><input id="plan-hours" type="number" min="0" max="24" step="any" value="24" required><p class="plan-hint" data-text="planner.hoursHint"></p></div>
          <div><label for="plan-other" data-text="planner.other"></label><input id="plan-other" type="number" min="0" step="any" value="6" required></div>
          <div><label for="plan-tank" data-text="planner.tank"></label><select id="plan-tank"><option value="250">250 gal</option><option value="500" selected>500 gal</option><option value="1000">1,000 gal</option></select></div>
        </div>
        <p data-text="planner.fuelAssumptions"></p>
        <div class="plan-tank-bar" aria-hidden="true"><span></span><span></span><span></span></div>
        <p class="plan-hint" data-text="planner.tankLegend"></p>
        <p id="plan-fuel-error" class="plan-error" role="alert" hidden data-text="planner.fuelError"></p>
        <div id="plan-fuel-results" aria-live="polite" aria-atomic="true">
          <div class="plan-results">
            <div class="plan-result"><h4 data-text="planner.usable"></h4><p id="plan-usable" class="plan-number"></p></div>
            <div class="plan-result"><h4 data-text="planner.dailyFuel"></h4><p id="plan-fuel-daily" class="plan-number"></p></div>
            <div class="plan-result"><h4 data-text="planner.endurance"></h4><p id="plan-endurance" class="plan-number"></p></div>
          </div>
          <p id="plan-fuel-balance" class="plan-note"></p>
        </div>
        <p data-text="planner.fuelLimit"></p>
      </details>
      <details class="plan-math"><summary data-text="planner.math"></summary><p data-text="planner.energyFormula"></p><p data-text="planner.fuelFormula"></p></details>
      <button type="button" id="plan-reset" data-text="planner.reset"></button>
      <p class="plan-hint" data-text="planner.notSaved"></p>
    </form>`;
  for (const element of page.querySelectorAll("[data-text]")) element.textContent = t(element.getAttribute("data-text") ?? "");
  for (const element of page.querySelectorAll("[data-label]")) element.setAttribute("aria-label", t(element.getAttribute("data-label") ?? ""));

  /** @param {string} id */
  function element(id) {
    const found = page.querySelector("#plan-" + id);
    if (!(found instanceof HTMLElement)) throw new Error("Missing planner element: " + id);
    return found;
  }
  /** @param {string} id */
  function input(id) { return /** @type {HTMLInputElement} */ (element(id)); }
  /** @param {string} id */
  function number(id) {
    const field = input(id);
    // Empty fields stay invalid, never silently become zero.
    return field.value.trim() === "" || !field.validity.valid ? NaN : Number(field.value);
  }
  const locale = document.documentElement.lang || "en";
  /** @param {number} value */
  const formatted = (value) => formatNumber(value, locale, 1) ?? "";
  /** @param {string} key @param {Record<string, string>} values */
  function sentence(key, values) {
    return t(key).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? "");
  }
  const energyOptions = createEnergyOptions(() => ({ dailyKwh: number("daily"), essentialPercent: number("share"), days: number("days") }));
  page.querySelector(".plan-math")?.before(energyOptions.element);

  function update() {
    const days = number("days");
    const share = number("share");
    element("share-value").textContent = formatted(share) + "%";
    input("share").setAttribute("aria-valuetext", formatted(share) + "%");
    for (const button of page.querySelectorAll("[data-days]")) button.setAttribute("aria-pressed", String(Number(button.getAttribute("data-days")) === days));
    for (const field of page.querySelectorAll("input")) field.setAttribute("aria-invalid", String(!field.validity.valid));
    const energy = electricityPlan({ dailyKwh: number("daily"), essentialPercent: share, days });
    element("energy-error").hidden = energy !== null;
    element("energy-results").hidden = energy === null;
    if (energy) {
      element("essential-total").textContent = formatted(energy.essentialTotal) + " kWh";
      element("essential-daily").textContent = formatted(energy.essentialDaily) + " kWh";
      element("normal-total").textContent = formatted(energy.normalTotal) + " kWh";
      element("period").textContent = sentence("planner.period", { days: formatted(days) });
      element("essential-bar").style.width = share + "%";
      element("energy-caption").textContent = sentence("planner.energyCaption", { share: formatted(share), remainder: formatted(100 - share) });
    }
    energyOptions.update();
    const fuel = propanePlan({ burnRate: number("burn"), hoursPerDay: number("hours"), otherPerDay: number("other"), tankGallons: number("tank"), days });
    element("fuel-error").hidden = fuel !== null;
    element("fuel-results").hidden = fuel === null;
    if (fuel) {
      element("usable").textContent = formatted(fuel.usableGallons) + " gal";
      element("fuel-daily").textContent = formatted(fuel.dailyGallons) + " gal";
      element("endurance").textContent = fuel.enduranceDays === null ? t("planner.notApplicable") : sentence("planner.daysValue", { days: formatted(fuel.enduranceDays) });
      element("fuel-balance").textContent = fuel.enduranceDays === null ? t("planner.zeroFuel") : sentence(fuel.coversFuel ? "planner.fuelEnough" : "planner.fuelShort", {
        needed: formatted(fuel.neededGallons), balance: formatted(Math.abs(fuel.balanceGallons)), days: formatted(days),
      });
    }
  }
  const form = /** @type {HTMLFormElement} */ (page.querySelector("form"));
  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  for (const button of page.querySelectorAll("[data-days]")) button.addEventListener("click", () => {
    input("days").value = button.getAttribute("data-days") ?? "3";
    update();
  });
  element("reset").addEventListener("click", () => { form.reset(); update(); });
  container.replaceChildren(page);
  update();
}
