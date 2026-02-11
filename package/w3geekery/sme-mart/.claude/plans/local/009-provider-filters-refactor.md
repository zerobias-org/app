# Provider Filters Refactor Plan

**Status:** Planning
**Created:** 2026-02-05
**Requested by:** Clark

---

## Objectives

1. Remove top category buttons from providers page (keep filters in sidebar only)
2. Create "Add Filter" system - filter blocks hidden until user enables them
3. Rename "Work Roles" → "Role Experience" throughout app
4. Persist filter preferences using ZeroBias PKV (Platform Key-Value storage)

---

## Current State

### Providers Page (`src/app/providers/page.tsx`)
- **Top category chips** (lines 289-306): CATEGORIES array with All, Assessors, Advisors, etc.
- **Sidebar filters**: ProviderFilters component with all 6 filter types always visible
- **Mobile**: Filter drawer with same ProviderFilters component

### ProviderFilters (`src/components/marketplace/ProviderFilters.tsx`)
- 6 filter sections always rendered:
  - Frameworks (showAllAsChips)
  - Products (autocomplete)
  - Skills (autocomplete, collapsed)
  - Work Roles (autocomplete, collapsed)
  - Service Categories (showAllAsChips)
  - Industry Segments (autocomplete, collapsed)

### Work Roles Label Locations
- `src/components/marketplace/ProviderFilters.tsx:206` - title="Work Roles"
- `src/app/my-profile/page.tsx:788` - "Work Roles" header

### PKV Integration
- No existing PKV usage
- ZeroBias client available via `useZeroBias().service.zerobiasClientApi`
- Need to identify PKV API endpoint/method

---

## Proposed Changes

### Task 1: Remove Top Category Buttons

**File:** `src/app/providers/page.tsx`

**Changes:**
- Remove CATEGORIES constant (lines 37-47)
- Remove selectedCategory state
- Remove category chips rendering (lines 288-306)
- Keep "Available Only" chip (move to sidebar or keep inline)
- Keep sort dropdown

**Result:** Cleaner page with all filtering in sidebar

---

### Task 2: Create Filter Enabler System

**New Component:** `src/components/marketplace/FilterEnabler.tsx`

**Behavior:**
- "Add Filter" button with dropdown menu
- Menu lists available filter types: Frameworks, Products, Skills, Role Experience, Service Categories, Industry Segments
- Selecting a filter type adds that filter block to sidebar
- Each filter block has "x" to remove/hide it
- Empty state: "No filters active. Click 'Add Filter' to get started."

**State:**
```typescript
interface EnabledFilters {
  frameworks: boolean;
  products: boolean;
  skills: boolean;
  roles: boolean;
  serviceCategories: boolean;
  segments: boolean;
}
```

**File Changes:**
- Create `src/components/marketplace/FilterEnabler.tsx`
- Update `src/components/marketplace/ProviderFilters.tsx`:
  - Accept `enabledFilters` prop
  - Only render enabled filter sections
  - Add remove button to each section header
- Update `src/app/providers/page.tsx`:
  - Add enabledFilters state
  - Pass to ProviderFilters

---

### Task 3: Rename Work Roles → Role Experience

**Files to update:**
1. `src/components/marketplace/ProviderFilters.tsx:206`
   - Change: `title="Work Roles"` → `title="Role Experience"`

2. `src/app/my-profile/page.tsx:788`
   - Change: `Work Roles` → `Role Experience`

3. Any other occurrences (search to verify)

---

### Task 3b: Improve Skills Display

**Issue:** Skills currently show the code (e.g., "S0001") but descriptions are more useful.

**Change:** Use description field for skills display, trim "Skill in " prefix.

**File:** `src/components/marketplace/ProviderFilters.tsx` (skillItems transform)
**File:** `src/hooks/useZeroBiasCatalog.ts` (Skill interface/transform)

**Example:**
- Before: `S0027` or "Skill in applying host/network access controls"
- After: "applying host/network access controls"

```typescript
// Transform skill description
const displayName = skill.description?.replace(/^Skill in /i, '') || skill.name;
```

---

### Task 4: PKV Integration for Filter Persistence

**PKV Key:** `sme-mart.provider-filters`

**Stored Data:**
```typescript
interface StoredFilterPreferences {
  // Which filter sections are enabled
  enabledFilters: {
    frameworks: boolean;
    products: boolean;
    skills: boolean;
    roles: boolean;
    serviceCategories: boolean;
    segments: boolean;
  };
  // Current filter selections
  selections: {
    frameworks: string[];
    products: string[];
    skills: string[];
    roles: string[];
    serviceCategories: string[];
    segments: string[];
  };
  // Other filter state
  availableOnly: boolean;
  sortBy: string;
}
```

**Implementation Options:**

**Option A: Direct PKV API (if available in SDK)**
```typescript
// In ZeroBiasContext or new hook
const pkv = service.zerobiasClientApi.platformClient.getPkvApi();
await pkv.set('sme-mart.provider-filters', JSON.stringify(prefs));
const prefs = await pkv.get('sme-mart.provider-filters');
```

**Option B: API Route Proxy**
```typescript
// src/app/api/user/preferences/route.ts
// Proxy to ZeroBias PKV API
GET /api/user/preferences?key=sme-mart.provider-filters
PUT /api/user/preferences { key, value }
```

**Option C: Local Storage Fallback (for mock mode)**
```typescript
// Use localStorage when in mock mode, PKV when authenticated
if (AUTH_MODE === 'mock') {
  localStorage.setItem('sme-mart.provider-filters', JSON.stringify(prefs));
} else {
  await pkvApi.set(...);
}
```

**New Hook:** `src/hooks/useFilterPreferences.ts`
```typescript
export function useFilterPreferences() {
  // Load preferences on mount
  // Save preferences on change (debounced)
  // Return { preferences, updatePreferences, loading }
}
```

**Flow:**
1. Page loads → fetch preferences from PKV
2. Apply stored enabledFilters and selections
3. User changes filter → debounce 500ms → save to PKV
4. User removes filter section → save to PKV

---

## Implementation Order

### Session Tasks

1. **Task 1: Remove top category buttons** (~15 min)
   - Remove CATEGORIES, selectedCategory, and category chips
   - Verify page still works

2. **Task 2: Rename Work Roles** (~5 min)
   - Update ProviderFilters.tsx
   - Update my-profile/page.tsx
   - Search for any other occurrences

3. **Task 3: Create FilterEnabler component** (~30 min)
   - Create FilterEnabler.tsx with Add Filter menu
   - Add enabledFilters state type

4. **Task 4: Update ProviderFilters for conditional rendering** (~30 min)
   - Accept enabledFilters prop
   - Conditionally render each section
   - Add remove button to section headers

5. **Task 5: Integrate FilterEnabler into providers page** (~20 min)
   - Add enabledFilters state to page
   - Wire up FilterEnabler and ProviderFilters
   - Handle mobile drawer

6. **Task 6: Research PKV API** (~15 min)
   - Check zerobias-client SDK for PKV methods
   - Or identify platform API endpoint
   - Decide on implementation approach

7. **Task 7: Create useFilterPreferences hook** (~30 min)
   - Implement PKV read/write (or localStorage fallback)
   - Add debounced save
   - Handle loading state

8. **Task 8: Wire up PKV persistence** (~20 min)
   - Load preferences on page mount
   - Save on filter changes
   - Test persistence

---

## Decisions (Confirmed)

1. **Default enabled filters:** None - filter blocks hidden until user adds them via "Add Filter" menu OR PKV has saved values

2. **Filter block content:** Empty by default - NO popular/default chips. Only show chips user has explicitly selected.

3. **Chip behavior:**
   - User selects item from autocomplete → chip appears
   - User can toggle chip on/off (filtering)
   - User can remove chip entirely (X button) → updates PKV for next visit

4. **Top bar layout:** Search | Sort | Available Only (inline)
   - Remove category buttons entirely
   - Keep Available Only as toggle/switch inline with search and sort

5. **PKV key:** `sme-mart.provider-filters`

6. **Mock mode:** Use localStorage as fallback

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/providers/page.tsx` | Modify | Remove categories, add enabledFilters state |
| `src/components/marketplace/ProviderFilters.tsx` | Modify | Conditional rendering, remove buttons |
| `src/components/marketplace/FilterEnabler.tsx` | Create | Add Filter menu component |
| `src/hooks/useFilterPreferences.ts` | Create | PKV persistence hook |
| `src/app/api/user/preferences/route.ts` | Create | PKV proxy (if needed) |
| `src/app/my-profile/page.tsx` | Modify | Rename Work Roles |

---

## Estimated Time

| Task | Time |
|------|------|
| Remove top categories | 15 min |
| Rename Work Roles | 5 min |
| FilterEnabler component | 30 min |
| Update ProviderFilters | 30 min |
| Integrate into page | 20 min |
| Research PKV | 15 min |
| useFilterPreferences hook | 30 min |
| Wire up persistence | 20 min |
| **Total** | **~2.5 hours** |

---

**Ready to proceed?** Confirm decisions on questions above, then I'll start implementation.
