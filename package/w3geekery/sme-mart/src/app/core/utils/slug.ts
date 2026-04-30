/**
 * Convert an org name to a URL-safe slug for use in tag names and identifiers.
 * Lowercase, replace whitespace with hyphens, remove non-alphanumeric except hyphens.
 *
 * Example: "W3Geekery Inc." -> "w3geekery-inc"
 *
 * @param name — Org name
 * @returns — slugified name (lowercase, hyphens, alphanumeric only)
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')            // whitespace → hyphen
    .replace(/[^a-z0-9-]/g, '');     // remove non-alphanumeric except hyphen
}
