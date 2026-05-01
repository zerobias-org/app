# Phase 27: Auth Gate + Onboarding Routing + Lazy-on-Load Default-Engagement Guard — Context

**Gathered:** 2026-04-30
**Status:** Ready for planning
**Source:** Director brief (`.planning/director/phase-27-brief.md` — refresh §1–9 + AR-01..AR-10) + bootstrap walkthrough + DECISIONS.md anchors + Phase 28 contract

<domain>
## Phase Boundary

Wire SME Mart to the W3Geekery-branded ZB platform auth flow:

1. Detect session on app bootstrap. Redirect unauthenticated users to the branded login URL (`https://w3geekery.uat.zerobias.com/login?redirect=<current-url>` if up; otherwise default ZB login).
2. After auth, run a **lazy-on-load default-engagement guard** that ensures the current Org has a default ZeroBias Engagement (and its SmeMartProject). Missing → run the validated 5-call inline bootstrap recipe at ingest. Existing → fast-path.
3. Route the user based on onboarding state:
   - Admin user (`getPrincipal().isAdmin === true`) → admin dashboard (existing surface, e.g., `/admin`). Skip Phase 28 form entirely.
   - First-time user (no `onboarding_complete` MPI marker) → `/onboarding/company-profile` (Phase 28's route).
   - Returning user with marker → `/projects` (Phase 30's eventual surface; current target). Until Phase 30 ships, `/projects` is the same path as Phase 28's "skip-for-now" target.
4. Guard is **failure-resumable** — if any of the 5 bootstrap calls fails partway, the next-load retry detects partial state via per-step idempotency checks and resumes WITHOUT duplicating already-created records.
5. Phase 27 OWNS: session detection, branded-login redirect, the inline guard logic + idempotency checks, the routing decision tree. Phase 27 DOES NOT own: the Phase 28 form, the Phase 30 board, the per-app ToS gate (v1.5).

</domain>

<decisions>
## Implementation Decisions (LOCKED — do NOT redesign)

### Bootstrap recipe is the validated 5-call sequence

Steps A–E from `bootstrap-w3geekery-engagement.md`:
- **A.** `hydra.Tag.createTag` — name `sme-mart.eng.<org-slug>-default-zb`, `ownerId: <currentOrgId>`, **`tagType: "marketplace"`** (NOT `other`; locked 2026-04-29 per DECISIONS.md "Marketplace tagType Is Preferred for New Tags"). Capture `zerobiasTagId`.
- **B.** `platform.Task.create` — name `"Engagement coordination — <Buyer> <- ZeroBias"`. Activity `aha1` = `e15830c8-4274-4d67-bf9b-c22b60001e32`. `ownerId` = currentOrgId. `assigned`/`approvers`/`notified` = current user's party UUID via `Party.getMyParty`. `priority: 500`. `links: []`. Capture Task UUID for `zerobiasTaskId`.
- **C.** `Pipeline.receive` Engagement (class `7711aa41-e55b-5cda-9b7a-35844a2006a1`) via `PipelineWriteService.pushEntities('Engagement', [...], [], '<callSiteTag>')`. Required fields: `id, name, description, buyerZerobiasUserId, buyerZerobiasOrgId, status: "in_progress", engagementTag: "default-project", zerobiasTagId, zerobiasTaskId, dateCreated, dateLastModified, tag: [{ value: zerobiasTagId }]`. **`tag` MUST be set at ingest** (immutable post-ingest per DECISIONS.md "Object.tag Field Shape").
- **D.** `hydra.Resource.tagResource(<TaskId>, [zerobiasTagId])`. Idempotent.
- **E.** `Pipeline.receive` SmeMartProject (class `c66114a2-48e2-5b93-b7d6-7ccd6ef45a03`) via `PipelineWriteService.pushEntities('SmeMartProject', [...], [], '<callSiteTag>')`. Required fields: `id, name: "SME Mart Platform Development", description, status: "active", projectType: "project", engagementId, isInvitationOnly: false, wizardStep: 999, dateCreated, dateLastModified, tag: [{ value: zerobiasTagId }]`.

### Class IDs are read from the codebase const

The guard MUST import from `src/app/core/services/pipeline-write.service.ts` (or a re-exported module). It MUST NOT hardcode UUIDs. Required class IDs are already canonical there:
- `Engagement = '7711aa41-e55b-5cda-9b7a-35844a2006a1'`
- `SmeMartProject = 'c66114a2-48e2-5b93-b7d6-7ccd6ef45a03'`

If `SME_MART_CLASS_IDS` is not exported, planner adds an export — do NOT redeclare these UUIDs anywhere else. (DECISIONS.md "Platform-Assigned Class IDs Are Not Deterministic UUID v5".)

### Pipeline.receive calls go through PipelineWriteService.pushEntities

`src/app/core/services/pipeline-write.service.ts:133` — `pushEntities(className, data, tagIds, callSiteTag)` is the locked write wrapper. It carries `[PIPELINE_WRITE_FAILURE]` console telemetry + try/catch + re-throw. Steps C and E MUST go through it. Do NOT call `getPipelineApi().receive` directly.

For Step C and Step E, pass `tagIds: []` (the `Object.tag` field is set on each record's payload; the batch-level `tagIds` param is unrelated and should remain empty per DECISIONS.md / refinement #15).

### Discovery-filter for "does this Org already have a default ZB engagement?" — DEFAULT (a), FLAG FOR DIRECTOR

Per refresh §3, three options. PLAN against (a):

```graphql
{ Engagement(buyerZerobiasOrgId: ".eq.<currentOrgId>") { id, tag { value } } }
```

Assert `≤ 1` result. Assumes "≤1 ZB-as-provider Engagement per Org" invariant (true today; default ZB engagement is auto/invariant per DECISIONS.md "Default ZB Engagement is Auto, Invariant").

PLAN.md MUST include a callout block flagging this assumption and listing options (b) and (c) verbatim from the brief, marked "**Director sign-off required**". Do NOT silently pick.

If the query returns 1 result, the guard SKIPS. If 0, the guard FIRES.

### Failure-resumability — per-step idempotency checks BEFORE each call

The guard runs 5 calls in sequence. If a prior load got partway and crashed, the next load MUST detect partial state and resume WITHOUT duplicating. Per-step gate:

| Step | Idempotency probe (run BEFORE the create call) | Skip if found |
|---|---|---|
| A (Tag) | `hydra.Tag.searchTags` filtered by `name = sme-mart.eng.<org-slug>-default-zb` AND `ownerId = currentOrgId` | Reuse existing `zerobiasTagId` |
| B (Task) | List tasks tagged with the recovered `zerobiasTagId` (or by name pattern within owner org); confirm one with the engagement-coordination name | Reuse existing `zerobiasTaskId` |
| C (Engagement) | Same GQL discovery query as the front-door check, scoped by `currentOrgId` | Skip C, capture existing engagement id |
| D (tagResource) | `hydra.Resource.getResource(<TaskId>)` returns the engagement Tag in its tag list | Skip D (idempotent anyway; cheap) |
| E (SmeMartProject) | `SmeMartProject(engagementId: ".eq.<engagementId>", projectType: ".eq.project") { id }` returns ≥1 record | Skip E |

**Slug derivation:** `<org-slug>` derives from the org's name via the existing slug helper used in seeders / batch script. Researcher MUST resolve the canonical helper name & file. If none exists, planner adds `slugify(orgName)` (lowercase, hyphenated, alphanumeric+`-` only) as a small util — do NOT depend on guessing.

### Error handling pattern (locked from Phase 20)

For Pipeline.receive failures (Steps C, E), `pushEntities` already handles `[PIPELINE_WRITE_FAILURE]` telemetry + re-throw. The CALLER (the guard) MUST:

```ts
try {
  await this.pipelineWrite.pushEntities('Engagement', [engagement], [], 'onboarding-guard:create-engagement');
} catch (err) {
  this.snackBar.open('Onboarding in progress — please retry in a moment.', 'Dismiss', { duration: 5000 });
  throw err;
}
```

For NON-Pipeline calls (Steps A `hydra.Tag.createTag`, B `platform.Task.create`, D `hydra.Resource.tagResource`), wrap with the same try/catch shape PLUS the manual telemetry tag:

```ts
try {
  // ... call SDK ...
} catch (err) {
  console.warn('[ONBOARDING_GUARD_FAILURE]', { callSiteTag: 'onboarding-guard:create-tag', step: 'A', error: err });
  this.snackBar.open('Onboarding in progress — please retry in a moment.', 'Dismiss', { duration: 5000 });
  throw err;
}
```

Mirror the shape of `vendor-profile.service.ts:153-159`. Re-throw is REQUIRED (not just snackbar).

### Admin detection is `getPrincipal().isAdmin`

Authoritative per DECISIONS.md "SME Mart Admin Mechanism Is Decided — `getPrincipal().isAdmin`" + memory `project_sme_mart_admin_detection.md`.

- Returns `OrgPrincipalWithAdminFlag` with `isAdmin: boolean`.
- The exact SDK accessor (`clientApi.danaClient.getPrincipalApi().getPrincipal()` or similar) — researcher MUST resolve via SDK source / vscode-mcp. Don't guess.
- Admin users SKIP the company-profile gate AND skip onboarding-complete checks. They route directly to the admin dashboard (existing surface; resolve canonical path via `app.routes.ts` — `admin` route exists).
- The guard STILL FIRES for admin users on first-load-per-org — admins are still customers; their org needs a default engagement just like anyone else's. (This protects the admin's W3Geekery context too — already remediated 2026-04-27, so today's admins skip the slow path.)

### Onboarding-complete signal — read MarketplaceProfileService.getCompletionStatus(orgId)

Phase 28 will land `MarketplaceProfileService` at `src/app/core/services/marketplace-profile.service.ts` with a `getCompletionStatus(orgId)` method. Phase 27's guard reads this signal to decide CP-07 (onboarding form vs `/projects`).

**Sequencing:** Phase 28 is in-flight (gsd-execute running). By the time Phase 27 executes, the service will exist. If Phase 27 schedules first, the guard test stubs `getCompletionStatus` mock; integration is validated post-28.

If Phase 27 needs to land before Phase 28 finishes:
- Plan against the documented contract: `getCompletionStatus(orgId: string): Promise<{ complete: boolean }>` (or a similar boolean signal) — researcher confirms exact return shape from Phase 28's `28-CONTEXT.md` decisions block.
- Wire to a TEMPORARY shim that reads the `onboarding_complete` MPI section directly (one GQL query) until Phase 28 ships. Document the shim removal as a Phase 28 follow-up note.

### Branded login URL resolution at runtime

```ts
const subdomain = environment.brandedLoginSubdomain ?? null;
const fallback = environment.defaultLoginUrl;
const target = subdomain
  ? `${subdomain}/login?redirect=${encodeURIComponent(location.href)}`
  : `${fallback}?redirect=${encodeURIComponent(location.href)}`;
```

DO NOT hardcode `https://w3geekery.uat.zerobias.com` in source. Add typed fields to `environment.ts` / `environment.uat.ts` / `environment.vercel.ts`. Andrey's subdomain may not be live; planner adds the fallback config wired to whatever today's app-init redirect uses (see `app-init.service.ts:32-40` — there's an existing `localhost`/static-login redirect path that gives us the canonical fallback URL shape). Reuse that helper if practical; do NOT duplicate.

### Per-app ToS gate is OUT OF SCOPE (v1.5)

At the post-auth, pre-Phase-28-route insertion point, leave EXACTLY this comment:

```ts
// TODO: per-app ToS gate (v1.5) — DECISIONS.md "Per-App ToS Architecture — Two-Layer"
```

Do NOT design the gate. Do NOT add a feature flag. Do NOT stub a service. The TODO is the ENTIRE deliverable for ToS in Phase 27.

### Loading-state UI during the 5-call sequence

First-load-per-org-ever runs 5 SDK round-trips. Add a minimal loading shell while the guard runs:
- Spinner via `<mat-progress-spinner>` (canonical name; per modernization rules NOT `<mat-spinner>`).
- Caption: "Setting up your workspace..." (or equivalent — copy lives in the component).
- Block all routing/UI underneath until the guard resolves OR fails.
- On failure, replace spinner with a "Onboarding in progress — please retry in a moment" surface PLUS a Retry button that re-runs the guard. (Snackbar still fires per the error pattern; the surface is for users who navigated past the snackbar.)

### Test scope (per Clark)

**Touched-component unit tests only.** Do NOT bolt test-infra harness work onto this milestone (separate future milestone — see memory `feedback_unit_tests_default_test_infra_deferred.md`). Required specs:

- **Auth gate / session-detection spec** — authenticated session resolves, unauthenticated triggers redirect (asserted via `location.href` mock).
- **Guard fires** — given `Engagement(buyerZerobiasOrgId)` returns 0 results, all 5 calls execute in order with correct args; resolves to `engagementId` for routing.
- **Guard skips** — given query returns 1 result, ZERO bootstrap calls fire.
- **Guard idempotent resume** — simulate Step A succeeded, Step B succeeded, Step C failed previously: rerun resolves Tag via `searchTags`, resolves Task via tag-list, RUNS Step C, then D, then E. ZERO duplicate creates.
- **Routing decisions** — admin user → admin route; first-time user → `/onboarding/company-profile`; returning user → `/projects`.

Mock shapes derive from the real SDK / sibling specs (`vendor-profile.service.spec.ts`, `pipeline-write.service.ts` test patterns). Do NOT invent shapes. Memory `feedback_tests_passing_against_wrong_shape_mocks.md`.

### Angular 21 modernization (NON-NEGOTIABLE for new code)

Per `.planning/docs/MODERNIZATION_GUIDE.md`:

- DI: field-level `inject()` only. NO constructor params, NO `@Inject` decorators.
- I/O: `input()` / `output()` signal APIs only.
- Control flow: `@if` / `@else` / `@for (x of arr; track x.id)` / `@switch`. NO `*ngIf` / `*ngFor` / `*ngSwitch`.
- Standalone imports: only what the template uses. NO `CommonModule`. Import `AsyncPipe` directly if needed.
- Material: `<mat-progress-spinner>`, NOT `<mat-spinner>`.
- File naming: keep traditional suffixes (`*.component.ts`, `*.service.ts`, `*.guard.ts`, `*.spec.ts`).
- When modifying an existing file with old patterns, migrate what you touch. Don't leave half-modernized files.

### Claude's Discretion

- Whether the guard is implemented as a route `CanActivate` (preferred for routing-time enforcement), an `APP_INITIALIZER` extension, a parent-route resolver, or a dedicated `OnboardingGuardService` orchestrated from a parent component. Researcher recommends; planner picks ONE and justifies in PLAN.md frontmatter.
- File layout under `src/app/onboarding/` and `src/app/core/services/` (e.g., `onboarding-guard.service.ts`, `onboarding-router.guard.ts`, `onboarding-bootstrap.service.ts`, plus a route component for the loading shell at `/onboarding/bootstrap` if needed).
- Whether the per-step idempotency probes live inline in the guard or in a separate `OnboardingBootstrapService`. (Recommend: separate service so it's testable in isolation.)
- Slug helper location/name (if missing, add a small util at `src/app/core/utils/slug.ts` or co-locate).
- Whether the Retry button on the failure surface re-runs the guard via Router navigate (re-trigger CanActivate) or via direct service call. Either is fine if the failure surface clears state.
- The exact SDK call to fetch current user's party UUID (likely `Party.getMyParty` or equivalent on `clientApi.platformClient` / `danaClient`) — researcher resolves.
- The exact SDK call to fetch `getPrincipal()` returning the admin flag — researcher resolves.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase contract & companion docs
- `.planning/director/phase-27-brief.md` — the contract (refresh §1–9 + AR-01..AR-10 + 5 deliverables + scope boundaries).
- `.planning/director/bootstrap-w3geekery-engagement.md` — the validated 5-call recipe (Steps A–E). This IS the guard's inline logic.
- `.planning/director/DECISIONS.md` "Default ZB Engagement is Auto, Invariant, Compliance-Driven" — why Phase 27 owns this guard.
- `.planning/director/DECISIONS.md` "Object.tag Field Shape — Validated via UAT Experiment" — `tag: [{ value: <uuid> }]` at-ingest, immutable post-ingest.
- `.planning/director/DECISIONS.md` "W3Geekery Object.tag Remediation" — skip-path validated for first customer.
- `.planning/director/DECISIONS.md` "Platform-Assigned Class IDs Are Not Deterministic UUID v5" — class IDs from codebase const, not hardcoded.
- `.planning/director/DECISIONS.md` "Marketplace tagType Is Preferred for New Tags" — new tags use `marketplace`.
- `.planning/director/DECISIONS.md` "Per-App ToS Architecture — Two-Layer" — explains why ToS gate is v1.5.
- `.planning/director/DECISIONS.md` "SME Mart Admin Mechanism Is Decided — `getPrincipal().isAdmin`" — admin detection contract.

### Phase 28 contract (routing destination + signal source)
- `.planning/phases/28-company-profile-form/28-CONTEXT.md` — `onboarding_complete` MPI marker; `MarketplaceProfileService.getCompletionStatus(orgId)` will be the signal Phase 27's guard reads. Form route is `/onboarding/company-profile`.

### Existing infrastructure to compose with
- `src/app/core/services/pipeline-write.service.ts` (line 133) — `pushEntities(className, data, tagIds, callSiteTag)`. The locked write wrapper. `SME_MART_CLASS_IDS` const lives here (lines 10–47); export it if not already exported.
- `src/app/core/services/graphql-read.service.ts` — reads via `boundaryExecuteRawQuery`. The guard's discovery query goes through this service.
- `src/app/core/services/vendor-profile.service.ts:153-159` — error-handling shape to mirror (try/catch + snackbar('Dismiss', 5000ms) + re-throw).
- `src/app/core/app-init.service.ts` — current auth bootstrap (whoAmI probe + redirect at lines 32–40). The branded-login redirect should reuse / extend this; do not duplicate.
- `src/app/app.config.ts` — `provideAppInitializer(() => inject(AppInitService).init())`. If the guard prefers `APP_INITIALIZER` over `CanActivate`, this is the wire-up point.
- `src/app/app.routes.ts` — root `Routes` array under `AppShell`. Add `/onboarding/company-profile` (Phase 28) and `/projects` (Phase 30 stub) wire-ups; the guard attaches at the root or to `AppShell`.
- `src/app/onboarding/company-info-sections.ts` — exported section constants. The `onboarding_complete` section name lives here; the temporary direct-MPI shim (if needed) imports from this file.
- `src/app/core/services/project-context.service.ts` — has `_isAdmin` signal / `setIsAdmin()` / `isAdmin` readonly accessor. Plan should set this signal from `getPrincipal().isAdmin` post-auth, so consumers downstream of the guard can read admin state without re-calling the SDK.

### SDK references
- `@zerobias-com/zerobias-angular-client` — wraps `zerobias-client` → `zerobias-sdk`.
- `clientApi.danaClient` / `clientApi.platformClient` / `clientApi.hydraClient` — the three accessors. Researcher confirms which carries `getPrincipalApi`, `Tag.createTag`, `Task.create`, `Resource.tagResource`, `Party.getMyParty`.
- Memory: `Hub Module Client Initialization`, `ZeroBias MCP Parameter Patterns` (for the call argument shapes).
- `bootstrap-w3geekery-engagement.md` references — pre-checks 1–6 enumerate every SDK call and required UUID source.

### Project rules
- `package/w3geekery/sme-mart/CLAUDE.md` — no Nx, standalone components, ngx-library first, suffix-style file naming. LSP routing rules (built-in LSP default; vscode-mcp for cross-file TS refs in this multi-project workspace).
- `.planning/docs/MODERNIZATION_GUIDE.md` — Angular 21 patterns. `inject()`, signal I/O, `@if`/`@for`, no `CommonModule`, `<mat-progress-spinner>`.

</canonical_refs>

<specifics>
## Specific Ideas

### File targets (suggested)

- `src/app/core/services/onboarding-bootstrap.service.ts` — encapsulates the 5-call recipe with per-step idempotency probes. Methods (illustrative): `ensureDefaultEngagement(orgId, userId, partyId): Promise<{ engagementId, projectId }>`, plus private `ensureTag`, `ensureTask`, `ensureEngagement`, `ensureTagOnTask`, `ensureProject`. Each returns `{ created: boolean, id: string }` so failure-resume telemetry can attribute behavior.
- `src/app/core/services/onboarding-bootstrap.service.spec.ts` — guard-fires, guard-skips, idempotent-resume specs.
- `src/app/core/guards/onboarding.guard.ts` (functional `CanActivateFn`) — orchestrates: session check → admin branch → `OnboardingBootstrapService.ensureDefaultEngagement()` → `MarketplaceProfileService.getCompletionStatus()` → routing decision (admin dash / `/onboarding/company-profile` / `/projects`). Returns `UrlTree` for redirects, `true` for pass-through.
- `src/app/core/guards/onboarding.guard.spec.ts` — routing decisions.
- `src/app/core/services/branded-login.service.ts` (or extend `app-init.service.ts`) — resolves branded login URL from environment, redirects with `redirect=<current-url>`. Single function: `redirectToBrandedLogin(currentUrl: string): never`.
- `src/app/onboarding/onboarding-bootstrap-shell.component.ts` (+ `.html`, `.scss`) — minimal loading + retry surface. Standalone, signal-based. Used as the route component for `/onboarding/bootstrap` if the guard prefers a route-component approach over inline guard logic.
- `src/app/core/utils/slug.ts` — `slugify(name: string): string` if no existing helper resolves.
- `src/environments/environment.ts` (+ `.uat.ts`, `.vercel.ts`, `.dev.ts`) — add `brandedLoginSubdomain?: string`, `defaultLoginUrl: string`. Wire defaults: prod uses `https://w3geekery.uat.zerobias.com` if Andrey subdomain provisioned; otherwise the existing fallback URL today's app-init uses. Plan does NOT decide the subdomain string — it makes the field configurable and sets sensible defaults.
- `src/app/app.routes.ts` — add `/onboarding/company-profile` (placeholder if Phase 28 not yet shipped — `loadComponent` lazy) and `/projects` (placeholder ComingSoon if Phase 30 not shipped). Attach `canActivate: [onboardingGuard]` at the root level under `AppShell` (so EVERY child route is gated).
- `src/app/core/services/pipeline-write.service.ts` — IF `SME_MART_CLASS_IDS` is not currently exported (verify line 47 — `as const` makes it module-private unless explicitly exported), add `export` keyword. Touch-only-what-you-touch modernization.

### Concrete contracts the planner must encode

- `OnboardingBootstrapService.ensureDefaultEngagement(currentOrgId, currentUserId, currentPartyId)` MUST run idempotency probes before each create. Returns `{ engagementId, projectId, created: boolean }`. `created: true` if any of the 5 steps actually fired.
- The guard's discovery query MUST be the SAME query as Step C's idempotency probe — single source of truth for "does this org have one?".
- Engagement record `name` is **`<orgName> <- ZeroBias`** (literal ASCII reverse-arrow, NOT a Unicode arrow). Buyer-first per naming convention. Researcher confirms the org-name source (likely `danaOld.Org.getOrg(currentOrgId).name` per Phase 28's pre-fill catalog).
- Task `assigned`/`approvers`/`notified` arrays MUST hold party UUIDs (NOT principal UUIDs) per memory `feedback_task_assigned_party_id.md`. Source: `Party.getMyParty()` while connected as the current user.
- After bootstrap returns, the guard sets `projectContext.setIsAdmin(principal.isAdmin)` so the admin signal is hydrated for downstream consumers.
- Branded-login redirect MUST encode the current URL: `target = baseLoginUrl + '?redirect=' + encodeURIComponent(location.href)`. Trailing slash + path preservation.
- The "Setting up your workspace..." loading surface MUST resolve within ~10s normal-path (5 SDK round-trips at ~1–2s each on UAT). If exceeded, show a different copy: "Still working on it — this should only take a moment more." (Optional UX nicety; planner can defer this if it adds scope.)

### Verification path (goal-backward sketch covering AR-01..AR-10)

| Req | Verification |
|---|---|
| **AR-01** Unauthenticated users redirect to branded login | Spec: mock `whoAmI` rejecting with 401 → assert `location.href` set to branded login URL with `redirect=` query string matching original. |
| **AR-02** Post-auth routing | Specs (3): admin → admin dash; first-time user (no `onboarding_complete`) → `/onboarding/company-profile`; returning user (marker present) → `/projects`. |
| **AR-03** Lazy-on-load guard | Spec: 0 results from discovery query → all 5 calls fire in order, return values chain correctly. |
| **AR-04** Guard failure surfaces user-friendly error | Spec: simulate Step C failure → MatSnackBar 'Dismiss' opens with duration 5000; route resolves to `/onboarding/bootstrap` (or stays on bootstrap surface) with Retry visible; no uncaught exception. |
| **AR-05** Admin users skip Phase 28 | Same as AR-02 admin spec; ALSO: assert the admin spec does NOT call `MarketplaceProfileService.getCompletionStatus`. |
| **AR-06** Object.tag at ingest | Spec: assert `pushEntities('Engagement', [{ ..., tag: [{ value: zerobiasTagId }] }], [], '...')` and same for `'SmeMartProject'`. Grep: `tag: [{ value` appears in both call sites. |
| **AR-07** New tags use `tagType: "marketplace"` | Spec: assert `hydra.Tag.createTag` call argument includes `tagType: "marketplace"`. Grep: `tagType: 'marketplace'` (single quotes acceptable). |
| **AR-08** Class IDs from codebase const | Grep: `SME_MART_CLASS_IDS.Engagement` and `SME_MART_CLASS_IDS.SmeMartProject` referenced from the bootstrap service. NO hardcoded UUIDs `7711aa41-` or `c66114a2-` outside `pipeline-write.service.ts`. |
| **AR-09** Phase 20 error pattern | Spec: simulate non-Pipeline failure (e.g., Step A) → assert `console.warn` called with `'[ONBOARDING_GUARD_FAILURE]'` AND first arg includes `callSiteTag` AND error re-thrown. Snackbar opened with `'Dismiss', { duration: 5000 }`. |
| **AR-10** Failure-resumable | Spec: pre-seed in-flight state where Tag exists + Task exists + Engagement does NOT → rerun. Assert `hydra.Tag.createTag` NOT called (Tag found via `searchTags`); `Task.create` NOT called (Task found via tag-list); `pushEntities('Engagement', ...)` IS called; D and E proceed. ZERO duplicate creates. |

### Plan structure (suggested — planner adjusts)

Likely 4–5 plans across 4–5 waves. Suggested decomposition:

- **27-01 Branded Login Redirect & Session Detection** (Wave 1) — environment fields, `branded-login.service.ts` (or extension of `app-init.service.ts`), unauthenticated→redirect logic, AR-01 spec. No dependencies on later plans.
- **27-02 OnboardingBootstrapService (5-call recipe + idempotency)** (Wave 2 — depends on 27-01? actually independent of 27-01; can parallelize) — the service + spec covering AR-03, AR-06, AR-07, AR-08, AR-10. No routing concerns. Exports `SME_MART_CLASS_IDS` if not already.
- **27-03 OnboardingGuard (functional CanActivateFn)** (Wave 3 — depends on 27-01, 27-02) — the guard + spec covering AR-02, AR-04, AR-05, AR-09. Includes the loading shell component if route-component approach. Reads `MarketplaceProfileService.getCompletionStatus` (or temporary shim).
- **27-04 Route Wire-up & Onboarding Shell** (Wave 4 — depends on 27-03) — `app.routes.ts` registers guard, adds `/onboarding/company-profile` placeholder route (lazy load to Phase 28's component when present, ComingSoon stub otherwise), adds `/projects` placeholder, integration spec for routing decisions covering AR-02 end-to-end.
- **27-05 Director Sign-off Gate (discovery filter)** (Wave 5 OR pre-Wave-1 — STOP gate) — single deliverable: PLAN.md callout "Director sign-off required" on the discovery filter (a) vs (b) vs (c). This is a documentation/verification artifact, not code. Could fold into PLAN.md frontmatter as a checkpoint instead of a separate plan. Planner decides.

### Dependency graph (illustrative)

```
27-01 (login redirect)
27-02 (bootstrap service) ──> 27-03 (guard) ──> 27-04 (routes + shell)
27-01 ────────────────────────^
27-05 (sign-off) — gates execute-phase, not coded
```

### Director sign-off callouts (MUST appear in PLAN.md)

1. **Discovery filter shape (refresh §3).** PLAN defaults to (a) `Engagement(buyerZerobiasOrgId: ".eq.<currentOrgId>")` with `≤1` assertion. Options (b) and (c) listed verbatim. Director must confirm before execute-phase.
2. **Phase 28 sequencing.** If gsd-execute schedules Phase 27 before Phase 28's `MarketplaceProfileService` lands, the guard uses a temporary direct-MPI-read shim. PLAN must state which path applies at execute time (probe `marketplace-profile.service.ts` existence as a wave-0 check).

</specifics>

<deferred>
## Deferred Ideas

- **Per-app SME Mart ToS gate** — v1.5 (DECISIONS.md "Per-App ToS Architecture — Two-Layer"). Phase 27 leaves a TODO comment, nothing more.
- **Andrey subdomain provisioning** — external; fallback URL works.
- **Phase 28 form UI** — Phase 28 owns; Phase 27 only routes to it.
- **Phase 30 default project board** — Phase 30 owns; Phase 27 routes to `/projects` placeholder until then.
- **Batch pre-creation for existing platform Orgs** — separate director brief: `batch-prime-engagements-for-existing-orgs.md`. The guard's lazy-on-load handles the long tail.
- **Multi-engagement selection** — default ZB engagement is invariant per Brian. The marketplace Create Engagement UI handles non-default cases (untouched by this phase).
- **Session refresh / token rotation** — platform SDK handles.
- **Retroactive Object.tag remediation for non-W3Geekery existing orgs** — separate director brief.
- **Migration of W3Geekery's existing hydra tag from `other` to `marketplace` tagType** — pure churn per DECISIONS.md.
- **Test-infra harness work** — separate future milestone; this phase ships only touched-component specs (memory `feedback_unit_tests_default_test_infra_deferred.md`).
- **E2E / integration tests** — out of scope; unit-level mocks only.
- **Long-form loading-state copy variations** — minimal copy ships; UX polish is a follow-up.

</deferred>

---

*Phase: 27-auth-onboarding-guard*
*Context gathered: 2026-04-30 from director brief refresh §1–9, bootstrap walkthrough Steps A–E, DECISIONS.md anchors, and Phase 28 contract.*
