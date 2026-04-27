# Plan 030: SmeMartResource Abstraction Layer

**Status:** Complete
**Priority:** High (cross-cutting: enables unified tagging, linking, search, and ZB platform migration)
**Depends on:** [029-hierarchical-tag-naming.md](./029-hierarchical-tag-naming.md) (tag convention), ZB Tag API (validated)
**Source:** Discussion on FR-012 (tag assignment to non-ZB resources) and ZB platform migration strategy
**Updated:** 2026-03-04

---

## Summary

Create a `SmeMartResource` interface that mirrors the ZeroBias platform `Resource` base class, so all SME Mart entities (Notes, Folders, WorkRequests, Bids, Reviews, ServiceOfferings) share a consistent resource contract. A `SmeMartResourceService` provides ZB-compatible operations (tag, link, search, hierarchy) backed by Neon today, swappable to ZB `ResourceApi` on migration day.

**Key insight:** Tags live in ZB platform (real ZB tags, searchable via `searchTags`). Tag *assignments* live in Neon (`sme_resource_tags` table) because ZB can't tag non-ZB resources yet. On migration day, Neon assignment rows become `ResourceApi.tagResource()` calls. Components never change.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Component Layer                     │
│  (notes-panel, resource-tag-editor, etc.)        │
└──────────────────┬──────────────────────────────┘
                   │ SmeMartResource interface
┌──────────────────▼──────────────────────────────┐
│         SmeMartResourceService                   │
│  tagResource(), linkResources(), search(), etc.  │
├──────────────┬───────────────┬──────────────────┤
│  Tag ops     │  Link ops     │  CRUD            │
│  (ZB tags +  │  (Neon table) │  (delegates to   │
│   Neon join) │               │   entity service)│
└──────┬───────┴───────┬───────┴──────────────────┘
       │               │
  ┌────▼────┐   ┌──────▼──────┐
  │ ZB Tag  │   │ Neon tables │
  │ API     │   │ sme_resource│
  │(platform│   │ _tags,      │
  │ tags)   │   │ _links      │
  └─────────┘   └─────────────┘

Migration day: Neon tables → ZB ResourceApi calls
              SmeMartResource → ZB Resource (field mapping)
              Components: zero changes
```

---

## ZB Resource Base (Reference)

From `~/Projects/zb/clients/packages/sdks/dana/generated/model/Resource.ts`:

```typescript
{
  id: UUID;
  name: string;
  type: Nmtoken;           // Resource type enum
  ownerId: UUID;
  created: Date;
  updated: Date;
  description?: string;
  parentId?: UUID;
  deleted?: Date;          // Soft delete
  boundaryId?: UUID;
  aliases?: string[];
  imageUrl?: URL;
  url?: URL;
}
```

ZB `ResourceView` adds: `tags: TagView[]`, `causing: Alert[]`, `impactedBy: Alert[]`.

ZB `ResourceApi` operations: `tagResource()`, `untagResource()`, `getTagsForResource()`, `linkResources()`, `deleteResourceLink()`, `resourceSearch()`, `getPath()`, `listResourceLinks()`.

---

## SmeMartResource Interface

```typescript
// sme-mart-resource.model.ts

/** Resource types — each becomes a ZB resource type on migration */
export type SmeMartResourceType =
  | 'sme-mart:note'
  | 'sme-mart:note-folder'
  | 'sme-mart:work-request'
  | 'sme-mart:bid'
  | 'sme-mart:review'
  | 'sme-mart:service-offering'
  | 'sme-mart:document';

/**
 * Base resource interface — mirrors ZB Resource field names.
 * Every SME Mart entity implements this via an adapter/mapper.
 */
export interface SmeMartResource {
  // ── ZB Resource-compatible fields (same names, same semantics) ──
  id: string;
  name: string;
  type: SmeMartResourceType;
  ownerId: string;             // zerobias_user_id of creator/owner
  created: string;             // ISO timestamp
  updated: string;             // ISO timestamp
  description?: string | null;
  parentId?: string | null;    // folder_id, parent_id, request_id, etc.
  deleted?: string | null;     // soft-delete timestamp (null = active)
  boundaryId?: string | null;  // ZB boundary ID

  // ── SME Mart context (not in ZB Resource, needed for scoping) ──
  engagementId: string;        // links to work_requests.id
  projectId?: string | null;
}

/** Resource with resolved tags (mirrors ZB ResourceView) */
export interface SmeMartResourceView extends SmeMartResource {
  tags: SmeMartResourceTag[];
}

/** Tag assignment record (Neon-backed, migrates to ResourceApi.tagResource) */
export interface SmeMartResourceTag {
  resourceId: string;
  resourceType: SmeMartResourceType;
  zbTagId: string;             // ZB platform tag ID
  zbTagName: string;           // Full prefixed name (e.g., sme-mart.eng.amber-circuit.risk-assessment)
  displayName: string;         // Prefix-stripped name (e.g., risk-assessment)
  assignedAt: string;
  assignedBy: string;          // zerobias_user_id
}

/** Resource link (Neon-backed, migrates to ResourceApi.linkResources) */
export interface SmeMartResourceLink {
  id: string;
  fromResourceId: string;
  fromResourceType: SmeMartResourceType;
  toResourceId: string;
  toResourceType: SmeMartResourceType;
  linkType: SmeMartLinkType;
  created: string;
  createdBy: string;
  context?: Record<string, unknown>;  // Arbitrary metadata
}

/** Link types — mirrors ZB link type semantics */
export type SmeMartLinkType =
  | 'relates_to'       // generic relationship
  | 'references'       // note references a work request, etc.
  | 'child_of'         // hierarchical (folder→subfolder, note→folder)
  | 'evidence_for'     // note/document is evidence for a finding/requirement
  | 'deliverable_for'  // note is a deliverable for an engagement
  | 'attachment_for';  // document attached to a task or engagement
```

---

## Entity-to-SmeMartResource Mapping

### Note → SmeMartResource

| ZB Field | Note Field | Notes |
|----------|-----------|-------|
| `id` | `id` | Direct |
| `name` | `title` | Direct |
| `type` | `'sme-mart:note'` | Constant |
| `ownerId` | `author_zerobias_user_id` | Direct |
| `created` | `created_at` | Direct |
| `updated` | `updated_at` | Direct |
| `description` | `body` (first 500 chars) | Truncated for summary; full body in entity-specific access |
| `parentId` | `folder_id` | Direct |
| `deleted` | `archived ? updated_at : null` | Map boolean → timestamp |
| `boundaryId` | `boundary_id` | Direct |
| `engagementId` | `engagement_id` | Direct |
| `projectId` | `project_id` | Direct |

**Entity-specific fields** (not in SmeMartResource, accessed via NotesService): `body` (full), `access_level`, `meeting_date`, `meeting_duration_minutes`, `backing_task_id`, `injected_to_task_id`, `is_meeting_minutes`.

### NoteFolder → SmeMartResource

| ZB Field | NoteFolder Field | Notes |
|----------|-----------------|-------|
| `id` | `id` | Direct |
| `name` | `name` | Direct |
| `type` | `'sme-mart:note-folder'` | Constant |
| `ownerId` | `created_by_zerobias_user_id` | Direct |
| `created` | `created_at` | Direct |
| `updated` | `updated_at` | Direct |
| `description` | `description` | Direct |
| `parentId` | `parent_id` | Direct |
| `deleted` | `null` | Folders use hard delete currently; consider adding soft delete |
| `boundaryId` | `null` | Folders don't have boundary (inherited from engagement) |
| `engagementId` | `engagement_id` | Direct |

**Entity-specific:** `color`, `access_level`, `sort_order`.

### WorkRequest → SmeMartResource

| ZB Field | WorkRequest Field | Notes |
|----------|------------------|-------|
| `id` | `id` | Direct |
| `name` | `title` | Direct |
| `type` | `'sme-mart:work-request'` | Constant |
| `ownerId` | `buyer_zerobias_user_id` | Direct |
| `created` | `created_at` | Direct |
| `updated` | `created_at` | No updated_at field currently; add it |
| `description` | `description` | Direct |
| `parentId` | `null` | Top-level entity |
| `deleted` | `null` | No soft delete currently |
| `boundaryId` | `zerobias_boundary_id` | Direct |
| `engagementId` | `id` | WorkRequest IS the engagement |

**Entity-specific:** `buyer_user_id`, `buyer_zerobias_org_id`, `category`, `budget_type`, `budget_min`, `budget_max`, `timeline`, `status`, `engagement_tag`, `zerobias_tag_id`, `zerobias_task_id`.

### Bid → SmeMartResource

| ZB Field | Bid Field | Notes |
|----------|-----------|-------|
| `id` | `id` | Direct |
| `name` | `'Bid from ' + provider_name` | Computed (need provider lookup or denormalize) |
| `type` | `'sme-mart:bid'` | Constant |
| `ownerId` | `provider_id` | Provider who submitted |
| `created` | `created_at` | Direct |
| `updated` | `created_at` | No updated_at; add it |
| `description` | `cover_letter` | Direct |
| `parentId` | `request_id` | Links to work request |
| `deleted` | `null` | No soft delete |
| `boundaryId` | `null` | Inherited from work request |
| `engagementId` | `request_id` | Via work request |

**Entity-specific:** `proposed_price`, `proposed_timeline`, `status`.

### Review → SmeMartResource

| ZB Field | Review Field | Notes |
|----------|-------------|-------|
| `id` | `id` | Direct |
| `name` | `'Review of ' + provider_name` | Computed |
| `type` | `'sme-mart:review'` | Constant |
| `ownerId` | `reviewer_zerobias_user_id` | Direct |
| `created` | `created_at` | Direct |
| `updated` | `created_at` | No updated_at; add it |
| `description` | `review_text` | Direct |
| `parentId` | `request_id` | Links to work request |
| `deleted` | `null` | No soft delete |
| `boundaryId` | `null` | Inherited from work request |
| `engagementId` | `request_id` | Via work request |

**Entity-specific:** `provider_id`, `rating`, `approved`, `approved_at`, `approved_by`.

### ServiceOffering → SmeMartResource

| ZB Field | ServiceOffering Field | Notes |
|----------|----------------------|-------|
| `id` | `id` | Direct |
| `name` | `title` | Direct |
| `type` | `'sme-mart:service-offering'` | Constant |
| `ownerId` | `provider_id` | Provider who created |
| `created` | `created_at` | Direct |
| `updated` | `created_at` | No updated_at; add it |
| `description` | `description` | Direct |
| `parentId` | `null` | Top-level entity |
| `deleted` | `is_active ? null : created_at` | Map boolean → timestamp |
| `boundaryId` | `null` | Not boundary-scoped |
| `engagementId` | `null` | Not engagement-scoped (catalog-level) |

**Entity-specific:** `provider_display_name`, `category`, `subcategory`, `pricing_type`, `price`, `delivery_time`, `includes`, `requirements`.

### EngagementDocument → SmeMartResource

| ZB Field | EngagementDocument Field | Notes |
|----------|-------------------------|-------|
| `id` | `id` | Direct |
| `name` | `display_name ?? filename` | Prefer display name, fallback to filename |
| `type` | `'sme-mart:document'` | Constant |
| `ownerId` | `uploaded_by_zerobias_user_id` | Direct |
| `created` | `created_at` | Direct |
| `updated` | `updated_at` | Direct |
| `description` | `description` | Direct |
| `parentId` | `zb_task_id` | Task the document is attached to (if any) |
| `deleted` | `archived ? updated_at : null` | Map boolean → timestamp |
| `boundaryId` | `null` | Inherited from engagement |
| `engagementId` | `engagement_id` | Direct |

**Entity-specific:** `zb_file_id`, `zb_file_version_id`, `filename`, `mime_type`, `file_size_bytes`, `document_type`, `zb_task_attachment_id`.

---

## Resource Type Priority Assessment

| Resource Type | Tag? | Link? | Search? | Priority | Rationale |
|--------------|------|-------|---------|----------|-----------|
| **Note** | Yes | Yes | Yes | **P0** | Primary use case, most operations needed |
| **NoteFolder** | No | No | No | **P2** | Folders are containers, not tagged/linked independently |
| **WorkRequest** | Yes | Yes | Yes | **P1** | Engagements need tags for hierarchy (already have ENG-* tags) |
| **Bid** | Maybe | Yes | No | **P3** | Links to work request matter; tags less so |
| **Review** | No | Yes | No | **P3** | Links to work request; tagging unlikely |
| **ServiceOffering** | Yes | No | Yes | **P2** | Catalog tags for categorization; no resource links |
| **Document** | Yes | Yes | Yes | **P1** | Buyer/vendor uploads tagged by type (SECURITY, COMPLIANCE); linked to tasks via `attachment_for` |

**Conclusion:** Focus Phases 1-2 on **Note** (P0), **WorkRequest** (P1), and **Document** (P1). Other entities get the interface + mapper but skip tag/link integration until needed.

---

## SmeMartResourceService API

```typescript
// sme-mart-resource.service.ts

@Injectable({ providedIn: 'root' })
export class SmeMartResourceService {
  // ── Resource Mapping ──

  /** Convert any SME Mart entity to a SmeMartResource */
  toResource(entity: Note | NoteFolder | WorkRequest | Bid | Review | ServiceOffering,
             type: SmeMartResourceType): SmeMartResource;

  // ── Tag Operations (ZB tags + Neon assignments) ──

  /** Assign ZB platform tags to a resource (creates Neon assignment rows) */
  tagResource(resourceId: string, resourceType: SmeMartResourceType,
              zbTagIds: string[]): Promise<void>;

  /** Remove a tag assignment */
  untagResource(resourceId: string, zbTagId: string): Promise<void>;

  /** Get all tags for a resource (joins Neon assignments → ZB tag metadata) */
  getTagsForResource(resourceId: string,
                     resourceType: SmeMartResourceType): Promise<SmeMartResourceTag[]>;

  /** Find all resources with a given tag */
  listResourcesByTag(zbTagId: string,
                     resourceType?: SmeMartResourceType): Promise<SmeMartResource[]>;

  // ── Link Operations (Neon table) ──

  /** Create a typed link between two resources */
  linkResources(fromId: string, fromType: SmeMartResourceType,
                toId: string, toType: SmeMartResourceType,
                linkType: SmeMartLinkType,
                context?: Record<string, unknown>): Promise<SmeMartResourceLink>;

  /** Remove a link */
  deleteResourceLink(linkId: string): Promise<void>;

  /** List all links for a resource */
  listResourceLinks(resourceId: string,
                    resourceType: SmeMartResourceType): Promise<SmeMartResourceLink[]>;

  // ── Search (Neon views) ──

  /** Search resources by type, engagement, tags, text */
  searchResources(opts: {
    engagementId?: string;
    type?: SmeMartResourceType;
    query?: string;           // full-text search on name + description
    zbTagIds?: string[];      // must have ALL of these tags
    boundaryId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: SmeMartResource[]; total: number }>;

  // ── Hierarchy (delegation) ──

  /** Get resource path (breadcrumbs) */
  getResourcePath(resourceId: string,
                  resourceType: SmeMartResourceType): Promise<SmeMartResource[]>;
}
```

---

## Neon Schema Changes

### New Table: `sme_resource_tags`

Replaces `note_tag_assignments` with a resource-type-agnostic version.

```sql
CREATE TABLE sme_resource_tags (
  resource_id    UUID NOT NULL,
  resource_type  TEXT NOT NULL,           -- SmeMartResourceType
  zb_tag_id      TEXT NOT NULL,           -- ZB platform tag UUID
  assigned_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by    TEXT NOT NULL,           -- zerobias_user_id

  PRIMARY KEY (resource_id, zb_tag_id),
  CHECK (resource_type IN (
    'sme-mart:note', 'sme-mart:note-folder', 'sme-mart:work-request',
    'sme-mart:bid', 'sme-mart:review', 'sme-mart:service-offering',
    'sme-mart:document'
  ))
);

CREATE INDEX idx_sme_resource_tags_type ON sme_resource_tags(resource_type);
CREATE INDEX idx_sme_resource_tags_tag  ON sme_resource_tags(zb_tag_id);
```

### New Table: `sme_resource_links`

```sql
CREATE TABLE sme_resource_links (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_resource_id  UUID NOT NULL,
  from_resource_type TEXT NOT NULL,
  to_resource_id    UUID NOT NULL,
  to_resource_type  TEXT NOT NULL,
  link_type         TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        TEXT NOT NULL,        -- zerobias_user_id
  context           JSONB,                -- arbitrary metadata

  CHECK (from_resource_type IN (
    'sme-mart:note', 'sme-mart:note-folder', 'sme-mart:work-request',
    'sme-mart:bid', 'sme-mart:review', 'sme-mart:service-offering',
    'sme-mart:document'
  )),
  CHECK (to_resource_type IN (
    'sme-mart:note', 'sme-mart:note-folder', 'sme-mart:work-request',
    'sme-mart:bid', 'sme-mart:review', 'sme-mart:service-offering',
    'sme-mart:document'
  )),
  CHECK (link_type IN (
    'relates_to', 'references', 'child_of', 'evidence_for', 'deliverable_for', 'attachment_for'
  ))
);

CREATE INDEX idx_sme_resource_links_from ON sme_resource_links(from_resource_id, from_resource_type);
CREATE INDEX idx_sme_resource_links_to   ON sme_resource_links(to_resource_id, to_resource_type);
CREATE INDEX idx_sme_resource_links_type ON sme_resource_links(link_type);
```

### Migration: `note_tag_assignments` → `sme_resource_tags`

```sql
-- Migrate existing note tag assignments
INSERT INTO sme_resource_tags (resource_id, resource_type, zb_tag_id, assigned_at, assigned_by)
SELECT
  nta.note_id,
  'sme-mart:note',
  -- Map Neon note_tags.id → ZB tag ID (requires tag migration first)
  nta.tag_id,       -- This will need remapping once tags move to ZB platform
  nta.assigned_at,
  'migration'        -- system-assigned
FROM note_tag_assignments nta;

```

**Note:** Full tag migration (Neon `note_tags` → ZB platform tags) is covered in [Plan 029](./029-hierarchical-tag-naming.md) Migration Plan. The `sme_resource_tags` table initially stores Neon tag IDs, which get remapped to ZB tag IDs during Plan 029 Phase 5.

### Schema Additions to Existing Tables

```sql
-- WorkRequest: add updated_at for SmeMartResource.updated mapping
ALTER TABLE work_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Bids: add updated_at
ALTER TABLE bids ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Reviews: add updated_at
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ServiceOfferings: add updated_at
ALTER TABLE service_offerings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
```

---

## SmeMartTagService Integration

`SmeMartResourceService` delegates tag operations to `SmeMartTagService` (Plan 029):

```
SmeMartResourceService.tagResource(noteId, 'sme-mart:note', [zbTagId])
  └→ Writes to Neon sme_resource_tags table
  └→ Tag CRUD via SmeMartTagService (which calls danaOld.Tag.createTag / searchTags)

SmeMartResourceService.getTagsForResource(noteId, 'sme-mart:note')
  └→ Reads Neon sme_resource_tags (resource_id = noteId)
  └→ For each zb_tag_id, fetches tag metadata from SmeMartTagService cache
  └→ Returns SmeMartResourceTag[] with displayName (prefix-stripped)
```

Tag naming follows Plan 029 convention:
```
sme-mart.eng.amber-circuit.note.risk-assessment
sme-mart.eng.amber-circuit.work-request.high-priority
sme-mart...service-offering.soc2-readiness
```

---

## Migration Path to ZB Platform

### Phase: SME Mart becomes a ZB Portal App

When SME Mart entities become real ZB Resources:

| Today (Neon) | Migration Day (ZB Platform) |
|---|---|
| `SmeMartResource` interface | `Resource` class (Dana SDK) |
| `SmeMartResourceType` enum | ZB `resource_type` table entries |
| `sme_resource_tags` (Neon) | `ResourceApi.tagResource()` |
| `sme_resource_links` (Neon) | `ResourceApi.linkResources()` |
| `SmeMartResourceService.tagResource()` | Calls `ResourceApi.tagResource()` instead of Neon INSERT |
| `SmeMartResourceService.searchResources()` | Calls `ResourceApi.resourceSearch()` instead of Neon query |
| Note fields | Map to ZB Resource fields + custom fields object |

### What changes on migration day

1. `SmeMartResourceService` swaps Neon calls for `ResourceApi` calls
2. `sme_resource_tags` rows become `ResourceApi.tagResource()` calls (one-time migration)
3. `sme_resource_links` rows become `ResourceApi.linkResources()` calls (one-time migration)
4. Entity tables remain (domain-specific fields live there), but resource operations go through ZB

### What stays the same

- `SmeMartResource` interface shape (field names match ZB Resource)
- All component code (they consume `SmeMartResource`, not Neon directly)
- Tag names and IDs (already real ZB platform tags)
- Link semantics (same type names)

---

## Implementation Phases

### Phase 1: Interface + Service Skeleton + Schema (6-8 hrs)

**Files to create:**
- `src/app/core/models/sme-mart-resource.model.ts` — interfaces, types, enums
- `src/app/core/services/sme-mart-resource.service.ts` — service with Neon-backed implementations
- `src/app/core/mappers/note-resource.mapper.ts` — Note/NoteFolder → SmeMartResource
- `src/app/core/mappers/work-request-resource.mapper.ts` — WorkRequest → SmeMartResource

**Neon DDL:**
- Create `sme_resource_tags` table
- Create `sme_resource_links` table
- Add `updated_at` columns to `work_requests`, `bids`, `reviews`, `service_offerings`

**Service methods (Phase 1 scope):**
- `toResource()` — mapper delegation
- `tagResource()` / `untagResource()` / `getTagsForResource()` — Neon CRUD on `sme_resource_tags`
- `listResourcesByTag()` — query `sme_resource_tags` by tag ID

**Tests:**
- Unit tests for mappers (entity → SmeMartResource field mapping)
- Unit tests for service tag operations (mock SmeMartDbService)

### Phase 2: Migrate Notes to SmeMartResource Pattern (6-8 hrs)

**Refactor:**
- `NotesService` tag methods → delegate to `SmeMartResourceService`
- `note-tag-editor` component → use `SmeMartResourceService.getTagsForResource()` + `SmeMartResourceService.tagResource()`
- Migrate `note_tag_assignments` data → `sme_resource_tags`
- Drop `note_tag_assignments` table (or keep as backup)

**Key constraint:** Component API must not change. `note-tag-editor` still emits tag events the same way; internal wiring changes.

**Tests:**
- Integration test: create note, tag it, retrieve tags, verify via `SmeMartResourceService`
- Regression: existing note tag UI works identically

### Phase 3: Resource Linking + Other Entity Mappers (4-6 hrs)

**New mappers:**
- `src/app/core/mappers/bid-resource.mapper.ts`
- `src/app/core/mappers/review-resource.mapper.ts`
- `src/app/core/mappers/service-offering-resource.mapper.ts`

**Link operations:**
- `linkResources()` / `deleteResourceLink()` / `listResourceLinks()` — Neon CRUD on `sme_resource_links`
- Use case: Note references a WorkRequest → `linkResources(noteId, 'sme-mart:note', wrId, 'sme-mart:work-request', 'references')`

**Tests:**
- Unit tests for all mappers
- Integration test: link two resources, query links from both sides

### Phase 4: SmeMartTagService Integration (8-10 hrs)

**Depends on:** Plan 029 `SmeMartTagService` implementation

**Changes:**
- `SmeMartResourceService` tag methods call `SmeMartTagService` for tag creation/search (ZB platform)
- Tag assignments still write to Neon `sme_resource_tags`, but `zb_tag_id` column now stores real ZB tag IDs
- Migrate Neon `note_tags` → ZB platform tags with hierarchical prefixes
- `note-tag-editor` autocomplete uses `SmeMartTagService.listTags(scope)` instead of `NotesService.searchTags()`

**This is the phase where FR-012 is fully sidestepped:** Tags are real ZB tags. Assignments are Neon rows. Both work.

### Phase 5: Cross-Resource Search + Polish (4-6 hrs)

**Search implementation:**
- `searchResources()` queries a new Neon view (`v_sme_resources`) that unions key fields from all entity tables
- Full-text search on `name` + `description`
- Filter by `type`, `engagementId`, `boundaryId`
- Join with `sme_resource_tags` for tag-based filtering

**View DDL (sketch):**
```sql
CREATE OR REPLACE VIEW v_sme_resources AS
  SELECT id, title AS name, 'sme-mart:note' AS type, author_zerobias_user_id AS owner_id,
         created_at, updated_at, body AS description, folder_id AS parent_id,
         CASE WHEN archived THEN updated_at END AS deleted,
         boundary_id, engagement_id, project_id
  FROM notes
UNION ALL
  SELECT id, name, 'sme-mart:note-folder', created_by_zerobias_user_id,
         created_at, updated_at, description, parent_id,
         NULL, NULL, engagement_id, NULL
  FROM note_folders
UNION ALL
  SELECT id, title, 'sme-mart:work-request', buyer_zerobias_user_id,
         created_at, updated_at, description, NULL,
         NULL, zerobias_boundary_id, id, NULL
  FROM work_requests
-- ... more UNION ALLs for proposals, reviews, service_offerings
;
```

---

## Effort Summary

| Phase | Scope | Estimate | Cumulative |
|-------|-------|----------|------------|
| 1 | Interface + service + schema | 6-8 hrs | 6-8 hrs |
| 2 | Migrate Notes to pattern | 6-8 hrs | 12-16 hrs |
| 3 | Linking + other mappers | 4-6 hrs | 16-22 hrs |
| 4 | SmeMartTagService integration | 8-10 hrs | 24-32 hrs |
| 5 | Cross-resource search | 4-6 hrs | 28-38 hrs |

**Phases 1-2 deliver the core value** (unified resource interface + note tags migrated). Phases 3-5 are incremental improvements.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `archived` boolean → `deleted` timestamp mapping loses original archive time | Low | Use `updated_at` as proxy; add `archived_at` column if precision needed |
| `note_tags` migration to ZB platform tags may create duplicates | Medium | Deduplicate by name during migration; idempotent `createTag` |
| `sme_resource_tags` grows large with many resources | Low | Composite PK + indexes; partition by `resource_type` if needed |
| WorkRequest doesn't have `updated_at` | Low | Add column with default `now()`; backfill from `created_at` |
| Tag ID format mismatch (Neon UUID vs ZB UUID string) | Low | Both are string UUIDs; no conversion needed |
| Cross-resource search view performance | Medium | Materialized view or limit UNION to P0/P1 resource types |
| Component regression during NotesService refactor | Medium | Existing tag UI tests + manual QA on notes panel |
| SmeMartTagService (Plan 029) delays Phase 4 | Low | Phases 1-3 work independently with Neon-only tags |

---

## Files Summary

### New Files
| File | Purpose |
|------|---------|
| `src/app/core/models/sme-mart-resource.model.ts` | Interfaces and types |
| `src/app/core/services/sme-mart-resource.service.ts` | Resource operations (tag, link, search) |
| `src/app/core/mappers/note-resource.mapper.ts` | Note/NoteFolder → SmeMartResource |
| `src/app/core/mappers/work-request-resource.mapper.ts` | WorkRequest → SmeMartResource |
| `src/app/core/mappers/bid-resource.mapper.ts` | Bid → SmeMartResource (Phase 3) |
| `src/app/core/mappers/review-resource.mapper.ts` | Review → SmeMartResource (Phase 3) |
| `src/app/core/mappers/service-offering-resource.mapper.ts` | ServiceOffering → SmeMartResource (Phase 3) |
| `src/app/core/mappers/document-resource.mapper.ts` | EngagementDocument → SmeMartResource (Phase 1) |

### Modified Files
| File | Change |
|------|--------|
| `src/app/core/services/notes.service.ts` | Delegate tag ops to SmeMartResourceService |
| `src/app/shared/components/note-tag-editor/` | Wire to SmeMartResourceService (Phase 2) |
| `src/app/core/services/engagement-hierarchy.service.ts` | Update `createTag()` to use `danaOld.Tag.createTag` instead of `suggestTag` |

### Neon Schema
| Change | Phase |
|--------|-------|
| CREATE TABLE `sme_resource_tags` | 1 |
| CREATE TABLE `sme_resource_links` | 1 |
| ALTER TABLE `work_requests` ADD `updated_at` | 1 |
| ALTER TABLE `bids` ADD `updated_at` | 1 |
| ALTER TABLE `reviews` ADD `updated_at` | 1 |
| ALTER TABLE `service_offerings` ADD `updated_at` | 1 |
| Migrate `note_tag_assignments` → `sme_resource_tags` | 2 |
| CREATE VIEW `v_sme_resources` | 5 |

---

## Related Plans

- [029-hierarchical-tag-naming.md](./029-hierarchical-tag-naming.md) — Tag prefix convention + SmeMartTagService design
- [026-notes-feature.md](./026-notes-feature.md) — Notes feature (Phase 4: note_links = resource links)
- [025-zb-platform-feature-requests.md](./025-zb-platform-feature-requests.md) — FR-012 (tag assignment to non-ZB resources) sidestepped by this plan
- [022-project-layer.md](./022-project-layer.md) — Project entity (tag-based, uses same hierarchy)

---

*Created: 2026-03-04. Source: Discussion on FR-012 resolution and ZB platform migration strategy.*
