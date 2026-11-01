// @ts-check
/**
 * Data loading for the explorer.
 *
 * The explorer reads published files from a data repository's GitHub Pages site.
 * It refuses any file whose schemaVersion major version it does not support.
 */

/** The major version of the data format this build of the app understands. */
export const SUPPORTED_SCHEMA_MAJOR = 1;

/**
 * @param {string} schemaVersion Semantic version such as "1.0.0".
 * @returns {number} The major version.
 */
export function majorVersion(schemaVersion) {
  const match = /^(\d+)\.\d+\.\d+$/.exec(schemaVersion);
  if (match === null) {
    throw new Error("Invalid schemaVersion: " + String(schemaVersion));
  }
  return Number(match[1]);
}

/**
 * @param {string} schemaVersion Semantic version such as "1.0.0".
 * @returns {void}
 */
export function assertSupportedSchema(schemaVersion) {
  const major = majorVersion(schemaVersion);
  if (major !== SUPPORTED_SCHEMA_MAJOR) {
    throw new Error(
      "Unsupported schemaVersion " + schemaVersion + ". This app supports major version " + String(SUPPORTED_SCHEMA_MAJOR) + ".",
    );
  }
}

/**
 * @param {string} url
 * @returns {Promise<any>} Parsed JSON.
 */
export async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not load " + url + " (HTTP " + String(response.status) + ").");
  }
  return await response.json();
}

/**
 * Load a published data file and check its schemaVersion.
 * @param {string} url
 * @returns {Promise<any>} Parsed JSON.
 */
export async function loadDataFile(url) {
  const data = await loadJson(url);
  assertSupportedSchema(data.schemaVersion);
  return data;
}
