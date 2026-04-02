# SME Mart

## What This Is

SME Mart is a marketplace for Subject Matter Experts in compliance and cybersecurity — "Upwork meets Whop" for ZeroBias platform users. Built with Angular 21, it connects buyers seeking compliance services (SOC 2, ISO 27001, HIPAA, etc.) with qualified providers. The app runs on Vercel with all 17 entity types reading/writing through ZeroBias AuditgraphDB. Vendors manage corporate profiles (6 sections: corporate identity, attestations, insurance, references, personnel, financial) that pre-fill engagement vetting. Organizations are navigable with Internal/External badges and project boundary parties.

## Core Value

A transparent, task-gated marketplace where every boundary API operation requires task/subtask approval — demand/supply/transparency partitions at every level of the hierarchy.

## Current Milestone: v1.2 RFP Packages & Pilot Projects

**Goal:** Transform RFPs into structured multi-document packages with invitation controls, a simple form builder for structured submission requirements, document templates, and pilot project lifecycle.

**Target features:**
- Closed/invitation-only RFPs (D1)
- Multi-document packages with templates/exhibits (D2)
- Simple form builder — buyer-defined fields as JSON config, vendor dynamic renderer (D3)
- Document templates + preview (046 partial — enables template→instance workflow)
- Pilot Projects — projectType field, pilot→vetting item, pilot→real project lifecycle (077)
- Demo seed scripts — CLI for Friday Brian demos + cleanup

## Current State (after v1.1)

- **Data layer:** All 17 entity types + MarketplaceProfileItem on AuditgraphDB (Pipeline writes + GraphQL reads). Neon PostgreSQL pending archival.
- **Services:** 14 domain services migrated/built against Pipeline+GQL + VendorProfileService. 7 non-migrated services still use SmeMartDbService (categories, notifications, etc.).
- **Org navigation:** Three-tier navigation — `/orgs` list, `/orgs/:orgId` read-only detail, `/org` for current org editing. Org switching stubbed (requires session auth).
- **Vendor profile:** 6-section corporate profile on `/org` with CRUD, expiration indicators, renewal prompts. Vetting pre-fill suggestion panel with pointer-based attachments.
- **Boundary model:** Internal/External org badges, engagement/project counts, boundary parties tab with roles on project detail.
- **Tests:** 94+ Bloom tests, 27 Wave 3 tests, roundtrip validation for all entities. Build errors in unrelated components block full `npm test`.
- **Codebase:** ~77,000 LOC TypeScript, Angular 21 standalone components.
- **Live:** Vercel deployment on `poc/sme-mart` branch.

## Requirements

### Validated

- ✓ All 8 existing entities migrated from Neon to Pipeline+GQL — v1.0
- ✓ 9 new Project Bloom entity services built on Pipeline+GQL — v1.0
- ✓ Field mapping infrastructure (17 constants, types, roundtrip tests) — v1.0
- ✓ Zero component changes during migration — v1.0
- ✓ Demo data seeding via Pipeline — v1.0
- ✓ SmeMartDbService removed from all migrated services — v1.0
- ✓ My Organizations refactor — three-tier org navigation (Plan 079) — v1.1
- ✓ Project-centric boundary model — Internal/External badges, engagement/project counts, boundary parties tab (Plan 080) — v1.1
- ✓ Supply-side vendor profile — 6-section corporate docs, CRUD, expiration, pre-fill (Plan 041) — v1.1

### Active

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
- **Schema:** `zerobias-org/schema` YAML packages, auto-deployed on merge, 15-min reload. MarketplaceProfileItem added v1.1.
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
| Schema PR first for vendor profile | MarketplaceProfileItem blocks phases 9-11 | ✓ Good — unblocked cleanly |
| Single entity with section discriminator | Simpler than per-section classes | ✓ Good — flexible JSON data |
| Profile items as pointers (not copies) | Vetting sees live profile updates | ✓ Good — no stale data |
| /orgs/:orgId read-only | Editing stays on /org for current org | ✓ Good — clear separation |
| Org switching stubbed | Requires session auth, not API key | — Pending (platform dependency) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-02 after v1.2 milestone started*
