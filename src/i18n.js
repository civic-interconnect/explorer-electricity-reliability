// @ts-check
/**
 * User interface strings live in locales/<language>.json, keyed by stable IDs.
 * Missing keys fall back to the key itself, so a gap is visible and never blank.
 */

/** @type {Record<string, string>} */
let strings = {};

/**
 * Load UI strings for a language, falling back to English.
 * @param {string} language Primary language subtag, for example "en".
 * @returns {Promise<string>} The language that was actually loaded.
 */
export async function loadLocale(language) {
  const requested = /^[a-z]{2,3}$/.test(language) ? language : "en";
  const candidates = requested === "en" ? ["en"] : [requested, "en"];
  for (const candidate of candidates) {
    const response = await fetch("locales/" + candidate + ".json");
    if (response.ok) {
      strings = await response.json();
      return candidate;
    }
  }
  throw new Error("No locale file could be loaded.");
}

/**
 * Replace the strings in use. Used by tests.
 * @param {Record<string, string>} newStrings
 * @returns {void}
 */
export function setStrings(newStrings) {
  strings = newStrings;
}

/**
 * @param {string} key Stable string ID such as "nav.search".
 * @returns {string}
 */
export function t(key) {
  const value = strings[key];
  if (value === undefined) {
    return key;
  }
  return value;
}
