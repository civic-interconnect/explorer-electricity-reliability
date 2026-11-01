// @ts-check
/**
 * Number formatting uses the browser's built-in Intl API, so no library is needed.
 */

/**
 * @param {number | null | undefined} value
 * @param {string} locale BCP 47 language tag, for example "en" or "de".
 * @param {number} [maximumFractionDigits]
 * @returns {string | null} Null when the value is missing, so the caller can show "Not reported".
 */
export function formatNumber(value, locale, maximumFractionDigits = 1) {
  if (value === null || value === undefined) {
    return null;
  }
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

/**
 * @param {number} year
 * @param {string} locale BCP 47 language tag.
 * @returns {string} The year without a thousands separator.
 */
export function formatYear(year, locale) {
  return new Intl.NumberFormat(locale, { useGrouping: false }).format(year);
}
