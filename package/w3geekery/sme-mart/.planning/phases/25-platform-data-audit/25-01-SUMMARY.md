---
phase: 25-platform-data-audit
plan: 01
subsystem: platform-data-audit
tags: ["research", "infrastructure", "verification"]
dependencies:
  requires: []
  provides:
    - platform-data-inventory-verification
    - per-source-documentation-template
    - audit-index-structure
  affects:
    - phase-25-plans-02-through-05
    - phase-26-company-info-convention
    - phase-28-company-profile-form
tech_stack:
  added:
    - bash-verification-script
  patterns:
    - artifact-based-validation
    - multi-file-index-pattern
key_files:
  created:
    - .planning/phases/25-platform-data-audit/scripts/verify-inventory.sh
    - .planning/director/PLATFORM-DATA-INVENTORY.md
    - .planning/director/platform-data-inventory/_TEMPLATE.md
  modified: []
decisions: []
metrics:
  duration: ~15 minutes
  completed_date: 2026-04-24
---

# Phase 25 Plan 01: Platform Data Audit Infrastructure

## Executive Summary

Established the foundational infrastructure for Phase 25 Platform Data Audit: a verification script, per-source documentation template, and index file skeleton. All Wave 0 prerequisite artifacts created and passing validation.

## What Was Built

### 1. Verification Script (`.planning/phases/25-platform-data-audit/scripts/verify-inventory.sh`)

**Location:** `.planning/phases/25-platform-data-audit/scripts/verify-inventory.sh`
**Status:** ✓ Executable, idempotent, passing all checks

The script performs the Wave 0 artifact verification contract:
- Checks that `.planning/director/PLATFORM-DATA-INVENTORY.md` exists (exit 1 if missing)
- Checks that `.planning/director/platform-data-inventory/` directory exists (exit 1 if missing)
- Checks that `.planning/director/platform-data-inventory/_TEMPLATE.md` exists (exit 1 if missing)
- Counts markdown files in the sub-directory (excluding `_TEMPLATE.md`) — reports count, exits 0 for any count ≥ 0
- Verifies index file contains all 4 required section headers:
  - `## Platform Data Inventory`
  - `## Pre-fill Map`
  - `## Known Unknowns`
  - `## Pipeline Health Check`
- Exits 0 on success, non-zero on any failure

**Sample output:**
```
✓ Index file exists: /Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/.planning/director/PLATFORM-DATA-INVENTORY.md
✓ Directory exists: /Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/.planning/director/platform-data-inventory
✓ Template file exists: /Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/.planning/director/platform-data-inventory/_TEMPLATE.md
✓ Source sub-files count:        0 (≥ 0 OK for Wave 1)
✓ Found section header: ## Platform Data Inventory
✓ Found section header: ## Pre-fill Map
✓ Found section header: ## Known Unknowns
✓ Found section header: ## Pipeline Health Check

All Wave 0 checks passed ✓
```

**Properties:**
- Idempotent — safe to run multiple times
- Fast — file checks + grep only, < 5 seconds
- Used by subsequent tasks (02–05) for continuous validation

### 2. Per-Source Template (`.planning/director/platform-data-inventory/_TEMPLATE.md`)

**Location:** `.planning/director/platform-data-inventory/_TEMPLATE.md`
**Status:** ✓ Created with 7 required sections

Standard template structure for all per-source audit sub-files (locked per RESEARCH.md §2):

```markdown
---
source: <SDK_method_or_GQL_query_or_hydra_method>
surface: SDK | GQL | hydra | portal-curl
verified: YYYY-MM-DD
uat_tested: true|false
---

## Signature
[exact method signature, return type, required/optional params]

## Sample Response (W3Geekery, real values)
[actual API response (JSON or markdown), truncate if >500 lines]

## Field List
[Table: Field | Type | Always Populated? | Org-Scoped? | Notes]

## Pre-fill Map Contributions
[Which Phase 28 form fields source from this call]

## Known Gaps / Edge Cases
[What's missing, null, conditional; org-scoping; latency notes]

## Write-Path Target (D-12)
[Which Platform class + field or SDK setter Phase 28 writes to]
```

**Requirements Met:**
- ✓ 7 required sections (frontmatter + 6 sections)
- ✓ Locked structure per RESEARCH.md §2
- ✓ Follows decision D-06 (per-source files)
- ✓ All 9 mandatory sources will follow this template

### 3. Index File Skeleton (`.planning/director/PLATFORM-DATA-INVENTORY.md`)

**Location:** `.planning/director/PLATFORM-DATA-INVENTORY.md`
**Status:** ✓ Created with skeleton structure

The single source-of-truth index consumed by Phase 26, 27, 28, and 30. Contains:

**Sections:**
1. **Executive Summary** — Phase 25 purpose and methodology
2. **Platform Data Inventory** — Audit coverage table (9 mandatory + 6 opportunistic sources)
3. **Pre-fill Map** — Form-field-first table (rows populated during Plans 02–03)
4. **Known Unknowns** — Fields needing user input or enrichment (populated during Plans 02–03)
5. **Pipeline Health Check Report** — Status placeholder (populated during Plan 05)
6. **References** — Links to CONTEXT.md, RESEARCH.md, VALIDATION.md, phase briefs, etc.

**Requirements Met:**
- ✓ Exists at correct path (`.planning/director/PLATFORM-DATA-INVENTORY.md`)
- ✓ All 5 required section headers present
- ✓ 9 mandatory sources enumerated in audit table
- ✓ 6 opportunistic expansion candidates listed
- ✓ Pre-fill map columns locked (form_field | source_call | platform_field_path | pre_fillable | save_target | notes)
- ✓ Known-unknown placeholder in place
- ✓ Pipeline health check status placeholder
- ✓ References section with links to canonical docs

### 4. Directory Structure

**Created:**
- `.planning/director/platform-data-inventory/` — Directory for per-source sub-files (currently empty, filled by Plans 02–03)

## Deviations from Plan

None — plan executed exactly as written.

## Next Steps

**Plan 02 (SDK Sources Audit):**
- Audit 6 mandatory SDK sources: whoAmI, getCurrentOrg, Org.search, User.search, Boundary, Task
- Create sub-files at `platform-data-inventory/<source>.md` for each
- Populate index's audit table (9 rows → 6 complete)

**Plan 03 (GQL Sources Audit):**
- Audit 3 mandatory GQL/hydra sources: boundaryExecuteRawQuery, hydra.Tag, hydra.Resource
- Create sub-files for each
- Complete the audit table (9 rows → 9 complete)

**Plan 04 (Pre-fill Map + Write-Path Synthesis):**
- Synthesize pre-fill map from Plans 02–03 findings
- Draft `company_info` convention shape (consumed by Phase 26)
- Document write-path targets (D-12)

**Plan 05 (Pipeline Health Check + Env Fix):**
- Three-part pipeline check: ping, app-code scan, env-file fix
- Commit `src/environments/environment.uat.ts` pipelineId update

## Verification

All Wave 0 checks passing:
```bash
bash .planning/phases/25-platform-data-audit/scripts/verify-inventory.sh
```

Output: All checks ✓

## References

- **PLAN.md:** 25-01-PLAN.md (tasks 1–3)
- **RESEARCH.md:** Per-source template (§2), pre-fill map columns (§8)
- **VALIDATION.md:** Wave 0 requirements, per-task verification map
- **CONTEXT.md:** Locked decisions D-01 through D-12
