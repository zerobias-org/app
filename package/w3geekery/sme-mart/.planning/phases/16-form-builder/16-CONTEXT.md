# Phase 16: Form Builder - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable buyers to define structured form requirements (6 field types: text, textarea, dropdown, number, file upload, checkbox) via a visual form builder, with dynamic vendor submission on RFP detail and buyer review on bid detail. The form builder is a reusable shared component, not RFP-specific. Form config is stored as a JSON field on SmeMartProject. Submissions are a separate FormSubmission entity linked to Bid + SmeMartProject.

</domain>

<decisions>
## Implementation Decisions

### Form Designer UX
- **D-01:** Sequential list with expansion panels. "Add Field" appends a new panel with type dropdown. Each panel contains type-specific config. Matches the existing requirement-editor expansion panel pattern.
- **D-02:** Field type selection via dropdown inside the expansion panel. Selecting a type reveals type-specific config fields (e.g., min/max for number, options list for dropdown, preset patterns for text).
- **D-03:** Drag-and-drop reordering via Angular CDK DragDrop. Each expansion panel gets a drag handle icon.
- **D-04:** Optional sections supported. Buyer can add named section headers (e.g., "Company Info", "Technical Qualifications") to group fields. Fields can also exist at the top level without a section.
- **D-05:** Dropdown options defined via inline text list (textarea or chip input inside the field's expansion panel). One option per line or comma-separated.
- **D-06:** Text fields support preset pattern validation (email, phone, URL) via dropdown — no custom regex. Plus required and min/max length.
- **D-07:** Number fields support min, max, and step configuration.
- **D-08:** Toggle preview button switches between builder mode and rendered preview (reuses DynamicFormRenderer in preview mode). Same pattern as Phase 15 template editor preview.
- **D-09:** Soft field limit with warning at ~25 fields ("Forms with many fields may reduce vendor response rates"). No hard cap.

### Form Storage & Schema
- **D-10:** formConfig stored as a JSON field on SmeMartProject entity. No separate FormConfig schema class. Shape defined by TypeScript interface in Angular app.
- **D-11:** New FormSubmission schema class (YAML in zerobias-org/schema). Fields: id, projectId (link to SmeMartProject), bidId (link to Bid), submissionData (JSON), status (draft/submitted/reviewed), submittedAt, reviewedAt, reviewedBy.
- **D-12:** Form submissions support draft saving. FormSubmission starts as "draft". Vendor can save partial answers and return. Submitted only on explicit Submit click.
- **D-13:** Form config locked on first submission. Editable while no submissions exist. Once first vendor submits (even draft), form fields are locked. Buyer must create a new RFP to change form structure.
- **D-14:** File upload fields use existing ZB FileService. File reference stored in submissionData as `{ fileId, fileName, fileSize }`. Preview/download reuses existing infrastructure.

### RFP Wizard Integration
- **D-15:** New "Submission Form" step in RFP wizard, positioned after Requirements and before Documents. Step order: Basics → Requirements → Submission Form → Documents → Terms → Review.
- **D-16:** Submission Form step is optional. If buyer skips it (no form configured), vendors submit traditional free-text bids only. Form is additive, not replacing existing bid flow.
- **D-17:** Form config auto-persists on step change. RfpWizardService handles draft persistence per step — same pattern as existing steps.
- **D-18:** Review step shows rendered form preview (read-only DynamicFormRenderer in preview mode) so buyer can verify before publishing.

### Vendor Submission & Review
- **D-19:** Vendor fills buyer's form on a "Submission Form" tab on the RFP detail page. Tab only appears when formConfig is present (hidden when no form configured).
- **D-20:** Buyer reviews vendor form responses inline on bid detail view. Read-only rendered section below cover letter/price/timeline. "Mark Reviewed" button updates FormSubmission.status.
- **D-21:** Vendor can edit submission after submitting, until RFP closes. Status reverts from "submitted" to "revised" on edit, resetting buyer's "reviewed" status.
- **D-22:** If RFP has a form, vendor must submit the form before the "Submit Bid" button is enabled. Form submission is a prerequisite for bid submission.
- **D-23:** Single DynamicFormRenderer component with `mode` input: 'preview' (read-only with sample data for buyer preview), 'fill' (editable for vendor submission), 'review' (read-only showing actual responses for buyer review). One component, three modes.

### Claude's Discretion
- File upload field constraints (allowed types, max size — pick what's practical for compliance docs)
- FormSubmission field mapping constants + class ID registration
- CDK DragDrop integration details within expansion panels
- Section header UI design (divider + label, or collapsible group)
- "Revised" status badge styling
- Form validation error display patterns
- Notes folder integration for chooser dialog (Phase 15 carryover)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — D3-01 through D3-06 (Form Builder requirements)

### Models & Services (existing patterns)
- `src/app/core/services/pipeline-write.service.ts` — Pipeline write pattern, SME_MART_CLASS_IDS mapping
- `src/app/core/services/graphql-read.service.ts` — GQL read pattern
- `src/app/core/services/rfp-wizard.service.ts` — RFP wizard draft persistence, step management
- `src/app/core/services/bids.service.ts` — Bid CRUD, access control gate pattern (Phase 14)
- `src/app/core/models/index.ts` — Model barrel file

### RFP Wizard (integration points)
- `src/app/pages/rfps/rfp-wizard/rfp-wizard.component.ts` — Wizard stepper, step registration
- `src/app/pages/rfps/rfp-wizard/steps/rfp-step-requirements.component.ts` — Requirements step (expansion panel + FormBuilder pattern to follow)
- `src/app/pages/rfps/rfp-wizard/steps/rfp-step-review.component.ts` — Review step (add form preview section)
- `src/app/pages/rfps/rfp-wizard/steps/requirement-editor.component.ts` — Expansion panel field editor pattern (closest existing analog)

### Bid & Project Detail (integration points)
- `src/app/shared/components/bid-form/bid-form.component.ts` — Existing bid dialog (gate form submission before bid)
- `src/app/pages/project/project-detail.component.ts` — Tab pattern, add "Submission Form" tab for vendors

### File Upload
- `.planning/notes/zb-file-upload-sdk-reference.md` — FileService SDK, upload workflow, preview patterns

### Schema Repo
- `~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart/classes/` — Add FormSubmission.yml

### Prior Phase Context
- `.planning/phases/15-document-templates/15-CONTEXT.md` — Template entity pattern, schema-first workflow, Milkdown editor (not directly used but entity/service pattern proven)
- `.planning/phases/14-invitation-controls/14-CONTEXT.md` — Access control gate pattern, schema class workflow

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **RequirementEditor** (`rfp-wizard/steps/requirement-editor.component.ts`): Expansion panel pattern with FormBuilder + Material. Closest analog to form field editor panels.
- **RfpWizardService** (`core/services/rfp-wizard.service.ts`): Draft persistence per step. Form builder step hooks into same pattern.
- **Angular CDK DragDrop**: Already available via `@angular/cdk` (Material dependency). No new package needed.
- **ZB FileService SDK**: Existing file upload infrastructure. Reuse for file upload form fields.
- **ZbResourceStatusComponent**: Status badges — reuse for submission status (draft/submitted/reviewed/revised).

### Established Patterns
- **Pipeline write + GQL read**: All entities. FormSubmission follows same pattern.
- **Entity service pattern**: Model interface + Service + field mapping + class ID.
- **Schema-first workflow**: YAML PR → dataloader → merge → 15-min reload.
- **Expansion panel forms**: requirement-editor uses this extensively — form field editor follows same pattern.
- **Tab-based detail pages**: project-detail already has multiple tabs. Adding "Submission Form" tab is consistent.

### Integration Points
- **RFP Wizard**: New step component registered in wizard stepper
- **Project Detail**: New tab for vendor form submission (conditional on formConfig)
- **Bid Detail/Review**: Inline form response rendering section
- **Bid Form Dialog**: Gate — disable Submit Bid until form submitted
- **Schema Repo**: New FormSubmission YAML class

</code_context>

<specifics>
## Specific Ideas

- Sequential expansion panel list mirrors the requirement-editor UX that already exists — consistency for buyers who use both
- Optional sections give structure to long forms without forcing it on simple forms
- Lock-on-first-submission prevents config/data mismatch without requiring versioning complexity
- Single DynamicFormRenderer with mode prop (preview/fill/review) — one component renders all three contexts
- Form-required-before-bid gate ensures structured data accompanies every bid on forms-enabled RFPs
- "Revised" status on re-edit resets buyer's review state — buyer always knows when responses have changed

</specifics>

<deferred>
## Deferred Ideas

- **Side-by-side bid comparison** — Comparing multiple vendor form responses in columns. Evaluation feature for v1.3.
- **Conditional form logic** — If/then field visibility (D3-07, already in REQUIREMENTS.md as future)
- **Repeating form sections** — Dynamic repeat groups (D3-08, already deferred to v1.3)
- **Form template reuse** — Saving form configs as templates to reuse across RFPs. Would need separate FormConfig entity.

</deferred>

---

*Phase: 16-form-builder*
*Context gathered: 2026-04-10*
