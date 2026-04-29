# SME Mart Resource Types — Summary for Backend Team

**Date:** 2026-03-05
**Context:** SME Mart defines its own resource abstraction (`SmeMartResource`) that mirrors the ZB platform `Resource` base class. On migration day, each SME Mart resource type becomes a first-class ZB resource type with zero component changes.

---

## Resource Types

| Type | Label | Icon | Description | ZB Migration |
|------|-------|------|-------------|--------------|
| `sme-mart:note` | Note | `description` | Engagement notes, meeting minutes, deliverables. Supports rich text (Milkdown), folders, access levels. | Becomes ZB Resource with `type: 'sme-mart:note'` |
| `sme-mart:note-folder` | Notebook | `folder` | Hierarchical folder structure for notes within an engagement. Supports nesting, color, sort order. | Becomes ZB Resource (container type) |
| `sme-mart:work-request` | Engagement | `handshake` | The core marketplace entity — a buyer's engagement/RFP. Links to ZB Boundary, ZB Task (master task), and ENG-xxx tag. | Becomes ZB Resource; already has `zerobias_boundary_id` and `zerobias_task_id` |
| `sme-mart:bid` | Bid | `request_quote` | A vendor's response to an engagement/RFP. Contains cover letter, pricing, timeline, and per-requirement compliance responses. | Becomes ZB Resource linked to work-request |
| `sme-mart:review` | Review | `rate_review` | Post-engagement review/rating of a provider. Includes rating, review text, and approval workflow. | Becomes ZB Resource linked to work-request |
| `sme-mart:service-offering` | Service Offering | `storefront` | A provider's catalog listing. Category, pricing type, delivery time, includes/requirements. Not engagement-scoped. | Becomes ZB Resource (catalog-level, no boundary) |
| `sme-mart:document` | Document | `attach_file` | Uploaded files (PDFs, Word docs, spreadsheets) attached to engagements and tasks. Serves both buyer uploads (Exhibit F, SOWs) and vendor evidence (SOC2 reports, certifications). Stored via ZB FileService (S3). | Becomes ZB Resource; file storage already uses ZB FileService |

---

## Link Types

| Link Type | Label | Use Case | ZB Migration |
|-----------|-------|----------|--------------|
| `relates_to` | Relates To | Generic relationship between any two resources | Maps to ZB `relates_to` link type |
| `references` | References | Note references a work request, document references a standard | Maps to ZB link type |
| `child_of` | Child Of | Folder hierarchy (subfolder → parent), note → folder | Maps to ZB `child_of` (already used for task hierarchy) |
| `evidence_for` | Evidence For | Document/note is evidence for a compliance requirement or finding | Maps to ZB link type |
| `deliverable_for` | Deliverable For | Note is a deliverable for an engagement | Maps to ZB link type |
| `attachment_for` | Attachment For | Document attached to a ZB task or engagement | Maps to ZB link type |

---

## How It Works Today (Neon-backed)

```
Components (Angular)
    │
    ▼
SmeMartResourceService
    │
    ├── Tag assignments ──► sme_resource_tags (Neon table)
    │                          resource_id, resource_type, zb_tag_id
    │
    ├── Links ─────────────► sme_resource_links (Neon table)
    │                          from/to resource_id + type, link_type
    │
    └── Tag CRUD ──────────► ZB Tag API (real platform tags)
                               searchTags, createTag
```

**Key insight:** Tags themselves are real ZB platform tags (created via `danaOld.Tag.createTag`). Only the *assignments* (which resource has which tag) live in Neon because ZB can't tag non-ZB resources yet.

---

## What Changes on Migration Day

| Today (Neon) | Migration Day (ZB Platform) |
|---|---|
| `SmeMartResource` interface | `Resource` class (Dana SDK) |
| `SmeMartResourceType` union | ZB `resource_type` table entries |
| `sme_resource_tags` table | `ResourceApi.tagResource()` calls |
| `sme_resource_links` table | `ResourceApi.linkResources()` calls |
| Entity tables (notes, work_requests, etc.) | Remain — domain-specific fields stay in Neon |
| Component code | **Zero changes** — consumes `SmeMartResource` interface |

---

## Questions for Backend Team

1. **Resource type naming convention** — We're using `sme-mart:` prefix (e.g., `sme-mart:note`). Does ZB have a preferred convention for custom resource types? Should these be `nmtoken` format?

2. **Link types** — Are there existing ZB link types we should reuse instead of defining our own? Specifically `evidence_for`, `attachment_for`, and `deliverable_for`.

3. **Document resource type** — Documents are stored via ZB FileService but tracked as `sme-mart:document` resources in Neon. On migration, should these become ZB Resources with a `url` pointing to the FileService download endpoint, or is there a native "file resource" type?

---

*Source: Plan 030 (sme-mart-resource-abstraction.md) + model file `src/app/core/models/sme-mart-resource.model.ts`*
