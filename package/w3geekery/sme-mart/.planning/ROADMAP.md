# SME Mart — Roadmap

## Milestones

- ✅ **v1.0 AuditgraphDB Migration** — Phases 1-6 (shipped 2026-03-19) | [Archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Org Navigation & Vendor Profile** — Phases 7-12 (shipped 2026-04-02) | [Archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 RFP Packages & Pilot Projects** — Phases 13-17 (complete 2026-04-15) — Multi-document packages, invitation controls, form builder, pilot project lifecycle, demo scripts
- 🔄 **v1.3 Dev Experience, Hardening & Transparency** — Phases 18-23 (active 2026-04-15) — Org switcher, local dev stacks, fire-and-forget audit, org documents, form templates, transparency spec
- 🔄 **v1.4 3P Onboarding & Default Engagement** — Phases 24-28, 30-31 (active 2026-04-24) — Demo data visibility gate, platform data audit, ZB-as-provider seed, auth + routing + lazy guard, company profile form, default board, smoke test

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

<details>
<summary>✅ v1.2 RFP Packages & Pilot Projects (Phases 13-17) — SHIPPED 2026-04-15</summary>

- [x] **Phase 13: Pilot Projects** (2/2 plans) — Enable buyer POC testing with projectType discriminator and promotion workflow (completed 2026-04-02)
- [x] **Phase 14: Invitation Controls** (3/3 plans) — Close RFPs to invited vendors, add invitation management UI and access control gates (completed 2026-04-08)
- [x] **Phase 15: Document Templates** (3/3 plans) — Org-level reusable templates with variable substitution. Schema live on UAT 2026-04-14 (DocumentTemplate `d2493bf7…`, DocumentInstance `3e1d232f…`).
- [x] **Phase 16: Form Builder** (5/5 plans) — Buyer-defined structured forms with dynamic vendor submission. Schema live on UAT 2026-04-14 (FormSubmission class ID `179bd4b1…`; round-trip verified via Pipeline.receive → GQL). UAT: 4/4 UI tests passed; 4 vendor/buyer-account flows deferred to account-gated UAT.
- [x] **Phase 17: Demo Seed Scripts** (1/1 plans) — CLI scripts creating full RFP package flow for Friday demos with Brian. Real ZeroBias SDK wiring (`Pipeline.receive` + `hydra.Tag`), state-file-driven cleanup (pipeline-created objects don't materialize as hydra Resources), end-to-end verified on UAT 2026-04-15 (commit `249e3df`).

</details>

<details>
<summary>🔄 v1.3 Dev Experience, Hardening & Transparency (Phases 18-23) — ACTIVE 2026-04-15</summary>

- [x] **Phase 18: Org Switcher** (5/5 plans, complete 2026-04-16) — User-menu dropdown switches active ZB org; Director UAT-approved (W3Geekery switch confirmed real org-context swap). Resolved errata 013/014/016 in-phase.
- [x] **Phase 19: zbb Local Dev Stacks** (4/4 plans, complete 2026-04-17) — Unified-origin reverse-proxy local dev environment for SPA + login via `zbb` with CloudFront-sim + nginx. Real UAT auth, real cookies, multi-user testing. Director UAT ready.
  - [x] **Plan 01 (Wave 1)** — Angular env + cloudfront-sim stack manifest + nginx config + entrypoint (completed 2026-04-17)
  - [x] **Plan 02 (Wave 2)** — sme-mart-spa stack: build + upload + location block injection (completed 2026-04-17)
  - [x] **Plan 03 (Wave 2)** — sme-mart-login stack: build + upload + location block injection (completed 2026-04-17)
  - [x] **Plan 04 (Wave 3)** — STACKS.md documentation + smoke test suite (completed 2026-04-17)
- [ ] **Phase 20: Fire-and-Forget Audit** (TBD plans) — Audit all `pushEntity` call sites, add telemetry, remediate CRITICAL+SIMPLE. **Promoted from theoretical to confirmed-needed by errata 023** (2026-04-28): two fictional class IDs (MPI + EngagementVettingItem) caused silent production failures since Plan 041 / Plan 063, hidden by fire-and-forget `.catch`. Should run before Phase 27 (lazy guard + onboarding routing rely on round-trip writes). (est. ~8 hrs)
- [ ] **Phase 21: Org Documents Center Completion** (TBD plans) — Folders, colors, tags, templates, preview (est. ~20 hrs, time-boxed, scope trims on creep)
- [ ] **Phase 22: Form Template Library** (TBD plans) — Save/reuse/fork form templates, library page, RFP wizard integration, new FormTemplate schema class (est. 22–32 hrs)
- [ ] **Phase 23: Transparency Controls UI-SPEC + Opportunistic Implementation** (TBD plans) — Lock UI-SPEC and wireframes, research backend capabilities, code if feasible (est. 4–6 hrs if spec-only)

</details>

<details>
<summary>🔄 v1.4 3P Onboarding & Default Engagement (Phases 24-28, 30-31) — ACTIVE 2026-04-24</summary>

- [ ] **Phase 24: Demo Data Visibility Gate** (TBD plans) — Filter demo records from non-admin users via Object.tag; admin delete action (est. 4-6 hrs)
- [x] **Phase 25: Platform Data Audit** (5 plans, Plan 01-04/5 complete 2026-04-24) — Inventory ZeroBias SDK data available for onboarding pre-fill (est. 4-6 hrs, research-as-phase)
  - [x] **Plan 01 (Wave 0)** — Infrastructure scaffold: verify-inventory.sh, per-source template, index file (completed 2026-04-24)
  - [x] **Plan 02 (Wave 1)** — SDK Sources audit: whoami, currentorg, orgsearch, usersearch, boundary, task (6 sources documented, completed 2026-04-24)
  - [x] **Plan 03 (Wave 1 parallel)** — GQL Sources audit + pre-fill map synthesis: MarketplaceProfileItem fields resolve all Phase 28 form fields (completed 2026-04-24)
  - [x] **Plan 04 (Wave 2)** — Pre-fill map synthesis + company_info convention draft: PLATFORM-DATA-INVENTORY.md refined with Known-Unknowns data-sparse guidance; COMPANY-INFO-CONVENTION-DRAFT.md created for Phase 26 ratification (completed 2026-04-24)
- [x] **Phase 26: Seed Provider (ZB-as-Provider)** (Plan 01/3 complete 2026-04-28) — Create ZeroBias as provider with company_info convention (est. 5-7 hrs)
  - [x] **Plan 01 (Wave 1)** — Ratify company-info convention + lock platform-provider distinguisher (option-b: MPI provider_type section) (completed 2026-04-28)
- [ ] **Phase 27: Auth Gate + Onboarding Routing + Lazy Guard** (TBD plans) — Authenticate users, route to onboarding or board, auto-create default engagement (est. 8-12 hrs)
- [ ] **Phase 28: Company Profile Review/Confirm Form** (TBD plans) — Pre-populate from platform data, confirm + save (est. 6-10 hrs)
- [ ] **Phase 29: DEFERRED TO v1.5** — Tier display, Terms of Service, ZB branding (intentionally skipped in v1.4)
- [ ] **Phase 30: Default Project Board + Coming Soon Placeholders** (TBD plans) — Seeded project board with 3 feature stubs (est. 6-8 hrs)
- [ ] **Phase 31: W3Geekery Dogfood + Production Smoke Test** (TBD plans) — End-to-end validation and production readiness (est. 4-6 hrs)

</details>

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
**Plans**: 5 plans
  - [x] **Phase 16 Plan 00** (Wave 0) — Schema prerequisite: FormSubmission class + formConfig field on SmeMartProject in zerobias-org/schema, dataloader validation, PR to zerobias-org/schema:dev, model interfaces in src/app/core/models — Requirements: (schema foundation)
  - [x] **Phase 16 Plan 01** (Wave 1) — Service layer + components: FormSubmissionService CRUD with form lock gate, FormBuilderComponent (expansion panels + drag-drop), DynamicFormRenderer (preview/fill/review modes), FormFieldEditorComponent, comprehensive tests (>80% coverage) — Requirements: D3-01, D3-02, D3-03, D3-04
  - [x] **Phase 16 Plan 02** (Wave 2) — UI integration: RFP wizard form step (auto-persist config), project detail "Submission Form" tab for vendors, bid form gate (form required before submit bid), bid detail form review section with "Mark Reviewed" button — Requirements: D3-04, D3-05, D3-06
  - [x] **Phase 16 Plan 03** (Wave 3) — Dynamic form renderer + field renderer (text, textarea, dropdown, number, file, checkbox), per-field validators, file-upload stub (FileService deferred to v1.3), spec coverage — Requirements: D3-03
  - [x] **Phase 16 Plan 04** (Wave 4) — Full RFP Wizard integration: rfp-step-form, rfp-step-review preview, project-detail submission tab, bid-form gate + bid review, end-to-end wiring — Requirements: D3-04, D3-05, D3-06
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
**Plans**: 1 plan
  - [x] **Phase 17 Plan 01** — Demo seed + cleanup CLI with step logging, marker tag strategy, idempotent cleanup, integration test exit discipline — Requirements: DEMO-01, DEMO-02, DEMO-03 (completed 2026-04-15, commit `249e3df`)
**Effort**: ~4 hours
**Tech Stack**: Node.js + TypeScript + ZB MCP/Platform APIs (CLI, no Angular)

---

### Phase 18: Org Switcher

**Goal**: Users can switch between their organizations via a first-class user-menu dropdown, updating Dana cookie + sessionStorage without DevTools intervention.

**Depends on**: None (independent feature)

**Requirements**: OS-01, OS-02, OS-03, OS-04, OS-05

**Success Criteria** (what must be TRUE):
  1. User menu in SME Mart header displays "Organization" section listing all accessible orgs (filtered per existing rules)
  2. Clicking an org calls `app.selectOrg(org)` which updates Dana cookie + `zb-current-dana-org-id` sessionStorage via ZB SDK
  3. Current org is visually distinguished (checkmark or "current" pill)
  4. Page reloads or router refreshes post-switch to pick up new org context
  5. Subsequent API calls use the new org's `dana-org-id` header (verified in DevTools Network tab)

**Plans**: 5
  - [x] **Phase 18 Plan 01** — OrgSwitcherService + SwitchingOrgDialog + UserProfileDropdown integration + E2E tests (executed 2026-04-15, landed)
  - [x] **Phase 18 Plan 02** — Hotfix for Errata 013 (empty submenu + placement) — swap SDK method, reposition trigger, add regression tests (executed 2026-04-16)
  - [x] **Phase 18 Plan 03** — Hotfix for Errata 014 (no-filter policy + remove double chevron) — drop all filters from orgs$, remove explicit submenu caret, update DECISIONS.md (executed 2026-04-16)
  - [x] **Phase 18 Plan 04** — Avatar enhancement — vendor fallback SVG, ngx-library imports, submenu rows render `<img>` with `imgDefault` fallback; bold name for current org (executed 2026-04-16)
  - [x] **Phase 18 Plan 05** — Errata 016 hotfix — port zb-ui-resource-image CSS from zb-ui-lib to global styles, fixing 1558px logo rendering regression (executed 2026-04-16, awaiting Director UAT screenshot review)

**Effort**: 4–8 hours (Plan 01: 3h 5m, Plan 02: 45m, Plan 03: ~30m, Plan 04: 45m, Plan 05: 12m)
**Tech Stack**: Angular 21 + ZeroBias SDK (no new dependencies)
**References**: `~/Projects/zb/ui/` portal user-menu component (read, don't copy)
**Status**: Complete 2026-04-16. Director UAT-approved — W3Geekery switch confirmed real org-context swap (AuditgraphDB empty-data response pattern proved header actually changed). Errata 013/014/016 all resolved in-phase; errata 015 (credential rotation) left for follow-up.

---

### Phase 19: zbb Local Dev Stacks

**Goal**: Stand up reproducible local development stacks (SPA + login) using the `zbb` tool with unified-origin reverse-proxy, enabling iteration without waiting for upstream Hub module PR review or CI/CD deployment. Real authentication, real cookies, multi-user testing locally.

**Depends on**: None (infrastructure setup)

**Requirements**: LS-01, LS-03, LS-04, LS-05, LS-06

**Sub-phases**:
  - **19.1 (Waves 1-2)** Unified-origin reverse-proxy architecture + SPA + login stacks
  - **19.2 (Wave 3)** Documentation + smoke test suite

**Success Criteria** (what must be TRUE):
  1. `zbb up sme-mart-spa` brings all services online; `curl localhost:15002/sme-mart/` returns SPA index.html
  2. SPA deep-route refresh (e.g., `/rfps/abc123`) returns index.html (try_files fallback via cloudfront-sim) — no 404
  3. Login served at `localhost:15002/login/`; user logs in with real UAT credentials; cookies land on `localhost` domain (not `uat.zerobias.com`)
  4. After login, SPA navigation shows valid session (whoAmI populates user context)
  5. `cloudfront-sim` stack is reusable (location blocks and backend targets parameterized, not SME Mart-specific)
  6. Env var import/export between stacks follows zbb conventions (e.g., SPA imports `HUB_URL` from hub-server)
  7. STACKS.md documents setup, real auth flow, iteration workflow, teardown, troubleshooting

**Plans**: 4 plans
  - [x] **Phase 19 Plan 01 (Wave 1)** — Angular env (environment.stack.ts) + cloudfront-sim stack manifest (zbb.yaml, compose.yml, nginx.conf.template, docker-entrypoint.sh) — Requirements: LS-01, LS-04, LS-05 (completed 2026-04-17)
  - [x] **Phase 19 Plan 02 (Wave 2)** — sme-mart-spa stack: build (npm run build:stack) + upload (mc cp) + location block injection — Requirements: LS-01, LS-04, LS-05 (completed 2026-04-17)
  - [x] **Phase 19 Plan 03 (Wave 2)** — sme-mart-login stack: build (npm run build, not --local) + upload (mc cp) + location block injection — Requirements: LS-03, LS-04, LS-05, LS-06 (completed 2026-04-17)
  - [x] **Phase 19 Plan 04 (Wave 3)** — STACKS.md operator guide + smoke test suite (master + per-stack scripts) — Requirements: LS-01, LS-03, LS-04, LS-05, LS-06 (completed 2026-04-17)

**Effort**: 10–14 hours (Wave 1: 3–4h, Wave 2: 4–5h parallel, Wave 3: 2–3h)
**Tech Stack**: `zbb` CLI + Docker + nginx (cloudfront-sim) + minio (static serving) + Angular + Metalsmith (login)
**Architecture**: Unified-origin reverse-proxy pattern (reference: `~/Projects/zb/ui/scripts/gateway.js`). Single nginx at localhost:15002 serves SPA + login from minio buckets, proxies /api/, /dana/, /app/session to uat.zerobias.com with cookie rewriting (Domain: uat.zerobias.com → Domain: localhost).
**Key Decisions** (locked in brief):
  - D-01: Reverse-proxy + unified origin (not static-only serving)
  - D-02: Critical nginx directives (proxy_cookie_domain, proxy_cookie_flags, ws upgrade)
  - D-03: No API key injection, no dana-org-id cookie injection — real login flow via SDK's redirectLogin()
  - D-04: Angular env `src/environments/environment.stack.ts` with `isLocalDev: false` (critical for real login)
  - D-05: Login built with `npm run build` (NOT `--local`)
  - D-06: 4 stacks (minio shared, cloudfront-sim, sme-mart-spa, sme-mart-login); hub-spoke pattern
  - D-10: CLOUDFRONT_SIM_PORT=15002 (fixed, not zbb-allocated)
  - D-12/D-13: App stacks write nginx location blocks to shared volume; cloudfront-sim includes via `include /etc/nginx/conf.d/apps/*.conf`
  - D-14: Reload trigger: `docker exec <container> nginx -s reload` after app stack start
**Deferred** (backlog 089): Hub module + Verdaccio local hosting (LS-02 deferred per D-06, requires Kevin clarification on hub-server runtime)

---

### Phase 20: Fire-and-Forget `pushEntity` Audit, Instrumentation + Opportunistic Remediation

**Goal**: Audit all `pushEntity` call sites for silent-failure risk, add telemetry to measure real-world failure rates, and remediate any CRITICAL+SIMPLE cases in-phase. Complex remediations deferred to v1.4 as individual backlog entries.

**Depends on**: None (self-contained audit + selective remediation)

**Requirements**: FF-01, FF-02, FF-03, FF-04, FF-05

**Success Criteria** (what must be TRUE):
  1. AUDIT.md exists in `.planning/phases/20-fire-and-forget-audit/` with 100% of `pushEntity` call sites cataloged (48+ identified), each rated for risk (CRITICAL/MEDIUM/LOW) + complexity (SIMPLE/MEDIUM/COMPLEX)
  2. Telemetry ships — every `.catch()` fires a counted event to console + optional remote sink; UAT soak for 1 week confirms non-zero fire-and-forget failures occur in production
  3. All CRITICAL+SIMPLE call sites have fire-and-forget removed and error state surfaced to users (toast, inline error, retry prompt); each error path covered by at least one spec
  4. CRITICAL+MEDIUM and CRITICAL+COMPLEX call sites have individual backlog entries in `.planning/BACKLOG.md` with proposed fix approaches and complexity rationale
  5. WATCH-LIST pattern updated: "Service method ends with `.catch(err => console.error(err))`" flagged as BLOCK for user-triggered actions going forward

**Plans**: TBD

**Effort**: ~8 hours (audit+instrument ~5h + opportunistic remediation ~3h)
**Tech Stack**: TypeScript + grep + spec coverage analysis
**Origin**: Errata 011 (director-flagged, v1.2 carry-forward)

---

### Phase 21: Org Documents Center Completion

**Goal**: Complete the Org Documents Center experience (folders, colors, tags, templates, preview) starting with the backlog's full list. Scope trims when creep emerges; target ~20h execution window.

**Depends on**: Phase 15 DocumentTemplate (shipped v1.2)

**Requirements**: OD-01, OD-02, OD-03, OD-04, OD-05

**Success Criteria** (what must be TRUE):
  1. Users can create and nest folders in the Org Documents Center (CRUD functional, matches existing Notes folder pattern if available)
  2. Color assignment + tag affordances visible and functional on documents (leverage hydra `Tag` API; search/filter by tag works)
  3. DocumentTemplate entities (from v1.2 Phase 15) appear in the Org Documents Center as a surfaced list, not only inside the RFP wizard
  4. Document preview works for common content types already supported by the File SDK
  5. Scope creep is named and deferred to v1.4 with explicit time-boxed signal (any deliverable >4h or requiring platform/schema work auto-defers)

**Plans**: TBD

**Effort**: ~20 hours (time-boxed, scope trims on creep)
**Tech Stack**: Angular 21 + hydra Tag API + File SDK + Material
**Trim-on-creep signal**: Any deliverable that balloons beyond 4h execution time OR requires platform/schema changes is deferred to v1.4 and logged in phase SUMMARY with "defer to v1.4" note.

---

### Phase 22: Form Template Library

**Goal**: Let buyers save, reuse, fork, and manage form templates across RFPs. New `FormTemplate` schema class with draft/published/archived lifecycle, auto-draft on first field, and RFP wizard pre-fill integration.

**Depends on**: Phase 16 FormBuilderConfig model (shipped v1.2), Phase 21 Org Documents Center (coordinate surface integration)

**Requirements**: FT-01, FT-02, FT-03, FT-04, FT-05, FT-06, FT-07, FT-08, FT-09

**Success Criteria** (what must be TRUE):
  1. Users can save a completed FormBuilderConfig as a named, org-scoped template via explicit Save action
  2. Creating a new form auto-creates a `status: draft` FormTemplate record immediately (debounced autosave thereafter); no explicit "Save" step required to persist in-progress work
  3. RFP wizard Step 2.5 displays "Pick from library" button; selecting a published template pre-fills form fields
  4. `/forms/templates` page lists drafts (pinned at top), published, and archived templates with search/filter by name, status, owner
  5. Editing a published template prompts "Save-as-New-Version" (forks) vs "Overwrite" (owner-only, blocked when RFPs reference the version)
  6. Forking preserves `parentTemplateId` pointer (fork lineage visible)
  7. Usage count increments when a template is selected in the RFP wizard
  8. Org Documents Center surfaces recent form templates as a section (or link to `/forms/templates`)
  9. Schema PR merged to `zerobias-org/schema:dev` with CI SUCCESS (not SKIPPED), both `classes/*.yml` and `fields/*.yml` present, no self-merge

**Plans**: TBD

**Effort**: 22–32 hours
**Tech Stack**: Angular 21 + Pipeline + GraphQL + zerobias-org/schema (cross-fork PR)
**Blocking gate**: Schema PR must achieve CI SUCCESS (not SKIPPED) and merge to dev branch before feature code can ship. No self-merge allowed.
**Fire-and-Forget Discipline**: User-triggered writes (save, fork, archive) must `await` + surface errors; background usage-counter increments can stay fire-and-forget (per Phase 20 guidance).

---

### Phase 23: Transparency Controls: UI-SPEC Lock + Opportunistic Implementation

**Goal**: Lock the Transparency Controls UI specification (UI-SPEC.md, GSD format), produce low-fidelity wireframes, research which backend capabilities are required vs available, and opportunistically implement if the spec can be satisfied by existing marketplace entities. Otherwise, defer implementation to v1.4 with a clear backlog entry.

**Depends on**: None (UI-ahead-of-backend approach; research determines dependencies)

**Requirements**: TC-01, TC-02, TC-03, TC-04, TC-05

**Success Criteria** (what must be TRUE):
  1. UI-SPEC.md is locked (GSD format, no open questions remaining); all 8 draft questions from the sketch session have resolved answers
  2. Low-fidelity wireframes produced for all 5 concept views from the red-box markups and sketch session
  3. Research report documents which backend capabilities Transparency Controls depend on (CE4 task entanglement, subtask rollups, etc.) and which exist today; Kevin's clarification ("TC is a FUNCTION, not a place") informs integration points
  4. If implementation is doable this phase against existing marketplace entities (e.g., Engagement detail or Project detail views), at least one Transparency Control surface ships with verified UAT flow
  5. If implementation deferred to v1.4, BACKLOG entry added (or backlog 078 updated) with clear implementation plan and why deferral was necessary

**Plans**: TBD

**Effort**: 4–6 hours if spec-only; more if implementation proves doable
**Tech Stack**: Angular 21 (UI only this phase, no backend changes)
**Origin**: Plan 078, partially started. Brian 2026-03-27 direction + Kevin 2026-04-15 clarification.

---

### Phase 24: Demo Data Visibility Gate

**Goal:** Non-admin users see only production data; admins retain full demo visibility and deletion capability

**Depends on:** None (independent)

**Requirements:** DG-01, DG-02, DG-03, DG-04, DG-05

**Success Criteria** (what must be TRUE):
  1. Demo-seeded records carry Object.tag with demo-seed UUID at ingest time
  2. Core listing/search services apply `.ne.` GQL filter on demo-tag for non-admin users
  3. Admin users (`getPrincipal().isAdmin === true`) see all records including demo data without filtering
  4. Admin delete-demo action bulk-marks all demo-tagged records as deleted and clears hydra Resources
  5. Unit tests verify three gate scenarios: admin-sees-demo, non-admin-filtered, admin-delete

**Plans:** TBD

**Estimates:** 4-6 hrs

---

### Phase 25: Platform Data Audit

**Goal:** Document all ZeroBias SDK data sources available for pre-filling onboarding forms (research-as-phase)

**Depends on:** None (independent, but informs Phase 28 pre-fill map)

**Requirements:** PDA-01, PDA-02, PDA-03, PDA-04, PDA-05

**Success Criteria** (what must be TRUE):
  1. `PLATFORM-DATA-INVENTORY.md` created at `.planning/director/` with structured SDK inventory
  2. Minimum 9 data-source sections documented with sample responses and field lists
  3. Pre-fill map table covers every field in Phase 28 company-profile form
  4. Known-unknown list identifies fields needing user input or LLM enrichment
  5. Pipeline health check confirms current pipeline receiver is live on UAT

**Plans:** TBD

**Estimates:** 4-6 hrs (research-heavy, no app code)

**UI hint**: no

---

### Phase 26: Seed Provider (ZB-as-Provider)

**Goal:** Create ZeroBias as a visible provider in SME Mart with proper data conventions

**Depends on:** Phase 25 (company_info convention informs seed structure)

**Requirements:** SP-01, SP-02, SP-04, SP-05, SP-06

**Success Criteria** (what must be TRUE):
  1. `COMPANY-INFO-CONVENTION.md` exists and is referenced by Phase 28 brief
  2. ZeroBias appears as a provider in SME Mart UI (Browse Providers view lists it)
  3. All seeded records carry appropriate Object.tag (platform-provider for ZB, sme-mart.eng.w3geekery-default-zb for default-engagement records)
  4. Walkthrough residue TAG-SHAPE-TEST-C cleaned up via markDeleted
  5. Unit tests for seed function and Browse Providers rendering

**Plans:** 4/4 plans complete

**Estimates:** 5-7 hrs

**UI hint**: yes

---

### Phase 27: Auth Gate + Onboarding Routing + Lazy Guard

**Goal:** Authenticate users, route to onboarding or board based on profile state, auto-create default ZB engagement

**Depends on:** Phase 24 (demo gate must exist before routing real users through auth flow)

**Requirements:** AR-01, AR-02, AR-03, AR-04, AR-05, AR-06

**Success Criteria** (what must be TRUE):
  1. Unauthenticated users redirected to branded login URL on any SME Mart route
  2. Post-auth routing routes unconfirmed profile to Phase 28 form, confirmed profile to Phase 30 board
  3. Lazy-on-load guard queries default ZB engagement; creates it via bootstrap recipe if missing; idempotent on retry
  4. Guard failure surfaces user-friendly error + retry option, no crashes
  5. Admin users skip onboarding form and go directly to admin dashboard
  6. Object.tag populated at ingest time for both new Engagement and SmeMartProject with validated shape

**Plans:** TBD

**Estimates:** 8-12 hrs

**UI hint**: yes

---

### Phase 28: Company Profile Review/Confirm Form

**Goal:** Users review and confirm their organization's compliance profile pre-populated from platform data

**Depends on:** Phase 25 (pre-fill map) + Phase 26 (company_info convention)

**Requirements:** CP-01, CP-02, CP-03, CP-04, CP-05, CP-06, CP-07, CP-08

**Success Criteria** (what must be TRUE):
  1. Form renders every field in the company_info convention
  2. Pre-fillable fields populated on mount from correct SDK/GQL source per Phase 25 map
  3. Known-unknown fields show "please provide" indicator with optional hint text
  4. Save writes all confirmed values to platform via Phase 25-mapped endpoint(s)
  5. Post-save, onboarding-complete marker set for current user+org
  6. Skip-for-now escape routes to Phase 30 WITHOUT setting complete marker
  7. Subsequent logins with complete marker → Phase 27 routes directly to Phase 30
  8. Unit tests cover pre-fill, save, skip, repeat-login-skip flows

**Plans:** TBD

**Estimates:** 6-10 hrs

**UI hint**: yes

---

### Phase 29: DEFERRED TO v1.5

**Tier Display / Terms of Service / ZB Branding**

This phase is intentionally deferred from v1.4. When v1.5 begins, Phase 29 work will proceed. No work happens in v1.4.

- Pricing tier display on default project board
- Terms of Service / Privacy / legal-doc link surfaces
- ZB branding (logo, tier-specific styling) — Brian-ask content

---

### Phase 30: Default Project Board + Coming Soon Placeholders

**Goal:** Authenticated onboarded users land on a seeded project board with honest "Coming Soon" placeholders for unfinished features

**Depends on:** Phase 26 (seeded project content) + Phase 27 (routing) + Phase 28 (onboarding marker)

**Requirements:** PB-01, PB-02, PB-03, PB-04, PB-06, PB-07

**Success Criteria** (what must be TRUE):
  1. Authenticated onboarded users land on default project board route per Phase 27 routing
  2. Default project content (name, description, SmeMartProject widgets) renders for seeded default project
  3. Three "Coming Soon" surfaces exist as components + routes (Org Documents 046, Engagement Dashboard 066, Message Center 065)
  4. Coming Soon surfaces reachable from board AND deep-linkable
  5. No half-built functional UI in the three Coming Soon surfaces — honest placeholders only
  6. Unit tests for board + each placeholder component rendering

**Plans:** TBD

**Estimates:** 6-8 hrs

**UI hint**: yes

---

### Phase 31: W3Geekery Dogfood + Production Smoke Test

**Goal:** Validate end-to-end workflow and production readiness

**Depends on:** All prior phases (24-28, 30)

**Requirements:** V14-01, V14-02, V14-03, V14-04, V14-05

**Success Criteria** (what must be TRUE):
  1. UAT smoke walkthrough executed end-to-end; `v1.4-smoke-test-report.md` exists
  2. All 6 active phases (24, 25, 26, 27, 28, 30) have pass/fail verdict in report
  3. Any blockers have errata filed + hotfix phase queued
  4. Production promotion checklist exists as separate director brief
  5. Friction log populated honestly — not a "everything's fine" whitewash

**Plans:** TBD

**Estimates:** 4-6 hrs

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 13. Pilot Projects | 2/2 | Complete    | 2026-04-02 |
| 14. Invitation Controls | 3/3 | Complete    | 2026-04-08 |
| 15. Document Templates | 3/3 | Complete    | 2026-04-10 |
| 16. Form Builder | 5/5 | Complete    | 2026-04-14 |
| 17. Demo Seed Scripts | 1/1 | Complete    | 2026-04-15 |
| 18. Org Switcher | 5/5 | Complete    | 2026-04-16 |
| 19. zbb Local Dev Stacks | 4/4 | Complete    | 2026-04-17 |
| 20. Fire-and-Forget Audit | 0/? | Not started | — |
| 21. Org Documents Center | 0/? | Not started | — |
| 22. Form Template Library | 0/? | Not started | — |
| 23. Transparency Controls UI-SPEC | 0/? | Not started | — |
| 24. Demo Data Visibility Gate | 0/? | Not started | — |
| 25. Platform Data Audit | 3/5 | In progress | 2026-04-24 (Plans 01-03 complete) |
| 26. Seed Provider (ZB-as-Provider) | 4/4 | Complete   | 2026-04-28 |
| 27. Auth Gate + Routing | 0/? | Not started | — |
| 28. Company Profile Form | 0/? | Not started | — |
| 29. DEFERRED TO v1.5 | — | Skipped | — |
| 30. Default Project Board | 0/? | Not started | — |
| 31. W3Geekery Dogfood + Smoke Test | 0/? | Not started | — |

**v1.2 Milestone:** 5/5 phases complete, 14/14 plans complete (closed 2026-04-15).
**v1.3 Milestone:** 6 phases total (18-23), 35 requirements, ~80–90 hrs estimated. Phases 18-19 complete (2026-04-17), phases 20-23 not started.
**v1.4 Milestone:** 7 phases total (24-28, 30-31; phase 29 deferred), 38 requirements, ~37-55 hrs estimated. All phases not started. Phase 29 intentionally skipped.

---

**Created:** 2026-03-17
**Last Updated:** 2026-04-24 (v1.4 ROADMAP complete)
