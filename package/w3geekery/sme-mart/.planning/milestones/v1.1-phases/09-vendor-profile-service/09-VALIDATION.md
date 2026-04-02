---
phase: 09
slug: vendor-profile-service
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Angular TestBed + Jasmine (via `ng test`) |
| **Config file** | `angular.json` test configuration |
| **Quick run command** | `npm test -- --include src/app/core/services/vendor-profile` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --include src/app/core/services/vendor-profile`
- **After every plan wave:** Run `npm test -- --include src/app/core`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-00 | 01 | 0 | VPS-05 | scaffold | `npm test -- --include vendor-profile` | ❌ W0 | ⬜ pending |
| 09-01-01 | 01 | 1 | VPS-04 | unit | `grep MARKETPLACE_PROFILE_ITEM_FIELD_MAPPING src/app/core/field-mappings.ts` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | VPS-01,VPS-02,VPS-03 | unit | `npm test -- --include vendor-profile.service` | ❌ W0 | ⬜ pending |
| 09-01-03 | 01 | 1 | VPS-05 | roundtrip | `npm test -- --include vendor-profile.roundtrip` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/core/services/vendor-profile.service.spec.ts` — test scaffold for VendorProfileService
- [ ] `src/app/core/services/vendor-profile.roundtrip.spec.ts` — roundtrip test scaffold

*Existing infrastructure (TestBed, Jasmine, ng test) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GQL query returns real data | VPS-01 | Requires live platform with schema loaded | Query `MarketplaceProfileItem` via Apollo Sandbox on UAT |
| Pipeline write persists | VPS-02 | Requires live pipeline endpoint | Create item via service, wait 10s, verify via GQL query |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
