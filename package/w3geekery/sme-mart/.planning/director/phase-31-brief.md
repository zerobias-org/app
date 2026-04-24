# Phase 31 — W3Geekery as First Customer + Production Smoke Test

**Milestone:** v1.4 "3P Onboarding & Default Engagement" (closing phase)
**Est:** 4–6 hrs (dogfood walkthrough + smoke test report)
**Repos:** `app/` (no code — this phase USES what phases 24–30 built).
**Origin:** Errata 022 (3p-plan-missing-w3geekery-as-first-customer-dogfood). Closes the v1.4 loop: the walkthrough engagement we created 2026-04-23 becomes the real production smoke-test target.

## Goal

Log into SME Mart as a W3Geekery user on UAT (and then on prod, once promoted), walk the full onboarding + default-project-board flow end-to-end, and produce a smoke-test report. No new features; this phase is purely verification that v1.4 delivers the intended experience for the first real customer. Failures here become immediate errata/hotfix items, not deferred.

## Architecture

### Starting state
- Phases 24–28, 30 have all shipped.
- Default ZB engagement + SmeMartProject for W3Geekery exist on UAT (created 2026-04-23 via walkthrough; retroactively tagged in Phase 26).
- ZeroBias seeded as marketplace provider (Phase 26).
- Lazy guard (Phase 27) will detect the existing engagement and skip creation.
- Demo data visibility gate (Phase 24) hides seeded demo providers from non-admin users.
- Branded login deployed; `https://w3geekery.uat.zerobias.com` subdomain may or may not be live (Andrey-dependent; fallback to default ZB login URL works).

### Deliverables

1. **End-to-end dogfood walkthrough on UAT.** Clark (as W3Geekery user) logs in through the branded login, gets routed by Phase 27's logic, hits Phase 28's company-profile form, reviews/confirms, lands on Phase 30's default project board. Every step recorded in a walkthrough report with screenshots.
2. **Smoke-test report** at `.planning/director/v1.4-smoke-test-report.md`. Sections:
   - Environment + session details (UAT, user id, org id, browser, build SHA)
   - Per-phase observations (one subsection per phase 24–28, 30)
   - Pass / Fail / Partial verdict per phase
   - Friction log (anything surprising, unclear, or annoying — bugs + UX concerns separately)
   - List of follow-up actions: errata to file, hotfix phase candidates, v1.5 backlog adds
3. **Errata filing for any failures.** If something blocks the flow (crash, missing field, wrong route), file an errata immediately + prep a hotfix phase. If it's cosmetic or UX-only, file to v1.5 backlog.
4. **Production promotion checklist.** Once UAT smoke passes, a brief for promoting the same flow to production (`.planning/director/v1.4-production-promotion.md` — 1-page checklist). NOT a phase — promotion involves:
   - Merge cross-fork PR `w3geekery/app:poc/sme-mart` → `zerobias-org/app:main` (or the right prod branch).
   - Batch-prime default engagements for existing prod customer Orgs (separate director brief that gets run after promotion).
   - Production smoke-test pass by Clark (repeat of the UAT walkthrough but on `https://app.zerobias.com/sme-mart`).
5. **Close v1.4.** Once UAT + prod smoke both pass, v1.4 is closed. `/gsd:complete-milestone` runs (Clark's call, not Director's).

## Requirements

- **V14-01:** UAT smoke walkthrough executed end-to-end; `v1.4-smoke-test-report.md` exists.
- **V14-02:** All 6 active phases (24, 25, 26, 27, 28, 30) have a pass/fail verdict in the report.
- **V14-03:** Any blockers have errata filed + hotfix phase queued.
- **V14-04:** Production promotion checklist exists as a separate director brief.
- **V14-05:** Friction log populated honestly — not a "everything's fine" whitewash.

## Dependencies

- Phases 24–28, 30 shipped + merged.
- UAT environment healthy (pipeline, auth, GQL all green).
- Clark available for the walkthrough (cannot be automated — this is a human UAT).

## Verification

- **This phase IS the verification** for v1.4. Verdict is the smoke-test report.
- Meta-verification: re-run any Phase 24 (visibility gate) tests against the smoke-test user — non-admin must not see demo data in any listing.
- Meta-verification: re-run Phase 27 guard on a test Org that has NO default engagement yet (synthetic, not W3Geekery) — confirm guard creates Engagement + SmeMartProject with `tag` populated at ingest.

## Out of scope

- New feature work (Phase 31 is verification only).
- Batch-priming default engagements for ALL existing prod Orgs (separate director brief, runs after prod promotion).
- Synthetic ACME demo seeder (per SESSION-STATE — deferred to v1.5 backlog; Phase 31 IS the real verification so ACME is redundant for v1.4).
- Automated smoke suite (v1.5+ test-infra milestone per `feedback_unit_tests_default_test_infra_deferred.md`).
- Prod promotion execution itself — Phase 31 produces the checklist; actual promotion is a separate commit + PR + smoke-test cycle that Clark drives.

## References

- Errata 022 (`.planning/director/errata/022-3p-plan-missing-w3geekery-as-first-customer-dogfood.md`)
- `.planning/director/bootstrap-w3geekery-engagement.md` (walkthrough artifacts + UUIDs; Phase 31 consumes them)
- DECISIONS.md "Default ZB Engagement Bootstrap — W3Geekery" (4 canonical UUIDs + retroactive tag plan)
- DECISIONS.md "v1.4 Test-Infra Deferral and Unit-Test Default" (why Phase 31 is manual and not automated)
- Future: `.planning/director/v1.4-production-promotion.md` (written during Phase 31, consumed by Clark to promote)
- Future: `.planning/director/batch-prime-engagements-for-existing-orgs.md` (separate brief — prereq for prod smoke-pass to be meaningful across all customer Orgs)
