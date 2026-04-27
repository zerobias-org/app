# Plan 029: Hierarchical Tag Naming Convention

**Status:** Complete — convention implemented in SmeMartResourceService
**Priority:** High (cross-cutting: Notes, Tasks, Findings, all engagement resources)
**Depends on:** ZB Tag API capabilities (FR-010, FR-011, FR-012 in [025-zb-platform-feature-requests.md](./025-zb-platform-feature-requests.md))
**Source:** Plan 026 (Notes Feature) — extracted for standalone reference
**Updated:** 2026-03-04

---

## Summary

Use ZeroBias platform tags with a **dot-separated namespaced prefix convention** so all SME Mart resources (Notes, Tasks, SubTasks, Findings, etc.) share a single tag namespace. Prefix depth encodes hierarchy scope — search by prefix to find all children at any level.

---

## Prefix Convention

```
sme-mart.{engagement}.{boundary}.{project}.{resource}.{tag-name}
```

Each segment is optional from right-to-left (except `sme-mart.` root). Missing segments use `*` in queries but are omitted in creation.

### Examples

- `sme-mart.eng.amber-circuit.boundary-abc.Project-X..risk-assessment` — boundary+project scoped
- `sme-mart.eng.amber-circuit...board-minutes` — engagement-wide
- `sme-mart....compliance-framework` — global SME Mart tag

### Live Tags (Already in ZB — Auditmation Dev org)

| Tag Name | ID | Description |
|----------|----|-------------|
| `sme-mart.eng.crystal-harbor` | `518acc1c-acc5-4831-b4db-5648cd5f9558` | SOC 2 Readiness Assessment |
| `sme-mart.eng.velvet-summit` | `e07c3ee5-4bfc-42bf-b61d-33c08750d20a` | NIST CSF Gap Analysis |
| `sme-mart.eng.amber-circuit` | `aacd35bd-ca10-4032-9603-00d19e018194` | Compliance Automation Setup |
| `sme-mart.eng.silver-bridge` | `b3b590d8-3140-4866-b344-ca79ef1cc2a8` | FedRAMP Authorization Support |
| `sme-mart.eng.coral-meadow` | `49cbb0b8-ccd3-4d92-88e5-16e63ef81662` | ISO 27001 Evidence Collection |

These demonstrate the `sme-mart.eng.{word}-{word}` pattern at the engagement level.

---

## Scope Levels via Prefix Depth

| Query pattern | Scope | What you get |
|---|---|---|
| `sme-mart.*.*.*.*` | Global SME Mart | All SME Mart tags |
| `sme-mart.eng.amber-circuit.*.*.*` | Engagement-wide | All tags in engagement amber-circuit |
| `sme-mart.eng.amber-circuit.boundary-abc.*.*` | Engagement + Boundary | Tags scoped to that context |
| `sme-mart.*.*.Project-X.*` | Cross-engagement project | Project-X tags from any engagement/boundary |
| `sme-mart.eng.amber-circuit.*.Project-X.*` | Project within engagement | Project-X tags within amber-circuit, any boundary |

---

## SmeMartTagService Design

```typescript
interface TagScope {
  engagement?: string;   // e.g. 'eng.amber-circuit' or '*' for wildcard
  boundary?: string;     // e.g. 'boundary-abc' or '*'
  project?: string;      // e.g. 'Project-X' or '*'
  resource?: string;     // e.g. 'task-abc' or '*'
}

interface DisplayTag {
  id: string;            // ZB tag ID
  name: string;          // user-visible name (prefix stripped)
  fullName: string;      // full prefixed name
  scope: TagScope;       // parsed scope from prefix
}

@Injectable({ providedIn: 'root' })
class SmeMartTagService {
  // Create: composes prefix from scope, calls ZB Tag API
  createTag(name: string, scope: TagScope): Promise<DisplayTag>;

  // Query: builds prefix pattern from scope, fetches ZB tags, strips prefixes
  listTags(scope: TagScope): Promise<DisplayTag[]>;

  // Assign/remove: works with full ZB tag ID
  assignTag(resourceId: string, tagId: string): Promise<void>;
  removeTag(resourceId: string, tagId: string): Promise<void>;

  // Utilities
  getDisplayName(fullTagName: string): string;   // strip prefix
  getScope(fullTagName: string): TagScope;        // parse prefix into scope
  buildPrefix(scope: TagScope): string;           // compose prefix from scope
}
```

### Key Design Points

1. **Scope is an input, not hardcoded context** — caller decides scope. Note editor passes `{ engagement: 'eng.amber-circuit', boundary: 'boundary-abc' }`. A cross-engagement dashboard passes `{ project: 'Project-X' }` with no engagement.

2. **Scope inheritance** — query at boundary scope includes boundary-specific AND engagement-wide AND global SME Mart tags. Service merges results from multiple prefix queries.

3. **`ZbTagPipe`** — strips prefix for display in templates. `{{ tag.fullName | zbTag }}` → `risk-assessment`.

4. **Separator character** — `.` (dot) confirmed working in live tags. No collision issues observed so far.

---

## UI Behavior

- User types "risk-assessment" → service creates full prefixed tag via ZB Tag API
- Tag autocomplete queries ZB tags with scope-based prefix filter
- Display pipe strips prefix → user only sees `risk-assessment`
- Same tag can be applied to Tasks, Notes, Findings — cross-resource search for free

---

## ZB Tag API — Validated Capabilities (2026-03-04)

| Question | Answer | How confirmed |
|----------|--------|---------------|
| Does `searchTags` POST support partial name matching? | **Yes** — `TagSearchBody.name = "sme"` returns 9 matching tags | Tested via MCP (`platform.Tag.searchTags`) |
| Does `searchTags` work as prefix search at depth? | **Yes** — `"sme-mart.eng."` → 5 results, `"sme-mart.eng.amber"` → 1, `"sme-mart.test.dots.in"` → 1 | Tested with deep dot-separated tags via MCP |
| Does `listTags` GET support name filtering? | **No** — `nameFilter` param is ignored by server (returns all 472 tags) | Tested via MCP |
| Are dots allowed in tag names? | **Yes** — live tags use `sme-mart.eng.word-word` | Live data in Auditmation Dev org |
| Tag name max length? | **No limit** — `nmtoken` PostgreSQL domain is unbounded `text` type | Source: `hydra-schema-principal/security.sql` |
| Allowed characters? | **`A-Z 0-9 . _ - :`** (case insensitive) | Source: `CREATE DOMAIN nmtoken AS text CHECK (VALUE ~* '^[A-Z0-9\.\_\-\:]+$')` |
| Deep dot-separated names? | **Yes** — created & searched `sme-mart.test.dots.in.name.deep-prefix-validation-tag` | Tested via MCP (`danaOld.Tag.createTag`) |
| Can tags be assigned to non-ZB resources? | **Unknown** — needs investigation | FR-012 still open |

### Tag Creation Methods

| Method | Behavior | When to use |
|--------|----------|-------------|
| **`danaOld.Tag.createTag`** | **Direct creation** — returns the tag immediately | Programmatic tag creation (SmeMartTagService, engagement setup, etc.) |
| **`platform.Tag.suggestTag`** | **Moderated** — creates a ZB Task for admin approval. Admin must manually work the task to create the tag. | User-suggested tags that need admin review before entering the system |

**WARNING:** `EngagementHierarchyService.createTag()` currently uses `suggestTag` (moderated path). Must be updated to use `danaOld.Tag.createTag` for programmatic creation.

### Tag Scope (ownerId behavior)

- **Without `ownerId`:** Tag gets scope `"user"` (owned by API key's principal)
- **With `ownerId` = org ID:** Tag gets scope `"org"` (visible to entire org)
- **For SME Mart:** Always pass org ID as `ownerId` so tags are org-scoped

### Implication for prefix search

`searchTags` with `name: "sme-mart.eng.amber-circuit"` returns all tags starting with that prefix. **Confirmed working at multiple depths** — this is sufficient for scope-based queries without needing a dedicated prefix/glob API (FR-010). No glob/wildcard support needed; client-side filtering handles cross-dimension queries (e.g., `sme-mart.*.*.Project-X.*`).

---

## Platform Feature Requests

| FR | Title | Status | Notes |
|----|-------|--------|-------|
| FR-010 | Tag API Prefix/Pattern Search | **Answered — no platform change needed** | `searchTags` POST does prefix matching at any depth. Sufficient for scope-based queries. |
| FR-011 | Tag Name Character Constraints & Length | **Answered — no platform change needed** | `nmtoken` domain: `A-Z 0-9 . _ - :` (case insensitive), no max length. |
| FR-012 | Tag Assignment to Arbitrary Resources | **Not investigated** | Needed for Neon-native notes. |

---

## Relationship to Existing Services

| Service | Role | Status |
|---------|------|--------|
| `EngagementHierarchyService` | Wraps ZB Tag/Resource API — `tagResource`, `untagResource`, `searchTagsByName`, `createTag` | Built, in use |
| `SmeMartTagService` (proposed) | Higher-level: prefix composition, scope-based queries, display name stripping | Not yet built |
| `ResourceTagEditor` component | UI: autocomplete chip editor for ZB tags on any resource | Built, in use |
| `note-tag-editor` component | UI: Neon-backed note tags (to be migrated to `SmeMartTagService`) | Built, migration pending |

**Migration path:** `SmeMartTagService` wraps `EngagementHierarchyService` (or replaces it), adding prefix logic. `ResourceTagEditor` and `note-tag-editor` both consume `SmeMartTagService`.

---

## Pros

- Single source of truth for tags across all ZB resources
- Cross-resource querying ("show me everything tagged X in this engagement")
- Platform-level search/reporting includes notes automatically
- No duplicate tag management systems
- PMO can tag a Note and a Task with same tag, find both
- Cross-engagement, cross-boundary queries via wildcard scopes

## Cons / Open Questions

- ~~Performance: if `searchTags` partial matching doesn't work as prefix search~~ — **Resolved: prefix search works at any depth**
- ~~Max tag name length with deep prefixes~~ — **Resolved: no max length (nmtoken is unbounded text)**
- Migration path from existing `note_tags` table
- Fallback if Hub is unreachable — queue tag ops? Accept dependency?
- Kevin input needed on whether namespaced tags align with platform strategy
- FR-012: Can tags be assigned to non-ZB resource IDs (Neon note UUIDs)?
- `EngagementHierarchyService.createTag()` uses `suggestTag` (moderated) — needs migration to `danaOld.Tag.createTag`

---

## Migration Plan

1. ~~Investigate ZB Tag API capabilities~~ — **Done (2026-03-04)**
2. Update FR-010/011/012 status based on findings
3. Build `SmeMartTagService` with scope-based prefix composition
4. Create `ZbTagPipe` to strip prefix for display
5. Migrate existing `note_tags` data → ZB tags with prefix
6. Update `note-tag-editor` component to use `SmeMartTagService` instead of `NotesService` tag methods
7. Drop `note_tags` + `note_tag_assignments` tables (or keep as cache/fallback)
8. Update `v_notes_with_tags` view to reference ZB tag data (or remove if no longer needed)

---

*Extracted from Plan 026 (Notes Feature) — Open Decisions section. See also [025-zb-platform-feature-requests.md](./025-zb-platform-feature-requests.md) FR-010/011/012.*
