---
phase: 14
slug: invitation-controls
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (via `ng test`) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- --include='**/rfp-invitation*'` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --include='**/rfp-invitation*'`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | D1-01 | unit | `npm test -- --include='**/sme-mart-project*'` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | D1-02 | unit | `npm test -- --include='**/rfp-invitation*'` | ❌ W0 | ⬜ pending |
| 14-01-03 | 01 | 1 | D1-04 | unit | `npm test -- --include='**/bids*'` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 2 | D1-06 | unit | `npm test -- --include='**/invited-vendors*'` | ❌ W0 | ⬜ pending |
| 14-02-02 | 02 | 2 | D1-03 | unit | `npm test -- --include='**/my-invitations*'` | ❌ W0 | ⬜ pending |
| 14-02-03 | 02 | 2 | D1-05 | unit | `npm test -- --include='**/my-invitations*'` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/core/services/rfp-invitation.service.spec.ts` — stubs for D1-02, D1-03, D1-04
- [ ] `src/app/core/services/bids.service.spec.ts` — add invitation gate test stubs for D1-04
- [ ] `src/app/pages/rfps/invited-vendors-tab.component.spec.ts` — stubs for D1-06
- [ ] `src/app/pages/my-invitations/my-invitations-list.component.spec.ts` — stubs for D1-05

*Existing infrastructure covers framework setup — only test file stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Teaser view shows limited RFP info for uninvited vendors | D1-04 | Visual layout verification | Navigate to invitation-only RFP as uninvited vendor; confirm title/summary visible but requirements hidden |
| Inline accept/decline banner on RFP detail | D1-03 | Visual + interaction flow | Navigate to RFP as invited vendor; confirm banner appears; click Accept/Decline |
| Invitation-only badge on RFP listing cards | D1-01 | Visual badge rendering | View RFP list; confirm lock icon + "Invitation Only" chip on relevant cards |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
