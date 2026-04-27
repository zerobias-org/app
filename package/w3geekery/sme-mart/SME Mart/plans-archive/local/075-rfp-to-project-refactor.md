# Plan 075: RFP → Project Refactor

**Status:** All phases complete (2-7)
**Phase:** 5 (Engagements & Admin)
**Created:** 2026-03-25
**Supersedes:** Plan 032 (RFP Wizard), Plan 033 (Bid Flow) for the data model layer, Plan 040 (Project Bloom) for creation flow
**Source:** Kevin ownership model (2026-03-25), Engagement/Project separation work
**Questions doc:** [open-questions-for-brian-kevin.md](../../notes/open-questions-for-brian-kevin.md)

---

## Purpose

The RFP flow is broken — RFPs are created as Engagement entities with fields that no longer exist in the GQL schema. This plan refactors RFPs to be SmeMartProject entities in draft/published status, with bid acceptance gating on Engagement existence.

## Decisions Made

| Decision | Resolution | Date |
|----------|-----------|------|
| Old RFP data migration | Fresh start — delete old, re-seed | 2026-03-25 |
| Engagement vetting gate | Skip for now — assume vetting occurred, note TBD. Auto-activate project on bid acceptance. | 2026-03-25 |
| Bid rejection effect on RFP | No effect — RFP stays `published`. Other bids can still come in. | 2026-03-25 |
| Resource link direction | Create both sides for clarity and integrity (like `linkResources()`) | 2026-03-25 |
| Multiple accepted bids | Happy path: one accepted bid per RFP. Multi-provider scenarios deferred. | 2026-03-25 |

## Target Model

```
RFP = SmeMartProject (status: draft → published → active → completed)

Lifecycle:
1. Buyer creates RFP → SmeMartProject (status: draft, ownerId: buyer org)
2. Buyer publishes → status: published, on marketplace
3. Providers submit bids (bids link to project, not engagement)
4. Buyer accepts bid →
   - Find/create Engagement (buyer org ↔ provider org)
   - Link project to engagement via relates_to (both directions)
   - Assume vetting satisfied (TBD — Plan 063)
   - Project status → active
5. Work proceeds in Project (managed by platform Project app when available)
```

## Fields Moving from Engagement to SmeMartProject

| Field | Type | Purpose |
|-------|------|---------|
| `category` | string | Marketplace category (Assessors, Advisors, etc.) |
| `budgetType` | string | fixed / hourly / negotiable |
| `budgetMin` | number | Budget range low |
| `budgetMax` | number | Budget range high |
| `timeline` | string | Expected duration |
| `responseDeadline` | string (date) | Bid submission deadline |
| `questionsDeadline` | string (date) | Q&A deadline |
| `evaluationCriteria` | JSON | Scoring matrix |
| `wizardStep` | string | RFP wizard progress |
| `wizardData` | JSON | RFP wizard draft state |

## Phases

### Phase 1: Schema Changes (2-3 hrs)

**Schema PR to zerobias-org/schema** — add RFP fields to SmeMartProject.

New fields on SmeMartProject:
- `category`, `budgetType`, `budgetMin`, `budgetMax`, `timeline`
- `responseDeadline`, `questionsDeadline`, `evaluationCriteria`
- `wizardStep`, `wizardData`

New field on Bid (or schema adjustment):
- `project` link to SmeMartProject (currently has `engagement` link — needs to point to project instead or in addition)

**App changes:**
- `core/models/sme-mart-project.model.ts` — add new fields to interface
- `core/field-mappings.ts` — add mappings for new fields
- `core/gql-types/` — update GQL response types if needed

Follow [SCHEMA_CHANGE_PROCESS.md](../../docs/SCHEMA_CHANGE_PROCESS.md) for the schema PR.

### Phase 2: Service Layer (4-5 hrs)

- **`SmeMartProjectService`** — add `createAsRfp()`, `publishRfp()`, `linkToEngagement()` methods
- **`RfpWizardService`** — rewrite to create/update SmeMartProject instead of Engagement
- **`BidsService`** — change from `engagementId` to `projectId` / `project` link for queries and creates
- **`EngagementsService`** — remove `createRfp()` / `updateRfp()` (RFP creation moves to SmeMartProjectService)
- **`EngagementLifecycleService`** — add `acceptBidAndLink()`: find/create engagement, link project, set active

### Phase 3: RFP Wizard Components (3-4 hrs)

- **`rfp-wizard.component.ts`** — wire to SmeMartProjectService instead of EngagementsService
- **Step components** — form bindings stay the same, just the backing service changes
- **`rfp-step-review`** — publish calls `SmeMartProjectService.publishRfp()`
- **Navigation** — on publish, navigate to `/rfps/:projectId`

### Phase 4: RFP List & Detail (3-4 hrs)

- **`rfp-list.component.ts`** — query SmeMartProject where `status = published` instead of Engagement where no engagementTag
- **`rfp-detail.component.ts`** — load SmeMartProject, display RFP fields, show bids by projectId
- **`rfp-detail.component.html`** — rebind from `eng.*` to `project.*`
- **Accept bid button** → calls `EngagementLifecycleService.acceptBidAndLink()`

### Phase 5: Bid Submission (2-3 hrs)

- **`bid-wizard.component.ts`** — load RFP from SmeMartProject, submit bid with `project` link
- **`bid-comparison-page.component.ts`** — filter bids by project
- **`bids.service.ts`** — ensure all GQL queries use project link

### Phase 6: Demo Data (2-3 hrs)

- Rewrite `DEMO_PROJECTS` to include RFP fields (category, budget, timeline, etc.)
- Some projects in `published` status (marketplace RFPs)
- Some projects in `active` status (work in progress, linked to engagements)
- Update `DEMO_BIDS` to link to projects
- Create engagement ↔ project `relates_to` resource links for active projects
- Delete old data via pipeline, seed fresh

### Phase 7: Testing (3-4 hrs)

- Update all specs that reference Engagement RFP fields
- Update `rfp-wizard.service.spec.ts` — creates SmeMartProject
- Update `bids.service.spec.ts` — queries by project
- Add tests for bid acceptance → engagement linking flow
- Update factories and fixtures

## Effort Summary

| Phase | Hours |
|-------|-------|
| 1 — Schema + Models | 2-3 |
| 2 — Services | 4-5 |
| 3 — Wizard | 3-4 |
| 4 — List/Detail | 3-4 |
| 5 — Bid | 2-3 |
| 6 — Demo Data | 2-3 |
| 7 — Testing | 3-4 |
| **Total** | **19-26** |

## Dependencies

- Phase 1 (schema) must complete before Phase 2 (services)
- Phase 2 must complete before Phases 3-5 (can run in parallel after 2)
- Phase 6 (demo data) needs Phases 1-5
- Phase 7 (testing) needs all prior phases

## What's NOT in this plan

- Engagement vetting checklist (Plan 063 — separate, TBD)
- Multi-provider bid acceptance (deferred — happy path only)
- Project management UI (deferred to platform Project app)
- Entangled task pairs (Plan 071 — separate)

---

*Session: `claude --resume poc/sme-mart`*
