---
phase: 25-platform-data-audit
plan: 03
subsystem: research
tags: [graphql, hydra-api, platform-audit, company-profile, pre-fill, mcp-live]
re_executed_live: 2026-04-27

requires:
  - phase: 25
    plan: 01
    provides: "Infrastructure: verify-inventory.sh, _TEMPLATE.md, index file"
  - phase: 25
    plan: 02
    provides: "SDK sources (danaOld, hydra, platform): whoami, currentorg, orgsearch, usersearch, boundary, task"

provides:
  - "GQL class-object audit (Engagement, SmeMartProject, MarketplaceProfileItem, Bid) — live UAT"
  - "hydra Tag API audit (listTags, searchTags, getTag) — live UAT"
  - "hydra Resource API audit (resourceSearch canonical, searchResources deprecated, getResource) — live UAT"
  - "MarketplaceProfileItem replace-semantics validation (Pipeline.receive replace key = id only)"
  - "W3Geekery Object.tag remediation (Engagement + default SmeMartProject)"
  - "Phase 28 storage-shape correction documented (section/data, not structured fields)"

affects:
  - phase: 28
    why: "Storage shape corrected — pre-fill map and save flow rewritten in COMPANY-INFO-CONVENTION-DRAFT.md"
  - phase: 26
    why: "ZB-as-provider seeding follows MPI section/data shape; uses Pipeline.receive with deterministic ids"
  - phase: 27
    why: "Lazy guard can rely on Object.tag uniformly after W3Geekery remediation"
  - phase: 30
    why: "Default project board queries SmeMartProject by engagementId FK (validated)"

tech-stack:
  added: []
  patterns:
    - "RFC4515 filter syntax: dot-prefix operators (.eq., .ne., .sw., .in.) inside GQL Input args"
    - "Object.tag at Pipeline.receive ingest time: tag: [{value: '<uuid>'}] shape — immutable post-ingest"
    - "Pipeline.receive replace key = id only (validated empirically); per-section saves safe"
    - "Cross-realm linkage via shared tag: Engagement ↔ Task via hydra Tag (not direct links)"
    - "MarketplaceProfileItem section/data discriminator — flat sub-sections preferred over JSON-encoded objects"

key-files:
  created:
    - ".planning/director/platform-data-inventory/gql-class-objects.md"
    - ".planning/director/platform-data-inventory/hydra-tag.md"
    - ".planning/director/platform-data-inventory/hydra-resource.md"
  modified:
    - ".planning/director/PLATFORM-DATA-INVENTORY.md (index: row status, source_files_count 6→9)"
    - ".planning/director/COMPANY-INFO-CONVENTION-DRAFT.md (rewritten for section/data shape)"
    - ".planning/director/phase-28-brief.md (storage shape + save flow corrected)"
    - ".planning/director/bootstrap-w3geekery-engagement.md (Object.tag remediation note)"
    - ".planning/director/DECISIONS.md (3 new entries: replace semantics, Object.tag remediation, residue cleanup)"

key-decisions:
  - "MarketplaceProfileItem is GENERIC (section/data) not structured — Phase 28 design rewritten"
  - "Pipeline.receive replace key validated as id-only; deterministic id strategy: mpi-<orgId>-<section>"
  - "W3Geekery Engagement + default SmeMartProject re-ingested with Object.tag populated"
  - "Tag-filter discovery now works uniformly across W3Geekery records"

requirements-completed:
  - PDA-02

duration: 90min
originally_completed: 2026-04-24
re_executed_live: 2026-04-27
---

# Phase 25 Plan 03: GQL & hydra Audit Summary

**One-liner:** Audited 3 remaining mandatory sources (GQL class-objects, hydra Tag, hydra Resource) live on UAT 2026-04-27. Surfaced major schema correction (MarketplaceProfileItem is section/data, not structured), validated Pipeline.receive replace semantics, and remediated W3Geekery Object.tag inconsistency.

---

## Re-execution context

The original Plan 25-03 was executed without live MCP access (same root cause as Plan 25-02 — MCP service registry had broken yamlFile paths). Sub-files were synthesized from prior context and made up `MarketplaceProfileItem.legalName`, `dba`, `logoUrl`, etc. fields that **do not exist on the class**. Re-executed live 2026-04-27 against `uat-clark@w3geekery` profile after MCP fix landed (1.0.41).

---

## Major findings

### 1. MarketplaceProfileItem is generic (section/data), NOT structured

**Schema (validated via `__type` introspection + `platform.Class.getClass`):**

```
MarketplaceProfileItem {
  id, name, description, status, section, data, orgId,
  expiresAt, dateCreated, dateLastModified, dateDeleted,
  product (link), tag[], aliases, includes, _links, icon, note,
  metadata, url
}
```

Per class description: "Vendor/buyer profile item containing credentials, certifications, references, insurance info, or personnel data. **Uses section discriminator + JSON data blob for flexible content.**"

**Impact:** Plan 25-03 originally claimed all 10 Phase 28 form fields map to `MarketplaceProfileItem.legalName/dba/logoUrl/...`. Those fields DO NOT EXIST. Reality: each form field is its own MPI record keyed by `(orgId, section)`. See `COMPANY-INFO-CONVENTION-DRAFT.md` (rewritten 2026-04-27) for the canonical section catalog.

### 2. Pipeline.receive replace key = `id` only (validated)

UAT experiment 2026-04-27:
1. Ingest `mpi-test-a-cd7105df` (section=test_a, data=A) + `mpi-test-b-cd7105df` (section=test_b, data=B). Both visible. ✅
2. Ingest only `mpi-test-a-cd7105df` (data=A2). `test_a` updated; `test_b` survived. ✅

**Conclusion:** Per-section saves are safe. Phase 28 save flow uses deterministic ids (`mpi-<orgId>-<section>`) and one batch per save click; un-edited records are simply omitted.

Test residue on UAT (cleanup queue): `mpi-test-a-cd7105df`, `mpi-test-b-cd7105df` plus the pre-existing `TAG-SHAPE-TEST-C` SmeMartProject. See DECISIONS.md "MarketplaceProfileItem Replace Semantics".

### 3. W3Geekery Object.tag remediated

Original walkthrough left Object.tag as `null` on Engagement (`746010b7-...`) and default SmeMartProject (`ea4db55f-...`). Three tag-related fields were inconsistent: `engagementTag` (string, set), `zerobiasTagId` (UUID, set), `tag` (Object.tag array, NULL).

Re-ingested both records via Pipeline.receive 2026-04-27 with `tag: [{value: "a81cd320-..."}]` populated. Verified — tag-filter discovery now works:

```
Engagement(tag: {value: ".eq.a81cd320-..."}) → 1 (W3Geekery <- ZeroBias)
SmeMartProject(tag: {value: ".eq.a81cd320-..."}) → 2 (TAG-SHAPE-TEST-C + SME Mart Platform Development)
```

Phase 27 lazy guard can use Object.tag uniformly. See DECISIONS.md "W3Geekery Object.tag Remediation".

### 4. Schema introspection works on UAT

`{ __type(name: "Foo") { fields { name type { name kind ofType { name kind } } } } }` is the authoritative source-of-truth check when memory diverges. Used to confirm all four class shapes during this audit.

### 5. Real class field counts (vs synthesized assumptions)

| Class | Original assumption | Reality | Notable |
|---|---|---|---|
| Engagement | basic | 29 fields | `vettingItems[]`, `noteFolders[]`, `documents[]`, `reviews[]`, `notes[]` children. Three tag fields (`engagementTag`, `zerobiasTagId`, `tag`). |
| SmeMartProject | basic | 47 fields | Wizard data, RFP fields, `boards[]`, `prds[]`, `plans[]`, `rfpInvitations[]`, `formSubmissions[]`, `documentInstances[]`, `bids[]`. Far richer than originally assumed. |
| MarketplaceProfileItem | structured profile | 20 generic fields | section/data discriminator. **No structured profile fields.** |
| Bid | basic | 29 fields | `pricingModel`, `pricingBreakdown`, `coverLetter`, `executiveSummary`, `responses[]`. |

---

## hydra Tag findings

| Op | Real signature | Returns |
|---|---|---|
| `hydra.Tag.listTags(pageNumber?, pageSize?, tagTypes?, nameFilter?)` | GET `/tags` | `PagedResults<TagView>` (slim) |
| `hydra.Tag.searchTags(pageNumber?, pageSize?, sort?, tagSearchBody?)` | POST `/searchTags` | `PagedResults<TagExtended>` (rich, includes `color`, `scope`, `owner`) |
| `hydra.Tag.getTag(id)` | GET `/tags/{id}` | `TagExtended` |

W3Geekery engagement tag confirmed: `a81cd320-243e-44eb-bdd9-9824019ef3dd` / `sme-mart.eng.w3geekery-default-zb` / scope `org` / owner W3Geekery.

`searchTags` body filters: `name`, `description`, `types[]`, `ownerIds[]`, `resources[]` (reverse-tag lookup), `scope`. All AND'd. Tag `name` is `nmtoken` domain (`A-Z 0-9 . _ - :` only).

---

## hydra Resource findings

| Op | Real signature | Status |
|---|---|---|
| `hydra.Resource.resourceSearch(pageNumber?, pageSize?, resourceSearchFilter?)` | POST `/resources` | **canonical** |
| `hydra.Resource.searchResources(...)` | GET `/resources` | deprecated (still works for basic filters) |
| `hydra.Resource.getResource(id, inflate?)` | GET `/resources/{id}` | live |
| `hydra.Resource.listResources` | — | **does not exist** (Plan 25-03 named it but no such op) |

`resourceSearch` body filters: `types[]`, `keywords[]`, `tags[]` (NAMES not UUIDs), `inflate`, `conditions[]` (requires `inflate=true`), `alerts`, `boundaryId[]` (documented but "not implemented"). Filters within an array are OR'd; arrays are AND'd against each other.

W3Geekery engagement coordination Task confirmed via `resourceSearch(tags=["sme-mart.eng.w3geekery-default-zb"])` → 1 result (id `2c95bc18-...`).

---

## RFC4515 filter syntax (validated)

GQL field args accept dot-prefix operators inside Input values:

```graphql
{ Engagement(id: ".eq.746010b7-dc99-436b-9142-8c4b85c5e623") { id, name } }
{ MarketplaceProfileItem(orgId: ".eq.cd7105df-...") { section, data } }
{ SmeMartProject(tag: { value: ".eq.a81cd320-..." }) { id, name } }
{ SmeMartProject(status: ".ne.draft") { id, status } }
```

Operators: `.eq.`, `.ne.`, `.sw.`, `.in.`, etc. (per DECISIONS.md "Object.tag Field Shape").

---

## Phase 28 readiness

- **Storage shape:** corrected. See COMPANY-INFO-CONVENTION-DRAFT.md.
- **Pre-fill flow:** one GQL query → group by `section` → project to form model. Org-level fallbacks for `legal_name` and `logo_url` only.
- **Save flow:** one Pipeline.receive batch per save click; deterministic id `mpi-<orgId>-<section>`; replace by id; un-edited fields omitted.
- **Adapter layer:** `MarketplaceProfileService` translates form model ↔ MPI record array.
- **Onboarding-complete marker:** as a dedicated MPI section (`section: "onboarding_complete"`).

---

## Known gaps + cleanup queue

1. **No production MarketplaceProfileItem records on UAT** for any org. First Phase 28 form save will populate the catalog for the first real org.
2. **Test residue cleanup:** `mpi-test-a-cd7105df`, `mpi-test-b-cd7105df`, `TAG-SHAPE-TEST-C` need `markDeleted` in a future batch.
3. **MarketplaceProfileItem `expiresAt`** is for credentials/certs/insurance — not used for plain profile fields. Lifecycle distinction between "active profile data" and "expirable cred" handled via `status` enum.
4. **`conditions[]` in `resourceSearch`** untested — body-time payload matching unique to POST endpoint. Document a real condition example when first used.

---

## Verification checklist

- [x] All three sub-files live-tested (UAT MCP 1.0.41)
- [x] Sample responses are real W3Geekery class objects (UUIDs match DECISIONS.md)
- [x] Field lists captured via `__type` introspection (authoritative)
- [x] RFC4515 filter syntax examples included with real outputs
- [x] Pre-fill contributions corrected for section/data shape
- [x] hydra-tag and hydra-resource sub-files updated for canonical ops
- [x] Pipeline.receive replace semantics empirically validated
- [x] W3Geekery Object.tag remediated (Engagement + default SmeMartProject)
- [x] DECISIONS.md updated with 3 new entries
- [x] COMPANY-INFO-CONVENTION-DRAFT.md rewritten for section/data shape
- [x] phase-28-brief.md updated with corrected save/pre-fill flow

---

## Next steps

- **Plan 25-04:** Pre-fill map synthesis + write-path catalog — REQUIRES UPDATE for the section/data correction.
- **Plan 25-05:** Pipeline health check + env-file fix — done (per `25-05-SUMMARY.md`).
- **Phase 26:** ZB-as-provider seeding uses canonical section names from COMPANY-INFO-CONVENTION-DRAFT.md.
- **Phase 28:** form-schema work (Phase 22 dependency) imports section constants.

---

**Originally completed:** 2026-04-24 (synthesized)
**Live re-execution:** 2026-04-27 (MCP 1.0.41)
**Status:** Plan 25-03 complete; Phase 28 storage shape correction propagated through dependent docs.
