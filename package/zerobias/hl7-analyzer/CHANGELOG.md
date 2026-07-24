# Changelog

All notable changes to **hl7-analyzer** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the app
uses [Semantic Versioning](https://semver.org/). The version below tracks
`package.json` `"version"`. **Maintained manually for now** — there is no CI
changelog/version automation yet.

## [Unreleased]

### Added

- **Explicit filter bar on the messages page** — Structure / Receiving port /
  Sending app / HL7 version selects, a control-id prefix box, the date range, a
  "Clear filters" button, the number of active filters and the server's matching
  total. Options come from the module's `by-type` / `by-port` / `by-sender` /
  `by-version` containers through the cached `facetOptions`, so the bar costs no
  extra backend calls. It shares ONE state with the column header menus and the
  URL — every control writes through `ZbRemoteTableService.updateParams()` and
  reads back via `filterState` in `onRouteChanges()`; there is no parallel
  criteria signal and no client-side row filtering anywhere. Live on UAT:
  24,519 unfiltered → 6,544 (`messageStructure=ADT_A01`) → 3,118
  (`sourcePort=Departmental ADT`) → 872 (`hl7Version=2.2`) → 282
  (`controlId=2228`, prefix).
- **Selecting a finding scrolls the code view to it** (`revealActiveMark()` in
  `pages/messages/message-detail.ts`). The `<pre>` in both views is the scroll
  box (`max-height: 70vh; overflow: auto`), and the reveal sets its `scrollTop` /
  `scrollLeft` — deliberately not `scrollIntoView()`, which walks every
  scrollable ancestor and would scroll the document, dragging the findings list
  the reader just clicked in off screen. It re-reveals on tab switch because
  `MatTabBody` detaches the inactive tab's portal, so ER7 marks don't exist until
  that tab is shown; a mark wider than the pane is start-aligned rather than
  centred.

### Changed

- **No column claims `sortable`.** The receiver accepts `sortBy` / `sortDir` and
  discards them — `BufferStore.search` hardcodes
  `ORDER BY received_at DESC, id DESC`. A sort arrow that reorders nothing is
  worse than no sort arrow. Messages are always newest-first.

### Fixed

- **Every message-structure filter returned zero rows.** `escapeFilterValue`
  escaped `%` and `_` as well as the RFC4515 metacharacters, but the module
  escapes LIKE metacharacters itself (`Hl7SqlAdapter.likeLit` rewrites `\`, `%`,
  `_` and appends `ESCAPE '\'`), so they were escaped twice and the literal
  backslash reached the comparison. Every HL7 message structure contains an
  underscore: `(messageStructure=ADT_A01)` → 6544 rows,
  `(messageStructure=ADT\_A01)` → 0. It now escapes `\ * ( )` only.
  `(controlId=2_28*)` → 0 rows is the proof that `_` is not a wildcard on the
  wire, so passing it raw cannot widen a filter.
- **"-1 matching" in the result count.** The receiver answers a filter that
  matched nothing with `count: -1`, not `0` (verified on `(status=ACKED)` and on
  any structure with no messages). `Hl7Api.search` clamps it.
- **Dead column header filter menus under zoneless change detection.**
  ngx-library's table components are `Default` strategy and assign plain fields
  from RxJS subjects, so nothing scheduled a render when the facet options
  arrived ~3s after the last pass: the header instances held 22 options and
  `filterable: true` while rendering zero buttons. `pages/messages/messages.ts`
  now subscribes to `tableService.columnOptionChanges()` and calls
  `markForCheck()`; the headers are `Default`-strategy descendants, so marking
  the host view is enough.
- **ER7 highlighting on any message with a repeating segment.** `jsonSegments()`
  counted a segment only when the key was exactly 3 characters *and* held a
  non-array object, so array-valued repeats (`nk1[]`, `obx[]`, `al1[]`) and
  digit-suffixed group keys (`rol2`) were skipped. The walker under-counted (13
  segments against 51 on the wire for ADT_A05 2228475), `alignSegments()`
  correctly refused to align, and every ER7 highlight silently vanished.
  Verified across ADT_A05, ORU_R01, SIU_S12 and RAS_O17 on live UAT traffic.
  `alignSegments()` itself is unchanged and still all-or-nothing.
- **Doubled line height in the JSON and ER7 views.** Both templates ended the
  `@for` body with `</span>` followed by a newline inside a `<pre>`, emitting one
  literal newline text node per row; against block-level `.row` boxes that laid
  out as an empty line box after every line, so the listing rendered at double
  height regardless of `line-height`.

### Known limitations

- **Filtering by segment is not supported**, and cannot be done server-side: the
  buffer has no segment column, the module publishes no `by-segment` container,
  and the `json_extract` fallback is unsound because materialization nests
  segments by group (PID is top-level in ADT_A01 but at
  `$.response[].patient.pid` in ORU_R01, so a probe reports zero for messages
  that plainly contain one). The original requirement asked for
  "message type | segment"; only the message-type axis exists.
- **Seven of the twelve filterable columns are unindexed.** `buffer/schema.sql`
  indexes only `control_id` (unique), `(schema_id, status, received_at)` and a
  partial index on `lease_id`, so all four facet filters are table scans —
  correct, but not fast on a large buffer.
- **Stop does not interrupt an in-flight request** in the channel analyzer.
  `ChannelComparer` creates an `AbortController`, but the signal cannot reach the
  SDK (`Hl7Api.search` has nowhere to put it), so Stop only prevents the next
  page. Needs DataProducer SDK support.
- **Intermittent receiver stalls.** One comparison sat in `fetching` for 300s and
  an earlier one failed at ~121s on the `HubConnector` axios timeout
  (`timeout: 119_634` ms); the identical comparison then returned in 8.5s. Not
  reproducible and not attributable to app code. Combined with the item above,
  the UI offers no escape during a stall.
- **RDE_O03 on HL7 2.2 is never parsed** by the receiver — it stores only the
  index attributes, so those messages are reported as "not parsed" and are never
  counted valid or invalid. That is a schema gap in the module, not in this app.

## [0.1.0]

Initial release. Two read-only tools over a ZeroBias Hub HL7 v2 MLLP receiver
(`@zerobias-org/module-hl7-v2` v1.2.3), reached through the platform's
**DataProducer** interface — `DynamicDataProducerHubImpl` plus the objects /
collections / functions / schemas APIs. No direct HTTP to the Hub anywhere.

Angular 21 scaffold (standalone, zoneless, signals, `@if`/`@for`, lazy routes,
Vitest) built on `@zerobias-org/ngx-library` (`zb-simple-panel`,
`zb-remote-table` + `zb-remote-table-header` + `ZbRemoteTableService`,
`zb-resource-status`) and the ZeroBias v2 client. The bootstrap, session and
theming half is inherited from `example-angular-v2`.

### Added

- **Feed picker** (`core/hl7-target.service.ts`, `shared/target-picker/`) —
  resolves org -> module -> connection -> scope and hands pages a connected,
  cached producer client per target. Modules are looked up by **`key`**
  (`@zerobias-org/module-hl7-v2`), not by product. Selection is remembered per
  org in `localStorage` (`hl7-analyzer.target.<orgId>`); a monotonic run-id
  guard discards superseded async selections.
- **Messages search** (`pages/messages/`) — `ZbRemoteTableContainerComponent` in
  `ZB_TABLE_MODE.ROUTE`, so filters, sort and page live in the URL. Filter menus
  are populated from the module's own `by-port` / `by-type` / `by-version` /
  `by-sender` facets rather than hardcoded lists. Filters compile to RFC4515
  through `core/hl7-filter.ts`, restricted to the module's twelve envelope
  columns (`ENVELOPE_COLUMNS`) — real columns, but only five of them are covered
  by an index.
- **Message detail** (`pages/messages/message-detail.ts`) — the stored JSON and
  the raw ER7 side by side with per-finding highlighting in both, plus a
  findings list that names the HL7 field (`OBX-3`), its data type and
  description, and cites the schema the field number came from. Field ordinals
  are derived from the live segment type schema (`property index + 1`), never
  from a built-in table.
- **Batch validation** (`core/batch-validate.ts`) — validates the current search
  up to a cap (50 / 200 / 1000, default 200) at concurrency 6 and rolls findings
  up **by defect**, collapsing array indices, so one misconfigured sender reads
  as one row with its message and occurrence counts.
- **Channel comparison** (`pages/channels/`, `core/fingerprint.ts`,
  `core/channel-compare.ts`) — fingerprints message content to find the same
  message on two receiving ports, in either **business key** mode (default:
  patient account number + event type code + recorded date/time, editable) or
  **full content** mode (all content minus the MSH transport fields). Reports
  distinct / shared / only-A / only-B, Jaccard overlap, and field-level
  conflicts rolled up by path. Ported from the module repo's `hl7_coupling`
  scripts.
- **`shared/json-view` and `shared/er7-view`** — hand-rolled `<pre>` viewers that
  paint exact JSON paths (`core/json-lines.ts`) and exact character ranges in the
  wire text (`core/er7.ts`), which a CodeMirror editor cannot place.
- Docs: [`AGENTS.md`](./AGENTS.md), [`docs/architecture.md`](./docs/architecture.md),
  [`docs/validation.md`](./docs/validation.md),
  [`docs/channel-analysis.md`](./docs/channel-analysis.md),
  [`docs/using-ngx-library.md`](./docs/using-ngx-library.md), and this file.

### Correctness decisions worth knowing

These are invariants, not polish — see [AGENTS.md](./AGENTS.md#invariants).

- **Unparsed messages are never counted valid or invalid.** The receiver
  materializes a message only when it has a schema for the structure; otherwise
  it stores wire text plus index attributes and `ops/validate` falls back to
  `schema:shared:hl7v2.message-envelope`, returning eight errors about the
  receipt envelope's own fields. Both tools detect the condition and report
  "Not parsed" instead.
- **ER7 highlighting is all-or-nothing.** `alignSegments` returns `null` if the
  JSON segment sequence and the parsed wire text disagree at all, and the detail
  page then drops every ER7 mark and says so. A mark on the wrong field is worse
  than no mark.
- **MSH is off by one** when splitting ER7 fields (MSH-1 *is* the separator), and
  the parser handles it explicitly.
- **Every capped run says what it sampled**, and a truncated channel comparison
  marks itself provisional.
- **Unkeyed messages are held out** of a comparison rather than collapsed into a
  single false coupling, with their own count and explanation.
