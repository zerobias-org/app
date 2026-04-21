---
id: "002"
priority: high
scope: sme-mart
effort: medium
found: 2026-04-21
status: open
promoted_to: null
---

# Demo/test data cleanup + non-admin visibility gate — before 3PO onboarding

Before any third-party organization (3PO) user sees SME Mart in UAT or prod, demo/test content must either be removed or hidden behind an admin-only visibility flag. Non-admins should see a clean marketplace, not seeded engagements/bids/projects/tasks from internal development.

## What "demo data" includes today

- **5 demo Engagements** (Pinnacle, FinTech, Startup XYZ, Lakewood, HealthTech) seeded by `src/app/test-helpers/demo-data-seeder.ts`
- **Demo Projects / Bids / BidResponses / Notes / Documents / Reviews / ServiceOfferings** keyed to those engagements in the same seeder (~5–10 of each type)
- **5 demo ZB Tasks** (`aha1-1` through `aha1-5`) in the W3Geekery SME Marketplace DEV boundary — re-created 2026-04-17, linked from demo engagements via `zerobiasTaskId`
- **Demo tags**: `sme-mart.eng.crystal-harbor`, `velvet-summit`, `amber-circuit`, `silver-bridge`, `coral-meadow` (service-segment tags on tasks/engagements)
- **Demo-seed marker tag** (`w3geekery.sme-mart.demo-seed`, `d618b602-...`) already applied to some resources by the seeder
- **Legacy demo data** still sitting in the ZeroBias-org `SME Marketplace` boundary (`e3871f0b-...`) with prefix `ENG <slug>:` — scheduled for decommission after boundary migration verifies

## Two design options

**(a) Delete before onboarding.** Run a one-shot cleanup script that finds everything tagged `w3geekery.sme-mart.demo-seed` + all resources whose `engagementTag` matches `sme-mart.eng.*` and removes them from Neon + AuditgraphDB + ZB boundary tasks. Clean slate for 3POs.
  - Pro: no demo cruft in prod/UAT, no risk of leaking test content.
  - Con: loses local demo utility for internal QA/sales demos once 3POs are live.

**(b) Visibility gate.** Add an `isDemo: boolean` (or equivalent tag-based filter) to every listing/query. Default filter is `isDemo=false`. Admins (ZeroBias members or an explicit role) see a toggle to surface demo content. Demo data stays in the system for internal use.
  - Pro: preserves demo data for sales/onboarding narratives.
  - Con: every list/filter in the app needs the gate applied consistently; risk of leaks if a query forgets the filter.

Recommendation leans toward **(b)** with a bulk-delete escape hatch, since SME Mart's marketplace narrative benefits from visible inventory even as real engagements accumulate. But the admin-visibility mechanism needs to be watertight — a single missed query leaks demo content to 3POs.

## Why now

UAT publish pipeline went live 2026-04-21 (PR #46); SPA reachable at `https://uat.zerobias.com/sme-mart/`. As soon as Brian/Kevin are ready to invite ZeroBias's first 3PO (HIS, Goshen, ArmorStack, per 2026-04-20 Slack huddle), whatever demo cruft is visible will be visible to them. The gate needs to land *before* that moment, not after an embarrassing "why does ArmorStack see Pinnacle Corp's SOC 2 engagement?" conversation.

## Blocked by / prerequisites

- **Schema decision:** does `isDemo` live on every marketplace entity (fan-out), or do we rely on the `w3geekery.sme-mart.demo-seed` tag as the single source of truth (query joins required)? Tag-based is cheaper to add but more expensive to query.
- **Admin identification:** who counts as an admin? ZeroBias org members? A specific team (`ZeroBias Admins`)? A per-user role? Tie to existing `@zerobias.com` email convention or a platform-level role.
- **Audit of existing queries:** need an inventory of every component / service / remote-table that lists marketplace content before the gate can be applied consistently. Likely 15–25 read surfaces.

## How to apply

When onboarding a new 3PO becomes a real near-term event (Brian signals or a Tuesday/Friday meeting commits a date), promote this from backlog to a proper milestone phase. Phase should include:

1. Decision: (a) delete, (b) gate, or hybrid
2. If (b): schema/tag strategy + admin-role definition
3. Query audit + gate application across all marketplace read surfaces
4. Cleanup script (even if (b) wins, we want the escape hatch)
5. E2E test: fresh 3PO user sees zero demo content
