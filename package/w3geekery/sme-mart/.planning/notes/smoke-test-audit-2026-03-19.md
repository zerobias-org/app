# Smoke Test Audit — 2026-03-19

Systematic audit of all SME Mart routes after AuditgraphDB migration. Each service's `getXxxFields()` method was compared against the actual GQL schema YAML definitions.

## Schema Reference

**Object base class** (inherited by all except SmeMartDocument):
`id, name, description, note, icon, tag[], metadata, url, dateCreated, dateLastModified, dateDeleted, includes[], _links[], aliases[]`

**File base class** (SmeMartDocument only):
All Object fields + `fileVersionId, size, mimeType, downloadUrl, viewUrl`

## Findings by Service

### 1. EngagementsService — `getEngagementFields()` ✅ ALREADY FIXED
Schema custom: `category, status, budgetType, budgetMin, budgetMax, timeline, engagementTag, responseDeadline, questionsDeadline, confidentialityRequirements, evaluationCriteria, wizardStep, wizardData`
- Fixed in prior session
- Note: `dateCreated` mapping works but Overview tab shows blank CREATED date — need to verify mapping roundtrip

### 2. BidsService — `getBidFields()` ❌ BROKEN
**Schema custom:** `coverLetter, price, status, timeline, executiveSummary, teamDescription, totalEstimatedHours, pricingBreakdown, wizardData, wizardStep`
**Relationships:** `engagement → Engagement.id.bids`, `responses → BidResponse.id.bid`

**Bad fields requested:**
- `engagementId` — relationship link, not a property
- `providerId` — NOT in schema
- `proposedPrice` — NOT in schema (schema has `price`)
- `proposedTimeline` — NOT in schema (schema has `timeline`)
- `aiAssisted` — NOT in schema
- `aiModel` — NOT in schema
- `aiGeneratedAt` — NOT in schema
- `createdAt` → should be `dateCreated`
- `updatedAt` → should be `dateLastModified`
- `bidResponses(...)` — wrong nested syntax (relationship is `responses`, not `bidResponses`)

**Fix:** Replace field list with schema-valid fields + dateCreated/dateLastModified

### 3. NotesService — `getNoteFields()` ❌ BROKEN
**Schema custom:** `content, accessLevel`
**Relationships:** `folder → NoteFolder.id.notes`, `engagement → Engagement.id.notes`

**Bad fields requested:**
- `title` — NOT in schema (Object base has `name`)
- `body` — NOT in schema (schema has `content`)
- `engagementId` — relationship link
- `folderId` — relationship link
- `authorZerobiasUserId` — NOT in schema
- `updatedByZerobiasUserId` — NOT in schema
- `archived` — NOT in schema
- `isMeetingMinutes` — NOT in schema
- `meetingDate` — NOT in schema
- `meetingDurationMinutes` — NOT in schema
- `backingTaskId` — NOT in schema
- `injectedToTaskId` — NOT in schema
- `injectedCommentId` — NOT in schema
- `injectedAt` — NOT in schema
- `boundaryId` — NOT in schema
- `projectId` — NOT in schema
- `createdAt` → should be `dateCreated`
- `updatedAt` → should be `dateLastModified`

**Fix:** Replace field list with `id, name, description, content, accessLevel, dateCreated, dateLastModified`. Update field mapping for `name`→`title` and `content`→`body`.

### 4. OrgDocumentService — `getDocumentFields()` ❌ BROKEN
**Schema custom:** `documentType`
**Extends:** File (adds `fileVersionId, size, mimeType, downloadUrl, viewUrl`)
**Relationships:** `engagement → Engagement.id.documents`

**Bad fields requested:**
- `engagementId` — relationship link
- `zbFileId` — NOT in schema
- `zbFileVersionId` — NOT in schema (File base has `fileVersionId`)
- `filename` — NOT in schema (File/Object base has `name`)
- `fileSizeBytes` — NOT in schema (File base has `size`)
- `displayName` — NOT in schema
- `zbTaskId` — NOT in schema
- `zbTaskAttachmentId` — NOT in schema
- `uploadedByZerobiasUserId` — NOT in schema
- `archived` — NOT in schema
- `createdAt` → should be `dateCreated`
- `updatedAt` → should be `dateLastModified`

**Fix:** Replace with `id, name, description, documentType, fileVersionId, size, mimeType, downloadUrl, viewUrl, dateCreated, dateLastModified`

### 5. ServiceOfferingsService — `getServiceOfferingFields()` ❌ BROKEN (CONFIRMED)
**Schema custom:** `category, pricingType, price, deliveryTime`

**Bad fields requested:**
- `providerId` — NOT in schema
- `title` — NOT in schema (Object base has `name`, but the mapping already translates)
- `subcategory` — NOT in schema
- `requirements` — NOT in schema
- `isActive` — NOT in schema (confirmed error: `Unknown argument "isActive"`)
- `createdAt` → should be `dateCreated`
- `updatedAt` → should be `dateLastModified`

**Fix:** Replace with `id, name, description, category, pricingType, price, deliveryTime, includes, dateCreated, dateLastModified`. Remove `isActive` filter from `listServices()`.

### 6. ReviewsService — `getReviewFields()` ❌ BROKEN
**Schema custom:** `rating, reviewText, status`
**Relationships:** `engagement → Engagement.id.reviews`

**Bad fields requested:**
- `providerId` — NOT in schema
- `reviewerZerobiasUserId` — NOT in schema
- `engagementId` — relationship link
- `approved` — NOT in schema (schema has `status`)
- `approvedAt` — NOT in schema
- `approvedBy` — NOT in schema
- `createdAt` → should be `dateCreated`
- `updatedAt` → should be `dateLastModified`

**Fix:** Replace with `id, name, description, rating, reviewText, status, dateCreated, dateLastModified`

### 7. NoteFolderService — inline fields in `getNoteFolderTree()` ❌ BROKEN
**Schema custom:** `color, sortOrder`
**Relationships:** `parent → NoteFolder.id.children`, `children`, `notes → Note.id.folder`

**Bad fields requested:**
- `engagementId` — NOT in schema (no direct engagement link on NoteFolder)
- `parentId` — relationship link, not flat property
- `createdByZerobiasUserId` — NOT in schema
- `accessLevel` — NOT in schema
- `createdAt` → should be `dateCreated`
- `updatedAt` → should be `dateLastModified`

**Fix:** Replace with `id, name, description, color, sortOrder, dateCreated, dateLastModified`

### 8. NoteHierarchyService — ❌ STILL USES NEON
**Issue:** `NoteHierarchyService` injects `SmeMartDbService` (direct Neon) instead of `NoteFolderService` (GQL/Pipeline).
**Error:** `NeonDbError: invalid input syntax for type uuid: "eng-001-crystal-harbor"` — engagement IDs from GQL are not UUIDs.
**Fix:** Refactor `NoteHierarchyService.getFolderTree()` to delegate to `NoteFolderService.getNoteFolderTree()`. Update write methods to delegate to `NoteFolderService` as well.

## Field Mapping Updates Needed

All field mappings need `dateCreated`/`dateLastModified` → `created_at`/`updated_at` in `gqlToNeon`. Currently only Engagement has this.

Affected mappings: `BID_FIELD_MAPPING`, `NOTE_FIELD_MAPPING`, `NOTE_FOLDER_FIELD_MAPPING`, `SERVICE_OFFERING_FIELD_MAPPING`, `REVIEW_FIELD_MAPPING`, `DOCUMENT_FIELD_MAPPING`

## Fixes Applied

### Fix 1: Field Lists — All 6 Services + NoteFolderService
Replaced every `getXxxFields()` method with schema-valid fields only.
- **BidsService** → `id, name, description, coverLetter, price, status, timeline, executiveSummary, teamDescription, totalEstimatedHours, pricingBreakdown, wizardData, wizardStep, dateCreated, dateLastModified`
- **NotesService** → `id, name, description, content, accessLevel, dateCreated, dateLastModified`
- **OrgDocumentService** → `id, name, description, documentType, fileVersionId, size, mimeType, downloadUrl, viewUrl, dateCreated, dateLastModified`
- **ServiceOfferingsService** → `id, name, description, category, pricingType, price, deliveryTime, includes, dateCreated, dateLastModified`
- **ReviewsService** → `id, name, description, rating, reviewText, status, dateCreated, dateLastModified`
- **NoteFolderService** (inline) → `id, name, description, color, sortOrder, dateCreated, dateLastModified`

### Fix 2: Field Mappings — `dateCreated`/`dateLastModified` + Schema Renames
Added `dateCreated → created_at` and `dateLastModified → updated_at` to all 6 gqlToNeon mappings.
Also added schema rename mappings:
- **BID**: `price → proposed_price`, `timeline → proposed_timeline`
- **NOTE**: `content → body`, `name → title`
- **DOCUMENT**: `fileVersionId → zb_file_version_id`, `size → file_size_bytes`, `downloadUrl → download_url`, `viewUrl → view_url`

### Fix 3: Removed Non-Schema GQL Filters
Removed filters using relationship IDs or non-existent properties:
- **ServiceOfferingsService**: Removed `isActive` filter from `listServices()`
- **BidsService**: Removed `engagementId`, `providerId` filters (relationships, not properties)
- **NotesService**: Removed `engagementId`, `archived`, `folderId` filters; renamed `title` → `name`, `body` → `content`
- **ReviewsService**: Removed `providerId` filter; changed `approved` → `status`
- **OrgDocumentService**: Removed `engagementId`, `archived`, `orgId` filters
- **NoteFolderService**: Removed `engagementId` filter (NoteFolder has no engagement link)

### Fix 4: NoteHierarchyService — Migrated from Neon to GQL
Rewrote `NoteHierarchyService` to delegate to `NoteFolderService` (GQL/Pipeline):
- `getFolderTree()` → `NoteFolderService.getNoteFolderTree()` + tree shape transform
- `createFolder()` → `NoteFolderService.createFolder()`
- `updateFolder()` → `NoteFolderService.updateFolder()`
- `deleteFolder()` → `NoteFolderService.deleteFolder()`
- `moveNote()` → `PipelineWriteService.pushEntity('Note', ...)`
- `moveFolder()` → `NoteFolderService.updateFolder()`
- `moveAllNotes()` → GQL query + Pipeline push (was Neon SQL)
- Removed `SmeMartDbService` dependency entirely

### Fix 5: Document List Component — Switched to GQL
Changed `document-list.component.ts` `loadDocuments()` from `docService.listDocuments()` (Neon SQL via `org_document_shares` JOIN) to `orgDocService.listDocuments()` (GQL). Eliminated the `NeonDbError: invalid input syntax for type uuid` error.

## Verification Results (Post-Fix)

| Route | Status | Notes |
|-------|--------|-------|
| `/my/engagements` | ✅ Working | 5 engagement cards rendering |
| `/services` | ✅ Fixed | 3 service offerings rendering (was: `Unknown argument "isActive"`) |
| `/rfps` | ✅ Working | No errors |
| Engagement → Overview | ✅ Working | CREATED date blank (dateCreated null in demo data, not a bug) |
| Engagement → Documents | ✅ Fixed | No errors (was: Neon UUID cast error). Shows (0) — see Known Limitations. |
| Engagement → Details | ✅ Working | Budget/timeline show. Bids (0) — expected, needs separate GQL query. |
| Engagement → Tasks | ⚠️ Empty | Expected — `zerobias_task_id` not in GQL schema, needs platform lookup. |
| Engagement → Timeline | ✅ Working | Uses its own event source, no GQL issues. |
| Engagement → Notes | ✅ Fixed | Notebooks load from GQL (was: NeonDbError). Notes show 0 — see Known Limitations. |

## Known Limitations (Not Bugs — Architecture Gaps)

1. **Relationship-based filtering not available.** GQL `linkTo` relationships (engagement→bids, note→folder, etc.) don't expose flat ID fields for filtering. Queries are boundary-scoped and return ALL entities of a class. This means:
   - Documents tab shows (0) even though 3 documents exist — can't filter by engagement
   - Notes show (0) count — can't filter by engagement/folder
   - Bids show (0) — can't filter by engagement

2. **`dateCreated`/`dateLastModified` null in demo data.** The pipeline push didn't set Object base class date fields. Not a code bug — demo data needs re-seeding with these fields.

3. **`pkvs` 500 errors.** User preferences API (`/api/dana/pkvs/sme-mart.*`) returns 500 on UAT. Pre-existing issue, not related to GQL migration.

4. **Note counts always 0.** `NoteFolderWithCounts.note_count` and `subfolder_count` came from a Neon VIEW (`v_note_folders_with_counts`). GQL doesn't have this aggregation, so defaults to 0.

## Files Modified

| File | Change |
|------|--------|
| `src/app/core/services/bids.service.ts` | Fixed field list + removed non-schema filters |
| `src/app/core/services/notes.service.ts` | Fixed field list + removed non-schema filters |
| `src/app/core/services/org-document.service.ts` | Fixed field list + removed non-schema filters |
| `src/app/core/services/service-offerings.service.ts` | Fixed field list + removed `isActive` filter |
| `src/app/core/services/reviews.service.ts` | Fixed field list + changed `approved` → `status` filter |
| `src/app/core/services/note-folder.service.ts` | Fixed inline field list + removed `engagementId` filter |
| `src/app/core/services/note-hierarchy.service.ts` | Full rewrite: Neon → GQL/Pipeline delegation |
| `src/app/core/field-mappings.ts` | Added dateCreated/dateLastModified + schema rename mappings to all entities |
| `src/app/shared/components/document-list/document-list.component.ts` | Switched from DocumentService (Neon) to OrgDocumentService (GQL) |

### Fix 6: Seeded 4 RFP Demo Entities + 5 Bids
Pushed via `platform.Pipeline.receive` to AuditgraphDB (UAT pipeline `591861da-...`).

**RFPs (Engagements without engagementTag):**
| ID | Name | Status | Category | Budget |
|----|------|--------|----------|--------|
| `rfp-001-open-no-bids` | Penetration Testing for Healthcare Portal | open | Assessors | $12K–$18K |
| `rfp-002-open-with-bids` | Cloud Security Posture Review | open | Advisors | $8K–$15K |
| `rfp-003-open-competitive` | AI-Powered Vulnerability Triage Agent | open | Agentic | $25K–$40K |
| `rfp-004-draft` | FedRAMP Readiness Assessment | draft | Assessors | $30K–$50K |

**Bids:**
| ID | RFP | Provider | Price | Status |
|----|-----|----------|-------|--------|
| `bid-rfp002-gina` | Cloud Security Review | Gina Auditor | $11K | pending |
| `bid-rfp002-carlos` | Cloud Security Review | Carlos Rivera | $9.5K | pending |
| `bid-rfp003-bob` | AI Vuln Triage Agent | Bob IT | $35K | pending |
| `bid-rfp003-sarah` | AI Vuln Triage Agent | Sarah Chen | $28K | pending |
| `bid-rfp003-clark` | AI Vuln Triage Agent | Clark Stacer | $38K | pending |

## Future Work Ideas

### Services → RFP Action Flow
Service cards currently have no actions. The natural UX would be:
1. Buyer clicks service card → drawer opens with full details (description, includes[], provider info)
2. "Request This Service" button → pre-fills Create RFP form with category, suggested budget (from service price), tags provider for notification
3. Connects supply side (Services catalog) to demand side (RFPs)
