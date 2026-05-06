# Phase 25: Platform Data Audit - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure research phase. Inventory everything the authenticated ZB platform session already exposes about a customer Org — via ZB SDK, GQL, hydra Resources, and any other reachable data source — and produce a single source-of-truth artifact (`PLATFORM-DATA-INVENTORY.md` + per-source sub-files) that downstream phases consume.

**Primary downstream consumer:** Phase 28 (Company Profile Review/Confirm Form) — needs the pre-fill map to know which form fields auto-populate vs. require user input vs. need LLM enrichment.

**Secondary consumer:** Phase 26 (ZB-as-Provider Seed) — proposed `company_info` convention informs the seeded provider record shape.

No app code beyond a one-line `environment.uat.ts` pipelineId fix (carve-out, see D-12 below).

</domain>

<decisions>
## Implementation Decisions

### Pre-fill map field set
- **D-01:** Researcher proposes a draft `company_info` convention as part of Phase 25 output. Phase 26 then ratifies/edits. Avoids the circular dependency (Phase 28 needs Phase 25 pre-fill map; Phase 26 codifies the convention; Phase 26 also needs Phase 25's audit). Researcher synthesizes from: Phase 28 brief enumeration, existing `MarketplaceProfileItem` 6-section schema, and whatever ZB platform actually exposes for Org-level metadata.

### Coverage strategy
- **D-02:** Aggressive expansion. The 9 minimum sources from PDA-02 are mandatory; researcher adds anything else the audit uncovers that may be relevant — catalog endpoints, file/document attachments, party/team listings, MarketplaceProfileItem variants, hub-module connections. Budget will likely overshoot 4–6 hr estimate; that's accepted.

### Known-unknown classification
- **D-03:** Flat list — fields not pre-fillable get one entry each with a free-text "why" note (e.g., "no field in SDK", "proxy exists but wrong scope — `whoAmI().email` is logged-in user, not company contact-of-record", "field exists in `Org.description`, always null on UAT"). No formal taxonomy. Phase 28 reads notes when deciding per-field UX.

### Pipeline health check (PDA-05)
- **D-04:** Three-part check:
  1. Throwaway `Pipeline.receive` ping on `43f08afd-7ab9-4e99-a93c-619c46adaabe` (UAT) confirms live; document response.
  2. grep app code for any `pipelineId` references; document mismatches against the live one.
  3. Apply the one-line fix to `environment.uat.ts` (current value `f6d1f579-...` → `43f08afd-...`). This is a deliberate carve-out from "no app code" — see D-12 for the bounded exception.

### Research methodology
- **D-05:** Live re-run every cataloged source via MCP against the W3Geekery test org. No leaning on memory. Spot-check threshold is replaced by full live audit. Aggressive expansion combined with full live re-runs will overshoot the 4–6 hr estimate.

### Inventory file structure
- **D-06:** Index + per-source sub-files. `.planning/director/PLATFORM-DATA-INVENTORY.md` is the index (links + executive summary + pre-fill map + known-unknown list + health check report). Each source gets its own file at `.planning/director/platform-data-inventory/<source>.md`. PDA-01 satisfied by the index file.

### Sample data + redaction policy
- **D-07:** Real values from the W3Geekery test org. No redaction. W3Geekery is Clark's own test org; no third-party PII. UUIDs and structural IDs already exist in `DECISIONS.md` and `STATE.md`, so no new exposure. Sample responses are copy-pasteable / debuggable.

### Pre-fill map row keys
- **D-08:** Phase 28 form fields lead. Rows keyed by `legal_name`, `dba`, `logo_url`, etc. Columns: source SDK call → platform field path → pre-fillable yes/no/partial → save target → notes. Buyer-form-first orientation matches how Phase 28 implementer will scan the map.

### Brian/Kevin escalation policy
- **D-09:** Researcher just notes gaps in the known-unknown list. No proactive ZB-task to Kevin or DECISIONS.md ask for Brian from Phase 25. Phase 28 (when it builds the form) decides per-field whether escalation is warranted. Keeps Phase 25 within research scope.

### Inventory staleness / versioning
- **D-10:** Per-source `Verified: YYYY-MM-DD` header at the top of each sub-file. Index file shows freshness at a glance via a small table. When platform changes break a source shape later, that source gets re-verified and the date bumps. Pairs naturally with index+sub-files structure (D-06).

### Prior-art handling
- **D-11:** Reference, don't seed. Researcher cites `sme-mart-resource-types-summary.md` (2026-03-05) and `.planning/research/internal/2026-04-23-credentials-zb-platform-research.md` in the inventory's References section, but does NOT pre-populate fields from them. Discovery is via live MCP only. Avoids carrying forward potentially-stale assumptions; preserves prior-art lineage.

### Write-path catalog
- **D-12:** Yes — Phase 25 produces write-path map alongside read-path map. Pre-fill map gains a "Save target" column: which `Pipeline.receive` class + field, or which SDK setter, the Phase 28 "Save" should write to. Phase 28 implementer doesn't re-research write paths. Adds 30–60 min to Phase 25; saves Phase 28 hours.

### Carve-outs from "no app code"
- The phase brief says Phase 25 produces no runtime code. Two bounded exceptions are explicit:
  - **One-line `environment.uat.ts` pipelineId fix** (per D-04) — committed as part of Phase 25.
  - **Cleanup of `TAG-SHAPE-TEST-C` residue** stays in Phase 26 (per Phase 26 brief deliverable 4); Phase 25 does not touch it.

### Claude's Discretion
- Per-source sub-file template (frontmatter format, sample response formatting, field table layout) — researcher proposes; Phase 25 plan-checker validates.
- Sample-response payload size cap (when responses are large, researcher may truncate with `…` + count, documenting the truncation).
- Whether to capture rate-limit / latency observations alongside responses.
- Index-file table-of-contents ordering (alphabetical vs. by phase-28 relevance).

### Folded Todos
None — no pending todos matched Phase 25 scope (all v1.4 todos are forward-looking; Phase 25 is a self-contained research deliverable).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 25 charter
- `.planning/director/phase-25-brief.md` — full requirements PDA-01..05, the 9 minimum source list, deliverables, verification, out-of-scope
- `.planning/REQUIREMENTS.md` §"Platform Data Audit (Phase 25)" — formalized PDA-01..05 acceptance criteria

### Director decisions in force
- `.planning/director/DECISIONS.md` "Object.tag Field Shape — Validated via UAT Experiment" — locked tag shape `[{ value: "<uuid>" }]`
- `.planning/director/DECISIONS.md` "Default ZB Engagement Bootstrap — W3Geekery (proof-of-concept run, UAT)" — canonical W3Geekery + ZB UAT UUIDs (Engagement, SmeMartProject, Tag, Boundary, Pipeline)
- `.planning/director/DECISIONS.md` "ServiceOfferings Defer With Brian" — confirms ServiceOfferings out of v1.4 scope (Phase 25 doesn't audit them)
- `.planning/director/DECISIONS.md` "Default ZB Engagement is Auto, Invariant" — Phase 28 form is decoupled from engagement creation
- `.planning/director/DECISIONS.md` "v1.4 Phase 29 Deferred to v1.5; Lazy-on-Load Guard Added to Phase 27"

### Downstream consumers
- `.planning/director/phase-26-brief.md` — `company_info` convention, retroactive tag push, Browse Providers integration (consumes Phase 25 draft convention)
- `.planning/director/phase-28-brief.md` — Company Profile form, pre-fill behavior, save handler, complete-marker, skip-for-now (primary consumer of pre-fill map + known-unknowns + write-path map)
- `.planning/director/phase-27-brief.md` — Auth Gate + Routing + Lazy Default-Engagement Guard (consumes session/principal/whoAmI portions of inventory)

### Bootstrap recipe (the canonical UAT walkthrough)
- `.planning/director/bootstrap-w3geekery-engagement.md` — full Pipeline.receive payloads, Object.tag write shape, Engagement + SmeMartProject UUIDs

### Prior art (reference, do NOT seed from)
- `.planning/notes/sme-mart-resource-types-summary.md` (2026-03-05) — SME Mart resource type inventory shared with Kevin; partial prior catalog
- `.planning/research/internal/2026-04-23-credentials-zb-platform-research.md` — adjacent SDK research, may have reusable snippets
- `.planning/research/internal/2026-04-23-seller-credentials-catalog-research.md` — adjacent

### Memory / SDK patterns
- `~/.claude/projects/-Users-cstacer-Projects-w3geekery-zerobias-org-forks-app/memory/MEMORY.md` §"ZeroBias MCP Parameter Patterns" — `zerobias_describe(path)` first, body params nested, etc.
- MEMORY.md §"ZeroBias Hydra Migration (2026-03-10)" — hydra service is live, accessor changes, type migrations
- MEMORY.md §"ZeroBias Tag API" — direct vs. moderated tag creation, tag-name constraints
- MEMORY.md §"ZeroBias SDK — Org Selection & `dana-org-id`" — header source, sessionStorage key, init flow
- MEMORY.md §"ZeroBias MCP Parameter Patterns" §"Task→Task link type IDs (UAT env)" — UAT-specific link UUIDs

### CLAUDE.md project pointers
- `CLAUDE.md` §"UAT Environment" + §"Hub Connection Setup (Neon)" — UAT is active dev env
- `CLAUDE.md` §"GQL Schema Extension (howto / internals)" — RFC4515 filter syntax, tag scope rules
- `CLAUDE.md` §"ZB Portal API curl Fallback" — `.planning/docs/ZB_PORTAL_CURL_FALLBACK.md` for portal-only endpoints not indexed by ZB MCP

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets (read for context, do not modify in Phase 25)
- `src/app/core/services/vendor-profile.service.ts` — existing 6-section MarketplaceProfileItem CRUD; the closest analog to the Phase 28 form's save handler. Researcher reads to understand current write paths.
- `src/app/core/services/org-switcher.service.ts` — current org selection flow + dana-org-id header behavior. Useful for `getCurrentOrg` + `selectOrg` documentation.
- `src/app/core/services/pipeline-write.service.ts` — Pipeline.receive abstraction in app code; informs write-path catalog (D-12).
- `src/app/core/services/sme-mart-tag.service.ts` — current tag wrapper; cross-check against hydra.Tag.* inventory.
- `src/app/test-helpers/demo-data-seeder.ts` — known production bug noted in DECISIONS.md (uses `.toISOString()` for date-only fields). Inventory should re-confirm date-vs-datetime semantics on Engagement / SmeMartProject schemas.

### Established Patterns
- Pipeline writes + GQL reads — every entity follows this. Read-path inventory is GQL-heavy; write-path inventory is Pipeline-heavy except for hydra Resources.
- RFC4515 dot-prefix filters in GQL — `ClassName(field: ".eq.<value>") { ... }` (locked, see DECISIONS.md tag-shape note).
- Object.tag at ingest time — tags are immutable post-ingest; tag arrays must be set in Pipeline.receive payload.
- Hydra Resources vs class Objects — Tasks are hydra Resources; Engagement/SmeMartProject/Bid are Pipeline-ingested class Objects. Inventory must clearly mark which side each source covers.

### Integration Points (where downstream consumers wire in)
- Phase 28 form mount → reads pre-fill map row by row, calls each cataloged source SDK.
- Phase 28 form save → looks up "Save target" column, dispatches to Pipeline.receive or SDK setter.
- Phase 27 lazy guard → reads `getCurrentOrg` + checks for default Engagement via `graphql.Boundary.boundaryExecuteRawQuery` with engagementTag filter (already validated 2026-04-23).
- Phase 26 seeder → consumes draft `company_info` convention as the field set for the ZB-as-provider record.

### Constraints from existing patterns
- Object.tag shape is the only validated field shape that needs documenting verbatim — researcher should NOT re-validate it (see D-04 carve-out: only the env file changes, no other code).
- Pipeline `tagIds` parameter is confirmed unclear/non-useful for class-Object discovery (per DECISIONS.md refinement #15). Inventory should document the negative finding so Phase 28 doesn't try to use it.
- `platform.Object.tag` (post-ingest stub) — already documented as write-only stub. Inventory notes this and points readers to `Object.tag` at ingest time.

</code_context>

<specifics>
## Specific Ideas

- **W3Geekery is the canonical UAT test org for all live re-runs** — UUIDs already in DECISIONS.md (`cd7105df-...` org, `3da9385a-...` Clark user, `746010b7-...` default Engagement, `ea4db55f-...` SmeMartProject, `a81cd320-...` engagement Tag, `c15fb2dc-...` Boundary, `43f08afd-...` Pipeline).
- **Use `mcp__zerobias__zerobias_describe(path)` first for unfamiliar operations** (per memory). Body params nested, path/query at top level. Auto-discover field shapes via the validator rather than guessing.
- **`zb-mcp-profile-lock.sh check|acquire|release`** before any MCP work to avoid clobbering profile in parallel sessions.
- **Per-source sub-file convention** — proposed structure:
  ```
  ---
  source: dana.User.getWhoAmI
  surface: SDK
  verified: 2026-04-XX
  ---
  ## Signature
  ## Sample response (W3Geekery, real values)
  ## Field list (name, type, populated yes/no/sometimes, org-scoped yes/no, notes)
  ## Pre-fill map contributions (which Phase 28 fields use this source)
  ## Known gaps / edge cases
  ```
- **Pre-fill map columns (locked):** form_field | source_call | platform_field_path | pre_fillable | save_target | notes.
- **Inventory-level pipeline health check section** captures: receive-ping result, app-code pipelineId scan results, env-file fix commit hash.
- **Aggressive expansion budget signal:** if researcher hits >12 distinct sources catalogued, flag in plan-checker review for scope sanity. Soft signal, not a blocker.

</specifics>

<deferred>
## Deferred Ideas

- **Per-org LLM-prompt generation brief** (consumes the known-unknown list) — explicitly out of Phase 25 per brief; separate director brief, written after Phase 28 form design stabilizes.
- **Documenting ZB platform internals (how ZB computes things)** — out of scope; we document what SDK/GQL surfaces, not the platform's internal computations.
- **Filling in the unknowns** — Phase 28 onboarding form + the LLM brief handle that later.
- **MCP-server-level tooling improvements** (e.g., bulk shape capture script) — useful future work but separate from this audit.
- **ServiceOffering inventory** — deferred to v1.5 with the rest of ServiceOffering scope (Brian-blocked, see DECISIONS.md).
- **Reviewed Todos (not folded)** — none.

</deferred>

---

*Phase: 25-platform-data-audit*
*Context gathered: 2026-04-24*
