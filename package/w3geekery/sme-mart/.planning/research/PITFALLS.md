# Domain Pitfalls: v1.2 RFP Packages & Pilot Projects

**Domain:** SME Mart Angular marketplace
**Researched:** 2026-04-02

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Access Control Gate Logic for Invitations

**What goes wrong:** BidsService allows bids from uninvited vendors in invitation-only RFPs because the gate isn't implemented correctly.

**Why it happens:**
- InvitationService.canBidOnProject() called but result ignored
- Status checks incomplete (checks 'accepted' but not 'pending'/'declined')
- Race condition between invitation response and bid creation
- Invitation expiration not checked on gate

**Consequences:**
- Data integrity violation (bid from non-invited vendor)
- Security issue (vendor bypasses access control)
- Buyer/vendor confusion (unexpected bids appear)
- Would require data cleanup (delete orphaned bids)

**Prevention:**
- BidsService.createBid() gates on InvitationService.canBidOnProject() BEFORE creating bid
- canBidOnProject() checks: (1) RFP is isInvitationOnly, (2) Invitation exists, (3) status='accepted', (4) not expired
- Add unit tests for gate (can-bid-if-invited, cannot-bid-if-not-invited, cannot-bid-if-declined, cannot-bid-if-expired)
- Integration test: Create invitation-only RFP, invite vendor A only, try to bid as vendor B → should fail

**Detection:**
- Bids tab shows vendor outside invited list
- BidsService error log shows gate rejection
- Test failure on canBidOnProject() check

### Pitfall 2: Template Variable Substitution Syntax Conflicts

**What goes wrong:** Template variable substitution breaks because placeholder syntax conflicts with template content (e.g., "{{varName}}" placeholder appears in template text, gets replaced unintentionally).

**Why it happens:**
- Placeholder syntax not finalized before Phase 15 starts
- Template content uses similar syntax (e.g., "Please confirm {{understanding}}" in template text)
- Variable names collide with common words (e.g., "{{project}}" matches "project_id" field)
- No escaping mechanism for literal "{{" in template text

**Consequences:**
- Template instantiation produces corrupted documents
- Variable substitution replaces unintended text
- Buyer receives nonsensical documents (missing or wrong text)
- Would require template redesign + re-instantiation
- Vendor receives wrong documents (data leak risk if sensitive vars mixed)

**Prevention:**
- **Finalize placeholder syntax before Phase 15 starts** — Recommend `{{variableName}}` (explicit, Handlebars-like)
- **Define escaping rule:** `\{\{` for literal "{{" in template
- **Variable naming convention:** CamelCase (buyerOrgName, engagementId) to avoid common word conflicts
- **Test variable substitution with edge cases:**
  - Missing variables → fallback to original placeholder
  - Variables containing "{{" → escaped properly
  - Template text with placeholder-like content → not replaced
  - Multiple same variable in template → all replaced consistently

**Detection:**
- Template instantiation produces docs with wrong text
- Variables missing from output (replaced with empty string)
- Literal "{{" in output when should be placeholder value

### Pitfall 3: Form Schema Validation Missing Server-Side

**What goes wrong:** Client-side form validation passes, but server-side validation is missing. Vendor submits invalid JSON, or FormSubmission.submissionData doesn't match FormBuilderConfig.schema, causing downstream failures.

**Why it happens:**
- Focus on client-side Angular Validators (form visually validates)
- Assume if form renders, data is valid
- No JSON Schema validator on FormBuilderService.submitForm()
- No test for malformed FormSubmission data

**Consequences:**
- Buyer reviews invalid submissions (confusion)
- Downstream processing fails if expecting specific data shape
- Form response analytics broken (data type mismatches)
- Would require form submission re-entry or manual cleanup
- Future integrations (Plan 054 S3 task routing) break on invalid data

**Prevention:**
- **Server-side validation required in FormBuilderService.submitForm():**
  - Validate submissionData against FormBuilderConfig.schema using JSON Schema validator
  - Reject submission if validation fails with clear error message
  - Return validation errors to vendor (error message in response)
- **Lightweight JSON Schema validator:**
  - Check if `@zerobias-org/types-core-js` has one available
  - If not, use simple custom validator (type check, required fields, enum values)
  - Test validator with: valid data (pass), missing required field (fail), wrong type (fail), unknown field (pass/fail decision)
- **Test matrix:**
  - Valid submission → accepted
  - Missing required field → rejected with error
  - Wrong type (string instead of number) → rejected
  - Extra unknown field → accepted (forward-compatible)

**Detection:**
- FormSubmission.submissionData doesn't match FormBuilderConfig.schema
- Downstream processing fails on unexpected data shape
- Form responses can't be displayed (type error in buyer UI)

### Pitfall 4: RFP Wizard State Management (Invitations + Templates + Forms All Together)

**What goes wrong:** Buyer is editing RFP wizard Step 2 (documents + templates + forms), selects templates, sets form requirements, then goes back to Step 1 to toggle "Invitation Only?" — all state is lost or corrupted.

**Why it happens:**
- SmeMartProjectService.wizardData doesn't include templates selected + form config
- RFP wizard component doesn't preserve multi-step state
- Navigation back/forward loses intermediate state
- State lives in component signals, not persisted until publish

**Consequences:**
- Buyer loses hours of work (form definition, template selection)
- Frustration, will avoid using feature
- Incomplete RFP published (missing templates or form)
- Would require state recovery or manual re-entry

**Prevention:**
- **SmeMartProjectService.wizardData must include ALL state:**
  - Existing: title, description, budget, requirements, etc.
  - NEW: templateIds[], formConfigId (persist form config on save, not just ID)
  - Update SmeMartProjectService.updateWizardStep() to save all Phases 15–16 additions
- **RFP wizard component: Save on every step navigation**
  - Auto-save wizard state to SmeMartProjectService on step change
  - Show "Saved" indicator, show error if save fails
  - Warn user if they try to leave with unsaved changes
- **Persisted form config:**
  - Save form schema BEFORE publishing (create FormBuilderConfig in draft, not on publish)
  - Wizard references formConfigId, not form schema inline
- **Test state persistence:**
  - Enter form config on Step 2 → navigate to Step 1 → go back to Step 2 → form config still there
  - Select templates → navigate → templates still selected
  - Publish → all state (templates, form, invitations) all present in final SmeMartProject

**Detection:**
- Buyer reports "form disappeared when I went back"
- RFP published without templates or form (state lost)
- Component tests fail on state preservation

### Pitfall 5: New Entity Class IDs Not Deterministic or Missing

**What goes wrong:** New entity classes (Invitation, DocumentTemplate, FormBuilderConfig, FormSubmission) don't have class IDs, or IDs are different across environments, or dataloader verify fails.

**Why it happens:**
- Schema PR merged without running dataloader verify
- Class IDs are manually assigned (not v5 UUIDs from YAML)
- Different class ID across dev/UAT/prod (non-deterministic)
- Constant in PipelineWriteService doesn't match actual class ID

**Consequences:**
- Pipeline.receive fails (class ID not found)
- Entities stored in wrong class
- GQL queries return wrong entities
- Would require pipeline cleanup + entity migration
- All phases using these classes block

**Prevention:**
- **Schema PR MUST run dataloader verify before merge:**
  - `npm run verify` in schema/package/w3geekery/smemart/ passes
  - Dataloader confirms all class IDs are deterministic v5 UUIDs
  - No manual ID assignment (auto-generated from YAML)
- **Copy class ID to PipelineWriteService constant AFTER dataloader verify:**
  - Paste exact ID from dataloader output, not guessed value
  - Constant name matches schema class name (SME_MART_CLASS_IDS.Invitation = "...")
- **Test entity roundtrip:**
  - PipelineWriteService.pushEntity('Invitation', data) succeeds
  - GraphqlReadService.getById('Invitation', id) retrieves same data
  - ID matches constant in PipelineWriteService

**Detection:**
- Pipeline.receive returns "class not found" error
- GQL query for entity returns null/empty
- Dataloader verify fails with class ID mismatch

## Moderate Pitfalls

### Pitfall 6: Template Variable Substitution Missing Variables

**What goes wrong:** Template instantiation tries to substitute `{{buyer_org_name}}`, but variable not provided. Template ends up with literal "{{buyer_org_name}}" in final document.

**Why it happens:**
- TemplateService.instantiateTemplate() called with incomplete variables object
- Buyer forgets to map all variables in RFP wizard
- Variable name mismatch (template uses `{{buyerOrgName}}`, variable is `buyer_org_name`)
- No validation that all required variables are provided

**Prevention:**
- **TemplateService.instantiateTemplate() validates all variables:**
  - Extract variable names from template content (regex: `{{(\w+)}}`)
  - Check all extracted variables exist in provided variables object
  - Return error if missing variables: "Missing variables: buyerOrgName, engagementId"
- **RFP wizard Step 2: Show variable checklist**
  - Display all required variables for selected templates
  - Highlight missing variables (red indicator)
  - Prevent publish if variables incomplete
- **Fallback on missing variable:**
  - If variable missing, leave placeholder as-is: "{{buyerOrgName}}" stays in document
  - Buyer can manually edit document post-instantiation
  - Log warning to console: "Missing variable buyerOrgName in template instantiation"

**Detection:**
- Final document contains literal "{{varName}}" (not substituted)
- Variable value missing from document
- Test for regex on template content

### Pitfall 7: FormBuilderConfig Schema Too Complex / Renders Poorly

**What goes wrong:** Buyer creates form with nested objects, arrays, and conditional fields. DynamicFormComponent can't render complex schema, form breaks or displays incorrectly.

**Why it happens:**
- FormBuilderConfig.schema supports full JSON Schema v7
- Buyer defines complex nested objects, array fields, conditional fields
- DynamicFormComponent only handles 6 simple field types
- No validation on schema complexity during form creation

**Prevention:**
- **DynamicFormComponent v1 (Phase 16):** Support only 6 simple types
  - text (string), number, select (enum), checkbox (boolean), date, textarea
  - No nested objects, no arrays, no conditionals
- **FormBuilderService.createForm() validates schema complexity:**
  - Only allowed field types: the 6 above
  - Reject nested objects/arrays/conditionals with error message
  - UI prevents user from creating complex fields
- **RFP wizard form builder UI: Simple field grid**
  - +Add Field button for each of the 6 types
  - No drag-drop, no nesting, no branching logic
  - Validation rules (required, min/max, pattern, enum) shown inline

**Detection:**
- Form renders with errors or blank sections
- Vendor can't interact with complex form fields
- Test with nested object schema → validation error

### Pitfall 8: Invitation Status Not Updated When Vendor Accepts

**What goes wrong:** Vendor accepts invitation via `/my-invitations` page. UI updates, but Invitation.status in database stays 'pending'.

**Why it happens:**
- InvitationService.respondToInvitation() doesn't call PipelineWriteService.pushEntity()
- Response stored in local cache but not persisted to AuditgraphDB
- Cache expires after 60s, stale data returned on next query

**Prevention:**
- **InvitationService.respondToInvitation() MUST call PipelineWriteService:**
  - Update invitation.status = 'accepted' | 'declined'
  - Call pipelineWrite.pushEntity('Invitation', updatedInvitation)
  - Update cache: seedCache('Invitation', id, updatedInvitation)
- **Test invitation response:**
  - Call respondToInvitation() with 'accepted' status
  - Verify GraphqlReadService.getById('Invitation', id) returns status='accepted'
  - Wait 60s for cache TTL → still returns 'accepted' (persisted)

**Detection:**
- Invitation status UI shows 'accepted' but database shows 'pending'
- Vendor can bid, but invitation still shows 'pending' on refresh
- Test failure on invitation response roundtrip

### Pitfall 9: Document Template Instantiation Overwrites Existing Documents

**What goes wrong:** Buyer publishes RFP with templates twice. Second publish creates duplicate SmeMartDocuments instead of reusing.

**Why it happens:**
- TemplateService.instantiateTemplate() always creates new SmeMartDocument
- No deduplication check (same template, same project)
- GQL query lists both old + new copies
- Vendor confused by duplicate documents

**Prevention:**
- **TemplateService.instantiateTemplate() checks for existing instance:**
  - Query: SmeMartDocument where project=projectId AND templateId=templateId
  - If exists and not modified: return existing (reuse)
  - If exists and modified by vendor: create new version (preserve vendor edits)
  - If not exists: create new
- **SmeMartDocument schema:** Add templateId + sourceTemplateId fields to track origin
- **Test deduplication:**
  - Instantiate template → create doc A
  - Instantiate same template again → return doc A (not new doc B)
  - Vendor modifies doc A → next instantiate creates doc B (preserve edits)

**Detection:**
- Project documents tab shows duplicate template instances
- GQL query returns multiple identical documents
- Test failure on duplicate check

## Minor Pitfalls

### Pitfall 10: Form Field Types Don't Match Across Environments

**What goes wrong:** Form created on dev with "date" field type. Deployed to UAT. Date field renders as text input (dev has date field, UAT doesn't).

**Why it happens:**
- DynamicFormComponent field type mapping different between builds
- Build config not consistent
- Form schema stored as JSON with field type name (not UUID)

**Prevention:**
- **Field types versioned in constants:**
  - Define enum or constants for allowed field types
  - FormBuilderConfig.schema always uses field type names from this constant
  - DynamicFormComponent renders using same constant
- **Test field type rendering across environments**

**Detection:**
- Form field renders differently (date vs text)
- Test failure on field rendering

### Pitfall 11: Invitation Expiration Not Enforced

**What goes wrong:** Vendor accepts invitation 2026-01-01 with expiresAt='2026-01-05'. On 2026-01-10, vendor tries to bid. No expiration check, vendor can still bid.

**Why it happens:**
- InvitationService.canBidOnProject() doesn't check expiresAt
- Expiration only checked on list view (client-side)
- No background job to mark expired invitations

**Prevention:**
- **InvitationService.canBidOnProject() checks expiration:**
  - Get Invitation record
  - If expiresAt < now, return false (can't bid, invitation expired)
  - Mark invitation status='expired' if needed
- **Client-side safeguard:**
  - `/my-invitations` shows "Expired" badge for expiresAt < now
  - Vendor can't respond to expired invitation
- **Optional background job (future):**
  - Periodically mark old invitations as 'expired'

**Detection:**
- Vendor bids on expired invitation (should fail)
- Test failure on expiration check

---

**Created:** 2026-04-02
**Phases affected:** All (13–16)
