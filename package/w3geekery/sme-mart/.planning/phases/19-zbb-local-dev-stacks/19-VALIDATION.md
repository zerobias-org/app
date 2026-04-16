---
phase: 19
slug: zbb-local-dev-stacks
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual smoke tests (infrastructure phase, not code) |
| **Config file** | N/A — stack manifests are the "source" |
| **Quick run command** | `zbb up sme-mart-spa && curl -s localhost:<port>/sme-mart/` |
| **Full suite command** | `zbb up sme-mart-spa && zbb up sme-mart-login` + curl verification |
| **Estimated runtime** | ~60 seconds (container startup + health checks) |

---

## Sampling Rate

- **After every task commit:** Manual stack smoke test (curl + browser verify)
- **After every plan wave:** Full stack lifecycle (up -> health -> curl -> stop)
- **Before `/gsd:verify-work`:** All success criteria verified via curl + browser
- **Max feedback latency:** ~60 seconds (container startup)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 0 | LS-02 | Integration | `cd module/... && npm run build && npm pack` | N/A | ⬜ pending |
| 19-01-02 | 01 | 1 | LS-01 | Integration | `zbb up sme-mart-spa && curl localhost:<port>/sme-mart/` | N/A | ⬜ pending |
| 19-01-03 | 01 | 1 | LS-04 | Unit | Verify nginx.conf uses env vars (MINIO_BUCKET parametrized) | N/A | ⬜ pending |
| 19-01-04 | 01 | 1 | LS-05 | Unit | `zbb env` validates import/export between stacks | N/A | ⬜ pending |
| 19-02-01 | 02 | 2 | LS-03 | Integration | `zbb up sme-mart-login && curl localhost:<port>/login/` | N/A | ⬜ pending |
| 19-02-02 | 02 | 2 | LS-06 | Documentation | Manual follow of README steps | N/A | ⬜ pending |

*Status: ⬜ pending . ✅ green . ❌ red . ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Verify `module/` Hub module builds cleanly (`npm run build` + `npm pack`)
- [ ] If build fails, fix before Verdaccio publish

*Note: This is infrastructure setup — no test framework installation needed. Verification is stack smoke tests, not unit tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SPA deep-route refresh | LS-01 | Browser-only (try_files fallback) | Navigate to `/sme-mart/rfps/abc123`, hit refresh, verify index.html served |
| Hub module API call | LS-01 | Requires running SPA + hub-server | Open SPA in browser, trigger API call, verify response |
| Login -> SPA session handoff | LS-03 | Cross-service browser flow | Login at login URL, verify redirect to SPA with valid session |
| cloudfront-sim reusability | LS-04 | Configuration verification | Use cloudfront-sim with different MINIO_BUCKET, verify both serve correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
