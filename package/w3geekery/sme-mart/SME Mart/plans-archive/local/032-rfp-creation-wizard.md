# Plan 032: RFP Creation Wizard (SM-18)

**Status:** Phases 1–3 Complete
**Priority:** High (demand-side foundation — buyer defines requirements)
**Depends on:** [031-document-upload-to-project.md](./031-document-upload-to-project.md) (document upload), [029-hierarchical-tag-naming.md](./029-hierarchical-tag-naming.md) (tag hierarchy), Global task-type tags (Clark creates in ZB platform)
**Source:** Brian's directive 2026-03-05 — "Build out the demand side of buyer with a project and shopping it"
**Updated:** 2026-03-10

---

## Summary

Build a multi-step wizard for buyers to create an RFP (Request for Proposal) that decomposes uploaded procurement documents into a structured engagement with typed tasks and subtasks. The wizard produces a fully-specified demand-side project that providers can respond to.

**North Star:** A buyer uploads Exhibit F (security) + SOW + budget docs → the wizard guides them through categorizing requirements → produces 5 typed tasks with 45+ subtasks → providers see a clean, structured RFP to bid on.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    RFP Creation Wizard                        │
│                                                              │
│  Step 1: Basics        → title, description, category        │
│  Step 2: Documents     → upload exhibits, SOW, budget        │
│  Step 3: Requirements  → define typed tasks + subtasks       │
│  Step 4: Terms         → budget, timeline, eval criteria     │
│  Step 5: Review        → summary, preview, publish           │
└──────────┬──────────────────────────────────────────────────┘
           │ Creates:
           ▼
┌─────────────────────────────────────────────────────────────┐
│  WorkRequest (status: draft → open)                          │
│  + engagement_documents (uploaded files)                      │
│  + ZB Master Task (engagement master)                        │
│  + ZB Child Tasks (typed: SECURITY, COMPLIANCE, LEGAL, etc.) │
│  + ZB SubTasks per child task (individual requirements)       │
│  + Tags: engagement tag, task-type global tags                │
│  + Hierarchical tags: PROJ-xxx, ENG-xxx on all resources      │
└─────────────────────────────────────────────────────────────┘
```

---

## Wizard Steps

### Step 1: Basics

**Purpose:** Capture high-level RFP information.

**Fields:**
- **Title** (required) — e.g., "CDPH Information Systems Modernization"
- **Description** (rich text, Milkdown) — high-level scope
- **Category** (select) — Industry/domain: Healthcare, Finance, Government, Technology, etc.
- **Budget type** — Fixed / Hourly / Negotiable
- **Budget range** — Min / Max (optional at this stage)
- **Timeline** — Expected start date, duration, or deadline

**On save:** Creates `work_requests` row with `status: 'draft'`, no `engagement_tag` yet (this is an RFP, not an engagement).

### Step 2: Documents

**Purpose:** Upload all procurement exhibits and supporting documents.

**UI:** Reuses `DocumentUploadComponent` from Plan 031.

```
┌─────────────────────────────────────────────────────────────┐
│ Upload Procurement Documents                                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Drag files here or Browse                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Uploaded Documents:                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📄 Exhibit F - Security    [Security Requirements ▼]  │ │
│  │ 📄 Exhibit A - SOW         [Statement of Work     ▼]  │ │
│  │ 📄 Exhibit B - Budget      [Budget                ▼]  │ │
│  │ 📄 Exhibit C - Legal       [Legal Terms           ▼]  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Each document gets a type classification (auto-detected     │
│  from filename where possible, user confirms)                │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Auto-detect document type from filename patterns (e.g., "Exhibit F" + "Security" → `security_requirements`)
- User confirms/overrides each classification
- Documents saved to Neon `engagement_documents` + ZB FileService

### Step 3: Requirements Definition

**Purpose:** The core step — buyer defines typed tasks and their subtasks (individual requirements).

**This is where the Exhibit F breakdown happens.**

**UI — Two-panel layout:**

```
┌──────────────────────────────────┬──────────────────────────────────┐
│ Task Types                        │ Requirements for: SECURITY       │
│                                   │                                  │
│ ┌──────────────────────────────┐ │ ┌──────────────────────────────┐ │
│ │ ● SECURITY (14 reqs)         │ │ │ + Add Requirement             │ │
│ │   Admin/Mgmt Safeguards      │ │ │                               │ │
│ │   Tech/Operational           │ │ │ ☐ Workforce Confidentiality   │ │
│ │ ○ COMPLIANCE (12 reqs)       │ │ │   Statement                   │ │
│ │ ○ LEGAL (7 reqs)             │ │ │   Ref: CDPH ISO Policy        │ │
│ │ ○ FUNCTIONAL (15 reqs)       │ │ │                               │ │
│ │ ○ FINANCIAL (0 reqs)         │ │ │ ☐ Access Authorization &      │ │
│ │                               │ │ │   Maintenance                 │ │
│ │ [ + Add Task Type ]           │ │ │   Ref: SAM, semi-annual       │ │
│ └──────────────────────────────┘ │ │   review                       │ │
│                                   │ │                               │ │
│                                   │ │ ☐ Information System Activity  │ │
│                                   │ │   Review                       │ │
│                                   │ │   Ref: 6-year log retention    │ │
│                                   │ │                               │ │
│                                   │ │ ... (scrollable list)          │ │
│                                   │ └──────────────────────────────┘ │
└──────────────────────────────────┴──────────────────────────────────┘
```

**Left panel — Task types:**
- Pre-populated from document type classifications (Step 2)
- Each task type maps to a **global ZB tag** (SECURITY, COMPLIANCE, LEGAL, FUNCTIONAL, FINANCIAL)
- User can add/remove task types
- Shows requirement count per type

**Right panel — Requirements (subtasks):**
- Individual requirements within the selected task type
- Each requirement becomes a ZB SubTask under that typed Task
- Fields per requirement:
  - **Title** (required) — short name
  - **Description** (optional) — detailed requirement text
  - **Standard reference** (optional) — NIST SP800-53, OWASP ASVS, HIPAA, etc.
  - **Evidence type** (select) — Document, Certification, Attestation, Demo, N/A
  - **Priority** — Critical / High / Normal / Low
- Drag-to-reorder within a task type
- Bulk import from document (future: AI-assisted parsing)

**Interaction with uploaded documents:**
- "Import from document" button opens a document viewer
- User highlights sections → creates requirements from selections
- Future: AI agent parses document and suggests task/subtask structure

### Step 4: Terms & Conditions

**Purpose:** Define business terms for the RFP.

**Fields:**
- **Budget details** — Refine from Step 1; can set per-task-type budgets
- **Timeline** — Overall and per-task deadlines
- **Evaluation criteria** — How proposals will be scored (weighted categories matching task types)
- **Response deadline** — When vendors must respond by
- **Questions deadline** — When vendors can ask clarifying questions
- **Confidentiality** — NDA requirements, data handling expectations

### Step 5: Review & Publish

**Purpose:** Summary view before publishing.

**Shows:**
- RFP title + description
- Document list with types
- Task tree (all typed tasks + subtask counts)
- Budget and timeline summary
- Evaluation criteria weights

**Actions:**
- **Save as Draft** — keeps `status: 'draft'`
- **Publish RFP** — sets `status: 'open'`, creates all ZB platform resources:
  1. Create master ZB Task (engagement task)
  2. Create child tasks per task type (with global type tags)
  3. Create subtasks per requirement (under typed parent tasks)
  4. Apply hierarchical tags (ENG-xxx on all)
  5. Attach documents to master task
  6. WorkRequest status → `open`

---

## Data Flow: Wizard → ZB Platform

```
Wizard Step 5 "Publish" triggers:

1. Generate ENG-xxx tag → createTag('ENG-{word}-{word}')
2. Create master ZB Task:
   - name: RFP title
   - description: RFP description
   - activity: default
   - tags: [ENG-xxx tag]
3. For each task type (SECURITY, COMPLIANCE, LEGAL, FUNCTIONAL, FINANCIAL):
   a. Create child ZB Task:
      - name: task type name (e.g., "Security Requirements")
      - link: child_of master task
      - tags: [ENG-xxx, SECURITY (global tag)]
   b. For each requirement in that type:
      - Create subtask ZB Task:
        - name: requirement title
        - description: requirement description
        - link: child_of parent typed task
        - tags: inherited via fromLinkInherit
        - priority: mapped (Critical→1000, High→500, Normal→200, Low→100)
4. Attach all documents to master task
5. Update work_requests:
   - zerobias_task_id = master task ID
   - zerobias_tag_id = ENG-xxx tag ID
   - engagement_tag = ENG-xxx tag name
   - status = 'open'
```

---

## Component Structure

### Wizard Container

**File:** `src/app/pages/engagements/rfp-wizard/rfp-wizard.component.ts`

```typescript
@Component({
  standalone: true,
  imports: [MatStepperModule, ...stepComponents],
  template: `
    <mat-stepper [linear]="true" #stepper>
      <mat-step [stepControl]="basicsForm">
        <ng-template matStepLabel>Basics</ng-template>
        <app-rfp-step-basics [form]="basicsForm" />
      </mat-step>
      <mat-step>
        <ng-template matStepLabel>Documents</ng-template>
        <app-rfp-step-documents [engagementId]="draftId()" />
      </mat-step>
      <mat-step>
        <ng-template matStepLabel>Requirements</ng-template>
        <app-rfp-step-requirements [documents]="documents()" [taskTypes]="taskTypes()" />
      </mat-step>
      <mat-step [stepControl]="termsForm">
        <ng-template matStepLabel>Terms</ng-template>
        <app-rfp-step-terms [form]="termsForm" />
      </mat-step>
      <mat-step>
        <ng-template matStepLabel>Review</ng-template>
        <app-rfp-step-review [rfpData]="rfpData()" (publish)="onPublish()" />
      </mat-step>
    </mat-stepper>
  `
})
```

### Step Components

| Component | File | Purpose |
|-----------|------|---------|
| `RfpStepBasicsComponent` | `rfp-wizard/steps/rfp-step-basics.component.ts` | Title, description, category, budget, timeline |
| `RfpStepDocumentsComponent` | `rfp-wizard/steps/rfp-step-documents.component.ts` | Document upload + type classification |
| `RfpStepRequirementsComponent` | `rfp-wizard/steps/rfp-step-requirements.component.ts` | Two-panel task type + requirements editor |
| `RfpStepTermsComponent` | `rfp-wizard/steps/rfp-step-terms.component.ts` | Budget details, timeline, eval criteria |
| `RfpStepReviewComponent` | `rfp-wizard/steps/rfp-step-review.component.ts` | Summary + publish action |

### Supporting Components

| Component | File | Purpose |
|-----------|------|---------|
| `RequirementEditorComponent` | `shared/components/requirement-editor/` | Single requirement edit card (title, description, ref, evidence type, priority) |
| `TaskTypeListComponent` | `shared/components/task-type-list/` | Left panel: typed task categories with counts |

---

## RFP Service

**File:** `src/app/core/services/rfp.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class RfpService {
  // Create draft RFP (Step 1 save)
  async createDraft(data: RfpBasics): Promise<WorkRequest>;

  // Update draft (any step save)
  async updateDraft(rfpId: string, data: Partial<RfpData>): Promise<void>;

  // Load draft for resuming wizard
  async loadDraft(rfpId: string): Promise<RfpData>;

  // Publish RFP (Step 5)
  // Creates all ZB Tasks, tags, attachments; sets status to 'open'
  async publishRfp(rfpId: string, data: RfpData): Promise<PublishResult>;

  // Unpublish (revert to draft)
  async unpublishRfp(rfpId: string): Promise<void>;
}
```

---

## Requirement Model

```typescript
export interface RfpRequirement {
  id: string;                    // Local ID (UUID, generated client-side)
  taskType: DocumentType;        // SECURITY, COMPLIANCE, LEGAL, FUNCTIONAL, FINANCIAL
  title: string;
  description?: string;
  standardReference?: string;    // e.g., "NIST SP800-53 AC-2"
  evidenceType: EvidenceType;    // 'document' | 'certification' | 'attestation' | 'demo' | 'na'
  priority: number;              // 1000, 500, 200, 100
  sortOrder: number;
  sourceDocumentId?: string;     // Links back to uploaded document
}

export interface RfpTaskGroup {
  taskType: DocumentType;
  taskTypeTagId: string;         // Global ZB tag ID for this type
  taskTypeTagName: string;       // e.g., 'SECURITY'
  displayName: string;           // e.g., 'Security Requirements'
  requirements: RfpRequirement[];
}

export interface RfpData {
  // Step 1
  title: string;
  description: string;
  category: string;
  budgetType: BudgetType;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;

  // Step 2
  documents: EngagementDocument[];

  // Step 3
  taskGroups: RfpTaskGroup[];

  // Step 4
  responseDeadline?: string;
  questionsDeadline?: string;
  evaluationCriteria?: EvaluationCriterion[];
  confidentialityRequirements?: string;
}
```

---

## Draft Persistence

RFP wizard state needs to survive page refreshes and resumption:

**Strategy:** Save to Neon on each step completion.

```sql
-- Add columns to work_requests (or new table)
ALTER TABLE work_requests ADD COLUMN rfp_wizard_data JSONB;
ALTER TABLE work_requests ADD COLUMN rfp_wizard_step INTEGER DEFAULT 0;
```

- `rfp_wizard_data` stores the full `RfpData` JSON
- `rfp_wizard_step` tracks the last completed step
- On wizard open, check for existing draft → resume at last step
- On publish, clear `rfp_wizard_data` (no longer needed)

---

## Global Task-Type Tags

Clark will create these as global ZB platform tags (one-time setup):

| Tag Name | Tag Type | Description |
|----------|----------|-------------|
| `SECURITY` | `service-segment` | Security requirements (Exhibit F-type) |
| `COMPLIANCE` | `service-segment` | Compliance/regulatory requirements |
| `LEGAL` | `service-segment` | Legal/contractual requirements |
| `FUNCTIONAL` | `service-segment` | Functional/technical specifications |
| `FINANCIAL` | `service-segment` | Budget/financial requirements |

These are **global** tags — shared across all engagements. Individual requirement subtasks inherit them from their parent typed task via `child_of` + `fromLinkInherit`.

---

## Routing

```typescript
// In engagement routes
{ path: 'rfp/new', component: RfpWizardComponent },
{ path: 'rfp/:id/edit', component: RfpWizardComponent },  // Resume draft
```

Entry point: "Create RFP" button on the engagements list page.

---

## RFP Import & Ingestion Pipeline

Buyers often have existing RFP documents (Word, PDF) from legacy procurement processes. Rather than requiring manual re-entry, SME Mart provides a **three-tier maturity model** for importing existing RFPs into the wizard's task/requirement structure.

### Shared Contract: `SmeMartRfpImport` JSON Schema

All three tiers produce the same JSON format. This schema is the **single source of truth** — wizard Step 3 can hydrate from it regardless of how it was generated.

```typescript
/**
 * JSON schema for importing RFP requirements into SME Mart.
 * Generated by: LLM prompt (Tier 1), in-app parser (Tier 2), or ZB MCP task (Tier 3).
 * Consumed by: RFP Wizard Step 3 "Import from JSON" button.
 */
export interface SmeMartRfpImport {
  /** Schema version for forward compatibility */
  schemaVersion: '1.0';

  /** Optional metadata about the source document */
  source?: {
    filename?: string;
    documentType?: string;        // e.g., "Exhibit F", "SOW", "RFP"
    organization?: string;
    dateExtracted?: string;       // ISO 8601
    parserTier?: 'llm-prompt' | 'in-app' | 'mcp-task';
  };

  /** Optional pre-fill for wizard Step 1 (Basics) */
  basics?: {
    title?: string;
    description?: string;
    category?: string;
    budgetType?: 'fixed' | 'hourly' | 'retainer' | 'not_specified';
    budgetMin?: number;
    budgetMax?: number;
    timeline?: string;
  };

  /** Core payload: typed task groups with requirements (maps to Step 3) */
  taskGroups: SmeMartRfpTaskGroupImport[];
}

export interface SmeMartRfpTaskGroupImport {
  /** Must match a global ZB tag: SECURITY, COMPLIANCE, LEGAL, FUNCTIONAL, FINANCIAL */
  taskType: 'SECURITY' | 'COMPLIANCE' | 'LEGAL' | 'FUNCTIONAL' | 'FINANCIAL';

  /** Human-readable group name */
  displayName: string;

  /** Individual requirements (become subtasks) */
  requirements: SmeMartRfpRequirementImport[];
}

export interface SmeMartRfpRequirementImport {
  title: string;
  description?: string;
  standardReference?: string;    // e.g., "NIST SP800-53 AC-2", "HIPAA §164.312"
  evidenceType?: 'document' | 'certification' | 'attestation' | 'demo' | 'na';
  priority?: 'critical' | 'high' | 'normal' | 'low';
}
```

### JSON Schema (for LLM + validation)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SmeMartRfpImport",
  "type": "object",
  "required": ["schemaVersion", "taskGroups"],
  "properties": {
    "schemaVersion": { "const": "1.0" },
    "source": {
      "type": "object",
      "properties": {
        "filename": { "type": "string" },
        "documentType": { "type": "string" },
        "organization": { "type": "string" },
        "dateExtracted": { "type": "string", "format": "date-time" },
        "parserTier": { "enum": ["llm-prompt", "in-app", "mcp-task"] }
      }
    },
    "basics": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "description": { "type": "string" },
        "category": { "type": "string" },
        "budgetType": { "enum": ["fixed", "hourly", "retainer", "not_specified"] },
        "budgetMin": { "type": "number" },
        "budgetMax": { "type": "number" },
        "timeline": { "type": "string" }
      }
    },
    "taskGroups": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["taskType", "displayName", "requirements"],
        "properties": {
          "taskType": { "enum": ["SECURITY", "COMPLIANCE", "LEGAL", "FUNCTIONAL", "FINANCIAL"] },
          "displayName": { "type": "string" },
          "requirements": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["title"],
              "properties": {
                "title": { "type": "string", "maxLength": 200 },
                "description": { "type": "string" },
                "standardReference": { "type": "string" },
                "evidenceType": { "enum": ["document", "certification", "attestation", "demo", "na"] },
                "priority": { "enum": ["critical", "high", "normal", "low"] }
              }
            }
          }
        }
      }
    }
  }
}
```

---

### Tier 1: LLM Prompt + JSON Export (v1 — Ship Immediately)

**How it works:** Buyer feeds their RFP document to any LLM (ChatGPT, Claude, Gemini) along with our system prompt. The LLM outputs a conformant JSON file. Buyer downloads the JSON, then uses "Import from JSON" in the wizard.

**Artifacts to ship:**
1. **System prompt template** — downloadable from SME Mart UI ("Need help? Export your RFP to JSON" link)
2. **`SmeMartRfpImport` JSON Schema** — for LLM structured output / validation
3. **"Import from JSON" button** on wizard Step 3

#### LLM System Prompt Template

```markdown
You are an RFP parser for SME Mart, a marketplace for Subject Matter Experts.

Your job: Read the attached procurement document and extract ALL requirements into a
structured JSON format. Classify each requirement into exactly one of these task types:

- **SECURITY** — Information security, access controls, encryption, incident response,
  penetration testing, vulnerability management, security policies
- **COMPLIANCE** — Regulatory requirements (HIPAA, SOC2, FedRAMP, CMMC), certifications,
  audit requirements, reporting obligations
- **LEGAL** — Contractual terms, NDAs, liability, insurance, indemnification, IP rights,
  data ownership, termination clauses
- **FUNCTIONAL** — Technical requirements, system capabilities, integrations, performance
  benchmarks, SLAs, architecture constraints
- **FINANCIAL** — Budget, pricing structure, payment terms, cost proposals, invoicing
  requirements, penalties

Rules:
1. Every requirement must have a `title` (concise, <200 chars) and ideally a `description`
   (full requirement text from the document).
2. If the document references a standard (NIST, ISO, HIPAA section, etc.), include it
   in `standardReference`.
3. Set `priority` based on document language: "shall"/"must" → "critical" or "high",
   "should" → "normal", "may" → "low".
4. Set `evidenceType` based on what the requirement asks for:
   - Policies, procedures, plans → "document"
   - SOC2, ISO 27001, FedRAMP → "certification"
   - Signed statements, officer attestations → "attestation"
   - Live demos, PoC → "demo"
   - Not specified → "na"
5. If the document has a title, org name, or budget info, include it in `source` and
   `basics`.
6. Output ONLY valid JSON matching the schema below. No markdown, no explanation.

Output JSON Schema:
{schemaVersion: "1.0", source: {...}, basics: {...}, taskGroups: [...]}

(See full schema at: https://smemart.w3geekery.com/docs/rfp-import-schema.json)
```

#### UI Integration (Wizard Step 3)

```
┌──────────────────────────────────────────────────────────────────┐
│ Requirements                                                      │
│                                                                    │
│ [ + Add Requirement ]  [ ↑ Import from JSON ]  [ ? Help ]        │
│                                                                    │
│ ┌──────────────────┬───────────────────────────────────────────┐ │
│ │ Task Types       │ Requirements for: SECURITY                │ │
│ │                  │ ...                                        │ │
```

**"Import from JSON" flow:**
1. User clicks "Import from JSON" → file picker opens (accept `.json`)
2. Read file → validate against `SmeMartRfpImport` JSON Schema
3. If invalid → show validation errors with line numbers
4. If valid → preview dialog:
   - Shows task group summary (type + requirement count per group)
   - "Merge" (add to existing) vs "Replace" (clear and import) toggle
   - User confirms → hydrate `taskGroups` in wizard state
5. Each imported requirement gets `sourceDocumentId: undefined` (no file link; buyer parsed externally)

**"Help" link:** Opens a panel explaining the 3-tier import options with the downloadable prompt template.

---

### Tier 2: In-App Parsing via Claude API (v2)

**How it works:** Buyer uploads their RFP document (via Plan 031 Document Upload), clicks "Parse with AI" on Step 3. App sends document text to Claude API with the same system prompt. Response is validated and previewed.

**Requires:**
- Claude API key (server-side via Vercel Edge function or ZB proxy)
- Document text extraction (PDF → text via `pdf.js`, DOCX → text via `mammoth.js`)
- Same JSON Schema validation as Tier 1
- "AI Suggested" badge on imported requirements for review
- Cost estimation display before parsing (token count × rate)

**Deferred — depends on:** API proxy setup, cost model, rate limiting

---

### Tier 3: ZB MCP Server Task (v3)

**How it works:** Buyer uploads document → SME Mart creates a ZB Task assigned to an AI agent. The agent (running as a ZB MCP server) parses the document, produces the `SmeMartRfpImport` JSON, and attaches it to the task. Buyer gets notified when parsing is complete. Wizard auto-imports the result.

**Requires:**
- ZB MCP server infrastructure (Kevin)
- Agent task type in ZB platform
- Webhook/polling for task completion
- Full audit trail (agent parsed → buyer reviewed → buyer published)

**Deferred — depends on:** ZB platform agentic capabilities

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| ZB-3 (Custom Task Activities) not shipped | Use global tags for task typing in interim; custom fields store in description or Neon metadata |
| Task creation is slow for 45+ subtasks | Batch create with Promise.all (ZB API supports concurrent requests) |
| Wizard state lost on browser crash | Auto-save on each step + localStorage backup |
| Large RFPs overwhelm task tree UI | Implement virtual scrolling, collapse-by-default, search/filter |
| LLM produces invalid JSON (Tier 1) | Validate against JSON Schema client-side; show specific errors with fix suggestions |
| LLM misclassifies requirements into wrong task type | Preview dialog lets buyer drag requirements between groups before confirming import |
| Imported JSON has duplicate requirements | Merge mode detects duplicates by title similarity; flags for user review |

---

## Testing Strategy

- **Unit:** RfpService publish logic (mock ZB Task API calls)
- **Unit:** Each wizard step component in isolation
- **Unit:** RfpImportService — validate valid/invalid JSON, merge vs replace logic, duplicate detection
- **Unit:** JSON Schema validation — test with Exhibit F sample, malformed JSON, missing required fields
- **Integration:** Full wizard flow: create draft → upload doc → add requirements → publish → verify ZB tasks created
- **Integration:** Import flow: load JSON file → validate → preview → merge into wizard state → verify taskGroups populated
- **E2E:** Buyer creates RFP → verify it appears in RFP list → verify task tree is correct
- **E2E:** Buyer imports JSON → reviews preview → publishes → verify all subtasks created with correct types

---

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `src/app/core/models/rfp.model.ts` — includes `RfpData`, `RfpRequirement`, `RfpTaskGroup` |
| Create | `src/app/core/models/rfp-import.model.ts` — `SmeMartRfpImport` schema + validation |
| Create | `src/app/core/services/rfp.service.ts` |
| Create | `src/app/core/services/rfp-import.service.ts` — JSON validation, merge/replace logic |
| Create | `src/app/pages/engagements/rfp-wizard/rfp-wizard.component.ts` |
| Create | `src/app/pages/engagements/rfp-wizard/rfp-wizard.component.html` |
| Create | `src/app/pages/engagements/rfp-wizard/rfp-wizard.component.scss` |
| Create | `src/app/pages/engagements/rfp-wizard/steps/rfp-step-basics.component.ts` |
| Create | `src/app/pages/engagements/rfp-wizard/steps/rfp-step-documents.component.ts` |
| Create | `src/app/pages/engagements/rfp-wizard/steps/rfp-step-requirements.component.ts` |
| Create | `src/app/pages/engagements/rfp-wizard/steps/rfp-step-terms.component.ts` |
| Create | `src/app/pages/engagements/rfp-wizard/steps/rfp-step-review.component.ts` |
| Create | `src/app/shared/components/requirement-editor/requirement-editor.component.ts` |
| Create | `src/app/shared/components/task-type-list/task-type-list.component.ts` |
| Create | `src/app/shared/components/rfp-import-dialog/rfp-import-dialog.component.ts` — preview + merge/replace |
| Create | `public/docs/rfp-import-schema.json` — downloadable JSON Schema |
| Create | `public/docs/rfp-import-schema.json` — JSON Schema for validation |
| Create | `public/docs/rfp-import-prompt.md` — LLM prompt template (standard, no MCP) |
| Create | `public/docs/rfp-import-prompt-mcp.md` — LLM prompt template (ZB MCP variant) |
| Modify | `src/app/pages/engagements/engagements.routes.ts` — add RFP wizard routes |
| SQL    | Add `rfp_wizard_data` + `rfp_wizard_step` columns to `work_requests` |

---

## Implementation Tracker

> **Note:** Plan uses `pages/rfps/rfp-wizard/` (not `pages/engagements/`) to match existing route structure (`/rfps`).

### Phase 1 — Scaffold + Steps 1-2 (completed 2026-03-06)

- [x] **1. Create RFP model types** — `src/app/core/models/rfp.model.ts` with RfpRequirement, RfpTaskGroup, RfpData, EvaluationCriterion, EvidenceType, SmeMartRfpImport interfaces. Export from `models/index.ts`.
- [x] **2. Add wizard columns to Neon DB** — `rfp_wizard_data JSONB` + `rfp_wizard_step INTEGER DEFAULT 0` on `work_requests` table via Neon MCP.
- [x] **3. Create RfpWizardService** — `src/app/core/services/rfp-wizard.service.ts`. Wizard state as signals. Methods: createDraft, updateDraft, loadDraft, publishRfp. Saves RfpData JSON to `work_requests.rfp_wizard_data`.
- [x] **4. Create RfpWizard container** — `src/app/pages/rfps/rfp-wizard/rfp-wizard.component.ts` (+html+scss). MatStepper, 5 steps, route param for draft resume, linear mode.
- [x] **5. Create Step 1: Basics** — `rfp-wizard/steps/rfp-step-basics.component.ts`. Reuses EngagementForm. Emits values to parent. stepControl wired to form validity.
- [x] **6. Create Step 2: Documents** — `rfp-wizard/steps/rfp-step-documents.component.ts`. Reuses DocumentUploadComponent + DocumentListComponent. DocumentListComponent loads its own docs by engagementId (no `[documents]` input).
- [x] **7. Create Step 3 stub: Requirements** — Placeholder with two-panel layout wireframe. Full build in Phase 2.
- [x] **8. Create Step 4 stub: Terms** — Basic reactive form: response deadline, questions deadline, confidentiality. Evaluation criteria deferred to Phase 2.
- [x] **9. Create Step 5 stub: Review & Publish** — Summary view + Save as Draft / Publish buttons. Linter auto-added TitleCasePipe import.
- [x] **10. Add wizard routes** — `rfps/new` + `rfps/:id/edit` in `app.routes.ts`. "Create RFP" button + "Quick Post" on RFP list.
- [x] **11. Build & smoke test** — `ng build` passes. Fixed: DocumentType import (was in document.model, not enums), removed invalid `[documents]` binding on DocumentListComponent.

### Phase 2 — Requirements + Publish

- [x] **12. Build TaskTypeList component** — Left panel with mat-nav-list, add-via-menu, badge counts, 6 task types.
- [x] **13. Build RequirementEditor component** — Expansion panel per requirement: title, description, standard ref, evidence type, priority.
- [x] **14. Full Step 3: Requirements** — Two-panel grid layout with TaskTypeList + RequirementEditor list. Import JSON button.
- [x] **15. JSON Import dialog** — Paste or file upload, schema validation, preview with group/count summary, merge into existing groups.
- [x] **16. Full Step 4: Terms** — Dates, confidentiality, evaluation criteria FormArray with name/weight/description + weight total validation.
- [x] **17. Full Step 5: Review & Publish** — Requirements tree with priority chips, evaluation criteria summary, document list.
- [x] **18. RFP tag + publish flow** — `sme-mart.rfp.word-word` tag (not eng — RFP isn't an engagement until bid accepted). Editable BIP39 identifier in Step 1. Publish creates tag + sets status to open. Same word-word carries over to `sme-mart.eng.word-word` on bid acceptance.

### Phase 3 — Polish + Import (future)

- [x] **19. LLM prompt template** — `public/docs/rfp-import-schema.json` (JSON Schema), `rfp-import-prompt.md` (standard), `rfp-import-prompt-mcp.md` (ZB MCP variant).
- [x] **20. Method chooser + AI instructions** — Pre-wizard screen: "Import with AI" vs "Create Manually". AI path shows download links for prompt templates + JSON schema, step-by-step instructions, ZB MCP setup stub. Component: `rfp-method-chooser.component.ts`.
- [x] **21. Integration test** — `rfp-wizard.service.spec.ts` (16 tests): reset, saveBasics (new/existing), loadDraft (hydrate/missing/empty), requirements, terms, publish (tag creation + status update, error handling), full lifecycle flow, document upload tracking.
