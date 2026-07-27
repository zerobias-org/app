/**
 * RFC4515 filter construction for the HL7 v2 DataProducer.
 *
 * The module compiles these filters to a SQLite WHERE clause (`filter/Hl7SqlAdapter.java`). Twelve
 * attributes map to real envelope columns (`ENVELOPE_COLUMNS`); anything else degrades to a
 * `json_extract` over the materialized body, which silently returns NULL (and so matches nothing)
 * the moment the path crosses a repeating property. That mapping is not a gate — an unknown
 * attribute is not rejected, it just returns zero rows — so we only ever build filters over the
 * twelve, and the facet values a user can pick are exactly these.
 *
 * "Column" is not "index": `buffer/schema.sql` indexes only `control_id` (unique),
 * `(schema_id, status, received_at)` and a partial index on `lease_id`. The other seven are honest
 * columns behind a table scan — correct answers, just not fast ones. Do not read this list as a
 * performance guarantee.
 *
 * Two module behaviours that constrain what we may emit:
 *
 *   - A LEADING `*` is not a glob. `RFC4515Parser` tests for `=*` before `=`, so `(sendingApp=*LAB)`
 *     parses as a presence check and compiles to `sending_app IS NOT NULL` — it matches everything,
 *     with no error. Only a TRAILING `*` is a real prefix glob. `escapeFilterValue` escapes every
 *     `*` in user input for exactly this reason; the one in `buildFilter`'s prefix branch is the
 *     only unescaped glob we ever emit, and it is the last character.
 *   - `sortBy` / `sortDir` are accepted and discarded: `BufferStore.search` hardcodes
 *     `ORDER BY received_at DESC, id DESC`. There is no server-side sort to offer.
 *
 * There is no segment axis, and there cannot be one built from here. The buffer stores no segment
 * column, the module publishes no `by-segment` container (`ObjectTree` emits messages, by-type,
 * by-version, by-sender, by-port, stats and ops — nothing else), and a `json_extract` probe like
 * `(pid=*)` is unsound because materialization nests segments by group: PID is top-level in an
 * ADT_A01 but lives under `$.response[].patient.pid` in an ORU_R01, so the probe would report zero
 * for messages that plainly contain one. Filtering by segment therefore means reading each message,
 * i.e. filtering in the browser over whatever page happens to be loaded. We don't offer it.
 *
 * Verified against the live UAT receiver (module 1.2.3), which corrected two assumptions worth
 * recording so they aren't "fixed" back:
 *
 *   - The message-type attribute is `messageStructure`, NOT `messageType`. `(messageType=ORU_R01)`
 *     is not an error — it returns zero rows, which reads exactly like "no data" in a UI.
 *   - Full ISO-8601 instants DO work in comparisons: `(receivedAt>=2026-07-24T00:00:00Z)` and
 *     `(receivedAt>=2026-07-24)` both return the same 76 rows. (An older note claimed the `:` in a
 *     timestamp is parsed as a `:function:` operator and rejected; that is not true on 1.2.3.)
 *     We still emit date-only bounds for day granularity — shorter, and provably equivalent.
 *
 * The sender axis is MSH-3 (`sendingApp`): `(sendingApp=LAB)` returns 99 rows while
 * `(sendingFacility=LAB)` returns 0, and `/by-sender` is keyed the same way.
 */

/** The receiver's envelope columns — the only attributes we ever put in a filter. */
export type Hl7FilterAttr =
  | 'controlId'
  | 'receivedAt'
  | 'status'
  | 'leaseId'
  | 'hl7Version'
  | 'sourcePort'
  | 'messageStructure'
  | 'messageCode'
  | 'triggerEvent'
  | 'sendingApp'
  | 'sendingFacility'
  | 'schemaId';

/** A search across the receiver. Every field is optional; an empty criteria means "everything". */
export interface Hl7SearchCriteria {
  /** Message structure, e.g. `ORU_R01` (from /by-type). */
  readonly messageStructure?: string;
  /** HL7 version slot, e.g. `2.3` (from /by-version). */
  readonly hl7Version?: string;
  /** Receiving port / channel name, e.g. `PACS Reports ORU` (from /by-port). */
  readonly sourcePort?: string;
  /** MSH-3 sending application, e.g. `LAB` (from /by-sender). */
  readonly sendingApp?: string;
  /** Buffer status. */
  readonly status?: string;
  /** MSH-10 control id. A trailing `*` is honoured as a prefix match. */
  readonly controlId?: string;
  /** Inclusive lower bound on receivedAt — `YYYY-MM-DD` or a full ISO instant. */
  readonly from?: string;
  /** Inclusive upper bound on receivedAt — `YYYY-MM-DD` or a full ISO instant. */
  readonly to?: string;
}

/**
 * Escape a filter literal — the RFC4515 metacharacters ONLY.
 *
 * `*` is the glob and must never reach the parser unescaped (see the leading-`*` note above);
 * `(` and `)` would corrupt the expression itself — an unbalanced one is the only input that draws
 * a 400 rather than a wrong answer; `\` is the escape character.
 *
 * `%` and `_` are deliberately NOT escaped. They are SQL `LIKE` metacharacters, but the module
 * escapes them itself before building the pattern (`Hl7SqlAdapter.likeLit` rewrites `\`, `%` and
 * `_` and appends `ESCAPE '\'`), so escaping them here escapes them twice and the literal backslash
 * ends up in the comparison. Verified against the live UAT receiver — this was a real bug:
 *
 *   (messageStructure=ADT_A01)   -> 6544 rows      (controlId=2228*)  -> 282 rows
 *   (messageStructure=ADT\_A01)  ->    0 rows      (controlId=2_28*)  ->   0 rows
 *
 * The second column is the proof that `_` is not a wildcard on the wire, so passing it raw cannot
 * widen anything. The first is what the UI did until this was fixed: every structure facet contains
 * an underscore, so picking any structure returned "no data".
 */
export function escapeFilterValue(value: string): string {
  return value.replace(/([\\*()])/g, '\\$1');
}

/** One `(attr=value)` clause, with the value escaped. */
export function eq(attr: Hl7FilterAttr, value: string): string {
  return `(${attr}=${escapeFilterValue(value)})`;
}

/** Combine clauses with AND, dropping empties. Returns `''` when nothing is constrained. */
export function and(...clauses: (string | undefined | null)[]): string {
  const kept = clauses.filter((c): c is string => !!c && c.length > 0);
  if (kept.length === 0) return '';
  if (kept.length === 1) return kept[0];
  return `(&${kept.join('')})`;
}

/** Combine clauses with OR, dropping empties. */
export function or(...clauses: (string | undefined | null)[]): string {
  const kept = clauses.filter((c): c is string => !!c && c.length > 0);
  if (kept.length === 0) return '';
  if (kept.length === 1) return kept[0];
  return `(|${kept.join('')})`;
}

/**
 * A `receivedAt` window. Bounds are inclusive; the adapter compares against epoch-millis, so a
 * date-only upper bound would exclude that whole day — we widen it to the end of the day.
 */
export function receivedBetween(from?: string, to?: string): string {
  const clauses: string[] = [];
  if (from) clauses.push(`(receivedAt>=${from})`);
  if (to) clauses.push(`(receivedAt<=${isDateOnly(to) ? `${to}T23:59:59.999Z` : to})`);
  return and(...clauses);
}

function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Build the full filter expression for a search. `''` means unfiltered. */
export function buildFilter(criteria: Hl7SearchCriteria): string {
  const controlId = criteria.controlId?.trim();
  return and(
    criteria.messageStructure ? eq('messageStructure', criteria.messageStructure) : undefined,
    criteria.hl7Version ? eq('hl7Version', criteria.hl7Version) : undefined,
    criteria.sourcePort ? eq('sourcePort', criteria.sourcePort) : undefined,
    criteria.sendingApp ? eq('sendingApp', criteria.sendingApp) : undefined,
    criteria.status ? eq('status', criteria.status) : undefined,
    // A trailing `*` is the user asking for a prefix match, so it must survive escaping.
    controlId
      ? controlId.endsWith('*')
        ? `(controlId=${escapeFilterValue(controlId.slice(0, -1))}*)`
        : eq('controlId', controlId)
      : undefined,
    receivedBetween(criteria.from, criteria.to),
  );
}

/** True when the criteria constrain nothing — used to skip a pointless filter round-trip. */
export function isEmptyCriteria(criteria: Hl7SearchCriteria): boolean {
  return buildFilter(criteria) === '';
}
