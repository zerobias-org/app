---
phase: 8
slug: vendor-profile-schema
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | dataloader (ZeroBias platform schema validator) |
| **Config file** | `~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/catalog.yml` |
| **Quick run command** | `cd ~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart && PGUSER=postgres PGPASSWORD=welcome PGHOST=localhost PGPORT=15432 PGDATABASE=content_dev PGSSLMODE=disable dataloader --content-dev --skip-pgboss --skip-dynamo -d ./` |
| **Full suite command** | Same as quick run (dataloader validates entire schema package) |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every file change:** Run dataloader to validate YAML syntax + schema integrity
- **Before commit:** Dataloader must exit 0 and print "Importer finished successfully"
- **Before PR:** `npm run validate` (YAML naming) + dataloader (full validation)
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | VPR-01 | schema | dataloader run | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | VPR-02 | schema | dataloader run (enum validates) | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | VPR-03 | schema | dataloader run (field validates) | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | VPR-04 | schema | dataloader run (orgId field validates) | ❌ W0 | ⬜ pending |
| 08-01-05 | 01 | 1 | VPR-05 | manual | Cross-fork PR created and merged | N/A | ⬜ pending |
| 08-01-06 | 01 | 1 | VPR-06 | schema | dataloader exits 0 | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Verify `supabase-pg-content-dev` Docker container is running on port 15432
- [ ] Verify `dataloader` CLI is installed and current version
- [ ] Sync schema repo with `upstream/dev` before branching

*Existing infrastructure covers schema validation — no new test framework needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PR merged to schema:dev | VPR-05 | Requires GitHub PR review + merge | Create cross-fork PR with `gh pr create --repo zerobias-org/schema --base dev`, verify merge |
| GQL schema reload | VPR-05 | Platform process, ~15 min delay | After merge, wait 15 min, query `MarketplaceProfileItem` via GQL |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
