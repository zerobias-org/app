---
phase: 26-seed-provider-zb-as-provider
plan: 02
subsystem: marketplace-provider-seeding
tags: [tdd, option-b, provider-type-section, marketplace-profile-item, uat-seeded]

# Dependency graph
requires: [26-01]
provides:
  - "SeedZbProviderService Angular service (option-b distinguisher)"
  - "8 ZeroBias MPI records seeded on UAT (live, GQL-verified)"
  - "Cleanup of mpi-test-a/b residue per CLEANUP-25 (verified absent post-seed)"
  - "Unit tests (8) over service shape, batch construction, and SDK contract"
affects:
  - "Plan 26-03 (Browse Providers can now query live ZB MPI data on UAT)"
  - "Phase 28 (company profile form will pre-fill from these 8 sections)"

# Tech tracking
tech-stack:
  added:
    - "src/app/core/services/seed-zb-provider.ts (Angular service)"
  removed:
    - "scripts/seed-zb-provider.ts (deleted; no second source of truth)"
  patterns:
    - "TDD: red -> green -> live UAT seed via ZB MCP -> GQL read-back"
    - "Mocks mirror real SDK contract (platformClient is a property, not method)"
    - "Empirically-validated UAT class id (vs codebase deterministic UUID v5)"

key-files:
  created:
    - "src/app/core/services/seed-zb-provider.ts"
    - "src/app/core/services/seed-zb-provider.spec.ts"
  deleted:
    - "scripts/seed-zb-provider.ts"

key-decisions:
  - "Option-b distinguisher (Plan 26-01): provider_type section with data='platform'"
  - "MPI class id 7bcf86a5-91dc-520d-b9bf-e308b1078d46 (empirically accepted by UAT Pipeline.receive)"
  - "Codebase const ee1e68b7-... in pipeline-write.service.ts:36 was REJECTED by platform — divergence flagged for Director cleanup"
  - "Single source of truth in src/ (Angular service); no scripts/ duplicate"
  - "Spec mocks mirror real SDK shape (clientApi.platformClient.getPipelineApi())"

patterns-established:
  - "Spec mock contract derived from production service (pipeline-write.service.ts), not invented"
  - "Live UAT seed via mcp__zerobias__zerobias_execute (sanctioned path per CLAUDE.md)"
  - "GQL read-back via graphql.Boundary.boundaryExecuteRawQuery against W3Geekery boundary"

requirements-completed: ["SP-04", "SP-05", "SP-06"]

# Metrics
completed: 2026-04-28
test_files: 1
test_cases: 8
test_status: ALL PASSING (under npm test / ng test)
build_status: ng build --configuration=development PASSING
tsc_status: tsconfig.app.json + tsconfig.spec.json both clean
uat_seed_status: COMPLETE (8 records ingested, cleanup verified)
commits: 4
---

# Phase 26 Plan 02: ZeroBias Provider Seed — UAT Complete

ZeroBias seeded as a marketplace provider on UAT via Pipeline.receive. 8 MPI records ingested (7 company_info + 1 provider_type=platform). CLEANUP-25 residue removed. GQL read-back confirms materialization.

## UAT Execution Artifacts

### Seed call (live, sanctioned MCP path)

```
mcp__zerobias__zerobias_execute path=platform.Pipeline.receive
  pipelineId: 43f08afd-7ab9-4e99-a93c-619c46adaabe   (UAT W3Geekery pipeline)
  simpleBatch:
    classId: 7bcf86a5-91dc-520d-b9bf-e308b1078d46    (empirical MPI class id)
    tagIds: []
    markDeleted: ["mpi-test-a-cd7105df", "mpi-test-b-cd7105df"]
    data: 8 records (orgId 57c741cf-a58e-5efc-bf2f-93c4f6cf76ec — ZeroBias)
```

Response: `{"success":true,"message":"Operation completed (no content returned)"}`
Profile: `uat-clark@w3geekery` (active, connected)

### GQL Query 1 — Verify all 8 records seeded

```graphql
{ MarketplaceProfileItem(orgId: ".eq.57c741cf-a58e-5efc-bf2f-93c4f6cf76ec")
  { id section data status } }
```

Result (boundary `c15fb2dc-4f8c-48b5-b27a-707bd516b005`, gqlCount: 8):

| section | data | status |
|---|---|---|
| legal_name | ZeroBias | active |
| logo_url | https://zerobias.com/logo.png | active |
| short_blurb | Cybersecurity and compliance automation platform | active |
| long_description | ZeroBias is a platform for automating cybersecurity and compliance frameworks. | active |
| website | https://zerobias.com | active |
| years_in_business | 10 | active |
| employee_count | 201-500 | active |
| **provider_type** | **platform** | active |

### GQL Query 2 — Verify cleanup residue absent

```graphql
{ MarketplaceProfileItem(id: ".in.[mpi-test-a-cd7105df,mpi-test-b-cd7105df]")
  { id section } }
```

Result: `[]` (0 rows) — CLEANUP-25 cleared.

### GQL Query 5 — Verify option-b distinguisher

```graphql
{ MarketplaceProfileItem(orgId: ".eq.57c741cf-...", section: ".eq.provider_type")
  { id section data status } }
```

Result: 1 row, `data: "platform"`, `status: "active"`. Browse Providers + Phase 28 can discover platform providers via this section.

## Implementation

`src/app/core/services/seed-zb-provider.ts` — Angular `@Injectable({ providedIn: 'root' })` service:
- `inject(ZerobiasClientApi)` (matches pipeline-write.service.ts:75 pattern)
- `buildBatch()`: returns `SimpleBatch(new UUID(classId), records, [], CLEANUP_IDS)`
- `seed()`: `clientApi.platformClient.getPipelineApi().receive(new UUID(pipelineId), batch)` — property access on `platformClient`, not method call
- No `main()` stub, no `import.meta.url` block, no second copy in `scripts/`

`src/app/core/services/seed-zb-provider.spec.ts` — Vitest + TestBed:
- Mock client matches `pipeline-write.service.spec.ts` exactly: `platformClient: { getPipelineApi: () => mockPipelineApi }` (property)
- 8 tests covering: deterministic ids, no Object.tag, provider_type=platform, section coverage, class id, cleanup id list, batch shape, receive() call signature

## Defects Fixed (from prior agent's work)

| # | Defect | Fix |
|---|--------|-----|
| 1 | Wrong MPI class id (`ee1e68b7-...` codebase const) | Replaced with empirically-validated `7bcf86a5-...`; commented divergence inline |
| 2 | `client.platformClient()` (method call) | `client.platformClient.getPipelineApi()` (property access) per real SDK |
| 3 | `ZerobiasClientApp.getInstance()` (doesn't exist) | Removed; service uses `inject(ZerobiasClientApi)` |
| 4 | Mocks shaped to broken impl (false-green) | Mocks rederived from production service (pipeline-write.service.ts) |
| 5 | Task 3 was "preparation" not execution | Live UAT seed run via ZB MCP; GQL read-back captured above |
| 6 | `scripts/seed-zb-provider.ts` was a no-op stub | Deleted entirely |
| 7 | Two duplicate copies | One source of truth in `src/` |

## Build / Test Status

```
$ npx tsc --noEmit -p tsconfig.app.json    # clean
$ npx tsc --noEmit -p tsconfig.spec.json   # clean
$ npx ng build --configuration=development # Application bundle generation complete (7.5s)
$ npm test -- --include='**/seed-zb-provider.spec.ts'  # 8 passed
```

Dev server (`npm run dev`) is unblocked. The TS2339 errors that were preventing `ng serve` initial compile are resolved.

## Commits (chain on top of existing 26-02 history; no amends)

| Commit | Subject |
|--------|---------|
| 9082418 | test(26-02): add failing tests for seed-zb-provider.ts (red phase) — prior agent |
| f825b2d | feat(26-02): implement seed-zb-provider.ts (green phase) — prior agent |
| 5f5e9fc | refactor(26-02): align src/ and scripts/ implementations — prior agent |
| 8283d93 | docs(26-02): plan summary v1 — prior agent |
| {pending} | fix(26-02): correct class id, SDK shape, drop CLI stub — actual UAT seed complete |

## Director Follow-Ups (not blocking 26-02)

1. **Class ID divergence**: `pipeline-write.service.ts:36` says `MarketplaceProfileItem: 'ee1e68b7-f003-5f5f-a111-7ec93b37681c'` but UAT Pipeline.receive rejects that ID with `No such Class`. The empirically-accepted ID is `7bcf86a5-91dc-520d-b9bf-e308b1078d46`. Either every MPI write through PipelineWriteService is silently failing or there are two registered classes (one per ID). Director to investigate / update DECISIONS.md to clarify which UUID is authoritative for which path (Pipeline.receive class id vs class metadata UUID vs schema-derived UUID v5).
2. **DIRECTOR-PARKS-RESUME.md** + **phase-26-brief.md** still reference `7bcf86a5-...` from yesterday's session — those are correct and should be retained over the codebase const.
3. **Feedback memory** to be written: `feedback_tests_passing_against_wrong_shape_mocks.md` (see commit body).

## Next Phase Readiness

- ZB MPI data is live and queryable on UAT
- Plan 26-03 (Browse Providers UI tests) can now exercise both unit-test mocks AND live data via UAT environment
- Phase 28 form pre-fill has 8 real sections to read

---

*Phase: 26-seed-provider-zb-as-provider*
*Plan: 02*
*Completed: 2026-04-28*
*Distinguisher: option-b (MPI provider_type section)*
*Status: UAT-VERIFIED — ready for Wave 3*
