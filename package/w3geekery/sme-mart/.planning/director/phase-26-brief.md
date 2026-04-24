# Phase 26 — Seed ZB-as-Provider + `company_info` Convention

**Milestone:** v1.4 "3P Onboarding & Default Engagement"
**Est:** 3–5 hrs (reduced from 5–7 after ServiceOffering scope removal)
**Repos:** `app/` (data seeding). No schema PR.
**Origin:** 3P plan direction: default engagement must have a provider (ZeroBias) visible in SME Mart. Amended 2026-04-24 per Clark direction: ServiceOffering seeding is now OUT of v1.4 pending Brian confirmation of the tier structure. See DECISIONS.md "ServiceOfferings Defer With Brian — Data-Model Brian Asks Block, Copy/Branding Don't".

## Goal

Seed ZeroBias as a first-class marketplace provider identity in the SME Mart data (no ServiceOffering records — those wait on Brian). Define a `company_info` convention for how any provider Org represents itself in the marketplace. Retroactively tag the W3Geekery walkthrough records with the validated `Object.tag` shape so they're discoverable via GQL tag filters.

## Architecture

### Starting state
- No `company_info` convention has been codified — each seeded provider uses ad-hoc fields.
- ZeroBias is NOT yet represented as a marketplace provider on UAT; the walkthrough Engagement created 2026-04-23 has ZB-as-provider expressed only in the `name` field (no actual provider-side records).
- `Object.tag` validated 2026-04-24 — can tag ZB-as-provider records with a "platform-provider" tag to distinguish from 3P marketplace providers.
- Walkthrough records (`746010b7-...` Engagement, `ea4db55f-...` SmeMartProject) exist on UAT with empty `tag` fields — need retroactive tag push.
- `TAG-SHAPE-TEST-C` residue (`64047b6c-...`) remains on UAT from the Object.tag experiment, needs cleanup.

### Deliverables

1. **`company_info` convention doc.** Short document (`.planning/director/COMPANY-INFO-CONVENTION.md`) defining how a provider Org represents itself: legal name, DBA, logo URL, short blurb, long description, primary contact, website, HQ location, years in business, employee-count bucket. This convention applies to ALL providers, not just ZB. Phase 28 (company profile form) collects exactly this shape on the buyer side.
2. **Seed ZB-as-provider record.** Pipeline.receive push for a single `MarketplaceProfileItem` (or equivalent provider-identity record) representing ZeroBias as a provider org, populated per `company_info` convention, with `Object.tag` populated with a `platform-provider` tag UUID (to distinguish from 3P marketplace providers). No ServiceOffering records.
3. **Catalog integration.** Ensure ZB-as-provider appears in any Browse Providers / Search Providers UI the same way demo providers do today — UNTAGGED by the demo-seed tag (so Phase 24 gate doesn't hide it from non-admins).
4. **Retroactive tag push + residue cleanup.** One Pipeline.receive batch (class `c66114a2-...` SmeMartProject + Engagement class UUID) that:
   - Re-pushes the W3Geekery default Engagement (`746010b7-...`) with `tag: [{ value: "a81cd320-243e-44eb-bdd9-9824019ef3dd" }]`.
   - Re-pushes the W3Geekery default SmeMartProject (`ea4db55f-...`) with the same tag.
   - `markDeleted: ["64047b6c-52e7-4592-ac1d-27f5020d1e01"]` to clean up the TAG-SHAPE-TEST-C experiment residue.

## Requirements

- **SP-01:** `COMPANY-INFO-CONVENTION.md` exists and is referenced by Phase 28 brief.
- **SP-02:** ZeroBias appears as a provider in SME Mart UI (Browse Providers view lists it).
- **SP-04:** Every seeded or re-pushed record carries the appropriate `Object.tag` — `platform-provider` for the ZB-as-provider identity record, `sme-mart.eng.w3geekery-default-zb` for the retroactively-tagged walkthrough Engagement + SmeMartProject.
- **SP-05:** Walkthrough residue cleaned up: `TAG-SHAPE-TEST-C` (schema id `64047b6c-...`) `markDeleted` in the Pipeline.receive batch.
- **SP-06:** Unit tests for the seed function + for Browse Providers rendering ZB-as-provider.

**Removed from scope (see DECISIONS.md):** SP-03 (three ServiceOffering records with placeholder tiers) — deferred until Brian confirms tier structure.

## Dependencies

- Phase 25 Platform Data Audit (informs what profile fields the `company_info` convention should cover — lands before Phase 26 plans).
- Object.tag mechanism (validated; see DECISIONS.md).
- Existing SME Mart `MarketplaceProfileItem` class + Browse Providers UI.

## Verification

- Navigate to Browse Providers in the UAT app; confirm ZeroBias is listed as a provider and `company_info` fields render correctly (name, blurb, website, etc.).
- Query via GQL: `MarketplaceProfileItem(tag: { value: ".eq.<platform-provider-tag-uuid>" }) { ... }` returns the seeded ZB-as-provider record.
- Query W3Geekery default Engagement + SmeMartProject via `platform.Object.getVersionByObjectIdOrVersionId` — confirm `tag` array is now populated (was null pre-Phase-26).
- Confirm `TAG-SHAPE-TEST-C` no longer appears in GQL `SmeMartProject` result (post-`markDeleted`).

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
