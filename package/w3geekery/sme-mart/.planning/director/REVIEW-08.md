# Director Review — Phase 8: Vendor Profile Schema

**Reviewed:** 2026-03-31
**Verdict:** PASS with 2 FLAGs

## Flags (executor should read before starting)

**FLAG-1: Enum values casing — verify convention.**
Context D-04 uses lowercase (`corporate_identity, attestation...`). Plan Task 1 uses UPPER_SNAKE_CASE (`CORPORATE_IDENTITY, ATTESTATION...`). Check existing SME Mart enum YAML files in `zerobias-org-forks/schema/package/w3geekery/smemart/enums/` to determine which casing convention is established. Follow the existing convention.

**FLAG-2: No separate `label` field — `name` serves as item label.**
Design session discussed each profile item having a human-readable label (e.g., "D&B Report - Parent Entity"). The plan uses the inherited `name` field from Object base class for this purpose. This is correct — just confirm the executor understands `name` = the display label. No additional field needed.

## Notes

- Good: References `SCHEMA_CHANGE_PROCESS.md` throughout — schema workflow directive working
- Good: Human-verify gate for PR merge — Phase 9 depends on schema being live
- Good: `data` as `type: string` (serialized JSON) — correct for ZB schema system
- Good: Class name `MarketplaceProfileItem` is neutral (both buyer and supplier orgs use profiles)
- Good: Defers `EngagementVettingItem.profileItemId` to Phase 11
