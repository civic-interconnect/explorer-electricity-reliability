/** @import {ListOption} from './list-builder.js' */

/** @param {string} text */
function normalize(text) {
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("en");
}

/**
 * Pure selection/search logic. Returns a bounded list for the dropdown,
 * plus the total number of matches before truncation.
 *
 * @param {readonly ListOption[]} options
 * @param {{
 *   query?: string,
 *   limit?: number,
 *   include?: (option: ListOption) => boolean,
 * }} [criteria]
 * @returns {{options: ListOption[], total: number, truncated: boolean}}
 */
export function selectList(options, { query = "", limit = 100, include = () => true } = {}) {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  const maximum = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 100;
  /** @type {ListOption[]} */
  const shown = [];
  let total = 0;
  for (const option of options) {
    if (!include(option)) continue;
    const haystack = normalize(`${option.label} ${option.value} ${option.searchText}`);
    if (!terms.every((term) => haystack.includes(term))) continue;
    total += 1;
    if (shown.length < maximum) shown.push(option);
  }
  return { options: shown, total, truncated: total > shown.length };
}

/**
 * Resolve an exact selected value, never a display label.
 * @param {readonly ListOption[]} options
 * @param {string} value
 * @returns {ListOption | undefined}
 */
export function findOption(options, value) {
  return options.find((option) => option.value === value);
}
