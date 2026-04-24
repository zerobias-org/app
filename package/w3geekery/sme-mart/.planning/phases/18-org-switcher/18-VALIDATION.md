---
phase: 18
slug: org-switcher
status: in-progress
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-15
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit) + Playwright (E2E) |
| **Config file** | `vitest.config.ts` + `playwright.config.ts` |
| **Quick run command** | `npm test -- src/app/shared/components/user-profile-dropdown/` |
| **Full suite command** | `npm run test && npx playwright test e2e/specs/org-switcher.spec.ts` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- src/app/shared/components/user-profile-dropdown/`
- **After every plan wave:** Run `npm run test && npx playwright test e2e/specs/org-switcher.spec.ts`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | ORG-01 | unit | `npm test -- org-switcher.service.spec.ts` | ✅ | ✅ green |
| 18-01-02 | 01 | 1 | ORG-02 | unit | `npm test -- user-profile-dropdown.component.spec.ts` | ✅ | ✅ green |
| 18-01-03 | 01 | 1 | ORG-03 | e2e | `npx playwright test e2e/specs/org-switcher.spec.ts` | ✅ | ⬜ pending* |
| 18-01-04 | 01 | 1 | ORG-04 | integration | `npm run test` | ✅ | ⬜ pending* |

*Status: ⬜ pending (not run during TDD) · ✅ green (automated) · ❌ red · ⚠️ flaky*
*pending* = E2E/integration tests require local dev server (run via `/gsd:verify-work`)

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:
- ✅ Vitest configured (`vitest.config.ts`)
- ✅ Playwright configured (`playwright.config.ts`)
- ✅ Auth fixture present (`e2e/fixtures/auth.fixture.ts`)
- ✅ Base page objects available (`e2e/page-objects/base.page.ts`)
- ✅ Angular waitForAngular helper ready (`e2e/helpers/`)
- ✅ Spy/mock utilities via Vitest's `vi` namespace

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Org switcher submenu renders in Material menu | ORG-03 | Layout/Material integration | Open `/` with auth, click avatar, verify "Switch Organization" button visible with arrow_right icon |
| Dialog spinner animation during org switch | ORG-03 | Timing/animation | Trigger org switch, verify spinner appears briefly before reload |
| Page reload clears old org context | ORG-03 | Session/cookie reset | Monitor DevTools Application tab: verify `zb-current-dana-org-id` sessionStorage changes post-reload |

*All critical path behaviors have automated verification (unit + E2E).*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 45s (acceptable for Playwright startup overhead)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-15 (execution complete, all tests ready)
