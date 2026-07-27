# hl7-analyzer

Two tools for looking at live HL7 v2 traffic captured by a ZeroBias Hub MLLP receiver:

- **Messages** — find a message, see whether it conforms to its HL7 schema, and see exactly where
  and why it doesn't — in the parsed JSON and in the raw ER7 wire text at the same time. Or validate
  a whole result set at once and read the findings grouped by defect.
- **Channels** — take two receiving ports over a date range and find out what they both carry, what
  only one of them carries, and where two copies of the same message disagree field by field.

It reads a connection deployed from the `@zerobias-org/module-hl7-v2` module (v1.2.3), which
implements the platform's **DataProducer** interface. The app is strictly read-only: it searches
collections, invokes the module's `er7` and `validate` functions, and reads schemas. It never writes
anything back.

Angular 21 (standalone, zoneless, signals) built on `@zerobias-org/ngx-library` and the ZeroBias v2
client.

**Deployed at `https://<env>.zerobias.com/hl7-analyzer` — start there and navigate.** Sub-page URLs
(`/hl7-analyzer/messages`, `/hl7-analyzer/channels`) are not served directly: loading or refreshing
one lands you on the ZeroBias portal instead, because the CDN has no single-page-app fallback.
Navigation inside the app works normally; it is only the direct link that fails. See
[AGENTS.md](./AGENTS.md#deep-links-are-not-served-cdn-limitation).

## Prerequisites

- **Node 22** (see `.nvmrc`) and npm >= 10.
- A **ZeroBias API key**. It is used for two things: installing the private `@zerobias-*` packages
  (`ZB_TOKEN`) and authenticating the local dev proxy against UAT (`ZB_TOKEN_UAT`). The same key
  works for both.
- Membership of an org that has a **connection deployed from `@zerobias-org/module-hl7-v2`**. The
  app has nothing to show without one, and says so.

## Quick start

```bash
export ZB_TOKEN='<your ZeroBias API key>'          # private registry, for npm ci
export ZB_TOKEN_UAT='<your ZeroBias API key>'      # local dev auth against uat.zerobias.com
npm ci
npm start
```

Then open `http://<host>:4200/hl7-analyzer/`. The dev server binds `0.0.0.0`, so it is reachable
from another machine (e.g. over an SSH tunnel or on the LAN), not just from localhost.

A browser on localhost cannot share the platform's session cookie, so local dev authenticates with
an API key instead: `proxy.conf.js` forwards every `/api/*` request to `https://uat.zerobias.com`
and adds `Authorization: APIKey $ZB_TOKEN_UAT`. The key is read from the environment at serve time —
it is never committed and never ends up in a bundle. The scheme must be **`APIKey`**; a `Bearer`
header comes back 401.

Deployed builds don't use any of that: the ZeroBias client establishes a platform session (SSO
redirect, or inherited from the portal when the app runs in an iframe).

Other commands: `npm run build` (static bundle into `dist/`), `npm test` (Vitest).

## Choosing the org and the feed

Two picks, in this order:

1. **Org** — the account menu in the top-right toolbar. Hub connections belong to an org, so
   switching org reloads the list of available feeds.
2. **Feed** — the "HL7 feed" panel on every page lists the connections in that org deployed from the
   HL7 receiver module, plus their scopes. When there is only one of each it selects itself and just
   states what it picked. Your choice is remembered per org in `localStorage`.

Both tools are disabled until a feed is selected.

## Messages

**Search.** A filter bar sits above the table: **Structure**, **Receiving port**, **Sending app**,
**HL7 version**, a **control id** prefix box, a received-on window, "Clear filters", how many
filters are active, and how many messages match on the server. The values in each select are fetched
from the module (`by-type`, `by-port`, `by-sender`, `by-version`), not hardcoded, so they always
describe the feed in front of you — and they are the same values the column header menus offer,
because the bar and the menus are one filter state, not two: set a filter either way, dismiss its
chip, or press back, and everything agrees.

Every filter is applied **by the receiver**, not in the browser, so the count is a real total and
narrowing changes it. On the UAT feed: 24,519 unfiltered → 6,544 for `ADT_A01` → 3,118 of those on
the `Departmental ADT` port → 872 of those on HL7 2.2 → 282 whose control id starts `2228`.

Filter state lives in the URL: a search is a link you can paste to someone, and going "back" from a
message returns you to your search.

Two things the receiver cannot do, so neither does this page: **there is no sort** (the module
accepts a sort and ignores it — messages always come back newest-first), and **there is no filter by
segment** (the buffer stores no segment column and exposes no segment vocabulary; see
[AGENTS.md](./AGENTS.md#filtering-what-the-receiver-can-and-cannot-do)).

**One message.** Opening a control id gives you:

- a **JSON** tab — the message as the receiver stored it, pretty-printed, with the lines a
  validation error points at highlighted;
- an **ER7** tab — the raw wire text, with the offending field highlighted in place;
- a **Findings** list — one entry per validation error, naming the HL7 field (`OBX-3`), its data
  type and the schema's own description of it, the reason, the raw JSON path, and the schema id the
  field number was derived from (`schema:type:hl7v2.v23.OBX · property #3 → field OBX-3`). Clicking
  a finding highlights it in both tabs and scrolls the tab you are looking at to the highlight —
  messages run to hundreds of lines, and each tab scrolls inside its own box, so the findings list
  stays where it is. Switch tabs with a finding selected and the other tab lands on it too.

Field numbers are not guessed: a segment's type schema lists its properties in HL7 field order, so a
property's position in the live schema *is* its field ordinal. When the parsed JSON and the wire
text can't be aligned segment-for-segment, the ER7 highlights are dropped rather than approximated,
and the page says so — a mark on the wrong field is worse than no mark. Details:
[docs/validation.md](./docs/validation.md).

**Batch validation.** "Validate results" runs the current search — up to 50, 200 or 1000 of the most
recent matching messages — and summarizes it. The rollup groups by **defect**, not by message: array
positions are collapsed, so one defect repeated across 60 OBX repeats in 44 messages is a single
row with its message and occurrence counts. A real run against the UAT feed:

```
Checked 200 · Valid 38 · Invalid 88 · JSON≠ER7 0 · Not parsed 74
Sampled the 200 most recent of 24,519 matching messages.
41 distinct defects, most widespread first:

  IN1-3   schema:type:hl7v2.v24.IN1   44 messages   97 occurrences
  OBX-11  …
  ORC-7   …
  SCH-16  …
```

## Channels

Pick **Channel A** and **Channel B** (two receiving ports), a date window, a match mode and a
per-channel fetch cap, and press Compare. The result:

- **Distinct on A / on B** — after collapsing messages that are duplicates of each other.
- **On both**, with each shared message's control id on either side and any field-level conflicts.
- **Only on A / Only on B**.
- **Overlap** — shared ÷ union (Jaccard). A small feed entirely swallowed by a busy channel scores
  low here even though every one of its messages is shared, so read it alongside the raw counts.

Matching cannot use MSH-10: an interface engine re-stamps the message control id on every outbound
channel, so on an omnibus receiver it is unique on every single row and nothing would ever look
coupled. Instead the app fingerprints message *content*, and offers two modes:

- **Business key** (the default) — two messages are the same event when their key fields agree
  (by default the patient account number, event type code and recorded date/time). Everything else
  is reported as a field conflict on the shared message. The key is an editable list of path
  fragments.
- **Full content** — two messages are the same when all of their content agrees, ignoring the MSH
  transport fields (control id, message timestamp, the sending/receiving application and facility
  pairs) that legitimately change per hop.

Strict content matching is the more literal question, but on real traffic it answers "no" almost
always: two ADT feeds off one interface engine matched on 37 of ~1200 messages that way, while the
same pair keyed on business identity shared 1160 of 1171 and conflicted on none. Reading the first
number as "these channels are unrelated" would be wrong, which is why the business key is the
default. Details: [docs/channel-analysis.md](./docs/channel-analysis.md).

## Notes on the live feed

Things about real receiver data that show up in the UI and are not bugs in this app:

- **"Not parsed" messages.** The receiver materializes a message only when it has a schema for that
  structure. When it doesn't — RDE_O03 on HL7 2.2 in the UAT feed, roughly 37% of recent messages —
  it stores the wire text plus twelve index attributes and no parsed body. Those messages are
  labelled **Not parsed** and are never counted valid or invalid; the ER7 tab still shows exactly
  what arrived.
- **Validation of an unparsed message is meaningless**, so it is suppressed. The module falls back
  to `schema:shared:hl7v2.message-envelope` and reports eight "undeclared property" errors about the
  receipt envelope's own fields — nothing to do with HL7 conformance. The app reports the condition
  instead of the eight errors.
- **Filters are correct, not fast.** The receiver keeps its messages in SQLite and indexes only the
  control id and its own drain/lease columns, so the four facet filters are table scans. Answers are
  right; a big buffer makes them slow.
- **Version differences are real.** MSH-12 is a bare string on HL7 2.3 and a composite from 2.4 on;
  MSH-3/MSH-4 are sometimes bare strings and sometimes composites. The app normalizes both.
- **Every batch and comparison run is a sample.** Runs are capped (validation costs one round trip
  per message; a comparison fetches whole populations into the browser). Whenever a cap bites, the
  UI says what it sampled, and a channel comparison marks itself **provisional** — "present only on
  A" is not a sound conclusion when B was cut short.
- **Unkeyed messages are set aside**, not counted. In business-key mode a message carrying none of
  the key fields cannot be spoken about by that key at all — including every "not parsed" message,
  whose index attributes aren't HL7 fields. They get their own count and explanation.

## Documentation

- [AGENTS.md](./AGENTS.md) — the agent/maintainer guide: layout, invariants, local dev, deploy.
- [docs/architecture.md](./docs/architecture.md) — how data flows from the target picker to a page.
- [docs/validation.md](./docs/validation.md) — how a finding is produced and located.
- [docs/channel-analysis.md](./docs/channel-analysis.md) — fingerprinting and the two match modes.
- [docs/using-ngx-library.md](./docs/using-ngx-library.md) — the ZeroBias component library.
- [CHANGELOG.md](./CHANGELOG.md).
