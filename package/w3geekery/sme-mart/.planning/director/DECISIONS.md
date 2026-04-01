# Director Decisions

## VendorProfileItem: Single Entity with Section Discriminator
**Date:** 2026-03-30
**Decision:** Use one `VendorProfileItem` GQL entity with `section` discriminator + JSON `data`, rather than separate entity types per section.
**Why:** 6 sections with different shapes (corporate_identity, attestation, insurance, reference, personnel, financial) but 16-hour budget. Separate entities give typed fields and better querying but cost 4-6 new schema classes + services + tests. Single entity with JSON is buildable in budget.
**Anti-pattern:** Agent may try to create separate models/services per section. Keep it as one service with section-aware logic.

## Org-Scoped Profiles, Not User-Scoped
**Date:** 2026-03-30
**Decision:** Vendor profiles belong to the org. Multiple users contribute. Profile items keyed by `org_id`.
**Why:** Corporate docs (insurance, D&B, entity verification) are org-level by nature. Brian's vision: "load my vendor stuff one time" means the org loads once, not each user. Different org members handle different sections (compliance officer, CFO, HR).
**Anti-pattern:** Agent may default to user-scoped data (current My Profile pattern). Profile items must be org-scoped.

## Pointer-Based Engagement References
**Date:** 2026-03-30
**Decision:** Engagement vetting items reference org profile items via `profile_item_id`. No document copies.
**Why:** When org updates a cert (renewal), all active engagements referencing it see the current version. Copies would go stale. Expired items flagged everywhere simultaneously.
**Anti-pattern:** Agent may copy `document_ids` from profile to vetting item (current pattern). Must use indirection through `profile_item_id`.

## Engagement-Specific Docs Stay Engagement-Scoped
**Date:** 2026-03-30
**Decision:** Executed MSAs, SOWs, NDAs are engagement-scoped. Not profile items. Template→Instance workflow deferred to Plan 054.
**Why:** These documents don't exist until the engagement exists. They may start from org-level templates but the executed/signed version is unique to the engagement.
**Anti-pattern:** Agent may try to put everything in the org profile. Only reusable corporate docs go there.

## My Organizations Refactor is Prereq for 041
**Date:** 2026-03-30
**Decision:** Plan 079 must ship before Plan 041. Current My Orgs page only shows single org.
**Why:** 041's profile management UI lives under My Orgs → [org] → Corporate Profile. Need multi-org navigation first. ZB users belong to many orgs with different roles.
**Anti-pattern:** Agent may try to put profile management under current single-org page or under My Profile (user-level).

## Three-Tier Org Navigation
**Date:** 2026-03-30
**Decision:** `/orgs` (list all), `/orgs/:orgId` (read-only overview), `/org` (current org full profile). The `/org` route is preserved, not replaced.
**Why:** `/org` is the management page for the active org — full tabs, editable, where 041's Corporate Profile lives. `/orgs/:orgId` is a lightweight read-only view that works for any org the user belongs to. Separating them means viewing another org doesn't accidentally switch context.
**Anti-pattern:** Agent may try to merge `/org` and `/orgs/:orgId` into one route with conditional editing. Keep them separate — different purposes, different permission models.

## Org Switching is Placeholder Until Platform Auth
**Date:** 2026-03-30
**Decision:** "Switch to this Org" button exists in UI but is disabled/stubbed. `danaOld.Org.selectOrg` is the real endpoint. Current local dev is locked to one API key = one org/user.
**Why:** Can't test org switching without session-based auth. API key auth hardcodes the org. Publishing to ZeroBias platform (session auth) is the prereq.
**Anti-pattern:** Agent may try to implement switching by changing sessionStorage `zb-current-dana-org-id` directly. That would desync from the server session. Must use `selectOrg` when available.

## Org List Filtering Rules
**Date:** 2026-03-30
**Decision:** Hide `hidden: true` orgs, System Org (all-zeros UUID), and ops orgs (slug/name contains "operations"). Show all other orgs the user is a member of.
**Why:** System Org and Ops orgs are platform internals, not SME Mart user-facing. `hidden: true` is the platform's own visibility flag. SME Mart users shouldn't see infrastructure orgs.
**Anti-pattern:** Agent may show all orgs from `listMyOrgs` unfiltered. Must apply these filters.

## Internal vs External Org Membership (Plan 080)
**Date:** 2026-04-01
**Decision:** `whoAmI().ownerId === org.id` → internal member. `whoAmI().ownerId !== org.id` → external party (invited via boundary/project). Display as badge on org cards.
**Why:** Brian edict (2026-03-31): org = strictly legal entity (same email domain + IDP/2FA). Anyone outside that domain is external. The platform already models this — `ownerId` on the user principal is their home org.
**Anti-pattern:** Agent may try to check email domains or group membership to determine internal/external. Just compare `ownerId` to `org.id`.

## Project Members → Parties (Plan 080)
**Date:** 2026-04-01
**Decision:** Rename project `members` route to `parties`. Replace `ProjectComingSoonTab` stub with read-only boundary party view. Show parties, roles, teams from boundary APIs.
**Why:** Brian: boundaries are the security construct, not orgs. "Members" implies org membership. "Parties" matches ZB platform nomenclature (`listBoundaryParties`, `createBoundaryParty`).
**Anti-pattern:** Agent may create a custom members service or try to list org members for the project. Must use boundary party APIs (`platform.Boundary.listBoundaryParties`, etc.) keyed off `SmeMartProject.boundaryIds`.

## Boundary Admin Stays in ZB Platform (Plan 080)
**Date:** 2026-04-01
**Decision:** SME Mart only surfaces read-only boundary info. All boundary CRUD (creating parties, assigning roles, managing teams) happens in the ZB platform Governance app.
**Why:** Boundary management is a platform capability, not a marketplace feature. Building admin UI in SME Mart would duplicate Governance app functionality and create sync issues. Clark and Brian agreed to keep it read-only.
**Anti-pattern:** Agent may try to build party invitation or role assignment UI in SME Mart. Must be read-only — no create/update/delete boundary operations.

## Project Context Switcher Deferred (Plan 080)
**Date:** 2026-04-01
**Decision:** The org switcher will eventually become a project switcher (grouped by engagement). Deferred — needs more UX design work.
**Why:** Every project has an owner org (even private projects), so project→org context is always derivable. But the UX for private vs shared vs multi-org projects in a dropdown needs thought. Brian wants this but it's not blocking the boundary party work.
**Anti-pattern:** Agent may try to build an org switcher or project switcher as part of this phase. Out of scope.
