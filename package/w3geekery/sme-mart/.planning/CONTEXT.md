# Context — Architecture & Integration Patterns

This document captures cross-cutting architectural decisions, integration patterns, and critical caveats discovered during platform integration.

## Object.tag Write Route — Embed-in-Data Only

**Status:** FIXED (2026-05-04)  
**Impact:** Critical — affects all tag writes in sme-mart, including demo data and future user-generated tags

### Problem Statement

Wave 1 (Phase 24 Plan 02) implemented tag embedding by passing `tagIds` to the third argument of `SimpleBatch` constructor:

```typescript
// WRONG — SimpleBatch 3rd arg (tagIds) is batch/job metadata, not Object.tag population
new SimpleBatch(classId, [ensured], tagIds.map(id => new UUID(id)))
```

Director's MCP probe (2026-05-04) empirically validated that this route does NOT populate `Object.tag` on GQL read-back:

- **Test:** Pushed a SmeMartProject with `tagIds = [GLOBAL_DEMO_UUID]` via SimpleBatch 3rd arg
- **Result:** `Object.tag` on subsequent GQL read = `null` (unpopulated)
- **Hypothesis confirmed:** SimpleBatch arg 3 is batch/job metadata (internal Hub pipeline tracking), not a data-field assignment mechanism

### Correct Route

Tags MUST be embedded directly in the data payload as `tag: [{value: "<uuid>"}]` BEFORE calling `Pipeline.receive`:

```typescript
// CORRECT — embed tags in data payload
const ensured = {
  ...data,
  ...(tagIds.length > 0 ? { tag: mergeTagValues(existingTag, tagIds) } : {})
};
new SimpleBatch(classId, [ensured], []) // Pass empty [] for 3rd arg
```

**Pattern:**
1. Check for existing `tag` array in data
2. Use `mergeTagValues()` helper to deduplicate and merge existing + new tag UUIDs
3. Embed merged result as `tag: [{value: "<uuid>"}, ...]` in data payload
4. Pass empty `[]` to SimpleBatch 3rd arg

### Empirical Validation

Both defect sites fixed and verified (2026-05-04):

| Site | File | Method | Evidence |
|------|------|--------|----------|
| Runtime (UI seeding) | `src/app/test-helpers/demo-data-seeder.ts` | Demo fixtures populated with `tag: [{value: DEMO_TAG_UUIDS.GLOBAL_DEMO}]` | Wave 1 fixture audit: all 58 demo records carry tag field |
| Script-side | `scripts/demo/helpers.ts` | `pushEntity()` embeds GLOBAL_DEMO_UUID in data before calling `Pipeline.receive` | 6 entity-creation functions updated; round-trip tests verify tag presence |
| Service layer | `src/app/core/services/pipeline-write.service.ts` | `pushEntities()` and `pushEntity()` embed tagIds in data payload | 6 new round-trip tests verify tag embedding and deduplication |

### Code Pattern: mergeTagValues Helper

```typescript
function mergeTagValues(
  existing: Array<{ value: string }> = [],
  newIds: string[] = [],
): Array<{ value: string }> {
  const values = new Set<string>();
  const result: Array<{ value: string }> = [];

  // Preserve existing tags, deduplicate
  for (const entry of existing) {
    if (!values.has(entry.value)) {
      values.add(entry.value);
      result.push(entry);
    }
  }

  // Append new tag UUIDs, deduplicate across existing
  for (const id of newIds) {
    if (!values.has(id)) {
      values.add(id);
      result.push({ value: id });
    }
  }

  return result;
}
```

**Usage:**
```typescript
const existingTag = (data['tag'] as Array<{ value: string }> | undefined) ?? [];
const merged = mergeTagValues(existingTag, tagIds);
const finalData = {
  ...data,
  ...(tagIds.length > 0 ? { tag: merged } : {})
};
```

### Timeline of Discovery & Fix

- **2026-04-29:** Wave 1 completed with tagIds routed to SimpleBatch 3rd arg (WRONG pattern)
- **2026-05-04:** Director MCP probe discovered defect (tag presence = null on GQL read)
- **2026-05-04:** Both Wave 1 defect sites identified and fixed; round-trip tests added
- **2026-05-04:** Pattern documented; decision recorded in DECISIONS.md

### Future Prevention

1. **Verification rule:** When testing any tag-based feature, always verify round-trip: write tag via Pipeline, then GQL-read the Object and assert `Object.tag` contains the UUID (not null, not missing).
2. **Code review:** All `Pipeline.receive` calls with tags must show tag embedding in data payload, not SimpleBatch args.
3. **Schema docs:** Update `HubResource` / `Object` documentation to clarify which tag-write routes populate which fields.

---

## References

- [Phase 24 Plan 02 Wave 1 Summary](./phases/24-demo-data-visibility-gate/24-02-WAVE-1-SUMMARY.md) — Original implementation (pre-fix)
- [Pipeline Write Service](../src/app/core/services/pipeline-write.service.ts) — Fixed implementation
- [Scripts Demo Helpers](../scripts/demo/helpers.ts) — Fixed script-side pattern
- [Tag Embedding Tests](../src/app/core/services/pipeline-write.service.spec.ts) — Round-trip test suite
- [Decisions — Object.tag Write Route](./director/DECISIONS.md) — Decision record

