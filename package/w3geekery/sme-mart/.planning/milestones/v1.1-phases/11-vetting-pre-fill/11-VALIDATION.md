---
phase: 11
slug: vetting-pre-fill
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Angular Karma/Jasmine |
| **Config file** | `karma.conf.js` / `angular.json` test config |
| **Quick run command** | `npm test -- --include=**/vetting*` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --include=**/vetting*`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-W0 | 01 | 0 | VPF-01..04 | stub | `test -f src/app/pages/engagements/tabs/vetting-tab.component.spec.ts` | ✅ | ⬜ pending |
| 11-01-01 | 01 | 1 | VPF-01 | unit | `grep 'profile_item_id' src/app/core/models/vetting-item.model.ts` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | VPF-02 | unit | `grep 'getMatchingProfileItems' src/app/core/services/vetting.service.ts` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 2 | VPF-01 | integration | `grep 'suggestion-panel\|Suggested from Profile' src/app/pages/engagements/tabs/vetting-tab.component.html` | ❌ W0 | ⬜ pending |
| 11-01-04 | 01 | 2 | VPF-02 | integration | `grep 'attachProfileItem\|detachProfileItem' src/app/pages/engagements/tabs/vetting-tab.component.ts` | ❌ W0 | ⬜ pending |
| 11-01-05 | 01 | 2 | VPF-03 | unit | `grep 'isExpired\|EXPIRING_SOON' src/app/pages/engagements/tabs/vetting-tab.component.ts` | ❌ W0 | ⬜ pending |
| 11-01-06 | 01 | 3 | VPF-04 | integration | `grep 'referenceCount\|isReferencedByVetting' src/app/core/services/vendor-profile.service.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Update existing `vetting-tab.component.spec.ts` with new test stubs for suggestion panel
- [ ] Create test stubs for profile item reference methods in `vetting.service.spec.ts`
- [ ] Existing infrastructure covers framework install

*Angular Karma/Jasmine already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Suggestion panel expands below vetting row | VPF-01 | Visual layout | Navigate to engagement vetting tab, verify inline panel appears below matching items |
| Expired item warning chip in suggestions | VPF-03 | Visual styling | Add expired profile item, check EXPIRED chip color (#eed5d1) in suggestion mini-panel |
| Checklist card auto-dismiss on profile update | VPF-03 | Cross-tab flow | Attach expired item, update it in Corporate Profile, reload vetting tab, verify card gone |
| Block deletion of referenced profile items | D-12 | Cross-tab flow | Attach profile item to vetting, navigate to Corporate Profile, try delete, verify blocked |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
