# Channel analysis: fingerprinting two receiving ports

The channel analyzer answers one question — *what do these two channels have in common, and where do
they differ?* — and the whole tool rests on a prior decision: **what makes two messages on two
channels "the same message"?** That decision is a control on the page, not a constant in the code.

Implementation: `core/fingerprint.ts` (pure: flatten, fingerprint, compare) and
`core/channel-compare.ts` (fetches the two populations, holds the state). It is a port of the
`hl7_coupling` scripts from the module repo, with one deliberate correction (below).

## Why not MSH-10

The message control id is the obvious key and it does not work. An interface engine re-stamps
MSH-10 on every outbound channel, so on an omnibus receiver it is unique on every single row —
keying on it, nothing would ever look coupled. The same clinical message appears on N channels
differing only in transport fields: MSH-10, often MSH-7's timestamp, and the MSH-3..6
sending/receiving routing pair.

So identity is a **hash of the content with those transport fields removed**.

## Flatten, then fingerprint

`flatten(message)` reduces a materialized message to `{path: scalar}`, with array indices in the
path so repeats stay distinguishable:

```
msh.messageType.triggerEvent                       -> "R01"
response[0].observation[2].obx.observationValue    -> …
```

Two exclusions at the top level only: the five **envelope** keys the module overlays on every
element (`controlId`, `receivedAt`, `sourcePort`, `status`, `leaseId` — receipt metadata, never
message content), plus a few defensive extras, and any `_`-prefixed key. Everything below the top
level is content.

### Correction to the original script

The `hl7_coupling` script's `ENVELOPE_META` also drops a top-level `response` key, described there
as an ACK column added by the facade. It isn't: `Hl7ProducerFacade.toElement` adds exactly the five
keys listed above. `response` is the name of **ORU_R01's top-level group in HL7 2.3** — the patient
and every observation. Dropping it reduces an ORU fingerprint to MSH alone, so nearly every ORU on a
channel collapses into one enormous false coupling. This app keeps it. Do not add it back.

`fingerprintParts(flat, ignore, identity)` then selects the paths that count and returns
`JSON.stringify` of them with **sorted keys** (so the fingerprint is stable regardless of the order
the module emitted fields in), plus how many fields went into it.

## The two match modes

Selected on the page as "Match messages on".

**Business key — `identity` (the default).** `identity` is an allow-list of path *substrings* that
define identity; when present it wins outright, and every other non-ignored field becomes eligible
to surface as a **field conflict** on the shared message rather than as a population difference. The
default key is:

```ts
DEFAULT_IDENTITY = ['patientAccountNumber', 'eventTypeCode', 'recordedDateTime']
```

— what makes two ADT/ORU messages "the same event" in practice. It is editable on the page
(comma-separated fragments; a field matches when its path *contains* one), because the right key
depends on the message types in front of you.

**Full content — `content`.** Identity is all content minus the `DEFAULT_IGNORE` transport
substrings:

```ts
DEFAULT_IGNORE = ['messageControlID', 'dateTimeOfMessage',
                  'sendingApplication', 'sendingFacility',
                  'receivingApplication', 'receivingFacility']
```

Matched as path substrings, so `sendingFacility` covers `msh.sendingFacility.namespaceID`.

### Why the business key is the default

Strict content matching is the more literal question — "are these byte-for-byte the same message?" —
and on real traffic the answer is almost always no. Two ADT feeds off the same interface engine
matched on only **37 of ~1200** messages that way, because each downstream channel gets its own
field tweaks. Read literally that says the channels are unrelated, which is wrong: keyed on business
identity (account number + event type + event time) the same two channels share **1160 of 1171**
messages and conflict on none.

Strict mode answers "is the content identical"; identity mode answers "is the same event present on
both" — and only the second is a useful reading of channel coverage. The differences strict mode
would have reported as population gaps show up in identity mode where they belong: as field
conflicts on a shared message.

## Comparing

`compareChannels(a, b, options)`:

1. **Hold out unkeyed records** (`keyed === false`, i.e. the fingerprint came from zero fields) —
   see the hazard below.
2. **De-duplicate each side by fingerprint**, keeping the first-seen record. A message re-sent on
   the same channel counts once; otherwise a retransmission on A would read as a population gap on
   B. The collapsed counts are reported as `duplicatesA` / `duplicatesB`.
3. Every fingerprint in both maps becomes a **coupling**; the rest are `onlyA` / `onlyB`.
4. For each coupling, diff the flattened messages path by path. A path present on one side and
   absent on the other counts as a difference — an absent field is divergence just as much as a
   different value. Differences whose path matches an `ignore` substring are reported as **benign**
   (expected per hop); everything else is a **conflict**.
5. `jaccard = shared / union` is reported as "Overlap".

Couplings are sorted conflicts-first, then most-divergent; the only-lists are sorted newest-first.
The page also rolls conflicts up by path with array positions collapsed (`ChannelComparer.
conflictPaths`), so "every message differs at `…obx.units`" reads as one row.

## Hazards the UI must keep stating

**Unkeyed messages.** A message carrying none of the key fields fingerprints to the empty object. If
those were kept, every such message on both channels would collapse into a single coupling and the
result would read as a perfect match. It happens for real: the receiver stores only index attributes
for structures it has no schema for, and a business key naming HL7 fields cannot address those at
all. They are held out of every count, and the page states how many were set aside on each side and
why. They are **not** "absent from the other channel" — they are messages this key cannot speak
about.

**Truncation.** Both populations are fetched into the browser with a per-channel cap
(500 / 2000 / 5000, default 2000). The receiver can filter and count but has no notion of "the same
message on another port", so there is no server-side query that answers this — which also means the
answer is only as complete as the fetch. When either side truncates, `provisional` is set and the
page says so: a message reported as present on only one channel may simply be past the cut-off on
the other. Narrow the date window or raise the cap before concluding anything about coverage.

**Overlap is not coverage.** Jaccard is shared ÷ union, so a small feed entirely swallowed by a busy
channel scores low even though every one of its messages is shared. Read it next to the raw distinct
and shared counts.

**Rendering limits.** The result lists render at most 200 rows each (`RENDER_LIMIT` in
`pages/channels/channels.ts`) and say how many they are showing of how many. That is a display
limit only — the counts above them are over the full comparison.
