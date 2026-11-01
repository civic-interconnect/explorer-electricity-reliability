// @ts-check
import { t } from "../i18n.js";

/**
 * @param {HTMLElement} container
 * @returns {void}
 */
export function render(container) {
  const heading = document.createElement("h2");
  heading.textContent = t("glossary.title");
  const status = document.createElement("p");
  status.textContent = t("view.notBuilt");
  container.replaceChildren(heading, status);
}
