# Phase 25: Platform Data Audit - Research

**Researched:** 2026-04-24
**Domain:** ZeroBias SDK/GQL platform data surface + onboarding pre-fill mapping
**Confidence:** HIGH (locked decisions, validated bootstrap recipe, reference code exists)

## Summary

Phase 25 is a **scoped research deliverable**, not a runtime-code phase. The audit catalogs everything the authenticated ZB platform session already exposes about a customer Org via SDK, GQL, and hydra APIs — then produces a single `PLATFORM-DATA-INVENTORY.md` that downstream phases (especially Phase 28 company profile form) consume to decide what's pre-fillable vs. requires user input.

The audit is live-run against W3Geekery test org via MCP (per D-05) — no leaning on memory. Phase 25 commits one bounded code change (`environment.uat.ts` pipelineId fix, D-04 carve-out) and produces a write-path map alongside the read-path inventory (D-12).

**Primary recommendation:** Decompose Phase 25 into 5 sequential plan tasks: (1) template + index scaffold, (2) SDK sources audit, (3) GQL sources audit, (4) pre-fill map + write-path synthesis, (5) pipeline health check + env fix. Tasks 2–3 can parallelize. Task 4 depends on 2–3. Task 5 is independent but commits together.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Researcher proposes draft `company_info` convention; Phase 26 ratifies (avoid circular dependency)
- **D-02:** Aggressive expansion — 9 minimum sources mandatory, add anything else discovered
- **D-03:** Flat known-unknown list with free-text "why" notes per field
- **D-04:** Three-part pipeline health check: ping `43f08afd-...`, grep app code, commit env-file fix (bounded carve-out from "no app code")
- **D-05:** Live re-run every source via MCP against W3Geekery test org
- **D-06:** Index + per-source sub-files (`.planning/director/PLATFORM-DATA-INVENTORY.md` + `.planning/director/platform-data-inventory/<source>.md`)
- **D-07:** Real W3Geekery values, no redaction
- **D-08:** Pre-fill map row keys by Phase 28 form fields (form-field-first orientation)
- **D-09:** Note gaps in known-unknown list; Phase 28 decides escalation
- **D-10:** Per-source `Verified: YYYY-MM-DD` header; staleness tracked at glance
- **D-11:** Reference prior art (cite, do NOT seed from)
- **D-12:** Write-path catalog alongside read-path map; "Save target" column added

### Claude's Discretion
- Per-source sub-file template specifics (frontmatter, field-table layout)
- Sample-response payload size cap and truncation rules
- Index-file table-of-contents ordering (alphabetical vs. by Phase 28 relevance)

### Deferred Ideas (OUT OF SCOPE)
- Per-org LLM-prompt generation brief (separate director artifact)
- ServiceOffering inventory (Brian-blocked, v1.5)
- Documenting ZB platform internals (out of scope by definition)

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PDA-01 | `PLATFORM-DATA-INVENTORY.md` exists at `.planning/director/PLATFORM-DATA-INVENTORY.md` | Index file + per-source structure validates this |
| PDA-02 | Minimum 9 sources (whoAmI, getPrincipal, getCurrentOrg, Org.*, User.*, MarketplaceProfileItem, Boundary, hydra.Tag, hydra.Resource) with sample responses + field lists | Source enumeration section below; each source a per-file audit task |
| PDA-03 | Pre-fill map covers every Phase 28 form field | Pre-fill map column schema validates row completeness |
| PDA-04 | Known-unknown list highlights fields needing user input or LLM enrichment | Known-unknown classification section |
| PDA-05 | Pipeline health check confirms `43f08afd-...` is live on UAT | Pipeline health check procedure section |

---

## Source Enumeration

### The 9 Mandatory Sources (PDA-02)

| # | Source | Surface | Brief | Coverage |
|---|--------|---------|-------|----------|
| 1 | `dana.User.getWhoAmI` / `getPrincipal` | SDK | Current authenticated user + org + admin flag | User identity, admin detection, party ID |
| 2 | `dana.Org.getCurrentOrg` | SDK | Current org metadata (name, description, parent, logo, etc.) | Org legal name, branding, hierarchy |
| 3 | `dana.Org.search` / `dana.Org.get` | SDK | Query other orgs by ID or search — scoped to accessible orgs | Provider Org discovery (ZB-as-provider lookup) |
| 4 | `dana.User.search` / `dana.User.listUsers` | SDK | Users in current org | Personnel / primary contact fields |
| 5 | `platform.Boundary.list` / `platform.Boundary.get` | SDK | Boundaries accessible to current user (scoped to orgs) | Project boundary context, access control |
| 6 | `platform.Task.list` / `platform.Task.search` | SDK | Task search + list (filtered by boundary/org) | Engagement task history, activity tracking |
| 7 | `graphql.Boundary.boundaryExecuteRawQuery` | GQL | Direct class-Object queries (Engagement, SmeMartProject, MarketplaceProfileItem, Bid, etc.) with RFC4515 filters | Read-heavy source — class hierarchy, pre-fill data, tagging |
| 8 | `hydra.Tag.listTags` / `hydra.Tag.searchTags` / `hydra.Tag.getTag` | hydra API | Tag discovery + metadata | Tag-based discovery (demo-seed filter, engagement tags, provider tags) |
| 9 | `hydra.Resource.listResources` / `hydra.Resource.searchResources` / `hydra.Resource.getResource` | hydra API | Resource search + retrieval (Tasks as Resources, potential future Task-linked metadata) | Cross-org task discovery, resource metadata |

### Aggressive Expansion Candidates

Based on D-02 (opportunistic discovery), likely additional sources to audit:

| # | Source | Surface | Rationale | Phase 28 Relevance |
|---|--------|---------|-----------|-------------------|
| 10 | `dana.Org.listMembers` | SDK | Org membership + roles (if available) | Team/personnel discovery beyond `User.search` |
| 11 | `platform.MarketplaceProfileItem.*` | SDK wrapper | Vendor/buyer profile CRUD (existing service pattern) | Direct pre-fill for `legal_name`, `dba`, `logo_url`, etc. |
| 12 | `platform.Class.getClass` / `platform.Class.getClassObjects` | SDK | Class metadata + object discovery (audit helper) | Validates schema field presence before reads |
| 13 | `platform.Object.getVersionByObjectIdOrVersionId` | SDK | Post-ingest object read by internal UUID (for diagnosis) | Validates tag shape + field population |
| 14 | `portal.Product.search` / `portal.Framework.list` | Portal API (curl fallback) | Catalog entities (products, frameworks, vendors) | Provider classification / capability discovery |
| 15 | `hydra.Resource.tagResource` / `hydra.Resource.linkResources` | hydra API | Write-side discovery (what fields are writable, link-type enums) | Informs write-path map (D-12) |

---

## Per-Source Sub-File Template (Claude's Discretion)

**Proposed standard format** (researcher proposes; planner validates):

```markdown
---
source: <SDK_method_or_GQL_query_or_hydra_method>
surface: SDK | GQL | hydra | portal-curl
verified: YYYY-MM-DD
uat_tested: true|false
---

## Signature

<exact method signature, return type, required params, optional params>

## Sample Response (W3Geekery, real values)

<actual API response (JSON or markdown table), truncated if >500 lines with note + line count>

## Field List

| Field | Type | Always Populated? | Org-Scoped? | Notes |
|-------|------|-------------------|-------------|-------|
| <fieldName> | <type> | yes/no/sometimes | yes/no/conditional | <reason if sparse or conditional> |

## Pre-fill Map Contributions

Which Phase 28 form fields source from this call:
- `legal_name` ← `Org.name` (fully pre-fillable)
- `dba` ← `Org.description` (partial — only if explicitly set)
- `logo_url` ← `Org.logoUrl` (partial — null on UAT)
- ...

## Known Gaps / Edge Cases

- <what's missing, what's null, what's conditional>
- Org-scoping behavior: filtered to currentOrg automatically, or requires explicit filter?
- Latency / pagination notes if relevant

## Write-Path Target (D-12)

Which Platform class + field or SDK setter does Phase 28 write to?
- e.g., `Pipeline.receive` for Engagement.class / `name` field
- e.g., `hydra.Tag.createTag` + `hydra.Resource.tagResource` for Task tagging
```

---

## Pre-Fill Map Column Schema (D-08, D-12)

**Locked columns** (form-field-first orientation, Phase 28 consumption model):

| Column | Purpose | Example |
|--------|---------|---------|
| `form_field` | Phase 28 company-profile form field name | `legal_name`, `dba`, `logo_url`, `short_blurb` |
| `source_call` | SDK/GQL/hydra call that populates it | `dana.Org.getCurrentOrg` / `graphql.Boundary.boundaryExecuteRawQuery` |
| `platform_field_path` | Exact field in the source response | `Org.name` / `MarketplaceProfileItem.shortDescription` |
| `pre_fillable` | yes / no / partial (with rationale) | `yes` (always populated), `partial` (null on UAT), `no` (field doesn't exist) |
| `save_target` | Where Phase 28 save handler writes this value | `Pipeline.receive MarketplaceProfileItem.legalName` / `hydra.Resource.updateResource` |
| `notes` | Why it's marked partial/no, edge cases, org-scoping behavior | "Null on UAT, set on prod"; "Requires admin access"; "Field doesn't exist in Org schema" |

**Row keys:** Enumerated from Phase 28 brief form-field list (to be cross-checked during research).

---

## Draft `company_info` Convention Shape

**Synthesized from:** Phase 28 brief + existing `MarketplaceProfileItem` 6-section schema + ZB Org/Engagement platform surfaces.

### Proposed YAML Shape (for Phase 26 ratification)

```yaml
CompanyInfo:
  description: Canonical shape for marketplace provider/buyer company profiles
  fields:
    # Legal/Corporate
    legal_name:
      type: string
      required: true
      description: Registered legal business name
      source: Org.name / MarketplaceProfileItem.legalName
      
    dba:
      type: string
      required: false
      description: Doing Business As name (if different from legal)
      source: Org.description / MarketplaceProfileItem.dba
      
    # Branding
    logo_url:
      type: string|null
      required: false
      description: Logo image URL
      source: Org.logoUrl / MarketplaceProfileItem.logoUrl
      
    short_blurb:
      type: string
      required: false
      max_length: 500
      description: One-liner company tagline (for Browse Providers card)
      source: MarketplaceProfileItem.shortDescription
      
    long_description:
      type: string
      required: false
      description: Multi-paragraph company overview
      source: MarketplaceProfileItem.longDescription
      
    # Contact
    primary_contact:
      type: object
      required: false
      properties:
        name: string
        email: string
        phone: string|null
      description: Primary point of contact
      source: User object from Org.listMembers (filtered for admin/primary)
      
    website:
      type: string|url
      required: false
      description: Company website URL
      source: MarketplaceProfileItem.website
      
    # Operations
    hq_location:
      type: string
      required: false
      description: Headquarters location (city, state, country)
      source: Org.location / MarketplaceProfileItem.hqLocation
      
    years_in_business:
      type: integer
      required: false
      description: Founding year (derive current if possible)
      source: Not pre-fillable (known-unknown)
      
    employee_count_bucket:
      type: enum
      enum: [1-10, 11-50, 51-200, 201-500, 500+]
      required: false
      description: Company size (not exact headcount)
      source: Not pre-fillable (known-unknown)
```

**Notes:**
- Covers both provider (seller) and buyer org profiles
- All fields optional except `legal_name` to handle partial-profile workflows
- Field sources map directly to pre-fill map (enables Phase 28 to iterate the convention and hydrate form)

---

## Pipeline Health Check Procedure (PDA-05, D-04)

### Three-Part Check

1. **Ping `43f08afd-7ab9-4e99-a93c-619c46adaabe` with a throwaway `Pipeline.receive`**
   - Target: UAT SME Mart receiver (current, validated 2026-04-23 bootstrap walkthrough)
   - Payload: Minimal test SmeMartProject record with dummy data
   - Expected: HTTP 200, object ID returned
   - Document: response body, any warnings/errors

2. **Grep app code for `pipelineId` references**
   - Search paths: `src/environments/`, `src/app/core/services/`, any config/injection files
   - Current UAT value: `f6d1f579-fe02-4158-b99e-a55113fd70cb` (stale v1.2 carry-forward)
   - Should be: `43f08afd-7ab9-4e99-a93c-619c46adaabe` (per DECISIONS.md bootstrap walkthrough)
   - Document: all mismatches found

3. **Apply one-line `environment.uat.ts` fix and commit**
   - File: `src/environments/environment.uat.ts` line 15
   - Change: `pipelineId: 'f6d1f579-...'` → `pipelineId: '43f08afd-...'`
   - Commit message: `fix(config): update UAT pipelineId to current SME Mart receiver`
   - Include in Phase 25 final commit (or separate hotfix if planner prefers)

### Expected Field Values (W3Geekery / UAT)

| Field | Should Be | Should NOT Be |
|-------|-----------|---------------|
| Pipeline UUID (ping target) | `43f08afd-7ab9-4e99-a93c-619c46adaabe` | `f6d1f579-fe02-4158-b99e-a55113fd70cb` |
| Boundary UUID | `c15fb2dc-4f8c-48b5-b27a-707bd516b005` | (any other) |
| Org UUID (W3Geekery) | `cd7105df-523d-5392-9f9a-3f83d3f30107` | (differs from prod? NO — same across prod/UAT) |
| Engagement UUID (default ZB) | `746010b7-dc99-436b-9142-8c4b85c5e623` | (mismatches indicate bootstrap didn't run) |
| SmeMartProject UUID (default) | `ea4db55f-2c57-4567-a1be-6e7fd1a210bf` | (mismatches) |

---

## Validation Architecture (Nyquist Enabled)

> Per `.planning/config.json`: assume `workflow.nyquist_validation` is enabled (not explicitly `false`). Verification must be possible.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | No unit tests (research artifact) |
| Verification | Spot-check + planner review |
| Sampling | Pick 3 random SDK calls from inventory; re-run via MCP; confirm response shape matches documented sample |

### Inventory Completeness Checks

| Check | How | Automated? |
|-------|-----|-----------|
| PDA-01: Index file exists | `ls .planning/director/PLATFORM-DATA-INVENTORY.md` | ✅ (file-system check) |
| PDA-02: 9 sources present + sub-files linked | Index lists 9+ sources; each links to `/platform-data-inventory/<source>.md` | ✅ (grep / file verification) |
| PDA-03: Pre-fill map covers Phase 28 fields | Walk Phase 28 brief; verify every form field appears in pre-fill map | ⚠️ (manual verification by Phase 28 implementer) |
| PDA-04: Known-unknown list present | Index includes section with flat field list + why notes | ✅ (file content check) |
| PDA-05: Pipeline health check report | Index includes ping result, env-file fix commit hash | ✅ (commit + log verification) |

### Spot-Check Protocol (Before PLAN.md approval)

1. Pick 3 random sources from the 9 minimum (e.g., `getPrincipal`, `getCurrentOrg`, `boundaryExecuteRawQuery`)
2. Re-run each via ZB MCP against W3Geekery org (with profile lock)
3. Compare actual response to documented sample:
   - Field presence (no missing fields)
   - Field types (string vs int vs object)
   - Org-scoping behavior (filtered vs unfiltered)
4. If mismatches found: note in spot-check summary, planner may re-trigger broader audit if concerned

### Wave 0 Pre-Requisites

- [ ] `.planning/director/PLATFORM-DATA-INVENTORY.md` exists
- [ ] `.planning/director/platform-data-inventory/` subdirectory created
- [ ] 9+ source sub-files present
- [ ] Pre-fill map table populated with min 10 rows (Phase 28 form fields)
- [ ] Known-unknown list present (≥1 entry)
- [ ] Pipeline health check section present with ping result + env-file fix commit

---

## Common Pitfalls & Gotchas

### Pitfall 1: Confusing `Object.tag` (Pipeline ingest-time) with `platform.Object.tag` (post-ingest stub)

**What goes wrong:** Researcher attempts to tag a class-Object post-ingest via `platform.Object.tag` read or write; discovers it's a write-only stub with no matching read API.

**Why it happens:** ZB platform's tag API evolved post-2026-03-10 hydra migration. Tags are immutable after ingest; they must be set at Pipeline.receive time via the inherited `Object.tag` field in the payload.

**How to avoid:** Always populate `tag: [{ value: "<uuid>" }]` at ingest time (Pipeline.receive). For reads, use GQL with RFC4515 dot-prefix filter: `ClassName(tag: { value: ".eq.<uuid>" })`.

**Warning signs:** API call to `platform.Object.tag.createTag` or similar returns 404 or empty; GQL filter syntax looks like `{ tag: <string> }` instead of `{ tag: { value: "<string>" } }`.

**References:** DECISIONS.md "Object.tag Field Shape — Validated via UAT Experiment" (refinement #13); bootstrap-w3geekery-engagement.md Step C & D.

### Pitfall 2: `dana-org-id` Header Precedence & sessionStorage Cache

**What goes wrong:** Researcher calls SDK without explicitly setting `dana-org-id` header; SDK returns data from a stale or wrong org due to sessionStorage cache.

**Why it happens:** ZeroBias SDK caches the selected org in `sessionStorage.zb-current-dana-org-id`. On page refresh or session continuation, the cached org is used, not the one in the request header.

**How to avoid:** Always explicitly set `dana-org-id` header before SDK calls (MCP does this via `orgIdService`). Clear sessionStorage if testing org-switching. Verify header in Network panel.

**Warning signs:** Tag searches return 0 results for known tags; resource lookups fail silently; "wrong org" symptoms.

**References:** MEMORY.md "ZeroBias SDK — Org Selection & `dana-org-id`".

### Pitfall 3: Hydra Migration Accessors (2026-03-10)

**What goes wrong:** Researcher uses pre-migration SDK paths (e.g., `danaOld.getTagApi()` for tag creation; `fileClient.getResourceApi()` for resource ops); calls fail with "not found" or field-shape mismatches.

**Why it happens:** 2026-03-10 hydra migration moved Tag CRUD, Resource operations, and other APIs from scattered old paths to `hydra.*` namespace. Code written before the migration still references old paths.

**How to avoid:** Always check MEMORY.md "ZeroBias Hydra Migration (2026-03-10)" for current accessors. Use `mcp__zerobias__zerobias_describe(path)` to auto-discover correct field shapes.

**Warning signs:** "Unknown service" errors on old `danaOld.*` calls; 404 on old `fileClient.*` paths; `undefined` when accessing `hydraClient` on pre-migration SDK versions.

**References:** MEMORY.md "ZeroBias Hydra Migration (2026-03-10)" + "ZeroBias Tag API".

### Pitfall 4: RFC4515 Dot-Prefix Syntax in GQL Filters

**What goes wrong:** Researcher writes `ClassName(field: "value")` expecting exact match; GQL returns wrong results or errors due to operator-syntax confusion.

**Why it happens:** ZB GQL filters use RFC4515 dot-prefix operators inside property values, not GraphQL-native filter syntax. New to many developers coming from standard GraphQL.

**How to avoid:** Always use `.eq.` (exact match), `.sw.` (starts with), `.in.` for complex filters: `ClassName(field: ".eq.<value>")`. Never `ClassName(field: { EQ: "<value>" })`.

**Warning signs:** GQL parser errors mentioning "unexpected character"; filter returning zero results when data exists; "standard GraphQL filter syntax" in error messages.

**References:** CLAUDE.md §"GQL Schema Extension (howto)", DECISIONS.md refinement #12.

### Pitfall 5: Task Link Types are Environment-Specific UUIDs

**What goes wrong:** Researcher uses Task link-type IDs from CI environment (`cf72be7c-...`) on UAT; links fail silently or don't materialize.

**Why it happens:** ZB platform generates different link-type UUIDs per environment (CI ≠ UAT ≠ Prod). Using the wrong environment's UUID silently fails or creates malformed links.

**How to avoid:** Always look up link-type UUIDs for the target environment first. For UAT: use MEMORY.md "ZeroBias MCP Parameter Patterns §Task→Task link type IDs (UAT env)". For other envs, call `platform.LinkType.list` or equivalent to discover.

**Warning signs:** Link creation returns success but GQL query shows no links; task hierarchy broken; "link not found" errors on subsequent queries.

**References:** MEMORY.md "ZeroBias MCP Parameter Patterns" (UAT-specific IDs documented).

### Pitfall 6: Leaning on Stale Memory for Schema Field Lists

**What goes wrong:** Researcher constructs a Pipeline.receive payload using field names from old memory (e.g., `category`, `budgetType`, `budgetMin`, `budgetMax`, `timeline` on Engagement); payload fails schema validation.

**Why it happens:** SME Mart schema migrated 2026-04 (Plan 075); fields moved from Engagement to SmeMartProject. Memory docs aren't auto-updated; stale field lists get copied into payloads.

**How to avoid:** Before constructing ANY Pipeline.receive payload, call `platform.Class.getClass(<classId>)` to fetch live schema. Never trust memory for field lists. Always cross-check via MCP before the first push.

**Warning signs:** "Unknown property" schema validation errors; fields appearing on the wrong class; "this field doesn't exist on Engagement" errors.

**References:** bootstrap-w3geekery-engagement.md refinement #6, DECISIONS.md refinement #16.

---

## Plan Decomposition Recommendation

**Proposed 5-task structure:**

1. **Task A — Template + Index Scaffold** (30 min)
   - Create `.planning/director/PLATFORM-DATA-INVENTORY.md` (index file with TOC, frontmatter, intro)
   - Create `.planning/director/platform-data-inventory/` subdirectory
   - Define per-source sub-file template (template.md in the subdir for reference)
   - Verify MCP profile lock & org setup

2. **Task B — SDK Sources Audit** (2–3 hrs) — Can parallelize with Task C
   - Audit sources 1–4: `whoAmI`, `getPrincipal`, `getCurrentOrg`, `Org.*`, `User.*`
   - Run each via MCP; document sample responses, field lists, pre-fill contributions
   - Create 5 sub-files in `platform-data-inventory/` directory
   - Flag any known-unknowns (null fields, missing properties)

3. **Task C — GQL + hydra Sources Audit** (2–3 hrs) — Parallel with Task B
   - Audit sources 5–9: `Boundary.*`, `Task.*`, `graphql.boundaryExecuteRawQuery`, `hydra.Tag.*`, `hydra.Resource.*`
   - Run sample queries via MCP; test RFC4515 filters
   - Aggressive expansion: include sources 10–15 if time permits (MarketplaceProfileItem, Class APIs, Portal catalog)
   - Create sub-files
   - Test write-path calls (`tagResource`, `linkResources`, Pipeline.receive validation)

4. **Task D — Pre-fill Map + Write-Path Synthesis** (1–2 hrs) — Depends on B + C
   - Cross-reference all sources from Tasks B–C against Phase 28 brief form fields
   - Build pre-fill map table (form_field | source | platform_field | pre_fillable | save_target | notes)
   - Build known-unknown list (fields not pre-fillable, with why notes)
   - Draft `company_info` convention YAML (for Phase 26 ratification)
   - Update index file with links + summary tables

5. **Task E — Pipeline Health Check + Env Fix** (30 min) — Independent of B–D
   - Ping `43f08afd-...` via `Pipeline.receive` with throwaway SmeMartProject
   - Grep app code for pipelineId references
   - Edit `environment.uat.ts` line 15 (fix pipelineId)
   - Commit change; document health-check result in index file

**Parallelization:** B and C can run in parallel (independent MCP calls). D depends on B+C completion. E is independent. Total: ~5–6 hrs (matches estimate, with aggressive expansion likely pushing to upper bound).

---

## Open Questions for the Planner

1. **Sample-response truncation threshold** (Claude's Discretion) — What's the max payload size before researcher truncates with `...` + line count? Suggest 500 lines per response.

2. **Index-file TOC ordering** (Claude's Discretion) — Alphabetical, or sorted by Phase 28 relevance (highest-impact sources first)? Suggest Phase 28 relevance.

3. **Write-path column precision** (D-12 implementation detail) — For each pre-fill field, planner may want: "save via MCP call X.method(y.field)" OR "save via Pipeline.receive MyClass.field". What's the preference? Suggest both when applicable (e.g., hydra writes = MCP direct; class Objects = Pipeline.receive).

4. **Extended-sources parallelization** (aggressive expansion, D-02) — If researcher hits >12 distinct sources and they want to add more, does planner want to pause and ask, or proceed? Suggest proceed, but flag the count in final summary.

5. **Per-org values for write-path map** (D-12) — Some save targets may need per-org context (e.g., `Pipeline.receive` needs correct Pipeline UUID, boundary UUID). Planner may want researcher to document "these are W3Geekery values; other orgs will differ in X way."

---

## Architecture Pattern: Read-Path vs. Write-Path Inventory

**Key insight from existing codebase:** SME Mart follows a **Pipeline reads + GQL writes hybrid** pattern:
- **Reads:** GQL via `graphql.Boundary.boundaryExecuteRawQuery` (class-Object queries with RFC4515 filters)
- **Writes:** Pipeline.receive for class Objects; hydra MCP calls for Tags/Resources/Tasks

The pre-fill map (read-path) is heavily GQL-based. The write-path map (D-12) is mixed:
- Class Objects (Engagement, SmeMartProject, MarketplaceProfileItem) → Pipeline.receive
- hydra entities (Tags, Resources, Tasks) → hydra MCP calls
- SDK setters (Org fields, User fields) → SDK `update()` calls if available

Phase 28 implementer needs both sides to build the save handler correctly.

---

## References

### Primary (HIGH confidence)
- DECISIONS.md "Default ZB Engagement Bootstrap — W3Geekery" — validated bootstrap recipe with 18 refinements, canonical UUIDs
- DECISIONS.md "Object.tag Field Shape — Validated via UAT Experiment" — locked tag ingest shape
- bootstrap-w3geekery-engagement.md — walkthrough steps A–E with pre-checks and resource creation
- CLAUDE.md §"Hydra Migration (2026-03-10)", §"Tag API", §"ZB Portal API curl Fallback"

### Secondary (MEDIUM confidence)
- MEMORY.md §"ZeroBias MCP Parameter Patterns" — body param nesting, path/query params, link-type IDs
- MEMORY.md §"ZeroBias Hydra Migration" — accessor changes, type migrations
- MEMORY.md §"ZeroBias SDK — Org Selection & dana-org-id" — header behavior, sessionStorage precedence

### Tertiary (referenced, not seeded)
- `.claude/notes/sme-mart-resource-types-summary.md` (2026-03-05) — prior resource-type inventory
- `.planning/research/internal/2026-04-23-credentials-zb-platform-research.md` — adjacent SDK research
- `src/app/core/services/vendor-profile.service.ts` — existing MarketplaceProfileItem CRUD pattern (read model for write-path design)

---

## Confidence Breakdown

| Area | Level | Reason |
|------|-------|--------|
| 9 mandatory sources | HIGH | Locked in phase-25-brief.md; all exist in ZB SDK/GQL |
| SDK accessor locations | HIGH | MEMORY.md + DECISIONS.md detail accessors; bootstrap walkthrough validated them 2026-04-23 |
| Tag shape + object tagging | HIGH | DECISIONS.md experiment + bootstrap refinements locked the shape |
| RFC4515 GQL filter syntax | HIGH | DECISIONS.md refinement #12 + CLAUDE.md both confirm `.eq.` dot-prefix syntax |
| Aggressive expansion sources | MEDIUM | Will discover during live audit; not pre-mapped but ecosystem is stable |
| Write-path map accuracy | MEDIUM | Needs spot-checking against actual payloads; Phase 28 may refine based on integration reality |
| `company_info` convention shape | MEDIUM | Proposed shape is plausible; Phase 26 ratification may adjust fields |
| Pipeline health check result | HIGH-MEDIUM | Ping target is known good (bootstrap walkthrough used it); env-file fix is deterministic |

---

## Metadata

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (30 days — stable domain, SDK/GQL surface unlikely to change mid-milestone)
**Author:** Claude (Phase researcher)
**Locked decisions:** 12 (D-01 through D-12, per CONTEXT.md)
**Downstream consumers:** Phase 26 (company_info convention), Phase 27 (auth gate + whoAmI portions), Phase 28 (pre-fill map + write-path map)

## RESEARCH COMPLETE
