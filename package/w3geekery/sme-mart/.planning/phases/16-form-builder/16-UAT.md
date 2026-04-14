---
status: partial
phase: 16-form-builder
source:
  - 16-00-SUMMARY.md
  - 16-01-SUMMARY.md
  - 16-02-SUMMARY.md
  - 16-03-SUMMARY.md
  - 16-04-SUMMARY.md
started: 2026-04-14T18:40:00Z
updated: 2026-04-14T18:56:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Enable Form Step in RFP Wizard
expected: |
  In the RFP wizard, step 2.5 "Submission Form" appears after Documents and
  before Requirements. Step is optional. Toggling "Enable Submission Form for
  this RFP" reveals two tabs: "Define Fields" and "Preview".
result: pass

### 2. Add Form Fields with Drag-Drop Reorder
expected: |
  In "Define Fields" tab, clicking "Add Field" appends a new expansion panel
  with a configurable field. Adding several fields of different types (text,
  textarea, dropdown, number, checkbox, file) works. Dragging a field by its
  drag handle reorders it in the list. Adding 25+ fields shows a yellow
  warning banner.
result: pass

### 3. Configure Field Validation
expected: |
  Expanding a text field panel shows the FormFieldEditor with inputs for
  label, required toggle, placeholder, description, and type-specific
  validation (minLength/maxLength/pattern for text; min/max/step for number;
  allowed MIME types / size / count for file). Changes persist when the
  panel is collapsed and re-opened.
result: pass

### 4. Preview Form as Buyer (Wizard Preview Tab + Review Step)
expected: |
  In wizard "Preview" tab AND in the final Review step, the form renders via
  DynamicFormRenderer in preview mode — disabled inputs, correct field
  labels/types/required markers. All 6 field types render appropriately
  (text input, textarea, mat-select dropdown, number input, checkbox,
  file upload stub).
result: pass

### 5. Vendor Fills and Submits Form
expected: |
  Log in as a vendor who has bid on a form-enabled RFP. Open the project
  detail page → Submission Form tab. Form renders in fill mode with all
  required validators. Save Draft persists without validation. Submit
  validates required fields, blocks submission when invalid, and on success
  emits submit with the submitted values. Submission status becomes
  "submitted" with a submittedAt timestamp.
result: skipped

### 6. Bid Form Gate Blocks Submission Until Complete
expected: |
  When the RFP has a form enabled, the vendor bid submission flow shows a
  BidFormGateComponent that blocks bid submission until the attached
  FormSubmission is in status=submitted. Attempting to submit the bid with
  an incomplete/draft form surfaces a gate warning. Completing the form
  unblocks bid submission.
result: skipped

### 7. Buyer Reviews Submission and Marks Reviewed
expected: |
  Log in as the buyer. In the bid detail view, BidFormReviewComponent
  renders the form in review mode with submitted values (disabled inputs,
  light-green background). A "Mark Reviewed" action sets
  status=reviewed + reviewedAt + reviewedBy. The transition is
  visible/persists on page reload.
result: skipped

### 8. Form Lock After First Submission
expected: |
  Once ANY FormSubmission exists for the RFP, editing the form in the
  wizard is locked — FormBuilderComponent shows a lock banner ("Form is
  locked"), the Add Field button is disabled, and panels render as
  read-only. This is the D-13 form-lock gate enforced via
  FormSubmissionService.getFormSubmissionLock().
result: skipped

## Summary

total: 8
passed: 4
issues: 0
pending: 0
skipped: 4

## Gaps

[none yet]
