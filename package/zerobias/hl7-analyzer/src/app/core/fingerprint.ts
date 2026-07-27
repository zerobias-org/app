/**
 * Content fingerprinting — how the channel analyzer decides that two messages on two different
 * channels are *the same message*.
 *
 * Keying on MSH-10 does not work. An interface engine re-stamps the message control id on every
 * outbound channel, so on an omnibus receiver MSH-10 is unique on every single row and nothing
 * would ever look coupled. The same clinical message instead appears on N channels differing only
 * in transport fields (MSH-10, sometimes MSH-7's timestamp and the MSH-3..6 routing pair). So
 * identity is a **hash of the content with those transport fields removed**.
 *
 * This is a port of `hl7_coupling` (java/scripts in the module repo) — flatten, fingerprint, then
 * compare populations and fields — with one deliberate correction, below.
 *
 * ## Correction to the script: `response` is message content, not envelope
 *
 * The script's ENVELOPE_META drops a top-level `response` key, described there as an ACK column
 * added by the facade. It isn't: `Hl7ProducerFacade.toElement` adds exactly five envelope keys —
 * controlId, receivedAt, sourcePort, status, leaseId (Hl7ProducerFacade.java:163-167). `response`
 * is the name of **ORU_R01's top-level group** in HL7 2.3, which holds the patient and every
 * observation. Dropping it reduces an ORU fingerprint to MSH alone, so nearly every ORU on a
 * channel collapses into one enormous false coupling. We keep it, and drop only the five real
 * envelope keys (plus the defensive extras the script listed, which are harmless because no HL7
 * group is named `id` or `_key`).
 */

/** Receipt metadata overlaid on every element by the module — never message content. */
export const ENVELOPE_META: ReadonlySet<string> = new Set([
  'controlId',
  'receivedAt',
  'sourcePort',
  'status',
  'leaseId',
  // Defensive: never emitted by the 1.2.3 facade, but harmless to exclude and cheap insurance if a
  // future version adds them. Note `response` is deliberately NOT here — see the file header.
  'elementKey',
  'messageId',
  'id',
  '_key',
]);

/**
 * MSH transport fields an interface engine legitimately re-stamps per hop. Excluded from the
 * fingerprint, and reported as benign (rather than as a conflict) when they differ.
 *
 * Matched as path *substrings*, so `sendingFacility` covers `msh.sendingFacility.namespaceID`.
 */
export const DEFAULT_IGNORE: readonly string[] = [
  'messageControlID',
  'dateTimeOfMessage',
  'sendingApplication',
  'sendingFacility',
  'receivingApplication',
  'receivingFacility',
];

/** A leaf value of a flattened message. */
export type Scalar = string | number | boolean | null;

/** Flattened message: `msh.messageType.triggerEvent` -> `R01`, `response[0]...obx[2].units` -> … */
export type FlatMessage = Readonly<Record<string, Scalar>>;

/**
 * Flatten a materialized message to `{path: scalar}`. Array items index into the path, so repeats
 * stay distinguishable (`observation[2].obx.observationValue`). Top-level envelope keys and any
 * `_`-prefixed key are dropped — everything below the top level is content.
 */
export function flatten(value: unknown, prefix = ''): Record<string, Scalar> {
  const flat: Record<string, Scalar> = {};
  if (Array.isArray(value)) {
    value.forEach((item, i) => Object.assign(flat, flatten(item, `${prefix}[${i}]`)));
  } else if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (!prefix && (ENVELOPE_META.has(key) || key.startsWith('_'))) continue;
      Object.assign(flat, flatten(item, prefix ? `${prefix}.${key}` : key));
    }
  } else {
    flat[prefix] = (value ?? null) as Scalar;
  }
  return flat;
}

/**
 * Message identity from a flattened message.
 *
 * `identity` is an allow-list of path substrings that DEFINE identity (a business key such as
 * `PID` + placer/filler order numbers). When given it wins outright, and every other non-ignored
 * field becomes eligible to surface as a conflict. Otherwise identity is all content minus the
 * `ignore` transport substrings.
 */
export function fingerprintOf(
  flat: FlatMessage,
  ignore: readonly string[] = DEFAULT_IGNORE,
  identity: readonly string[] = [],
): string {
  return fingerprintParts(flat, ignore, identity).fingerprint;
}

/**
 * The fingerprint plus how many fields it was built from.
 *
 * `fields` matters in identity mode: a message carrying none of the key fields fingerprints to the
 * empty object, and every such message on both channels would collapse into one enormous false
 * coupling. (It happens for real — the receiver stores index attributes only for structures it has
 * no schema for, so a business key naming HL7 fields matches nothing there.) Callers use `fields`
 * to set those messages aside instead of pretending they matched.
 */
export function fingerprintParts(
  flat: FlatMessage,
  ignore: readonly string[] = DEFAULT_IGNORE,
  identity: readonly string[] = [],
): { fingerprint: string; fields: number } {
  const keep = (path: string) =>
    identity.length > 0
      ? identity.some((s) => path.includes(s))
      : !ignore.some((s) => path.includes(s));
  const kept: Record<string, Scalar> = {};
  // Sorted keys so the fingerprint is stable regardless of the order the module emitted fields in.
  for (const path of Object.keys(flat).sort()) {
    if (keep(path)) kept[path] = flat[path];
  }
  return { fingerprint: JSON.stringify(kept), fields: Object.keys(kept).length };
}

/** Best-effort human label for a message: `ORU^R01 · Test,Dana`. */
export function descriptorOf(flat: FlatMessage): string {
  // Names match as a whole path or as a trailing `.name` segment, so the same list works for the
  // parsed shape (`msh.messageType.messageType`) and the index one (a bare `messageCode`).
  const first = (...names: string[]): Scalar | undefined => {
    for (const [path, value] of Object.entries(flat)) {
      if (value === null || value === '') continue;
      if (names.some((n) => path === n || path.endsWith(`.${n}`))) return value;
    }
    return undefined;
  };
  const type = first('messageType.messageType', 'messageType.messageCode', 'messageCode', 'messageType');
  const trigger = first('triggerEvent');
  const family = first('familyName', 'patientFamilyName', 'patientLastName', 'surname');
  const given = first('givenName', 'patientGivenName', 'patientFirstName');
  const bits: string[] = [];
  if (type) bits.push(trigger ? `${type}^${trigger}` : String(type));
  if (family) bits.push(given ? `${family},${given}` : String(family));
  return bits.join(' · ') || '?';
}

/** One message, reduced to what the comparison needs. */
export interface ChannelRecord {
  readonly controlId: string;
  readonly receivedAt: string;
  readonly fingerprint: string;
  readonly descriptor: string;
  /** False when the fingerprint came out of no fields at all — see `fingerprintParts`. */
  readonly keyed: boolean;
  readonly flat: FlatMessage;
}

export interface FingerprintOptions {
  readonly ignore?: readonly string[];
  readonly identity?: readonly string[];
}

/** Reduce a materialized message to a comparable record. */
export function toRecord(message: Record<string, unknown>, options: FingerprintOptions = {}): ChannelRecord {
  const flat = flatten(message);
  const { fingerprint, fields } = fingerprintParts(
    flat,
    options.ignore ?? DEFAULT_IGNORE,
    options.identity ?? [],
  );
  return {
    controlId: String(message['controlId'] ?? ''),
    receivedAt: String(message['receivedAt'] ?? ''),
    fingerprint,
    descriptor: descriptorOf(flat),
    keyed: fields > 0,
    flat,
  };
}

/** One field that differs between the two copies of a coupled message. */
export interface FieldDifference {
  readonly path: string;
  /** The value on channel A, or `null` when the path is absent there (see `absentA`). */
  readonly a: Scalar;
  readonly b: Scalar;
  readonly absentA: boolean;
  readonly absentB: boolean;
  /** True when the path matches an `ignore` substring — expected to differ per hop. */
  readonly benign: boolean;
}

/** A message present on both channels, with any field-level divergence. */
export interface Coupling {
  readonly fingerprint: string;
  readonly descriptor: string;
  readonly controlIdA: string;
  readonly controlIdB: string;
  readonly receivedAtA: string;
  readonly receivedAtB: string;
  /** Real divergence — same message, different content. */
  readonly conflicts: readonly FieldDifference[];
  /** Differences in transport fields, expected and reported for completeness. */
  readonly benign: readonly FieldDifference[];
  readonly consistent: boolean;
}

export interface ChannelComparison {
  /** Distinct messages on each side (after fingerprint de-duplication). */
  readonly distinctA: number;
  readonly distinctB: number;
  /** Distinct messages present on both. */
  readonly sharedCount: number;
  /**
   * shared / union — how much of a mirror the two channels are. A small feed entirely swallowed by
   * a busy channel scores low here even though every one of its messages is shared, which is why
   * the raw shared count alone can't tell you whether a pair is meant to mirror.
   */
  readonly jaccard: number;
  /** Messages on A with no counterpart on B. */
  readonly onlyA: readonly ChannelRecord[];
  readonly onlyB: readonly ChannelRecord[];
  /** Shared messages, conflicts first. */
  readonly couplings: readonly Coupling[];
  /** Duplicates collapsed by fingerprinting, per side — a message re-sent on the same channel. */
  readonly duplicatesA: number;
  readonly duplicatesB: number;
  /**
   * Messages excluded because they carry none of the key fields, per side. They are not "absent
   * from the other channel" — they are messages this key cannot speak about at all.
   */
  readonly unkeyedA: readonly ChannelRecord[];
  readonly unkeyedB: readonly ChannelRecord[];
}

/**
 * Compare two channels' messages.
 *
 * Both sides are de-duplicated by fingerprint first (keeping the first-seen record, as the script
 * does), so a message re-sent on the same channel counts once — otherwise a retransmission on A
 * would read as a population gap on B.
 */
export function compareChannels(
  a: readonly ChannelRecord[],
  b: readonly ChannelRecord[],
  options: FingerprintOptions = {},
): ChannelComparison {
  const ignore = options.ignore ?? DEFAULT_IGNORE;
  // Unkeyed messages are held out entirely: with an empty fingerprint they would all collapse into
  // a single coupling and read as a perfect match between the two channels.
  const unkeyedA = a.filter((r) => !r.keyed);
  const unkeyedB = b.filter((r) => !r.keyed);
  const repsA = firstByFingerprint(a.filter((r) => r.keyed));
  const repsB = firstByFingerprint(b.filter((r) => r.keyed));

  const onlyA: ChannelRecord[] = [];
  const onlyB: ChannelRecord[] = [];
  const couplings: Coupling[] = [];

  for (const [fp, recA] of repsA) {
    const recB = repsB.get(fp);
    if (!recB) {
      onlyA.push(recA);
      continue;
    }
    const { conflicts, benign } = diffFields(recA.flat, recB.flat, ignore);
    couplings.push({
      fingerprint: fp,
      descriptor: recA.descriptor,
      controlIdA: recA.controlId,
      controlIdB: recB.controlId,
      receivedAtA: recA.receivedAt,
      receivedAtB: recB.receivedAt,
      conflicts,
      benign,
      consistent: conflicts.length === 0,
    });
  }
  for (const [fp, recB] of repsB) {
    if (!repsA.has(fp)) onlyB.push(recB);
  }

  const sharedCount = couplings.length;
  const union = repsA.size + repsB.size - sharedCount;
  // Conflicts first, then the most-divergent, then stable by descriptor.
  couplings.sort(
    (x, y) =>
      Number(x.consistent) - Number(y.consistent) ||
      y.conflicts.length - x.conflicts.length ||
      x.descriptor.localeCompare(y.descriptor),
  );
  const byTime = (x: ChannelRecord, y: ChannelRecord) => y.receivedAt.localeCompare(x.receivedAt);
  onlyA.sort(byTime);
  onlyB.sort(byTime);

  return {
    distinctA: repsA.size,
    distinctB: repsB.size,
    sharedCount,
    jaccard: union > 0 ? sharedCount / union : 0,
    onlyA,
    onlyB,
    couplings,
    duplicatesA: a.length - unkeyedA.length - repsA.size,
    duplicatesB: b.length - unkeyedB.length - repsB.size,
    unkeyedA,
    unkeyedB,
  };
}

function firstByFingerprint(records: readonly ChannelRecord[]): Map<string, ChannelRecord> {
  const map = new Map<string, ChannelRecord>();
  for (const record of records) {
    if (!map.has(record.fingerprint)) map.set(record.fingerprint, record);
  }
  return map;
}

/**
 * Every path where the two copies disagree, split into real conflicts and benign transport
 * differences. A path missing on one side counts as a difference — an absent field is divergence
 * just as much as a different value.
 */
function diffFields(
  a: FlatMessage,
  b: FlatMessage,
  ignore: readonly string[],
): { conflicts: FieldDifference[]; benign: FieldDifference[] } {
  const conflicts: FieldDifference[] = [];
  const benign: FieldDifference[] = [];
  const paths = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const path of [...paths].sort()) {
    const inA = path in a;
    const inB = path in b;
    if (inA && inB && Object.is(a[path], b[path])) continue;
    const difference: FieldDifference = {
      path,
      a: inA ? a[path] : null,
      b: inB ? b[path] : null,
      absentA: !inA,
      absentB: !inB,
      benign: ignore.some((s) => path.includes(s)),
    };
    (difference.benign ? benign : conflicts).push(difference);
  }
  return { conflicts, benign };
}
