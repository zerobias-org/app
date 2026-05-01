# Phase 27 — Auth Gate + Onboarding Routing + Lazy-on-Load Default-Engagement Guard

**Milestone:** v1.4 "3P Onboarding & Default Engagement"
**Est:** 8–12 hrs (auth routing + guard logic + onboarding state machine)
**Repos:** `app/` (SME Mart frontend). `login/` package already S3-deployed, no changes.
**Origin:** 3P plan core onboarding flow. Expanded scope per DECISIONS.md "v1.4 Phase 29 Deferred" — creation-side logic for the default ZB engagement moves INTO Phase 27 as a lazy-on-load guard.

---

## Refresh — 2026-04-30 (deltas since brief was first authored 2026-04-21)

The brief's structure stands. The following points were either not yet known or have changed; gsd-plan must respect them when authoring PLAN.md:

1. **Object.tag mechanism is locked.** Canonical write shape `tag: [{ value: "<hydra-tag-UUID>" }]` at Pipeline.receive ingest only; immutable post-ingest. Read-by-tag GQL: `ClassName(tag: { value: ".eq.<uuid>" }) { ... }` via `graphql.Boundary.boundaryExecuteRawQuery`. See DECISIONS.md "Object.tag Field Shape — Validated via UAT Experiment".
2. **W3Geekery records are now Object.tag-populated** (remediated 2026-04-27). The guard's skip-path is real-world-validated for W3Geekery — the first customer org. See DECISIONS.md "W3Geekery Object.tag Remediation".
3. **Discovery-filter ambiguity for non-W3Geekery orgs (gsd-plan to resolve).** Original brief said `Engagement(engagementTag: ".eq.default-project") { id }` — that filter shape is stale. The validated shape filters by Object.tag UUID: `Engagement(tag: { value: ".eq.<tag-uuid>" })`. BUT each new Org gets a per-Org hydra Tag (`sme-mart.eng.<org-slug>-default-zb`), so there is NO single tag UUID the guard can filter by globally. Three options for gsd-plan to choose between (or escalate):
   - (a) Filter by `buyerZerobiasOrgId` only (assumes "≤1 ZB-as-provider Engagement per Org" invariant). Cheapest. Likely correct.
   - (b) Look up the Org's per-Org hydra tag first (by name pattern via `hydra.Tag.searchTags`), then filter by that tag UUID. Two-call discovery, but explicit.
   - (c) Use a NEW global "default-zb-engagement" sentinel tag (would require a one-shot retag of W3Geekery's existing Engagement; cost ≈ one Pipeline.receive batch).
   gsd-plan should plan (a) as default and flag the assumption in PLAN.md for Director sign-off.
4. **Class IDs must be canonical.** The codebase `SME_MART_CLASS_IDS` map had 2 fictional UUIDs (MPI + EngagementVettingItem) — silently failing in Phase 26 until Plan 26-04 corrected them. Phase 27 guard ingests `Engagement` (`7711aa41-e55b-5cda-9b7a-35844a2006a1`) and `SmeMartProject` (`c66114a2-48e2-5b93-b7d6-7ccd6ef45a03`) — both verified canonical. Plan 27 must reference the codebase const, not hardcode UUIDs. See DECISIONS.md "Platform-Assigned Class IDs Are Not Deterministic UUID v5".
5. **NEW hydra Tags created by the guard use `tagType: "marketplace"`** (not `other`). Existing W3Geekery tag stays as-is — no migration. See DECISIONS.md "Marketplace tagType Is Preferred for New Tags".
6. **Error-handling pattern is locked from Phase 20.** Guard rejection paths use `await + try/catch + MatSnackBar('Dismiss', 5000ms) + explicit callSiteTag + re-throw`, not bare `console.error`. Telemetry tag prefix `[PIPELINE_WRITE_FAILURE]` for Pipeline.receive failures.
7. **Phase 28 destination is ready.** `COMPANY-INFO-CONVENTION.md` is RATIFIED (no `-DRAFT` suffix). MPI canonical class id `7bcf86a5-91dc-520d-b9bf-e308b1078d46`. Phase 28 form has its contract; Phase 27 routes to it.
8. **Per-app ToS gate is OUT OF SCOPE.** Per DECISIONS.md 4-28 "Per-App ToS Architecture — Two-Layer", users will need to accept SME Mart ToS at some point in onboarding. Phase 27 does NOT implement this gate (no ToS content from Brian yet, no class anchor decided, target is v1.5). Plan 27 can leave a TODO comment at the obvious insertion point (post-auth, pre-Phase-28-route).
9. **5-call inline bootstrap latency consideration.** The lazy guard runs 5 SDK calls on first-load-per-org-ever (idempotent thereafter). gsd-plan should plan for: (i) loading-state UI during the 5-call sequence; (ii) one-at-a-time sequencing (later calls depend on earlier UUIDs); (iii) failure-resumability — if call 3 succeeds but 4 fails, retry should NOT recreate the Engagement.

---

## Goal

Wire SME Mart to the W3Geekery-branded ZB platform auth flow: unauthenticated users redirect to the branded login URL; authenticated users hit the correct landing surface based on onboarding state; and every authed session is guaranteed to have a default ZeroBias engagement for its currentOrg (creating it on the fly if needed, via the validated bootstrap recipe).

## Architecture

### Starting state
- Branded login package (`login/`) lives at `https://w3geekery.uat.zerobias.com` (pending Andrey subdomain) or fallback to default ZB login URL.
- SME Mart currently uses API-key local-dev auth; no session detection or redirect logic.
- Default ZB engagement recipe validated on UAT via the W3Geekery walkthrough (`bootstrap-w3geekery-engagement.md`). 5 MCP calls: hydra Tag create → Task create → Engagement Pipeline.receive → hydra.Resource.tagResource → SmeMartProject Pipeline.receive.
- `getPrincipal().isAdmin` works for admin detection.

### Deliverables

1. **Session detection in the app bootstrap.** On app load, call `dana.User.getWhoAmI` (or equivalent). If unauthenticated, redirect to the branded login URL (`https://w3geekery.uat.zerobias.com/login?redirect=<current-url>` or the default login fallback). If authenticated, proceed.
2. **Lazy-on-load default-engagement guard.** After session is confirmed, query GQL for the current Org's default ZB engagement. **Discovery-filter shape is a planning ambiguity** — see Refresh §3 above; default plan: `Engagement(buyerZerobiasOrgId: ".eq.<currentOrgId>") { id, tag { value } }` and assert ≤1 result. If zero results, run the bootstrap recipe INLINE (all 5 calls from the walkthrough brief, adapted to the current Org's UUIDs, with `Object.tag` populated at ingest per refresh §1). On success, proceed; on failure, show a "Onboarding in progress — please retry in a moment" surface with an error-report option. Idempotent — fires at most once per Org's lifetime. Failure path follows refresh §6 (snackbar + callSiteTag + re-throw).
3. **Onboarding routing.** Post-session + post-guard, route the user based on onboarding state:
   - First visit ever for this user/org → Phase 28 company-profile review form.
   - Profile confirmed → Phase 30 default project board.
   - Admin user (getPrincipal().isAdmin) → normal admin dashboard + Phase 24 demo-data visibility applies.
4. **Lazy-on-load guard uses the VALIDATED bootstrap recipe.** Specifically the `tag: [{ value }]` at-ingest mechanism for the new Engagement and Project records — no separate tagging call. Pipeline ID + class IDs lifted from the bootstrap brief.
5. **Unit tests** for: session-detected vs not, guard-fires-when-engagement-missing, guard-skips-when-engagement-exists, onboarding-routing-branch-selection.

## Requirements

- **AR-01:** Unauthenticated users are redirected to the branded login URL on any SME Mart route.
- **AR-02:** After successful auth, users land on Phase 28 (if profile unconfirmed) or Phase 30 (if profile confirmed) — not a generic home page.
- **AR-03:** Lazy-on-load guard queries for the default ZB engagement; creates it via the full bootstrap recipe if missing; idempotent on retry.
- **AR-04:** Guard failure surfaces a user-friendly error + retry, not a crash.
- **AR-05:** Admin users (`getPrincipal().isAdmin`) skip the Phase 28 onboarding form and go straight to their admin dashboard.
- **AR-06:** Guard populates `Object.tag` at ingest time for both the new Engagement and the new SmeMartProject (validated shape: `tag: [{ value: "<hydra-tag-uuid>" }]`).
- **AR-07:** New hydra Tags created by the guard use `tagType: "marketplace"` (not `other`).
- **AR-08:** Guard uses canonical class IDs from the `SME_MART_CLASS_IDS` codebase const (not hardcoded UUIDs).
- **AR-09:** Guard rejection paths follow the Phase 20 error pattern: `await + try/catch + MatSnackBar('Dismiss', 5000ms) + callSiteTag + re-throw` with `[PIPELINE_WRITE_FAILURE]` console telemetry on Pipeline.receive failures.
- **AR-10:** Guard is failure-resumable: if any of the 5 inline bootstrap calls fails partway, retry on next load detects partial state and resumes WITHOUT duplicating already-created records.

## Dependencies

- Bootstrap walkthrough recipe validated (done — `bootstrap-w3geekery-engagement.md` + DECISIONS.md).
- Branded login package deployed (S3 — done, Andrey subdomain nice-to-have, default ZB login URL is fallback).
- Phase 28 form (routing destination) — can stub a placeholder surface in Phase 27 and wire for real in Phase 28.
- Phase 30 default project board (routing destination for confirmed users) — same, stub-in-Phase-27-wire-in-Phase-30 is fine.
- `getPrincipal().isAdmin` SDK call (in place).

## Verification

- Log out, hit a SME Mart URL → redirect to branded login.
- Log in as a fresh test user whose Org has no default ZB engagement → guard creates Engagement + Project; user lands on Phase 28 form with pre-populated fields (once Phase 28 ships).
- Log in as an existing user whose Org ALREADY has the default engagement (e.g., W3Geekery) → guard skips (fast path); user lands on Phase 30 project board.
- Log in as an admin → lands on admin dashboard; Phase 24 demo-data gate applies correctly.
- Spot-check a newly-created default Engagement via GQL: `Engagement(id: ".eq.<new-id>") { tag { value } }` returns the tag UUID (validates at-ingest tagging fired).

## Out of scope

- Andrey subdomain provisioning (external; fallback works).
- Phase 28 form UI (separate phase; Phase 27 only routes to a Phase 28-owned surface).
- Phase 30 project board (separate phase; Phase 27 only routes to a Phase 30-owned surface).
- Batch pre-creation for all existing platform Orgs (separate director brief: `batch-prime-engagements-for-existing-orgs.md`).
- Multi-engagement selection (per Brian direction, default ZB engagement is invariant; marketplace Create Engagement UI stays for non-default cases, which is unaffected).
- Session-refresh / token-rotation logic (platform SDK handles this).
- **Per-app SME Mart ToS gate** — deferred to v1.5 per DECISIONS.md "Per-App ToS Architecture — Two-Layer" (4-28). No content from Brian yet, no class anchor decided. Plan 27 may leave a `// TODO: per-app ToS gate (v1.5)` comment at the post-auth, pre-Phase-28-route insertion point.
- **Retroactive Object.tag remediation for non-W3Geekery existing orgs** (separate director brief: `batch-prime-engagements-for-existing-orgs.md`).
- **Migration of W3Geekery's existing hydra tag from `other` to `marketplace` tagType** — pure churn per DECISIONS.md "Marketplace tagType Is Preferred for New Tags".

## References

- `.planning/director/bootstrap-w3geekery-engagement.md` (the validated recipe + refinements; Steps A–E are the guard's inline logic)
- DECISIONS.md "Default ZB Engagement is Auto, Invariant, Compliance-Driven — NOT a Product UI Concern"
- DECISIONS.md "Object.tag Field Shape — Validated via UAT Experiment" (guard uses this for tag-at-ingest)
- DECISIONS.md "W3Geekery Object.tag Remediation" (skip-path validated for first customer)
- DECISIONS.md "Platform-Assigned Class IDs Are Not Deterministic UUID v5" (canonical const requirement)
- DECISIONS.md "Marketplace tagType Is Preferred for New Tags" (4-29 — new tags use `marketplace`)
- DECISIONS.md "Per-App ToS Architecture — Two-Layer" (4-28 — explains why ToS gate is v1.5, not Phase 27)
- Phase 20 telemetry pattern (callSiteTag + MatSnackBar + `[PIPELINE_WRITE_FAILURE]`) — see `.planning/phases/20-fire-and-forget-audit/AUDIT.md`
- `login/` package (branded login — deployed, no changes needed)
- Memory: `project_sme_mart_admin_detection.md`
