// @ts-check
/**
 * Routes are kept in the URL hash so that every view can be linked to.
 *
 *   #/                                  find a utility
 *   #/method                            how the numbers are calculated
 *   #/glossary                          glossary
 *   #/<jurisdiction>/<scheme>/<value>   one utility, for example #/us/eia-utility-id/12345
 *   #/compare/<jurisdiction>/<scheme>/<value>
 *
 * A utility is identified by a qualified identifier (scheme and value), not by a
 * subdivision, because a utility can serve more than one subdivision.
 */

/**
 * @typedef {object} Route
 * @property {"search" | "utility" | "compare" | "method" | "glossary" | "planning"} view
 * @property {string} [jurisdiction]
 * @property {string} [scheme]
 * @property {string} [value]
 */

/**
 * @param {string} path Slash-separated, percent-encoded parts.
 * @returns {string[] | null} The decoded parts, or null if the path is malformed.
 */
function decodeParts(path) {
  try {
    return path.split("/").map((part) => decodeURIComponent(part));
  } catch {
    return null;
  }
}

/**
 * @param {string} hash For example "#/us/eia-utility-id/12345".
 * @returns {Route}
 */
export function parseHash(hash) {
  const cleaned = hash.replace(/^#\/?/, "");
  if (cleaned === "") {
    return { view: "search" };
  }

  const parts = decodeParts(cleaned);
  if (parts === null || parts.some((part) => part === "")) {
    return { view: "search" };
  }

  if (parts.length === 1 && parts[0] === "planning") return { view: "planning" };

  if (parts.length === 1 && parts[0] === "method") {
    return { view: "method" };
  }
  if (parts.length === 1 && parts[0] === "glossary") {
    return { view: "glossary" };
  }
  if (parts.length === 3) {
    return { view: "utility", jurisdiction: parts[0], scheme: parts[1], value: parts[2] };
  }
  if (parts.length === 4 && parts[0] === "compare") {
    return { view: "compare", jurisdiction: parts[1], scheme: parts[2], value: parts[3] };
  }
  return { view: "search" };
}

/**
 * @param {Route} route
 * @returns {string} A hash such as "#/us/eia-utility-id/12345".
 */
export function buildHash(route) {
  if (route.view === "planning") return "#/planning";
  if (route.view === "method") {
    return "#/method";
  }
  if (route.view === "glossary") {
    return "#/glossary";
  }
  if (route.view === "utility" || route.view === "compare") {
    if (route.jurisdiction === undefined || route.scheme === undefined || route.value === undefined) {
      throw new Error("A " + route.view + " route needs jurisdiction, scheme and value.");
    }
    const path = [route.jurisdiction, route.scheme, route.value].map((part) => encodeURIComponent(part)).join("/");
    if (route.view === "compare") {
      return "#/compare/" + path;
    }
    return "#/" + path;
  }
  return "#/";
}
