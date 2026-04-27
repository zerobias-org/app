---
phase: 25-platform-data-audit
verified: 2026-04-24
live_re_executed: 2026-04-27
source_files_count: 9
---

# Platform Data Audit — ZeroBias SDK/GQL Inventory

## Executive Summary

Complete catalog of ZeroBias SDK, GraphQL, and hydra APIs that expose data about an authenticated customer Org. Used by downstream phases (especially Phase 28 Company Profile Form) to determine what org data is pre-fillable vs. requires user input vs. needs enrichment.

**Audit methodology:** Live MCP calls against W3Geekery test org (per D-05, CONTEXT.md). No cached responses. Re-run against Neon + AuditgraphDB via the appropriate SDK/GQL client.

**Deliverables:**
1. This index file (PLATFORM-DATA-INVENTORY.md)
2. Per-source sub-files at `platform-data-inventory/<source>.md`
3. Pre-fill map (below)
4. Known-unknown list (below)
5. Pipeline health check report (below)

---

## Platform Data Inventory

### Audit Coverage

#### Mandatory Sources (9 required, per PDA-02 and CONTEXT.md D-02)

| # | Source | Surface | Brief | Sub-file | Status |
|---|--------|---------|-------|----------|--------|
| 1 | `danaOld.Me.whoAmI` + `danaOld.Org.getRequestOrgMember` | SDK | Current user identity + org-member with admin flag | `whoami.md` | ✅ complete (live 2026-04-27) |
| 2 | `danaOld.Org.getOrg(orgId)` | SDK | Org metadata; "current org" resolved client-side via sessionStorage | `currentorg.md` | ✅ complete (live 2026-04-27) |
| 3 | `danaOld.Org.listOrgs` / `getOrg` | SDK | Org listing (filter: visibility/isMember/membershipPolicy; NO name search) | `orgsearch.md` | ✅ complete (live 2026-04-27) |
| 4 | `hydra.Org.searchOrgMembers` / `listOrgMembers` | SDK (hydra) | Org-member discovery (moved from dana to hydra) | `usersearch.md` | ✅ complete (live 2026-04-27) |
| 5 | `platform.Boundary.listBoundaries` / `getBoundary` | SDK | Boundaries accessible to current user | `boundary.md` | ✅ complete (live 2026-04-27) |
| 6 | `platform.Task.list` (no separate `Task.search`) | SDK | Task list+search combined; sort param silently ignored | `task.md` | ✅ complete (live 2026-04-27) |
| 7 | `graphql.Boundary.boundaryExecuteRawQuery` | GQL | Class-object queries (Engagement, SmeMartProject, MarketplaceProfileItem, Bid) | `gql-class-objects.md` | ✅ complete (live 2026-04-27) |
| 8 | `hydra.Tag.listTags` / `searchTags` / `getTag` | hydra API | Tag discovery + metadata | `hydra-tag.md` | ✅ complete (live 2026-04-27) |
| 9 | `hydra.Resource.resourceSearch` (canonical) / `getResource` | hydra API | Resource search + retrieval | `hydra-resource.md` | ✅ complete (live 2026-04-27) |

#### Opportunistic Expansion (D-02 aggressive discovery)

Likely additional sources to be audited if discovered during mandatory audit. Candidates from RESEARCH.md §3:

| # | Source | Surface | Rationale |
|---|--------|---------|-----------|
| 10 | `dana.Org.listMembers` | SDK | Org membership + roles |
| 11 | `platform.MarketplaceProfileItem.*` | SDK | Vendor/buyer profile CRUD |
| 12 | `platform.Class.getClass` / `platform.Class.getClassObjects` | SDK | Class metadata + object discovery |
| 13 | `platform.Object.getVersionByObjectIdOrVersionId` | SDK | Post-ingest object read by UUID |
| 14 | `portal.Product.search` / `portal.Framework.list` | Portal API | Catalog entities (products, frameworks) |
| 15 | `hydra.Resource.tagResource` / `hydra.Resource.linkResources` | hydra API | Write-side discovery |

---

## Pre-fill Map (corrected 2026-04-27)

**Storage shape correction:** `MarketplaceProfileItem` is a generic class with `(section, data)` discriminator, NOT a struct with `legalName/dba/logoUrl/...` fields. Each profile field is its own MPI record keyed by `(orgId, section)` with deterministic id `mpi-<orgId>-<section>`. See COMPANY-INFO-CONVENTION-DRAFT.md (rewritten 2026-04-27) for the canonical section catalog.

**Read pattern:** ONE GQL query per form mount: `MarketplaceProfileItem(orgId: ".eq.<currentOrgId>") { id, section, data, status }` → group client-side by `section` → project to form model.

**Write pattern:** ONE Pipeline.receive batch per save click; data array contains one record per dirty form field; class id `7bcf86a5-91dc-520d-b9bf-e308b1078d46`. Replace key is `id` only — un-edited records are simply omitted. Validated empirically 2026-04-27.

| Phase 28 form section | Source | Pre-fill fallback (when MPI section absent) | Save Target |
|---|---|---|---|
| `legal_name` | MPI section `legal_name` | `danaOld.Org.getOrg.name` | Pipeline.receive on MPI class |
| `dba` | MPI section `dba` | none | Pipeline.receive on MPI class |
| `logo_url` | MPI section `logo_url` | `danaOld.Org.getOrg.avatarUrl` | Pipeline.receive on MPI class |
| `short_blurb` | MPI section `short_blurb` | none | Pipeline.receive on MPI class |
| `long_description` | MPI section `long_description` | none | Pipeline.receive on MPI class |
| `primary_contact.user_id` | MPI section | UI: pick from `hydra.Org.searchOrgMembers` | Pipeline.receive on MPI class |
| `primary_contact.name` | MPI section | derived from selected user | Pipeline.receive on MPI class |
| `primary_contact.email` | MPI section | `getRequestOrgMember(userId).member.emails[0]` | Pipeline.receive on MPI class |
| `website` | MPI section `website` | none | Pipeline.receive on MPI class |
| `hq_location.street` | MPI section | none | Pipeline.receive on MPI class |
| `hq_location.city` | MPI section | none | Pipeline.receive on MPI class |
| `hq_location.state` | MPI section | none | Pipeline.receive on MPI class |
| `hq_location.country` | MPI section | none | Pipeline.receive on MPI class |
| `hq_location.postal_code` | MPI section | none | Pipeline.receive on MPI class |
| `years_in_business` | MPI section | none | Pipeline.receive on MPI class |
| `employee_count` | MPI section | none | Pipeline.receive on MPI class |
| `onboarding_complete` | MPI section (system-set) | n/a | Pipeline.receive on MPI class (set by Phase 28 save) |

---

## Known Unknowns (corrected 2026-04-27)

**Field-source discovery RESOLVED via section/data shape:** Every Phase 28 form field has a deterministic MPI section. No unmapped fields remain.

**Production-data state on UAT (W3Geekery):** **0 production MarketplaceProfileItem records exist.** Only the 2 replace-test residues (`mpi-test-a-cd7105df`, `mpi-test-b-cd7105df`) are visible. First Phase 28 form load for any W3Geekery user will use Org-level fallbacks for `legal_name` and `logo_url`; everything else blank with "(please provide)" hint.

**Org-level fallback availability (verified 2026-04-27):**
- `danaOld.Org.getOrg.name` — always populated (W3Geekery: "W3Geekery") → `legal_name` fallback ✅
- `danaOld.Org.getOrg.avatarUrl` — populated for W3Geekery; may be null for other orgs → `logo_url` fallback (partial)
- All other Phase 28 form fields have NO Org-level fallback. First-time users see "(please provide)".

**Sparse-data fallback pattern for Phase 28:** Form binds form-field → MPI section. If MPI record absent for that section AND no Org fallback applies, render "(please provide)" hint and an input control. User edits optionally; on save, only DIRTY records are pushed via Pipeline.receive (un-edited stays untouched per id-replace semantics).

**Skip-for-now respected:** Phase 28 has a skip path that does NOT write the `onboarding_complete` MPI record; subsequent logins re-route to the form until the marker is written.

**Cleanup queue (residue from this audit):**
- `mpi-test-a-cd7105df` (MarketplaceProfileItem class)
- `mpi-test-b-cd7105df` (MarketplaceProfileItem class)
- `TAG-SHAPE-TEST-C` / `64047b6c-52e7-4592-ac1d-27f5020d1e01` (SmeMartProject class — pre-existing)
- Cleanup path: include all three in `markDeleted` of a future Pipeline.receive batch (one batch per class, since `data` must be non-empty).

---

## Pipeline Health Check Report

**Status:** ✅ Live on UAT

**Verified:** 2026-04-24

### Part 1: Receive Ping Test

**Pipeline UUID:** `43f08afd-7ab9-4e99-a93c-619c46adaabe`

**Test Record:** SmeMartProject "HEALTH-CHECK-PING-PHASE-25"
- Record ID: `c20e5649-cfb0-4b4c-a53b-db483bdff60a`
- Status: `active`
- Project Type: `project`
- Date Created: `2026-04-24`

**Response:** 200 OK (record materialized to AuditgraphDB)

**Timestamp:** 2026-04-24 16:17 UTC

**Implication:** Pipeline is accepting writes and persisting records to AuditgraphDB.

### Part 2: Config Scan Results

**grep Results (pipelineId references in codebase):**

| File | Line | Value | Status |
|------|------|-------|--------|
| `src/environments/environment.uat.ts` | 15 | ~~`f6d1f579-fe02-4158-b99e-a55113fd70cb`~~ `43f08afd-7ab9-4e99-a93c-619c46adaabe` | **FIXED in Part 3** |
| `src/environments/environment.prod.ts` | 13 | `091d5068-0527-4f45-9839-37f6d5c1669e` | prod-only (different pipeline) |
| `src/environments/environment.vercel.ts` | 15 | `f6d1f579-fe02-4158-b99e-a55113fd70cb` | old value (Vercel deployment) |
| `src/environments/environment.ts` | 21 | `f6d1f579-fe02-4158-b99e-a55113fd70cb` | default/dev (old) |
| `src/environments/environment.stack.ts` | 15 | `43f08afd-7ab9-4e99-a93c-619c46adaabe` | **CORRECT** |
| `src/app/core/services/pipeline-write.service.ts` | 54 | `environment.pipelineId` | injected (not hardcoded) ✓ |

**App Code Scan:** No hardcoded pipelineId references found in app code. All references use environment injection via `environment.pipelineId`. ✓

**Mismatches Identified:**
- `environment.vercel.ts` and `environment.ts` (default/dev) still carry the old v1.2 receiver ID (`f6d1f579-...`). These are non-critical for UAT purposes but represent technical debt. Scope note: Phase 25-05 focused on UAT environment; dev/Vercel updates deferred to future cleanup pass.

### Part 3: Environment Fix Applied

**File:** `src/environments/environment.uat.ts`

**Line 15 Change:**
- **Before:** `pipelineId: 'f6d1f579-fe02-4158-b99e-a55113fd70cb',` (v1.2 carry-forward)
- **After:** `pipelineId: '43f08afd-7ab9-4e99-a93c-619c46adaabe',` (current v1.3+ receiver)

**Verification:**
- ✅ New UUID `43f08afd-...` present in environment.uat.ts
- ✅ Old UUID `f6d1f579-...` no longer present in environment.uat.ts
- ✅ Change is a single-line bounded edit (no other lines modified)

### Summary

**Pipeline Health Status:** ✅ **LIVE** 

The current SME Mart receiver pipeline (`43f08afd-7ab9-4e99-a93c-619c46adaabe`) is accepting writes and persisting records to AuditgraphDB. The UAT environment configuration has been corrected to point to the current pipeline. Phase 25 PDA-05 requirement satisfied.

**Phase 28+ can proceed** with Engagement/SmeMartProject pushes via Pipeline.receive to the current receiver. No further pipeline health action needed for this phase.

---

## References

- **CONTEXT.md:** Locked decisions (D-01 through D-12), coverage strategy, methodology
- **RESEARCH.md:** Per-source template (§2), pre-fill map columns (§8), draft company_info convention shape (§9)
- **VALIDATION.md:** Verification contract, per-task verification map, manual checks
- **DECISIONS.md:** Object.tag field shape, default ZB engagement bootstrap recipe, pipeline UUIDs
- **bootstrap-w3geekery-engagement.md:** Canonical walkthrough with W3Geekery UUIDs
- **phase-28-brief.md:** Form field enumeration (primary consumer of pre-fill map)
- **phase-26-brief.md:** company_info convention ratification (consumes Phase 25 draft)
