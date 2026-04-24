# Director Decisions

## Default ZB Engagement Bootstrap — W3Geekery (proof-of-concept run, UAT)
**Date:** 2026-04-23 (walkthrough completed end-of-day)
**Decision:** Manual walkthrough of the default-ZB engagement creation recipe completed successfully on UAT. W3Geekery is the first proof-of-concept Org. Recipe is validated for batch generalization to all other existing platform Orgs.

**Created artifacts (canonical UUIDs):**

| Artifact | UUID | Notes |
|---|---|---|
| Hydra Tag (`zerobiasTagId`) | `a81cd320-243e-44eb-bdd9-9824019ef3dd` | Name: `sme-mart.eng.w3geekery-default-zb` |
| Engagement Task (meta-tracker, `zerobiasTaskId`) | `2c95bc18-a978-4766-a7d3-f7ceb8a9cff5` | Code: `aha1-6`. Activity: aha1 (Ad Hoc - One person, `e15830c8-4274-4d67-bf9b-c22b60001e32`). Tagged with engagement Tag. |
| Engagement (class-schema external UUID) | `746010b7-dc99-436b-9142-8c4b85c5e623` | Use this for GQL queries and cross-references in our recipe |
| Engagement (internal Object UUID) | `f5361821-4beb-4e1b-8d92-04bc243fa63a` | Platform-internal bookkeeping; visible via `boundaryObjectSearch`; do NOT use in our recipe except for diagnosis |
| SmeMartProject | `ea4db55f-2c57-4567-a1be-6e7fd1a210bf` | Name: "SME Mart Platform Development"; status `active`; projectType `project`; `engagementId` set to the Engagement external UUID |

**Pipeline used:** `43f08afd-7ab9-4e99-a93c-619c46adaabe` (current SME Mart receiver, NOT the v1.2 carry-forward `f6d1f579-...`).
**Boundary:** `c15fb2dc-4f8c-48b5-b27a-707bd516b005` (W3Geekery SME Marketplace DEV).
**Buyer org/user:** `cd7105df-523d-5392-9f9a-3f83d3f30107` (W3Geekery — same UUID as prod) / `3da9385a-5d15-4d19-84ab-e1c9ce8d84ed` (Clark).
**ZeroBias org UAT:** `57c741cf-a58e-5efc-bf2f-93c4f6cf76ec` (provider; not stored on Engagement since schema has no provider field).

**18 refinements surfaced during walkthrough** (folded into bootstrap brief at session end):

1. Brief L43–44 "UAT differs from prod" caveat wrong — org UUIDs match prod for both W3Geekery + ZeroBias
2. L48 stale pipeline ID `f6d1f579-...` — replace with current `43f08afd-...`
3. L50 "throwaway push health-check" skipped — Step C is the real test
4. Step B name generalized to `"Engagement coordination — <Buyer> <- ZeroBias"` (v1.4 hardcoding removed; meta-tracker is permanent, outlives milestone)
5. Step E category mismatch moot — Engagement no longer has `category` field per Plan 075
6. Step C field list trimmed per Plan 075 migration: removed `category`, `budgetType`, `budgetMin`, `budgetMax`, `timeline`; renamed `createdAt`/`updatedAt` → `dateCreated`/`dateLastModified`
7. "Platform" category idea dies for Engagement — `engagementTag = "default-project"` is the sole default-vs-marketplace distinguisher
8. No W3Geekery-owned activity exists — use global catalog `aha1` (Ad Hoc - One person, `e15830c8-...`)
9. Hydra Tag `type` defaulted to "other" — fine; engagementTag string field is what app filters on
10. Task default status `todo` — no `transitionId` needed for first transition
11. **CRITICAL:** Engagement `dateCreated`/`dateLastModified` are date type (YYYY-MM-DD), NOT datetime. Demo seeder at `src/app/test-helpers/demo-data-seeder.ts:52` uses `.toISOString()` — production bug. Audit + fix demo seeder.
12. GQL reads use RFC4515 filters in args (`Engagement(id: ".eq.<uuid>")`), NOT GraphQL `filter: { id: { EQ: ... } }` syntax
13. Step D mechanism: `hydra.Resource.tagResource(taskId, [zerobiasTagId])` — NOT `Task.update(links=)` or `linkResources` (FK-fail cross-realm; AuditgraphDB Class Objects aren't in hydra Resource table). Brief L129–136 full rewrite.
14. Memory `feedback_task_links_bidirectional.md` does NOT apply to tag-based linkage — one `tagResource` call achieves bidirectional discoverability
15. Pipeline.receive `tagIds` parameter does NOT tag ingested Objects (semantics still unclear, possibly tags batch-job record only)
16. Engagement has TWO identifiers: class-schema external ID (we push + cross-ref) + internal Object UUID (platform-internal). Batch idempotency check: GQL filter on `engagementTag = "default-project"` AND `buyerZerobiasOrgId = <orgUUID>`. NEVER use hydra `getResource` on class entities.
17. Pipeline.receive `tagIds` confirmed unclear/non-useful for class-Object discovery (Step G Front 1 verified)
18. `platform.Object.tag` exists as a write-only stub (no matching read API). Untested path: populate inherited `Object.tag` field via Pipeline.receive payload — shape TBD; ~30 min experiment to validate.

**Why:** Validated the recipe end-to-end with human supervision on every MCP call (Clark direction: no agent handoff for this kind of work). Recipe is now ready to either: (a) walk a second case (e.g., HIS) for additional generalization confidence, OR (b) encode as the batch script for all remaining orgs.
**Anti-pattern:** Trusting any prior memory note about engagement schema fields without re-verifying — Plan 075 migration moved fields from Engagement to SmeMartProject and our memory was 36+ days stale (`project_sme_mart_prod_schema.md`). Always cross-check via `platform.Class.getClass` for live schema before constructing Pipeline.receive payloads.



## v1.4 Milestone Shape — Brian Asks Are Placeholders, Not Blockers
**Date:** 2026-04-22
**Decision:** For v1.4 (3P Onboarding & Default Engagement) and going forward, requirements that depend on Brian input (pricing tiers, ToS/legal URLs, branding, opt-in vs auto behaviors, guild-tier rules) ship with sensible default placeholder values. Brian input is NOT a planning blocker. If he provides input later, the placeholders get refined; if not, the placeholders ship.
**Why:** Clark told me 2026-04-22 that Brian asks "come in drips and spurts and/or not at all" and explicitly does not consider those phases blocked. Treating Brian as a planning gate produces stalled milestones and wasted Director cycles. The CEO communication channel is Tue/Fri meetings + future ZB-platform-tasks via the W3Geekery↔ZB engagement; it is not a synchronous decision pipeline.
**Anti-pattern:** Director will want to mark phases as "soft-blocked on Brian" with "ask at next meeting" notes. Don't. Mark them unblocked, list the placeholder defaults explicitly in the phase brief, file an informational task in the W3Geekery↔ZB engagement so Brian can refine if/when he chooses.

## v1.4 Test-Infra Deferral and Unit-Test Default
**Date:** 2026-04-22
**Decision:** v1.4 contains zero test-infrastructure backlog items (082 data-testid, 052 P4 Playwright CI, 053 QA skills, etc.). Those wait for a dedicated test-infrastructure milestone. Unit tests for components touched by v1.4 phases are mandatory and baked into each plan as default tasks.
**Why:** Clark direction 2026-04-22. Bolting test-infra onto feature milestones produces split-focus milestones with no thematic coherence. Better to let test-infra accumulate as a backlog cluster and ship as one milestone whose theme IS testing. The unit-test-on-touch rule keeps coverage from rotting between infra milestones.
**Anti-pattern:** Director will be tempted to add "small wins" like data-testid sweeps because they "support Phase 31 verification." Resist — those rationales are how feature milestones become 30% test-infra by mass.

## v1.4 Backlog Adds — 046/066/065 as "Coming Soon" Placeholders
**Date:** 2026-04-22
**Decision:** Org Documents (046 remaining), Engagement Dashboard (066), Message Center (065) are NOT real-build items in v1.4. They render as "Coming Soon" placeholder UI surfaces in the Default Project Board (likely 3 disabled tab/card surfaces with placeholder copy) so the product feels complete to a 3PO landing on it. Real implementations soft-launch in v1.5+ after the initial onboarding ships.
**Why:** Clark direction 2026-04-22. v1.4 is about getting 3POs through the front door cleanly. Building 30+ hrs of supporting features before validating the front door risks shipping the wrong supporting features. The placeholder pattern lets us learn what real 3PO behavior calls for before committing implementation effort.
**Anti-pattern:** Director will want to "just slice in the small parts of 046/066/065 that fit" to make the dashboard feel real. Don't — that creates ambiguous shipped state where users wonder if the half-built thing is functional. Disabled-with-coming-soon-copy is honest; partial-functional is deceptive.

## SME Mart Admin Mechanism Is Decided — `getPrincipal().isAdmin`
**Date:** 2026-04-22 (memory landed; decision predates by months per Clark)
**Decision:** Admin detection uses `getPrincipal()` returning `OrgPrincipalWithAdminFlag` with `isAdmin` boolean. No alternative architecture will be proposed. Granular per-org admin scoping is a future enhancement of the same flag, not a different mechanism.
**Why:** Clark told me four times across sessions before I retained it. Persisted to project memory `project_sme_mart_admin_detection.md` and indexed in MEMORY.md so future sessions know.
**Anti-pattern:** Proposing `@zerobias.com` email convention, custom platform-role mapping, group-membership inference, or "ask Brian for admin role definition" as an open question. All wrong. Use the SDK call.

## Engagement Naming Convention: `<Buyer> <- <Provider>` (ASCII reverse-arrow, buyer-first, supply-flow direction)
**Date:** 2026-04-23 (revised same day after considering Demand/Supply vocabulary alignment)
**Decision:** Engagement records use the `name` field as the human-readable identifier of the buyer/provider direction since the schema has only `buyerZerobiasOrgId` (no provider field). Convention: `"<Buyer Org Name> <- <Provider Org Name>"`. ASCII reverse-arrow `<-` (not Unicode `↔` `→` `⇐`). Buyer named first (positional convention preserved from existing demo data); arrow points TOWARD the buyer indicating supply/satisfaction flowing from Provider to Buyer.

Rationale for arrow direction: Buyer is the 1st-class citizen — owner of the engagement and its projects, the Demand-side party. The Supplier exists to satisfy Buyer's demand. In the project's Demand/Supply vocabulary (memory `project_sme_mart_transparency_invariant.md`, BACKLOG CE4 Demand/Supply twin pattern), supply flows from Supplier to Demand. The arrow encodes that direction explicitly.

Examples:
- Default ZB engagement (W3Geekery's): `"W3Geekery <- ZeroBias"` (W3Geekery is buyer of ZB platform services)
- Marketplace engagement (W3Geekery hires HIS as auditor): `"W3Geekery <- HIS"` (W3Geekery is buyer of HIS auditor services)
- ZB as customer of W3Geekery dev services (hypothetical future): `"ZeroBias <- W3Geekery"` (ZB is buyer of W3Geekery dev services)

Existing demo engagement records use the older `↔` bidirectional convention (`"Pinnacle Corp ↔ W3Geekery"` etc.). Those are NOT being backfilled — Phase 24 (demo data visibility gate) will gate or delete them anyway. Apply the new convention to all NEW engagements going forward only.

ASCII over Unicode is per Clark's global preferences (`~/.claude/CLAUDE.md` ambiguous-width chars section): `<>`, `<->`, `->`, `<-`, `=>` over `↔`, `→`, `←`, `⇒`, `⇔`. Terminal display reliability + grep-ability.
**Why:** Clark direction 2026-04-23. Bidirectional `↔` was misleading — engagement relationships are asymmetric. Directional arrow needed. Director's first proposal was `Buyer -> Provider` (buyer-engages-provider reading); Clark countered with the supply-flow framing (`Buyer <- Provider`, supply flows toward buyer-as-Demand-owner). The supply-flow framing aligns with the project's own Demand/Supply vocabulary used throughout the transparency invariant and CE4 entanglement model — preferring the framing the project already uses for cross-party data relationships is more coherent than a separate engage/pay metaphor.
**Anti-pattern:** (a) Using `↔` in new engagement names "because that's what the demo data does." (b) Using `->` (forward arrow, buyer-first) — that was the Director's first instinct but loses the Demand/Supply alignment. (c) Backfilling existing demo records — they're being phased out by Phase 24. (d) Putting Provider first (e.g., `"ZeroBias -> W3Geekery"`) — loses the buyer-as-1st-class-citizen positional convention.

## Default ZB Engagement is Auto, Invariant, Compliance-Driven — NOT a Product UI Concern
**Date:** 2026-04-23
**Decision:** Every existing ZeroBias platform Org always has at least one engagement with ZeroBias (3PO=Buyer, ZB=Provider) by default. This is a side-effect of being a ZB platform customer and a ZB compliance requirement. The default ZB engagement is created automatically via org-detection, NOT via any user UI action. SME Mart maintains this invariant via (a) one-shot batch backfill for all existing platform orgs and (b) lazy-on-load reconciliation in the auth/routing layer for orgs added after the batch runs. Long-term, ZB platform itself will own this responsibility (likely at platform-onboarding time); SME Mart fills the gap until then.

Customers can additionally create as many marketplace engagements as their business requires (with vendors, auditors, other 3POs) via the existing Create Engagement UI. The Create Engagement UI stays — but it is for those marketplace engagements, NOT for the default ZB engagement. The default ZB engagement has no UI surface for creation; it just exists.
**Why:** Clark direction 2026-04-23. The earlier framing — "user opts in to creating their first engagement after company-info save" — was wrong on two axes: (a) the engagement is invariant, not optional; (b) the trigger is org-detection, not company-info-save (those are decoupled).
**Anti-pattern:** Adding a "Create Engagement" button or ToS gate or tier-picker step into the v1.4 onboarding flow specifically for the default ZB engagement. None of those belong in the default-engagement-creation path. They may live elsewhere (informational tier display on the project board, ToS in the platform sign-up flow that happens upstream) but NOT as gates on the default engagement.

## v1.4 Phase 29 Deferred to v1.5; Lazy-on-Load Guard Added to Phase 27 (v1.4)
**Date:** 2026-04-23
**Decision:** The v1.4 phase originally framed as "ZB offerings + first engagement creation" (Phase 29) loses its CREATION scope under the auto/invariant default-engagement directive (creation moves to batch + lazy-on-load). What remains is the human-facing CONTENT layer that goes WITH the default engagement once it exists:
- Pricing tier display on the default project board (informational — "you're on Free / Growth / Enterprise")
- ToS / Privacy / legal-doc link surfaces
- ZB branding (logo, tier-specific styling)

These remaining concerns ARE Brian-ask placeholders — pricing tiers, ToS URLs, branding assets — that he may or may not provide. Per Clark direction 2026-04-23, **Phase 29 (with its scope narrowed to display-layer placeholders) defers to v1.5.** v1.4 ships with a minimal default project board (Phase 30) that does NOT need the tier display / ToS / branding to function. v1.5 adds the human-facing content layer in a refocused Phase 29.

Pricing tier placeholder values that ARE needed in v1.4: the seeded `ServiceOffering` records created by Phase 26 (ZB-as-provider seed) need real numeric tiers. Defaults: Free / Growth $99/mo / Enterprise $999/mo. Those values live in the Phase 26 brief and ship even if Brian never confirms — they're data, not display.

The OTHER part of Phase 29's old scope — actual default-engagement-creation logic — moves out entirely:
- `.planning/director/batch-prime-engagements-for-existing-orgs.md` (one-shot brief, written after the W3Geekery walkthrough validates the recipe)
- A **lazy-on-load guard** in SME Mart's auth/routing layer — added to Phase 27 (v1.4) scope. Guard logic: on authed-user load, check if currentOrg has its default ZB engagement; if not, create it inline via the validated recipe; then proceed to engagement board. Idempotent — fires at most once per org's lifetime.

**Net v1.4 milestone shape: 7 phases (24, 25, 26, 27, 28, 30, 31).** Phase 29 deferred to v1.5.
**Why:** Direct consequence of the auto/invariant default-engagement decision above (creation logic disappears from UI), combined with Clark's "Brian asks come in drips, ship placeholders, prolly v1.5 is fine for the display-layer Brian-ask content."
**Anti-pattern:** (a) Trying to ship the tier-display / ToS / branding in v1.4 just because they were originally scoped there — they are display-layer polish that v1.4 doesn't need. (b) Forgetting the pricing-tier placeholder values that DO need to ship in v1.4 (data layer, lives in Phase 26's seeded ServiceOffering records).

## Data-Migration Work Goes in Director Briefs, Not GSD Phases
**Date:** 2026-04-22
**Decision:** One-shot data migrations and hand-executed MCP scripts (e.g., bootstrap engagement creation, batch pre-creation across all platform orgs, per-org LLM-prompt generation) belong in director-authored briefs at `.planning/director/{slug}.md`, NOT as `/gsd:add-phase` items. Briefs are runnable in a fresh Claude session by Clark or a gsd-executor with clean context, get traceability via DECISIONS.md updates after execution, but skip the ROADMAP/REQUIREMENTS/PLAN ceremony that GSD imposes.
**Why:** Clark direction 2026-04-22. GSD phase ceremony assumes UI/feature work where requirements, plans, and verification matter. Pure data-migration work has no user flow, no acceptance criteria beyond "records created", and benefits from being a self-contained brief that a fresh session can execute without loading milestone context. Padding milestones with migration phases dilutes their thematic coherence.
**Anti-pattern:** Director will be tempted to "make it official" by adding migrations as Phase 26.5 / 28.5 / etc. Don't — that creates fake phases with no real plan dependencies. Use briefs.

## Bootstrap-Recursion Collapses by Manual Engagement Creation
**Date:** 2026-04-22
**Decision:** Before v1.4 onboarding flow ships, the W3Geekery↔ZeroBias dev-services Engagement + default Project will be created manually via MCP / Pipeline.receive on UAT (later promoted to prod when ZB rebuilds the dev server). This opens the dogfood communication channel TODAY, not when Phase 31 ships. All v1.4 cross-org communication (Brian asks, Kevin escalations, Andrey nags) flows through ZB-platform-tasks in this engagement immediately.
**Why:** Clark observation 2026-04-22 — if we're building the channel, we should be using the channel (or its manual equivalent) to coordinate building it. Eliminates the "no channel until Phase 31" caveat and provides a real artifact to dogfood through every subsequent v1.4 phase. Buyer = ZeroBias; Provider = W3Geekery (dev services). NOT the same engagement as the eventual ZB-as-platform-tenant default-engagement that Brian's directive describes for paying customers — those are two different engagement concepts.
**Anti-pattern:** Confusing this dev-services engagement with the "default-project" engagement Brian directed for ZB-as-platform-tenant onboarding. Different tags (`w3geekery-services` or similar vs `default-project`), different buyer/provider direction (W3Geekery=provider here vs W3Geekery=buyer there).



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

**Update 2026-04-15:** As of Phase 18 Plan 18-03, **no filtering is applied** in SME Mart. Platform `hidden: true` flag is effectively useless (universal `true` on UAT orgs), System Org and ops-org exclusions are not worth the code for admin-only marketplace usage. `OrgSwitcherService.orgs$` and `org-list.component.ts` both surface the full `listMyOrgs()` result (alphabetical). Revisit when Kevin/Chris clarify platform `hidden` semantics — tracking **errata 014** + Chris Slack thread.

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
