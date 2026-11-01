// @ts-check
/**
 * The qualified identifier used in utility routes: jurisdiction, scheme, value.
 * The utility index and the reliability files hold only EIA utility IDs,
 * so these two values are the same for every utility for now.
 */

/** Lowercase ISO 3166-1 alpha-2 country code. */
export const DEFAULT_JURISDICTION = "us";

/** The numbering system the utility ID value belongs to. */
export const UTILITY_SCHEME = "eia-utility-id";
