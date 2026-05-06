# Phase 30 — Default Project Board + "Coming Soon" Placeholder Surfaces

**Milestone:** v1.4 "3P Onboarding & Default Engagement"
**Est:** 6–8 hrs (including the 3 "Coming Soon" placeholder surfaces)
**Repos:** `app/` (SME Mart frontend).
**Origin:** 3P plan — users land on the default project board after onboarding. DECISIONS.md "v1.4 Backlog Adds — 046/066/065 as Coming Soon Placeholders": 3 unfinished feature areas ship as disabled "Coming Soon" surfaces so the product feels complete without committing implementation effort.

## Goal

A functional default project board that the authenticated, onboarded user lands on. Shows the default ZB engagement's default project (from Phase 26 seed) as the primary content. Three auxiliary surfaces — Org Documents, Engagement Dashboard, Message Center — render as clearly-labeled "Coming Soon" placeholders with honest copy, not half-built functional UI.

## Architecture

### Starting state
- Phase 26 seeds the ZB-as-provider default project under the default engagement (`SmeMartProject` record exists, linked to the Engagement via `engagementId`). Post-2026-04-27 W3Geekery remediation, default projects also have `Object.tag` populated with the engagement tag UUID — so default-project discovery is queryable two ways: by `engagementId` link OR by `Object.tag .eq.` GQL filter against the engagement tag.
- Phase 27 routes confirmed users here. **Plan MUST consume Phase 27's onboarding-complete redirect target as a locked contract input** rather than pinning a route name. Phase 27 Wave 3 (27-04 routing wire-up) is the source of truth for the actual route — verify against the merged Wave 3 commit before encoding.
- Phase 28 (closed 2026-04-30) sets the onboarding-complete marker via `MarketplaceProfileService.getCompletionStatus()`. Phase 27 reads this to gate the redirect to the default project board.
- 3 "Coming Soon" feature areas are scoped BY Clark direction:
  - **046** — Org Documents (document management, sharing)
  - **066** — Engagement Dashboard (aggregated engagement metrics)
  - **065** — Message Center (cross-party messaging)
- Per DECISIONS.md, all 3 are v1.5+ real-build items.

### Discovery contracts (consumed inputs)

**Default engagement lookup** — `org -> default engagement` via Hydra Tag query: `Engagement(tag: { value: ".eq.<engagement-tag-UUID>" })`. The engagement tag UUID is per-org and seeded by Phase 26. Plan author should locate the existing helper if one exists (likely in `bootstrap-service` or `pipeline-write` neighborhood) — do NOT reinvent the GQL query.

**Default project lookup** — once the engagement is resolved, `SmeMartProject(engagementId: "<engagement-uuid>")` returns the default project. Single-result expected; assertion >=1 record is fine.

**Engagement header content** — `engagement.name` is canonically formatted `<Buyer Name> <- <Provider Name>` (ASCII reverse-arrow, supply-flow direction; see DECISIONS.md "Engagement Naming Convention"). Render as-is; do not reformat.

**SmeMartProject rendering — DISCOVERY FLAG.** Plan author MUST first determine whether existing SmeMartProject component rendering exists in the app (search for `SmeMartProject` consumers, project-related routes, project-detail components). If it exists and is reusable, the 6–8 hr estimate holds. **If it does not exist or is too coupled to a different context to reuse, the estimate is invalid — surface as a plan-time blocker for Director re-scope.** Do not silently build a net-new project-detail component as part of this phase.

### Deliverables

1. **Default project board route + component** (`src/app/default-project-board/*`). Entry point per Phase 27 routing. Shows:
   - Engagement header (name, description). No tier display — that's deferred to v1.5 pending Brian's tier-structure decision (see DECISIONS.md "ServiceOfferings Defer With Brian").
   - Default project content — whatever SmeMartProject rendering SME Mart already uses, parameterized for the default project ID.
   - 3 navigation/tab surfaces: Org Documents, Engagement Dashboard, Message Center.
2. **3 "Coming Soon" placeholder surfaces.** Each is a standalone Angular component + route:
   - Disabled-looking styling (grey-out, subtle lock/clock iconography).
   - Clear headline: "Org Documents — Coming Soon" (similar for 066 / 065).
   - Short paragraph explaining what the feature will do when available (1–2 sentences per surface).
   - Optional: "Notify me when ready" button — **toast-only for v1.4** (e.g., MatSnackBar "We'll let you know when this is ready"). The tag-on-MPI variant adds Pipeline.receive complexity that is not justified for placeholder surfaces.
   - Links back to the default project board.
3. **Navigation integration.** The 3 surfaces are reachable from the default project board (tabs, cards, sidebar — whichever fits existing SME Mart nav patterns). If a user deep-links to them outside the board, they render the same placeholder — not a 404.
4. **Unit tests** for: default board renders with the seeded project, 3 Coming Soon components render their placeholder content, navigation links resolve correctly.

## Requirements

- **PB-01:** Authenticated onboarded users land on `/projects`, the route slot reserved by Phase 27 Wave 3 (commit `3756443`). Phase 30 replaces the placeholder `ComingSoon` component at that route with the full default project board. The route MUST sit under `AppShell` so `onboardingGuard` continues to gate access.
- **PB-02:** Default project content (name, description, any existing SmeMartProject widgets) renders for the seeded default project.
- **PB-03:** 3 "Coming Soon" surfaces exist as components + routes, each with its own disabled-styled placeholder content.
- **PB-04:** Coming-Soon surfaces are reachable from the board AND deep-linkable.
- **PB-06:** No half-built functional UI in the 3 Coming-Soon surfaces — they are honest placeholders only.
- **PB-07:** Unit tests cover the board + each placeholder component's rendering.

**Removed from scope (see DECISIONS.md):** PB-05 (tier placeholder banner) — deferred until Brian confirms tier structure.

## Dependencies

- Phase 26 default project seed (the project rendered on this board).
- Phase 27 routing (lands users here).
- Phase 28 complete marker (Phase 27 requires it to route here).
- ngx-library components for consistent disabled-state styling (ZbEmptyStateContainerComponent is a likely fit per CLAUDE.md).

## Verification

- Log in as a confirmed user → lands on the default project board.
- Default project content matches Phase 26 seed (name: "SME Mart Platform Development" for W3Geekery; real values per the seeded Org).
- Click "Org Documents" → Coming Soon placeholder; navigate back to board works.
- Direct URL `/org-documents` → same placeholder renders.
- Nothing crashes if the default project is missing — fall back gracefully with a "default project is missing, please contact support" inline message (Phase 27 should have prevented this, but defensive UX).

## Out of scope

- Real implementation of 046 (Org Documents) / 066 (Engagement Dashboard) / 065 (Message Center) — all v1.5+.
- Tier display entirely — including placeholder banner — deferred until Brian confirms tier structure (DECISIONS.md "ServiceOfferings Defer With Brian").
- Real tier enforcement / billing / upgrade flow (v1.5+).
- Multi-engagement switching on the board (v1.5+; default engagement is the only scope for v1.4).
- Board customization / widget rearrangement (v1.5+).

## References

- DECISIONS.md "v1.4 Backlog Adds — 046/066/065 as Coming Soon Placeholders"
- DECISIONS.md "ServiceOfferings Defer With Brian — Data-Model Brian Asks Block, Copy/Branding Don't" (2026-04-24 — why PB-05 is removed)
- DECISIONS.md "v1.4 Phase 29 Deferred to v1.5" (display-layer concerns deferred broadly)
- BACKLOG.md entries 046, 066, 065 (full context for the deferred features)
- ngx-library: `ZbEmptyStateContainerComponent` + `ZbSimplePanelComponent` (likely building blocks)
