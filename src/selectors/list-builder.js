/**
 * A display option is independent of the data domain (utilities, states, years).
 * @typedef {{value: string, label: string, searchText: string}} ListOption
 */

/**
 * Build a unique, alphabetically sorted option list from arbitrary records.
 * The caller supplies the stable key and display label. The first record
 * encountered for a key supplies its label; callers should choose which
 * historical name is authoritative before building the list.
 *
 * @template T
 * @param {readonly T[]} records
 * @param {{
 *   valueOf: (record: T) => string | number | null | undefined,
 *   labelOf: (record: T) => string | null | undefined,
 *   searchOf?: (record: T) => string | null | undefined,
 * }} config
 * @returns {ListOption[]}
 */
export function buildList(records, { valueOf, labelOf, searchOf }) {
  /** @type {Map<string, ListOption>} */
  const result = new Map();
  for (const record of records) {
    const value = String(valueOf(record) ?? "").trim();
    const label = String(labelOf(record) ?? "").trim();
    if (!value || !label || result.has(value)) continue;
    const searchText = String(searchOf?.(record) ?? "").trim();
    result.set(value, { value, label, searchText });
  }
  return [...result.values()].sort(
    (a, b) =>
      a.label.localeCompare(b.label, "en", { sensitivity: "base", numeric: true }) ||
      a.value.localeCompare(b.value, "en", { numeric: true }),
  );
}
