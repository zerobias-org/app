# Phase 24: Demo Data Visibility Gate — Context

**Gathered:** 2026-04-30
**Status:** Ready for planning
**Source:** Director brief (`.planning/director/phase-24-brief.md`) + MCP-verified facts

<domain>
## Phase Boundary

Hide demo-seeded records from non-admin users in SME Mart UI. Admins retain full visibility and gain an explicit "delete demo data" escape hatch. Demo data stays on UAT — this is an **application-layer visibility gate**, NOT a destructive cleanup.

**In scope:**
- Tag class-Object demo records at seed time (`Object.tag` field at Pipeline.receive)
- Apply GQL `.ne.` filter on Object.tag in every listing/search service for non-admin users
- Admin escape hatch: `/admin/demo-data` (or similar admin route — plan-author choice) with bulk `markDeleted` action
- Unit tests covering the three gate scenarios (admin-sees-demo / non-admin-filtered / admin-delete)

**Out of scope:**
- Destructive cleanup on UAT (we gate, we don't delete by default)
- Production demo data (prod has no demo seeder)
- Synthetic ACME demo (deferred to v1.5)
- Rewriting demo seeder data structure (only adding `tag` field)
- Retroactive re-push of existing demo records (separate director brief, runs alongside or before Phase 24)

</domain>

<decisions>
## Implementation Decisions

### Tag UUIDs (LOCKED — pinned via MCP `hydra.Tag.searchTags` 2026-04-30)

- **Global `demo` tag (PREFERRED for new records):** `81053c14-a8e5-4939-b538-c122c7d0eb1a`
  - Type: `marketplace`
  - Scope: `global` (ownerId `00000000-0000-0000-0000-000000000000`)
  - Color: `#FF7500`
  - Per DECISIONS.md "Marketplace tagType Is Preferred for New Tags" — use this for all NEW demo records.
- **Legacy `w3geekery.sme-mart.demo-seed` (TRANSITION):** `d618b602-21cc-40a1-a9fa-534b7bc1672c`
  - Type: `other`
  - Scope: `org` (ownerId `57c741cf-...` = ZeroBias)
  - Existing records keep this tag (UUID-churn migration not worth it).

**Filter must exclude EITHER UUID** for the transition period (DG-02). Encode both UUIDs as constants — do NOT hardcode in service queries.

### GQL Multi-UUID Exclusion Filter — PINNED 2026-05-01 (Decision-Probe-1)

**Status:** Director runs the probe manually before Plan 24-03 fires. Plan 24-01 carries a CONDITIONAL shell task that materializes only on probe FAIL.

**The filter shape problem.** `GraphqlReadService.GqlQueryOptions.filters` is typed as `Record<string, string>` (`src/app/core/services/graphql-read.service.ts:35-36`) and `buildQuery` serializes one literal per field key (`src/app/core/services/graphql-read.service.ts:173-176`). Two `.ne.` filters on `tag` would key-collide. Two viable shapes:

- **Approach A — single-string `.not in.` form** (preferred):
  - One filter value: `"tag": ".not in.<uuid1>,<uuid2>"`
  - Fits the existing `Record<string, string>` shape unchanged.
  - **Unverified** against ZB GQL backend; no precedent in repo (grep returned 0 matches in `src/app`).
- **Approach B — extend `GqlQueryOptions.filters` to `Record<string, string | string[]>`** (fallback):
  - Modify `buildQuery` to serialize each `string[]` as multiple GQL args on the same field.
  - Higher blast radius (touches the central seam); requires its own task.

**Decision-Probe-1 (Director-run, pre-Plan-03):**
- Run a one-shot ZB MCP query against UAT GQL with a `.not in.<uuid1>,<uuid2>` filter on a known-tagged class.
- If query succeeds and returns zero records carrying either UUID: probe **PASS** → Plan 24-01 conditional task stays empty / is removed; Plan 24-03 proceeds with Approach A.
- If query errors or returns wrong results: probe **FAIL** → Director fills the conditional task body in Plan 24-01 (extend `GqlQueryOptions.filters` to `Record<string, string | string[]>` and update `buildQuery`), then Plan 24-03 proceeds with Approach B.

**Plan 24-03 must NOT begin until Decision-Probe-1 has been run.**

The pre-existing speculative description below (a/b/c bullets) is superseded by this pinning.

### Admin Signal (LOCKED — verified by reading source 2026-04-30)

- **API:** `ProjectContextService.isAdmin()` — Angular **Signal<boolean>**, NOT an Observable
  - File: `src/app/core/services/project-context.service.ts`
  - Read by calling: `projectContext.isAdmin()`
  - Imported via field-level `inject(ProjectContextService)`
- **Hydration:** `onboardingGuard` (`src/app/core/guards/onboarding.guard.ts:79-88`) calls `clientApi.danaClient.getOrgApi().getRequestOrgMember(userId)` and pushes `.admin` into `projectContext.setIsAdmin()`
- **Despite the name "ProjectContextService", it is `providedIn: 'root'`** — app-wide singleton; safe to consume from any service.
- **Phase 24 services MUST NOT re-call the admin SDK directly.** Always read via `ProjectContextService.isAdmin()`. Centralized signal prevents drift.
- Memory entry `project_sme_mart_admin_detection.md` had the wrong API (`getPrincipal().isAdmin`) for ~7 days. Corrected 2026-04-30.

### Object.tag Field Pattern (LOCKED — DECISIONS.md "Object.tag Field Shape", 2026-04-24)

- **Write at ingest:** `Pipeline.receive` payload includes `tag: [{ value: "<tag-uuid>" }]`
- **Read filter (exclude):** GQL filter `tag: { value: ".ne.<tag-uuid>" }` — RFC4515 inverse
- **Two UUIDs to exclude:** filter must NOT match EITHER global `demo` OR legacy `w3geekery.sme-mart.demo-seed`. Plan-author to choose between:
  - (a) Two `.ne.` filters AND'd
  - (b) Single `.not in.` filter (verify GQL support during research)
  - (c) Server-side helper (verify backend support during research)

### Admin Delete-Demo Action (DG-04) — PINNED 2026-05-01 (Path c)

- **Route:** under `/admin` (path locked by Phase 27 Wave 3 commit `3756443`). Exact subpath (e.g., `/admin/demo-data`) is plan-author choice — no contention with existing admin routes.
- **Bulk delete mechanism (LOCKED):** `Pipeline.receive` with `markDeleted: [...]` for **class-Objects ONLY**. Hydra Resource cleanup is **OUT OF SCOPE for Phase 24** — deferred to a separate director brief (`cleanup-orphan-hydra-resources.md`).
  - **Rationale:** Phase 24's stated goal is *visibility*, not destruction. `Object.tag` is the visibility filter; orphan hydra Resources are invisible to class-driven queries by construction (the queries route through GQL on the class-Object, which is already markDeleted). Hydra residue does not violate the visibility invariant.
  - **Verified 2026-04-30 via `mcp__zerobias__zerobias_search { keyword: "resource", service: "hydra" }`:** hydra exposes `getResource`, `tagResource`, `untagResource`, `searchResources`/`resourceSearch`, `linkResources`, `deleteResourceLink`, `getTagsForResource`, etc. — but **NO `deleteResource` operation exists**. The cascade behavior of class-Object `markDeleted` on hydra Resources is unverified and is Kevin / platform-team domain.
  - **Plan 24-04 Task 1 LOCKED:** call `platform.Pipeline.receive` with `markDeleted: [recordId, ...]` for each demo class-Object (Engagement, SmeMartProject, Bid, BidResponse, Review, Note, NoteFolder, Document, ServiceOffering, etc., per researcher inventory). Do NOT attempt any hydra Resource API call.
- **Confirmation gate REQUIRED** — destructive action; no one-click trigger. Use `MatDialog` confirmation pattern (already in codebase).
- **Error handling on platform writes:** `await` + `try/catch` + `MatSnackBar('Dismiss', 5000ms)` + explicit `callSiteTag` + re-throw (Phase 20 pattern).
- **Out-of-scope follow-up:** Director brief `cleanup-orphan-hydra-resources.md` (separate, post-Phase-24) decides whether `untagResource` per legacy-tagged Resource OR Kevin-side cascade work is the right cleanup path.

### `/admin` Route Lock (Phase 27 Wave 3)

- `/admin` route exists in `app.routes.ts` post-Phase 27. Admins land there from `onboardingGuard`. Phase 24 adds a sub-route under `/admin` — no top-level routing changes.

### Touched Services (initial scan — researcher to confirm complete list)

Core listing/search services likely needing the gate (preliminary, NOT exhaustive):
- `engagements.service.ts`
- `bids.service.ts`
- `reviews.service.ts`
- `project-plan.service.ts`
- `marketplace-profile.service.ts`
- `note-hierarchy.service.ts`
- `notes.service.ts`
- `document-instance.service.ts`
- `document-template.service.ts`
- `form-submission.service.ts`
- `org-document.service.ts`
- `sme-mart-workflow.service.ts`
- Possibly `graphql-read.service.ts` (centralization candidate — research)

**Researcher MUST produce the canonical list** of touched services with file:line evidence per service, plus a recommendation on whether to (a) inject filter at each call-site or (b) centralize through a `DemoVisibilityFilterService` consumed by GraphqlReadService.

### Demo Seeder Tag Application (DG-01)

- Update `src/app/test-helpers/demo-data-seeder.ts` — add `tag: [{ value: "<global-demo-uuid>" }]` to every class-Object Pipeline.receive payload.
- Update `scripts/demo/helpers.ts` (or equivalent script-side helper) — same change.
- Hydra Resources already tagged via existing seeder code — keep that.
- **Use the global `demo` UUID for new pushes** (per DECISIONS.md preference). Legacy tag stays only on already-seeded records.

### Retroactive Re-Push (out of scope, but documented)

- Existing UAT demo records lack `Object.tag`. They remain visible via the gate ONLY if retroactively re-pushed via Pipeline.receive with the tag field populated.
- Separate director brief — NOT a Phase 24 plan. Phase 24 PLAN.md must DOCUMENT the dependency: "Visibility filter is effective only against retroactively-tagged records; pre-existing demo records require a separate retroactive push (director brief, not Phase 24)."

### Modernization Patterns (NON-NEGOTIABLE — paste verbatim into every gsd-execute task description)

- Control flow: `@if` / `@for` / `@switch` only — NEVER `*ngIf` / `*ngFor` / `*ngSwitch`
- Imports: NEVER import `CommonModule` (built-in control flow doesn't need it)
- DI: field-level `inject()` only — NEVER constructor parameter injection
- Inputs/Outputs: signal-based `input()` / `output()` — NEVER `@Input` / `@Output` decorators
- Spinners: `<mat-progress-spinner>` — NEVER deprecated `<mat-spinner>`
- Standalone components, suffixed filenames (`.component.ts`, `.service.ts` — see CLAUDE.md "File Naming Convention")

### Lint Gate (Phase 27.5)

- Phase 27.5 (modernization rule enforcement) is in flight at plan-time. Phase 24 EXECUTE will land **after** 27.5 closes.
- Every plan task verification block MUST include: `npm run lint` exits 0, `tsc --noEmit` clean, `npm test` (targeted) green.

### Testing Discipline (DG-05)

- Unit tests scoped to **touched files only** (per `feedback_unit_tests_default_test_infra_deferred.md`).
- Test matrix:
  1. Admin (signal `true`) — listing service returns demo + production records (no filter).
  2. Non-admin (signal `false`) — same service returns only production records (filter applied; demo records absent).
  3. Admin delete-demo — bulk action removes both class-Objects (markDeleted) and hydra Resources for both demo UUIDs; subsequent non-admin query returns empty demo set.
- Mock shapes derived from real SDK / sibling spec files — NOT imagination. Run `tsc --noEmit` + build alongside green tests (memory: `feedback_tests_passing_against_wrong_shape_mocks.md`).

### Source-of-Truth Discipline

For any "what's the API for X" question during planning OR execution:
1. ZB MCP (`zerobias_search` / `zerobias_describe`) — **first**.
2. ZB platform source (`~/Projects/zb/`) — second.
3. Installed SDK source (`node_modules/.../dist/api/*.d.ts` or `npm pack`) — third.
4. **NEVER** cite the deprecated Next.js prototype at `~/Projects/zb/zerobias-org/app/package/w3geekery/sme-mart/`.
5. **NEVER** cite memory entries without re-verification.

See `.planning/docs/SDK_VERIFICATION_SOURCES.md`.

### Claude's Discretion

- Exact admin sub-route path (`/admin/demo-data`, `/admin/demo`, etc.).
- UI placement of the admin delete-demo trigger (settings menu, dedicated admin page, etc.).
- Centralization approach for the filter (per-service vs. shared `DemoVisibilityFilterService` vs. `GraphqlReadService` augmentation) — researcher to recommend, planner to lock.
- Constants module location (`src/app/core/constants/demo-tags.ts`?) — planner to decide.
- Whether to also short-circuit the filter when no demo UUIDs are configured (defensive fallback).
- Confirmation dialog copy / disabled-by-default vs. confirm-button-required pattern.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Brief & Decisions
- `.planning/director/phase-24-brief.md` — Phase 24 brief (refreshed 2026-04-30 with Phase 27 deltas)
- `.planning/director/DECISIONS.md` — sections "Object.tag Field Shape — Validated via UAT Experiment" (2026-04-24) and "Marketplace tagType Is Preferred for New Tags" (2026-04-29)
- `.planning/director/backlog/002-demo-data-cleanup-and-visibility.md` — origin
- `.planning/director/backlog/005-sme-mart-entity-tagging-mechanism.md` — resolved (no schema PR needed)

### Source-of-Truth Verification
- `.planning/docs/SDK_VERIFICATION_SOURCES.md` — verification source rules
- `.planning/notes/zb-graphql-custom-schema-howto.md` — GQL filter syntax + Object.tag query patterns

### Admin Detection (Phase 27 closure)
- `src/app/core/services/project-context.service.ts` — `isAdmin` signal accessor (READ this verbatim before planning admin checks)
- `src/app/core/guards/onboarding.guard.ts:79-88` — admin hydration via `getRequestOrgMember.admin`
- Phase 27 Wave 2 patch `d4c542e` — admin signal wiring
- Phase 27 Wave 3 commit `3756443` — `/admin` route lock

### Modernization & Project Patterns
- `.planning/docs/MODERNIZATION_GUIDE.md` — non-negotiable Angular 21 patterns
- `CLAUDE.md` (this repo) — File Naming Convention, ngx-library, Generic SQL data layer
- `.claude/skills/sme-mart-architect.md` (if present) — SME Mart-specific patterns

### Existing Object.tag Implementation Examples
- `src/app/core/services/onboarding-bootstrap.service.ts:179, 267` — `tag: [{ value: tagId }]` at Pipeline.receive (AR-06 pattern)

### Phase 27 Closure Artifacts (CONTEXT.md from sibling phase, for planner consumption)
- `.planning/phases/27-auth-onboarding-guard/27-CONTEXT.md` (if present)
- `.planning/phases/27-auth-onboarding-guard/27-SUMMARY.md` (if present)

</canonical_refs>

<specifics>
## Specific Ideas

### MCP Lookups Already Performed (planner / researcher MUST NOT redo)
- `hydra.Tag.searchTags({ name: "demo", type: "marketplace" })` → returned both UUIDs above (2026-04-30, profile `uat-zb`).

### Suggested Constants File
```typescript
// src/app/core/constants/demo-tags.ts
export const DEMO_TAG_UUIDS = {
  GLOBAL_DEMO: '81053c14-a8e5-4939-b538-c122c7d0eb1a',
  LEGACY_W3GEEKERY: 'd618b602-21cc-40a1-a9fa-534b7bc1672c',
} as const;

export const DEMO_TAG_UUID_LIST: readonly string[] = Object.values(DEMO_TAG_UUIDS);
```

### Filter Pattern Sketch (TENTATIVE — researcher to validate against backend)
```typescript
// Non-admin: exclude both demo UUIDs
const visibilityFilter = projectContext.isAdmin()
  ? undefined
  : {
      tag: { value: `.not in.${DEMO_TAG_UUID_LIST.join(',')}` }, // verify support
      // fallback if .not in. unsupported:
      // and: DEMO_TAG_UUID_LIST.map(uuid => ({ tag: { value: `.ne.${uuid}` } }))
    };
```

### Test File Names
- `demo-data-seeder.spec.ts` — DG-01: tag field present in payload
- `engagements.service.spec.ts` (et al.) — DG-02/03: filter applied iff non-admin
- `admin-demo-data.component.spec.ts` (or service-level) — DG-04: bulk markDeleted invokes correct UUIDs

</specifics>

<deferred>
## Deferred Ideas

- Retroactive re-push of existing UAT demo records (separate director brief)
- Synthetic ACME demo (v1.5)
- Production-time demo data (prod has no seeder)
- Migrating legacy `w3geekery.sme-mart.demo-seed`-tagged records to global `demo` UUID (UUID churn not worth it; transition filter handles both)
- Tier display, ToS, ZB branding (Phase 29 — deferred to v1.5)

</deferred>

---

*Phase: 24-demo-data-visibility-gate*
*Context gathered: 2026-04-30 from Director brief + MCP verification*
