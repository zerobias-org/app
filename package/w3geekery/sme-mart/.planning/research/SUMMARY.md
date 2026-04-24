# Project Research Summary

**Project:** SME Mart v1.2 (RFP Packages & Pilot Projects)
**Domain:** Angular 21 marketplace for Subject Matter Experts
**Researched:** 2026-04-02
**Confidence:** HIGH

## Executive Summary

v1.2 adds four interconnected features to SME Mart's existing marketplace: **pilot projects** for POC testing, **invitation-only RFPs** for closed vendor pools, **document templates** for org-level template reuse with variable substitution, and **form builder** enabling structured vendor response requirements. All features integrate into the proven Pipeline+GQL architecture with no stack changes—Angular 21 + AuditgraphDB remain the foundation. The build order is strict and well-defined by dependencies: pilot projects first (lowest complexity, no dependencies), then invitations, templates, and form builder last (most complex).

Implementation risk is moderate due to five critical pitfalls: access control gates for invitations (vendor could bypass restrictions), template variable substitution syntax conflicts, missing server-side form validation, RFP wizard state loss during multi-step editing, and incorrect entity class IDs from schema. Each pitfall has clear prevention patterns documented in PITFALLS.md, but requires careful testing during execution.

The recommended approach is phase-based delivery aligned to dependencies: Phase 13 (pilots, 6–8 hrs) establishes baseline architecture, Phase 14 (invitations, 12–16 hrs) adds access control patterns, Phase 15 (templates, 14–18 hrs) introduces data transformation, and Phase 16 (form builder, 16–20 hrs) completes with JSON Schema rendering. No team blockers or platform gaps identified; all needed technologies already installed.

## Key Findings

### Recommended Stack

**No stack changes required.** All technologies for v1.2 already in package.json and proven in v1.0–1.1:

**Core technologies:**
- **Angular 21.1.4** — Standalone components with TypeScript strict mode; established patterns for component architecture
- **RxJS 7.8+** — Signals + BehaviorSubject for state management; write-through cache (60s TTL) pattern already proven
- **Angular Material 21.x + @zerobias-org/ngx-library 0.2.25** — Pre-built UI components (panels, dialogs, tables, autocomplete); coordinated with platform design system
- **ZerobiasClientApi @zerobias-com/zerobias-angular-client ^1.1.23** — Hydra client for Platform APIs, HubConnector for GraphQL to AuditgraphDB
- **Pipeline + GraphQL** — Fire-and-forget async writes via Receiver Pipeline, sync reads via schema package; no direct Neon access

**Form-specific technology:**
- **Angular Reactive Forms (built-in)** — DynamicFormComponent renders forms from JSON Schema; no external form library needed
- **Custom lightweight JSON Schema validation** — Validate FormSubmission data server-side; avoid JSON Forms library (unnecessary complexity)

See STACK.md for full dependency list and installation steps.

### Expected Features

**Must have (table stakes):**
- **Pilot Projects** — Brian requirement for POC testing before full engagement; simple projectType discriminator
- **Invitation-Only RFPs** — Brian requirement for closed RFPs; access control gate for vendor invitations
- **Document Templates** — Org efficiency (reuse boilerplate MSA, NDA, SOW); org-level CRUD + instantiation
- **Form Requirements** — Buyer compliance; structured vendor response format as JSON Schema config
- **Submission Deadline** — Marketplace standard; UI display of close date on project

**Should have (competitive differentiators):**
- **Variable-Based Template Substitution** — Orgs define once ({{buyerOrgName}}, {{engagementId}}, etc.), reuse everywhere
- **Structured Form Schema** — Buyer defines exactly what vendor submits (type-safe, validation built-in)
- **Pilot→Real Project Promotion** — Clear lifecycle; single button creates new SmeMartProject linked to pilot
- **Vendor Invitation Feed** — Vendors see only their invitations at `/my-invitations` (not marketplace noise)
- **Org Template Library** — Org admins manage template catalog for reuse across projects
- **Form Submission History** — Buyers review all vendor form responses with audit trail

**Defer to v2+ (not essential for v1.2):**
- LLM-assisted form generation (Plan 033 P5) — separate initiative
- Complex form branching logic (conditionals, dynamic sections) — start flat, add in Phase 20+
- Form submission approval workflow (Plan 054 S3) — requires ZB Task integration (blocked)
- Multi-submission forms — one submission per vendor in Phase 16, expand Phase 20+
- Template versioning — templates immutable by design, new template for changes
- Document e-signing, bulk invitation import (CSV), real-time notifications

See FEATURES.md for full feature table and success metrics.

### Architecture Approach

v1.2 follows the proven single-service CRUD pattern from v1.0–1.1: PipelineWriteService for async writes, GraphqlReadService for sync reads, 60s TTL write-through cache, RxJS signal-based UI updates. Four new entities (Invitation, DocumentTemplate, FormBuilderConfig, FormSubmission) and four new services (PilotProjectService, InvitationService, TemplateService, FormBuilderService) integrate seamlessly without component rewrites. SmeMartProjectService gains three fields (pilotCompletedAt, isInvitationOnly, invitationExpiresAt), and BidsService adds an access control gate. Six new components handle UI for invitations, templates, forms, and submissions. All field mappings use snake_case ↔ camelCase constants; all tests follow existing Jasmine + Karma patterns.

**Major components:**
1. **PilotProjectService** — Simple lifecycle: mark complete, promote to real project, list pilots
2. **InvitationService** — Access control gate (canBidOnProject), response tracking, expiration checks
3. **TemplateService** — Org-level template CRUD, instantiation with variable substitution, deduplication
4. **FormBuilderService** — JSON Schema CRUD, form publishing, submission storage, server-side validation
5. **DynamicFormComponent** — Renders form from JSON Schema; supports 6 field types (text, number, select, checkbox, date, textarea)
6. **SmeMartProjectService.publish()** — Updated to instantiate templates + publish form on project launch

See ARCHITECTURE.md for full entity definitions, build order, data flows, and modified services.

### Critical Pitfalls

**1. Access Control Gate Logic for Invitations** — BidsService allows bids from uninvited vendors if gate check is incomplete (status mismatch, race condition, no expiration check). Prevention: BidsService.createBid() gates on InvitationService.canBidOnProject() BEFORE creating bid; canBidOnProject() validates RFP is isInvitationOnly, invitation exists, status='accepted', not expired. Add unit tests for all gate paths (invited accepted, not invited, declined, expired).

**2. Template Variable Substitution Syntax Conflicts** — Placeholder syntax (e.g., {{varName}}) conflicts with template content if not finalized before Phase 15 (buyer writes "{{understanding}}" in template text, gets replaced). Prevention: Finalize syntax before Phase 15 (recommend {{variableName}} Handlebars-style), define escaping rule (\{\{ for literal {{), test with edge cases (missing variables, escaping, multiple same variable). Variable names use CamelCase to avoid common word conflicts.

**3. Form Schema Validation Missing Server-Side** — Client-side validation passes, but server rejects invalid FormSubmission.submissionData (malformed JSON, wrong type, missing required fields). Prevention: FormBuilderService.submitForm() validates submissionData against FormBuilderConfig.schema using lightweight JSON Schema validator; return validation errors to vendor. Test matrix: valid (pass), missing required field (fail), wrong type (fail), extra unknown field (pass).

**4. RFP Wizard State Loss (Invitations + Templates + Forms)** — Buyer edits Step 2 (templates, forms), navigates to Step 1, returns to Step 2—all selections lost. Prevention: SmeMartProjectService.wizardData includes templateIds[], formConfigId; RFP wizard auto-saves on step navigation; create FormBuilderConfig in draft (not just on publish); warn user on unsaved changes. Test: navigate Step 2→Step 1→Step 2, all state preserved; publish includes templates + form.

**5. New Entity Class IDs Not Deterministic** — Schema PR merged without dataloader verify; class IDs different across environments or PipelineWriteService constant doesn't match actual ID. Prevention: MUST run `npm run verify` before schema PR merge; dataloader confirms deterministic v5 UUID from YAML; copy exact ID to PipelineWriteService constant after verify; test entity roundtrip (Pipeline.receive succeeds, GraphQL.getById retrieves same data, ID matches constant).

See PITFALLS.md for Pitfalls 6–11 (moderate/minor: missing template variables, complex form schema, invitation status not persisted, document deduplication, field type inconsistencies across environments, expiration enforcement).

## Implications for Roadmap

Based on research, four phases with strict build order and dependency flow:

### Phase 13: Pilot Projects
**Rationale:** Lowest complexity (single field + simple methods), zero external dependencies, validates baseline architecture before adding access control/state complexity.
**Delivers:** Pilot project creation, mark complete, promote to real project with linked reference.
**Addresses:** Pilot Projects (table stakes), Brian's POC testing requirement.
**Implements:** PilotProjectService (mark complete, promote, list); SmeMartProject.pilotCompletedAt field; UI badges on project card + filter on my-projects.
**Avoids:** None (no external pitfall dependencies).
**Tech Stack:** Existing Angular + Pipeline + GQL only.
**Effort:** 6–8 hours.
**Research flag:** None — established patterns, skip `/gsd:research-phase`.

### Phase 14: Invitation Controls
**Rationale:** Builds on Pilot foundation; low to medium complexity; establishes access control gate pattern (reusable for future features); vendor invitation feed is differentiator.
**Delivers:** Invitation CRUD, vendor invitation list, buyer invitation management, access control gate.
**Addresses:** Invitation-Only RFPs (table stakes), Vendor Invitation Feed + Invited Vendors Tab (differentiators).
**Implements:** InvitationService (create, respond, canBidOnProject, list); Invitation entity (projectId, vendorOrgId, status, expiresAt, respondedAt); SmeMartProject.isInvitationOnly + invitationExpiresAt fields; BidsService gate; UI tabs (invited vendors on project detail, my-invitations feed for vendors); RFP wizard toggle.
**Avoids:** Critical Pitfall #1 (gate logic must pass all test paths—test invited/not-invited/declined/expired).
**Tech Stack:** Existing + gate pattern.
**Effort:** 12–16 hours (14a schema + service 6–8 hrs, 14b UI 6–8 hrs).
**Research flag:** None — gate pattern is standard access control, no new domain knowledge needed.

### Phase 15: Document Templates
**Rationale:** Medium complexity; variable substitution syntax must be finalized BEFORE phase starts; builds on Phases 13–14 validated patterns; org template library is high-value differentiator.
**Delivers:** Org template CRUD, template instantiation with variable substitution, deduplication check.
**Addresses:** Document Templates (table stakes), Variable-Based Template Substitution (differentiator), Org Template Library (differentiator).
**Implements:** TemplateService (create, list, instantiate, instantiateMultiple, update, delete); DocumentTemplate entity (orgId, templateType, description, documentId, isActive); SmeMartProjectService.publish() integration (call instantiateMultiple if templates selected); template instantiation UI; RFP wizard template selector; org admin `/document-templates` page.
**Avoids:** Critical Pitfall #2 (finalize {{variableName}} syntax before phase starts; test escaping + missing variables + edge cases). Critical Pitfall #9 (deduplication: don't create duplicate docs on second instantiate—reuse if not modified).
**Tech Stack:** Existing + JSON templating (no external library).
**Effort:** 14–18 hours (15a schema + service 8–10 hrs, 15b UI 6–8 hrs).
**Research flag:** **NEEDS RESEARCH** — Template variable substitution syntax design + fallback behavior for missing variables. Recommend design doc before phase starts defining {{varName}} syntax, escaping rules, and variable naming conventions.

### Phase 16: Form Builder
**Rationale:** Most complex (JSON Schema rendering); integrates all prior phases (pilot discriminator, invitation gate, template selection); enables structured vendor responses; highest business value; can defer form UI polish if time tight.
**Delivers:** Form schema CRUD (JSON Schema config), DynamicFormComponent (renders 6 field types), form publishing, submission storage, validation.
**Addresses:** Form Requirements (table stakes), Submission Deadline (table stakes), Structured Form Schema + Form Submission History (differentiators).
**Implements:** FormBuilderService (create, get, publish, submit, list, markReviewed); FormBuilderConfig + FormSubmission entities; DynamicFormComponent (text, number, select, checkbox, date, textarea only); form validation (client-side Angular Validators + server-side JSON Schema); SmeMartProjectService.publish() integration (call publishForm if form created); RFP wizard form builder section; project detail form tab (vendor submission UI) + responses tab (buyer review); form builder page (drag-drop or simple grid UI).
**Avoids:** Critical Pitfall #3 (MUST validate FormSubmission.submissionData server-side against schema; test valid/invalid/missing/extra fields). Moderate Pitfall #7 (limit schema to 6 simple field types; reject complex nested/conditional schemas; UI prevents user from creating complex fields). Critical Pitfall #4 (persist form config on save, not just on publish—save FormBuilderConfig in draft).
**Tech Stack:** Existing Angular Reactive Forms + custom JSON Schema validator (lightweight, no JSON Forms library).
**Effort:** 16–20 hours (16a schema + service + component 10–12 hrs, 16b UI 6–8 hrs).
**Research flag:** **NEEDS RESEARCH** — JSON Schema subset definition (which validators/keywords to support), DynamicFormComponent rendering strategy (simple grid vs drag-drop), field type definitions (min/max for number, pattern for text, enum for select, required/optional). Recommend design doc before phase starts defining supported field types, validation rules, and UI interaction model. Lightweight JSON Schema validator selection (check @zerobias-org/types-core-js, else use custom).

### Phase Ordering Rationale

**Pilot → Invitation → Template → Form** order is mandated by dependencies:
- Phase 13 (Pilot) has zero dependencies; validates baseline SmeMartProjectService changes
- Phase 14 (Invitation) depends only on Phase 13 (SmeMartProject fields); introduces access control pattern
- Phase 15 (Template) is independent of 14 but SmeMartProjectService.publish() easier after 14 tested; no hard dependency
- Phase 16 (Form) depends on all prior phases conceptually (publish() touches all features) but has hard dependency on Phase 15 schema merged (new entities must exist before phase starts)

**Grouping rationale:**
- Phases 13–15 can ship as v1.2 MVP if time tight (forms are complex, can defer form UI polish)
- Phase 16 adds highest business value (structured responses) and complexity (JSON Schema rendering); risk is medium but preventable with pitfall mitigations

**Pitfall mitigation in phase order:**
- Phase 13 tests write-through cache + GQL read before adding complexity
- Phase 14 establishes gate pattern (testable, reusable)
- Phase 15 finalizes variable substitution syntax early (before Phase 16 builds on schema complexity)
- Phase 16 builds on proven patterns from all prior phases

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 15 (Document Templates):** Template variable substitution syntax design — recommend design doc covering {{varName}} syntax, escaping rules (\{\{), variable naming conventions (CamelCase), fallback behavior (missing variables), and test matrix (edge cases). Finalize BEFORE phase starts.
- **Phase 16 (Form Builder):** JSON Schema subset definition + validator selection — recommend design doc covering supported field types (6 types: text, number, select, checkbox, date, textarea), validation rules per type (required, min/max, pattern, enum), rendering strategy (simple grid vs drag-drop), and lightweight validator selection. Finalize BEFORE phase starts.

**Phases with standard patterns (skip research-phase):**
- **Phase 13 (Pilot Projects):** Simple field addition + CRUD methods; established PipelineWrite + GQL pattern; no new domain knowledge needed.
- **Phase 14 (Invitation Controls):** Standard access control gate pattern; similar gates exist in other platforms; gate logic well-defined in PITFALLS.md; no new domain knowledge needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No changes required; all technologies already installed and proven in v1.0–1.1; package.json verified |
| Features | HIGH | Feature table aligns with Brian's stated requirements (pilots, invitation-only) + gap analysis (templates, forms); success metrics well-defined |
| Architecture | HIGH | Builds directly on proven v1.0–1.1 service pattern (PipelineWrite + GQL); entity definitions complete; build order dependencies verified; no circular blocking identified |
| Pitfalls | HIGH | Five critical pitfalls identified with clear prevention patterns; moderate pitfalls (6–9) secondary but manageable; sources are architectural/code patterns, not inference |
| **Overall** | **HIGH** | All four research areas have high confidence; roadmap can proceed to requirements/planning phase with minimal gaps |

### Gaps to Address

**During Phase 15 planning:**
- Finalize template variable substitution syntax and escaping rules (recommend design doc, not during coding)
- Define variable naming convention (CamelCase recommended to avoid common word conflicts)
- Design fallback behavior for missing variables (leave as literal {{varName}} or throw error?)
- Test matrix for edge cases: literal {{ in template text, missing variables, multiple same variable, nested templates

**During Phase 16 planning:**
- Define exact JSON Schema subset (which keywords supported: type, required, enum, pattern, min/max, title)
- Select lightweight JSON Schema validator (check @zerobias-org/types-core-js; if not available, implement custom validator)
- Design DynamicFormComponent UI (simple +Add Field grid vs drag-drop builder; decide based on vendor UX feedback)
- Define form field type definitions (number: min/max/step, text: pattern/maxLength, select: enum values, date: format)

**During all phases:**
- Run dataloader verify before merging schema PRs (Pitfall #5 prevention)
- Test access control gates exhaustively (Pitfall #1 prevention: invited/not-invited/declined/expired paths)
- Plan server-side form validation implementation early (Pitfall #3 prevention)
- Design RFP wizard state persistence before coding Step 2 (Pitfall #4 prevention)

## Sources

### Primary (HIGH confidence — verified with source code & architecture docs)
- **STACK.md** — Existing package.json versions, angular.json, proven patterns in v1.0–1.1 codebase
- **FEATURES.md** — Gap analysis D1–D9 from BACKLOG.md, Brian's stated requirements (pilots, invitations), marketplace feature tables
- **ARCHITECTURE.md** — Existing service architecture from v1.0–1.1 (PipelineWriteService, GraphqlReadService, RxJS patterns), entity definitions aligned with schema design
- **PITFALLS.md** — Architectural anti-patterns identified from similar marketplace projects, access control gate patterns from platform documentation

### Secondary (MEDIUM confidence — community consensus, referenced but not verified)
- **Brian's business directives** (from planning meetings) — Pilots + Invitation-Only RFPs as must-haves
- **ZeroBias schema design patterns** — AuditgraphDB entity modeling, Pipeline receiver patterns, GraphQL schema package structure
- **Angular 21 standalone patterns** — Official Angular docs (21.angular.io), field mapping conventions from v1.0–1.1

### Tertiary (NOTES — implementation details, clarified during planning)
- Template variable substitution syntax (not finalized; design doc needed Phase 15 planning)
- JSON Schema subset (not finalized; design doc needed Phase 16 planning)
- Form UI interaction model (not finalized; user research recommended)

---
*Research completed: 2026-04-02*
*Ready for roadmap: yes*
*Next step: Create detailed phase requirements using this summary as input*
