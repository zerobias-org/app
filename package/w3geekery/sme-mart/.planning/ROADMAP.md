# SME Mart — Roadmap

## Milestones

- ✅ **v1.0 AuditgraphDB Migration** — Phases 1-6 (shipped 2026-03-19) | [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Org Navigation & Vendor Profile** — Phases 7-12 (shipped 2026-04-02) | [Archive](milestones/v1.1-ROADMAP.md)
- 🚀 **v1.2 RFP Packages & Pilot Projects** — Phases 13-17 (in progress) — Multi-document packages, invitation controls, form builder, pilot project lifecycle, demo scripts

## Phases

<details>
<summary>✅ v1.0 AuditgraphDB Migration (Phases 1-6) — SHIPPED 2026-03-19</summary>

- [x] Phase 1: Infrastructure Setup (1/1 plans) — completed 2026-03-17
- [x] Phase 2: Wave 1 - Core Marketplace (2/2 plans) — completed 2026-03-18
- [x] Phase 3: Wave 2 - Attachments (2/2 plans) — completed 2026-03-19
- [x] Phase 4: Wave 3 - Standalone Entities (1/1 plans) — completed 2026-03-19
- [x] Phase 5: Verification & Cleanup (1/1 plans) — completed 2026-03-19
- [x] Phase 6: Project Bloom Entities (2/2 plans) — completed 2026-03-19

</details>

<details>
<summary>✅ v1.1 Org Navigation & Vendor Profile (Phases 7-12) — SHIPPED 2026-04-02</summary>

- [x] Phase 7: Org Navigation (1/1 plans) — completed 2026-03-31
- [x] Phase 8: Vendor Profile Schema (1/1 plans) — completed 2026-04-01
- [x] Phase 9: Vendor Profile Service (1/1 plans) — completed 2026-04-01
- [x] Phase 10: Vendor Profile UI (2/2 plans) — completed 2026-04-01
- [x] Phase 11: Vetting Pre-Fill (1/1 plans) — completed 2026-04-01
- [x] Phase 12: Project-Centric Boundary Model (2/2 plans) — completed 2026-04-02

</details>

### v1.2 RFP Packages & Pilot Projects (Phases 13-17)

- [x] **Phase 13: Pilot Projects** (2/2 plans) — Enable buyer POC testing with projectType discriminator and promotion workflow (completed 2026-04-02)
- [x] **Phase 14: Invitation Controls** (3/3 plans) — Close RFPs to invited vendors, add invitation management UI and access control gates (completed 2026-04-08)
- [x] **Phase 15: Document Templates** (3/3 plans) — Org-level reusable templates with variable substitution for reusable docs (completed 2026-04-10)
- 🚀 **Phase 16: Form Builder** (3/3 plans) — Buyer-defined structured forms with dynamic vendor submission (in progress: Plan 01 complete)
- [ ] **Phase 17: Demo Seed Scripts** — CLI scripts creating full RFP package flow for Friday demos with Brian

---

## Phase Details

### Phase 13: Pilot Projects
**Goal**: Enable buyers to create pilot projects for POC testing, mark complete, and promote to real projects
**Depends on**: v1.1 complete (SmeMartProjectService baseline)
**Requirements**: PLT-01, PLT-02, PLT-03, PLT-04
**Success Criteria** (what must be TRUE):
  1. Buyer can create a project with `projectType: pilot` discriminator
  2. Buyer can mark a pilot as complete and view completion date on project detail
  3. Buyer can promote a completed pilot to a real project via single button (creates new linked SmeMartProject)
  4. Pilot projects display visual badge/label in project lists and detail views distinguishing them from RFPs
**Plans**: 2 plans
  - [ ] **Phase 13 Plan 01** — UI enhancements + completion workflow (type chip, list filter, completion dialog) — Requirements: PLT-01, PLT-04, PLT-02 (UI)
  - [ ] **Phase 13 Plan 02** — Promotion workflow + vetting suggestion integration — Requirements: PLT-03, PLT-02 (complete)
**Effort**: 6–8 hours (Plan 01: 3–4 hrs, Plan 02: 3–4 hrs)
**Tech Stack**: Angular 21 + Pipeline + GraphQL (no new dependencies)

### Phase 14: Invitation Controls
**Goal**: Enable closed, invitation-only RFPs with vendor invitation management and access control gates
**Depends on**: Phase 13 (SmeMartProject field additions proven)
**Requirements**: D1-01, D1-02, D1-03, D1-04, D1-05, D1-06
**Success Criteria** (what must be TRUE):
  1. Buyer can mark an RFP as invitation-only and set invitation expiration date
  2. Buyer can add vendors to RFP invitation list and view invitation statuses (pending/accepted/declined)
  3. Invited vendor can accept or decline an invitation via dedicated UI
  4. Uninvited vendors cannot submit bids on invitation-only RFPs (access control gate)
  5. Vendor can view "My Invitations" feed showing only RFPs they've been invited to
  6. Invited vendors tab on RFP detail shows all invitations with response statuses
**Plans**: 3 plans
  - [ ] **Phase 14 Plan 00** (Wave 0) — Schema prerequisite: RfpInvitation class + SmeMartProject.isInvitationOnly field in zerobias-org/schema, dataloader validation, PR to zerobias-org/schema:dev — Requirements: (schema foundation, no direct req mapping)
  - [ ] **Phase 14 Plan 01** (Wave 1) — Service layer: RfpInvitationService CRUD, SmeMartProject model update, field mappings, BidsService access control gate + comprehensive tests — Requirements: D1-01, D1-02, D1-03, D1-04
  - [ ] **Phase 14 Plan 02** (Wave 2) — UI layer: My Invitations page, Invited Vendors tab, teaser view, RFP detail conditional rendering, inline acceptance banner, listing badge — Requirements: D1-01, D1-02, D1-03, D1-04, D1-05, D1-06
**Effort**: 14–18 hours (schema ~2-3 hrs, service ~5-6 hrs, UI ~6-8 hrs)
**Tech Stack**: Angular 21 + Pipeline + GraphQL + access control gate pattern + schema repo (zerobias-org/schema)
**Critical Pitfall**: Access control gate (Pitfall #1) — BidsService must validate invitation status, expiration, and acceptance before allowing bid creation. Requires comprehensive test coverage for all gate paths (invited accepted, not invited, declined, expired).
**UI hint**: yes
**Schema Prerequisite**: Wave 0 (Plan 14-00) must complete before Waves 1-2. GQL schema reloads ~15 min after PR merge.

### Phase 15: Document Templates
**Goal**: Enable org admins to create reusable document templates with variable substitution, and buyers to instantiate templates per-engagement
**Depends on**: Phase 14 (invitation schema integration pattern proven)
**Requirements**: D2-01, D2-02, D2-03, D2-04, D2-05
**Success Criteria** (what must be TRUE):
  1. Org admin can create, edit, and delete reusable document templates at org level (MSA, NDA, SOW, etc.)
  2. Document templates support variable substitution ({{buyerOrgName}}, {{engagementId}}, etc.) with defined syntax and escaping rules
  3. Buyer can instantiate an org template per-engagement (copy-on-create, engagement-scoped instance)
  4. Template variables auto-fill with engagement context (buyer name, engagement ID, dates)
  5. Buyer can preview document template before instantiating it
  6. Org template library prevents duplicate instantiation (same template, same engagement → reuse existing document)
**Plans**: 3 plans
  - [ ] **Phase 15 Plan 00** (Wave 0) — Schema prerequisite: DocumentTemplate + DocumentInstance YAML classes in zerobias-org/schema, dataloader validation, PR to zerobias-org/schema:dev, model interfaces in src/app/core/models — Requirements: (schema foundation)
  - [ ] **Phase 15 Plan 01** (Wave 1) — Service layer: DocumentTemplateService CRUD, DocumentInstanceService instantiation + duplicate prevention, VariableSubstitutionService with escaping/validation/preview, GQL read methods, comprehensive tests (>80% coverage) — Requirements: D2-02, D2-03, D2-04
  - [ ] **Phase 15 Plan 02** (Wave 2) — UI layer: org template library tab on /org, dedicated template editor at /templates/:id with Milkdown + variable panel + preview toggle, reusable chooser dialog for instantiation, documents tab integration (engagement/project mixed document listing), notes panel split button "From Template", markdown editor extension with variable insertion toolbar + slash command — Requirements: D2-01, D2-02, D2-03, D2-04, D2-05
**Effort**: 16–20 hours (schema ~2-3 hrs, service ~6-8 hrs, UI ~8-10 hrs)
**Tech Stack**: Angular 21 + Pipeline + GraphQL + Milkdown editor extension (no external library for substitution)
**Research Flag**: RESEARCH COMPLETE — Template variable substitution syntax {{varName}}, escaping (\{{ for literals), variable registry (built-in + custom), missing var behavior (block required, blank optional), storage model (DocumentTemplate + DocumentInstance), all documented in 15-RESEARCH.md.
**Critical Pitfall**: Variable substitution syntax conflicts (Pitfall #2) — {{varName}} syntax locked in research. Implementation must follow Decision 3 (escaping with backslash) exactly.
**Critical Pitfall**: Edit history tracking (Pitfall #2b) — Instances are editable post-instantiation. Track changes with "Modified from template" indicator or separate edit history log.
**UI hint**: yes
**Schema Prerequisite**: Wave 0 (Plan 15-00) must complete before Waves 1-2. GQL schema reloads ~15 min after PR merge.

### Phase 16: Form Builder
**Goal**: Enable buyers to define structured form requirements (6 field types) with dynamic vendor submission and buyer review UI
**Depends on**: Phase 15 (template entity pattern + schema integration proven)
**Requirements**: D3-01, D3-02, D3-03, D3-04, D3-05, D3-06
**Success Criteria** (what must be TRUE):
  1. Form builder is a reusable shared component in `src/app/shared/components/form-builder/` (not RFP-specific)
  2. Buyer can define form fields via UI (6 types: text, textarea, dropdown, number, file upload, checkbox) stored as JSON schema config
  3. Dynamic form renderer displays buyer-defined fields using Angular Reactive Forms + Material validation
  4. Buyer can preview the form before publishing the RFP (read-only DynamicFormRenderer in RFP wizard)
  5. Vendor can fill and submit the buyer-defined form on project detail page
  6. Buyer can review vendor's submitted form responses on bid detail with "Mark Reviewed" button
**Plans**: 3 plans
  - [ ] **Phase 16 Plan 00** (Wave 0) — Schema prerequisite: FormSubmission class + formConfig field on SmeMartProject in zerobias-org/schema, dataloader validation, PR to zerobias-org/schema:dev, model interfaces in src/app/core/models — Requirements: (schema foundation)
  - [ ] **Phase 16 Plan 01** (Wave 1) — Service layer + components: FormSubmissionService CRUD with form lock gate, FormBuilderComponent (expansion panels + drag-drop), DynamicFormRenderer (preview/fill/review modes), FormFieldEditorComponent, comprehensive tests (>80% coverage) — Requirements: D3-01, D3-02, D3-03, D3-04
  - [ ] **Phase 16 Plan 02** (Wave 2) — UI integration: RFP wizard form step (auto-persist config), project detail "Submission Form" tab for vendors, bid form gate (form required before submit bid), bid detail form review section with "Mark Reviewed" button — Requirements: D3-04, D3-05, D3-06
**Effort**: 18–22 hours (schema ~2-3 hrs, service + components ~10-12 hrs, UI integration ~6-8 hrs)
**Tech Stack**: Angular 21 + Reactive Forms (built-in) + Material + CDK DragDrop + Pipeline + GraphQL + ZB FileService SDK
**Research Flag**: RESEARCH COMPLETE — JSON Schema subset (6 field types with type-specific validators), DynamicFormRenderer with three modes (preview/fill/review), field config storage as JSON on SmeMartProject, form lock on first submission, all documented in 16-RESEARCH.md.
**Critical Pitfall**: Form validation missing server-side (Pitfall #3) — FormSubmission.submissionData must be validated server-side against FormBuilderConfig.schema. Client-side validation insufficient; server must reject invalid JSON, wrong types, missing required fields.
**Critical Pitfall**: RFP wizard state loss (Pitfall #4) — Multi-step RFP creation must persist form config on save (draft), not just on publish. Buyer edits form, navigates away, returns → form state must be preserved.
**Critical Pitfall**: Entity class IDs not deterministic (Pitfall #5) — New entity class IDs must be verified via `npm run verify` after schema PR merge. Copy exact ID to PipelineWriteService constant. Test roundtrip (Pipeline.receive → GraphQL.getById confirms match).
**UI hint**: yes
**Schema Prerequisite**: Wave 0 (Plan 16-00) must complete before Waves 1-2. GQL schema reloads ~15 min after PR merge.
**Form Lock Pattern**: Editable while zero submissions exist. Locked after first submission (prevents config changes that would invalidate existing responses).
**File Uploads**: Use existing ZB FileService SDK for file field uploads (no custom implementation).

### Phase 17: Demo Seed Scripts
**Goal**: CLI scripts that create a realistic RFP package flow via ZB Platform APIs for Friday demos with Brian, plus cleanup
**Depends on**: Phases 13-16 (all v1.2 features must be built)
**Requirements**: DEMO-01, DEMO-02, DEMO-03
**Success Criteria** (what must be TRUE):
  1. CLI seed script (node/ts) creates a complete RFP package flow — RFP with documents, invited vendor, submitted bid with form responses, pilot project
  2. CLI cleanup script tears down all demo-created data without affecting non-demo data
  3. Seed script exits non-zero on failure (doubles as integration test)
**Plans**: TBD
**Effort**: ~4 hours
**Tech Stack**: Node.js + TypeScript + ZB MCP/Platform APIs (CLI, no Angular)

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 13. Pilot Projects | 2/2 | Complete    | 2026-04-02 |
| 14. Invitation Controls | 3/3 | Complete    | 2026-04-08 |
| 15. Document Templates | 3/3 | Complete    | 2026-04-10 |
| 16. Form Builder | 3/5 | In Progress|  |
| 17. Demo Seed Scripts | 0/1 | Not started | — |

---

**Created:** 2026-03-17
**Last Updated:** 2026-04-13 (Phase 16 Plan 01 complete: FormSubmissionService with CRUD + form lock gate, 19 tests passing, director corrections applied)
