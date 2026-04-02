# Architecture: v1.2 RFP Packages & Pilot Projects

**Domain:** SME Mart marketplace application with invitation-controlled RFPs, document packages, form builder, and pilot projects
**Researched:** 2026-04-02
**Overall confidence:** HIGH

## Executive Summary

v1.2 adds four interconnected features to the existing Angular 21 marketplace: (1) **closed/invitation-only RFPs** requiring new access control fields and invitation service, (2) **document packages** that bundle templates, exhibits, and attachments per RFP, (3) **form builder** enabling buyers to define structured submission requirements as JSON config, and (4) **pilot projects** as a projectType discriminator enabling test engagements before full vetting. All features integrate into the existing Pipeline+GQL data layer with minimal new services and no component rewrites. The build order is strict: **pilot projects first** (lowest dependencies), then **invitation controls**, **document templates**, and **form builder** last.

## Key Findings

**Stack:** Angular 21 standalone, Pipeline+GQL AuditgraphDB, RxJS signals, @zerobias-org/ngx-library
**Critical path:** SmeMartProject schema extensions (4 new fields), FormBuilderConfig entity, DocumentTemplate entity, Invitation entity, FormSubmission entity
**New services:** FormBuilderService (config CRUD), TemplateService (template CRUD + instantiation), InvitationService (access control), PilotProjectService (lifecycle)
**Build order:** Pilot Projects → Invitation Controls → Document Templates → Form Builder (dependencies cascade)
**Architectural pattern:** All new entities follow existing service pattern (Pipeline write + GQL read, optimistic updates, RxJS signals)

## Current Architecture (Baseline)

### Technology Stack

| Component | Tech | Version | Purpose |
|-----------|------|---------|---------|
| Framework | Angular | 21.1.4 | Standalone components, no Nx |
| UI Library | @zerobias-org/ngx-library | 0.2.25 | Pre-built components (panels, dialogs, tables) |
| Data layer | Pipeline+GQL | — | AuditgraphDB receiver pipeline (writes), GraphQL (reads) |
| State | RxJS | 7.8+ | BehaviorSubject + signals for reactive updates |
| HTTP | Angular HttpClient | — | Via ZerobiasClientApi wrapper |
| Database | ZeroBias AuditgraphDB | — | All 17 SME Mart entities stored here |

### Existing Service Architecture Pattern

All services follow the same CRUD pattern:
- **Writes:** PipelineWriteService.pushEntity() (async fire-and-forget, 5-10s latency)
- **Reads:** GraphqlReadService.query() / getById() (direct GQL queries with field mapping)
- **Caching:** 60s TTL write-through cache for rapid edits
- **Field mapping:** snake_case (GQL) ↔ camelCase (TypeScript) transformation via constants

### Data Layer

**Write flow:** Service → Pipeline → AuditgraphDB (async)
**Read flow:** Service → GQL schema package → AuditgraphDB (sync)
**Cache:** TTL 60s, hit before GQL fetch, merge partials to prevent data loss

## v1.2: Four New Features

### Feature 1: Pilot Projects (Plan 077)

**Schema changes:** Add `pilotCompletedAt?: string` to SmeMartProject (projectType already exists)
**New service:** PilotProjectService
**Integration:** SmeMartProjectService + project detail UI

**Service methods:**
- markPilotComplete(projectId)
- promoteToRealProject(pilotId, realProjectData)
- listPilots(orgId)

**Why simple:** No new entities, just timestamp field + simple lifecycle methods.

### Feature 2: Invitation Controls (D1)

**Schema changes:** Add `isInvitationOnly: boolean`, `invitationExpiresAt?: string` to SmeMartProject
**New entity:** Invitation (class with projectId, vendorOrgId, status, expiresAt)
**New service:** InvitationService
**Integration:** BidsService gate + project detail UI

**Service methods:**
- createInvitations(projectId, vendorOrgIds[])
- respondToInvitation(invitationId, status)
- canBidOnProject(projectId, vendorOrgId)
- listInvitationsForVendor(vendorOrgId)
- listInvitationsForProject(projectId)

**Access control:** BidsService.createBid() gates on InvitationService.canBidOnProject()

### Feature 3: Document Templates (D2)

**New entity:** DocumentTemplate (orgId, templateType, description, documentId, isActive)
**New service:** TemplateService
**Integration:** DocumentService + SmeMartProjectService publish()

**Service methods:**
- createTemplate(orgId, req)
- listOrgTemplates(orgId)
- instantiateTemplate(templateId, projectId, variables)
- instantiateMultiple(templateIds[], projectId, variables)
- updateTemplate(templateId, req)
- deleteTemplate(templateId)  // Soft-delete

**Pattern:** Templates are org-level reusable configs + binary link. Instantiation creates engagement-scoped SmeMartDocument copies with variable substitution.

### Feature 4: Form Builder (D3)

**New entity:** FormBuilderConfig (projectId, formTitle, schema: JSON, isPublished)
**New entity:** FormSubmission (formConfigId, projectId, vendorOrgId, submissionData: JSON, status)
**New service:** FormBuilderService
**New component:** DynamicFormComponent (renders form from JSON Schema)
**Integration:** RFP wizard + project detail UI

**Service methods:**
- createForm(projectId, req)
- publishForm(formConfigId)
- getFormForProject(projectId)
- submitForm(formConfigId, vendorOrgId, data)
- listSubmissions(formConfigId)
- markSubmissionReviewed(submissionId)

**Form schema:** JSON Schema v7 subset (properties with type, title, validation rules)
**Renderer:** DynamicFormComponent generates Angular form controls from schema

## New Entities (4 total)

| Entity | Fields | Purpose | Phase |
|--------|--------|---------|-------|
| Invitation | projectId, vendorOrgId, status, expiresAt, respondedAt | Access control for invitation-only RFPs | 14a |
| DocumentTemplate | orgId, templateType, description, documentId, isActive | Org-level reusable templates | 15a |
| FormBuilderConfig | projectId, formTitle, schema, isPublished, allowMultipleSubmissions | Form schema definition | 16a |
| FormSubmission | formConfigId, projectId, vendorOrgId, submissionData, status | Vendor form responses | 16a |

**SmeMartProject additions:** projectType (exists), pilotCompletedAt, isInvitationOnly, invitationExpiresAt (phases 13, 14a)

## Build Order (Strict Dependencies)

**Phase 13: Pilot Projects** — 6–8 hrs
- Schema: Add pilotCompletedAt field to SmeMartProject
- Service: PilotProjectService (mark complete + promote methods)
- UI: Project card badge + project detail button + my-projects filter

**Phase 14: Invitation Controls** — 12–16 hrs
- 14a: Schema (Invitation entity) + Service (InvitationService full CRUD + gate)
- 14b: UI (RFP wizard toggle, project detail invited vendors tab, vendor invitations feed)
- 14a also: Update BidsService to gate on canBidOnProject()

**Phase 15: Document Templates** — 14–18 hrs
- 15a: Schema (DocumentTemplate entity) + Service (TemplateService CRUD + instantiate)
- 15b: UI (org template CRUD page, RFP wizard template selector, project documents tab)
- 15b also: Update SmeMartProjectService.publish() to instantiate templates

**Phase 16: Form Builder** — 16–20 hrs
- 16a: Schema (FormBuilderConfig + FormSubmission entities) + Service (FormBuilderService) + DynamicFormComponent
- 16b: UI (form builder page, RFP wizard form section, form responses tab, vendor form section)
- 16b also: Update SmeMartProjectService.publish() to publish form

**Why order matters:**
1. Pilot is zero-dependency (quick validate architecture)
2. Invitations depend only on SmeMartProject + new Invitation
3. Templates depend on Invitations? NO. But SmeMartProjectService.publish() easier after Invitation phase done
4. Form Builder depends on all above + complex UI (last)

## New Services (4 total)

All follow existing pattern: PipelineWrite + GraphqlRead + RxJS signals

| Service | Phases | Key Methods |
|---------|--------|------------|
| PilotProjectService | 13 | markPilotComplete, promoteToRealProject, listPilots |
| InvitationService | 14a | createInvitations, respondToInvitation, canBidOnProject, list* |
| TemplateService | 15a | create, list, instantiate, instantiateMultiple, update, delete |
| FormBuilderService | 16a | create, get, publish, submit, list, markReviewed |

## Modified Existing Services

| Service | Change | Phase | Detail |
|---------|--------|-------|--------|
| SmeMartProjectService | Handle new fields: pilotCompletedAt, isInvitationOnly, invitationExpiresAt | 13, 14a | Update create/update/getById |
| SmeMartProjectService | Call TemplateService.instantiateMultiple() on publish() | 15b | If templates selected |
| SmeMartProjectService | Call FormBuilderService.publishForm() on publish() | 16b | If form created |
| BidsService | Gate createBid() on InvitationService.canBidOnProject() | 14a | Before allowing bid |
| DocumentService | No changes needed (TemplateService links to existing docs) | — | — |

## New Components (6 total)

| Component | Phase | Complexity | Purpose |
|-----------|-------|-----------|---------|
| dynamic-form.component | 16a | Medium | Render form from JSON Schema |
| project-form-builder-tab | 16b | High | Buyer form editor UI |
| project-form-responses-tab | 16b | Low | Buyer submission review |
| document-templates-tab | 15b | Low | Org admin template CRUD |
| my-invitations.component | 14b | Low | Vendor invitation feed |
| project-invited-vendors-tab | 14b | Low | Buyer invitation management |

## Modified Components

| Component | Change | Phase |
|-----------|--------|-------|
| project-detail | Add conditional tabs (invited vendors, documents, form, responses) | 14b, 15b, 16b |
| project-card | Add pilot badge | 13 |
| my-projects | Add projectType filter + pilot badges | 13 |
| rfp-wizard Step 1 | Add pilot + invitation toggles | 13, 14b |
| rfp-wizard Step 2 | Add template selector + form builder sections | 15b, 16b |

## Field Mappings

All new entities use snake_case ↔ camelCase pattern (add to field-mappings.ts):

- INVITATION_FIELD_MAPPING
- DOCUMENT_TEMPLATE_FIELD_MAPPING
- FORM_BUILDER_CONFIG_FIELD_MAPPING
- FORM_SUBMISSION_FIELD_MAPPING

## Architectural Patterns

**Service CRUD:** Follows existing PipelineWriteService + GraphqlReadService pattern
**Caching:** 60s TTL write-through cache before GQL fetch
**Optimistic updates:** Signal-based UI updates, async persistence via Pipeline
**Field mapping:** Declarative constants for snake_case ↔ camelCase transformation
**Validation:** Client-side (Angular Validators) + optional server-side (JSON Schema for forms)

## Data Flows (Simplified)

**RFP with all features:**
- Buyer: Create SmeMartProject (projectType, isInvitationOnly, pilotCompletedAt)
- Buyer: InvitationService.createInvitations() if isInvitationOnly
- Buyer: Select + map DocumentTemplate instances
- Buyer: Define FormBuilderConfig with JSON Schema
- Publish → TemplateService.instantiateMultiple() + FormBuilderService.publishForm()

**Vendor workflow:**
- Check InvitationService.canBidOnProject() gate
- Download DocumentTemplate instances + exhibits
- Fill DynamicFormComponent → FormBuilderService.submitForm()
- Submit Bid (gated on invitation + form submission optional)

**Buyer review:**
- View Invitation list (status: pending/accepted/declined)
- Review FormSubmissions
- Download documents

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Form schema validation complexity | Use lightweight JSON Schema validator, test corner cases |
| Template variable substitution | Define explicit placeholder syntax (e.g., {{varName}}), fallback on missing |
| Invitation expiration | Check expiration on client-side list, optional background job later |
| New class IDs | Ensure dataloader verify after schema PR, keep in constants |
| Form submission versioning | One-per-vendor in Phase 16, multi-submission in future phase |

## Confidence

| Area | Level | Notes |
|------|-------|-------|
| Pilot Projects | HIGH | Minimal new code, existing projectType field |
| Invitation Controls | MEDIUM-HIGH | Access control logic needs careful testing |
| Document Templates | MEDIUM-HIGH | Variable substitution adds complexity |
| Form Builder | MEDIUM | JSON Schema rendering complex, start with simple types |
| Build order | HIGH | Clear dependencies, no circular blocking |
| Schema changes | MEDIUM | Deterministic class IDs after dataloader verify |

## Gaps

- Finalize template variable syntax before Phase 15
- Decide on JSON Forms library vs custom DynamicFormComponent
- Form submission approval workflow (ZB Task integration) deferred
- Invitation expiration background job optional for Phase 14
- Multi-submission forms deferred to future phase

---

Created: 2026-04-02
