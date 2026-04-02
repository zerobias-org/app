---
phase: 10
slug: vendor-profile-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Karma/Jasmine (Angular CLI default) |
| **Config file** | `karma.conf.js` |
| **Quick run command** | `npx ng test --include='**/profile-tab*' --watch=false` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run targeted spec for changed component
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | VPU-01 | unit | `npx ng test --include='**/profile-tab*' --watch=false` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | VPU-02 | unit | `npx ng test --include='**/profile-section*' --watch=false` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 1 | VPU-03 | unit | `npx ng test --include='**/profile-item-drawer*' --watch=false` | ❌ W0 | ⬜ pending |
| 10-02-02 | 02 | 1 | VPU-04 | unit | `npx ng test --include='**/profile-item-drawer*' --watch=false` | ❌ W0 | ⬜ pending |
| 10-02-03 | 02 | 1 | VPU-05 | unit | `npx ng test --include='**/profile-tab*' --watch=false` | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 2 | VPU-06 | unit | `npx ng test --include='**/expiration*' --watch=false` | ❌ W0 | ⬜ pending |
| 10-03-02 | 03 | 2 | VPU-07 | unit | `npx ng test --include='**/expiration*' --watch=false` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/pages/org/tabs/profile-tab.component.spec.ts` — stubs for VPU-01, VPU-02, VPU-05
- [ ] `src/app/shared/components/profile-item-drawer/profile-item-drawer.component.spec.ts` — stubs for VPU-03, VPU-04
- [ ] Expiration utility spec — stubs for VPU-06, VPU-07

*Existing infrastructure covers test framework (Karma/Jasmine installed).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Side drawer slide animation | VPU-03 | Visual timing, not unit-testable | Open drawer, verify smooth slide-in from right |
| Optimistic update latency | VPU-03 | Timing-dependent, needs live GQL | Edit item, verify UI reflects change within 2-3s |
| Welcome card removal | N/A | State transition after first item | Create first item on brand-new org, verify welcome card disappears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
