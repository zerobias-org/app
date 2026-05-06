# Phase 24 — Demo Data Visibility Gate

**Milestone:** v1.4 "3P Onboarding & Default Engagement"
**Est:** 4–6 hrs
**Repos:** `app/` (SME Mart only)
**Origin:** 3P plan 2026-04-22 → backlog 002 (demo-data-cleanup-and-visibility). Prereq for Phase 31 (W3Geekery dogfood) — real users must not see Crystal Harbor / Velvet Summit / Pinnacle Corp demo records.

## Goal

Hide demo-seeded records from non-admin users in SME Mart UI. Admins retain full visibility and gain an explicit "delete demo data" escape hatch. Demo data stays on UAT — this is an application-layer gate, NOT a destructive cleanup.

**Admin signal source:** consume `ProjectContextService.isAdmin$` (or whatever the equivalent observable / signal is named — verify by reading the service after Phase 27 closure). The admin flag is hydrated by `onboardingGuard` (Phase 27 Wave 2 patch `d4c542e`) via the MCP-verified contract `clientApi.danaClient.getOrgApi().getRequestOrgMember(orgMemberId)` returning `OrgMemberExtendedWithAdminFlag.admin: boolean`. Phase 24 services MUST NOT re-call the admin SDK directly — read from `ProjectContextService` so the admin signal stays centralized and consistent.

## Architecture

### Starting state
- Demo data currently visible to everyone (seeded via `src/app/test-helpers/demo-data-seeder.ts` + `scripts/demo/helpers.ts` → Pipeline.receive for class Objects; `hydra.Resource.*` for hydra-side resources).
- A hydra Tag `w3geekery.sme-mart.demo-seed` already marks hydra Resources created by the seeder.
- Class-Object records (Engagement, SmeMartProject, Bid, etc.) have had no tagging mechanism until 2026-04-24 — now resolved: `Object.tag` field accepts `[{ value: "<tag-uuid>" }]` at Pipeline.receive ingest time (see DECISIONS.md "Object.tag Field Shape").
- Admin detection locked AND wired: `clientApi.danaClient.getOrgApi().getRequestOrgMember(orgMemberId)` returns `OrgMemberExtendedWithAdminFlag.admin: boolean` (MCP-verified via `mcp__zerobias__zerobias_describe danaOld.Org.getRequestOrgMember`). Hydrated by `onboardingGuard` into `ProjectContextService.setIsAdmin()` as of Phase 27 Wave 2 patch `d4c542e`. Memory `project_sme_mart_admin_detection.md` was wrong (cited non-existent `getPrincipal().isAdmin`); CORRECTED 2026-04-30. See DECISIONS.md + `.planning/docs/SDK_VERIFICATION_SOURCES.md`.
- `/admin` route exists in app routing (Phase 27 Wave 3 commit `3756443`); admins land there post-onboarding-guard. Phase 24's admin delete-demo escape hatch route lives under `/admin` (e.g., `/admin/demo-data` — exact path is plan-author choice).
- **2026-04-29 update — global `demo` tag is now available** in `marketplace` tagType (zerobias-com/tag PR #1, merged by Daniel Rojas). Phase 24 implementation should prefer the global `demo` tag over the existing `w3geekery.sme-mart.demo-seed` for new demo records. Look up the global `demo` tag UUID via `hydra.Tag.searchTags({ name: "demo", type: "marketplace" })`. Existing records tagged with `w3geekery.sme-mart.demo-seed` stay (UUID-churn migration not worth it); the visibility gate filters on EITHER tag UUID for the transition. See DECISIONS.md "Marketplace tagType Is Preferred for New Tags".

### Deliverables

1. **Tag demo records at seed time.** Update `demo-data-seeder.ts` + `scripts/demo/helpers.ts` to include `tag: [{ value: "<demo-seed-tag-uuid>" }]` in every class-Object Pipeline.receive payload. Hydra Resources already get the tag applied — keep that.
2. **Retroactively tag existing demo records on UAT.** One-shot director brief (not a phase task): re-push the existing demo class-Object records via Pipeline.receive with the tag field populated. Not Phase 24's responsibility to ship the retroactive push, but Phase 24 must document the need.
3. **Visibility gate in the app.** In every GQL query and service call that lists/filters class-Object records, exclude records carrying the demo-seed tag UNLESS the current user is admin. The Object.tag filter syntax is `(tag: { value: ".ne.<demo-seed-tag-uuid>" })` — inverse RFC4515 (exclude records carrying the tag).
4. **Admin delete-demo escape hatch.** A clearly-labeled admin-only action (likely under Settings or an admin-only menu) that bulk-deletes demo records via `Pipeline.receive` with `markDeleted: [...]`. NOT enabled in production without explicit confirmation. Exact UI placement per the admin mental model Phase 28 / Phase 30 finalize — placeholder button is fine.
5. **Unit tests** scoped to the gate logic. Test matrix: admin-sees-demo, non-admin-doesn't-see-demo, admin-delete-demo-removes-records. Per `feedback_unit_tests_default_test_infra_deferred.md`, scope unit tests to touched files only.

## Requirements

- **DG-01:** `demo-data-seeder.ts` populates `Object.tag` with the demo-seed tag UUID on every class-Object Pipeline.receive push.
- **DG-02:** Core listing/search services filter OUT demo-tagged records for non-admin users via GQL `.ne.` filter on the tag field.
- **DG-03:** Admin (`projectContext.isAdmin$` emits `true`) retains full visibility — no filter applied. Subscribe via the centralized service; do NOT call the admin SDK directly in Phase 24 services.
- **DG-04:** Admin delete-demo action exists, bulk-`markDeleted`s all demo-tagged records via Pipeline.receive, and clears hydra Resources tagged `w3geekery.sme-mart.demo-seed`.
- **DG-05:** Unit tests cover the three gate scenarios.

## Dependencies

- Object.tag mechanism — VALIDATED 2026-04-24 (DECISIONS.md "Object.tag Field Shape"). No schema work required.
- Admin signal — `ProjectContextService.isAdmin$` (or equivalent — verify by reading the service after Phase 27 closure). DO NOT re-implement admin detection.
- Existing hydra Tag `w3geekery.sme-mart.demo-seed` — need its UUID; look up via `hydra.Tag.searchTags({ name: "w3geekery.sme-mart.demo-seed" })` or check memory.
- Retroactive re-push of existing demo records (director brief, runs alongside Phase 24 or before it).

## Verification

- Non-admin user logs in; demo engagements/projects/bids/reviews are not visible anywhere in UI.
- Admin user logs in; demo records are visible everywhere they used to be; delete-demo escape hatch is present.
- Admin triggers delete-demo; demo records disappear from UI; post-delete a non-admin view is empty of demo data too (or remains so).
- GQL filter confirmed at request level (network tab): `.ne.<demo-seed-tag-uuid>` present in the tag arg for relevant queries.

## Out of scope

- Destructive cleanup on UAT (this phase only application-layer-gates; Phase 24 does not delete records).
- Production demo data (prod has no demo seeder).
- Synthetic ACME demo — deferred to v1.5 backlog (phase 31 is the real dogfood).
- Rewriting the demo seeder's own data structure — only adding the `tag` field to each record.

## References

- DECISIONS.md "Object.tag Field Shape — Validated via UAT Experiment" (2026-04-24)
- `.planning/director/backlog/002-demo-data-cleanup-and-visibility.md`
- `.planning/director/backlog/005-sme-mart-entity-tagging-mechanism.md` (resolved — no schema PR needed)
- Memory: `project_sme_mart_admin_detection.md`
- Memory: `feedback_unit_tests_default_test_infra_deferred.md`
