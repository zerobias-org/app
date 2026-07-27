# Architecture

How a page in this app gets data, and what each piece owns. Everything below is read-only: the app
searches collections, invokes two module functions, and reads schemas.

## Data flow

```
account menu (org)                     shell/user-menu/ + core/session.service.ts
        |
        v
feed picker (connection, scope)        shared/target-picker/ + core/hl7-target.service.ts
        |
        v
DynamicDataProducerHubImpl             one connected client per targetId, cached
        |
        v
DataProducer SDK                       getObjectsApi / getCollectionsApi
                                       getFunctionsApi / getSchemasApi
        |
        v
module object tree                     /hl7-v2-receiver/{messages, by-*, ops/er7, ops/validate}
        |
        v
core/hl7-api.ts                        the only place module paths are named
        |
        +--> pages/messages          (search, batch validation)
        +--> pages/messages/detail   (one message: JSON + ER7 + findings)
        +--> pages/channels          (two-port comparison)
```

## Bootstrap

`app.config.ts` runs one `provideAppInitializer`: it registers the Material Symbols icon font and
the `ZbRemoteTable` translation namespace, then `ZerobiasAppService.init()` (constructs the v2
client and establishes/checks the session — redirecting to platform SSO when deployed and there is
no session), then `SessionService.connect()` to wire the `user` / `org` / `api` signals from the
client's RxJS streams. This half is inherited from `example-angular-v2` essentially unchanged.

`environment.isLocalDev` distinguishes the two auth worlds: local dev goes through the `/api` proxy
with an API key and disables the session WebSocket (there is no ws server locally, and the client
would otherwise reconnect-spam forever); deployed builds use the session cookie. One production
build is promoted across uat / qa / prod — the client resolves its API host from `location.host` at
runtime, so nothing environment-specific is baked in.

## What each core file owns

### `core/hl7-target.service.ts` — which feed, and a client for it

Resolves org → module → connection → scope, and hands out a connected
`DynamicDataProducerHubImpl`. Pages never hold a client; they `await target.producer()` each time,
which is cheap because the service caches one client per `targetId` and de-duplicates concurrent
connects through an in-flight promise map.

Notable behaviour:

- The **target** is the scope when the connection has one, else the connection itself. That id is
  what the Hub proxies calls to.
- Modules are looked up by **`key`** (`@zerobias-org/module-hl7-v2`), not by product — a
  `packageCode` product search returns nothing on UAT and would leave the picker mysteriously blank.
- A monotonic `runId` guards every async selection, so a slow response from a superseded selection
  cannot overwrite the current one.
- Switching org clears both caches and reloads the whole list; connections belong to an org.
- The selection is remembered in `localStorage` under `hl7-analyzer.target.<orgId>` — keyed by org,
  because the same browser can hold sessions for orgs with entirely different connections.
- `phase` (`idle` / `loading` / `connecting` / `ready` / `error`) and `error` are signals, so every
  page can show one honest line of state without duplicating the logic.

### `core/hl7-api.ts` — the module's object tree

The only module-path vocabulary in the app (`MESSAGES`, `FACETS`, `OPS_ER7`, `OPS_VALIDATE`), and
the only place that knows the shape of what comes back.

- `facet(kind)` — children of a `by-*` container, for the pickers: distinct value + count.
- `search(criteria, page, size, sortBy, descending)` — one filtered query against `messages`,
  newest first (the only order there is — the module discards the sort arguments). Total comes from
  the paging headers (`results.count`), which matters because UAT returns bare JSON arrays; a filter
  that matched nothing answers `count: -1`, which is clamped here because "-1 matching" is not a
  thing to show a user.
- `get(controlId)` — one element by primary key (the collection is keyed on MSH-10).
- `er7(controlId)` / `validate(controlId)` — the two functions.
- `fetchAll(criteria, {cap, pageSize, onProgress, signal})` — paged fetch with a hard ceiling,
  returning `{rows, total, truncated}`. The busiest channel holds ~12k messages at a few KB each, so
  an uncapped fetch is tens of MB; the caller is always told whether it truncated.
- `toRow(message)` — projects either element shape onto the search columns and sets
  `materialized`. This is where the two-shapes problem, the MSH-9 structure differences across
  versions, the MSH-12 string-vs-VID-composite difference and HD composites are handled — once, so
  no page has to.

### `core/hl7-filter.ts` — the query language

Builds RFC4515 filters. `Hl7FilterAttr` is a closed list of the module's twelve **envelope
columns** (`ENVELOPE_COLUMNS` in `Hl7SqlAdapter.java`); nothing else is ever put in a filter,
because any other attribute degrades to a `json_extract` that returns NULL — matching nothing — as
soon as the path crosses a repeating property. That is not enforced by the module: an unknown
attribute is not an error, it is zero rows.

Column is not index. `buffer/schema.sql` indexes `control_id` (unique),
`(schema_id, status, received_at)` and `lease_id` (partial), so **seven of the twelve are table
scans** — including every attribute the filter bar offers. Correct answers, not fast ones.

`escapeFilterValue` escapes `\`, `*`, `(` and `)` — and deliberately **not** `%` or `_`. Those are
SQL `LIKE` metacharacters, but the module escapes them itself (`Hl7SqlAdapter.likeLit` rewrites
`\`, `%`, `_` and appends `ESCAPE '\'`), so escaping them here escapes them twice and the literal
backslash lands in the comparison: `(messageStructure=ADT_A01)` returns 6544 rows and
`(messageStructure=ADT\_A01)` returns 0. Since every message structure contains an underscore, that
made the structure filter return "no data" for every value. `(controlId=2_28*)` returning 0 is the
proof that `_` is not a wildcard on the wire, so passing it raw cannot widen anything.

`*` is escaped everywhere except the trailing glob in the control-id branch, which is the user
asking for a prefix match. A **leading** `*` must never be emitted: `RFC4515Parser` tests `=*`
before `=`, so `(sendingApp=*LAB)` compiles to `sending_app IS NOT NULL` and matches everything with
no error.

Two more module limits shape what the page can offer: `sortBy`/`sortDir` are accepted and discarded
(`BufferStore.search` hardcodes `ORDER BY received_at DESC, id DESC`), and there is no segment axis
at all — no segment column, no `by-segment` container, and a `json_extract` probe is unsound because
materialization nests segments by group (PID is top-level in ADT_A01, `$.response[].patient.pid` in
ORU_R01). See [AGENTS.md](../AGENTS.md#filtering-what-the-receiver-can-and-cannot-do).

### `core/hl7-schema.ts` — schema citation

Turns a validation error into an HL7 field with a citable source, and caches schemas by id
(caching the *promise*, so a batch run's thousands of resolutions share one round trip per schema).
See [validation.md](./validation.md).

### `core/er7.ts`, `core/json-lines.ts` — locating things in text

`er7.ts` parses the wire format far enough to know where each segment and field starts and ends in
the original string, and can align the JSON's segment sequence with the wire text's. `json-lines.ts`
pretty-prints JSON as lines that carry their own path, so a path-shaped validation error can be
matched exactly rather than regex-guessed. Both are pure functions with no Angular dependency.

### `core/batch-validate.ts`, `core/channel-compare.ts` — the two long-running jobs

Both are `@Injectable()` **without** `providedIn`, and are provided by their page — so state is
scoped to the page and reset when you leave it. Both expose signals for phase/progress/results,
support cancellation through an `AbortController`, and are capped. `BatchValidator` runs
`ops/validate` with a concurrency of 6 and rolls errors up by defect; `ChannelComparer` fetches both
populations in parallel and delegates the comparison to the pure functions in `core/fingerprint.ts`.

## Pages

- **`pages/home`** — the intro, the feed picker, the two tool cards, and the session panel. The
  picker lives here because the choice is shared by both tools; putting it on the landing page makes
  the order of operations (org → feed → work) the shape of the app.
- **`pages/messages`** — `ZbRemoteTableContainerComponent` in `ZB_TABLE_MODE.ROUTE`, so the filters
  and the page live in the URL (there is no sort to store — no column is `sortable`, because the
  module discards `sortBy`). A filter bar renders the four facet axes, a control-id prefix box, the
  date range, "Clear filters", the active-filter count and the server's matching total; the column
  header menus render the same four vocabularies with `useExactKey`, because the receiver's filter
  takes one value per attribute. **Both are one state**: every control writes through
  `ZbRemoteTableService.updateParams()` and reads back from the request params, mirrored into the
  `filterState` signal in `onRouteChanges()` — so a chip's X, a header menu, the bar and the back
  button all agree, and no rows are ever filtered in the browser. The facet values are fetched once
  per target (`facetOptions`) and pushed to both renderings, so the bar costs no extra calls. The
  date window has its own controls (`shared/date-range`) and is excluded from the filter chips so
  there is only one place to remove it. The batch validation panel sits above the table, and its
  per-message verdicts feed the table's "Validity" column.

  The page subscribes to `tableService.columnOptionChanges()` and calls `markForCheck()`. That is
  not optional: ngx-library's table components are `Default` strategy and assign plain fields from
  RxJS subjects, so under zoneless change detection the late-arriving facet options never reached
  the DOM and the header menus rendered zero buttons. Same reason the page is the app's one
  non-`OnPush` component — see [AGENTS.md](../AGENTS.md#ngx-library-under-zoneless-change-detection).
- **`pages/messages/message-detail`** — loads the message, then the ER7 text and the validation in
  parallel (each is useful alone, so one failing does not blank the page), then resolves findings.
  Routed as `/messages/detail?id=<controlId>` rather than a path param: MSH-10 is free-form HL7 text
  and can legitimately contain `/`.
- **`pages/channels`** — everything is computed in the browser from two fetched populations, because
  the receiver can filter and count but has no notion of "the same message on another port". Lists
  render at most 200 rows.

## Why not a code editor for the two views

`shared/json-view` and `shared/er7-view` are hand-rolled `<pre>` components rather than
`zb-code-editor`. The highlights are arbitrary character ranges (ER7) and exact JSON paths, computed
from the schema; placing those in CodeMirror is both harder and heavier than emitting spans, and HL7
has no syntax highlighting worth the name — the interesting structure is *which field is wrong*.
`er7-view` clips any mark to a single line, so a bad range can never smear the whole message.

Both views make their `<pre>` the scroll box (`max-height: 70vh; overflow: auto`, `line-height: 1.4`
= 16.8px rows at 12px). That is what lets the detail page reveal a selected finding by moving the
`<pre>`'s own `scrollTop` instead of calling `scrollIntoView()`, which would scroll the document and
drag the findings list off screen — see [validation.md](./validation.md#6-rendering).
