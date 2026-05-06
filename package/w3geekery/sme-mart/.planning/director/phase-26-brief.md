# Phase 26 — Seed ZB-as-Provider + `company_info` Convention

**Milestone:** v1.4 "3P Onboarding & Default Engagement"
**Est:** 3–5 hrs (reduced from 5–7 after ServiceOffering scope removal)
**Repos:** `app/` (data seeding). No schema PR.
**Origin:** 3P plan direction: default engagement must have a provider (ZeroBias) visible in SME Mart. Amended 2026-04-24 per Clark direction: ServiceOffering seeding is now OUT of v1.4 pending Brian confirmation of the tier structure. See DECISIONS.md "ServiceOfferings Defer With Brian — Data-Model Brian Asks Block, Copy/Branding Don't".

## Goal

Seed ZeroBias as a first-class marketplace provider identity in the SME Mart data (no ServiceOffering records — those wait on Brian). Define a `company_info` convention for how any provider Org represents itself in the marketplace. Retroactively tag the W3Geekery walkthrough records with the validated `Object.tag` shape so they're discoverable via GQL tag filters.

## Architecture

### Starting state (updated 2026-04-27 post-Phase-25 close)

**Inputs ready from Phase 25:**
- `COMPANY-INFO-CONVENTION-DRAFT.md` — rewritten with the canonical 17-section catalog. MarketplaceProfileItem confirmed as generic `(section, data)` discriminator class — every "field" is its own MPI record.
- Pipeline.receive replace key validated as `id` only (per-section saves are independent). Deterministic id pattern: `mpi-<orgId>-<section>`.
- MarketplaceProfileItem class id captured: `7bcf86a5-91dc-520d-b9bf-e308b1078d46`.
- Pipeline UUID (UAT): `43f08afd-7ab9-4e99-a93c-619c46adaabe`.
- `Object.tag` shape validated `[{value: "<tag-uuid>"}]`; set at Pipeline.receive ingest time.

**Already done (during Phase 25 close):**
- W3Geekery Engagement (`746010b7-...`) and default SmeMartProject (`ea4db55f-...`) re-ingested with `Object.tag` populated. Tag-filter discovery works uniformly. ✅ (was originally SP-04's "retroactive tag push" requirement)

**Still pending:**
- ZeroBias is NOT yet represented as a marketplace provider on UAT. No MPI records exist for ZB org (`57c741cf-a58e-5efc-bf2f-93c4f6cf76ec`) on UAT.
- "Platform-provider" distinguishing mechanism — TBD: create a new hydra Tag for `platform-provider` scope, OR rely on `MarketplaceProfileItem.orgId == ZB_ORG_UUID` filter, OR a `provider_type` section on the MPI record. Decide in Plan 26-01.
- Cleanup queue (CLEANUP-25 backlog row): `mpi-test-a-cd7105df`, `mpi-test-b-cd7105df`, `TAG-SHAPE-TEST-C` (`64047b6c-...`) — piggyback on the first real Pipeline.receive batch per class.

### Deliverables

1. **Ratify `company_info` convention.** Review `COMPANY-INFO-CONVENTION-DRAFT.md` against ZeroBias org's actual data shape. Confirm 17-section catalog + flat sub-section pattern is correct. Rename to drop `-DRAFT` suffix → `.planning/director/COMPANY-INFO-CONVENTION.md`. Phase 28 + Phase 22 (form-schema) consume the ratified version.
2. **Decide platform-provider distinguisher.** Pick one of (a) new hydra tag named `sme-mart.provider.platform`, (b) MPI `provider_type` section with `data: "platform"`, or (c) hardcoded `orgId == ZB_ORG_UUID` filter in Browse Providers. Lock decision before seeding.
3. **Seed ZB-as-provider records.** One Pipeline.receive batch on MarketplaceProfileItem class (`7bcf86a5-...`) with N records — one per company_info section — for ZeroBias org (`57c741cf-...`). Each record uses deterministic id `mpi-57c741cf-...-<section>`. Object.tag populated per the distinguisher decision in #2. Initial copy/branding can be placeholder (per "Out of scope" — copy-layer Brian asks don't block).
4. **Browse Providers UI integration.** Verify the existing Browse Providers component renders the seeded ZB-as-provider record. UNTAGGED by `sme-mart.demo` so Phase 24 gate doesn't hide it from non-admins.
5. **Cleanup pass on the seed batch.** Same Pipeline.receive batch (or a follow-on) includes `markDeleted: ["mpi-test-a-cd7105df", "mpi-test-b-cd7105df"]` for MarketplaceProfileItem class. The SmeMartProject TAG-SHAPE-TEST-C residue (`64047b6c-...`) cleanup goes on a separate batch since it's a different class — defer to next real SmeMartProject ingest or schedule a one-off.

## Requirements

- **SP-01:** `COMPANY-INFO-CONVENTION.md` exists (renamed from `-DRAFT`), ratified for Phase 26 + Phase 28 + Phase 22 consumption.
- **SP-02:** ZeroBias appears as a provider in SME Mart UI (Browse Providers view lists it).
- **SP-04:** Platform-provider distinguisher decided (tag, section, or filter) and applied consistently to seeded ZB records. (Original wording about retroactive walkthrough tagging RESOLVED — done during Phase 25 close 2026-04-27.)
- **SP-05:** MPI cleanup residue (`mpi-test-a-cd7105df`, `mpi-test-b-cd7105df`) `markDeleted` in the seed Pipeline.receive batch. SmeMartProject `TAG-SHAPE-TEST-C` cleanup separate (different class) — see CLEANUP-25.
- **SP-06:** Unit tests for the seed function + for Browse Providers rendering ZB-as-provider.

**Removed from scope (see DECISIONS.md):** SP-03 (three ServiceOffering records with placeholder tiers) — deferred until Brian confirms tier structure.

## Dependencies

- Phase 25 Platform Data Audit ✅ COMPLETE — provides COMPANY-INFO-CONVENTION-DRAFT.md, validated MPI replace semantics, class IDs, deterministic id pattern.
- Object.tag mechanism (validated; see DECISIONS.md).
- Existing SME Mart `MarketplaceProfileItem` class + Browse Providers UI.

## Verification

- Navigate to Browse Providers in the UAT app; confirm ZeroBias is listed as a provider and rendered fields (legal_name, logo_url, short_blurb, etc.) match what was seeded.
- Query via GQL: `MarketplaceProfileItem(orgId: ".eq.57c741cf-a58e-5efc-bf2f-93c4f6cf76ec") { id, section, data }` returns N records — one per seeded section.
- Verify Object.tag (or chosen distinguisher) on the seeded records: `MarketplaceProfileItem(tag: {value: ".eq.<platform-provider-tag-uuid>"}) { id, section }` if tag-based; or section-presence check if section-based.
- Confirm `mpi-test-a-cd7105df` and `mpi-test-b-cd7105df` no longer appear in GQL MarketplaceProfileItem result (post-`markDeleted` in seed batch).

## Out of scope

- **ServiceOffering records + tier placeholders — deferred until Brian confirms tier structure** (per DECISIONS.md "ServiceOfferings Defer With Brian"). When Brian confirms, a follow-up phase or hotfix creates the records.
- Actual paid-tier gating / billing (v1.5+).
- Real ZeroBias logo + final blurb copy (placeholder graphics/copy ship; Brian refines later if/when — copy-layer Brian ask, not data-model).
- Extending `company_info` to non-provider Orgs (buyer company profile is Phase 28's problem).

## References

- DECISIONS.md "ServiceOfferings Defer With Brian — Data-Model Brian Asks Block, Copy/Branding Don't" (2026-04-24 — why SP-03 is removed)
- DECISIONS.md "Object.tag Field Shape — Validated via UAT Experiment"
- `.planning/director/bootstrap-w3geekery-engagement.md` (walkthrough UUIDs + retroactive-tag context)
- `.planning/director/backlog/005-sme-mart-entity-tagging-mechanism.md` (resolved — this phase consumes the resolution)
