# Plan 037: ZeroBias Resource Tag Editor Component

**Status:** Complete

> Autocomplete search/select component for managing tags on ZeroBias platform resources (tasks, boundaries, etc.)

## Context

We have a working `note-tag-editor` component that manages tags stored in Neon DB via `NotesService`. We need a similar component that manages tags on **ZeroBias platform resources** using the platform SDK's tag and resource APIs.

### Key API Discovery

| Operation | SDK Method | Notes |
|-----------|-----------|-------|
| **Get tags on resource** | `resourceApi.getTagsForResource(resourceId)` | Returns `TagView[]` |
| **Tag a resource** | `resourceApi.tagResource(resourceId, tagIds[])` | Bulk add |
| **Untag a resource** | `resourceApi.untagResource(resourceId, tagId)` | Single remove |
| **Create tag** | `tagApi.suggestTag(SuggestTagBody)` | Async — returns Task, tag created inline |
| **Search tags** | `tagApi.searchTags(page, size, slim, TagSearchBody)` | Supports `scope` filter (`Global`/`Org`/`User`) |
| **List tags** | `tagApi.listTags(page, size, types, search)` | Text search, filter by `Nmtoken` type |

### Scope Clarification

Tag scope (`Global`, `Org`, `User` from `TagScopeEnum`) is **server-determined** based on auth context — callers do NOT control it via an `orgId` parameter. `suggestTag` has no `orgId` field. The scope of created tags depends on how the platform resolves the auth session.

This means we do NOT need a scope selector toggle in the UI. Tags will be created at whatever scope the server determines.

### Existing Service Layer

`EngagementHierarchyService` already wraps all needed ZB tag operations:
- `tagResource(resourceId, tagIds[])`
- `untagResource(resourceId, tagId)`
- `getResourceTags(resourceId)` → `TagView[]`
- `createTag(name, description, resourceId?)` — calls `suggestTag` then `findTagByName`
- `findTagByName(name)` — `listTags` with exact match
- `getTag(tagId)` — `searchTags` by ID (cached)

We'll reuse this service directly.

### Color Support

`TagView` (extended) includes a `color` field (hex string). The `ZbChipColorsDirective` from `@zerobias-org/ngx-library` takes `[zbChipColor]="hexColor"` and auto-calculates text contrast (black/white) via luminance formula.

---

## Phase 1: Component Scaffold

**Files to create:**
- `src/app/shared/components/resource-tag-editor/resource-tag-editor.component.ts`
- `src/app/shared/components/resource-tag-editor/resource-tag-editor.component.html`
- `src/app/shared/components/resource-tag-editor/resource-tag-editor.component.scss`

### Component API

```typescript
@Component({
  selector: 'app-resource-tag-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceTagEditor implements OnInit, OnChanges {
  // --- Inputs ---
  @Input({ required: true }) resourceId!: string; // ZB resource (task) ID
  @Input() readonly = false;                       // Disable editing

  // --- Outputs ---
  @Output() tagsChanged = new EventEmitter<TagView[]>();
}
```

### Signals

| Signal | Type | Purpose |
|--------|------|---------|
| `assignedTags` | `signal<TagView[]>` | Tags currently on the resource |
| `allSuggestions` | `signal<TagView[]>` | Search results for autocomplete |
| `loading` | `signal<boolean>` | Initial load state |
| `saving` | `signal<boolean>` | Add/remove in progress |

### Computed

| Computed | Purpose |
|----------|---------|
| `filteredSuggestions` | `allSuggestions` minus `assignedTags`, filtered by input text |

---

## Phase 2: Template & Behavior

### Template Structure

```
mat-form-field (appearance="outline")
  mat-chip-grid
    @for tag of assignedTags
      mat-chip-row [zbChipColor]="tag.color" (removed)="removeTag(tag)"
        {{ tag.name }}
        mat-icon matChipRemove  (if !readonly)
    input matInput [matChipInputFor] [matAutocomplete]
  mat-autocomplete
    @for tag of filteredSuggestions
      mat-option [value]="tag"
        chip-preview with [zbChipColor]
```

### Behavior

1. **On init / resourceId change** → `loadAssignedTags()` via `hierarchyService.getResourceTags(resourceId)`
2. **Input typing** → Debounce 300ms → `searchTags()` via `tagApi.listTags(1, 20, types, searchText)` for autocomplete suggestions
3. **Select from autocomplete** → `hierarchyService.tagResource(resourceId, [tag.id])` → update `assignedTags`
4. **Chip input (Enter/Comma)** → If tag name doesn't exist: `hierarchyService.createTag(name, '', resourceId)` → update `assignedTags`
5. **Remove chip** → `hierarchyService.untagResource(resourceId, tagId)` → update `assignedTags`
6. **Emit `tagsChanged`** after every add/remove

### Imports

```typescript
imports: [
  ReactiveFormsModule,
  MatAutocompleteModule,
  MatChipsModule,
  MatFormFieldModule,
  MatIconModule,
  MatProgressSpinnerModule,
  ZbChipColorsDirective,     // from @zerobias-org/ngx-library
]
```

---

## Phase 3: Styling

Minimal SCSS — lean on Material chip defaults + `zbChipColors` directive for tag colors.

```scss
:host { display: block; }

.tag-chip {
  font-size: 0.8rem;
}

.autocomplete-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
```

---

## Phase 4: Integration into Task Card

Add `<app-resource-tag-editor>` to `task-card.component.html` inside the expanded card content, replacing the current static `mat-chip-set` tag display:

**Current** (static read-only chips):
```html
@if (taskTags().length > 0) {
  <div class="card-tags">
    <mat-chip-set>
      @for (tag of taskTags(); track $index) {
        <mat-chip class="tag-chip" zbChipColors [zbChipColor]="tag.color || ''">{{ tag.name }}</mat-chip>
      }
    </mat-chip-set>
  </div>
}
```

**New** (editable when owner, read-only otherwise):
```html
<div class="card-tags">
  <app-resource-tag-editor
    [resourceId]="taskData()!.id.toString()"
    [readonly]="!isOwnerFlag()"
    (tagsChanged)="onTagsChanged($event)">
  </app-resource-tag-editor>
</div>
```

The collapsed inline tags view stays as-is (read-only chip display).

---

## Differences from `note-tag-editor`

| Aspect | `note-tag-editor` | `resource-tag-editor` |
|--------|-------------------|----------------------|
| **Data source** | Neon DB (`NotesService`) | ZB Platform SDK (`EngagementHierarchyService`) |
| **Tag model** | `NoteTag` (id, name, engagement_id) | `TagView` (id, name, color, scope, type, description) |
| **Color support** | None | Yes — `ZbChipColorsDirective` with `tag.color` |
| **Scope** | Engagement-scoped | Server-determined (Global/Org/User) |
| **Input** | `noteId` + `engagementId` + `tags` string | `resourceId` only |
| **Search** | Local filter over preloaded list | API search via `listTags` (debounced) |
| **Create** | Direct DB insert | `suggestTag` (async) + `findTagByName` |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `suggestTag` is async (returns Task) — tag may not be immediately available | `createTag()` in hierarchy service already handles this: calls `suggestTag` then `findTagByName` |
| Large number of tags could slow autocomplete | Limit search to 20 results, debounce 300ms |
| Tag color may be null | `zbChipColor` handles empty string gracefully (no background applied) |
| Concurrent tag edits on same resource | Refresh assigned tags after each operation |

---

## Testing Strategy

1. **Component unit test** — mock `EngagementHierarchyService`, verify:
   - Tags load on init
   - Add tag calls `tagResource`
   - Remove tag calls `untagResource`
   - Create new tag calls `createTag` + `tagResource`
   - `tagsChanged` emits after each operation
2. **Integration** — verify renders in task card expanded view
