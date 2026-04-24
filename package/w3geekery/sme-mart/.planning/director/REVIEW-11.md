# Director Review — Phase 11: Vetting Pre-Fill

**Reviewed:** 2026-04-01
**Verdict:** PASS with 2 FLAGs

## Flags (executor should read before starting)

**FLAG-1: `profileItemId` field may not exist in GQL schema.**
The plan adds `profile_item_id` to the domain model and field mapping (`profileItemId` in GQL). But the `EngagementVettingItem` schema in `zerobias-org/schema` was not updated in Phase 8 — we deferred `profileItemId` to Phase 11. The executor has two options:
- **(a) Schema PR:** Add `profileItemId` field to `EngagementVettingItem.yml` in the schema repo, run dataloader, submit PR to `zerobias-org/schema:dev`. This is the clean approach but adds a merge-wait dependency.
- **(b) Pipeline-only:** Push `profileItemId` via Pipeline without a schema field definition. GQL schema extension may accept untyped/extra fields. Verify this works by testing a Pipeline push with the new field and querying it back via GQL.

Recommendation: Try option (b) first. If GQL returns the field, no schema PR needed. If it silently drops it, fall back to option (a).

**FLAG-2: `VettingType` may not be an exported type.**
Task 2 imports `VettingType` from `vetting-item.model.ts`. The vetting model uses `vetting_type: string` — there may not be a typed enum/union for the 8 vetting type values. If `VettingType` doesn't exist as an export, the executor needs to define it (e.g., `export type VettingType = 'corporate_identity' | 'insurance' | 'compliance' | 'financial' | 'legal' | 'reference' | 'certification' | 'documentation'`).

## Notes

- Good: extracted expiration utility shared between Phase 10 and 11
- Good: section mapping as standalone utility with explicit 4-pair constraint
- Good: reference count blocks deletion of profile items with active vetting references
- Good: detach action re-enables suggestion panel
- Good: checklist card auto-dismisses when expired item is updated
