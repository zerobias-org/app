# SME Mart — Roadmap

## Milestones

- ✅ **v1.0 AuditgraphDB Migration** — Phases 1-6 (shipped 2026-03-19) | [Archive](milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 Org Navigation & Vendor Profile** — Phases 7-12 (in progress)

## Phases

<details>
<summary>✅ v1.0 AuditgraphDB Migration (Phases 1-6) — SHIPPED 2026-03-19</summary>

- [x] Phase 1: Infrastructure Setup (1/1 plans) — completed 2026-03-17
- [x] Phase 2: Wave 1 - Core Marketplace (2/2 plans) — completed 2026-03-18
- [x] Phase 3: Wave 2 - Attachments (2/2 plans) — completed 2026-03-19
- [x] Phase 4: Wave 3 - Standalone Entities (1/1 plans) — completed 2026-03-19
- [x] Phase 5: Verification & Cleanup (1/1 plans) — completed 2026-03-19
- [x] Phase 6: Project Bloom Entities (2/2 plans) — completed 2026-03-19

</details>

---

<details open>
<summary>🚧 v1.1 Org Navigation & Vendor Profile (Phases 7-12) — IN PROGRESS</summary>

- [x] Phase 7: Org Navigation (Plan 079) — 1/1 plans complete (2026-03-31)
- [ ] Phase 8: Vendor Profile Schema (Plan 041 Phase 1) — 1/1 plans created (08-01-PLAN.md)
- [ ] Phase 9: Vendor Profile Service (Plan 041 Phase 2) — 0/1 plans
- [ ] Phase 10: Vendor Profile UI (Plan 041 Phase 3) — 0/1 plans
- [ ] Phase 11: Vetting Pre-Fill (Plan 041 Phase 4) — 0/1 plans
- [ ] Phase 12: Project-Centric Boundary Model (Plan 080) — 1/1 plans created (12-01-PLAN.md)

</details>

---

## Phase Details

### Phase 7: Org Navigation

**Goal:** Users can discover and navigate between their organizations, view non-editable org overviews, and see the foundation for org switching (stubbed).

**Depends on:** Nothing (first phase of v1.1)

**Plan:** Plan 079 (My Organizations Refactor)

**Requirements:** ORG-01, ORG-02, ORG-03, ORG-04, ORG-05, ORG-06, ORG-07, ORG-08, ORG-09, ORG-10, ORG-11

**Success Criteria** (what must be TRUE):
1. User can navigate to `/orgs` and see a list of all their organizations (filtered to exclude hidden orgs, System Org, and ops orgs) displayed as cards or table rows
2. User can click on any organization to navigate to `/orgs/:orgId` and view a read-only overview with org name, description, members list (via `hydra.Org.listOrgMembers`), groups list (via `hydra.Org.listGroups`), and associated boundaries
3. Each org overview card has a "Go to Org Profile" action that navigates to `/org` for current-org-only editing
4. Nav sidebar shows "My Organizations" (renamed from "My Organization") with route `/orgs`, and an org switching button is present but disabled with tooltip explaining it requires session auth
5. `/orgs/:orgId` is strictly read-only — attempting to edit org info redirects to or disables edit controls

**Plans:** 07-01-PLAN.md ✅

---

### Phase 8: Vendor Profile Schema

**Goal:** Platform has GQL schema entity for vendor profile items with section discriminator and flexible JSON data storage, validated and ready for service layer consumption.

**Depends on:** Phase 7 (unblocked, parallel with org nav implementation)

**Plan:** Plan 041 Phase 1 (Vendor Profile Schema)

**Requirements:** VPR-01, VPR-02, VPR-03, VPR-04, VPR-05, VPR-06

**Success Criteria** (what must be TRUE):
1. `MarketplaceProfileItem` GQL schema entity submitted to `zerobias-org/schema:dev` via PR with `section` discriminator field (enum: corporate_identity, attestation, insurance, reference, personnel, financial) and JSON `data` field for section-specific content
2. Schema is org-scoped with appropriate links for org ownership and engagement references
3. Schema passes dataloader verification (`npm run verify` in schema repo succeeds with zero errors)
4. PR is merged to `zerobias-org/schema:dev` and schema reload propagates to platform within 15 minutes
5. Service layer can query `MarketplaceProfileItem` entities via GQL without 404 or schema errors

**Plans:** 08-01-PLAN.md (created 2026-03-31, awaiting execution)

---

### Phase 9: Vendor Profile Service

**Goal:** Backend service layer can read vendor profile items from GQL and write them via Pipeline, with full CRUD support and bidirectional field mapping.

**Depends on:** Phase 8 (schema must be live)

**Plan:** Plan 041 Phase 2 (Vendor Profile Service)

**Requirements:** VPS-01, VPS-02, VPS-03, VPS-04, VPS-05

**Success Criteria** (what must be TRUE):
1. `VendorProfileService` reads profile items via GraphQL using GQL read path and writes items via Pipeline using Pipeline write path for all 6 profile sections
2. Service supports full CRUD operations (create, read, update, delete) for all sections with proper error handling and validation
3. Field mapping constants exist with bidirectional GQL↔domain mapping for all profile item fields, documented with clear semantics
4. Roundtrip tests pass validating GQL→domain→Pipeline→GQL cycle for representative profile items from each section
5. Service tests achieve 80%+ code coverage with isolated unit tests and integration tests against live GQL/Pipeline endpoints

**Plans:** TBD

---

### Phase 10: Vendor Profile UI

**Goal:** Users can manage their organization's vendor profile on the Corporate Profile tab under `/org`, with full visibility into all 6 sections, add/edit/delete operations, and expiration indicators.

**Depends on:** Phase 9 (service layer ready)

**Plan:** Plan 041 Phase 3 (Vendor Profile UI)

**Requirements:** VPU-01, VPU-02, VPU-03, VPU-04, VPU-05, VPU-06, VPU-07

**Success Criteria** (what must be TRUE):
1. Corporate Profile tab is visible on `/org` page (current org only, not on `/orgs/:orgId`) and displays all profile items organized by their 6 sections with clear visual grouping
2. User can add new profile items to any section via a form/modal with appropriate fields for each section type
3. User can edit existing profile items and see changes reflect in the UI within 2-3 seconds of submission (optimistic update + eventual consistency)
4. User can delete profile items with confirmation and see removal reflected in the UI
5. Expired items (based on `expiresAt` field, if present) display with visual indicator (color, badge, etc.) and are NOT hidden — users see what needs renewal
6. Expired items auto-generate a "updated version needed" checklist prompt (appears as a card or notification) suggesting the vendor update the expired item

**Plans:** TBD

**UI hint**: yes

---

### Phase 11: Vetting Pre-Fill

**Goal:** During engagement vetting, vendors see intelligent suggestions of matching vendor profile items by section, can select items to attach as references, and see pre-fill suggestions update as their profile evolves.

**Depends on:** Phase 10 (vendor profile fully functional)

**Plan:** Plan 041 Phase 4 (Vetting Pre-Fill)

**Requirements:** VPF-01, VPF-02, VPF-03, VPF-04

**Success Criteria** (what must be TRUE):
1. On the engagement vetting tab, a suggestion panel appears showing matching vendor profile items grouped by section-to-vetting_type mapping (e.g., vetting_type "insurance" suggests items from the "insurance" section of vendor profile)
2. Vendor can select which profile items to attach to the engagement vetting and see them saved as references (pointers) rather than copies of the profile data
3. Attached items remain pointers to the live vendor profile — if the vendor updates a profile item later, the vetting sees the current version, not a stale copy
4. When vendor adds new profile items or updates existing ones, the pre-fill suggestions panel updates automatically to reflect the new or changed items available for attachment

**Plans:** TBD

---

### Phase 12: Project-Centric Boundary Model

**Goal:** Surface internal/external org membership distinction and project boundary parties in the UI. My Orgs cards show Internal/External badges and engagement/project counts. Project detail replaces `members` stub with read-only `parties` tab showing boundary parties, roles, and teams.

**Depends on:** Phase 7 (org navigation must exist). Independent of Phases 9-11 — can run in parallel with vendor profile work.

**Plan:** Plan 080 (Project-Centric Boundary Model)

**Requirements:** SC-1, SC-2, SC-3, SC-4, SC-5, SC-6 (success criteria detailed below)

**Success Criteria** (what must be TRUE):
1. My Orgs cards display Internal/External badge based on `whoAmI().ownerId === org.id` comparison
2. My Orgs cards show engagement count and project count badges
3. `/orgs/:orgId` overview shows engagements and projects grouped with navigation links
4. Project detail page has `parties` tab (replacing `members` stub) showing boundary parties from `platform.Boundary.listBoundaryParties` using `SmeMartProject.boundaryIds`
5. Parties tab shows party name, roles (`listBoundaryPartyRoles`), and teams (`listBoundaryTeams`) per boundary — all read-only
6. No boundary admin/CRUD operations in SME Mart (stays in ZB Governance)

**Plans:** 12-01-PLAN.md (created 2026-04-01)

**Canonical refs:**
- `.planning/director/DECISIONS.md` — Internal vs External detection, Project Members → Parties, Boundary Admin scope decisions
- `.planning/director/SESSION-STATE.md` — ZB APIs confirmed available (boundary party/role/team endpoints)

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 7. Org Navigation | 1/1 | Complete | 2026-03-31 |
| 8. Vendor Profile Schema | 1/1 | Executed, PR pending merge | 2026-04-01 |
| 9. Vendor Profile Service | 0/1 | Blocked on Phase 8 merge | — |
| 10. Vendor Profile UI | 0/1 | Not started | — |
| 11. Vetting Pre-Fill | 0/1 | Not started | — |
| 12. Project-Centric Boundary Model | 1/1 | Plan created | 2026-04-01 |

---

**Created:** 2026-03-30
**Last Updated:** 2026-04-01 (Phase 12 plan created)
