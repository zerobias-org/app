---
phase: 27
slug: auth-onboarding-guard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-30
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jasmine + Karma (existing, Angular 21 default) |
| **Config file** | `karma.conf.js` (exists at repo root) |
| **Quick run command** | `npm test -- --include='**/onboarding*.spec.ts'` |
| **Full suite command** | `npm test` (→ `ng test --watch=false`) |
| **Estimated runtime** | ~30s targeted; ~60s full suite |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --include='**/onboarding*.spec.ts'`
- **After every plan wave:** Run `npm test` (full suite — guards against regressions)
- **Before `/gsd:verify-work`:** Full suite green AND grep checks for AR-06, AR-07, AR-08 pass
- **Max feedback latency:** ~30s (targeted) / ~60s (full)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 27-01-* | 01 (Branded Login Redirect) | 1 | AR-01 | unit | `npm test -- --include='**/branded-login*.spec.ts'` OR existing `app-init.service.spec.ts` | ❌ W0 | ⬜ pending |
| 27-02-* | 02 (Bootstrap Service) | 2 | AR-03, AR-06, AR-07, AR-08, AR-10 | unit | `npm test -- --include='**/onboarding-bootstrap.service.spec.ts'` | ❌ W0 | ⬜ pending |
| 27-02-grep-AR06 | 02 | 2 | AR-06 | grep | `grep -n "tag: \[{ value:" src/app/core/services/onboarding-bootstrap.service.ts` (≥2 matches: Engagement + SmeMartProject) | ❌ W0 | ⬜ pending |
| 27-02-grep-AR07 | 02 | 2 | AR-07 | grep | `grep -n "tagType: 'marketplace'\|tagType: \"marketplace\"" src/app/core/services/onboarding-bootstrap.service.ts` (≥1) | ❌ W0 | ⬜ pending |
| 27-02-grep-AR08 | 02 | 2 | AR-08 | grep | `grep -nE "SME_MART_CLASS_IDS\.(Engagement\|SmeMartProject)" src/app/core/services/onboarding-bootstrap.service.ts` (≥2); negative grep — no raw `7711aa41` or `c66114a2` outside `pipeline-write.service.ts` | ❌ W0 | ⬜ pending |
| 27-03-* | 03 (Guard) | 3 | AR-02, AR-04, AR-05, AR-09 | unit | `npm test -- --include='**/onboarding.guard.spec.ts'` | ❌ W0 | ⬜ pending |
| 27-03-shell | 03 (Bootstrap Shell) | 3 | AR-04 | unit | `npm test -- --include='**/onboarding-bootstrap-shell.component.spec.ts'` | ❌ W0 | ⬜ pending |
| 27-04-* | 04 (Routes) | 4 | AR-02 (integration) | unit (router) | `npm test -- --include='**/app.routes*.spec.ts'` OR routing assertion in guard spec | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

The following spec / source files do NOT exist yet and MUST be created during the phase. Planner assigns each to a specific plan + task; no test file is allowed to be skipped.

- [ ] `src/app/core/services/onboarding-bootstrap.service.ts` — the 5-call recipe service (covers AR-03, AR-06, AR-07, AR-08, AR-10)
- [ ] `src/app/core/services/onboarding-bootstrap.service.spec.ts` — unit tests for the service
- [ ] `src/app/core/guards/onboarding.guard.ts` — functional `CanActivateFn` (covers AR-01, AR-02, AR-04, AR-05, AR-09)
- [ ] `src/app/core/guards/onboarding.guard.spec.ts` — unit tests for the guard
- [ ] `src/app/core/services/branded-login.service.ts` (or extension of `app-init.service.ts`) — branded-login redirect helper
- [ ] `src/app/onboarding/onboarding-bootstrap-shell.component.ts` (+ `.html`, `.scss`) — loading + retry surface
- [ ] `src/app/onboarding/onboarding-bootstrap-shell.component.spec.ts`
- [ ] `src/app/core/utils/slug.ts` — `slugify(name: string): string` (only if no existing helper resolves; planner verifies in Wave 0)
- [ ] Export `SME_MART_CLASS_IDS` from `pipeline-write.service.ts` (currently module-private at line 10) — single-line touch

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| End-to-end branded-login redirect on UAT | AR-01 | Requires Andrey subdomain status (live or fallback path); browser session test | (1) Log out. (2) Navigate to UAT SME Mart URL. (3) Expect redirect to `https://w3geekery.uat.zerobias.com/login?redirect=...` (or default ZB login). (4) Log in. (5) Expect return to original URL. |
| End-to-end guard fires on a fresh org with no default engagement | AR-03 | Requires a fresh test org on UAT; cannot mock Pipeline.receive's full materialization in unit tests | (1) Create or use a test Org with no `Engagement(buyerZerobiasOrgId)` records. (2) Log in as a member. (3) Observe loading shell + 5-call sequence in network tab. (4) GQL spot-check: `Engagement(buyerZerobiasOrgId: ".eq.<orgId>") { id, tag { value } }` returns 1 result with the new tag. (5) `SmeMartProject(engagementId: ".eq.<engagementId>") { id, tag { value } }` returns the new project. |
| End-to-end guard skips on W3Geekery (already remediated) | AR-03 (skip path) | Requires the existing W3Geekery state | Log in as Clark (W3Geekery org). Network tab: ZERO `hydra.Tag.createTag` / `Task.create` / `Pipeline.receive` calls fire. Loading shell does not appear. |
| End-to-end admin user routes to admin dashboard | AR-05 | Requires an admin principal | Log in as a known admin. Expect immediate route to `/admin` after auth (no Phase 28 form, no `/onboarding/company-profile`). |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (8 files listed above)
- [ ] No watch-mode flags (all `npm test` invocations use `--watch=false` via existing `ng test` script)
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter once planner confirms each task points at a real spec

**Approval:** pending (Director sign-off after PLAN.md authored)
