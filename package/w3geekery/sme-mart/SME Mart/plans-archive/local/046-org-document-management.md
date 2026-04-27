# Plan 046: Org-Level Document Management

**Status:** Draft
**Last Updated:** 2026-03-09
**Supersedes:** Plan 045 (RFP Document Chooser — now a subset of Phase 4)

## Overview

Comprehensive org-scoped file management system: upload, organize, share, and reuse documents across engagements and projects. Both supply-side (vendor corporate docs) and demand-side (buyer RFP/engagement libraries).

Each Org has its own Document Management center — files owned by an Org are NOT visible to any other Org.

### Single Source of Truth Architecture

**`org_documents`** is the single source of truth for all files in an Org. Any file uploaded from
any context (engagement, project, task, note, org-level) is inserted into `org_documents`.
Context links are tracked via `org_document_shares` — a polymorphic join table.

- One file, no copies — a document shared with 3 engagements has 1 row in `org_documents` + 3 rows in `org_document_shares`
- `engagement_documents` table is **deprecated** — all references migrated to `org_documents` + shares
- `DocumentService.uploadDocument(engagementId, file)` inserts into `org_documents` + auto-creates an engagement share
- `OrgDocumentService.uploadDocument(orgId, file)` inserts into `org_documents` only (no automatic share)

### Document Visibility (Three-Way View)

In compliance engagements, documents often need party-restricted visibility:
- Assessor working papers should NOT be visible to the buyer
- Buyer's internal prep docs should NOT be visible to the provider
- Final reports and evidence artifacts are visible to both sides

Visibility is controlled per-share (not per-document) via the `visibility` column on `org_document_shares`.
The same document can have different visibility in different contexts.

### Share Dialog UX

**Two-step picker** (explicit sharing, not cascading):
1. **Target type dropdown** — Engagement, Project, Task
2. **Target selector** — which specific engagement/project/task
3. **Visibility radio** — All (default), Buyer Only, Provider Only

Documents are visible only in the contexts they're explicitly shared to. No automatic cascading
(sharing to an engagement does NOT auto-show on every task within it). This keeps things predictable
and avoids noise. Sharing is cheap (one DB row), so sharing to multiple places is fine.

---

## Requirements

1. **Org-level File Manager** — dedicated Document Management page, supply + demand sides
2. **Scoped File Chooser** — filter by scope tags (Project, Engagement, Org). `scope` input determines required tags.
3. **Org-level Sharing Controls** — grant access to Org-owned Projects/Engagements per file
4. **Context-First Selection** — in Engagement/Project context, show Org files first + upload option
5. **Contextual Upload Tagging:**
   - Engagement > Project A > Subtask → engagement tag + Project A tag + Task Attachment
   - Notes context → engagement tag + project tag + SmeResourceLink to Note
6. **Organization Page** — tabs: Documents, Settings, Members, Groups, Engagements, Projects
7. **Org Switcher** in user dropdown

---

## UI Pattern: Google Drive–Style File Manager

- **Breadcrumb navigation** (Org > Folder > Subfolder — future if folders added)
- **Grid/List view toggle** (cards vs. dense table)
- **Column sorting** (Name, Modified, Size, Type)
- **Filter sidebar** (Type, Date Range, Scope/Shared-with)
- **Drag-drop upload zone** (full-page drop target)
- **Context menu per file** (Preview, Download, Share, Archive, Delete)
- **Bulk actions** (multi-select → share, archive, delete)
- **Search bar** (filename, display name)

---

## Route Hierarchy

```
/org/                         → redirects to /org/documents
/org/documents                → File Manager (main)
/org/settings                 → Org profile, name, logo
/org/members                  → Member list & role management
/org/groups                   → Group management (stub)
/org/engagements              → All org engagements
/org/projects                 → All org projects (stub, depends Plan 022)
```

**Access:** User dropdown → "Organization" → `/org/documents`

---

## Data Model

### New Table: `org_documents`

```sql
CREATE TABLE org_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  zb_file_id TEXT,
  zb_file_version_id TEXT,
  filename TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT,
  document_type VARCHAR(30) NOT NULL DEFAULT 'other',
  display_name TEXT,
  description TEXT,
  uploaded_by_zerobias_user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  archived BOOLEAN DEFAULT false
);

CREATE INDEX idx_org_documents_org_id ON org_documents(org_id);
CREATE INDEX idx_org_documents_created_at ON org_documents(created_at DESC);
CREATE INDEX idx_org_documents_document_type ON org_documents(document_type);
```

### New Table: `org_document_shares`

Polymorphic share table — links a document to any context (engagement, project, task, note).
Includes `visibility` to control which party in the engagement can see the document.

```sql
CREATE TABLE org_document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES org_documents(id) ON DELETE CASCADE,
  shared_with_type VARCHAR(20) NOT NULL,   -- 'engagement' | 'project' | 'task' | 'note'
  shared_with_id UUID NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'all',  -- 'all' | 'buyer_only' | 'provider_only'
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by UUID NOT NULL
);

CREATE INDEX idx_org_doc_shares_doc ON org_document_shares(document_id);
CREATE INDEX idx_org_doc_shares_target ON org_document_shares(shared_with_type, shared_with_id);
```

**Visibility values:**

| Value | Who sees it | Use case |
|-------|------------|----------|
| `all` | Both buyer and provider | Evidence artifacts, final reports, shared deliverables |
| `provider_only` | Assessor/provider only | Working papers, sampling methodology, internal checklists, risk ratings |
| `buyer_only` | Buyer/client only | Internal prep docs, remediation plans, org-private references |

The same document can have different visibility per share — e.g., an assessor's checklist template
is `provider_only` in Engagement A but `all` in Engagement B (if they choose to share it).

**Compliance audit document visibility examples:**

| Document | Buyer? | Provider/Assessor? |
|----------|--------|-------------------|
| Evidence artifacts (policy docs, config screenshots) | Yes | Yes |
| Working papers (assessor internal notes, test procedures) | No | Yes |
| Draft findings (pre-report observations) | No | Yes |
| Final report (SOC 2 report, audit letter) | Yes | Yes |
| Remediation plans (corrective action plans) | Yes | Sometimes |
| Internal risk notes (risk ratings, sampling rationale) | No | Yes |

### New VIEW: `v_org_document_detail`

```sql
CREATE VIEW v_org_document_detail AS
SELECT
  od.*,
  COUNT(DISTINCT CASE WHEN ods.shared_with_type = 'project' THEN ods.shared_with_id END) AS project_share_count,
  COUNT(DISTINCT CASE WHEN ods.shared_with_type = 'engagement' THEN ods.shared_with_id END) AS engagement_share_count,
  COUNT(DISTINCT CASE WHEN ods.shared_with_type = 'task' THEN ods.shared_with_id END) AS task_share_count
FROM org_documents od
LEFT JOIN org_document_shares ods ON od.id = ods.document_id
WHERE od.archived = false
GROUP BY od.id;
```

### Scope Tags

Tags determine file visibility in context:
- `sme-mart.org.{org-identifier}` — org-wide (auto-assigned on upload)
- Sharing adds the target's existing tag (e.g., `sme-mart.eng.cobalt-pixel`) to the document via `SmeMartTagService`

---

## Component Inventory

### New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `OrgPage` | `pages/org/org.component.ts` | Root container + tab nav |
| `DocumentsTab` | `pages/org/tabs/documents-tab.component.ts` | File manager grid/list |
| `SettingsTab` | `pages/org/tabs/settings-tab.component.ts` | Org profile form |
| `MembersTab` | `pages/org/tabs/members-tab.component.ts` | Member list |
| `GroupsTab` | `pages/org/tabs/groups-tab.component.ts` | Stub |
| `EngagementsTab` | `pages/org/tabs/engagements-tab.component.ts` | Org engagements |
| `ProjectsTab` | `pages/org/tabs/projects-tab.component.ts` | Stub (Plan 022) |
| `OrgDocumentCard` | `shared/components/org-document-card/` | File card with actions |
| `DocumentShareDialog` | `shared/components/document-share-dialog/` | Grant access modal |
| `OrgDocumentChooser` | `shared/components/org-document-chooser/` | Scoped file browser (replaces Plan 045 scope) |
| `OrgSwitcher` | `shared/components/org-switcher/` | Org selector in dropdown |

### Modified Components

- **UserProfileDropdown** — add "Organization" item + OrgSwitcher submenu
- **DocumentUploadComponent** — support `orgId` input for org-level uploads
- **DocumentChooserDialog** — add `scope` input for filtering (or deprecate in favor of OrgDocumentChooser)
- **app.routes.ts** — add `/org/*` route group

### New Services

| Service | Purpose |
|---------|---------|
| `OrgDocumentService` | Org document CRUD, upload, share, archive |
| `OrgContextService` | Track current org, org switching |
| `DocumentScopeService` | Query docs by scope (org/project/engagement) |

---

## Implementation Phases

### Phase 1: Data Layer & Services — **COMPLETE**

1.1 ~~Create Neon tables + view (via `run_sql_transaction`)~~ ✓
1.2 ~~Create `org-document.model.ts`~~ ✓
1.3 ~~Create `OrgDocumentService` (CRUD, upload, share/unshare)~~ ✓
1.4 ~~`DocumentService` rewritten for single-source-of-truth (`org_documents` + shares)~~ ✓
1.5 ~~DB migration: `engagement_documents` → `org_documents` + share row~~ ✓
1.6 ~~`effectiveOrgId()` added to `ImpersonationService`~~ ✓
1.7 ~~`visibility` field added to `OrgDocumentShare` model~~ ✓
1.8 ~~`uploadBinary()` made public, removed `any` cast in `OrgDocumentService`~~ ✓

_`OrgContextService` and `DocumentScopeService` moved to Phase 6 (org switcher, deferred)._
_Unit tests moved to Phase 7._

### Phase 2: File Manager UI — **COMPLETE**

2.1 ~~Create `OrgPage` + `org.routes.ts` with child routes~~ ✓
2.2 ~~Create `DocumentsTab` with grid/list toggle, sort, filter, search~~ ✓
2.3 ~~Document cards inline in grid view (type icon, name, meta, share count, context menu)~~ ✓
2.4 ~~Drag-drop upload zone (full-page drop target with visual feedback)~~ ✓
2.5 ~~Empty state, loading, error states~~ ✓
2.6 ~~List view with `ZbCustomizableTableComponent` + custom cell templates~~ ✓
2.7 ~~Upload progress overlay~~ ✓
2.8 ~~`DocumentShareDialog` — engagement list with checkbox + search + auto-tag~~ ✓

_`OrgDocumentCard` as a standalone shared component deferred — card UI is inline in DocumentsTab._

### Phase 3: Sharing & Visibility Controls — **COMPLETE**

3.1 ~~Add `visibility` column to `org_document_shares` table (DDL migration)~~ ✓
3.2 ~~Create `DocumentShareDialog` with visibility radio group (All / Buyer Only / Provider Only)~~ ✓
3.3 ~~Wire share dialog into card context menu and document list actions~~ ✓
3.4 ~~Auto-tag on share via `SmeMartTagService`~~ ✓
3.5 ~~Show share badges on cards with restricted visibility indicator icon~~ ✓
    - Added `has_restricted_shares` boolean to `v_org_document_detail` view
    - Added `task_share_count` + `has_restricted_shares` to `OrgDocumentDetail` model
    - Grid cards: `visibility_off` icon with tooltip when restricted shares exist
    - List view: same indicator in shared column cell template
3.6 Update `OrgDocumentService.listSharedDocuments()` to filter by current user's party role
    _Deferred — requires engagement role detection (buyer vs provider) which depends on Phase 4/6 context._
3.7 Update `DocumentService.listDocuments()` to filter by visibility + user's engagement role
    _Deferred — same dependency as 3.6._
3.8 ~~Update `OrgDocumentShare` model with `visibility` field~~ ✓

### Phase 4: Context-Aware Document Chooser — **COMPLETE**

4.1 ~~Create `OrgDocumentChooser` dialog with `scope` input~~ ✓
4.2 ~~"Org Files" tab + "Upload New" tab~~ ✓
4.3 ~~Integrate into RFP wizard Step 2 ("Attach from Library" button + auto-share)~~ ✓
4.4 ~~Integrate into engagement document list ("Attach from library" header action)~~ ✓
4.5 Contextual upload tagging (auto-assign scope tags)
    _Deferred — auto-tagging on upload works for shares (via SmeMartTagService), scope tags TBD._

### Phase 5: Remaining Org Tabs — **COMPLETE**

5.1 ~~`SettingsTab` — org name/ID display + platform management notice~~ ✓
5.2 ~~`MembersTab` — stub with platform note (ZB org member APIs not yet available)~~ ✓
5.3 `GroupsTab` — deferred (not in routes, no use case yet)
5.4 ~~`EngagementsTab` — org engagements table~~ ✓ (status chips, category chips, provider links, sorting)
5.5 ~~`ProjectsTab` — stub referencing Plan 022~~ ✓

### Phase 6: Navigation & Org Switcher (3–4 hrs) — DEFERRED

_Deferred until ZB publishing flow is live with real credentials._

6.1 `OrgSwitcher` component (list user's orgs, radio select)
6.2 Update `UserProfileDropdown` with "Organization" item
6.3 Show current org name in toolbar
6.4 Wire `/org/*` routes in `app.routes.ts`
6.5 `OrgContextService` (current org signal, switcher) — moved from Phase 1
6.6 `DocumentScopeService` (query docs by scope tags) — moved from Phase 1

### Phase 7: Tests & Docs (1–2 hrs)

7.1 ✅ Unit tests (>70% service coverage) — `org-document.service.spec.ts` (31 tests)
7.2 ✅ Component snapshot/interaction tests — `document-upload.component.spec.ts` (17), `document-list.component.spec.ts` (17), `document-share-dialog.component.spec.ts` (16)
7.3 ✅ Update Neon reference docs — added org_documents, org_document_shares, v_org_document_detail + 4 common queries
7.4 ✅ E2E smoke test script — `smoke-tests/org-document-management.md` (7 steps: upload → verify → share → archive)

### Phase 8: External Storage Imports (4–6 hrs per provider) — DEFERRED

Import files from external cloud storage into the org document library. Adds a third tab ("Import from...") to `OrgDocumentChooser`.

**Providers (priority order):**
1. **Google Drive** — Google Picker API (drop-in file chooser). Easiest: OAuth2, well-documented, minimal server work.
2. **Dropbox** — Chooser SDK (drop-in button, read-only mode needs no server). Similar effort to Google.
3. **SharePoint / OneDrive** — Microsoft Graph API. Most complex (Azure AD app registration, tenant config). Most relevant for enterprise/compliance customers.

**Per-provider work:**
- 8.x.1 OAuth app registration (API keys, redirect URIs, consent scopes)
- 8.x.2 Auth flow UI (consent button → token exchange → secure token storage/refresh)
- 8.x.3 File picker or browse UI (prefer vendor drop-in SDKs where available)
- 8.x.4 Download-from-provider → upload-to-org-documents pipeline (stream file bytes, reuse `OrgDocumentService.uploadDocument()`)
- 8.x.5 Error handling (expired tokens, permission denied, file too large, rate limits)

**Prerequisites:**
- ZB publishing flow live with real user credentials (per-user OAuth tokens require real auth, not single API-key dev mode)
- Phase 6 (org switcher) should be done first

**Architecture note:** The existing `OrgDocumentChooser` and `OrgDocumentService` upload pipeline are already provider-agnostic. External imports just need a "fetch remote file → File blob → uploadDocument()" adapter per provider.

### Phase 9: Advanced Document Management (Roadmap)

Features to bring org documents closer to a full document management system.

#### 9.1 Folders & Sub-Folders (4–5 hrs)

**New table: `org_document_folders`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid | |
| `parent_id` | uuid FK (self) NULL | root folder = NULL |
| `name` | text | |
| `color` | text NULL | hex color for folder chip/icon |
| `sort_order` | integer | |
| `created_by_zerobias_user_id` | text | |
| `created_at` | timestamptz | |
| `archived` | boolean | soft delete |

- Add `folder_id` (uuid, nullable FK) to `org_documents` table
- Breadcrumb navigation in file manager: Org > Folder > Sub-Folder
- Folder tree sidebar (reuse pattern from notes `note-folder-tree`)
- Drag-drop files into folders, drag folders into other folders
- Cycle detection (same algorithm as notes)
- Context menu: New Folder, Rename, Move, Delete (soft)
- Root-level docs shown as "Unfiled" or in a default view

#### 9.2 Folder Colors (0.5 hrs)

- Color picker on folder context menu (same pattern as note folders)
- `color` column stores hex value
- Folder icon tinted with assigned color in tree and breadcrumbs
- Pairs with 9.1 (same phase)

#### 9.3 Document Tagging (2–3 hrs)

- Integrate `SmeResourceTagEditor` + `ResourceTagAutocomplete` into document cards / detail view
- Documents already support tags via `SmeMartTagService` (auto-tagged on share)
- Add explicit tag editing UI: click tags area on card → inline editor
- Tag filter chips in the file manager filter sidebar
- Search by tag in the search bar (`tag:compliance` syntax or dedicated filter)
- Reuse existing `sme-mart.doc.*` tag namespace

#### 9.4 Archive Management (1–2 hrs)

- "Archived" toggle / tab in the file manager (currently archival exists but no UI to browse archived docs)
- Archive view: same grid/list layout, filtered to `archived = true`
- Bulk archive / bulk restore via multi-select
- "Restore" action in context menu for archived docs
- Auto-revoke shares on archive (or warn: "This document is shared with N engagements — archive anyway?")
- Retention policy display (future: expiry dates, legal hold flags)

#### 9.5 Document Versioning (3–4 hrs)

- Re-upload a new version of an existing document (same `org_documents` row, new `zb_file_version_id`)
- Version history panel per document (list of file versions with date, size, uploader)
- Download any previous version
- "Replace" action in context menu → file picker → upload new version
- All shares and tags preserved across versions (they reference the document ID, not the file version)
- `org_document_versions` table (or leverage ZB FileService versioning if available)

#### 9.6 PDF Conversion (2–3 hrs)

- "Export as PDF" action in document context menu
- Client-side conversion for supported formats:
  - Markdown notes → PDF via `html2pdf.js` or `jspdf` (render markdown → HTML → PDF)
  - HTML → PDF (same pipeline)
- Server-side conversion (stretch): Word/Excel → PDF via a conversion service (e.g., LibreOffice headless, or a cloud API like CloudConvert)
- Converted PDF saved as a new document in the org library (linked to source via tag or description)
- "Print-friendly view" as an intermediate step (styled HTML preview before PDF generation)

#### 9.7 Document Preview Enhancements (2–3 hrs)

- Inline preview panel (right-side drawer, Google Drive–style)
- PDF viewer: embedded `<iframe>` or `pdf.js` for in-app viewing
- Image preview: lightbox with zoom/pan
- Text/Markdown preview: rendered in-place
- Office formats: link to Google Docs Viewer or Office Online as fallback
- Preview pane shows metadata sidebar: tags, shares, version history, upload date

#### 9.8 Bulk Operations (1–2 hrs)

- Multi-select with checkboxes (shift-click for range)
- Bulk actions toolbar: Share, Move to Folder, Tag, Archive, Download as ZIP
- "Select All" / "Select None" in header
- Count badge: "3 selected"

#### 9.9 Document Templates (2–3 hrs, stretch)

- Pre-defined document templates per `document_type` (SOW template, compliance checklist, etc.)
- "New from Template" action → creates a markdown document pre-filled with template structure
- Template library: org-scoped, admin-managed
- Templates stored as `org_documents` with a `is_template: true` flag
- Clone template → new document with template content

**Phase 9 total estimate:** 18–26 hrs (not all items need to ship together — can be cherry-picked)

---

## Dependency Graph

```
Phase 1 (Data & Services)
    ├── Phase 2 (File Manager UI)
    │       └── Phase 3 (Sharing & Tags)
    ├── Phase 4 (Document Chooser) — depends on Phase 1 + 3
    ├── Phase 5 (Org Tabs) — depends on Phase 1
    └── Phase 6 (Navigation) — depends on Phase 2

Phase 7 (Tests) — after all phases
Phase 8 (External Storage Imports) — after Phase 6 + ZB auth flow live

Critical path: 1 → 2 → 3 → 4 → 6 (17–18 hrs)
Phase 8 is independent/additive (4–6 hrs per provider)
```

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Scope tag complexity | Use resource links for shares. Tags only for org-wide scope. |
| FileService unavailable | Existing graceful degradation in DocumentService carries over |
| ZB org APIs incomplete | Stub Members/Groups tabs. Complete when APIs available. |
| Performance (many docs) | Paginate (50/page), indexed queries, lazy-load tabs |
| Org switching edge cases | Clear document cache on switch, breadcrumb + toast confirmation |
| External provider OAuth complexity | Use vendor drop-in picker SDKs (Google Picker, Dropbox Chooser) to minimize custom auth UI. SharePoint is most complex — defer until customer demand confirmed. |

---

## Effort Summary

| Phase | Hours |
|-------|-------|
| 1: Data & Services | 3–4 |
| 2: File Manager UI | 5–6 |
| 3: Sharing & Visibility | 4–5 |
| 4: Document Chooser | 3–4 |
| 5: Org Tabs | 3–4 |
| 6: Navigation | 2 |
| 7: Tests & Docs | 1–2 |
| 8: External Storage Imports | 4–6 per provider (deferred) |
| **Total (Phases 1–7)** | **21–26** |
| **Total (with Phase 8, 3 providers)** | **33–44** |

---

## Decisions (Clark, 2026-03-09)

1. **Routes:** `/org/*` — users can be members of many orgs, flat path is fine.
2. **File manager:** Grid-first, but make it easily switchable to list view.
3. **Sharing semantics:** Both — resource links (join table) for share tracking + scope tags using the `sme-mart.*` hierarchy from Plan 029/039.
4. **Priority:** Phases 1–5 NOW, then back to Plan 032/033. Phase 6 (org switcher/nav) deferred until ZB publishing flow is live with real credentials (no longer single API-key dev mode). Phase 7 (tests) after Phase 6.
5. **Single source of truth:** `org_documents` is THE file table. `engagement_documents` is deprecated. Any upload from any context inserts into `org_documents` + creates an `org_document_shares` row for the originating context. DB migration completed 2026-03-09.
6. **No cascading visibility:** Documents are visible only where explicitly shared. Sharing to an engagement does NOT auto-show on every task within it. Explicit is better than implicit — sharing is cheap (one row).
7. **Per-share visibility:** `visibility` column on `org_document_shares` controls party access (`all`, `buyer_only`, `provider_only`). Same document can have different visibility in different contexts. This supports the three-way view for compliance audits where assessor working papers must stay provider-only.
8. **Share dialog UX:** Two-step picker (target type → target selector) + visibility radio. Not a cascading "shared at or below" model.
9. **Polymorphic shares:** `shared_with_type` + `shared_with_id` instead of separate foreign key columns. Supports engagement, project, task, note contexts without schema changes.
10. **Org ID:** Using Auditmation Dev org (`28efd6b5-fd17-5b56-a45e-fe3263189666`) for all dev/demo until ZB publishing flow provides real credentials.
