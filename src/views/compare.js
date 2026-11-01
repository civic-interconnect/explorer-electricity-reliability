// @ts-check
import { t } from "../i18n.js";

/**
 * @param {HTMLElement} container
 * @param {import("../state.js").Route} route
 * @returns {void}
 */
export function render(container, route) {
  const heading = document.createElement("h2");
  heading.textContent = t("compare.title");
  const identifier = document.createElement("p");
  identifier.textContent = String(route.jurisdiction) + " / " + String(route.scheme) + " / " + String(route.value);
  const status = document.createElement("p");
  status.textContent = t("view.notBuilt");
  container.replaceChildren(heading, identifier, status);
}
