# Phase 27 — Auth Gate + Onboarding Routing + Lazy-on-Load Default-Engagement Guard

**Milestone:** v1.4 "3P Onboarding & Default Engagement"
**Est:** 8–12 hrs (auth routing + guard logic + onboarding state machine)
**Repos:** `app/` (SME Mart frontend). `login/` package already S3-deployed, no changes.
**Origin:** 3P plan core onboarding flow. Expanded scope per DECISIONS.md "v1.4 Phase 29 Deferred" — creation-side logic for the default ZB engagement moves INTO Phase 27 as a lazy-on-load guard.

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
2. **Lazy-on-load default-engagement guard.** After session is confirmed, query GQL for the current Org's default ZB engagement: `Engagement(engagementTag: ".eq.default-project", buyerZerobiasOrgId: ".eq.<currentOrgId>") { id }`. If zero results, run the bootstrap recipe INLINE (all 5 calls from the walkthrough brief, adapted to the current Org's UUIDs). On success, proceed; on failure, show a "Onboarding in progress — please retry in a moment" surface with an error-report option. Idempotent — fires at most once per Org's lifetime.
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
- **AR-06:** Guard populates `Object.tag` at ingest time for both the new Engagement and the new SmeMartProject (validated shape).

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

## References

- `.planning/director/bootstrap-w3geekery-engagement.md` (the validated recipe + refinements; Steps A–E are the guard's inline logic)
- DECISIONS.md "Default ZB Engagement is Auto, Invariant, Compliance-Driven — NOT a Product UI Concern"
- DECISIONS.md "Object.tag Field Shape — Validated via UAT Experiment" (guard uses this for tag-at-ingest)
- `login/` package (branded login — deployed, no changes needed)
- Memory: `project_sme_mart_admin_detection.md`
