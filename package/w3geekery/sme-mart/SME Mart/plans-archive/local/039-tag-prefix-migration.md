# Plan 039: Tag Prefix Convention Migration (ENG-/PROJ- → sme-mart.)

**Status:** Complete (all 4 phases)
**Depends on:** Plan 029 (design), Plan 025 FR-012 (tag assignment to non-ZB resources)
**Deprecates:** Old `ENG-`/`PROJ-`/`TASK-` prefix convention + `suggestTag` moderated path

---

## Overview

Migrate from old `ENG-word-word` / `PROJ-word-word` / `TASK-word-word` tag prefixes to Plan 029's `sme-mart.` dot-delimited convention. Replace `suggestTag` (moderated) with `danaOld.Tag.createTag` (direct creation).

## Phase 1: Core Infrastructure

### 1.1 Tag Prefix Utilities
**File:** `src/app/core/utils/tag-prefix.util.ts` (NEW)
- `stripPrefix(fullName)` — return rightmost segment
- `parseScope(fullName)` — parse `sme-mart.eng.word.boundary.project` → `TagScope`
- `buildPrefix(scope)` — compose prefix from scope
- `isSmeMartTag(name)` — check `sme-mart.` prefix
- `isProtectedTag(name)` — check `sme-mart.eng.` (hierarchy tags)

### 1.2 SmeMartTagService
**File:** `src/app/core/services/sme-mart-tag.service.ts` (NEW)
- `createTag(name, scope, orgId)` — `danaOld.Tag.createTag` (direct, NOT suggestTag)
- `searchTags(scope, limit)` — `searchTags` POST with scope-based prefix
- `assignTag(resourceId, tagId)` / `removeTag(resourceId, tagId)`
- `getDisplayName(fullName)` / `getScope(fullName)` / `buildPrefix(scope)`

### 1.3 ZbTagPipe
**File:** `src/app/shared/pipes/zb-tag.pipe.ts` (NEW)
- Standalone pipe: `{{ tag.name | zbTag }}` → strips `sme-mart.` prefix

## Phase 2: Migrate Core Services

### 2.1 EngagementHierarchyService
**File:** `src/app/core/services/engagement-hierarchy.service.ts` (MODIFY)
- Replace `ENG-`/`PROJ-`/`TASK-` prefix map with `sme-mart.` parsing
- Delegate tag CRUD to SmeMartTagService
- Keep breadcrumb/hierarchy logic
- Backward compat: parse old `ENG-*` if encountered (transition period)
- Remove `suggestTag` / `SuggestTagBody` imports

### 2.2 EngagementLifecycleService
**File:** `src/app/core/services/engagement-lifecycle.service.ts` (MODIFY)
- `generateEngagementTag()` → `sme-mart.eng.word-word` (was `ENG-word-word`)
- `acceptProposal()` → use `SmeMartTagService.createTag()` (was `suggestTag`)
- `isEngagementPhase()` → check `sme-mart.eng.` prefix (was `ENG-`)

## Phase 3: Update UI Components

### 3.1 Resource Tag Autocomplete
**File:** `src/app/shared/components/resource-tag-autocomplete/resource-tag-autocomplete.component.ts` (MODIFY)
- `defaultProtectedFilter()` → use `isProtectedTag()` from util (was `ENG-`/`PROJ-` check)

### 3.2 Resource Tags Panel
**File:** `src/app/shared/components/resource-tags-panel/resource-tags-panel.component.ts` (MODIFY)
- Same protection filter update

### 3.3 Templates — Add ZbTagPipe
- Add `| zbTag` pipe to tag name displays in templates

## Phase 4: Testing

- `tag-prefix.util.spec.ts` — prefix parsing, scope composition, protection checks
- `sme-mart-tag.service.spec.ts` — createTag, searchTags, backward compat
- `zb-tag.pipe.spec.ts` — display stripping
- Integration: engagement lifecycle creates `sme-mart.eng.*` tags
- Breadcrumbs render correctly with new format

## Backward Compatibility

- Parse both `ENG-*` (old) and `sme-mart.eng.*` (new) in hierarchy service
- Only CREATE in new format
- Old tags continue to work but won't be generated
- Protection filters recognize both formats during transition

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `danaOld.Tag.createTag` API quirks | Medium | Test in isolation first; SmeMartTagService abstracts API |
| Org ID not available in all contexts | Medium | Inject from session/impersonation context |
| Breadcrumb labels too long | Low | Strip prefix in breadcrumb builder |
| Old `ENG-*` tags on existing resources | Low | Backward compat parsing; phase out over time |
