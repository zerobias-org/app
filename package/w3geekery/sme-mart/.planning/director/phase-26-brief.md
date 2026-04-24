# Phase 26 — Seed ZB-as-Provider + `company_info` Convention + ServiceOffering Placeholder Tiers

**Milestone:** v1.4 "3P Onboarding & Default Engagement"
**Est:** 5–7 hrs
**Repos:** `app/` (data seeding + marketplace surface wiring). No schema PR.
**Origin:** 3P plan direction: default engagement must have a provider (ZeroBias) with real-looking ServiceOfferings so the default project board doesn't look empty. Brian-ask placeholders ship anyway (DECISIONS.md "Brian Asks Are Placeholders, Not Blockers").

## Goal

Seed ZeroBias as a first-class marketplace provider in the SME Mart data. Define a `company_info` convention for how provider orgs describe themselves in the marketplace (reusable for all providers, not ZB-specific). Ship placeholder pricing tiers as `ServiceOffering` records — Free / Growth $99/mo / Enterprise $999/mo — seeded at known UUIDs that Phase 30 (default project board) can reference.

## Architecture

### Starting state
- `ServiceOffering` class exists on SME Mart schema (seeded demo providers already have ServiceOfferings).
- No `company_info` convention has been codified — each seeded provider uses ad-hoc fields.
- ZeroBias is NOT yet represented as a marketplace provider on UAT; the walkthrough Engagement created 2026-04-23 has ZB-as-provider expressed only in the `name` field (no actual provider-side records).
- `Object.tag` validated 2026-04-24 — can tag ZB-as-provider records with a "platform-provider" tag to distinguish from 3P marketplace providers.

### Deliverables

1. **`company_info` convention doc.** Short document (`.planning/director/COMPANY-INFO-CONVENTION.md`) defining how a provider Org represents itself: legal name, DBA, logo URL, short blurb, long description, primary contact, website, HQ location, years in business, employee-count bucket. This convention applies to ALL providers, not just ZB. Phase 28 (company profile form) collects exactly this shape on the buyer side.
2. **Seed ZB-as-provider records.** Pipeline.receive push for: 
   - A `MarketplaceProfileItem` (or equivalent) representing ZeroBias as a provider org, populated per `company_info` convention.
   - Three `ServiceOffering` records (Free / Growth / Enterprise) linked to ZB-as-provider, with placeholder pricing ($0 / $99/mo / $999/mo), placeholder feature lists, and `Object.tag` populated with a `platform-provider` tag UUID.
   - Reuses the walkthrough-created hydra Tag `sme-mart.eng.w3geekery-default-zb` (`a81cd320-...`) on tenant-specific records where appropriate.
3. **Catalog integration.** Ensure ZB-as-provider appears in any Browse Providers / Search Providers UI the same way demo providers do today — UNTAGGED by the demo-seed tag (so Phase 24 gate doesn't hide it from non-admins).
4. **Retroactive tag push.** Close out the tag-at-ingest-time TODO from the walkthrough by re-pushing the W3Geekery default Engagement (`746010b7-...`) and SmeMartProject (`ea4db55f-...`) with `tag: [{ value: "a81cd320-..." }]`. Also mark the `TAG-SHAPE-TEST-C` residue record deleted in the same batch.

## Requirements

- **SP-01:** `COMPANY-INFO-CONVENTION.md` exists and is referenced by Phase 28 brief.
- **SP-02:** ZeroBias appears as a provider in SME Mart UI (Browse Providers view lists it).
- **SP-03:** Three `ServiceOffering` records exist for ZB-as-provider with placeholder pricing: Free ($0), Growth ($99/mo), Enterprise ($999/mo).
- **SP-04:** Every seeded record carries the appropriate `Object.tag` — `platform-provider` for ZB-as-provider records, `sme-mart.eng.w3geekery-default-zb` for W3Geekery default-engagement records.
- **SP-05:** Walkthrough residue cleaned up: `TAG-SHAPE-TEST-C` (schema id `64047b6c-...`) `markDeleted` in the ServiceOffering batch.
- **SP-06:** Unit tests for the seed function + for Browse Providers rendering ZB-as-provider.

## Dependencies

- Phase 25 Platform Data Audit (informs what profile fields the `company_info` convention should cover — lands before Phase 26 plans).
- Object.tag mechanism (validated; see DECISIONS.md).
- Existing SME Mart `ServiceOffering` class + Browse Providers UI.
- Placeholder tier values come from DECISIONS.md ("v1.4 Phase 29 Deferred"), not from Brian. Ship regardless.

## Verification

- Navigate to Browse Providers in the UAT app; confirm ZeroBias is listed, has ServiceOfferings, and `company_info` fields render correctly (logo, blurb, website, etc.).
- Query via GQL: `ServiceOffering(tag: { value: ".eq.<platform-provider-tag-uuid>" }) { ... }` returns the 3 seeded offerings.
- Confirm W3Geekery default Engagement + SmeMartProject now carry their tag (fetch via `platform.Object.getVersionByObjectIdOrVersionId` — `tag` array present).
- Confirm `TAG-SHAPE-TEST-C` no longer appears in GQL `SmeMartProject` result (post-markDeleted).

## Out of scope

- Actual paid-tier gating / billing (v1.5+).
- Brian-finalized pricing, ToS, branding content (v1.5 Phase 29, display layer).
- Real ZeroBias logo + final blurb copy (placeholder graphics/copy ship; Brian refines later if/when).
- Extending `company_info` to non-provider Orgs (buyer company profile is Phase 28's problem).

## References

- DECISIONS.md "v1.4 Phase 29 Deferred to v1.5; Lazy-on-Load Guard Added to Phase 27" (placeholder tier source)
- DECISIONS.md "Object.tag Field Shape — Validated via UAT Experiment"
- `.planning/director/bootstrap-w3geekery-engagement.md` (walkthrough UUIDs + cleanup references)
- `.planning/director/backlog/005-sme-mart-entity-tagging-mechanism.md` (resolved — this phase consumes the resolution)
