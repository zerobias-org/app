# Phase 11: Vetting Pre-Fill - Research

**Researched:** 2026-04-01
**Domain:** Angular 21 component integration, GQL schema extension, pointer-based reference linking
**Confidence:** HIGH

## Summary

Phase 11 bridges vendor profiles (Phase 10) with engagement vetting by implementing intelligent suggestions of matching profile items. Vendors see suggestions for each vetting item row, can attach profile items as 1:1 pointer references, and suggestions auto-update as profiles evolve. This requires:

1. **Schema extension:** Add `profile_item_id` field to `EngagementVettingItem` (nullable UUID pointer)
2. **Service layer:** Query method in `VettingService` to check reference counts for deletion blocking
3. **UI components:** Suggestion panel in vetting-tab (inline per row), status chips for expired/expiring items
4. **Integration point:** Reference check in vendor-profile-tab delete handler

**Primary recommendation:** Implement schema update first (blocks other work), then build suggestion logic as a reusable component consumed by vetting-tab rows.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Exact matches only — suggest profile items where `SectionType === VettingType` (4 pairs: corporate_identity, insurance, reference, financial)
- **D-04:** Inline per vetting item — suggestion chip/link expands mini-panel below row
- **D-06:** One profile item per vetting item (1:1 pointer via `profile_item_id` field)
- **D-08:** Expired items shown in suggestions with EXPIRED chip, vendor can still attach
- **D-09:** Auto-generate checklist card on vetting tab when expired item attached
- **D-11:** Auto-reflect on updates — pointer shows current profile data, no "updated" indicator
- **D-12:** Block deletion of referenced profile items — show count of engagements using it
- **D-13:** Reference check queries all `EngagementVettingItem` records with `profile_item_id` match across all orgs

### Claude's Discretion
- Exact positioning of suggestion mini-panel (below row vs expandable section)
- Suggestion chip styling and icon choice
- "Linked to Profile" chip click behavior (tooltip vs popover vs navigate)
- Checklist card styling and dismiss animation
- Reference count query implementation (GQL filter vs service method)
- Loading states for suggestion panel (fetching profile items)
- Whether to preload all profile items on tab init or lazy-load per vetting item expansion

### Deferred Ideas (OUT OF SCOPE)
- Auto-advance vetting status to "submitted" when profile item attached
- Snapshot-on-attach with diff tracking
- Fuzzy mapping table for non-overlapping types
- ZB Task generation for expired item renewal
- Multi-attachment (multiple profile items per vetting item)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VPF-01 | Engagement vetting tab suggests matching org profile items by section→vetting_type mapping | Section-to-vetting-type mapping (4 exact pairs), query via `VendorProfileService.listProfileItems(orgId, section)` |
| VPF-02 | Vendor can select which profile items to attach to engagement vetting | Suggestion panel component with "Attach" button, triggered by row expansion |
| VPF-03 | Attached items are pointers (references), not copies of the profile data | `profile_item_id` field on `EngagementVettingItem`, pointer resolved live on render |
| VPF-04 | Pre-fill suggestions update when profile items are added/updated | Live pointer resolves current data, auto-reflects without staleness indicator |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Angular | 21.1.0 | Framework | Project standard, all components use it |
| Material | 21.1.4 | UI components | Standard library, used in vetting/profile tabs |
| TypeScript | 5.9.2 | Language | Project standard, strict mode enabled |
| RxJS | 7.8.0 | Reactive patterns | Standard for Angular, used by signals |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ngx-library | 0.2.28 | ZbResourceStatusComponent, custom components | Status chips for EXPIRED/EXPIRING_SOON, consistent styling |
| zerobias-angular-client | 1.1.29 | GQL client SDK | GraphQL queries for profile items and vetting items |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ngx-library status chips | Custom chip component | ngx-library reuses colors and styling already in use (blue #d7e0ee for in_progress, red #eed5d1 for expired) |
| Service method for reference count | GQL filter directly in component | Service method cleaner, reusable for other deletion checks, handles pagination |

**Installation:**
```bash
# Already installed in package.json
npm install
```

## Architecture Patterns

### Section-to-VettingType Mapping
**What:** Exact enum match — only 4 pairs are suggestible. Others (compliance, legal, certification, documentation) have no profile match.

**Mapping table:**
```typescript
const SECTION_TO_VETTING_TYPE_MAP: Record<SectionType, VettingType | null> = {
  corporate_identity: 'corporate_identity',
  insurance: 'insurance',
  reference: 'reference',
  financial: 'financial',
  attestation: null,       // No vetting match
  personnel: null,         // No vetting match
};
```

**When to use:** Before querying suggestions, filter vetting items through this map. If `map[item.vetting_type]` is null, don't show suggestion panel.

**Example:**
```typescript
canSuggestForVettingType(vettingType: VettingType): boolean {
  return this.getSuggestableSection(vettingType) !== null;
}

getSuggestableSection(vettingType: VettingType): SectionType | null {
  return SECTION_TO_VETTING_TYPE_MAP[vettingType as SectionType] ?? null;
}
```

### Suggestion Panel Component
**What:** Inline expandable panel below each vetting item row showing matching profile items with "Attach" buttons.

**Pattern:**
- Parent: `vetting-tab.component.ts` loops vetting items
- For each item, render:
  1. Vetting item header (existing)
  2. Suggestion chip (new) — only if `canSuggestForVettingType(item.vetting_type)`
  3. Click chip → expand mini-panel below row (Angular expansion or custom toggle)
  4. Mini-panel shows filtered profile items + "Attach" button per item
  5. Expired items in suggestions marked with red EXPIRED chip + warning text
  6. Expiring-soon items marked with amber EXPIRING_SOON chip (no warning)

**Loading states:**
- Suggestion chip: skeleton or disabled while profile items load
- Mini-panel: spinner while fetching matching items for the row

### Profile Item Reference Pointer
**What:** 1:1 pointer from vetting item to profile item via `profile_item_id` field.

**Pattern:**
1. Add `profile_item_id?: string` to `EngagementVettingItem` model (nullable)
2. Update `VETTING_ITEM_FIELD_MAPPING` to include `profile_item_id` ↔ `profileItemId`
3. Update GQL types (`GqlVettingItemResponse`) with `profileItemId?: string`
4. On attach: call `VettingService.updateVettingItem(itemId, { profileItemId: item.id })`
5. On render: if `item.profile_item_id` exists, query `VendorProfileService.getProfileItem(item.profile_item_id)` and show "Linked to Profile: [name]" chip
6. Detach action: `VettingService.updateVettingItem(itemId, { profileItemId: null })`

### Expiration Helpers
**What:** Reusable functions to check item expiration status.

**Pattern:** Extract from `vendor-profile-tab.component.ts` into a shared utility:
```typescript
// src/app/core/utilities/expiration.utility.ts
export function isExpired(item: { expires_at?: string | null }): boolean {
  if (!item.expires_at) return false;
  return new Date(item.expires_at) < new Date();
}

export function isExpiringSoon(item: { expires_at?: string | null }): boolean {
  if (!item.expires_at) return false;
  const now = new Date();
  const expiryDate = new Date(item.expires_at);
  const daysUntilExpiry = Math.floor(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
}
```

**When to use:** In suggestion panel to mark expired/expiring-soon items. Existing code already in vendor-profile-tab can be reused or migrated to utility.

### Reference Count Check (for deletion blocking)
**What:** Service method to count vetting items referencing a profile item.

**Pattern in `VettingService`:**
```typescript
async getProfileItemReferenceCount(profileItemId: string): Promise<number> {
  const result = await this.graphqlRead.query<GqlVettingItemResponse>(
    'EngagementVettingItem',
    this.getFields(),
    {
      filters: {
        profileItemId: `.eq.${profileItemId}`,
      },
      pageSize: 200,
    },
  );
  return result.items.length;
}

async getProfileItemReferences(profileItemId: string): Promise<string[]> {
  const result = await this.graphqlRead.query<GqlVettingItemResponse>(
    'EngagementVettingItem',
    ['id', 'engagementId', 'name'],  // Minimal fields for error message
    {
      filters: {
        profileItemId: `.eq.${profileItemId}`,
      },
      pageSize: 200,
    },
  );
  return result.items.map(item => item.engagementId);
}
```

**Integration in `vendor-profile-tab.component.ts` delete handler:**
```typescript
async confirmDelete(item: MarketplaceProfileItem): Promise<void> {
  try {
    // Check reference count BEFORE delete
    const refCount = await this.vettingService.getProfileItemReferenceCount(item.id);
    if (refCount > 0) {
      const refs = await this.vettingService.getProfileItemReferences(item.id);
      this.snackBar.open(
        `This item is used in ${refCount} engagement(s). Detach from vetting first.`,
        'OK',
        { duration: 4000 }
      );
      return;
    }

    await this.vendorProfileService.deleteProfileItem(item.id);
    // ... rest of delete flow
  } catch (err) {
    // ... error handling
  }
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status chips for item states | Custom chip component | `ZbResourceStatusComponent` from ngx-library | Already styled, colors match ngx-library theme (blue for in-progress, red for expired/alert) |
| Filtering array by enum match | Manual filter in component | TypeScript type guard + computed signal | Leverages Angular 21 computed(), signals, and strict typing for reactivity |
| GQL query result parsing | Manual field mapping | `mapGqlToNeon()` utility from field-mappings | Handles camelCase→snake_case bidirectionally, tested across all entities |
| Expiration date comparisons | Custom logic per component | Extracted utility function | Shared across vendor-profile-tab and vetting-tab, prevents date logic bugs |

**Key insight:** This phase heavily reuses existing patterns from Phase 10 (vendor-profile-tab) and Phase 9 (VendorProfileService). New code is minimal: (1) schema field + mapping, (2) suggestion panel component, (3) reference count check, (4) lifecycle methods for attach/detach. Leverage existing expiration logic, service patterns, and ngx-library components.

## Code Examples

### Exact Match Query Pattern
```typescript
// Source: VendorProfileService.listProfileItems()
async listProfileItems(orgId: string, section?: SectionType): Promise<MarketplaceProfileItem[]> {
  const filters: Record<string, string> = {
    orgId: `.eq.${orgId}`,
  };
  if (section) {
    filters['section'] = `.eq.${section}`;  // GraphQL RFC4515 filter
  }

  const result = await this.graphqlRead.query<GqlMarketplaceProfileItemResponse>(
    'MarketplaceProfileItem',
    this.getFields(),
    {
      filters,
      pageSize: 200,
    },
  );

  const items = result.items
    .filter(gql => !(gql as unknown as Record<string, unknown>)['dateDeleted'])
    .map(gql => this.fromGql(gql));

  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}
```

### Service Method Signature Pattern
```typescript
// Source: VettingService (existing CRUD pattern)
async getVettingItem(id: string): Promise<EngagementVettingItem | null> {
  const cached = this.pipelineWrite.getCached('EngagementVettingItem', id);
  if (cached) return this.fromGql(cached as unknown as GqlVettingItemResponse);

  const gql = await this.graphqlRead.getById<GqlVettingItemResponse>(
    'EngagementVettingItem',
    id,
    this.getFields(),
  );
  if (!gql) return null;

  this.pipelineWrite.seedCache('EngagementVettingItem', id, gql as unknown as Record<string, unknown>);
  return this.fromGql(gql);
}
```

### Field Mapping Extension Pattern
```typescript
// Source: field-mappings.ts (existing VETTING_ITEM_FIELD_MAPPING)
export const VETTING_ITEM_FIELD_MAPPING = {
  neonToGql: {
    // ... existing fields ...
    profile_item_id: 'profileItemId',  // ADD THIS LINE
  },
  gqlToNeon: {
    // ... existing fields ...
    profileItemId: 'profile_item_id',  // ADD THIS LINE
  },
  sourceSchema: 'zerobias-org/schema (Plan 063 — Corporate Vetting)',
  lastVerified: '2026-03-26',
} as const;
```

### Status Chip Reuse Pattern
```typescript
// Source: ngx-library ZbResourceStatusComponent (already used in vetting-tab)
// Usage in suggestion panel:
<zb-resource-status
  [label]="'EXPIRED'"
  [pill]="true"
  [showDot]="false"
  size="small"
/>
```

## Common Pitfalls

### Pitfall 1: Forgetting GQL Schema Update
**What goes wrong:** Code tries to use `profile_item_id` but GQL schema doesn't have the field. GraphQL queries silently drop the field.

**Why it happens:** Schema is source of truth in zerobias-org/schema repo. New fields must be added there first, then schema reloads after merge (15 min delay).

**How to avoid:** Add `profile_item_id?: string` to EngagementVettingItem.yml in zerobias-org/schema BEFORE submitting Phase 11 code. Verify with dataloader.

**Warning signs:** Query returns data but `profileItemId` is always undefined in UI. Check `.planning/phases/11-vetting-pre-fill/` for schema PR link.

### Pitfall 2: Stale Profile Item Data in Suggestions
**What goes wrong:** Suggestion panel shows old data after user updates profile item. User attaches stale item, realizes item was just updated.

**Why it happens:** Caching in `VendorProfileService` or component-level profile item list not invalidated on profile update.

**How to avoid:** Load profile items fresh on suggestion panel open (don't preload all at tab init). Invalidate cache in `VendorProfileService` after profile item update/create.

**Warning signs:** Profile update in Phase 10 doesn't refresh vetting suggestions. Check vendor-profile-tab.component.ts form save flow — does it reload vetting suggestions?

### Pitfall 3: Reference Count Check Blocking Valid Deletes
**What goes wrong:** User tries to delete profile item, gets "used in 0 engagements" error even though reference count query is correct. Soft-deleted items still counted.

**Why it happens:** GQL query doesn't filter by `dateDeleted`, so soft-deleted vetting items are still found.

**How to avoid:** Add filter for soft-deleted items in reference count query (mimic existing `listVettingItems()` pattern with `dateDeleted` check).

**Warning signs:** Deletion always fails. Cross-check with GQL query to count non-deleted EngagementVettingItem records manually.

### Pitfall 4: Missing Attach/Detach Logic in Model
**What goes wrong:** UI shows suggestion panel but clicking "Attach" doesn't persist the pointer. Vetting item never gets `profile_item_id` set.

**Why it happens:** `UpdateVettingItemRequest` doesn't include `profile_item_id` field, service doesn't map it to GQL.

**How to avoid:** Extend `UpdateVettingItemRequest` to include optional `profile_item_id`. Test roundtrip: update with profileItemId → pipeline write → GQL read → verify field persists.

**Warning signs:** After attach click, suggestion panel stays open and item shows no "Linked to Profile" chip. Check component and service logs.

### Pitfall 5: Expired Checker Not Handling Null ExpiresAt
**What goes wrong:** `isExpired()` utility crashes when item has no `expires_at`. Suggestion panel fails to render.

**Why it happens:** Guard condition forgotten at utility entry.

**How to avoid:** Always check `if (!expires_at) return false` before date comparison. Extract and test separately from component logic.

**Warning signs:** Console error: "Cannot read property 'getTime' of null". Profile items without expiration dates cause suggestion panel to error.

## Architecture Decisions

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Exact match only (4 pairs) | Non-overlapping types have no meaningful profile match; fuzzy mapping would be confusing | Simpler UX, no config table needed, clear data flow |
| Inline suggestion per row | Keeps vetting context (type, evidence, status) visible while viewing suggestions | Modifies vetting-tab template to add mini-panel, no new page/modal |
| 1:1 pointer not snapshot | Live reference shows current profile data, auto-reflects updates | Requires `profile_item_id` field in schema, no need to sync/diff snapshots |
| Reference count check for deletion | Prevents "where is this item used?" confusion | Adds VettingService method and integration in Phase 10 delete handler |
| Extracted expiration utility | Reuses logic from vendor-profile-tab, prevents date bugs | One source of truth for expiration rules across two tabs |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Snapshot profile data on attachment | Live pointer to profile item | Phase 11 design (D-11) | Auto-reflects updates, no staleness indicator needed |
| Fuzzy section→vetting mapping | Exact match (4 pairs only) | Phase 11 design (D-01) | Predictable, non-confusing suggestions |
| No reference counting | Count references before delete | Phase 11 design (D-12) | Blocks accidental deletion, guides user to detach first |

## Open Questions

1. **Schema PR timing:** Does the `profile_item_id` field need to be in zerobias-org/schema:dev before Phase 11 planning starts, or can it be added during Wave 0?
   - **Recommendation:** Add schema PR during Wave 0 (Task 11-01). Platform reloads schema every 15 min, so by Task 11-02 it's available.

2. **Preload vs lazy-load profile items:** Should vetting-tab load all profile items on init, or only when suggestion panel expands?
   - **Recommendation:** Lazy-load on expand. Reduces init latency, only loads if user clicks suggestion chip (many vetting items may not be suggestible).

3. **Expired item attachment UX:** When vendor attaches expired item, should the checklist card auto-appear immediately, or only on next page load?
   - **Recommendation:** Auto-appear after attach click. Card signal refreshes based on attached items + expiration check.

4. **Detach UX:** Should detach be in vetting item action menu or a button in the "Linked to Profile" chip?
   - **Recommendation:** Action menu. Keeps all item actions grouped, consistent with existing "Change Status" / "Delete" pattern.

## Environment Availability

The implementation uses only APIs and services already available in the SME Mart codebase:

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| GraphQL (GQL queries) | Profile item suggestions, reference count check | ✓ | Via zerobias-angular-client 1.1.29 | — |
| VendorProfileService | Fetch profile items for suggestions | ✓ | Phase 9 complete | — |
| VettingService | Update vetting items with profileItemId | ✓ | Existing service | — |
| ngx-library | Status chips | ✓ | 0.2.28 | Custom chip (not preferred) |
| Material | Expansion panels, buttons | ✓ | 21.1.4 | — |
| Angular 21 signals | Reactive state for suggestions | ✓ | 21.1.0 | — |

**Missing dependencies with no fallback:** None identified. All required services and libraries are installed and tested.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Angular built-in (`ng test` → Karma/Jasmine) |
| Config file | angular.json (builder: `@angular/build:unit-test`) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VPF-01 | Suggestions appear for exact-match vetting types | unit | `npm test -- --include='**/vetting-suggestion.component.spec.ts'` | ❌ Wave 0 |
| VPF-02 | Attach button adds profileItemId to vetting item | unit | `npm test -- --include='**/vetting-tab.component.spec.ts'` | ❌ Wave 0 |
| VPF-03 | Pointer shows current profile item data, not stale copy | unit | `npm test -- --include='**/vetting.service.spec.ts'` | ❌ Wave 0 |
| VPF-04 | Suggestions update when profile items are added | integration | `npm test -- --include='**/vetting-tab.component.spec.ts'` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test` (all affected spec files)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/pages/engagements/tabs/vetting-suggestion-panel.component.spec.ts` — Suggestion panel component (filtering, attach logic)
- [ ] `src/app/pages/engagements/tabs/vetting-tab.component.spec.ts` (extend) — New suggestion panel integration tests
- [ ] `src/app/core/services/vetting.service.spec.ts` (extend) — Reference count check method
- [ ] `src/app/core/utilities/expiration.utility.spec.ts` — Expiration date helper tests
- [ ] `src/app/core/utilities/section-mapping.utility.spec.ts` — Section→vetting type exact-match logic

## Sources

### Primary (HIGH confidence)
- **vetting-item.model.ts** — Current EngagementVettingItem structure (6039 bytes, verified 2026-04-01)
- **vetting.service.ts** — CRUD patterns, query structure, field mapping integration (tested via existing specs)
- **vendor-profile.service.ts** — List/filter patterns, org-scoped queries, reusable logic (Phase 9, tested)
- **VETTING_ITEM_FIELD_MAPPING** in field-mappings.ts — Current mappings, extension point for profileItemId
- **marketplace-profile-item.model.ts** — Section types, exact enum match available
- **vetting-tab.component.ts/html** — Current rendering, expansion panel structure, status chips
- **CONTEXT.md** — Locked decisions D-01 through D-13, mapping requirements

### Secondary (MEDIUM confidence)
- **vendor-profile-tab.component.ts** — Delete handler pattern, expiration helpers (reusable, same project)
- **GqlVettingItemResponse** — GQL type structure, extension point for profileItemId field
- **REQUIREMENTS.md** — VPF-01 through VPF-04 requirements traceability

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — All libraries installed, tested, in use
- Architecture patterns: **HIGH** — Exact-match mapping verified in code, service patterns from Phase 9 and vetting.service
- Integration points: **HIGH** — vetting-tab structure clear, VettingService CRUD understood, field-mappings approach proven
- Pitfalls: **HIGH** — GQL schema extension learned from Phase 8/9, reference count check pattern from vetting.service
- Test infrastructure: **HIGH** — Angular test setup confirmed in angular.json, ng test available, no external test runners needed

**Research date:** 2026-04-01
**Valid until:** 2026-04-08 (7 days — schema may evolve, but core patterns stable)

---

*Phase: 11-vetting-pre-fill*
*Research gathered: 2026-04-01*
