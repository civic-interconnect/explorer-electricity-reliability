// @ts-check
import { parseHash } from "./state.js";
import { recalledUtilityHash } from "./last-utility.js";
import { loadLocale, t } from "./i18n.js";
import * as search from "./views/search.js";
import * as planning from "./views/planning.js";
import * as utility from "./views/utility.js";
import * as compare from "./views/compare.js";
import * as method from "./views/method.js";
import * as glossary from "./views/glossary.js";

/** @type {Record<string, { render: (container: HTMLElement, route: import("./state.js").Route) => void }>} */
const views = { search, utility, compare, method, glossary, planning };

/**
 * @param {string} id
 * @returns {HTMLElement}
 */
function requireElement(id) {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error("Missing element #" + id);
  }
  return element;
}

function renderNav() {
  const nav = requireElement("nav");
  nav.replaceChildren();

  const docsBase =
    "https://civic-interconnect.github.io/explorer-electricity-reliability/";

  const links = [
    {
      href: "#/",
      labelKey: "nav.search",
      external: false,
    },
    { href: "#/planning", labelKey: "nav.planning", external: false },
    {
      href: new URL("en/methods/", docsBase).href,
      labelKey: "nav.method",
      external: true,
    },
    {
      href: new URL("en/glossary/", docsBase).href,
      labelKey: "nav.glossary",
      external: true,
    },
  ];

  for (const link of links) {
    const anchor = document.createElement("a");
    anchor.href = link.href;
    anchor.textContent = t(link.labelKey);

    if (link.labelKey === "nav.search") {
      anchor.classList.add("nav-primary");
    }

    if (link.external) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }

    nav.append(anchor);
  }
}

function renderFooter() {
  const footer = requireElement("footer");
  footer.replaceChildren();
  const credit = document.createElement("p");
  credit.textContent = t("footer.credit");
  const affiliation = document.createElement("p");
  affiliation.textContent = t("footer.affiliation");

  footer.append(credit, affiliation);

  const links = document.createElement("p");
  const repoLink = document.createElement("a");
  repoLink.href = t("footer.repo_url");
  repoLink.textContent = t("footer.repo_label");
  const separator = document.createTextNode(" | ");
  const appLink = document.createElement("a");
  appLink.href = t("footer.app_url");
  appLink.textContent = t("footer.app_label");
  links.append(repoLink, separator, appLink);

  footer.append(links);
}

function renderRoute() {
  const container = requireElement("app");
  const route = parseHash(window.location.hash);
  const view = views[route.view] ?? search;
  view.render(container, route);
}

async function start() {
  const language = await loadLocale(navigator.language.split("-")[0] ?? "en");
  document.documentElement.lang = language;
  document.title = t("app.title");
  requireElement("app-title").textContent = t("app.title");
  renderNav();
  renderFooter();
  const recalled = recalledUtilityHash(window.location.hash);
  if (recalled) window.history.replaceState(null, "", recalled);
  renderRoute();
  window.addEventListener("hashchange", renderRoute);
}

start().catch((error) => {
  requireElement("app").textContent = String(error);
});
