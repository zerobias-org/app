# hl7-analyzer — agent guide

Two interactive tools over an HL7 v2 MLLP receiver: a **message validator** and a **channel
analyzer**. The data comes from a Hub connection deployed from the `@zerobias-org/module-hl7-v2`
module (v1.2.3), which implements the **DataProducer** interface; everything is read-only.

Angular 21 (standalone, zoneless, signals) on `@zerobias-org/ngx-library`, scaffolded from the
`example-angular-v2` reference app. Repo-wide app/deploy conventions:
[`../../../AGENTS.md`](../../../AGENTS.md). Code rules (Angular 21 non-negotiables, ngx-library
first): [CLAUDE.md](./CLAUDE.md).

## What the two tools do

**Messages** (`/messages`, `/messages/detail`)
Search the receiver by message structure, receiving port, sending application, HL7 version, control
id (prefix) and a received-on date window, from an explicit filter bar above the table. Every one of
those is a server-side filter — see [Filtering](#filtering-what-the-receiver-can-and-cannot-do) for
what the module supports and what it does not. Open one message to see it as JSON and as raw ER7 wire text, side
by side with a findings list: every validation error is resolved to an HL7 field (`OBX-3`), cited
against the live schema it came from (`schema:type:hl7v2.v23.OBX`), and painted onto both
representations. A batch mode validates a whole result set and rolls the findings up **by defect**
rather than by message — a misconfigured sender produces one defect repeated N times, and that is
what you want to see.

**Channels** (`/channels`)
Pick two receiving ports (`sourcePort`, the "channels") and a date window, and see what both carry,
what only one carries, and where two copies of the same message disagree field by field. Identity is
a **content fingerprint**, because MSH-10 is re-stamped per hop by the interface engine and is
therefore unique on every row. Two match modes: **identity** (a business key — the default) and
**content** (strict full-content fingerprint).

## Layout

```
src/app/
  core/
    zerobias-app.service.ts   v2 client construction + init()  (from example-angular-v2)
    session.service.ts        user / org / api as signals
    hl7-target.service.ts     org -> module -> connection -> scope -> connected DataProducer client
    hl7-api.ts                the module's object tree; search / get / er7 / validate / fetchAll
    hl7-filter.ts             RFC4515 filter construction over the twelve envelope columns
    hl7-schema.ts             validation error -> HL7 field ordinal, via the segment's live schema
    er7.ts                    ER7 parsing + offsets; JSON<->ER7 segment alignment
    json-lines.ts             pretty-print JSON as lines that know their own path
    batch-validate.ts         validate a result set, roll up by defect  (provided per page)
    fingerprint.ts            flatten / fingerprint / compare two channel populations
    channel-compare.ts        runs a comparison and holds its state    (provided per page)
    nav.ts                    the three sidebar entries
  pages/
    home/home.ts               overview + the feed picker
    messages/messages.ts       search table (zb-remote-table, ROUTE mode) + batch validation panel
    messages/message-detail.ts one message: JSON tab, ER7 tab, findings list
    channels/channels.ts       two-port comparison, results tabs
  shared/
    target-picker/            connection + scope selects (collapse to a read-only line when there is
                              nothing to choose)
    date-range/               two native `type="date"` inputs -> `YYYY-MM-DD` strings
    json-view/                pretty JSON with marked lines (hand-rolled <pre>)
    er7-view/                 raw ER7 with marked character ranges (hand-rolled <pre>)
  shell/                      user menu, org switcher, create-API-key dialog
proxy.conf.js                 local-dev /api proxy to UAT + APIKey injection
```

## How data gets in

`Hl7TargetService` resolves the feed and hands out a connected client:

```
storeClient.getModuleApi().search({ key: '@zerobias-org/module-hl7-v2' })
hubClient.getConnectionApi().search({ modules: [...] })
hubClient.getScopeApi().search({ connections: [id] })
new DynamicDataProducerHubImpl().connect(profile)   // targetId = scope if any, else connection
```

Modules are found by **`key`**, not product: the receiver advertises two products
(`product-hl7-hl7`, `product-auditmation-generic-dataproducer`) and a `packageCode` product search
comes back empty on UAT, which would leave the picker blank for no visible reason.

`Hl7Api` is the only place that names module paths:

| Path | Kind | Used for |
|---|---|---|
| `/hl7-v2-receiver/messages` | collection | every search, and `get(controlId)` by primary key |
| `/hl7-v2-receiver/by-port` | container | distinct `sourcePort` values (the channels) |
| `/hl7-v2-receiver/by-type` | container | distinct `messageStructure` values |
| `/hl7-v2-receiver/by-version` | container | distinct `hl7Version` values |
| `/hl7-v2-receiver/by-sender` | container | distinct `sendingApp` (MSH-3) values |
| `/hl7-v2-receiver/ops/er7` | function | the raw wire text for one message |
| `/hl7-v2-receiver/ops/validate` | function | schema validation of one message |

The `by-*` containers only populate the pickers. All real searching is one filtered query against
`messages`, because a single flat RFC4515 filter can express every axis at once (port AND structure
AND date) and the per-facet collections cannot.

The module also advertises a `/stats` document. It is **not fetchable** on 1.2.3 —
`getDocumentData` fails with `Unknown API class: DocumentsApi` — so nothing in the app depends on it.

More detail: [docs/architecture.md](./docs/architecture.md).

## Filtering: what the receiver can and cannot do

The messages page has one filter state, and it is the URL. The filter bar (Structure / Receiving
port / Sending app / HL7 version selects, a control-id prefix box, the date range, "Clear filters",
the active-filter count and the server's matching total) and the `zb-remote-table-header` column
menus both write through `ZbRemoteTableService.updateParams()` and both read back from the request
params, mirrored into the `filterState` signal in `onRouteChanges()`. There is no second criteria
signal, and **nothing in this app filters rows in the browser** — the total in the bar is the
receiver's count, so narrowing a filter changes the total, not just the page. Live, on the UAT feed:

```
unfiltered                      24,519
+ messageStructure=ADT_A01       6,544
+ sourcePort=Departmental ADT    3,118
+ hl7Version=2.2                   872
+ controlId=2228 (prefix)          282
```

The select options are not hardcoded: they are the children of the module's `by-type` / `by-port` /
`by-sender` / `by-version` containers, fetched once per target into `facetOptions` and published to
both renderings of that vocabulary (the bar's selects and the table service's column options). The
bar costs no extra backend calls.

Constraints from the module (`Hl7SqlAdapter.java`, `buffer/schema.sql`, `ObjectTree.java` in
`org/module/package/hl7/v2`). These are not oversights in this app; do not "fix" them back:

- **Operators.** `=` equality, a **trailing** `*` prefix glob, `>=` / `<=` (meaningful only on
  `receivedAt`, the one epoch-millis column), and `&` / `|` / `!`. A **leading** `*` is not a glob:
  `RFC4515Parser` tests for `=*` before `=`, so `(sendingApp=*LAB)` compiles to
  `sending_app IS NOT NULL` and matches everything, with no error. `escapeFilterValue` escapes every
  `*` in user input for that reason; the only unescaped glob the app emits is the trailing one in
  `buildFilter`'s control-id branch. There is no contains and no ends-with.
- **Escaping is `\ * ( )` only.** `%` and `_` must be passed through raw: the module escapes LIKE
  metacharacters itself (`Hl7SqlAdapter.likeLit` rewrites `\`, `%`, `_` and appends `ESCAPE '\'`),
  so escaping them here escapes them twice and the backslash ends up in the comparison. Every
  message structure contains an underscore, so this was fatal: `(messageStructure=ADT_A01)` → 6544
  rows, `(messageStructure=ADT\_A01)` → 0.
- **There is no server-side sort.** `sortBy` / `sortDir` are accepted and discarded —
  `BufferStore.search` hardcodes `ORDER BY received_at DESC, id DESC`. No column declares
  `sortable`, because a sort arrow that reorders nothing is worse than none.
- **Only four attributes have an enumerable vocabulary** — the four `by-*` containers. `status`,
  `messageCode`, `triggerEvent`, `sendingFacility`, `leaseId` and `schemaId` are filterable columns
  with no vocabulary surface, so the UI offers no control for them: a free-text box over values the
  user cannot see returns zero rows for a typo, which reads as "no data" rather than "no match".
- **Filtering by segment is not possible.** The buffer has no segment column, the module publishes
  no `by-segment` container, and the `json_extract` fallback is unsound because materialization
  nests segments by group — PID is top-level in an ADT_A01 but lives at `$.response[].patient.pid`
  in an ORU_R01, so a probe like `(pid=*)` would report zero for messages that plainly contain one.
  The original requirement asked for "message type | segment"; the segment axis is not supported,
  and the app offers no substitute. (A browser-side segment filter would silently mean "segment,
  among the 50 rows on this page", which is not the question anyone is asking.)
- **Correct is not fast.** Twelve attributes hit real columns, but `buffer/schema.sql` indexes only
  `control_id` (unique), `(schema_id, status, received_at)` and a partial index on `lease_id` —
  **seven of the twelve are table scans**, including all four facet filters (`message_structure`,
  `source_port`, `sending_app`, `hl7_version`, plus `message_code`, `trigger_event`,
  `sending_facility`). Do not read the twelve as a performance guarantee.
- **A no-match filter answers `count: -1`**, not `0` — verified on `(status=ACKED)` and on any
  structure with no messages. `Hl7Api.search` clamps it; passing it through put "-1 matching" in
  front of the user.

## Invariants

Break these and the app starts making claims the data doesn't support.

1. **DataProducer SDK only.** Every call goes through `getCollectionsApi()` / `getFunctionsApi()` /
   `getSchemasApi()` / `getObjectsApi()` on the client from `Hl7TargetService.producer()`. No
   hand-built REST URLs, no `fetch` to `/api/hub/targets/...`. The module's OpenAPI contract is the
   only thing this app is allowed to depend on. (On the wire a function call is
   `{ objectId, requestBody: { … } }` — that is the SDK's business, not yours.)
2. **`APIKey`, never `Bearer`.** Local dev authenticates through `proxy.conf.js` with
   `Authorization: APIKey $ZB_TOKEN_UAT`. `Bearer` returns 401 against UAT. Deployed builds use the
   platform session cookie and inject nothing.
3. **Never highlight a range you cannot prove maps to the right segment.** `alignSegments()`
   (`core/er7.ts`) is all-or-nothing: it returns `null` unless the JSON's segment sequence and the
   wire text's agree in length and in every segment name. When it returns `null` the ER7 highlights
   are dropped and the page says why. A mark on the wrong field is worse than no mark. Same rule for
   the MSH off-by-one — MSH-1 *is* the field separator, so for MSH `parts[n-1]` is MSH-n; getting it
   wrong shifts every MSH highlight by one field and looks entirely plausible.
4. **Filters only ever name the twelve envelope columns.** The module compiles RFC4515 to a SQLite
   `WHERE`; those twelve map to real columns (`ENVELOPE_COLUMNS`), anything else degrades to a
   `json_extract` that returns NULL — i.e. matches nothing — as soon as the path crosses a repeat.
   That mapping is not a gate: an unknown attribute is not rejected, it silently returns zero rows.
   The whitelist is `Hl7FilterAttr` in `core/hl7-filter.ts`. Note the attribute is
   `messageStructure`, **not** `messageType`: `(messageType=ORU_R01)` is not an error, it just
   returns zero rows. "Column" is not "index" and it is not a licence to widen the filter language —
   see [Filtering](#filtering-what-the-receiver-can-and-cannot-do) for the operators, the escaping
   rule, the missing sort and the missing segment axis.
5. **An unparsed message is never counted valid or invalid.** When the receiver has no schema for a
   structure it stores only the twelve index attributes (no `msh`), and `ops/validate` falls back to
   `schema:shared:hl7v2.message-envelope` and returns eight bogus "undeclared property" errors. Both
   tools detect this (`MATERIALIZED_KEY`, `ENVELOPE_SCHEMA_ID`) and report **"Not parsed"** with its
   own count. Suppressing those eight errors is not cosmetic — they are the envelope complaining
   about the receipt, not about HL7.
6. **Batch and comparison runs are capped, and the UI always says what it sampled.** Messages:
   50 / 200 / 1000 (default 200), one `ops/validate` round trip each, 6 in flight at a time.
   Channels: 500 / 2000 / 5000 per channel (default 2000). When a fetch truncates, the messages page
   prints "Sampled the N most recent of M matching messages" and the channels page marks the whole
   result **provisional** — "only on A" is not a sound conclusion when B was cut short.
7. **Unkeyed messages are held out of a comparison.** A message carrying none of the identity key's
   fields fingerprints to the empty object; if they were kept, every such message on both channels
   would collapse into one enormous false coupling. They are counted and explained separately, never
   as matched or missing.

## ngx-library under zoneless change detection

Read this before adding another `zb-remote-table` (or any ngx-library component that fills itself
from an RxJS stream) to this app.

The library's table components are `Default` strategy and assign **plain fields** from RxJS
subscriptions. This app is zoneless, so nothing schedules a render when one of those subjects fires
after the last change-detection pass. The symptom is not an error: the column header filter menus
rendered **zero buttons**, while the `ZbRemoteTableHeaderComponent` instances held 22 options and
`filterable: true` — the facet values arrive ~3s after the last render, the component stores them
and sets its `showMoreButton`, and the DOM is never refreshed again. A single forced pass
materialised the menus.

The fix is in `pages/messages/messages.ts`: subscribe to `tableService.columnOptionChanges()` and
call `ChangeDetectorRef.markForCheck()`. Marking the host view dirty is enough — the headers are
`Default`-strategy descendants, so they are checked whenever the host is — and the service is
provided by that component, so the subscription dies with it.

Related, same cause: `Messages` is the app's one deliberate non-`OnPush` component, because
`ZbRemoteTableContainerComponent` mutates `loading` / `displayColumns` from RxJS callbacks. Both
reasons are recorded in the component's header comment; keep them there.

## Local development

The developer runs `ng serve` over SSH, so the dev server binds `0.0.0.0` (`angular.json` →
`serve.options.host`, with `allowedHosts: true`). Don't change it back to localhost.

```bash
export ZB_TOKEN_UAT='<a ZeroBias API key for uat.zerobias.com>'
npm ci
npm start        # http://<host>:4200/hl7-analyzer/
```

`proxy.conf.js` forwards `/api/*` to `https://uat.zerobias.com` and injects
`Authorization: APIKey ${ZB_TOKEN_UAT}`; the key is read at serve time and is never committed or
bundled. If `ZB_TOKEN_UAT` is unset the header goes out empty and every call 401s.

`.npmrc` resolves `@zerobias-com` / `@zerobias-org` / `@auditlogic` from `https://pkg.zerobias.org`
with `${ZB_TOKEN}` — so `npm ci` needs `ZB_TOKEN` exported too (the same API key works).

### Pointing it at a different org / target

Nothing is hardcoded. The **org** comes from the account menu in the toolbar (`shell/user-menu/`);
switching it invalidates every cached DataProducer client and reloads the connection list, because
connections belong to an org. The **connection/scope** is chosen in the feed picker
(`shared/target-picker/`) that appears on every page, and is remembered in `localStorage` under
`hl7-analyzer.target.<orgId>` — keyed by org, so restoring never points you at another org's feed.
A single connection with a single scope is auto-selected.

Development ran against UAT org `a52d5b70-e587-57e2-a653-ec271564eab5` and hub target
`67ca2c1f-476d-4310-b19f-389910d45c12`; the numbers quoted in these docs came from that feed.

## Notes on the live feed

Behaviour of the real receiver that the code works around — see
[README.md](./README.md#notes-on-the-live-feed) for the user-facing version.

- The `messages` collection returns **two element shapes**: a fully materialized message (has `msh`
  plus the structure's top-level groups) or, when the receiver has no schema for the structure, only
  its twelve index attributes. On the UAT feed that is RDE_O03 on HL7 2.2 — roughly 37% of recent
  messages. The ER7 text is stored either way, so the wire message is never lost; only the parsed
  view is.
- `ops/validate` on such a message falls back to `schema:shared:hl7v2.message-envelope` and returns
  8 "undeclared property" errors about the index attributes. Suppressed (invariant 5).
- **MSH-12** is a bare string on HL7 2.3 and a `{ versionID }` VID composite from 2.4 on. MSH-3 /
  MSH-4 are sometimes bare strings, sometimes `{ namespaceID }` HD composites. `toRow()` handles
  both; rendering the composite straight into a column is where `[object Object]` came from.
- The `properties` projection argument on `searchCollectionElements` is **silently ignored** by the
  module — you always get whole elements, so don't build anything on a narrowed projection.
- UAT search responses come back as bare JSON arrays; the total matching a filter comes from the
  paging headers (`results.count`), not from the body length.
- Date bounds: full ISO instants work in comparisons (`(receivedAt>=2026-07-24T00:00:00Z)`), and so
  do date-only bounds — both return the same rows. The app emits date-only, widening an upper bound
  to `T23:59:59.999Z` because the adapter compares epoch-millis and would otherwise exclude the
  whole final day.
- The sender axis is MSH-3 (`sendingApp`): `(sendingApp=LAB)` returns rows where
  `(sendingFacility=LAB)` returns none, and `/by-sender` is keyed the same way.

## Build & deploy

- `npm run build` → static bundle **flat in `dist/`** (`outputPath.browser: ""`),
  `baseHref: /hl7-analyzer/`. That is what CI syncs to
  `s3://app-<env>-zerobias.com/hl7-analyzer/`.
- One build is promoted across uat / qa / prod — the v2 client resolves its API host from
  `location.host` at runtime, so no per-environment values are baked in. `ng serve` swaps
  `environments/environment.ts` for `environment.development.ts` via `fileReplacements`.
- Node **22** (`.nvmrc`), committed `package-lock.json`, `npm ci` in CI.
- **One app per PR.** A PR or promotion branch must change only `package/zerobias/hl7-analyzer/` —
  see the repo [AGENTS.md](../../../AGENTS.md#deploy).

## Tests

`npm test` (Vitest, via `@angular/build:unit-test`). Coverage today is the scaffold's `app.spec.ts`
plus `src/app/testing/fake-uuid.ts`. The pure modules in `core/` — `hl7-filter.ts`, `er7.ts`,
`json-lines.ts`, `fingerprint.ts` and the parsing helpers in `hl7-schema.ts` — take no Angular or
network dependencies and are the obvious next place to add tests.

## Angular docs (local, version-pinned)

Angular changes fast across versions; prefer version-exact docs over memory. Run
`npx github:w3geekery/angular-agents-md` in this folder to download the docs matching this app's
Angular version into `.angular-docs/` (gitignored). Re-run after an Angular bump.

## Related documentation

- [docs/architecture.md](./docs/architecture.md) — data flow, and what each core service owns.
- [docs/validation.md](./docs/validation.md) — how a finding is produced and mapped onto the JSON and
  the ER7 text.
- [docs/channel-analysis.md](./docs/channel-analysis.md) — fingerprinting, the two match modes, and
  the hazards.
- [docs/using-ngx-library.md](./docs/using-ngx-library.md) — consuming the component library.
- [../example-angular-v2/AGENTS.md](../example-angular-v2/AGENTS.md) — the reference app this was
  scaffolded from (client bootstrap, session, shell patterns).
