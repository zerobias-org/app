# SME Mart

## What This Is

SME Mart is a marketplace for Subject Matter Experts in compliance and cybersecurity — "Upwork meets Whop" for ZeroBias platform users. Built with Angular 21, it connects buyers seeking compliance services (SOC 2, ISO 27001, HIPAA, etc.) with qualified providers. The app runs on Vercel with all 17 entity types reading/writing through ZeroBias AuditgraphDB.

## Core Value

A transparent, task-gated marketplace where every boundary API operation requires task/subtask approval — demand/supply/transparency partitions at every level of the hierarchy.

## Current Milestone: v1.1 Org Navigation & Vendor Profile

**Goal:** Three-tier org navigation as foundation, then supply-side vendor profile with one-time corporate doc loading and engagement pre-fill.

**Target features:**
- Plan 079: My Organizations refactor — `/orgs` card/table list, `/orgs/:orgId` read-only overview (members, groups, boundaries), org switching stub
- Plan 041: Supply-side vendor profile — `VendorProfileItem` GQL entity, 6 profile sections, engagement vetting pre-fill from org profile

## Current State (after v1.0)

- **Data layer:** All 17 entity types on AuditgraphDB (Pipeline writes + GraphQL reads). Neon PostgreSQL in observation period (archival 2026-04-02).
- **Services:** 14 domain services migrated/built against Pipeline+GQL. 7 non-migrated services still use SmeMartDbService (categories, notifications, etc.).
- **Tests:** 94+ Bloom tests, 27 Wave 3 tests, roundtrip validation for all entities. Build errors in unrelated components block full `npm test`.
- **Codebase:** 40,882 LOC TypeScript, Angular 21 standalone components.
- **Live:** Vercel deployment on `poc/sme-mart` branch.

## Requirements

### Validated

- ✓ All 8 existing entities migrated from Neon to Pipeline+GQL — v1.0
- ✓ 9 new Project Bloom entity services built on Pipeline+GQL — v1.0
- ✓ Field mapping infrastructure (17 constants, types, roundtrip tests) — v1.0
- ✓ Zero component changes during migration — v1.0
- ✓ Demo data seeding via Pipeline — v1.0
- ✓ SmeMartDbService removed from all migrated services — v1.0

### Active

- [x] My Organizations refactor — three-tier org navigation (Plan 079) — Validated in Phase 7: Org Navigation (2026-03-31)
- [ ] Supply-side vendor profile — one-time corporate doc loading (Plan 041) — Schema validated in Phase 8 (2026-04-01)
- [ ] Task/subtask partitioning into demand/supply/transparency (CEO P0, deferred)
- [ ] Tasks as runtime access control — boundary API gating via task approval (deferred)
- [ ] Hard requirements (1-5) / soft requirements (6-10) approval model (deferred)
- [ ] Supply-side explicit resource requirements (ARN, IAM, data objects, schedule) (deferred)
- [ ] Project Bloom UI (boards, tasks, activities, workflows) (deferred)
- [ ] Neon table archival (scheduled 2026-04-02)
- [ ] Transparency Center (aggregated rollups from subtask → project) (deferred)

### Out of Scope

- Auth flow / login — ZeroBias platform handles this
- LLM-assisted bid generation — separate initiative
- Scoring app — separate ZB platform app
- Billing app — separate ZB platform app
- E2E Playwright tests — separate initiative
- Internal Marketplace (BU-to-BU) — future concept
- Reverse Bid Flow — future concept

## Context

- **Architecture:** Angular 21 standalone components, PipelineWriteService (writes) + GraphqlReadService (reads), optimistic updates for eventual consistency
- **Pipeline:** `091d5068-0527-4f45-9839-37f6d5c1669e` (SME Mart Entity Pipeline)
- **Schema:** `zerobias-org/schema` YAML packages, auto-deployed on merge, 15-min reload
- **Team:** Clark (W3Geekery contractor, 15 hrs/week), Kevin (CIO, platform), Brian (CEO, directives)
- **Deployment:** Vercel (temporary), target: ZeroBias platform publishing

## Constraints

- **Tech stack:** Angular 21, standalone components, no Nx, `@zerobias-org/ngx-library`
- **Data layer:** Pipeline (writes) + GQL (reads) — no direct Neon for migrated entities
- **Budget:** 15 hrs/week contractor time
- **CEO priority:** Task/subtask partitioning is THE critical path

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Direct swap (no adapter pattern) | Services already isolated, swap internals | ✓ Good — zero component changes |
| Wave-based migration (core → attachments → standalone → bloom) | Dependency-ordered, highest usage first | ✓ Good — smooth progression |
| Optimistic updates for write visibility | Pipeline 5-10s async delay | ✓ Good — UX feels instant |
| 9 Bloom entities built on clean Pipeline foundation | No legacy to migrate | ✓ Good — clean services |
| Archive Neon (don't delete) | Safety-first, 2-week observation | — Pending (2026-04-02) |

---
*Last updated: 2026-04-01 after Phase 8 completion*
