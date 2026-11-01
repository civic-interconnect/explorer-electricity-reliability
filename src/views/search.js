// @ts-check
import { t } from "../i18n.js";
import { loadUtilityIndex } from "../utility-index.js";
import { renderUtilityPicker } from "../components/utility-picker.js";
import { buildHash } from "../state.js";

/**
 * Search view: compose the existing heading and explanation with the shared
 * State → name/ID filter → Utility selector. Data loading is separate.
 *
 * @param {HTMLElement} container
 * @returns {void}
 */
export function render(container) {
  const heading = document.createElement("h2");
  heading.textContent = t("search.title");

  const limits = document.createElement("p");
  limits.textContent = t("limits.short");

  const pickerHost = document.createElement("div");
  const status = document.createElement("p");
  status.textContent = "Loading utility directory…";
  status.setAttribute("role", "status");
  pickerHost.append(status);

  container.replaceChildren(heading, limits, pickerHost);

  void loadUtilityIndex()
    .then((utilities) => {
      // Ignore an old result if the user navigated away while data loaded.
      if (!pickerHost.isConnected) return;
      renderUtilityPicker(pickerHost, utilities, ({ id }) => {
        // The EIA utility ID identifies the utility; state is a search filter.
        window.location.hash = buildHash({
          view: "utility",
          jurisdiction: "us",
          scheme: "eia-utility-id",
          value: id,
        });
      });
      if (utilities.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No utilities are present in the published directory.";
        pickerHost.prepend(empty);
      }
    })
    .catch((error) => {
      if (!pickerHost.isConnected) return;
      status.setAttribute("role", "alert");
      status.textContent = `Utility directory unavailable: ${error instanceof Error ? error.message : String(error)}`;
    });
}
