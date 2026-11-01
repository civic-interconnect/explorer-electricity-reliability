import { buildList } from "../selectors/list-builder.js";
import { selectList, findOption } from "../selectors/list-selector.js";
import { createDropdown, createTextFilter } from "../selectors/dropdown-view.js";

/** @import {ListOption} from '../selectors/list-builder.js' */

/** @typedef {{ id: string | number, name: string, state?: string | null }} UtilityInput */
/** @typedef {{ id: string, name: string, state: string }} UtilityChoice */

/**
 * Adapter: turn normalized EIA/PUDL utility identifiers into generic options.
 * A utility may report in multiple states. Keep (state, utility ID) distinct.
 * Repeated annual records for the same pair produce one choice.
 *
 * @param {readonly UtilityInput[]} records
 * @returns {{utilities: UtilityChoice[], options: ListOption[], lookup: Map<string, UtilityChoice>}}
 */
export function buildUtilityChoices(records) {
  /** @type {Map<string, UtilityChoice>} */
  const lookup = new Map();
  for (const row of records) {
    const id = String(row.id ?? "").trim();
    const name = String(row.name ?? "").trim();
    const state = String(row.state ?? "").trim().toUpperCase();
    if (!id || !name) continue;
    // JSON encoding avoids collisions between components of a composite key.
    const key = JSON.stringify([state, id]);
    if (!lookup.has(key)) lookup.set(key, { id, name, state });
  }
  const utilities = [...lookup.values()];
  const options = buildList(utilities, {
    valueOf: (u) => JSON.stringify([u.state, u.id]),
    labelOf: (u) => `${u.name}${u.state ? ` (${u.state})` : ""} — ID ${u.id}`,
    searchOf: (u) => `${u.name} ${u.id} ${u.state}`,
  });
  return { utilities, options, lookup };
}

/**
 * Composite selector: State -> Search -> Utility.
 * No data acquisition or routing is done here; the caller owns both.
 *
 * @param {HTMLElement} container
 * @param {readonly UtilityInput[]} records
 * @param {(utility: UtilityChoice) => void} onSelect
 * @param {{maxOptions?: number}} [config]
 * @returns {void}
 */
export function renderUtilityPicker(container, records, onSelect, { maxOptions = 100 } = {}) {
  const { utilities, options, lookup } = buildUtilityChoices(records);
  const states = buildList(
    utilities.filter((utility) => utility.state),
    { valueOf: (u) => u.state, labelOf: (u) => u.state },
  );

  const root = document.createElement("section");
  root.className = "utility-picker";
  root.setAttribute("aria-label", "Find a utility");
  container.replaceChildren(root);

  let selectedState = "";
  let query = "";
  const stateSelect = createDropdown(root, {
    id: "utility-state-filter",
    label: "State",
    placeholder: "All states and jurisdictions",
    onChange: (value) => {
      selectedState = value;
      refresh();
    },
  });
  stateSelect.update(states);
  // Native select is a natural fit for the relatively short state list.
  stateSelect.element.disabled = false;

  createTextFilter(root, {
    id: "utility-name-filter",
    label: "Filter by utility name or ID",
    placeholder: "Type a name or EIA utility ID",
    onInput: (value) => {
      query = value;
      refresh();
    },
  });

  const utilitySelect = createDropdown(root, {
    id: "utility-select",
    label: "Utility",
    placeholder: "Select a utility…",
    onChange: (value) => {
      const selected = findOption(options, value);
      if (!selected) return;
      const utility = lookup.get(selected.value);
      if (utility) onSelect(utility);
    },
  });

  const status = document.createElement("p");
  status.id = "utility-results-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  root.append(status);
  utilitySelect.element.setAttribute("aria-describedby", status.id);

  function refresh() {
    const matches = selectList(options, {
      query,
      limit: maxOptions,
      include: (option) => {
        if (!selectedState) return true;
        const utility = lookup.get(option.value);
        return utility?.state === selectedState;
      },
    });
    utilitySelect.update(matches.options);
    status.textContent = matches.truncated
      ? `Showing ${matches.options.length} of ${matches.total} matching utilities. Narrow the search.`
      : `${matches.total} matching ${matches.total === 1 ? "utility" : "utilities"}.`;
  }
  refresh();
}
