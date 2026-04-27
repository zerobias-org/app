# Plan 031: Document Upload to Project

**Status:** Partial — model + mappers done, upload UI not started
**Priority:** High (foundation for demand-side RFP creation)
**Depends on:** [030-sme-mart-resource-abstraction.md](./030-sme-mart-resource-abstraction.md) (resource tagging), ZB FileService + Task Attachments SDK
**Source:** Brian's directive 2026-03-05 — Exhibit F demand-side exercise
**Updated:** 2026-03-05

---

## Summary

Enable buyers to upload procurement documents (Exhibit F, SOWs, budgets, legal terms) to an engagement and attach them to ZeroBias Tasks. Documents are the **source of truth** for all demand-side requirements — the RFP wizard (Plan 032) will parse them into task/subtask structures.

**Architecture:** Files stored via ZB FileService (AWS S3 under the hood). Metadata linked to tasks via `TaskApi.addAttachment()`. Neon tracks the engagement-level document catalog (folder, type, upload metadata). UI follows the neverfail-lib `FileUploadComponent` pattern adapted for standalone Angular 21.

**Resource type:** Documents are `sme-mart:document` resources (Plan 030). This enables unified tagging (e.g., tag a document as SECURITY or COMPLIANCE), linking (`attachment_for` a task, `evidence_for` a requirement), and cross-resource search. The same resource type serves both **buyer uploads** (this plan) and **vendor evidence uploads** (Plan 033). On ZB platform migration, `sme-mart:document` becomes a first-class ZB resource type.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              UI Layer                            │
│  DocumentUploadComponent (drag-drop + browse)    │
│  DocumentListComponent (catalog per engagement)  │
│  DocumentViewerDialog (preview + metadata)        │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│         DocumentService                          │
│  upload(), list(), delete(), attachToTask()       │
├──────────────┬───────────────┬──────────────────┤
│  ZB File     │  ZB Task      │  Neon             │
│  Service     │  Attachments  │  Catalog          │
│  (upload,    │  (link file   │  (engagement_     │
│   download)  │   to task)    │   documents)      │
└──────┬───────┴───────┬───────┴──────────────────┘
       │               │
  ┌────▼────┐   ┌──────▼──────┐
  │ ZB File │   │ Neon table  │
  │ Service │   │ engagement_ │
  │ (S3)    │   │ documents   │
  └─────────┘   └─────────────┘
```

---

## Phase 1: Neon Schema + Document Service

### 1.1 Database Table

```sql
CREATE TABLE engagement_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES work_requests(id),

  -- File identity
  zb_file_id UUID NOT NULL,            -- ZB FileService file ID
  zb_file_version_id UUID NOT NULL,    -- ZB FileService version ID
  filename VARCHAR(500) NOT NULL,
  mime_type VARCHAR(255),
  file_size_bytes BIGINT,

  -- Classification
  document_type VARCHAR(100) NOT NULL, -- 'security_requirements', 'sow', 'budget', 'legal_terms', 'compliance', 'functional_spec', 'other'
  display_name VARCHAR(500),           -- User-friendly name (defaults to filename)
  description TEXT,

  -- Task attachment
  zb_task_id UUID,                     -- If attached to a specific task
  zb_task_attachment_id UUID,          -- ZB TaskAttachment ID

  -- Metadata
  uploaded_by_zerobias_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_engagement_documents_engagement ON engagement_documents(engagement_id) WHERE NOT archived;
CREATE INDEX idx_engagement_documents_type ON engagement_documents(document_type);
```

### 1.2 Neon View

```sql
CREATE OR REPLACE VIEW v_engagement_documents AS
SELECT
  ed.*,
  wr.title AS engagement_title,
  wr.engagement_tag
FROM engagement_documents ed
JOIN work_requests wr ON wr.id = ed.engagement_id
WHERE NOT ed.archived;
```

### 1.3 Document Service

**File:** `src/app/core/services/document.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class DocumentService {
  // Upload: ZB FileService create + binary upload + Neon catalog entry
  async uploadDocument(engagementId: string, file: File, opts: {
    documentType: DocumentType;
    displayName?: string;
    description?: string;
  }): Promise<EngagementDocument>;

  // List documents for an engagement
  async listDocuments(engagementId: string, opts?: {
    documentType?: DocumentType;
    archived?: boolean;
  }): Promise<EngagementDocument[]>;

  // Attach document to a task (creates ZB TaskAttachment)
  async attachToTask(documentId: string, taskId: string, commentText?: string): Promise<void>;

  // Download file content
  async downloadDocument(documentId: string): Promise<Blob>;

  // Preview URL (ZB FileService view endpoint)
  getPreviewUrl(zbFileVersionId: string): string;

  // Archive (soft delete)
  async archiveDocument(documentId: string): Promise<void>;
}
```

**Upload workflow (mirrors neverfail-lib pattern):**
1. Read file as ArrayBuffer
2. Calculate MD5 checksum
3. `fileClient.create({ name, retentionPolicy: {}, syncPolicy: {} })` → get `fileId`, `fileVersionId`
4. POST binary to `/files/{fileId}/upload?checksum={md5}` with progress tracking
5. INSERT into `engagement_documents` via Generic SQL
6. Return document record

---

## Phase 2: UI Components

### 2.1 Document Upload Component

**File:** `src/app/shared/components/document-upload/document-upload.component.ts`

**Inputs:**
- `@Input() engagementId: string`
- `@Input() allowedTypes?: DocumentType[]` — filter document type dropdown
- `@Input() multiple: boolean = true`

**Outputs:**
- `@Output() uploaded = new EventEmitter<EngagementDocument>()`

**UI:**
```
┌──────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────┐ │
│  │         Drag files here or Browse            │ │
│  │         (dashed border drop zone)            │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  Document Type: [ Security Requirements ▼ ]        │
│  Display Name:  [ ________________________ ]       │
│  Description:   [ ________________________ ]       │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │ 📄 Exhibit_F.docx     45KB   [████████] ✓ │   │
│  │ 📄 SOW_Draft.pdf     120KB   [██████  ] 75%│   │
│  └────────────────────────────────────────────┘   │
│                              [ Upload ] [ Cancel ] │
└──────────────────────────────────────────────────┘
```

**Features:**
- Drag-and-drop zone with visual feedback
- File type validation (PDF, DOCX, XLSX, images)
- Progress bar per file (0-100%)
- Document type dropdown (Security, SOW, Budget, Legal, Compliance, Functional, Other)
- MD5 checksum calculation (Web Crypto API)
- Cancel individual uploads
- Max file size: 50MB

### 2.2 Document List Component

**File:** `src/app/shared/components/document-list/document-list.component.ts`

**Inputs:**
- `@Input() engagementId: string`
- `@Input() isOwner: boolean` — enables upload/delete actions
- `@Input() filterType?: DocumentType`

**UI:**
```
┌───────────────────────────────────────────────────────────────┐
│ Documents (6)                              [ + Upload ]        │
├───────────────────────────────────────────────────────────────┤
│ Type          │ Name              │ Size   │ Uploaded   │     │
├───────────────┼───────────────────┼────────┼────────────┼─────┤
│ SECURITY      │ Exhibit F v5.5    │ 245KB  │ 3/5/2026   │ ⋯  │
│ SOW           │ Statement of Work │ 1.2MB  │ 3/5/2026   │ ⋯  │
│ BUDGET        │ Cost Proposal     │ 89KB   │ 3/5/2026   │ ⋯  │
│ LEGAL         │ Terms & Conditions│ 456KB  │ 3/5/2026   │ ⋯  │
│ COMPLIANCE    │ HIPAA BAA         │ 123KB  │ 3/5/2026   │ ⋯  │
│ FUNCTIONAL    │ Tech Requirements │ 890KB  │ 3/5/2026   │ ⋯  │
└───────────────────────────────────────────────────────────────┘
```

**Actions menu (⋯):** Preview, Download, Attach to Task, Edit metadata, Archive

### 2.3 Integration Points

**Engagement detail page** — New "Documents" tab (add after Overview):
```
Overview | Documents | Details | Tasks | Timeline | Notes
```

**Task card** — Show attached documents count + list:
```
[📎 2 documents] — clickable, shows attached docs inline
```

**Task creation** — Option to link existing documents during subtask creation.

---

## Phase 3: Task Attachment Integration

### 3.1 Attach Document to Task

When user selects "Attach to Task" from document list:
1. Open dialog showing task tree (master + subtasks)
2. User selects target task
3. Call `TaskApi.addAttachment(taskId, { fileVersionId, commentTxt: 'Attached: {displayName}' })`
4. Update Neon `engagement_documents.zb_task_id` and `zb_task_attachment_id`
5. Refresh task card to show updated attachment count

### 3.2 Attach During Upload

Optional flow: Upload + attach in one step
1. Document upload dialog includes optional "Attach to task" selector
2. If selected, after upload completes, immediately creates task attachment
3. Single user action for the common case

---

## Document Types (Enum)

```typescript
export type DocumentType =
  | 'security_requirements'  // Exhibit F, security questionnaires
  | 'sow'                   // Statement of Work
  | 'budget'                // Cost proposals, budgets
  | 'legal_terms'           // Terms & conditions, contracts, NDAs
  | 'compliance'            // Regulatory docs, certifications, HIPAA BAA
  | 'functional_spec'       // Technical requirements, functional specs
  | 'other';                // Catch-all
```

Maps to **task type tags** (global ZB tags Clark will create):
- `security_requirements` → `SECURITY` tag
- `sow` → `FUNCTIONAL` tag
- `budget` → `FINANCIAL` tag
- `legal_terms` → `LEGAL` tag
- `compliance` → `COMPLIANCE` tag
- `functional_spec` → `FUNCTIONAL` tag

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| ZB FileService upload endpoint may differ from neverfail-lib pattern | Verify endpoint with Kevin; fallback to direct HTTP POST |
| File size limits on ZB FileService | Test with large PDFs (10MB+); implement client-side validation |
| MD5 checksum calc blocks main thread | Use Web Workers for large files |
| CORS on FileService upload | Should work same-origin (via proxy); test in CI env |

---

## Testing Strategy

- **Unit:** DocumentService upload/list/attach methods with mocked FileService + SQL
- **Integration:** Upload a real file to CI ZB FileService, verify attachment appears on task
- **E2E:** Full drag-drop → upload → attach to task → verify in task card

---

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `src/app/core/models/document.model.ts` |
| Create | `src/app/core/services/document.service.ts` |
| Create | `src/app/shared/components/document-upload/document-upload.component.ts` |
| Create | `src/app/shared/components/document-upload/document-upload.component.html` |
| Create | `src/app/shared/components/document-upload/document-upload.component.scss` |
| Create | `src/app/shared/components/document-list/document-list.component.ts` |
| Create | `src/app/shared/components/document-list/document-list.component.html` |
| Create | `src/app/shared/components/document-list/document-list.component.scss` |
| Modify | `src/app/pages/engagements/engagement-detail.component.ts` — add Documents tab |
| Modify | `src/app/shared/components/task-card/task-card.component.ts` — show attached docs |
| SQL    | `engagement_documents` table + view + indexes |
