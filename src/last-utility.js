// @ts-check
import { buildHash, parseHash } from "./state.js";
import { DEFAULT_JURISDICTION, UTILITY_SCHEME } from "./identifiers.js";

const STORAGE_KEY = "electricity-reliability:last-utility:v1";
/** @typedef {() => Pick<Storage, "getItem" | "setItem">} StorageProvider */

/** @param {import("./state.js").Route} route */
function isUtility(route) {
  return route.view === "utility" && route.jurisdiction === DEFAULT_JURISDICTION &&
    route.scheme === UTILITY_SCHEME && /^\d+$/.test(route.value ?? "");
}

/** Remember only after a successful load. Storage is optional.
 * @param {import("./state.js").Route} route
 * @param {StorageProvider} [storage]
 */
export function rememberUtility(route, storage = () => window.localStorage) {
  if (!isUtility(route)) return;
  try {
    storage().setItem(STORAGE_KEY, buildHash(route));
  } catch {
    // Blocked storage or a full quota must not prevent viewing a utility.
  }
}

/** Restore only on bare-site startup, never on hashchange.
 * Explicit routes, including the picker, always win.
 * @param {string} hash
 * @param {StorageProvider} [storage]
 * @returns {string | null}
 */
export function recalledUtilityHash(hash, storage = () => window.localStorage) {
  if (hash !== "" && hash !== "#") return null;
  try {
    const saved = storage().getItem(STORAGE_KEY);
    if (!saved) return null;
    const route = parseHash(saved);
    return isUtility(route) ? buildHash(route) : null;
  } catch {
    return null;
  }
}
