/**
 * ER7 (the pipe-delimited HL7 v2 wire format) parsing, to the level this app needs: where every
 * segment and every field *starts and ends in the raw text*, so a validation error can be painted
 * onto the message a user is reading.
 *
 * Two details of the format drive the code below:
 *
 *   - **Segments are separated by `\r`.** The receiver returns real carriage returns; some tools
 *     normalize to `\n` or `\r\n` on the way through, so we accept all three and record offsets
 *     against the ORIGINAL string (the UI highlights that exact string, so a normalized copy with
 *     different offsets would be off by one per line).
 *   - **MSH is off by one.** MSH-1 *is* the field separator character, and MSH-2 is the encoding
 *     characters — so in `MSH|^~\&|app|...`, splitting on `|` puts MSH-2 at parts[1] and MSH-n at
 *     parts[n-1]. Every other segment has field n at parts[n]. Getting this wrong shifts every MSH
 *     highlight by one field, which looks plausible and is entirely wrong.
 *
 * Sub-components (`^`, `~`, `&`) are deliberately not split: HL7 errors from this module land on a
 * field, and highlighting the whole field is both correct and easier to see.
 */

/** One field occurrence, located in the raw text. `start === end` for an empty field. */
export interface Er7Field {
  /** HL7 field ordinal — PID-3 is 3. */
  readonly ordinal: number;
  readonly start: number;
  readonly end: number;
  readonly value: string;
}

export interface Er7Segment {
  /** Segment id, upper case: `MSH`, `PID`, `OBX`, … */
  readonly name: string;
  /** Position in the message, 0-based — the Nth segment overall, not the Nth of this name. */
  readonly index: number;
  /** Line number, 1-based, for display. */
  readonly line: number;
  readonly start: number;
  readonly end: number;
  readonly fields: readonly Er7Field[];
}

export interface Er7Document {
  /** The exact text the offsets refer to. */
  readonly text: string;
  readonly segments: readonly Er7Segment[];
}

/** A character range in the raw text — what the UI actually highlights. */
export interface Er7Range {
  readonly start: number;
  readonly end: number;
}

/**
 * Parse an ER7 message. Never throws: malformed input yields whatever segments could be read, and a
 * caller that finds no match simply shows no highlight.
 */
export function parseEr7(text: string): Er7Document {
  const segments: Er7Segment[] = [];
  let offset = 0;
  let line = 0;

  while (offset <= text.length) {
    let end = text.length;
    for (let i = offset; i < text.length; i++) {
      const ch = text[i];
      if (ch === '\r' || ch === '\n') {
        end = i;
        break;
      }
    }
    const raw = text.slice(offset, end);
    if (raw.trim().length > 0) {
      line += 1;
      segments.push(parseSegment(raw, offset, segments.length, line));
    }
    if (end >= text.length) break;
    // Step past the terminator, treating \r\n as one.
    offset = end + (text[end] === '\r' && text[end + 1] === '\n' ? 2 : 1);
  }

  return { text, segments };
}

function parseSegment(raw: string, base: number, index: number, line: number): Er7Segment {
  // The field separator is whatever follows the 3-char segment id (MSH-1 declares it for the
  // message; in practice every segment in a message uses the same one).
  const separator = raw.length > 3 ? raw[3] : '|';
  const name = raw.slice(0, 3).toUpperCase();
  const isMsh = name === 'MSH';

  const fields: Er7Field[] = [];
  if (isMsh) {
    // MSH-1 is the separator character itself — a real, locatable field.
    fields.push({ ordinal: 1, start: base + 3, end: base + 4, value: separator });
  }

  let cursor = 4; // just past `XXX|`
  let part = 1; // index of the part we are about to read, in split-on-separator terms
  while (cursor <= raw.length) {
    let end = raw.indexOf(separator, cursor);
    if (end === -1) end = raw.length;
    const value = raw.slice(cursor, end);
    // MSH: parts[n-1] is MSH-n. Others: parts[n] is n.
    const ordinal = isMsh ? part + 1 : part;
    fields.push({ ordinal, start: base + cursor, end: base + end, value });
    if (end >= raw.length) break;
    cursor = end + 1;
    part += 1;
  }

  return { name, index, line, start: base, end: base + raw.length, fields };
}

/** The range of a whole segment. */
export function segmentRange(segment: Er7Segment): Er7Range {
  return { start: segment.start, end: segment.end };
}

/**
 * The range of one field of one segment, or the segment itself when that ordinal isn't present
 * (a trailing field the sender simply omitted — the right place to point at is the segment end).
 */
export function fieldRange(segment: Er7Segment, ordinal: number): Er7Range {
  const field = segment.fields.find((f) => f.ordinal === ordinal);
  if (field) return { start: field.start, end: field.end };
  return { start: segment.end, end: segment.end };
}

/** Convenience: index the segments of a document by name, in document order. */
export function segmentsNamed(doc: Er7Document, name: string): readonly Er7Segment[] {
  const upper = name.toUpperCase();
  return doc.segments.filter((s) => s.name === upper);
}

/**
 * Walk a materialized message (the JSON the collection returns) and list its segments **in document
 * order**, with the JSON path of each.
 *
 * This is what lets a JSON-path validation error find its place in the ER7 text: the module builds
 * both representations from the same parse, so the Nth segment here is the Nth segment there. HL7
 * segment ids are always exactly three characters, which is what distinguishes a segment (`obx`)
 * from a group (`order_observation`) or a field (`patientName`) in the materialized shape.
 *
 * The caller should still check that the names line up before trusting an offset — see
 * `alignSegments`.
 */
export function jsonSegments(message: unknown): readonly { name: string; path: string }[] {
  const out: { name: string; path: string }[] = [];
  walk(message, '', out);
  return out;
}

/**
 * The segment id a materialized key stands for, or null when the key isn't a segment at all.
 *
 * Two receiver conventions have to be decoded before a key can be read as a segment id, both found
 * on live ADT_A05 traffic (control id 2228475: 51 segments on the wire, of which the naive
 * "3 characters" rule saw only 13):
 *
 *   - **A structure that admits the same segment in two places suffixes the second one.** HL7's
 *     abstract message syntax for ADT_A05 has a ROL group after PID/NK1 and *another* after PV2, so
 *     the schema names them `rol` and `rol2` to keep them distinct. The wire says `ROL` both times,
 *     so a trailing disambiguation digit is dropped. Only a digit qualifies — the real 4-character
 *     field names in this data (`race`, `city`, `text`) are left alone.
 *   - Everything else that is exactly three characters is a segment id as-is (`msh`, `in1`, `obx`).
 */
function segmentNameOf(key: string): string | null {
  if (key.length === 3) return key.toUpperCase();
  if (key.length === 4 && key[3] >= '0' && key[3] <= '9') return key.slice(0, 3).toUpperCase();
  return null;
}

/** An array of plain objects — how the receiver stores a segment that repeats. */
function isSegmentArray(value: unknown): value is Record<string, unknown>[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => item !== null && typeof item === 'object' && !Array.isArray(item))
  );
}

function walk(node: unknown, path: string, out: { name: string; path: string }[]): void {
  if (Array.isArray(node)) {
    node.forEach((item, i) => walk(item, `${path}[${i}]`, out));
    return;
  }
  if (node === null || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const next = path ? `${path}.${key}` : key;
    const name = segmentNameOf(key);
    // A **repeating** segment is an array of segment objects, one per occurrence on the wire —
    // `nk1` is `[{…} ×7]` on the message above. Each element is its own segment, and its own path:
    // the validator reports `nk1[2].relationship`, so `nk1[2]` is what a finding will look up.
    if (name && isSegmentArray(value)) {
      value.forEach((item, i) => {
        out.push({ name, path: `${next}[${i}]` });
        walk(item, `${next}[${i}]`, out);
      });
      continue;
    }
    // A single occurrence is a bare object; recurse into it for nested repeats.
    if (name && value !== null && typeof value === 'object' && !Array.isArray(value)) {
      out.push({ name, path: next });
    }
    walk(value, next, out);
  }
}

/**
 * Map JSON segment paths to ER7 segments, position by position.
 *
 * Returns null if the two representations disagree in length or in any segment name — better to
 * show a validation error with no highlight than to highlight the wrong line. In practice they
 * agree exactly (verified against live ORU/ADT/ORM traffic).
 */
export function alignSegments(
  doc: Er7Document,
  message: unknown,
): ReadonlyMap<string, Er7Segment> | null {
  const json = jsonSegments(message);
  if (json.length !== doc.segments.length) return null;
  const map = new Map<string, Er7Segment>();
  for (let i = 0; i < json.length; i++) {
    if (json[i].name !== doc.segments[i].name) return null;
    map.set(json[i].path, doc.segments[i]);
  }
  return map;
}
