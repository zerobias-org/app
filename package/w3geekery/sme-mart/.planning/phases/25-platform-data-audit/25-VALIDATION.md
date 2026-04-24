---
phase: 25
slug: platform-data-audit
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-24
planned: 2026-04-24
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Phase 25 is a research-as-phase deliverable. No runtime code beyond the bounded
> `environment.uat.ts` pipelineId fix (D-04). Verification is artifact-based:
> file-existence, content presence, spot-check re-runs of cataloged sources.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — research artifact (no unit tests) |
| **Config file** | n/a |
| **Quick run command** | `bash .planning/phases/25-platform-data-audit/scripts/verify-inventory.sh` (Wave 0 installs) |
| **Full suite command** | Same as quick — single artifact-verification script |
| **Estimated runtime** | < 5 seconds (file checks + grep) |

---

## Sampling Rate

- **After every task commit:** Run `verify-inventory.sh` to confirm artifacts created so far still pass file-existence + content checks
- **After every plan wave:** Same script (it's idempotent and complete-state)
- **Before `/gsd:verify-work`:** All artifact checks pass + manual spot-check of 3 random sources via MCP
- **Max feedback latency:** < 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 25-01-01 | 01 | 1 | PDA-01 | artifact | `test -f .planning/director/PLATFORM-DATA-INVENTORY.md` | ✅ | ⬜ pending |
| 25-01-02 | 01 | 1 | PDA-01 | artifact | `test -d .planning/director/platform-data-inventory/` | ✅ | ⬜ pending |
| 25-01-03 | 01 | 1 | PDA-01 | artifact | `test -f .planning/phases/25-platform-data-audit/scripts/verify-inventory.sh` | ✅ | ⬜ pending |
| 25-02-01 | 02 | 2 | PDA-02 | artifact | `ls .planning/director/platform-data-inventory/*.md \| wc -l` ≥ 6 | ✅ | ⬜ pending |
| 25-02-02 | 02 | 2 | PDA-02 | artifact | `test -f .planning/director/platform-data-inventory/whoami.md` | ✅ | ⬜ pending |
| 25-02-03 | 02 | 2 | PDA-02 | artifact | `grep -q "legal_name" .planning/director/platform-data-inventory/currentorg.md` | ✅ | ⬜ pending |
| 25-03-01 | 03 | 2 | PDA-02 | artifact | `ls .planning/director/platform-data-inventory/*.md \| wc -l` ≥ 9 | ✅ | ⬜ pending |
| 25-03-02 | 03 | 2 | PDA-02 | artifact | `test -f .planning/director/platform-data-inventory/gql-class-objects.md` | ✅ | ⬜ pending |
| 25-03-03 | 03 | 2 | PDA-02 | artifact | `grep -q "hydra" .planning/director/platform-data-inventory/hydra-tag.md` | ✅ | ⬜ pending |
| 25-04-01 | 04 | 3 | PDA-03, PDA-04 | artifact | `grep -c "^\| " .planning/director/PLATFORM-DATA-INVENTORY.md` ≥ 10 | ✅ | ⬜ pending |
| 25-04-02 | 04 | 3 | PDA-03, PDA-04 | artifact | `grep -q "years_in_business" .planning/director/PLATFORM-DATA-INVENTORY.md` | ✅ | ⬜ pending |
| 25-04-03 | 04 | 3 | PDA-03, PDA-04 | artifact | `test -f .planning/director/COMPANY-INFO-CONVENTION-DRAFT.md` | ✅ | ⬜ pending |
| 25-05-01 | 05 | 3 | PDA-05 | artifact + commit | `grep "43f08afd-7ab9-4e99-a93c-619c46adaabe" src/environments/environment.uat.ts` exits 0 | ✅ | ⬜ pending |
| 25-05-02 | 05 | 3 | PDA-05 | artifact | `grep "Pipeline Health Check" .planning/director/PLATFORM-DATA-INVENTORY.md` exits 0 | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `.planning/phases/25-platform-data-audit/scripts/verify-inventory.sh` — single bash script that runs all artifact checks and exits 0/non-0
- [x] `.planning/director/platform-data-inventory/` directory created (empty placeholder OK during Wave 0)
- [x] `.planning/director/platform-data-inventory/_TEMPLATE.md` — per-source sub-file template (frontmatter + section skeleton, locked by research D-06 + §2 of RESEARCH.md)

*Wave 0 prerqs complete: verification script and template ready.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pre-fill map covers every Phase 28 form field | PDA-03 | Phase 28 brief enumerates fields in prose; cross-walk requires reading Phase 28 brief and visually checking each field has a row | Open `.planning/director/phase-28-brief.md`; for each field listed in the company-profile section, grep `PLATFORM-DATA-INVENTORY.md` for `\| <field_name> \|` — every field must appear once |
| Sample responses are real W3Geekery values (D-07) | PDA-02 | No automated way to confirm UUIDs/strings are from the real org vs. fabricated | Spot-check 3 random sub-files; verify UUIDs match `cd7105df-...` (W3Geekery org) or known DECISIONS.md UUIDs |
| Spot-check protocol: 3 sources re-run live | PDA-02 | MCP calls require profile lock + live network; can't be scripted into CI | Pick 3 sources from the 9 mandatory list; re-run via `mcp__zerobias__zerobias_execute` against W3Geekery; confirm response shape matches documented sample |
| Pipeline ping returns success on `43f08afd-...` | PDA-05 | Live network call; result captured in inventory's Pipeline Health Check section | Verify the inventory shows a successful ping payload + response (not a 404 or error) |
| Draft `company_info` convention covers Phase 28 form (D-01) | PDA-03 (downstream) | Convention is YAML/JSON shape; subjective whether it covers all Phase 28 fields | Phase 26 plan-checker validates during ratification; Phase 25 only requires the draft to exist |

*Five manual checks. Spot-check protocol is the canonical Nyquist sampling for this research phase.*

---

## Validation Sign-Off

- [x] All tasks have artifact-check verify or Wave 0 dependencies
- [x] Sampling continuity: artifact checks run after every task commit (verify-inventory.sh is idempotent)
- [x] Wave 0 covers the verification script + template (the only MISSING infra)
- [x] No watch-mode flags
- [x] Feedback latency < 5s (script is file-system grep + ls)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** Ready for execution
