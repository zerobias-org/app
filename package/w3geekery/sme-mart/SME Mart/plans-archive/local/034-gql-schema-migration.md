# GQL Schema Migration Plan — SmeMartResource → AuditgraphDB via Receiver Pipeline

> **Status:** Phases 1-4 complete — Schema live in prod, pipeline created and tested with first Engagement object in AuditgraphDB
> **Created:** 2026-03-05
> **Session:** `claude --resume poc/sme-mart`
> **PR:** https://github.com/zerobias-org/schema/pull/3
> **Reference:** [Kevin huddle notes](../../notes/meetings/2026-03-05-kevin-huddle-gql-pipeline.md), [KB34 Collector Dev Guide](https://app.zerobias.com/api/article/kb/kb34/index.html)

---

## Overview

Migrate SME Mart from the Neon-backed `SmeMartResource` abstraction to the ZeroBias platform's AuditgraphDB. Entity data moves from Neon tables into AuditgraphDB (per boundary) via a **Receiver Differential Pipeline**. Reads use the auto-generated **GraphQL API**. Tags and links become native AuditgraphDB relationships.

### Current State (Neon-backed)

```
Angular UI
    │
    ▼
SmeMartResourceService
    ├── Entity CRUD ──────► Neon tables (notes, work_requests, etc.)
    ├── Tag assignments ──► sme_resource_tags (Neon)
    ├── Links ─────────────► sme_resource_links (Neon)
    └── Tag CRUD ──────────► ZB Tag API (real platform tags)
```

### Target State (AuditgraphDB + Receiver Pipeline)

```
Angular UI
    │
    ▼
SmeMartResourceService
    ├── Writes (create/update/delete) ──► Receiver Pipeline (Batch API)
    │                                         ↓
    │                                    AuditgraphDB (per boundary)
    │                                         ↓
    ├── Reads (query/filter/sort) ──────► GraphQL API (auto-generated, read-only)
    ├── Tags ──────────────────────────► Native AuditgraphDB tags (Object.tag[])
    ├── Links ─────────────────────────► Native AuditgraphDB links (YAML linkTo)
    └── Tag CRUD ──────────────────────► ZB Tag API (unchanged)
```

### Key Architecture Decisions (Kevin, 2026-03-05)

| Decision | Detail |
|----------|--------|
| **Base class** | `Object` — provides id, name, description, tags, links, dates, metadata |
| **NOT Element** | Element = formal document parts (laws, standards). Wrong for marketplace entities. |
| **Write path** | Receiver Pipeline → Batch API (`addBatchItem`) → AuditgraphDB |
| **Read path** | GraphQL API (read-only, auto-generated from schema YAML) |
| **Pipeline type** | Receiver + Differential (push changes only: add/remove/modify) |
| **Storage** | AuditgraphDB (per boundary) — replaces Neon for entity data |
| **Boundary** | Single "W3Geekery SME Mart" boundary — schema, pipeline, data all scoped here |
| **Document type** | Extends `File` (platform base class with fileVersionId, size, mimeType, downloadUrl) |
| **Schema deployment** | Merge YAML to dev/qa/main in `zerobias-org/schema` repo → auto-updates environment |
| **Schema package location** | `zerobias-org/schema` repo via PR (fork: `w3geekery/schema`) |
| **Links** | Defined in YAML via `linkTo` syntax |
| **Local dev testing** | Not available yet — unified DB + Gradle + dataloader coming soon |
| **ZB_TOKEN** | Already in env |

### Naming Decision

**`WorkRequest` → `Engagement`** — The UI and Brian's terminology consistently use "Engagement." The class is named `Engagement` in the schema to align GQL queries with UI language (`query { Engagement { ... } }`). The underlying concept covers the full lifecycle: RFP creation (draft) → published → proposal acceptance → work in progress → completed.

---

## Dependency Graph

```
Phase 1: Scaffolding ─────────────────────── ✅ DONE (PR #3)
  └── Phase 2: Class Definitions ──────────── ✅ DONE (PR #3)
      └── Phase 3: Field, Enum & Link Defs ── ✅ DONE (PR #3)
          ├── Phase 4: Pipeline Setup ─────── ✅ DONE (2026-03-17) — pipeline created + test data pushed
          │   └── Phase 5: Service Layer ──── NEXT: PipelineWriteService + GraphQLReadService
          │       └── Phase 6: Data Migration  Blocked: Phase 5
          │       └── Phase 7: Task-backed Reviews ── Needs Kevin follow-up
          └── Phase 8: Cleanup ────────────── Blocked: Phases 5, 6, 7
```

---

## Phase 1: Schema Package Scaffolding — ✅ DONE

**Repo:** `w3geekery/schema` (fork of `zerobias-org/schema`)
**Branch:** `feat/w3geekery-sme-mart-schema`
**Package path:** `package/w3geekery/sme-mart/`

| File | Content |
|------|---------|
| `catalog.yml` | Schema: name=SME Mart, package=w3geekery.sme-mart.schema |
| `package.json` | `@zerobias-org/schema-w3geekery-sme-mart` v1.0.0-rc.1, imports platform schema |
| `.npmrc` | GitHub Package Registry auth via `GITHUB_TOKEN` |

---

## Phase 2: Entity Class Definitions — ✅ DONE

All classes extend `Object` (or `File` for SmeMartDocument). PascalCase filenames in `classes/`.

### Base Class Reference

```yaml
# Object provides (inherited by all classes):
#   id, name, description, note, icon, tag[], metadata, url,
#   dateCreated, dateLastModified, dateDeleted, includes[], _links[], aliases[]
```

**Source:** `~/Projects/zb/platform/content/src/schemas/zerobias/platform/interfaces/Object.yml`

### YAML Link Syntax (from existing schema packages)

```yaml
# One-to-many link
- proposals:
    linkTo: Proposal
    multi: true

# Bidirectional link (with reverse field)
- parent:
    linkTo: NoteFolder.id.children

# One-directional link
- boundary:
    linkTo: Boundary
    uniLink: true

# Link with platform link type
- masterTask:
    linkTo: Task
    resourceLinkType: child_of
```

### 2.1 Engagement

```yaml
# classes/Engagement.yml
description: A buyer engagement/RFP in the SME marketplace
extends:
  - Object
properties:
  - category: { field: engagement.category }
  - status: { field: engagement.status }
  - budgetMin: { field: engagement.budgetMin }
  - budgetMax: { field: engagement.budgetMax }
  - timeline: { field: engagement.timeline }
  - engagementTag: { field: engagement.engagementTag }
  # Links
  - boundary:
      linkTo: Boundary
      uniLink: true
  - masterTask:
      linkTo: Task
      uniLink: true
  - proposals:
      linkTo: Proposal
      multi: true
  - reviews:
      linkTo: Review
      multi: true
  - notes:
      linkTo: Note
      multi: true
  - documents:
      linkTo: SmeMartDocument
      multi: true
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Status":
    jsonata: status
    sort: status
  "Category":
    jsonata: category
    sort: category
```

> **Note:** `name` and `description` inherited from `Object` — no need to redefine `title`.

### 2.2 Proposal

```yaml
# classes/Proposal.yml
description: A vendor's response to an engagement/RFP
extends:
  - Object
properties:
  - coverLetter: { field: proposal.coverLetter }
  - price: { field: proposal.price }
  - status: { field: proposal.status }
  - timeline: { field: proposal.timeline }
  # Links
  - engagement:
      linkTo: Engagement.id.proposals
  - serviceOffering:
      linkTo: ServiceOffering
      uniLink: true
```

### 2.3 Review

```yaml
# classes/Review.yml
description: Post-engagement review/rating of a provider
extends:
  - Object
properties:
  - rating: { field: review.rating }
  - reviewText: { field: review.reviewText }
  - status: { field: review.status }
  # Links
  - engagement:
      linkTo: Engagement.id.reviews
  - approvalTask:
      linkTo: Task
      uniLink: true
```

> **Note:** Task-backed approval integration in Phase 7. Review links to a ZB Task for approval workflow.

### 2.4 ServiceOffering

```yaml
# classes/ServiceOffering.yml
description: A provider's catalog listing in the SME marketplace
extends:
  - Object
properties:
  - category: { field: serviceOffering.category }
  - pricingType: { field: serviceOffering.pricingType }
  - price: { field: serviceOffering.price }
  - deliveryTime: { field: serviceOffering.deliveryTime }
viewProperties:
  "Name":
    jsonata: name
    sort: name
  "Category":
    jsonata: category
    sort: category
  "Pricing":
    jsonata: pricingType
    sort: pricingType
```

### 2.5 Note

```yaml
# classes/Note.yml
description: Rich-text engagement note
extends:
  - Object
properties:
  - content: { field: note.content }
  - accessLevel: { field: note.accessLevel }
  # Links
  - folder:
      linkTo: NoteFolder.id.notes
  - engagement:
      linkTo: Engagement.id.notes
```

### 2.6 NoteFolder

```yaml
# classes/NoteFolder.yml
description: Hierarchical folder structure for notes
extends:
  - Object
properties:
  - color: { field: noteFolder.color }
  - sortOrder: { field: noteFolder.sortOrder }
  # Links
  - parent:
      linkTo: NoteFolder.id.children
  - children:
      linkTo: NoteFolder.id.parent
      multi: true
  - notes:
      linkTo: Note.id.folder
      multi: true
```

### 2.7 SmeMartDocument

```yaml
# classes/SmeMartDocument.yml
description: Uploaded file tracked via ZB FileService
extends:
  - File
properties:
  - documentType: { field: document.documentType }
  # Links
  - engagement:
      linkTo: Engagement.id.documents
  - relatedTask:
      linkTo: Task
      uniLink: true
```

> **Note:** Named `SmeMartDocument` to avoid collision with platform `Document` type. Extends `File` which provides `fileVersionId`, `size`, `mimeType`, `downloadUrl`, `viewUrl`.

---

## Phase 3: Field, Enum & Link Definitions — ✅ DONE

camelCase dot-notation filenames in `fields/` and `enums/`.

### Fields (21 custom files)

Fields inherited from `Object` (id, name, description, dates, etc.) and `File` (size, mimeType, etc.) don't need redefinition.

| Class | Custom Fields |
|-------|---------------|
| Engagement | category, status, budgetMin, budgetMax, timeline, engagementTag |
| Proposal | coverLetter, price, status, timeline |
| Review | rating, reviewText, status |
| ServiceOffering | category, pricingType, price, deliveryTime |
| Note | content, accessLevel |
| NoteFolder | color, sortOrder |
| SmeMartDocument | documentType |

**Example field:**
```yaml
# fields/engagement.budgetMin.yml
description: 'Minimum budget for the engagement'
displayName: 'Budget Min'
type: number
```

### Enums (5 files)

| Enum | Values |
|------|--------|
| `engagement.status` | DRAFT, PUBLISHED, IN_PROGRESS, COMPLETED, CANCELLED |
| `proposal.status` | PENDING, ACCEPTED, REJECTED, WITHDRAWN |
| `review.status` | PENDING_APPROVAL, APPROVED, REJECTED |
| `serviceOffering.pricingType` | FIXED, HOURLY, SUBSCRIPTION, CUSTOM |
| `document.documentType` | SECURITY_REQUIREMENTS, SOW, BUDGET, LEGAL_TERMS, COMPLIANCE, FUNCTIONAL_SPEC, OTHER |

---

## Phase 4: Pipeline Setup — ✅ DONE (2026-03-17)

### 4.1 Create Boundary — ✅ Already existed

Using **Platform** boundary (`2842fab1-ceff-4ec4-bf09-ce5e7c33c3e2`) on prod.

### 4.2 Configure Product — ✅ Already existed

SME Mart product added to Platform boundary.
- **Product ID:** `9e177cd2-6320-46f0-a55d-a5ed6bdab233`
- **Boundary Product ID:** `94f0b2f2-e795-4db9-b0e8-d04fa499d06c`

### 4.3 Create Receiver Differential Pipeline — ✅ DONE

Created via `platform.Pipeline.create` (ZB MCP):
- **Pipeline ID:** `091d5068-0527-4f45-9839-37f6d5c1669e`
- **Name:** SME Mart Entity Pipeline
- **Execution Mode:** `receiver`
- **Batch Mode:** `differential`
- **Connector Type:** `dynamic`
- **Format:** `json`
- **Admin Status:** `created` (receiver pipelines don't need "start" — they accept pushes immediately)

**Key learning:** Receiver pipelines cannot be "started" — the UI Start button is for caller/cron pipelines only. Error: "Invalid pipeline with executionMode 'receiver' cannot be started."

### 4.4 Test Pipeline with Sample Data — ✅ DONE

Used `platform.Pipeline.receive` (simplified one-call API) to push a test Engagement:

```
platform.Pipeline.receive({
  pipelineId: "091d5068-0527-4f45-9839-37f6d5c1669e",
  simpleBatch: {
    classId: "7711aa41-e55b-5cda-9b7a-35844a2006a1",  // Engagement
    data: [{
      id: "test-engagement-001",
      name: "SOC 2 Type II Assessment - Acme Corp",
      description: "Full SOC 2 Type II readiness assessment...",
      status: "published",
      category: "SOC 2",
      budgetType: "fixed",
      budgetMin: 25000,
      budgetMax: 45000,
      timeline: "Q2 2026",
      responseDeadline: "2026-04-15",
      questionsDeadline: "2026-04-01"
    }],
    tagIds: []
  }
})
```

**Result:** Job #1 completed successfully. Object visible in Platform boundary UI with all custom fields.

**GQL note:** `Engagement` type not yet available in GraphQL queries — schema regeneration may be scheduled or need platform refresh. Data confirmed in AuditgraphDB via boundary UI.

### 4.5 Create API Key

API key already configured via ZB MCP prod profile.

---

## Phase 5: Service Layer Migration

**Blocked on Phase 4 (pipeline must be working).**

### 5.1 Create PipelineWriteService

**File:** `src/app/core/services/pipeline-write.service.ts` (new)

Wraps the Receiver Pipeline Batch API:

```typescript
// Encapsulates the Pipeline → Job → Batch → Item flow
class PipelineWriteService {
  createEntity(className: string, obj: Object): Promise<void>
  updateEntity(className: string, obj: Object): Promise<void>
  deleteEntity(className: string, objId: string): Promise<void>
}
```

Internally manages: `createPipelineJob` → `createBatch` → `addBatchItem` → `endBatch` → `endPipelineJob`

### 5.2 Create GraphQLReadService

**File:** `src/app/core/services/graphql-read.service.ts` (new)

Wraps GraphQL queries for reading entities:

```typescript
class GraphQLReadService {
  query<T>(className: string, filters?: Record<string, string>, page?: PageParams): Promise<T[]>
  getById<T>(className: string, id: string): Promise<T>
}
```

### 5.3 Update SmeMartResourceService

**File:** `src/app/core/services/sme-mart-resource.service.ts`

- Writes → `PipelineWriteService`
- Reads → `GraphQLReadService`
- Tags → native `Object.tag[]` (pushed via pipeline, queried via GraphQL)
- Links → native `linkTo` fields (defined in YAML, queried via GraphQL)

Public API stays identical → **zero component changes**.

### 5.4 Update Entity Services

Each entity service switches from Neon to Pipeline+GraphQL:

| Service | Write (Neon → Pipeline) | Read (Neon → GraphQL) |
|---------|------------------------|----------------------|
| `notes.service.ts` | `db.createRow('notes', ...)` → `pipeline.createEntity('Note', ...)` | `db.searchRows('notes', ...)` → `gql.query('Note', ...)` |
| `engagement-hierarchy.service.ts` | Similar | Similar |
| `engagement-tasks.service.ts` | Unchanged (already uses ZB Task API) | Unchanged |

### 5.5 Update Tests

Mock `PipelineWriteService` and `GraphQLReadService` instead of `SmeMartDbService`.

---

## Phase 6: Data Migration

**Blocked on Phase 5.**

### Strategy

1. **Snapshot** — Export all Neon entity tables + `sme_resource_tags` + `sme_resource_links` to CSV
2. **Push entities** — For each entity table, create a batch and `addBatchItems` through the pipeline
3. **Verify** — GraphQL query counts match Neon counts for each entity type
4. **Tags** — Already real ZB tags; assignments now implicit via `Object.tag[]` pushed through pipeline
5. **Links** — Now defined as YAML `linkTo` fields; push with correct IDs through pipeline
6. **Archive** — Rename old Neon tables to `*_archived` (keep 30 days)

### Batch Mode: Differential

Since we're doing a one-time migration, we push all existing entities as "adds" through the Differential pipeline. Future operations push individual changes.

---

## Phase 7: Task-backed Reviews

**Needs Kevin follow-up:** How exactly does Review link to Task for approval workflow?

Current understanding:
- Review extends `Object` with a `linkTo: Task` (uniLink) for the approval task
- On review creation, create a ZB Task for admin approval
- Task state machine (pending → approved/rejected) drives review lifecycle

### 7.1 Create ApprovalWorkflowService

**File:** `src/app/core/services/approval-workflow.service.ts` (new)

- `createReviewApprovalTask(reviewId)` → Create ZB Task
- `approveReview(reviewId, taskId)` → Transition task to approved
- `rejectReview(reviewId, reason, taskId)` → Transition task to rejected

### 7.2 Update Review UI

Display approval task status badge, approve/reject buttons for admins.

---

## Phase 8: Cleanup & Deprecation

**Final phase after migration verified.**

| Action | Files | Risk |
|--------|-------|------|
| Remove Neon entity tables | `notes`, `work_requests`, `proposals`, etc. → archived | Low |
| Remove `sme_resource_tags` / `sme_resource_links` | → archived | Low |
| Remove `SmeMartResource` interface (if unused) | `sme-mart-resource.model.ts` | Low |
| Remove mapper functions (if unused) | `src/app/core/mappers/` | Low |
| Remove `SmeMartDbService` Neon methods | `sme-mart-db.service.ts` | Low |
| Update CLAUDE.md and PLAN.md | Documentation | Low |

---

## Blocker Questions — ALL ANSWERED

| # | Question | Kevin's Answer |
|---|----------|----------------|
| Q1 | Do mutations get auto-generated? | **No.** Write via Receiver Pipeline (Batch API). Read via GraphQL (read-only). |
| Q2 | "Document is covered as is Service Offering"? | **File objects exist in GQL** — Document extends `File`. ServiceOffering is SME Mart-specific. |
| Q3 | Dataloader trigger? | **Automatic on merge** to schema repo branch (dev/qa/main). |
| Q4 | Where are instances stored? | **AuditgraphDB** (per boundary). |
| Q5 | Schema package location? | **`zerobias-org/schema`** repo via PR. |
| Q6 | Links in YAML? | **Yes.** `linkTo` syntax. See schema repo `CLAUDE.md`. |
| Q7 | Task-backed Reviews base class? | **Not Element.** `Object` is the base. Link to Task via `linkTo`. |
| Q8 | Cross-schema links? | **Yes.** Defined in YAML via `linkTo` (same as Q6). |
| Q9 | Local dev testing? | **Yes — dataloader against scratch DB.** Install globally (`npm i -g @zerobias-com/dataloader`), create scratch DB from `platform/sql/src/ddl/tools`, run `dataloader` in schema package dir. |
| Q10 | ZB_TOKEN? | **Already in env.** |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Batch API not suited for real-time single-record CRUD | High | Test latency of single `addBatchItem` calls; may need Kevin guidance on optimization |
| No local dev testing for schema | Medium | Test against dev/CI environment; validate with `npm run validate` locally |
| Data integrity loss during migration | Critical | Snapshot before, test in staging, archive old tables 30 days |
| `Object` base class missing fields we need | Medium | Can use higher ancestors or add custom fields; Object provides id/name/desc/tags/links |
| Pipeline URL/auth setup unclear | Medium | KB34 documents the process; create API key from ZB UI |
| Differential mode delete semantics | Medium | Clarify with Kevin: how to explicitly delete an object in Differential mode |

---

## Testing Strategy

### Schema Validation
- `npm run validate` in schema package (local, before PR) — ✅ DONE
- GraphQL introspection query to verify all types generated (after merge to dev)
- Filter operators available on all fields

### Pipeline Tests
- Push sample Engagement through pipeline → query via GraphQL
- Push batch of entities → verify counts match
- Test update (modify existing object) and delete flows

### Unit Tests
- PipelineWriteService: Mock Batch API, verify correct call sequence
- GraphQLReadService: Mock GraphQL responses, verify query construction
- SmeMartResourceService: Mock both services, verify behavior unchanged

### E2E Tests
- Create engagement → visible in GraphQL
- Add tags → visible in Object.tag[]
- Create proposal linked to engagement → traversable via GraphQL links
- Review approval flow (Phase 7)

---

## Estimated Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| 1–3 (Schema + fields + enums) | 1–2 weeks | ✅ DONE — PR #3 open |
| 4 (Pipeline setup) | 1 week | Awaiting PR merge |
| 5 (Service layer) | 2–3 weeks | Blocked on Phase 4 |
| 6 (Data migration) | 1 week | Blocked on Phase 5 |
| 7 (Task-backed reviews) | 1–2 weeks | Needs Kevin follow-up |
| 8 (Cleanup) | 1 week | Can defer |
| **Total** | **7–10 weeks** | |

---

## Pre-Merge: Dataloader Verification (Required)

Before PR #3 can be merged, we must run the dataloader locally to verify the schema loads correctly.

### Steps

1. **Install dataloader globally:**
   ```bash
   npm i -g @zerobias-com/dataloader
   ```

2. **Create scratch database:**
   ```bash
   # From zerobias-com/platform repo — DDL tools create a local PostgreSQL instance
   cd ~/Projects/zb/platform/sql/src/ddl/tools
   ./create-scratch-db.sh    # Sets up local DB with hydra schema
   ```
   May need to apply content/dev schema depending on what base classes are referenced.

3. **Run dataloader against our schema branch:**
   ```bash
   cd ~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/sme-mart
   dataloader
   ```
   Must complete without errors.

4. **PR review process:**
   - **Daniel** reviews schema PRs (not Kevin)
   - Daniel adds approve tag if good, then merges
   - On merge to `dev`/`qa`/`main`, platform dataloader auto-imports

### Open Questions

- Exact script name for scratch DB creation in `platform/sql/src/ddl/tools/` — need to verify
- Whether "apply content dev schema" step is needed (base classes like `Object`, `File` may need to be pre-loaded)
- Local PostgreSQL version requirements

---

## Next Steps

1. ~~Scaffold schema package~~ — ✅ DONE
2. ~~Define classes, fields, enums~~ — ✅ DONE
3. **Run dataloader verification** — install, scratch DB, verify schema loads
4. **Daniel reviews PR #3** — adds approve tag, merges to `dev`
5. **Phase 4** — create boundary + pipeline in ZB UI, test with sample data
6. **Follow up with Kevin** — Differential delete semantics, real-time CRUD latency via Batch API

---

*Session: `claude --resume poc/sme-mart`*
