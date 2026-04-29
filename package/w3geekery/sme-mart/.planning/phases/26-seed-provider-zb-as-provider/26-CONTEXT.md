# Phase 26: Seed Provider (ZB-as-Provider) — Context

**Gathered:** 2026-04-27
**Status:** Ready for planning
**Source:** PRD Express Path (`.planning/director/phase-26-brief.md`)

<domain>
## Phase Boundary

Seed ZeroBias as a first-class marketplace **provider** identity in SME Mart data on UAT. Three deliverable streams:

1. **Ratify the `company_info` convention** — drop `-DRAFT` from `.planning/director/COMPANY-INFO-CONVENTION-DRAFT.md` so Phase 28 (form schema) and Phase 22 can consume it.
2. **Seed ZB-as-provider** — one `Pipeline.receive` batch on the `MarketplaceProfileItem` class (`7bcf86a5-91dc-520d-b9bf-e308b1078d46`) with N records (one per company_info section) for ZeroBias org (`57c741cf-a58e-5efc-bf2f-93c4f6cf76ec` UAT). Deterministic ids `mpi-57c741cf-...-<section>`. `Object.tag` populated per the platform-provider distinguisher decision (Deliverable #2 of brief).
3. **Browse Providers UI integration** — verify the existing `provider-list`/`provider-card` components render the seeded ZB record. UNTAGGED with `sme-mart.demo` so the Phase 24 demo gate doesn't hide it from non-admins. **No new components** unless distinguisher decision forces a code-path change.
4. **Cleanup pass** — same Pipeline.receive batch (or a follow-on) includes `markDeleted: ["mpi-test-a-cd7105df", "mpi-test-b-cd7105df"]`. The `TAG-SHAPE-TEST-C` SmeMartProject residue (`64047b6c-...`, class `c66114a2-48e2-5b93-b7d6-7ccd6ef45a03`) is a **separate class** so it goes on a different batch — defer to next real SmeMartProject ingest or schedule a one-off (per brief).

**Out of scope (per brief + DECISIONS.md):**
- ServiceOffering records / tier placeholders (deferred — SP-03 removed pending Brian's tier confirmation).
- Real ZeroBias logo + final blurb copy (placeholders ship; copy-layer Brian ask).
- Extending `company_info` to non-provider Orgs (Phase 28's problem).
- Paid-tier gating / billing (v1.5+).

**Repos touched:** `app/` only (data seeding script + unit tests + UI verification). **No schema PR.**

</domain>

<decisions>
## Implementation Decisions

All design decisions for v1.4 are LOCKED in `.planning/director/DECISIONS.md`. The following are extracted as the contract for Phase 26 plans.

### MPI Storage Shape (LOCKED — Phase 25)
- `MarketplaceProfileItem` is a generic `(section, data)` discriminator class. Every "field" is its own MPI record.
- Class id: `7bcf86a5-91dc-520d-b9bf-e308b1078d46`
- Required record fields: `id` (deterministic `mpi-<orgId>-<section>`, plain string — NOT strict UUID), `orgId`, `section`, `data` (plain string), `status` (`active` for seeded fields), optional `expiresAt`.
- Structured values use **flat sub-sections** (e.g., `primary_contact.email`, `hq_location.city`) — never JSON-encoded objects in `data`.
- Pipeline UUID (UAT): `43f08afd-7ab9-4e99-a93c-619c46adaabe`.

### Pipeline.receive Replace Semantics (LOCKED — Phase 25)
- Replace key is `id` only. Per-section saves are independent — pushing one MPI does NOT clobber siblings.
- Batch must have non-empty `data` array (cannot be delete-only) — cleanup `markDeleted` rides alongside seeded records.
- Validated 2026-04-27 via UAT experiment (DECISIONS.md "MarketplaceProfileItem Replace Semantics + Cleanup Residue").

### Object.tag Field Shape (LOCKED — DECISIONS.md "Object.tag Field Shape — Validated via UAT Experiment")
- Canonical shape on Pipeline.receive payload: `tag: [{ value: "<tag-uuid>" }]` (array of objects with `value` property — NOT `id`).
- Set at ingest time only — tags are immutable post-ingest (Kevin 2026-04-23).
- `Pipeline.receive(..., tagIds: [])` parameter does NOT tag ingested Objects — leave empty.

### Canonical company_info Sections (LOCKED — COMPANY-INFO-CONVENTION-DRAFT.md)
17-section catalog (must match form schema in Phase 28):
- `legal_name` (required), `dba`, `logo_url`, `short_blurb`, `long_description`, `website`
- `primary_contact.user_id`, `primary_contact.name`, `primary_contact.email`
- `hq_location.street`, `hq_location.city`, `hq_location.state`, `hq_location.country`, `hq_location.postal_code`
- `years_in_business`, `employee_count` (one of `1-10`, `11-50`, `51-200`, `201-500`, `500+`)
- `onboarding_complete` (system; ISO date — NOT seeded for ZB; Phase 28 sets it on save)

### W3Geekery Object.tag Remediation (RESOLVED — Phase 25 close 2026-04-27)
- SP-04's "retroactive tag push for walkthrough records" is **DONE**. W3Geekery Engagement (`746010b7-...`) and default SmeMartProject (`ea4db55f-...`) already re-ingested with `tag: [{ value: "a81cd320-..." }]`.
- SP-04 in Phase 26 reduces to "platform-provider distinguisher decided + applied to seeded ZB MPI records" only.

### Cleanup Residue Status (LOCKED)
- **In scope for Phase 26 (MPI class batch):** `mpi-test-a-cd7105df`, `mpi-test-b-cd7105df` — `markDeleted` in seed batch.
- **Out of scope for Phase 26 (different class):** `TAG-SHAPE-TEST-C` (`64047b6c-...`) on SmeMartProject class — backlog row CLEANUP-25, defer to next SmeMartProject ingest. Plan 26 must NOT try to delete this in the MPI batch.

### Platform-Provider Distinguisher (DECIDE IN PLAN 26-01)
Three options on the table — pick exactly ONE before seeding (brief Deliverable #2):

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **(a) Hydra tag** | Create new tag `sme-mart.provider.platform`, push as `Object.tag: [{ value: "<tag-uuid>" }]` on every ZB MPI record | Discoverable via uniform `MarketplaceProfileItem(tag: {value: ".eq.<id>"})` query; matches the pattern used for engagement/project tagging | Requires hydra Tag.create call (one-time) + tag-uuid threaded through seed code |
| **(b) MPI section** | Add a new section `provider_type` with `data: "platform"` per ZB record | Stays inside the existing class shape; no platform-tag plumbing | Pollutes the company_info catalog with a section that isn't really company_info; Phase 28 form has to know to skip it |
| **(c) orgId filter** | Hardcode `MarketplaceProfileItem.orgId == ZB_ORG_UUID` (`57c741cf-...`) in Browse Providers / provider-profiles service | Zero data plumbing; trivial | Hardcoded UUID in app code; doesn't generalize to future platform-providers; ugly to test |

**Recommendation in plan:** Plan 26-01 must lock the choice with rationale, then propagate it to all later plans (seed batch, distinguisher tag plumbing if any, Browse Providers query change if any). The brief leans toward (a) hydra tag for symmetry with other tag-based discovery; planner should weigh against the simplicity of (b) or (c).

### Tag Placement vs. Demo Tag
- ZB MPI records must NOT carry `sme-mart.demo` tag — that gate hides them from non-admins (Phase 24 logic).
- Whatever distinguisher is chosen does NOT make it "demo".

### Claude's Discretion
- Exact placeholder copy for `legal_name`, `short_blurb`, `long_description`, `website`, etc. (use sensible production-grade text — "ZeroBias", "Cybersecurity & compliance automation platform", `https://zerobias.com`, etc.). Plan should propose values; Clark can override at execute time.
- Whether seed lives as a one-shot script (`scripts/seed-zb-provider.ts`), a CLI command, or an MCP-driven runbook. Lean toward repeatable script in `scripts/` (mirrors Phase 25 pattern under `.planning/phases/25-platform-data-audit/scripts`).
- Test framework: Karma/Jasmine for `provider-list.component.spec.ts` and `provider-card.component.spec.ts` (Angular default; `provider-card.component.spec.ts` already exists). Seed-function unit test can be Vitest/Jest if seed lives outside Angular tree, or Jasmine if inside.
- Whether to commit MPI test residue cleanup as a separate batch or inline with the seed batch — brief allows either.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before working.**

### Phase 26 brief + roadmap
- `.planning/director/phase-26-brief.md` — full PRD, deliverables, requirements, verification queries (this is the source of truth for scope)
- `.planning/ROADMAP.md` — Phase 26 section (lines covering "Seed Provider (ZB-as-Provider)") + dependencies
- `.planning/REQUIREMENTS.md` — SP-01, SP-02, SP-04, SP-05, SP-06 (lines 28-32)
- `.planning/STATE.md` — current milestone state, prior phase outcomes

### company_info convention (Deliverable #1 — ratify)
- `.planning/director/COMPANY-INFO-CONVENTION-DRAFT.md` — 17-section catalog, MPI shape, Pipeline.receive read/write patterns. **Phase 26 renames this to `COMPANY-INFO-CONVENTION.md` (drop -DRAFT)** after a quick review pass.

### Locked decisions (DECISIONS.md sections — read by id)
- `MarketplaceProfileItem Replace Semantics + Cleanup Residue` — replace-by-id behavior, cleanup batch rules
- `Object.tag Field Shape — Validated via UAT Experiment` — exact `[{value: "..."}]` shape, immutability, ingest-time-only
- `W3Geekery Object.tag Remediation` — confirms SP-04 walkthrough portion is RESOLVED
- `ServiceOfferings Defer With Brian — Data-Model Brian Asks Block, Copy/Branding Don't` — why SP-03 is removed
- `.planning/director/DECISIONS.md` (whole file as ambient context, but pull the four entries above for direct citation)

### Existing UI surface (Browse Providers — verify, don't redesign)
- `src/app/pages/providers/provider-list.component.ts` — list page (renders cards from provider-profiles.service)
- `src/app/pages/providers/provider-list.component.html` — template
- `src/app/pages/providers/provider-detail.component.ts` — detail page
- `src/app/shared/components/provider-card/provider-card.component.ts` + `.html` + `.spec.ts` — card render
- `src/app/core/services/provider-profiles.service.ts` — GQL query + section-grouping logic (likely the place a distinguisher filter lands if option (c) chosen)
- `src/app/core/models/provider.model.ts` — Provider type (downstream of MPI grouping)
- `src/app/core/models/marketplace-profile-item.model.ts` — MPI type
- `src/app/core/gql-types/marketplace-profile-item.types.ts` — generated GQL types

### Walkthrough + bootstrap context
- `.planning/director/bootstrap-w3geekery-engagement.md` — walkthrough UUIDs, engagement/project ids, retroactive-tag context
- `.planning/director/backlog/005-sme-mart-entity-tagging-mechanism.md` — RESOLVED, this phase consumes the resolution

### Phase 25 outputs (precedent for seed scripts)
- `.planning/phases/25-platform-data-audit/scripts/` — pattern for runbook scripts (UAT MPI experiments lived here)
- `.planning/phases/25-platform-data-audit/25-RESEARCH.md` — MPI/Pipeline.receive empirical findings

### MCP / Pipeline.receive plumbing
- ZB MCP `platform.Pipeline.receive` — operation used to ingest MPI records (require `pipelineId`, `classId`, `tagIds`, `data`, optional `markDeleted`). Always `mcp__zerobias__zerobias_describe('platform.Pipeline.receive')` before constructing payload.
- `~/.config/mcp-zb/credentials.json` — credentials file (don't search filesystem; use MCP profile lock script `~/.claude/scripts/zb-mcp-profile-lock.sh check|acquire|release` before switching profiles)
- `[memory] ZeroBias MCP Parameter Patterns` — body params nested, `slim` options, etc.

### Cross-cutting platform docs
- `.planning/notes/uat-migration-tracker.md` — UAT vs CI ID reference (UAT is target env)
- `CLAUDE.md` (project root) — naming conventions, ngx-library, Angular 21 patterns, **prefer ZB platform entities over custom classes**

</canonical_refs>

<specifics>
## Specific Ideas

### Identifying values (UAT)
- ZB org id: `57c741cf-a58e-5efc-bf2f-93c4f6cf76ec`
- W3Geekery org id: `cd7105df-523d-5392-9f9a-3f83d3f30107`
- MPI class id: `7bcf86a5-91dc-520d-b9bf-e308b1078d46`
- SmeMartProject class id: `c66114a2-48e2-5b93-b7d6-7ccd6ef45a03`
- Pipeline UUID: `43f08afd-7ab9-4e99-a93c-619c46adaabe`
- W3Geekery engagement id (already-tagged): `746010b7-...`
- Default SmeMartProject id (already-tagged): `ea4db55f-...`
- TAG-SHAPE-TEST-C residue id: `64047b6c-52e7-4592-ac1d-27f5020d1e01` (SmeMartProject — DO NOT include in MPI batch)
- MPI test residues to clean: `mpi-test-a-cd7105df`, `mpi-test-b-cd7105df`

### Seeded sections (initial cut — planner may refine)
At minimum: `legal_name`, `logo_url`, `short_blurb`, `long_description`, `website`, `years_in_business`, `employee_count`. Address + primary_contact are optional — discuss with Clark if planner wants to seed them with placeholders or leave blank for first real Phase 28 user.

### Tests
- `provider-card.component.spec.ts` — already exists; extend with a test that asserts ZB-shaped data renders correctly (legal_name + logo + blurb visible).
- `provider-list.component.spec.ts` — likely doesn't exist; create with a test that asserts the list includes ZB after the seed query (mock the GQL response).
- Seed-function unit test — verify it constructs a valid Pipeline.receive payload (deterministic ids, correct sections, Object.tag shape per distinguisher decision, includes the two `markDeleted` ids).

### Distinguisher tag (if option (a) chosen)
- Tag name candidate: `sme-mart.provider.platform` (matches existing tag naming convention `sme-mart.<scope>.<value>`).
- Use `hydra.Tag.createTag` (NOT `platform.Tag.suggestTag`) — auto-approved, no moderation.
- Tag scope: `org` if owned by ZB org; or `system`/`global` if a platform-level scope exists. Planner: pull `hydra.Tag.searchTags { name: "sme-mart.provider" }` first to check if anything exists; if not, propose creation.

### Verification queries (from brief — copy verbatim into plan acceptance criteria)
- `MarketplaceProfileItem(orgId: ".eq.57c741cf-a58e-5efc-bf2f-93c4f6cf76ec") { id, section, data }` returns N records, one per seeded section.
- If tag distinguisher: `MarketplaceProfileItem(tag: {value: ".eq.<platform-provider-tag-uuid>"}) { id, section }` returns same N records.
- `MarketplaceProfileItem` query no longer returns `mpi-test-a-cd7105df` / `mpi-test-b-cd7105df` post-`markDeleted`.
- Browse Providers page in UAT lists ZeroBias card with seeded copy/logo.

</specifics>

<deferred>
## Deferred Ideas

- **SP-03 / ServiceOffering tier records** — explicitly removed from v1.4 scope per DECISIONS.md "ServiceOfferings Defer With Brian". Will revisit when Brian confirms tier structure.
- **TAG-SHAPE-TEST-C residue cleanup** — different class (SmeMartProject), defer to next real SmeMartProject ingest or schedule one-off (CLEANUP-25 backlog row).
- **Real ZeroBias logo + final copy** — ship placeholders; Brian refines later (copy-layer Brian ask, not data-model).
- **Buyer company profile MPI seeding** — Phase 28's problem (form-driven on first login).
- **`company_info` extensions** — compliance certs, service-area coverage, pricing tiers etc. — convention has extensibility hook (`expiresAt`, `status: "expired"` for credentials), but no new sections in Phase 26.
- **Paid-tier gating / billing** — v1.5+.

</deferred>

---

*Phase: 26-seed-provider-zb-as-provider*
*Context gathered: 2026-04-27 via PRD Express Path (`.planning/director/phase-26-brief.md`)*
