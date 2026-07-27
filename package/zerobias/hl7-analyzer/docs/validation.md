# Validation: from module error to highlighted field

A validation finding starts as a string from the module and ends up in three places at once: a
sentence in the findings list, a highlighted line in the JSON, and a highlighted field in the raw
ER7. This is how it gets there, and where it deliberately gives up.

## 1. The raw error

`ops/validate` (`Hl7Api.validate`) returns, for one control id:

```ts
{
  controlId,
  schemaId: 'schema:table:hl7v2.v23.ORU_R01',   // the message schema the body was checked against
  stored:         { valid, errors: string[], schemaId? },   // the stored (materialized) message
  rematerialized: { valid, errors: string[], schemaId? },   // the message re-parsed from its ER7
  repsAgree: boolean
}
```

The app reports findings from **`stored`** — that is the representation every other view in the app
shows, so those are the errors a reader can act on. `repsAgree === false` is surfaced separately, as
a finding in its own right: the stored JSON and the wire text disagree, so one of the two was built
wrong. The detail page prints both error counts and says which side the findings come from; the
batch summary counts it as `JSON ≠ ER7`.

Each error is `"<json path>: <reason>"`, e.g.

```
response[0].order_observation[0].observation[3].obx.observationIdentifier: missing required property
```

Precise, and unreadable to anyone who thinks in HL7. They want "OBX-3, on the 4th OBX".

## 2. Splitting and naming the segment — `core/hl7-schema.ts`

`splitError()` splits at the **first** `": "` (reasons themselves can contain colons). The path is
then split on `.`, and the tail decides what the error is about:

- a 3-character tail (ignoring any `[n]`) is the **segment itself** — `…order_observation[0].obr`;
- anything else is a **property of the segment named just before it**.

That yields `segmentPath` (the segment's JSON path), `segmentName` (`OBX`) and `propertyName`
(`observationIdentifier`). Three characters is a reliable discriminator because HL7 segment ids are
always exactly three, which is also what distinguishes a segment from a group (`order_observation`)
or a field (`patientName`) elsewhere in the materialized shape.

## 3. Field number, from the live schema

There is no field-number table in this app. The bridge is `getSchema`:

```
message schema  schema:table:hl7v2.v23.ORU_R01
                       ^^^^^^                         swap :table: for :type:
segment schema  schema:type:hl7v2.v23.OBX             swap the structure for the segment id
```

`segmentSchemaId()` does exactly that string surgery. The version slug is never guessed — it comes
out of the validate response, so the segment schema is for exactly the version that was validated.

A segment type's `properties` are listed **in HL7 field order**, so the index of the property is its
field ordinal: `index + 1`. Verified against the live receiver — `setIDOBX` = OBX-1,
`valueType` = OBX-2, `observationIdentifier` = OBX-3.

The resolved finding therefore carries `ordinal`, the schema's own `Property` record (data type,
required, description) and the `schemaId` it came from. The UI prints the citation next to the
finding — `schema:type:hl7v2.v23.OBX · property #3 → field OBX-3` — so the claim is checkable rather
than asserted.

Every step degrades instead of guessing: no segment schema, or a property not found in it, drops the
ordinal and falls back to labelling the finding with the property name (`ResolvedError.label`). The
raw string is always kept and always shown, so nothing is lost in translation.

Schemas are cached by id in `Hl7SchemaService` (the promise, not the value, so concurrent
resolutions of the same segment share one round trip). `clear()` exists for a target change, since
versions may differ between feeds.

## 4. Placing it in the JSON — `core/json-lines.ts`

`jsonLines(value)` renders the message as pretty JSON where every line knows its own path in the
same notation the validator uses, and a container contributes its path to both its opening and
closing line. The output is byte-for-byte `JSON.stringify(value, null, 2)`, so nothing about the
message is reformatted — the pieces are individually `JSON.stringify`ed.

Why not render text and regex over it: the errors are *paths*
(`response[0].observation[3].obx.setIDOBX`), and matching those against rendered text means guessing
at nesting — which goes wrong precisely on the repeating groups where HL7 errors live.

`MessageDetail.jsonMarks` marks the line whose path equals the finding's path, falling back to the
**segment's** path when that path isn't in the document. That fallback is not an edge case: a
"missing required property" error names a path that by definition doesn't exist, and the nearest
place a reader can actually look is the segment that should have contained it.

## 5. Placing it in the ER7 — `core/er7.ts`

`parseEr7(text)` records, for every segment and every field, its **start and end offset in the
original string** — the same string the view renders, so a normalized copy can't shift the offsets.
Segments are separated by `\r`; `\n` and `\r\n` are accepted too, since tools in the middle
sometimes normalize them.

Two rules do the real work:

- **MSH is off by one.** MSH-1 *is* the field separator character and MSH-2 is the encoding
  characters, so in `MSH|^~\&|app|…` splitting on `|` puts MSH-2 at `parts[1]` and MSH-n at
  `parts[n-1]`. Every other segment has field n at `parts[n]`. The parser emits MSH-1 explicitly as
  the one-character range of the separator itself, then offsets the rest. Get this wrong and every
  MSH highlight is one field to the left — plausible-looking and entirely wrong.
- **Sub-components are not split.** `^`, `~` and `&` are left alone: this module's errors land on a
  field, and highlighting the whole field is both correct and easier to see.

Then the two representations have to be tied together. `jsonSegments(message)` walks the
materialized message and lists its segments in document order with their JSON paths.
`alignSegments(doc, message)` pairs that list with the parsed ER7 segments **position by position** —
and returns `null` if the two disagree in length or in any segment name.

Recognising a segment key takes three rules, all of them learned from live traffic rather than from
the spec:

- a **3-character key holding an object** is a segment — `…order_observation[0].obr`;
- a **3-character key holding an array** is a *repeating* segment, and contributes one entry per
  element with its own indexed path (`nk1[2]`) — which is also the path a finding reports;
- a **4-character key ending in a digit** is a segment whose group repeats, so the schema
  disambiguates it (`rol2` is the second ROL group of ADT_A05). Only a trailing digit qualifies, so
  ordinary 4-character field names (`race`, `city`, `text`) are never mistaken for segments.

The first rule alone is not enough, and failing the other two is silent: the walker under-counts,
`alignSegments` refuses to align, and **every ER7 highlight disappears** on any message containing a
repeat — which is very nearly all of them.

That all-or-nothing behaviour is the point. It is safe because the module builds both
representations from the same parse, so the Nth segment in one is the Nth in the other (verified
against live ORU / ADT / ORM traffic) — but when it is not true, there is no partial credit to be
had. `MessageDetail` drops every ER7 highlight in that case and tells the reader the JSON tab still
shows where each error is. **A mark on the wrong field is worse than no mark.**

With an aligned segment in hand, the range is `fieldRange(segment, ordinal)` when the finding
resolved to a field ordinal, and `segmentRange(segment)` when it is about the segment as a whole. A
field the sender simply omitted has no range, so `fieldRange` returns the zero-width position at the
end of the segment — pointing at where it should have been.

## 6. Rendering

`shared/json-view` takes the pre-rendered lines plus marks (`{id, path, title}`) and highlights
whole lines. `shared/er7-view` takes the raw text plus marks (`{id, start, end, title}`), splits
each line into marked and unmarked pieces, and clips any mark to a single line — a field lives
inside its segment, and a segment is a line, so nothing legitimate crosses a newline and a bad range
can't smear the message. Both emit a `select` event, and both take an `activeId`, so the findings
list and the two tabs stay in sync.

In both, the `<pre>` **is** the scroll box: `max-height: 70vh; overflow: auto`, at `line-height: 1.4`
(measured 16.8px per row at 12px — 1.6 gave 19.2px, too loose to scan a message). Without a cap a
650-line message renders ~25 000px tall, the page itself becomes the scroller, and a selected
finding has no container to be scrolled *within*. Both views use the same metrics so switching tabs
doesn't resize the pane or re-space the text under the reader.

Selecting a finding scrolls the active view to its mark (`MessageDetail.revealActiveMark()`), by
setting `scrollTop` / `scrollLeft` on that `<pre>`. Deliberately **not** `Element.scrollIntoView()`:
that walks every scrollable ancestor, so it would scroll the document too and drag the message
header and the findings list — the list the reader just clicked in — out of view. Details that are
easy to break:

- It runs in an `afterRenderEffect`, because the mark is painted by the same change-detection pass
  the selection triggers; a plain `effect` would measure the previous DOM.
- It depends on the selected **tab**, not just the finding. `MatTabBody` detaches the inactive tab's
  portal, so the ER7 marks do not exist in the DOM until that tab is shown — re-running on a tab
  change is what makes "switch tabs with a finding selected" land on the selection instead of at the
  top of a freshly attached view.
- The mark is centred, except that a mark wider (or taller) than the pane is **start-aligned** —
  centring it would push its beginning off the left edge. The horizontal correction only runs when
  the mark is actually outside the box, since re-centring something the reader can already see looks
  like drift.
- A finding with **no** mark is a normal outcome, not an error: every ER7 mark is dropped when
  `alignSegments()` can't prove the two representations line up. Nothing is scrolled in that case —
  never to an approximate spot.

## Batch validation — `core/batch-validate.ts`

Validating one message answers "is this one good?". For a feed that is the wrong question: a
misconfigured sender produces the same defect in every message it sends, so 400 invalid messages are
usually one finding repeated 400 times.

`BatchValidator.run(criteria, cap)`:

1. `fetchAll` the search result set up to the cap (50 / 200 / 1000, default 200), newest first.
2. `ops/validate` each message, 6 in flight at a time. A call that *fails* is counted as
   `failed` — "not checked" — never absorbed into the valid count.
3. Group errors by `normalizeError(raw)`, which collapses every `[n]` to `[]`. That folds "60 OBX
   repeats each missing OBX-3" into one row with a count of 60, and folds it again across every
   message that shares the defect.
4. Resolve one representative occurrence of each group against the schema, so the rollup can print
   `OBX-3` and its citation rather than a JSON path.

Groups are sorted by messages affected, then occurrences. The summary counts **materialized messages
only** for valid / invalid / `JSON ≠ ER7`; see below.

A representative run against the live UAT feed:

```
Checked 200 · Valid 38 · Invalid 88 · JSON≠ER7 0 · Not parsed 74
Sampled the 200 most recent of 24,519 matching messages.
41 distinct defects — e.g. IN1-3 (schema:type:hl7v2.v24.IN1) in 44 messages / 97 occurrences,
plus findings on OBX-11, ORC-7 and SCH-16.
```

## The "not parsed" case

The receiver materializes a message only when it has a schema for that structure. Otherwise it
stores the ER7 text plus twelve index attributes and no `msh` — on the UAT feed that is RDE_O03 on
HL7 2.2, roughly 37% of recent messages.

`ops/validate` on such a message falls back to `schema:shared:hl7v2.message-envelope` and returns
eight "undeclared property" errors, one per index attribute. They are the receipt envelope
complaining about itself; they say nothing about the message on the wire.

So both tools detect the condition — `row.materialized` (no `msh`, via `MATERIALIZED_KEY`) **or**
`schemaId === ENVELOPE_SCHEMA_ID` — and:

- the detail page shows **"Not parsed"**, explains that the JSON tab is showing index attributes
  rather than segments, points the reader at the ER7 tab, and resolves no findings at all;
- the batch summary counts them under **"Not parsed"**, excluded from valid *and* invalid, and says
  why.

Counting them either way would be a claim about HL7 conformance that nothing checked.
