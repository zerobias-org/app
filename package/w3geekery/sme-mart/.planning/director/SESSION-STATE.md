# Director Session State
**Last updated:** 2026-04-01T10:00:00-07:00
**Milestone:** v1.1 (Org Navigation & Vendor Profile) — active
**Phase focus:** Phase 7 (complete), Phase 8 (complete, PR pending merge), Plan 080 (designed)

## Mental Model

SME Mart is undergoing two parallel structural shifts:

**1. Multi-org + vendor profiles (Plans 079, 041):** Moving from single-org to multi-org reality. Vendor profiles are org-scoped. Phase 7 (org navigation) shipped. Phase 8 (schema PR) submitted. Phases 9-11 (service, UI, vetting pre-fill) await schema merge.

**2. Project-centric boundary model (Plan 080, Brian CRITICAL):** Orgs are strictly legal entities (same email domain + IDP/2FA). External parties interact through boundary permission sets within projects. This doesn't replace orgs — it adds the internal/external distinction and surfaces boundary parties on projects. Kevin confirmed the platform already supports this via boundary party/role/team APIs.

Key architectural insight: `user.ownerId === org.id` → internal member. `user.ownerId !== org.id` → external party invited via boundary. The `whoAmI()` response provides `ownerId`, `listMyOrgs()` provides each org's `id`.

## Design Decisions (Plan 080 — Complete)

- **Internal/External detection:** `whoAmI().ownerId` vs `org.id` — simple string comparison
- **My Orgs enhancement:** Internal/External badge on org cards. Engagement/project count badges. `/orgs/:orgId` shows engagements + projects grouped with nav links.
- **Project parties tab:** Replace existing `members` stub route → `parties`. Read-only boundary view using `boundaryIds` from SmeMartProject schema. Show parties, roles, teams per boundary.
- **Boundary admin stays in ZB Governance:** SME Mart is read-only for boundary info.
- **No engagement changes:** No stubs to replace on engagement detail.
- **Deferred:** Project context switcher (replaces org switcher), sub-project nesting, permission cascading, boundary admin in SME Mart.

## Design Decisions (Plan 041 — Complete)

- Single `MarketplaceProfileItem` entity with section discriminator + JSON data
- 6 sections, org-scoped, pointer-based engagement references
- Schema PR submitted (Phase 8), awaiting merge

## Design Decisions (Plan 079 — Complete, Phase 7 Shipped)

- Three-tier org navigation shipped: `/orgs`, `/orgs/:orgId`, `/org`
- Phase 7 gap closure wired live APIs

## ZB APIs Confirmed Available

| Need | API | Service |
|------|-----|---------|
| User identity + ownerId | `danaOld.Me.whoAmI` | danaOld |
| List user's orgs | `danaOld.Me.listMyOrgs` | danaOld |
| List boundary parties | `platform.Boundary.listBoundaryParties` | platform |
| Get boundary party | `platform.Boundary.getBoundaryParty` | platform |
| List boundary party roles | `platform.Boundary.listBoundaryPartyRoles` | platform |
| List party roles by boundary | `platform.Boundary.listBoundaryPartyRolesByBoundaryId` | platform |
| List boundary teams | `platform.Boundary.listBoundaryTeams` | platform |
| Create boundary party | `platform.Boundary.createBoundaryParty` | platform |
| Create boundary party role | `platform.Boundary.createBoundaryPartyRole` | platform |
| Join boundary | `danaOld.Me.joinBoundary` | danaOld |

## Existing Codebase (080-relevant)

- `SmeMartProject` schema has `boundaryIds` field (multi-value, scalar IDs)
- Project detail page exists at `/project/:id` with tabs via `project.routes.ts`
- `members` route exists pointing to `ProjectComingSoonTab` — THIS IS THE STUB TO REPLACE
- My Orgs page (`/orgs`) built in Phase 7 — needs enhancement for internal/external badges + counts
- Engagement detail has NO member/user stubs to replace

## What to Do on Resume

- Plan 080 is designed. Add as new phase to current milestone via `/gsd:add-phase`.
- Phase 8 PR pending merge — monitor for schema reload (~15 min after merge).
- After schema merge: Phases 9-11 (vendor profile service/UI/vetting) can proceed.
- Phase for 080 can run in parallel with vendor profile phases (independent work).
