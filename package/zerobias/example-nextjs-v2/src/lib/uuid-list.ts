/**
 * Parse a free-text list of ids (the RACI / links inputs in the task write demos) into distinct
 * tokens. Splits on commas and any whitespace (so pasted newline- or space-separated lists work),
 * trims, drops blanks, and de-duplicates while preserving first-seen order.
 *
 * This is deliberately parsing-only — it does NOT validate that a token is a UUID. The caller runs
 * each token through the SDK's `toUUID` (in a try/catch) so an in-progress, not-yet-valid entry is
 * simply omitted from the payload rather than throwing. Keeping the split pure makes it testable
 * without the SDK.
 */
export function splitUuidList(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const token of raw.split(/[\s,]+/)) {
    const t = token.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}
