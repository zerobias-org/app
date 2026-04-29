# SME Mart

## What This Is

SME Mart is a marketplace for Subject Matter Experts in compliance and cybersecurity — "Upwork meets Whop" for ZeroBias platform users. Built with Angular 21, it connects buyers seeking compliance services (SOC 2, ISO 27001, HIPAA, etc.) with qualified providers. The app runs on Vercel with all 17 entity types reading/writing through ZeroBias AuditgraphDB. Vendors manage corporate profiles (6 sections: corporate identity, attestations, insurance, references, personnel, financial) that pre-fill engagement vetting. Organizations are navigable with Internal/External badges and project boundary parties.

## Core Value

A transparent, task-gated marketplace where every boundary API operation requires task/subtask approval — demand/supply/transparency partitions at every level of the hierarchy.

## Current Milestone: v1.4 3P Onboarding & Default Engagement

**Goal:** Wire authenticated ZB platform customers through a first-login flow: detect session, enforce the compliance-required default ZeroBias engagement (auto-created via the validated bootstrap recipe if missing), review-only company profile form pre-populated from platform data, land on a default project board with seeded ZB-as-provider content and honest "Coming Soon" placeholders for unfinished feature areas. W3Geekery dogfoods as first customer.

**Target features:**
- Demo Data Visibility Gate — hide demo records from non-admin users via Object.tag filtering (P24)
- Platform Data Audit — SDK inventory of pre-fillable org/user data for onboarding (P25)
- ZB-as-Provider Seed — company_info convention, placeholder ServiceOffering tiers (P26)
- Auth Gate + Onboarding Routing + Lazy Default-Engagement Guard (P27)
- Company Profile Review/Confirm Form — pre-populated from platform data (P28)
- Default Project Board + 3 "Coming Soon" placeholders (P30)
- W3Geekery Dogfood + Production Smoke Test (P31)

**Deferred from v1.3 to v1.5:** Phases 21-23 (Org Documents Center, Form Template Library, Transparency Controls). Phase 29 (tier display / ToS / branding) also deferred to v1.5. **Phase 20 (Fire-and-Forget Audit) was reclaimed and closed 2026-04-29 interleaved with v1.4 onboarding work** — see Validated requirements FF-01..FF-08 below.

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
- ✓ ZB-as-provider seed — `COMPANY-INFO-CONVENTION.md` ratified (17 sections), 8 MPI rows seeded on UAT with `provider_type=platform` distinguisher, Browse Providers UI rewired from Neon views to direct `boundaryExecuteRawQuery` against MarketplaceProfileItem, ZB card visible on `/providers` (Phase 26: SP-01, SP-02, SP-04, SP-05, SP-06) — v1.4
- ✓ **FF-01** — AUDIT.md exists with 60-row call-site catalog (44 fire-and-forget + 16 awaited; criticality + complexity per row) — Phase 20 — v1.4 — VALIDATED 2026-04-29 — see [`VERIFICATION.md`](phases/20-fire-and-forget-audit/VERIFICATION.md)
- ✓ **FF-02** — Class-ID re-verification: 23/23 `SME_MART_CLASS_IDS` entries confirmed canonical against `platform.Class.getClass` on UAT (corrects errata 023) — Phase 20 — v1.4 — VALIDATED 2026-04-29 — see [`VERIFICATION.md`](phases/20-fire-and-forget-audit/VERIFICATION.md)
- ✓ **FF-03** — Receiver-rejection telemetry: structured `[PIPELINE_WRITE_FAILURE] {className, callSite, errorMessage, timestamp}` event via console.warn on every push/delete rejection, then re-throw — Phase 20 — v1.4 — VALIDATED 2026-04-29 — see [`VERIFICATION.md`](phases/20-fire-and-forget-audit/VERIFICATION.md)
- ✓ **FF-04** — 33 CRITICAL+SIMPLE call sites remediated with `await` + try/catch + `MatSnackBar` + explicit `callSiteTag` + re-throw; rejection-path specs cover every remediated service (note-folder gap closed in Wave 3) — Phase 20 — v1.4 — VALIDATED 2026-04-29 — see [`VERIFICATION.md`](phases/20-fire-and-forget-audit/VERIFICATION.md)
- ✓ **FF-05** — `BACKLOG.md` "Fire-and-Forget Remediation Polish (v1.5)" carries `FF-POLISH-1/2/3` for sites needing UX upgrades beyond the SIMPLE pattern (bid retry, vetting batch granularity, submit-button-disable sweep) — Phase 20 — v1.4 — VALIDATED 2026-04-29 — see [`VERIFICATION.md`](phases/20-fire-and-forget-audit/VERIFICATION.md)
- ✓ **FF-06** — 16 AWAITED call sites verified with concrete `<file>.ts:NN — surfaces via <mechanism>` citations in AUDIT.md (5 proper user-visible surface, 2 no UI consumer wired, 2 NgZone-only fallthrough captured by FF-POLISH-3, 9 admin-only acceptable) — Phase 20 — v1.4 — VALIDATED 2026-04-29 — see [`VERIFICATION.md`](phases/20-fire-and-forget-audit/VERIFICATION.md)
- ✓ **FF-07** — WATCH-LIST pattern enforced: fire-and-forget `.catch(console.error)` on user-action paths is a BLOCK; `callSiteTag` parameter shape pulls callers into the await + try/catch contract; rejection-path specs gate the pattern at unit-test time — Phase 20 — v1.4 — VALIDATED 2026-04-29 — see [`VERIFICATION.md`](phases/20-fire-and-forget-audit/VERIFICATION.md)
- ✓ **FF-08** — WATCH-LIST pattern enforced: round-trip-per-class-id parameterized spec block (`pipeline-write.service.spec.ts`) maps every className → canonical UUID; length + uniqueness drift guards catch silent regressions on future class additions — Phase 20 — v1.4 — VALIDATED 2026-04-29 — see [`VERIFICATION.md`](phases/20-fire-and-forget-audit/VERIFICATION.md), [`ROUND-TRIP-RESULTS.md`](phases/20-fire-and-forget-audit/ROUND-TRIP-RESULTS.md)

### Active

- [ ] Demo data visibility gate — Object.tag filtering, admin escape hatch (v1.4 P24)
- [ ] Platform data audit — SDK inventory of pre-fillable fields (v1.4 P25)
- [ ] Auth gate + onboarding routing + lazy default-engagement guard (v1.4 P27)
- [ ] Company profile review/confirm form — pre-populated, skip-for-now (v1.4 P28)
- [ ] Default project board + "Coming Soon" placeholders (v1.4 P30)
- [ ] W3Geekery dogfood + production smoke test (v1.4 P31)
- [ ] Task/subtask partitioning into demand/supply/transparency (CEO P0, deferred)
- [ ] Tasks as runtime access control — boundary API gating via task approval (deferred)
- [ ] Transparency Center (aggregated rollups from subtask -> project) (deferred)

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
- **Pipeline (UAT):** `43f08afd-7ab9-4e99-a93c-619c46adaabe` (current SME Mart receiver)
- **Deployment:** ZeroBias platform publishing (UAT: `uat.zerobias.com/sme-mart`). Branded login at `w3geekery.uat.zerobias.com`.
- **Schema:** `zerobias-org/schema` YAML packages, auto-deployed on merge, 15-min reload. MarketplaceProfileItem added v1.1.
- **Team:** Clark (W3Geekery contractor, 15 hrs/week), Kevin (CIO, platform), Brian (CEO, directives)
- **W3Geekery default engagement (UAT):** Engagement `746010b7-dc99-436b-9142-8c4b85c5e623`, Project `ea4db55f-2c57-4567-a1be-6e7fd1a210bf`, Tag `a81cd320-243e-44eb-bdd9-9824019ef3dd`

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
| Default ZB engagement is auto/invariant | Compliance-driven, not opt-in UI | ✓ Good — recipe validated on UAT |
| Object.tag at ingest time | Tags immutable post-ingest per Kevin | ✓ Good — shape validated 2026-04-24 |
| Brian asks are placeholders, not blockers | Ship with defaults; Brian refines later | ✓ Good — unblocks milestones |
| Engagement naming `<Buyer> <- <Provider>` | Supply-flow direction, buyer-first | ✓ Good — aligns with Demand/Supply vocabulary |

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
*Last updated: 2026-04-24 after v1.4 milestone started*
