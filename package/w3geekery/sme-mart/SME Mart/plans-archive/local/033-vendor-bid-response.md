# Plan 033: Vendor Bid Response Flow (SM-19)

**Status:** In Progress (Phase 4 complete)
**Priority:** High (supply-side counterpart to demand-side RFP)
**Depends on:** [032-rfp-creation-wizard.md](./032-rfp-creation-wizard.md) (RFP structure), [031-document-upload-to-project.md](./031-document-upload-to-project.md) (document upload)
**Source:** Brian's directive 2026-03-05 — "The supply side will have their side of this later"
**Updated:** 2026-03-10
**Session:** `claude --resume poc/sme-mart`

---

## Phase Summary

| Phase | Scope | Status | DB Changes |
|-------|-------|--------|------------|
| **1** | Extended bid model + enhanced bid form | **Complete** | ALTER TABLE bids |
| **2** | `bid_responses` table + per-requirement response UI | **Complete** | CREATE TABLE |
| **3** | Compliance progress indicators + bid summary rollups | **Complete** | CREATE VIEW |
| **4** | Buyer-side bid comparison + per-requirement review | **Complete** | None |
| **5** | LLM-assisted bid generation | Not Started | ALTER TABLE bids |

---

## What Already Exists

- `Bid` model (`bid.model.ts`) — id, request_id, provider_id, cover_letter, proposed_price, proposed_timeline, status
- `BidsService` (`bids.service.ts`) — CRUD via SmeMartDbService, status transitions
- `BidCardComponent` — displays bid with provider info, status chip, accept/reject/withdraw actions
- `BidFormComponent` — dialog with cover_letter, proposed_price, proposed_timeline fields
- RFP detail page — shows bid list, buyer/vendor role-based actions
- RFP Wizard (Plan 032) — creates structured requirements (task groups + subtasks)

---

## Phase 1: Extended Bid Model + Enhanced Bid Form

**Goal:** Upgrade the flat 3-field bid form into a meaningful vendor response with approach narrative, team description, and pricing breakdown. No per-requirement responses yet — that's Phase 2.

### DB Changes (Neon)

```sql
ALTER TABLE bids ADD COLUMN executive_summary TEXT;
ALTER TABLE bids ADD COLUMN team_description TEXT;
ALTER TABLE bids ADD COLUMN total_estimated_hours DECIMAL(10,2);
ALTER TABLE bids ADD COLUMN pricing_breakdown JSONB;  -- TaskTypePricing[]
ALTER TABLE bids ADD COLUMN wizard_data JSONB;        -- Draft state persistence
ALTER TABLE bids ADD COLUMN wizard_step INTEGER DEFAULT 0;
```

### Model Changes

```typescript
// bid.model.ts — add to existing Bid interface
export interface Bid {
  // ... existing fields ...
  executive_summary?: string;
  team_description?: string;
  total_estimated_hours?: number;
  pricing_breakdown?: TaskTypePricing[];
  wizard_data?: Record<string, unknown>;
  wizard_step?: number;
}

export interface TaskTypePricing {
  taskType: string;          // SECURITY, COMPLIANCE, LEGAL, FUNCTIONAL, FINANCIAL, EVALUATION
  estimatedHours: number;
  estimatedCost: number;
  notes?: string;
}
```

### Component Changes

Replace the simple `BidFormComponent` dialog with a multi-step `BidWizardComponent`:

**Step 1 — Approach** (executive_summary + cover_letter)
- Markdown editor for executive summary (reuse Milkdown Crepe)
- How vendor plans to address the RFP requirements at a high level

**Step 2 — Team & Qualifications** (team_description)
- Who will work on this project
- Relevant experience and certifications

**Step 3 — Pricing & Timeline** (proposed_price, proposed_timeline, pricing_breakdown, total_estimated_hours)
- Overall price and timeline (existing fields)
- Optional per-category breakdown table (SECURITY, COMPLIANCE, etc.)
- Auto-sum estimated hours

**Step 4 — Review & Submit**
- Read-only summary of all fields
- Save Draft / Submit Bid actions

### Routing

```typescript
// New route for bid wizard (alongside existing RFP routes)
{ path: 'rfps/:id/bid', component: BidWizardComponent },
{ path: 'rfps/:id/bid/:bidId', component: BidWizardComponent },  // Resume draft
```

### Files

| Action | File | Status |
|--------|------|--------|
| Modify | `src/app/core/models/bid.model.ts` — add extended fields | [x] |
| Create | `src/app/pages/rfps/bid-wizard/bid-wizard.component.ts` (+html, +scss) | [x] |
| Modify | `src/app/core/services/bids.service.ts` — handle new fields in CRUD | [x] |
| Modify | `src/app/pages/rfps/rfp-detail.component.ts` — "Start Bid" navigates to wizard | [x] |
| Modify | `src/app/pages/rfps/rfp-detail.component.html` — update bid action button | [x] |
| Modify | `src/app/shared/components/bid-card/bid-card.component.*` — show extended fields | [x] |
| Modify | `src/app/app.routes.ts` — add bid wizard routes | [x] |
| SQL    | ALTER TABLE bids — add 6 new columns | [x] |

### Acceptance Criteria

- [x] Vendor can start a bid from RFP detail → navigates to `/rfps/:id/bid`
- [x] 4-step wizard with approach, team, pricing, review steps
- [x] Draft auto-saves to `wizard_data` JSONB column
- [x] Resume draft via `/rfps/:id/bid/:bidId`
- [x] Submit sets status='pending', clears wizard_data
- [x] Bid card displays extended fields (executive summary, team, breakdown)
- [x] Existing simple bids (cover_letter only) still render correctly

---

## Phase 2: Per-Requirement Structured Responses

**Goal:** Vendors respond to each buyer requirement with compliance status, narrative, estimated hours/cost, and evidence links. This is the core differentiator — bids are structured, not flat.

### DB Changes (Neon)

```sql
CREATE TABLE bid_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES bids(id),
  requirement_task_id UUID NOT NULL,  -- ZB subtask ID (buyer's requirement)

  compliance_status VARCHAR(50) NOT NULL DEFAULT 'not_met',
  response_text TEXT,
  estimated_hours DECIMAL(10,2),
  estimated_cost DECIMAL(12,2),

  certification_ref TEXT,
  ready_date DATE,

  responded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(bid_id, requirement_task_id)
);

CREATE INDEX idx_bid_responses_bid ON bid_responses(bid_id);
CREATE INDEX idx_bid_responses_task ON bid_responses(requirement_task_id);

CREATE TABLE bid_response_evidence (
  response_id UUID NOT NULL REFERENCES bid_responses(id),
  document_id UUID NOT NULL REFERENCES engagement_documents(id),
  PRIMARY KEY (response_id, document_id)
);
```

### Model

```typescript
// bid-response.model.ts
export interface BidResponse {
  id: string;
  bid_id: string;
  requirement_task_id: string;

  compliance_status: ComplianceStatus;
  response_text?: string;
  estimated_hours?: number;
  estimated_cost?: number;

  certification_ref?: string;
  ready_date?: string;

  responded_at?: string;
  updated_at?: string;
}

export type ComplianceStatus = 'met' | 'partially_met' | 'not_met' | 'not_applicable' | 'planned';

export interface ComplianceSummary {
  met: number;
  partially_met: number;
  not_met: number;
  not_applicable: number;
  planned: number;
  total: number;
}
```

### UI — Two-Panel Layout

Same pattern as RFP wizard Step 3 (requirements editor):

**Left panel:** Task type categories with progress indicators
- Per-type: "SECURITY (13/14 responded)"
- Color-coded progress bars

**Right panel:** Requirements for selected type
- Each requirement: buyer's text + expandable vendor response form
- Quick mode: compliance status dropdown only
- Full mode: status + narrative + hours + cost + evidence

### New Step in Bid Wizard

Insert between current Step 2 (Team) and Step 3 (Pricing):
- **Step 3 — Requirements Response** (two-panel layout)
- Step 4 becomes Pricing (auto-populated from response totals)
- Step 5 becomes Review & Submit

### Files

| Action | File | Status |
|--------|------|--------|
| Create | `src/app/core/models/bid-response.model.ts` | [x] |
| Create | `src/app/core/services/bid-response.service.ts` | [x] |
| Create | `src/app/shared/components/requirement-response/` (3 files) | [x] |
| ~~Create~~ | ~~`src/app/shared/components/requirement-tree/`~~ (not needed — category list built into requirement-response) | N/A |
| Modify | Bid wizard — insert requirements step (now 5-step) | [x] |
| Modify | Bid wizard — auto-populate pricing from requirement estimates | [x] |
| SQL    | CREATE TABLE bid_responses (bid_response_evidence deferred) | [x] |

### Acceptance Criteria

- [x] Vendor sees buyer's requirements tree grouped by task type
- [x] Per-requirement: compliance status (dropdown), response text, hours, cost
- [x] Progress tracked per task type (X/Y responded)
- [x] Responses saved as individual `bid_responses` rows
- [x] Pricing step auto-sums from requirement responses
- [x] Partial save supported (not all requirements need responses to save draft)

---

## Phase 3: Compliance Progress + Bid Summary View

**Goal:** Visual compliance indicators and a summary view that aggregates requirement responses into a buyer-readable dashboard.

### DB Changes (Neon)

```sql
CREATE OR REPLACE VIEW v_bid_summary AS
SELECT
  b.*,
  wr.title AS rfp_title,
  wr.category,
  wr.budget_type,
  wr.budget_min,
  wr.budget_max,
  (SELECT COUNT(*) FROM bid_responses br WHERE br.bid_id = b.id) AS total_responses,
  (SELECT COUNT(*) FROM bid_responses br WHERE br.bid_id = b.id AND br.compliance_status = 'met') AS met_count,
  (SELECT COUNT(*) FROM bid_responses br WHERE br.bid_id = b.id AND br.compliance_status = 'partially_met') AS partial_count,
  (SELECT COUNT(*) FROM bid_responses br WHERE br.bid_id = b.id AND br.compliance_status = 'not_met') AS not_met_count,
  (SELECT COUNT(*) FROM bid_responses br WHERE br.bid_id = b.id AND br.compliance_status = 'not_applicable') AS na_count,
  (SELECT COUNT(*) FROM bid_responses br WHERE br.bid_id = b.id AND br.compliance_status = 'planned') AS planned_count,
  (SELECT COALESCE(SUM(br.estimated_hours), 0) FROM bid_responses br WHERE br.bid_id = b.id) AS sum_estimated_hours,
  (SELECT COALESCE(SUM(br.estimated_cost), 0) FROM bid_responses br WHERE br.bid_id = b.id) AS sum_estimated_cost
FROM bids b
JOIN work_requests wr ON wr.id = b.request_id;
```

### Components

| Action | File | Status |
|--------|------|--------|
| ~~Create~~ | ~~`src/app/shared/components/compliance-status-badge/`~~ (colors handled inline by compliance-progress) | N/A |
| Create | `src/app/shared/components/compliance-progress/` (3 files) | [x] |
| Create | `src/app/shared/components/bid-summary/` (3 files) | [x] |
| Modify | `src/app/shared/components/bid-card/` — add compliance summary bar | [x] |
| Modify | `src/app/pages/rfps/rfp-detail.component.ts` — load bid summaries from view | [x] |
| Modify | `src/app/core/services/bids.service.ts` — `listBidSummaries()` | [x] |
| Modify | `src/app/core/models/bid.model.ts` — `BidSummaryRow` interface | [x] |
| SQL    | CREATE VIEW v_bid_summary | [x] |

### Acceptance Criteria

- [x] Compliance status badges: color-coded (green=met, yellow=partial, red=not met, gray=N/A, blue=planned)
- [x] Progress bar component showing met/partial/not_met/N/A/planned breakdown
- [x] Bid card shows compliance summary inline (e.g., "42/45 met")
- [x] Bid summary component: executive summary, team, pricing breakdown, compliance rollup

---

## Phase 4: Buyer-Side Bid Comparison & Review

**Goal:** Buyer can compare multiple bids side-by-side and drill into per-requirement responses.

### Components

| Action | File | Status |
|--------|------|--------|
| Create | `src/app/shared/components/bid-comparison/` (3 files) | [x] |
| Create | `src/app/shared/components/bid-review/` (3 files) | [x] |
| Create | `src/app/shared/components/accept-bid-dialog/` (1 file, inline template) | [x] |
| Create | `src/app/pages/rfps/bid-comparison-page.component.ts` — container page | [x] |
| Modify | `src/app/pages/rfps/rfp-detail.component.*` — "Compare Bids" button for buyers | [x] |
| Modify | `src/app/app.routes.ts` — `rfps/:id/compare` route | [x] |
| Modify | `src/app/shared/index.ts` — barrel exports for new components | [x] |

### Bid Comparison View

```
┌────────────────────────────────────────────────────────────────────────┐
│ Bids for: CDPH IT Modernization (3 received)                          │
│                                                                        │
│           │ Vendor A        │ Vendor B        │ Vendor C               │
├───────────┼─────────────────┼─────────────────┼────────────────────────┤
│ Price     │ $125,000        │ $98,000         │ $145,000               │
│ Timeline  │ 12 weeks        │ 16 weeks        │ 10 weeks               │
│ Compliance│ 42/45 met       │ 38/45 met       │ 44/45 met              │
├───────────┼─────────────────┼─────────────────┼────────────────────────┤
│ SECURITY  │ 13/14 met       │ 11/14 met       │ 14/14 met              │
│ COMPLIANCE│ 11/12 met       │ 10/12 met       │ 12/12 met              │
│ LEGAL     │ 7/7 met         │ 7/7 met         │ 7/7 met                │
│ FUNCTIONAL│ 11/12 met       │ 10/12 met       │ 11/12 met              │
├───────────┼─────────────────┼─────────────────┼────────────────────────┤
│           │ [View] [Accept] │ [View] [Reject] │ [View] [Accept]        │
└────────────────────────────────────────────────────────────────────────┘
```

### Per-Requirement Review

- Side-by-side: Buyer's requirement <-> Vendor's response
- Compliance status badge per requirement
- Evidence links (download vendor attachments)
- Accept individual requirements or accept/reject entire bid

### Accept Bid Dialog

Confirmation dialog with:
- Bid summary (price, timeline, compliance)
- Warning: "This will reject all other bids"
- Creates engagement tag + transitions work_request to in_progress

### Acceptance Criteria

- [x] Comparison table: up to 4 bids side-by-side with price, timeline, compliance
- [x] Drill-down: click bid → per-requirement review (loads bid_responses on demand)
- [x] Accept bid dialog with confirmation + engagement creation (rejects other pending bids)
- [ ] Rejected bids show rejection status with optional reason
- **Known gap:** `v_bid_summary` VIEW lacks `provider_display_name` — comparison shows "Vendor" placeholder. Needs VIEW update to JOIN `provider_profiles`.

---

## Phase 5: LLM-Assisted Bid Generation

**Goal:** Vendors can choose an AI-assisted path that drafts bid content from their organizational profile, uploaded documents, and the RFP's structured requirements. Mirrors the AI-assisted RFP creation flow on the demand side. The vendor always reviews, edits, and approves before submission — LLM is a drafting accelerator, not an autopilot.

**Depends on:** Phase 2 (per-requirement response structure must exist for the LLM to populate)

### Context Sources (what the LLM reads)

| Source | Purpose | How accessed |
|--------|---------|-------------|
| **RFP requirements** | Task groups + subtasks from buyer's RFP wizard | Load via `EngagementTasksService` |
| **RFP documents** | Buyer-uploaded exhibits (SOW, compliance matrix, etc.) | Load via `DocumentService` — text extraction needed |
| **Vendor profile** | Display name, headline, bio, certifications, service offerings | `ProviderProfilesService` |
| **Vendor org documents** | Capability statements, SOC 2 reports, past performance | `OrgDocumentService` — text extraction needed |
| **Past bids** (stretch) | Successful bids on similar RFPs for reuse/adaptation | `BidsService.listBidsByProvider()` |

### User Flow

1. **Method chooser** at bid wizard start: "Build Manually" vs "AI-Assisted Draft"
   - Same pattern as `RfpMethodChooser` component in RFP wizard
2. **AI path — context gathering** (loading screen):
   - Load RFP requirements tree
   - Load vendor profile + org documents
   - Show "Analyzing RFP requirements and your organization's capabilities..."
3. **AI generates draft** into the existing wizard structure:
   - **Executive summary** — tailored to this specific RFP
   - **Cover letter** — highlights relevant vendor strengths vs. RFP needs
   - **Team description** — pulls from vendor profile/org docs
   - **Per-requirement compliance responses** (Phase 2 structure):
     - Compliance status (met/partially_met/planned/not_met)
     - Response narrative referencing vendor capabilities
     - Estimated hours/cost per requirement
   - **Pricing breakdown** — seeded from per-requirement estimates
4. **Vendor reviews each step** — all fields are editable, pre-filled with AI draft
   - Yellow "AI-generated" badges on pre-filled fields
   - Vendor can regenerate individual sections ("Re-draft this section")
   - Per-requirement responses can be regenerated one at a time
5. **Submit** follows normal flow — `status='pending'`, clears wizard_data

### Technical Approach

**LLM Integration Options** (decide during implementation):

| Option | Pros | Cons |
|--------|------|------|
| **A. Server-side API** (Angular → backend → LLM API) | Secure API keys, rate limiting, audit trail | Requires backend endpoint (new infra) |
| **B. ZeroBias Hub Module** (LLM as a Hub connector) | Fits platform architecture, reusable across apps | Hub Module dev overhead, ZB MCP dependency |
| **C. Client-side with proxy** (Angular → Vercel Edge → LLM API) | Quick to implement, no new backend | API key in edge function, limited to Vercel |

Recommended: **Option A** for production, **Option C** as a POC fast-path.

**Prompt Engineering:**

```
System: You are an expert government/enterprise bid writer helping a vendor
respond to a Request for Proposals (RFP).

Context:
- RFP Title: {title}
- RFP Description: {description}
- Requirements by category: {taskGroups with subtasks}
- Vendor Profile: {name, headline, bio, certifications}
- Vendor Capabilities: {extracted from org documents}

Task: Generate a structured bid response including:
1. Executive summary (2-3 paragraphs, markdown)
2. Cover letter (professional, specific to this RFP)
3. Team description (based on vendor profile)
4. Per-requirement responses (for each subtask):
   - compliance_status: met|partially_met|planned|not_met|not_applicable
   - response_text: how the vendor meets this requirement
   - estimated_hours: reasonable estimate
   - estimated_cost: based on vendor's rate card or market rates

Return as structured JSON matching the BidWizardData schema.
```

**Streaming UX:**
- Stream responses section-by-section so the vendor sees progress
- Show a progress indicator: "Drafting approach... Responding to SECURITY requirements..."
- Each section becomes editable as soon as it's generated

### DB Changes (Neon)

```sql
-- Track AI generation metadata on the bid
ALTER TABLE bids ADD COLUMN ai_assisted BOOLEAN DEFAULT false;
ALTER TABLE bids ADD COLUMN ai_model VARCHAR(100);         -- e.g., 'claude-sonnet-4-5-20250514'
ALTER TABLE bids ADD COLUMN ai_generated_at TIMESTAMPTZ;
```

### Components

| Action | File | Status |
|--------|------|--------|
| Create | `src/app/pages/rfps/bid-wizard/bid-method-chooser.component.ts` | [ ] |
| Create | `src/app/core/services/bid-ai.service.ts` — LLM orchestration | [ ] |
| Modify | `src/app/pages/rfps/bid-wizard/bid-wizard.component.*` — add method chooser + AI loading | [ ] |
| Create | `src/app/shared/components/ai-draft-badge/` (3 files) — "AI-generated" field indicator | [ ] |
| Modify | `src/app/core/models/bid.model.ts` — add ai_assisted, ai_model, ai_generated_at | [ ] |
| Modify | `src/app/core/services/bids.service.ts` — persist AI metadata | [ ] |
| SQL    | ALTER TABLE bids — add 3 AI tracking columns | [ ] |

### Acceptance Criteria

- [ ] Method chooser: vendor picks "Manual" or "AI-Assisted" at bid start
- [ ] AI path loads vendor profile + org docs + RFP requirements as LLM context
- [ ] LLM generates executive summary, cover letter, team description
- [ ] LLM generates per-requirement compliance responses (status + narrative + hours + cost)
- [ ] Pricing breakdown auto-populated from per-requirement estimates
- [ ] All AI-generated fields are editable by the vendor before submission
- [ ] "AI-generated" badges shown on pre-filled fields
- [ ] Individual sections/requirements can be re-generated on demand
- [ ] `ai_assisted=true` + model name stored on submitted bid for transparency
- [ ] Works with streaming (progressive section display)
- [ ] Graceful fallback if LLM service is unavailable (revert to manual flow)

### Per-Field Assist (Stretch)

Even in manual mode, add a "Suggest" button (sparkle icon) on individual fields:
- Executive summary: "Draft based on RFP requirements"
- Cover letter: "Draft based on vendor profile"
- Per-requirement response: "Suggest response for this requirement"
- Pricing: "Estimate based on similar engagements"

This gives vendors AI assist without committing to the full AI-drafted path.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Provider View of RFP                       │
│                                                              │
│  RFP Header (title, description, budget, timeline)           │
│  Documents tab (buyer's uploaded exhibits — read-only)        │
│                                                              │
│  Requirements Response (Phase 2):                             │
│  ┌──────────────────────┬──────────────────────────────────┐ │
│  │ SECURITY (14 reqs)    │ Req 2.3: Encryption — In Transit │ │
│  │ * COMPLIANCE (12)     │                                  │ │
│  │ o LEGAL (7)           │ Buyer requires: FIPS 140         │ │
│  │ o FUNCTIONAL (15)     │                                  │ │
│  │ o FINANCIAL (0)       │ Your response:                   │ │
│  │                       │ [We use AES-256-GCM with...]     │ │
│  │ Progress: 23/48       │                                  │ │
│  │ ========----  48%     │ Evidence: [SOC 2 Report]         │ │
│  │                       │ Compliance: [Met v]              │ │
│  │                       │ Est. hours: [40]                  │ │
│  └──────────────────────┴──────────────────────────────────┘ │
│                                                              │
│  Bid Summary:                                                │
│  Total price: $125,000 | Timeline: 12 weeks                 │
│                                                              │
│  [ Save Draft ] [ Submit Bid ]                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Acceptance -> Engagement Transition

When buyer accepts a bid:

1. **Bid status** -> `accepted`
2. **All other bids** -> `rejected` (or let buyer reject individually)
3. **WorkRequest status** -> `in_progress`
4. **Create engagement tag** -> `sme-mart.eng.xxx` (if not already created)
5. **Create ZB Boundary** (if not exists) between buyer org and provider org
6. **Update ZB Tasks** — subtasks now have both demand-side requirements AND supply-side responses
7. **Timeline event** — "Bid accepted — engagement started"

This transition is where the **Transparency Center** activates.

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| RFP may have 45+ subtasks — bid response UI must be fast | Virtual scroll, lazy-load responses per task type, progress indicator |
| Provider may not respond to all requirements | Allow partial submission with warning; buyer sees completion % |
| Multiple bids competing — data volume | Paginate bids; comparison view shows max 4 at a time |
| Acceptance creates many ZB resources at once | Queue operations, show progress dialog, handle partial failures gracefully |
| Bid draft state vs submitted state | Clear status indicators; prevent edits after submission (unless buyer requests revision) |
| ZB MCP currently inop | Phases 1-3 are pure frontend + Neon. Phase 4 acceptance transition defers ZB MCP calls gracefully. |
| LLM generates low-quality or hallucinated responses | Vendor reviews everything; "AI-generated" badges set expectations; re-generate per section |
| LLM API latency (45+ requirements × response) | Stream section-by-section; show progress; allow partial use (generate some, write others manually) |
| LLM API cost per bid generation | Cache vendor profile context; batch requirements by task type in fewer calls; track usage |
| Vendor org docs may not have extractable text | Graceful degradation — generate from profile + RFP only; prompt vendor to add docs |
| AI-generated bids may look generic across vendors | Include vendor-specific context prominently; encourage vendors to edit/personalize |

---

## Testing Strategy

- **Unit:** BidResponseService CRUD, compliance summary calculation
- **Unit:** RequirementResponseComponent form validation
- **Unit:** BidAiService — prompt construction, response parsing, error handling
- **Integration:** Full flow: Provider views RFP -> responds to requirements -> submits bid
- **Integration:** Buyer reviews bids -> comparison view -> accepts -> verify engagement created
- **Integration:** AI-assisted flow: method chooser -> context gathering -> LLM draft -> vendor edits -> submit
- **E2E:** End-to-end: RFP publish -> provider bid -> buyer accept -> engagement active
- **E2E:** AI path: RFP publish -> AI-assisted bid -> vendor review -> submit -> buyer comparison
