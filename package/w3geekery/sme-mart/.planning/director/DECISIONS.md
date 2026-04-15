# Director Decisions

## Phase 17 Wired via Parent-Session MCP (Option B over A)
**Date:** 2026-04-15
**Decision:** When gsd-executor returned Phase 17 code with stubbed MCP calls, chose Option B (rewrite helpers to use real ZeroBias SDK, standalone CLI) over Option A (execute seed one-shot via parent-session MCP, leave CLI as scaffolding).
**Why:** Plan 17-01's must-haves say `npm run demo:seed` exits non-zero on API failure — that's a standalone-CLI promise. Option A would close Phase 17 with an inert CLI + commit message claiming it works. Same commit-claim drift pattern as today's schema post-mortem. Time cost 1-2hr was acceptable; the reproducibility and future reusability made it cheaper than reopening Phase 17 later.
**Anti-pattern:** Agent may be tempted to take Option A "just for the demo data" when the schedule feels tight. Resist — the CLI existence is the long-term artifact, the demo data is incidental.

## Separate Code and Closeout Commits for Phase 16/17
**Date:** 2026-04-15
**Decision:** Phase 16 closeout (`da8867e`) and Phase 17 closeout (pending, owned by gsd-execute) split the "code works" fix commit from the "ROADMAP/STATE marked complete" commit. Each phase gets two commits, not one.
**Why:** Today's schema post-mortem documented a failure mode where a commit message claimed work was done but the actual edits weren't staged (9c81a4e in schema repo). If code and closeout are in one commit and the code gets reverted, the closeout lies. Separating them lets a revert of just the code leave the closeout's "complete" claim as a false positive that's easy to audit. Separation is cheap insurance.
**Anti-pattern:** Agent will want to bundle everything into one commit for conciseness. That saves 30 seconds and adds real audit risk.

## Plans 087 (Template Library) and 088 (Split-screen Builder) as Separate v1.3 Phases
**Date:** 2026-04-14
**Decision:** Form Template Library (save → reuse → fork-on-edit) and Split-screen Form Builder (+ 'info' field type) are both new phases, not inline extensions of Phase 16. Added to `.planning/BACKLOG.md` with `/gsd:plan-phase` prompts ready.
**Why:** Phase 16 is already 5 plans / 18-22 hrs. Adding template library (20-30 hrs — schema + service + library page + wizard integration + Org Documents integration) or split-screen redesign (18-24 hrs — two-pane layout + new field type + preview simplification + split-button add-field) would double the phase. Separate phases also allow template library to ship before split-screen redesign, or vice versa, based on business priority.
**Anti-pattern:** Agent may want to cram "small UX improvements" into Phase 16 post-ship. The post-UAT walkthrough surfaced 5+ ideas; each must stand alone or go into a new phase, not backfill the closed one.

## Director Does Not Edit GSD Artifacts (Skill Boundary Enforcement)
**Date:** 2026-04-15
**Decision:** Reaffirmed: director MUST NOT write to ROADMAP.md, STATE.md, PLAN.md, SUMMARY.md, REQUIREMENTS.md, PROJECT.md, VERIFICATION.md. Skill line 164-167 is explicit. Channel for communicating state changes is `.planning/director/errata/` + briefs to `/gsd:add-phase` + clear instructions to the user.
**Why:** The boundary protects GSD's state machine. If the director edits ROADMAP, gsd-verify/gsd-next/gsd-check may disagree and overwrite, causing lost work or inconsistent state that blocks commands. Also: the director's lack of GSD context (e.g., how gsd-verifier formats VERIFICATION.md) means director edits risk breaking downstream GSD parsing.
**Anti-pattern:** Director slips into "just fix the stale text" task-mode and edits directly. Errata 009 documents this session's two violations (c6fbb6b ROADMAP, da8867e VERIFICATION). Fix: always file errata, tell user the GSD command, never touch the file.

## v1.2 Milestone Scope: RFP Packages + Document Templates + Pilot Projects
**Date:** 2026-04-02
**Decision:** v1.2 focuses on three items: (1) Plan 054 MVP — closed/invitation-only RFPs + multi-document packages (D1, D2). Form builder (D3) and destruction attestation (S2) deferred to v1.3. (2) Plan 046 partial — cherry-pick document templates + preview from remaining phases to enable 054's template→instance workflow. (3) Plan 077 — Pilot Projects (Brian asked 2026-03-27). LLM-assisted bid generation (033 P5) deferred to v1.3 as it builds on 054.
**Why:** 054 is the highest business value unblocked feature — transforms RFPs from Craigslist-style postings into structured packages. 046 partial provides the template infrastructure 054 needs. 077 is a quick Brian-requested win. Total ~32–36 hrs (~2.5 weeks at 15 hrs/week). The platform mapping work (Brian→platform construct alignment) is a design deliverable, not code.
**Anti-pattern:** Agent may try to build the full form builder (D3) or destruction attestation workflow (S2) — those are explicitly out of scope for v1.2 MVP. Agent may try to build custom document storage — documents use existing org document infrastructure from Plan 046.

## Form Builder is a Reusable Component (Not RFP-Specific)
**Date:** 2026-04-02
**Decision:** The form builder (D3) must be built as a reusable, context-agnostic component. It's not "RFP form builder" — it's a generic dynamic form builder/renderer that takes a JSON field config and renders Angular Material form fields. First use: buyer defines submission requirements on an RFP. Future uses: vendor defines resource requirements during engagement (S3 access, API credentials, VPN, schedule), vetting checklists, any structured data collection in the marketplace.
**Why:** Supply side also has requirements. Brian's transparency entangled task pairs (3/24 meeting) will need structured forms on both sides. Building it RFP-specific would mean rebuilding it when vendor requirements come.
**Anti-pattern:** Agent may put the form builder inside the RFP module/folder. It should be a shared component (`src/app/shared/` or `src/app/components/form-builder/`) that RFP imports, not owned by RFP.

## Demo Seed Scripts for Friday UI Demos
**Date:** 2026-04-02
**Decision:** Every milestone ships with runnable demo seed/cleanup scripts. For v1.2: a CLI script (node/ts) that creates a realistic RFP package (compliance engagement, documents attached, vendor invited, bid submitted) via ZB MCP/Platform APIs. Cleanup script deletes everything. Clark walks Brian through the UI showing the seeded state, then demos vendor flow manually.
**Why:** Brian needs to see features in action on Fridays. Manual setup before each demo is error-prone and slow. Scripts also double as integration testing — if the seed script breaks, something is wrong.
**Anti-pattern:** Agent may try to build Playwright UI automation for the demo. That's brittle and slow to maintain. Seed scripts create state via API; the demo is a manual UI walkthrough of that state.

## Map Brian's Vision to Existing Platform (Cross-Milestone)
**Date:** 2026-04-02
**Decision:** Brian's boundary/permission vision maps onto existing ZeroBias platform constructs. No platform changes needed. SME Mart builds UI that surfaces what's already there.
**Why:** Brian describes the right outcomes (boundary-scoped permissions, cross-org collaboration via projects, external parties interacting through boundaries) but incorrectly believes the platform needs to change. Kevin confirmed (2026-04-02): boundaries control operational permissions (tasks, collected data, hub module operations) — not a general policy engine, but sufficient for SME Mart. Platform Security Guide (kb9) documents the full Resource Authorization model. All boundary party/role/team APIs already exist.
**Anti-pattern:** Agent may try to design custom permission systems, propose platform feature requests, or build workarounds for "missing" APIs. Always verify via `zerobias_search` before concluding an API doesn't exist. See ORG-07 lesson.

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
