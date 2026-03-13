# Plan: SME Mart Angular Rebuild

**Last updated:** 2026-03-12 (049 complete, 048 complete)

> **Reference:** [Hierarchy Model](hierarchy-model.md) — Org → Engagement → Project → Boundary mapping, Notes scoping, permissions model, CEO/CIO directive reconciliation.

## Status

**Phases 1–4 complete. Phase 5 in progress (Plans 015–039).**

| Phase | Status | Plan File |
|-------|--------|-----------|
| 1 — Project Scaffolding & Core Infrastructure | **Complete** | (inline below) |
| 2 — Database Layer (Generic SQL Hub Module) | **Complete** | (inline below) |
| 3 — Service Layer | **Complete** | [`.claude/plans/local/phase-3-service-layer.md`](../local/phase-3-service-layer.md) |
| 4 — Marketplace & Profiles | **Complete** | [`.claude/plans/local/phase-4-marketplace-profiles.md`](../local/phase-4-marketplace-profiles.md) |
| 5 — Engagements & Admin | **In Progress** | Plans 015–039 below |
| 6 — ngx-library Re-skin & Polish | Pending | TBD |
| 7 — Deployment | Pending | TBD |

### Phase 5 Sub-Plans

| # | Plan | Status | File |
|---|------|--------|------|
| 015 | Navigation & Taxonomy Restructuring | **Complete** | [`015-navigation-taxonomy-restructuring.md`](../local/015-navigation-taxonomy-restructuring.md) |
| 016 | ~~Engagement Messages Tab~~ | **Deprecated** (superseded by Timeline) | [`016-engagement-messages-tab.md`](../local/016-engagement-messages-tab.md) |
| 017 | Engagement Tasks Tab | **Complete** | [`017-engagement-tasks-tab.md`](../local/017-engagement-tasks-tab.md) |
| 018 | Engagement Activity Center (Timeline) | **Complete** | [`018-engagement-activity-center.md`](../local/018-engagement-activity-center.md) |
| 019 | Markdown Components (Milkdown Crepe + Renderer) | **Complete** | [`019-markdown-components.md`](../local/019-markdown-components.md) |
| 020 | ~~Adaptive Assessments (Provider Vetting)~~ | **Cancelled** — ZB platform feature per Joe's clarification (2026-02-25) | [`020-adaptive-assessments.md`](../local/020-adaptive-assessments.md) |
| 021 | ~~Credential Verification (Credly)~~ | **Cancelled** — ZB platform feature per Joe's clarification (2026-02-25) | [`021-credential-verification.md`](../local/021-credential-verification.md) |
| 022 | Project Layer (Engagement → Project → Task hierarchy) | **Stub** — Engagement=corp-to-corp wrapper, Project=scoped work. Needs ZB platform Project entity. | [`022-project-layer.md`](../local/022-project-layer.md) |
| 023 | Transparency Center (3-View Architecture) | **Stub** — needs project layer + subtask types | [`023-transparency-center.md`](../local/023-transparency-center.md) |
| 024 | Readiness & Scoring | **Stub** — Dan is building the Readiness Center; depends on 023, ZB extended user profile | [`024-readiness-scoring.md`](../local/024-readiness-scoring.md) |
| 025 | ZB Platform Feature Requests | **Living doc** — track requests for Kevin/Chris | [`025-zb-platform-feature-requests.md`](../local/025-zb-platform-feature-requests.md) |
| 026 | Notes Feature | **Complete** | [`026-notes-feature.md`](../local/026-notes-feature.md) |
| 027 | OneNote-Style Togglable Column Layout | **Complete** — notes column toggles (child of 026) | [`027-onenote-style-notes-layout.md`](../local/027-onenote-style-notes-layout.md) |
| 028 | Drag-and-Drop for Folders & Notes | **Complete** — HTML5 drag-drop (child of 026) | [`028-dnd-folders-notes.md`](../local/028-dnd-folders-notes.md) |
| 029 | Hierarchical Tag Naming Convention | **Complete** — `sme-mart.` prefix convention in SmeMartResourceService | [`029-hierarchical-tag-naming.md`](../local/029-hierarchical-tag-naming.md) |
| 030 | SmeMartResource Abstraction Layer | **Complete** — service, mappers, unified interface | [`030-sme-mart-resource-abstraction.md`](../local/030-sme-mart-resource-abstraction.md) |
| 031 | Document Upload to Engagement | **Complete** — upload UI, Neon catalog, graceful FileService degradation | [`031-document-upload-to-project.md`](../local/031-document-upload-to-project.md) |
| 032 | RFP Creation Wizard | **Complete** — wizard scaffold, all 5 steps, requirements editor, JSON import, tag + publish flow, LLM prompt templates, method chooser, integration tests (16 passing). | [`032-rfp-creation-wizard.md`](../local/032-rfp-creation-wizard.md) |
| 033 | Vendor Bid Response Flow | **Phases 1–4 complete** — extended bid model, per-requirement responses, compliance progress, buyer-side comparison + review. Phase 5 (LLM-assisted bid generation) pending. | [`033-vendor-bid-response.md`](../local/033-vendor-bid-response.md) |
| 034 | GQL Schema Migration (AuditgraphDB) | **Phases 1–3 done** — PR #3 open on zerobias-org/schema, awaiting review by Daniel Rojas | [`034-gql-schema-migration.md`](../local/034-gql-schema-migration.md) |
| 035 | Engagement Tab Routes Refactor | **Complete** — child routes replace query params | [`035-engagement-tab-routes.md`](../local/035-engagement-tab-routes.md) |
| 036 | RFP / Engagement Route Split | **Complete** — separate RFP detail from engagement detail | [`036-rfp-engagement-split.md`](../local/036-rfp-engagement-split.md) |
| 037 | ZB Resource Tag Editor Component | **Complete** — sme-resource-tag-editor + resource-tags-panel + autocomplete | [`037-zb-resource-tag-editor.md`](../local/037-zb-resource-tag-editor.md) |
| 038 | Document-Notes Cross-Linking | **Complete** — all 5 phases done. sme-doc:// links, chooser dialog, marked renderer, toolbar button, notes search by doc link with filter banner. | [`038-document-notes-cross-linking.md`](../local/038-document-notes-cross-linking.md) |
| 039 | Tag Prefix Migration (ENG- → sme-mart.) | **Complete** — utils, service, pipe, tests (79 passing) | [`039-tag-prefix-migration.md`](../local/039-tag-prefix-migration.md) |
| 040 | Project Bloom (AI Document Decomposition) | **Draft** — accepted Bid → Engagement (corp-to-corp) + Project created → AI decomposes uploaded docs into typed task/subtask tree (~39 tasks, ~200 subtasks). Transparency Center activates. | TBD |
| 041 | Supply-Side Vendor Profile (One-Time Load) | **Concept** — vendors load corporate docs, D&B, banking, background checks once. Pre-fills engagement requirements for every bid. "Programmatic buy, sell." | TBD |
| 042 | Project Plugin (MCP + Templates + Parsers) | **Concept** — bundled plugin: MCP skills, document parsers, task type templates, questionnaire flow. AI generates structured projects. Dual-path: legacy doc ingestion + native creation. | TBD |
| 043 | Proposal-to-Bid Rename Migration | **Complete** — all 8 phases done: models, services, mappers, components, routes, database (table+VIEWs+enum), plans, GQL schema. | [`043-proposal-to-bid-rename.md`](../local/043-proposal-to-bid-rename.md) |
| 044 | Playwright E2E Smoke Tests | **Backlog** — convert Chrome DevTools MCP smoke tests (`.claude/smoke-tests/`) to Playwright specs for unattended CI-capable regression testing. ~1-2 hrs for first spec (RFP wizard). | TBD |
| 045 | ~~RFP Document Chooser~~ | **Superseded** by Plan 046 Phase 4 (OrgDocumentChooser with scope filtering) | — |
| 046 | Org-Level Document Management | **Phases 1–5 complete, 7 complete** — OrgDocumentService, file manager UI, sharing + visibility, OrgDocumentChooser, org tabs, tests. Phase 6 (org switcher) deferred. Phase 8 (external storage imports) deferred. Phase 9 roadmap: folders, colors, tagging UI, archive browser, versioning, PDF conversion, preview, bulk ops, templates. | [`046-org-document-management.md`](../local/046-org-document-management.md) |
| 047 | Shared Notes & Versioning | **Draft** — per-user sharing, note versioning (with version browser/search/copy), Shared Notebook, timeline integration (share/pin events), pinned notes, task-linked checkboxes (read-only status reflection). 32–40 hrs across 8 phases. | [`047-shared-notes-and-versioning.md`](../local/047-shared-notes-and-versioning.md) |
| 048 | Notification Center | **Complete** — in-app notification system modeled on ZB UI `CardsService` / `zb-cards` pattern. Bell icon, unread badge, MatMenu dropdown panel, card types, severity, dismiss/read. Fire-and-forget triggers on bid/engagement/rfp actions. 94 tests. Neon-backed initially, designed for seamless migration to ZB platform CardService. | [`048-notification-center.md`](../local/048-notification-center.md) |
| 049 | Unit Testing Strategy | **Complete** — 33 spec files, 456 tests passing. Shared test-helpers (factories, mocks, constants). All specs refactored to use shared infrastructure. | [`049-unit-testing-strategy.md`](../local/049-unit-testing-strategy.md) |

### What's built (Phases 1–4)

**Infrastructure (P1):** Angular 21.1.4 CLI project, standalone bootstrap, SDK + ngx-library wired, M3 theme, proxy configs (CI/QA/Prod), auth via `AppInitService`, app shell with Material toolbar + nav.

**Data layer (P2):** `SmeMartDbService` — DataProducer client connection to Neon via Generic SQL Hub Module, CRUD operations, 6 Neon VIEWs for consolidated reads.

**Service layer (P3):** 10 services (catalog, user-preferences, provider-profiles, service-offerings, work-requests, bids (was proposals), engagement-lifecycle, reviews, categories, admin) + 8 model files.

**Marketplace & Profiles (P4):**
- **Pages:** Home (hero + search + categories + featured), ProviderList (card grid + 6-type catalog filters + search + sort + mobile drawer), ProviderDetail, ServiceCatalog, MyProfile (overview/expertise/services/reviews with sidebar nav)
- **Shared components:** ProviderCard, ServiceCard, StarRating, UserProfileDropdown, CatalogFilters, CatalogFilterSection, FilterEnabler
- **Routes:** `/`, `/services`, `/rfps`, `/rfps/:id`, `/providers` (footer link), `/providers/:id`, `/my/engagements` (lazy, user dropdown), `/my-profile/*` (lazy), `/admin/*` (lazy)

**Engagements & Admin (P5 — in progress):**
- **Engagement Detail:** Layout shell with child routes (`/rfps/:id/overview|details|tasks|timeline`) using `mat-tab-nav-bar` + `<router-outlet>`. `EngagementContextService` shares engagement data between parent and tab components. RFP view (no engagement_tag) remains inline, no tabs.
- **Tasks Tab:** TaskListPanel + TaskCard with ZB platform status transition menus (Action → Status Chip), CreateSubTaskDialog with Milkdown editor, initial transitions support
- **Timeline Tab:** TimelineView with color-coded event type icons (28px nodes), month dividers, TimelineEventCard with markdown rendering, TimelineComposer with Milkdown rich editor
- **Markdown Components:** MarkdownView (read-only, `marked`-based), MarkdownEditor (Milkdown Crepe wrapper with static toolbar — bold, italic, strike, headings, lists, code, links, tables)
- **Services:** EngagementTasksService, EngagementTimelineService (ZB Tasks + Boundary Events APIs)
- **Global styles:** `.task-status-chip` with ZB platform color palette, `.transition-row` / `.transition-menu` for CDK overlay menus

## Marketplace Roadmap (Brian, 2026-03-03; updated 2026-03-06 taxonomy + project plugin)

Brian defined a 3-phase marketplace build-out. Updated 2026-03-06 with:
- **Taxonomy overhaul:** "Proposal" removed from vocabulary. Vendor response = **Bid**. RFP = Request for **Project**.
- **Engagement/Project hierarchy:** Engagement = corp-to-corp wrapper (D&B, banking, officer checks, MSA). Project = scoped work under an Engagement. One Engagement → many Projects.
- **Project plugin concept:** Bundled MCP + templates + parsers for AI-driven project creation.
- **CDPH RFP validation:** Real 17-document government RFP confirmed the architecture (see [`.claude/notes/cdph-rfp-analysis.md`](../../notes/cdph-rfp-analysis.md)).

**Key insight:** The RFP is a lightweight storefront listing. The full task/subtask decomposition "blooms" only AFTER a Bid is accepted and the Project is created under an Engagement.

```
Engagement (corp-to-corp) ← set up once per vendor/buyer relationship
  |-- D&B, banking, officer background checks, MSA (optional umbrella)
  |-- Bidirectional: buyer AND vendor have requirements at this level
  |
  |-- Project (scoped work) ← created when Bid is accepted
      |-- Tasks / SubTasks (AI-decomposed from RFP documents)
      |-- MSA (optional, project-scoped)
      |-- Deliverables, milestones

Lifecycle:
  RFP (storefront)     →    Bid (vendor response)    →    Engagement + Project (bloom)
  ---                        ---                           ---
  Upload documents           Approach narrative             Engagement: corp vetting (if new)
  AI suggests domain tags    Price + timeline               Project: AI decomposes docs →
  Buyer description          Team qualifications              ~39 tasks, ~200 subtasks
  Budget range               <- no subtasks exist ->       Both parties refine
  Post to marketplace                                      Transparency Center activates
```

### Phase 1 — RFP + Bid + Engagement/Project Creation (Plans 031–033, 039–042)

- **Document upload** — buyers upload procurement docs (exhibits, SOWs, budgets) to RFP (Plan 031 — complete)
- **RFP creation wizard** — lightweight: upload docs, AI suggests domain-level summary (6 typed categories: Functional, Security, Compliance, Legal, Financial, Evaluation), buyer writes description + budget range. NO subtask decomposition at this stage. (Plan 032)
- **Vendor bid flow** — vendor reads RFP description + browses uploaded documents, submits Bid: approach narrative, pricing, timeline, team qualifications. NOT responding to subtasks (they don't exist yet). (Plan 033)
- **Bid negotiation** — demand-side accept/reject/request changes loop (Plan 033)
- **Engagement creation** — accepted Bid triggers Engagement (corp-to-corp vetting: D&B, banking, officer checks). May already exist if corps have worked together before. (Plan 022)
- **Project bloom** — Project created under Engagement → AI decomposes uploaded documents into full typed task/subtask tree (~39 tasks, ~200 subtasks for a complex RFP). Both parties review and refine. Transparency Center activates. (Plan 040)
- **Supply-side vendor profile** — vendors pre-load corporate docs, D&B, banking, background checks once. Auto-fills engagement requirements for every bid. (Plan 041)
- **Project plugin** — bundled MCP + templates + parsers. Dual-path: ingest legacy docs OR AI-driven questionnaire for native project creation. (Plan 042)

### Phase 2 — Engagement Execution (future plans)

- **Demand/supply view filtering** — role-based visibility of task data (buyer sees requirements, provider sees obligations, shared = transparency)
- **Task status state machine** — pending -> in_progress -> awaiting_approval -> completed
- **Task approval workflow** — vendor completes -> demand reviews -> approve/reject per subtask
- **Evidence/artifact linking** — provider attaches certs, audit reports, policies to specific subtasks
- **Invoice generation** — auto-generate on approval with line items per task/subtask
- **Progress indicators** — domain-level rollups (e.g., "Security: 78%, Compliance: 92%") + on-track/behind/ahead
- **Scope adjustment** — formal change request process with audit trail
- **~~Compliance standard references~~** — ZB platform strength; framework mapping + evidence collection handled natively. SME Mart just connects engagements to boundaries.

### Phase 3 — Observability + Audit (Plans 023, future)

- **Transparency center** — shared audit trail visible to both parties + 3rd-party assessors/insurers (Plan 023, blocked by ZB-1/ZB-2/ZB-3)
- **Readiness scoring** — subtask completion rolls up to domain-level readiness (depends on ZB Scoring App)
- **C-Traces** — cognitive traces for agent decisioning context
- **Compliance tracking** — data classification (PII/CUI/HIPAA) with access logging
- **Living documentation** — meetings surface tasks, engagement docs evolve

### CDPH RFP Reference (2026-03-06)

The CDPH HBEDS RFP (`.claude/references/CA Department of Public Health RFP/`) is the gold-standard reference for demand-side architecture. Key metrics from full decomposition:

| Metric | Value |
|--------|-------|
| Documents in RFP | 17 (7 exhibits + 4 attachments + master RFP + datasets) |
| Domain types needed | 6 (Functional, Security, Compliance, Legal, Financial, Evaluation) |
| Top-level tasks | ~39 |
| Total subtasks | ~200 |
| Data elements (Exhibit A2) | 78 CDC/NHSN fields |
| Compliance standards referenced | NIST SP800-53, OWASP ASVS, FIPS-140, HIPAA, PCI DSS, FIDO2 |

Full analysis: [`.claude/notes/cdph-rfp-analysis.md`](../../notes/cdph-rfp-analysis.md)

### Gaps Identified from CDPH RFP Analysis (2026-03-06)

| Gap | Priority | Affects Plan | Notes |
|-----|----------|-------------|-------|
| **Structured pricing model** | High | 033, 040 | Bids need recurring + one-time + tiered pricing fields (e.g., quarterly per-facility subscription + onboarding fee + 5-year projections). Current bid model is free-text only. |
| **Bidder qualification profiles** | Medium | 033 | Exhibit G requires past performance references, key personnel bios, org charts, similar project experience. Provider profile needs structured quals beyond free-text. Individual certs deferred to ZB platform (Plan 021 cancelled). |
| **Timeline/milestone tracking** | Medium | 040 | RFPs have hard dates (implementation deadlines, go-live milestones). Engagements need milestone entities with date tracking + status. |
| **Exhibit overlap detection** | Low | 040 | ~30% overlap between CDPH Privacy (Exhibit E) and Security (Exhibit F) requirements. AI decomposition should cross-reference and deduplicate during bloom. |
| **Multi-facility/scope support** | Low | 032 | CDPH covers 105 hospitals across 27 counties. RFP scope may span multiple facilities — engagement model currently assumes one-to-one buyer/provider. |
| **Supply-side vendor profile (one-time load)** | High | 041 | Vendors need to load corporate docs, D&B, banking, background checks once and pre-fill for every engagement. Currently no vendor profile entity beyond provider_profiles. (2026-03-06) |
| **Bidirectional requirements model** | Medium | 022, 041 | Both buyer and vendor have requirements at Engagement and Project levels. Need a generic "requirements" concept that flows in both directions, not just demand→supply. (2026-03-06) |
| **Engagement-level corp vetting** | High | 022 | D&B rating, banking info, officer background checks, C Corp/LLC verification, financial statements. Currently no engagement-level requirements model — all requirements are at task level. (2026-03-06) |
| **~~Compliance standard linking~~** | ~~Low~~ | N/A | ZB platform strength — framework mapping + evidence collection handled natively. Not an SME Mart concern. |

### Platform Alignment Roadmap

Items to align SME Mart with the ZeroBias platform for eventual migration:

| Item | Priority | Status | Notes |
|------|----------|--------|-------|
| **GQL Schema Package** | High | **PR #3 open** (Phases 1–3 done, awaiting Daniel Rojas review) | 7 classes, 21 fields, 5 enums in `zerobias-org/schema` — Plan 034. Entities: Engagement, Bid, ServiceOffering, Review, Note, NoteFolder, SmeMartDocument. **Note:** Bid entity replaces Proposal; Engagement/Project hierarchy may require schema restructure. See [howto](.claude/notes/zb-graphql-custom-schema-howto.md), [internals](.claude/notes/zb-graphql-schema-extension-guide.md) |
| **Task-backed Reviews** | Medium | Planned | Reviews use ZB Task approval workflow instead of custom status field |
| **`@zerobias-org/types-core-js` — PagedResults\<T\>** | Low | Evaluate | Replace custom pagination wrappers with `PagedResults<T>` from `@zerobias-org/types-core-js`. Also evaluate error classes (`NotFoundError`, `ConflictError`, etc.) for service layer. Note: requires Node 22+ ESM — verify Angular 21 build compat first. No `Decimal` type available (blocker for financial amounts). Full comparison: [`.claude/notes/zerobias-org-types-comparison.md`](.claude/notes/zerobias-org-types-comparison.md) |
| **~~`zerobias-org/tag` audit~~** | ~~Low~~ | **N/A** | Repo is empty (no commits, no files). No canonical tag taxonomies exist yet. |
| **Document / Service Offering** | Pending | Blocked on Kevin | Kevin says "covered" by platform — need clarification on whether these are existing ZB types or defined via GQL schema extension |

### Key Architecture Decisions (2026-03-03; updated 2026-03-06)

| Decision | Detail |
|----------|--------|
| **Engagement/Project hierarchy** | Engagement = corp-to-corp wrapper (D&B, banking, officer checks, entity verification, optional umbrella MSA). Project = scoped work under Engagement. One Engagement → many Projects. Analogues: Fed gov "Facility", Deel "Contract". (2026-03-06) |
| **Terminology** | RFP = Request for Project. Vendor response = Bid (NOT Proposal). "Proposal" removed from vocabulary. (2026-03-06) |
| **Bidirectional requirements** | Both buyer AND vendor have requirements at Engagement and Project levels. Vendor needs: tech lead, AP contact, support contacts. Not a one-way street. (2026-03-06) |
| **MSA flexibility** | MSA can attach at Engagement level (umbrella) OR Project level (scoped). Not hardcoded to one. (2026-03-06) |
| **RFP → Bid → Project (phased bloom)** | RFP is lightweight storefront (docs + description + budget). Accepted Bid triggers Engagement (if new corp relationship) + Project creation. AI then decomposes uploaded docs into full typed task/subtask tree. Both parties refine before execution begins. |
| **Project plugin** | Bundled MCP skills + document parsers + task type templates + questionnaire. Dual-path: legacy doc ingestion AND native AI-driven creation. "Build for the new world, support the old world." (2026-03-06) |
| **Supply-side one-time profile** | Vendors load corporate docs/D&B/banking/background checks once. Pre-fills for every engagement. "Programmatic buy, sell." (2026-03-06) |
| **Task status lifecycle** | pending → in_progress → awaiting_approval → completed |
| **Approval gates billing** | Demand-side must approve before invoice generation |
| **Three-sided visibility** | Demand (requirements + status), Supply (execution + internal notes), Shared (audit trail) |
| **Scope adjustment** | Formal change request with audit trail (original → proposed → agreed) |
| **Data classification** | PII/CUI/HIPAA/confidential — affects access control + audit logging |
| **Platform realization** | Vendor → Org. Service offering → Boundary. Owner → Principal (org or user). Per Kevin. (2026-03-06) |

---

## Context

SME Mart was prototyped as a Next.js 15 app (React 19, MUI, Drizzle ORM, direct Neon PostgreSQL). The prototype validated the marketplace concept and has grown substantially. The direction is now to **rebuild as an Angular app** that:

1. **Uses `@zerobias-org/ngx-library`** — the new ZeroBias Angular component library for theme and shared components
2. **Uses `@zerobias-com/zerobias-angular-client`** — wraps `zerobias-client` → wraps `zerobias-sdk` (the master entry-point for all ZeroBias SDKs)
3. **Plain Angular CLI** — no Nx; standard `ng serve`, `ng build`, `angular.json`
4. **Accesses Neon PostgreSQL via Generic SQL Hub Module** — DataProducer interface over JDBC, not direct Drizzle ORM (solves credential security)
5. **Deploys as a platform app** — served from S3, embeddable in portal via iframe

This makes SME Mart a first-class ZeroBias platform application with consistent UX, shared audit trail, and proper access control — rather than an external app bolted on.

### Skills

Invoke the **`sme-mart-architect`** project skill (`.claude/skills/`) for implementation work — it encodes all SME Mart-specific Angular conventions (standalone components, ngx-library usage, DataProducer patterns, no Nx). Use the global **`/angular-architect`** skill for general Angular 21 architecture questions not specific to this project.

### Portal Integration — Deferred

SME Mart Angular is being built as an **"Outside Vendor" app** — as if a ZeroBias customer is building their own custom application on the ZeroBias SDK, client libraries, and Angular theme/components. It is **NOT** a portal-embedded iframe app at this stage.

**What this means:**
- **No postMessage integration** — no `APP_NAV`, `APP_READY`, `APP_CURRENT_ORG_ID` handling
- **No iframe assumptions** — the app runs standalone at its own URL
- **No portal navigation entry** — not registered in portal's `appUrlOrigins`
- **Own auth flow** — uses `ZerobiasClientApp.init()` directly (standalone mode with API key), not session inheritance from a parent portal
- **Own navigation** — full `AppTopBar` with routing, not delegating to portal shell

**What to do:**
- Leave `// TODO: Portal integration` comments where iframe communication would be added
- Create stub placeholder methods (e.g., `notifyPortal()` no-op) where portal sync would occur
- Follow patterns that make future portal embedding easy (e.g., configurable `baseHref`, environment-driven URLs, theme service that could accept portal theme sync)
- Keep the app self-contained — it should work fully standalone

### What Changes vs Next.js Prototype

| Concern | Next.js (before) | Angular (after) |
|---------|-------------------|-----------------|
| Framework | Next.js 15 + React 19 | Angular 21.0.9 |
| UI Library | MUI v7 | Angular Material 21 + `@zerobias-org/ngx-library` |
| State | React Context + TanStack Query | RxJS BehaviorSubjects + Services |
| Styling | SCSS Modules + MUI theme | M3 theme via ngx-library + CSS custom props |
| DB Access | Drizzle ORM → Neon (direct) | Generic SQL Hub Module → JDBC → Neon |
| Auth | Custom proxy mode + middleware API key | `ZerobiasClientApp.init()` + session inheritance |
| Build | Next.js | Angular CLI (`ng build`) |
| Deploy | Vercel | S3/CloudFront (same as portal apps) |
| Catalog | Custom `/api/catalog` proxy routes | ZeroBias SDK directly via `zerobias-angular-client` |
| API layer | Next.js API routes (server-side) | No server — all client-side via SDK + Hub Module |

### What Stays the Same

- **Neon PostgreSQL** — same database, same schema (15 tables, 6 enums)
- **ZeroBias SDK** — same platform APIs for auth, orgs, catalog, boundaries, tasks, tags
- **Marketplace concept** — providers, buyers, work requests, bids, engagements
- **NICE Framework** integration — roles, skills, knowledge for provider expertise
- **Engagement lifecycle** — RFP (storefront) → Bid Accept → Engagement Bloom (AI decomposition) with `sme-mart.` tags
- **BIP39-style tag generation** — `ENG-word-word` human-readable identifiers
- **PKV-backed preferences** — role toggle, filter persistence

---

## SDK & Package Architecture

### Dependency Chain

```
@zerobias-com/zerobias-angular-client@1.1.21  (Angular 21 DI wrappers)
  └── @zerobias-com/zerobias-client@1.1.22     (framework-agnostic client + RxJS)
       └── @zerobias-com/zerobias-sdk@1.1.17    (unified SDK — master entry-point)
            ├── @zerobias-com/dana-sdk           (auth, users, orgs, PKV)
            ├── @zerobias-com/hub-sdk            (connections, modules, scopes)
            ├── @zerobias-com/platform-sdk       (catalog, tags, boundaries, tasks)
            ├── @zerobias-com/portal-sdk         (products, navigation)
            ├── @zerobias-com/store-sdk           (key-value store)
            ├── @zerobias-com/graphql-sdk
            ├── @zerobias-com/cardservice-sdk
            ├── @zerobias-com/fileservice-sdk
            ├── @zerobias-com/scim-sdk
            ├── @zerobias-com/dataloader-sdk
            ├── @zerobias-com/*-events-sdk (3)
            └── @zerobias-org/types-core-js

@zerobias-org/ngx-library@0.2.1  (UI component library — independent of SDK)
  peers: @angular/material, @angular/cdk, @ngx-translate/core,
         ngx-infinite-scroll, @acrodata/code-editor, @codemirror/theme-one-dark
```

### Registry Configuration (`.npmrc`)

Two private registries are required:

```ini
# ZeroBias Org packages (ngx-library, types-core-js, data-utils)
@zerobias-org:registry=https://pkg.zerobias.org
//pkg.zerobias.org/:always-auth=true
//pkg.zerobias.org/:_authToken=${ZB_TOKEN}

# ZeroBias Com packages (SDK chain — angular-client, client, sdk, all sub-SDKs)
@zerobias-com:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Required env vars: `ZB_TOKEN`, `GITHUB_TOKEN`

---

## Hub Module Decision: Generic SQL vs Custom

### What Generic SQL Solves

The Generic SQL Hub Module solves the **credential security problem**: Neon PostgreSQL credentials are stored as a Hub Connection Secret (server-side, encrypted), never exposed to the browser. The Angular app authenticates via ZeroBias session, and the Hub proxies SQL queries through the DataProducer interface.

### Do We Need Our Own Hub Module?

**Reasons we might want a custom Hub Module:**

| Reason | Severity | Workaround with Generic SQL |
|--------|----------|----------------------------|
| Server-side JOINs (provider + skills + frameworks) | Medium | Multiple queries + client-side join, or Neon VIEWs |
| Business logic validation (e.g., bid acceptance rules) | Medium | Client-side validation (less secure but functional) |
| Computed fields (SME Score, response time averages) | Low | Neon VIEWs or computed columns |
| Rate limiting / abuse prevention | Low | Platform-level rate limiting |
| Custom API semantics (typed endpoints vs generic CRUD) | Low | Service layer provides typed abstraction |
| Webhook/event triggers on data changes | Low | Not needed initially |

**Recommendation: Start with Generic SQL, evaluate later.**

Generic SQL is sufficient for the marketplace MVP. The service layer in Angular provides the typed abstraction over raw DataProducer calls. If we hit limitations (complex queries, server-side validation requirements, performance), we can build a custom Hub Module later — the service layer interface stays the same, only the data access implementation changes.

**Key limitation to monitor:** DataProducer has no JOIN support. For the provider directory (which needs profile + skills + roles + products + frameworks + segments), this means 7 queries per provider list load. Neon VIEWs can consolidate this into fewer queries.

---

## Technology Stack

| Layer | Package | Version | Registry |
|-------|---------|---------|----------|
| Framework | `@angular/core` | 21.0.9 | npm |
| Material | `@angular/material` | 21.0.6 | npm |
| CDK | `@angular/cdk` | 21.0.6 | npm |
| CLI | `@angular/cli` | ~21.0.x | npm |
| TypeScript | `typescript` | 5.9.3 | npm |
| ZB Angular | `@zerobias-com/zerobias-angular-client` | ^1.1.21 | GitHub Packages |
| ZB UI Lib | `@zerobias-org/ngx-library` | ^0.2.1 | pkg.zerobias.org |
| DataProducer | `@zerobias-org/data-utils` | ^1.0.21 | pkg.zerobias.org |
| Core Types | `@zerobias-org/types-core-js` | ^1.2.18 | pkg.zerobias.org |
| RxJS | `rxjs` | ~7.8.2 | npm |
| i18n | `@ngx-translate/core` | ^15.0.0 | npm |
| Infinite Scroll | `ngx-infinite-scroll` | ^21.0.0 | npm |
| Code Editor | `@acrodata/code-editor` | ^0.6.0 | npm |

### Angular 21 Conventions

SME Mart is a **new** Angular app — we use modern Angular 21 defaults, not legacy portal patterns:

- **Standalone components** — no NgModules (Angular 21 default)
- **`inject()` function** — not constructor injection
- **Control flow syntax** — `@if`, `@for`, `@switch`
- **Signals** for reactive state where appropriate
- **Vitest** for testing
- **`@angular/build:application`** builder (esbuild-based)
- **Zone.js included** — match portal for compatibility (portal uses `provideZoneChangeDetection()`)

---

## Project Structure

```
sme-mart/
├── .claude/
│   └── plans/public/PLAN.md          # This file
├── src/
│   ├── app/
│   │   ├── app.component.ts              # Root component (standalone)
│   │   ├── app.config.ts                 # Providers (standalone bootstrap)
│   │   ├── app.routes.ts                 # Route definitions
│   │   ├── marketplace/                  # Provider browsing & search
│   │   │   ├── provider-list/            # Grid/list with catalog filters
│   │   │   ├── provider-detail/          # Full profile view
│   │   │   └── service-catalog/          # Service offerings browse
│   │   ├── engagements/                  # RFP & Engagement lifecycle
│   │   │   ├── engagement-list/          # Browse RFPs/Engagements with lifecycle toggle
│   │   │   ├── engagement-detail/        # Dual view: RFP bids OR Transparency Center
│   │   │   ├── engagement-form/          # Create/edit RFP
│   │   │   └── transparency-center/      # Overview, Details, Messages*, Files*
│   │   ├── profile/                      # Provider self-management
│   │   │   ├── my-profile/               # Edit profile (headline, about, rate)
│   │   │   ├── my-expertise/             # Manage catalog-linked expertise
│   │   │   ├── my-services/              # CRUD productized services
│   │   │   ├── my-reviews/               # View own reviews
│   │   │   └── moderate-reviews/         # Approve/reject before public display
│   │   ├── admin/                        # Admin panel
│   │   │   ├── users/                    # User management (real provider data)
│   │   │   ├── categories/               # Hierarchical category CRUD
│   │   │   ├── reviews/                  # Bulk approve/reject with search/filter
│   │   │   └── settings/                 # Registration, notifications, security toggles
│   │   ├── landing/                      # Landing page (hero, categories, featured)
│   │   ├── shared/                       # Shared components
│   │   │   ├── components/               # ProviderCard, EngagementCard, BidCard, etc.
│   │   │   ├── catalog/                  # CatalogAutocomplete, filter components (6 types)
│   │   │   ├── layout/                   # AppTopBar, UserProfileDropdown, ProfileSidebar
│   │   │   └── pipes/                    # Custom pipes
│   │   └── core/                         # Singleton services
│   │       ├── services/
│   │       │   ├── sme-mart-db.service.ts        # Generic SQL DataProducer
│   │       │   ├── provider-profiles.service.ts   # Provider CRUD (7 related tables)
│   │       │   ├── work-requests.service.ts       # RFP/engagement CRUD + lifecycle
│   │       │   ├── bids.service.ts              # Bid CRUD + acceptance workflow
│   │       │   ├── reviews.service.ts             # Reviews + moderation workflow
│   │       │   ├── categories.service.ts          # Hierarchical category CRUD
│   │       │   ├── catalog.service.ts             # ZB catalog (roles, skills, etc.)
│   │       │   ├── user-preferences.service.ts    # PKV for role/filter state
│   │       │   ├── engagement-lifecycle.service.ts # Tag generation, phase detection
│   │       │   └── admin.service.ts               # Admin stats, settings, bulk ops
│   │       └── models/
│   │           ├── provider.model.ts
│   │           ├── work-request.model.ts
│   │           ├── bid.model.ts
│   │           ├── review.model.ts
│   │           ├── category.model.ts
│   │           └── enums.ts                       # 6 enums from schema
│   ├── environments/
│   │   ├── environment.ts                # Dev config (isLocalDev: true)
│   │   └── environment.prod.ts           # Prod config
│   ├── styles.scss                       # Root styles (imports ngx-library theme)
│   ├── index.html
│   └── main.ts                           # bootstrapApplication() — standalone
├── angular.json                          # Angular CLI workspace config
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── package.json
├── .npmrc                                # Registry config (pkg.zerobias.org + GitHub Packages)
└── proxy-dev.conf.js                     # Dev server proxy → ZeroBias API
```

### Key Decisions

**Plain Angular CLI** (no Nx):
- SME Mart is a single application, not a monorepo — Nx adds complexity without benefit
- `angular.json` for config, `ng serve`/`ng build` for commands
- No `nx.json`, no `project.json`, no `@nx/*` dependencies
- Faster setup, simpler toolchain, less to maintain

**`@zerobias-org/ngx-library` for UI**:
- Re-skin all components using ngx-library's theme and component library
- Use every component available from ngx-library before building custom ones
- Consistent look-and-feel with other ZeroBias platform apps
- M3 palette: primary `#03aff0`, tertiary `#6aa84f`

**Standalone components** (not NgModules):
- Angular 21 default — cleaner, less boilerplate
- The portal uses `standalone: false` for legacy reasons; SME Mart is greenfield
- `bootstrapApplication()` with `app.config.ts` providers
- Lazy-loaded route groups for code splitting

---

## Current Next.js Feature Inventory (Migration Source)

The Next.js prototype has grown substantially. This is the complete feature set to migrate:

### Pages / Routes

| Route | Feature | Status in Next.js |
|-------|---------|-------------------|
| `/` | Landing page — hero, category cards, featured providers, search | Complete |
| `/services` | Service catalog — primary catalog, provider as facet (context menu), catalog filters | Complete |
| `/rfps` | RFP list — public RFP browse, status/sort/catalog filters, "Post an RFP" dialog | Complete |
| `/rfps/[id]` | RFP detail — bids, accept/reject/withdraw, Transparency Center scaffolded | Complete |
| `/providers` | Provider directory — card grid, catalog filters, search, sort (footer link, not in nav) | Complete |
| `/providers/[id]` | Provider detail — skills, services, reviews, contact CTA | Complete |
| `/my/engagements` | My Engagements — private, user's engagements only (lazy, user dropdown) | Complete |
| `/my/engagements/[id]` | Engagement detail — private workspace | Complete |
| `/my/engagements/[id]/edit` | Edit engagement | Complete |
| `/my-profile` | Edit provider profile (headline, about, hourly rate, availability) | Complete |
| `/my-profile/expertise` | Manage catalog-linked expertise (6 autocomplete pickers) | Complete |
| `/my-profile/services` | Manage service offerings (CRUD) | Complete |
| `/my-profile/reviews` | View own reviews | Complete |
| `/my-profile/moderate-reviews` | Provider self-moderation (approve/reject before public display) | Complete |
| `/admin` | Admin panel — 5 tabs: Users, Organizations (mock), Categories (CRUD), Reviews (bulk moderate), Settings (toggles) | Complete |

### Components

| Component | Purpose |
|-----------|---------|
| `AppTopBar` | Top navigation with branding, nav links, user dropdown |
| `UserProfileDropdown` | Avatar, role toggle (Buyer/Provider/Both), edit profile, admin, theme toggle, logout |
| `ProviderCard` | Provider card for grid listings |
| `ServiceCard` | Service offering card |
| `EngagementCard` | RFP/Engagement card with lifecycle label, bid summary |
| `BidForm` | Dialog for submitting bids |
| `BidCard` | Bid display with accept/reject/withdraw actions |
| `EngagementForm` | RFP creation/edit form |
| `CatalogFilters` / `ProviderFilters` | Catalog filter sidebar (6 filter types) |
| `FilterEnabler` | Toggle which filter categories are visible |
| `ProfileSidebar` | My-profile sidebar navigation |
| `ProfileExperienceSection` | Expertise management with catalog autocompletes |
| `CatalogAutocomplete` (base) | Reusable autocomplete for catalog items |
| `RoleAutocomplete` | NICE Work Roles (95 items) |
| `SkillAutocomplete` | NICE Skills (556 items) |
| `ProductAutocomplete` | ZeroBias Products (663 items) |
| `FrameworkAutocomplete` | Compliance frameworks |
| `SegmentAutocomplete` | Industry segments (128 items) |
| `ServiceSegmentAutocomplete` | Professional service categories (9 items) |
| `ImpersonationSwitcher` | Dev-only user impersonation |

### Key Hooks → Angular Services

| Next.js Hook | Angular Equivalent | Purpose |
|-------------|-------------------|---------|
| `useZeroBiasCatalog` | `CatalogService` | TanStack Query → RxJS observables for all 6 catalog types |
| `useFilterPreferences` | `UserPreferencesService` | PKV-backed filter state with debounced save |
| `useUserRole` | `UserPreferencesService` | PKV-backed buyer/provider/both toggle |
| `useProfile` | `ProviderProfilesService` | Profile data fetching |
| `ZeroBiasContext` | `ZbClientApiService` + app initializer | Auth state, impersonation, org switching |
| `ThemeContext` | ngx-library theme service | MUI → M3 dark/light mode |

### Database Schema (15 Tables, 6 Enums)

**Enums:** `availability_status`, `pricing_type`, `budget_type`, `request_status`, `bid_status`, `proficiency_level`

**Tables:**
- `marketplace_users` — Central identity linking to ZeroBias Dana user
- `provider_profiles` — Extended provider data (slug, headline, about, hourly rate, rating, stats)
- `provider_skills` — Links to NICE Skills (proficiency, years, verified)
- `provider_roles` — Links to NICE Work Roles (isPrimary, yearsInRole)
- `provider_products` — Links to ZeroBias Products (proficiency, certified)
- `provider_frameworks` — Links to frameworks (assessor/implementation/audit experience)
- `provider_segments` — Links to industry segments
- `provider_service_segments` — Links to professional service categories
- `service_offerings` — Productized service listings (pricing, delivery time, includes)
- `work_requests` — RFPs/engagements (engagementTag presence = engagement phase)
- `bids` — Provider bids on RFPs (cover letter, price, timeline, status)
- `reviews` — Reviews with approval workflow (approved, approvedAt, approvedBy)
- `categories` — Hierarchical marketplace taxonomy (self-referencing parent/child)
- `app_settings` — Admin-configurable key-value settings
- (marketplace_users serves as the 15th — the user identity bridge)

### Engagement Lifecycle (Fully Implemented)

```
RFP Phase                          Engagement Phase
─────────                          ────────────────
Buyer posts RFP ──→ Providers      Proposal accepted ──→ BIP39 tag generated
(work_request,      submit         (ENG-word-word)       ZeroBias Tag created
 engagementTag      proposals      work_request updated  Status → in_progress
 = null)                           with tag + tagId

UI: Proposal list                  UI: Transparency Center
    Accept/Reject/Withdraw              Overview, Details, Messages*, Files*
```

*Messages and Files are "Coming Soon" stubs — planned via ZeroBias Task Comments and Attachments.

### Features NOT Yet Implemented in Next.js

These should be planned but not prioritized for initial Angular migration:

- Dashboard pages (role-specific)
- Pagination on all list pages
- ZeroBias Boundary integration (engagement access control)
- ZeroBias Task integration (work tracking, time, deliverables)
- Messaging (ZeroBias Task Comments)
- File sharing (ZeroBias Task Attachments)
- Deliverable workflow (submit/review/revise/auto-complete)
- Direct hire flow (buyer → specific provider)
- Service packages (3-tier pricing)
- Composite reputation score (SME Score)
- Provider levels/badges
- ~~Adaptive assessments for provider vetting~~ → ~~**Plan 020**~~ Cancelled — ZB platform feature
- ~~Credly credential verification~~ → ~~**Plan 021**~~ Cancelled — ZB platform feature
- ~~Project layer (Engagement → Project → Task hierarchy)~~ → **Plan 022**
- ~~Transparency Center (3-view buyer/supplier/shared)~~ → **Plan 023**
- ~~Readiness & Scoring (provider performance)~~ → **Plan 024**
- Demo mode mock catalog (Plan 013 — not started)
- Agentic optimization & self-maintenance — AI execution scoring, drift detection, policy-aware optimization, admin AI health panel (see [`.claude/notes/agentic-optimization-concepts.md`](../../notes/agentic-optimization-concepts.md))

---

## Phase 1: Project Scaffolding & Core Infrastructure

**Umbrella task: "Set up Angular 21 project with ZeroBias platform integration"**

### 1.1 Initialize Angular CLI Project

```bash
cd /Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery
ng new sme-mart --style=scss --routing --ssr=false
```

- Configure `angular.json` with `baseHref: "/sme-mart/"`
- Set up `proxy-dev.conf.js` for dev server → ZeroBias API
- Create `.npmrc` with dual registry config
- Install `@zerobias-com/zerobias-angular-client` and `@zerobias-org/ngx-library`

### 1.2 ZeroBias Client Integration

Follow the portal's provider pattern adapted for standalone bootstrap:

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideZoneChangeDetection(),
    { provide: ZerobiasClientOrgId, useClass: ZerobiasClientOrgIdService },
    { provide: ZerobiasClientApi, useClass: ZerobiasClientApiService },
    { provide: ZerobiasClientApp, useClass: ZerobiasClientAppService },
    { provide: 'environment', useValue: environment },
    provideAppInitializer(() => {
      const initFn = initializeAppFactory(inject(ZbAppService));
      return initFn();
    }),
  ]
};
```

- Create `ZbClientApiService` extending `ZerobiasClientApiService`
- Add `getZerobiasURL()` helper for Hub URL construction
- Create environment files with `smeMartConnectionId` for Generic SQL

### 1.3 ngx-library Theme Integration

```scss
// styles.scss — exact approach TBD based on ngx-library exports
@use '@angular/material' as mat;
// Import ngx-library theme (need to inspect package exports)

html {
  color-scheme: light;
  // Apply ngx-library theme
}

body.dark-theme {
  color-scheme: dark;
  // Apply ngx-library dark theme
}
```

- Inspect `@zerobias-org/ngx-library` exports to understand available components and theme
- Use ngx-library components everywhere possible before building custom ones
- M3 palette: primary `#03aff0`, tertiary `#6aa84f`
- CSS custom properties (`--zb-*`) for runtime theming

### 1.4 Root Component & App Shell

- `AppComponent` as standalone component
- Handles postMessage communication with portal (APP_NAV, APP_READY, APP_CURRENT_ORG_ID)
- `TranslateModule` for i18n (peer dep of ngx-library)
- Navigation shell with `AppTopBar`, sidebar, role-aware routing

---

## Phase 2: Database Layer — Generic SQL Hub Module

**Umbrella task: "Integrate Generic SQL Hub Module for Neon PostgreSQL access"**

### 2.1 SmeMartDbService

Central service managing the DataProducer connection to Neon:

```typescript
@Injectable({ providedIn: 'root' })
export class SmeMartDbService {
  private client: DataProducerClient;
  public connected$ = new BehaviorSubject<boolean>(false);

  private environment = inject('environment' as any);

  async connect(targetId: UUID | string): Promise<ConnectionResult> {
    const result = await this.client.connect({
      server: getZerobiasURL('hub', true, this.environment.isLocalDev),
      targetId: this.toUUID(targetId)
    });
    this.connected$.next(result.success);
    return result;
  }

  // Generic CRUD via DataProducer collection API
  async listRows(tablePath: string, page: number, pageSize: number, filter?: string) { ... }
  async getRow(tablePath: string, id: string) { ... }
  async createRow(tablePath: string, data: Record<string, unknown>) { ... }
  async updateRow(tablePath: string, id: string, data: Record<string, unknown>) { ... }
  async deleteRow(tablePath: string, id: string) { ... }
}
```

### 2.2 Table Path Convention

```
/db:neondb/schema:public/table:provider_profiles
/db:neondb/schema:public/table:work_requests
/db:neondb/schema:public/table:bids
```

### 2.3 RFC4515 Filter Builder

For provider search/filtering:
```
(&(availability_status=available)(|(skill_name=*SOC*)(skill_name=*NIST*)))
```

### 2.4 Connection Discovery

Connection ID configured via environment variable (`smeMartConnectionId`). On startup:
1. Initialize DataProducer client with connection ID as `targetId`
2. Verify connection by listing root objects

QA connection already provisioned:
- Connection ID: `e3c874f5-5fd8-4fbc-8120-19861e28b19e`
- Boundary: "Test" (`a2262699-b182-482c-8fc3-ace298168343`)
- Status: Connection created, tags endpoint had 503 (Kevin investigating)

### 2.5 Neon VIEWs for Common Queries

Since DataProducer doesn't support JOINs, create VIEWs in Neon to consolidate multi-table reads into single queries. VIEWs are read-only through DataProducer; writes still go to individual tables. DataProducer sees VIEWs as tables at paths like `/db:neondb/schema:public/table:v_provider_directory`.

**Create these VIEWs during Phase 2 setup (non-destructive, no migration needed):**

#### `v_provider_directory` — Provider list page (replaces 7 queries with 1)

```sql
CREATE VIEW v_provider_directory AS
SELECT
  pp.*,
  -- Aggregated skills as JSON array
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', ps.id, 'zerobiasSkillId', ps.zerobias_skill_id,
      'skillName', ps.skill_name, 'proficiencyLevel', ps.proficiency_level
    )) FROM provider_skills ps WHERE ps.provider_id = pp.id),
    '[]'
  ) AS skills,
  -- Aggregated roles
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', pr.id, 'zerobiasRoleId', pr.zerobias_role_id,
      'isPrimary', pr.is_primary
    )) FROM provider_roles pr WHERE pr.provider_id = pp.id),
    '[]'
  ) AS roles,
  -- Aggregated products
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', pprod.id, 'zerobiasProductId', pprod.zerobias_product_id,
      'proficiencyLevel', pprod.proficiency_level, 'certified', pprod.certified
    )) FROM provider_products pprod WHERE pprod.provider_id = pp.id),
    '[]'
  ) AS products,
  -- Aggregated frameworks
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', pf.id, 'zerobiasFrameworkId', pf.zerobias_framework_id,
      'assessorCertified', pf.assessor_certified
    )) FROM provider_frameworks pf WHERE pf.provider_id = pp.id),
    '[]'
  ) AS frameworks,
  -- Aggregated segments
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', pseg.id, 'zerobiasSegmentId', pseg.zerobias_segment_id,
      'isPrimary', pseg.is_primary
    )) FROM provider_segments pseg WHERE pseg.provider_id = pp.id),
    '[]'
  ) AS segments,
  -- Aggregated service segments
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', pss.id, 'zerobiasServiceSegmentId', pss.zerobias_service_segment_id,
      'isPrimary', pss.is_primary
    )) FROM provider_service_segments pss WHERE pss.provider_id = pp.id),
    '[]'
  ) AS service_segments,
  -- Quick counts for cards
  (SELECT count(*) FROM provider_skills ps WHERE ps.provider_id = pp.id) AS skill_count,
  (SELECT count(*) FROM provider_roles pr WHERE pr.provider_id = pp.id) AS role_count,
  (SELECT count(*) FROM service_offerings so WHERE so.provider_id = pp.id AND so.is_active = true) AS service_count,
  (SELECT count(*) FROM reviews r WHERE r.provider_id = pp.id AND r.approved = true) AS review_count
FROM provider_profiles pp;
```

#### `v_provider_detail` — Provider profile page (profile + all expertise + services + reviews)

```sql
CREATE VIEW v_provider_detail AS
SELECT
  pp.*,
  mu.email AS user_email,
  mu.zerobias_org_id AS user_org_id,
  -- Same JSON aggregations as v_provider_directory plus:
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', ps.id, 'zerobiasSkillId', ps.zerobias_skill_id,
      'skillName', ps.skill_name, 'proficiencyLevel', ps.proficiency_level,
      'yearsExperience', ps.years_experience, 'verified', ps.verified
    )) FROM provider_skills ps WHERE ps.provider_id = pp.id),
    '[]'
  ) AS skills,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', pr.id, 'zerobiasRoleId', pr.zerobias_role_id,
      'isPrimary', pr.is_primary, 'yearsInRole', pr.years_in_role
    )) FROM provider_roles pr WHERE pr.provider_id = pp.id),
    '[]'
  ) AS roles,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', pprod.id, 'zerobiasProductId', pprod.zerobias_product_id,
      'proficiencyLevel', pprod.proficiency_level, 'yearsExperience', pprod.years_experience,
      'certified', pprod.certified, 'certificationDetails', pprod.certification_details
    )) FROM provider_products pprod WHERE pprod.provider_id = pp.id),
    '[]'
  ) AS products,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', pf.id, 'zerobiasFrameworkId', pf.zerobias_framework_id,
      'proficiencyLevel', pf.proficiency_level, 'yearsExperience', pf.years_experience,
      'assessorCertified', pf.assessor_certified,
      'implementationExperience', pf.implementation_experience,
      'auditExperience', pf.audit_experience
    )) FROM provider_frameworks pf WHERE pf.provider_id = pp.id),
    '[]'
  ) AS frameworks,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', pseg.id, 'zerobiasSegmentId', pseg.zerobias_segment_id, 'isPrimary', pseg.is_primary
    )) FROM provider_segments pseg WHERE pseg.provider_id = pp.id),
    '[]'
  ) AS segments,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', pss.id, 'zerobiasServiceSegmentId', pss.zerobias_service_segment_id, 'isPrimary', pss.is_primary
    )) FROM provider_service_segments pss WHERE pss.provider_id = pp.id),
    '[]'
  ) AS service_segments,
  -- Active service offerings
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', so.id, 'title', so.title, 'description', so.description,
      'category', so.category, 'pricingType', so.pricing_type,
      'price', so.price, 'deliveryTime', so.delivery_time, 'includes', so.includes
    )) FROM service_offerings so WHERE so.provider_id = pp.id AND so.is_active = true),
    '[]'
  ) AS service_offerings,
  -- Approved reviews
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', r.id, 'rating', r.rating, 'reviewText', r.review_text,
      'reviewerZerobiasUserId', r.reviewer_zerobias_user_id, 'createdAt', r.created_at
    )) FROM reviews r WHERE r.provider_id = pp.id AND r.approved = true),
    '[]'
  ) AS reviews,
  (SELECT count(*) FROM reviews r WHERE r.provider_id = pp.id AND r.approved = true) AS review_count
FROM provider_profiles pp
LEFT JOIN marketplace_users mu ON pp.user_id = mu.id;
```

#### `v_engagement_summary` — Engagement list page (replaces engagement + proposal queries)

```sql
CREATE VIEW v_engagement_summary AS
SELECT
  wr.*,
  mu.display_name AS buyer_display_name,
  mu.avatar_url AS buyer_avatar_url,
  (SELECT count(*) FROM proposals p WHERE p.request_id = wr.id) AS proposal_count,
  (SELECT count(*) FROM proposals p WHERE p.request_id = wr.id AND p.status = 'pending') AS pending_proposal_count,
  -- Accepted provider info (for engagement phase)
  (SELECT pp.display_name FROM proposals p
   JOIN provider_profiles pp ON p.provider_id = pp.id
   WHERE p.request_id = wr.id AND p.status = 'accepted' LIMIT 1
  ) AS accepted_provider_name,
  (SELECT pp.id FROM proposals p
   JOIN provider_profiles pp ON p.provider_id = pp.id
   WHERE p.request_id = wr.id AND p.status = 'accepted' LIMIT 1
  ) AS accepted_provider_id
FROM work_requests wr
LEFT JOIN marketplace_users mu ON wr.buyer_user_id = mu.id;
```

#### `v_engagement_detail` — Engagement detail page (engagement + all bids with provider info)

```sql
CREATE VIEW v_engagement_detail AS
SELECT
  wr.*,
  mu.display_name AS buyer_display_name,
  mu.email AS buyer_email,
  -- All proposals with provider info
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', p.id, 'coverLetter', p.cover_letter,
      'proposedPrice', p.proposed_price, 'proposedTimeline', p.proposed_timeline,
      'status', p.status, 'createdAt', p.created_at,
      'providerId', p.provider_id,
      'providerName', pp.display_name, 'providerHeadline', pp.headline,
      'providerAvatar', pp.avatar_url, 'providerRating', pp.rating_average
    ) ORDER BY p.created_at DESC)
    FROM proposals p
    JOIN provider_profiles pp ON p.provider_id = pp.id
    WHERE p.request_id = wr.id),
    '[]'
  ) AS proposals,
  (SELECT count(*) FROM proposals p WHERE p.request_id = wr.id) AS proposal_count
FROM work_requests wr
LEFT JOIN marketplace_users mu ON wr.buyer_user_id = mu.id;
```

#### `v_admin_reviews` — Admin review moderation (reviews + provider + request info)

```sql
CREATE VIEW v_admin_reviews AS
SELECT
  r.*,
  pp.display_name AS provider_name,
  pp.avatar_url AS provider_avatar,
  wr.title AS request_title
FROM reviews r
JOIN provider_profiles pp ON r.provider_id = pp.id
LEFT JOIN work_requests wr ON r.request_id = wr.id;
```

#### `v_admin_stats` — Admin dashboard stats

```sql
CREATE VIEW v_admin_stats AS
SELECT
  (SELECT count(*) FROM marketplace_users) AS total_users,
  (SELECT count(*) FROM provider_profiles) AS total_providers,
  (SELECT count(*) FROM work_requests) AS total_requests,
  (SELECT count(*) FROM work_requests WHERE status = 'open') AS open_requests,
  (SELECT count(*) FROM work_requests WHERE engagement_tag IS NOT NULL) AS total_engagements,
  (SELECT count(*) FROM bids) AS total_bids,
  (SELECT count(*) FROM reviews) AS total_reviews,
  (SELECT count(*) FROM reviews WHERE approved = false AND approved_at IS NULL) AS pending_reviews,
  (SELECT count(*) FROM service_offerings WHERE is_active = true) AS active_services;
```

#### VIEW usage pattern in services

```
READ (via VIEWs — 1 query):                WRITE (via tables — 1 query each):
─────────────────────────────               ────────────────────────────────────
v_provider_directory → provider list        provider_profiles → update profile
v_provider_detail → provider profile        provider_skills → add/remove skill
v_engagement_summary → engagement list      bids → submit bid
v_engagement_detail → engagement detail     work_requests → create RFP
v_admin_reviews → review moderation         reviews → approve/reject
v_admin_stats → admin dashboard             categories → CRUD
```

---

## Phase 3: Service Layer

**Umbrella task: "Build SME Mart service layer"**

### 3.1 Platform Services (via ZeroBias SDK)

These use `@zerobias-com/zerobias-angular-client` directly:

| Service | Purpose | SDK Path |
|---------|---------|----------|
| `CatalogService` | Roles, skills, frameworks, products, segments, service segments | `zerobias-sdk` → `platform-sdk` catalog APIs |
| `UserPreferencesService` | PKV for role toggle, filter state | `zerobias-sdk` → `dana-sdk` PKV API |
| `BoundaryService` | Engagement boundaries | `zerobias-sdk` → `platform-sdk` boundary APIs |
| `TaskService` | Engagement tasks, hours, deliverables | `zerobias-sdk` → `platform-sdk` task APIs |
| `TagService` | Engagement tag creation + resource search | `zerobias-sdk` → `platform-sdk` tag APIs |

### 3.2 Database Services (via Generic SQL)

| Service | Table(s) | Key Operations |
|---------|----------|----------------|
| `ProviderProfilesService` | `provider_profiles` + 6 relation tables | List/filter providers, CRUD profile, manage expertise |
| `ServiceOfferingsService` | `service_offerings` | CRUD productized services |
| `WorkRequestsService` | `work_requests` | Create RFP, list/filter, lifecycle management |
| `BidsService` | `bids` | Submit/accept/reject/withdraw, acceptance triggers engagement |
| `ReviewsService` | `reviews` | CRUD + moderation workflow (approve/reject) |
| `CategoriesService` | `categories` | Hierarchical category CRUD |
| `AdminService` | `app_settings`, cross-table stats | Admin dashboard data, bulk operations |
| `EngagementLifecycleService` | — | BIP39 tag generation, phase detection helpers |

### 3.3 State Management

Services hold state in `BehaviorSubject` (or `signal()` where appropriate):

```typescript
private _providers = new BehaviorSubject<ProviderProfile[]>([]);
public providers$ = this._providers.asObservable();

private _loading = new BehaviorSubject<boolean>(false);
public loading$ = this._loading.asObservable();
```

Components consume via `async` pipe or `toSignal()`.

---

## Phase 4: Feature Migration — Marketplace & Profiles

**Umbrella task: "Implement provider marketplace and profile management"**

### 4.1 Landing Page
- Hero section with search bar
- Category cards (from `categories` table)
- Featured providers
- Platform value proposition

### 4.2 Provider Directory
- Card grid with toggle view (grid/list)
- **6-type catalog filter panel** — roles, skills, products, frameworks, segments, service segments
- `FilterEnabler` — toggle which filter categories are visible
- Search with debounced input → RFC4515 filter construction
- Sort by rating, hourly rate, response time
- Availability toggle
- Mobile-responsive filter drawer

### 4.3 Provider Profile Detail
- Profile header (avatar, name, headline, rating, availability badge)
- About section (bio, response time, jobs completed)
- Expertise section (NICE roles, skills with proficiency, frameworks, products)
- Service offerings (productized services with pricing)
- Reviews section (only approved reviews visible)
- Contact/request work CTA

### 4.4 Service Catalog
- Browse all service offerings with catalog filters
- Service cards with provider info, pricing, delivery time

### 4.5 My Profile (Provider)
- Edit profile (display name, headline, about, hourly rate, availability)
- Manage expertise — **6 autocomplete pickers** (role, skill, product, framework, segment, service segment)
- Manage service offerings — CRUD with pricing types
- View own reviews
- Moderate reviews — approve/reject before public display

### 4.6 Role Toggle & User Dropdown
- Buyer/Provider/Both role toggle persisted via PKV (`sme-mart.user-role`)
- localStorage fallback for local dev
- `UserProfileDropdown` with avatar, role toggle, edit profile, admin link, theme toggle, logout

---

## Phase 5: Feature Migration — Engagements & Admin

**Umbrella task: "Implement RFP/Engagement lifecycle, Transparency Center scaffolding, and admin panel"**

### 5.1 Engagement Browse Page
- Lifecycle toggle: RFPs | Engagements | All
- "My Bids" chip filter for providers
- Catalog filters (same 6-type system)
- "Post an RFP" CTA
- `EngagementCard` with lifecycle label chip (RFP vs Engagement), bid count

### 5.2 Create/Edit RFP
- Form: title, description, category, budget type/range, timeline
- Save as draft or publish
- Edit existing RFP

### 5.3 Engagement Detail — Dual View
- **RFP view** (when `engagementTag` is null):
  - Bid list with accept/reject/withdraw actions
  - `ProposalForm` dialog for submitting proposals
  - `ProposalCard` display
- **Transparency Center view** (when `engagementTag` is present):
  - Tabs: Overview, Details, Messages*, Files*
  - Overview: engagement summary, accepted proposal, ZeroBias Tag info
  - Details: full proposal history
  - Messages/Files: "Coming Soon" stubs (future ZeroBias Task integration)

### 5.4 Proposal Acceptance Workflow
- Generate BIP39 tag (`ENG-word-word`)
- Create ZeroBias Tag via SDK
- Update work_request with `engagementTag`, `zerobiasTagId`, `status: 'in_progress'`
- Reject other pending proposals

### 5.5 Admin Panel
- **Users tab** — real provider data from marketplace_users
- **Categories tab** — hierarchical CRUD with parent/child, icon, sort order
- **Reviews tab** — bulk approve/reject with search and filter
- **Settings tab** — registration, notifications, security, marketplace toggles (key-value in `app_settings`)
- Organizations tab (mocked/placeholder)

---

## Phase 6: ngx-library Re-skin & Polish

**Umbrella task: "Re-skin all components using ngx-library and polish UI"**

- Audit all custom components against ngx-library's available components
- Replace custom implementations with ngx-library equivalents where possible
- Apply ngx-library theme consistently across all pages
- Ensure dark/light mode works (portal postMessage sync)
- Responsive design with Material breakpoints
- Accessibility: keyboard nav, ARIA labels, contrast ratios
- Loading states and error boundaries
- Infinite scroll for large lists (peer dep of ngx-library)

---

## Phase 7: Deployment

**Umbrella task: "Deploy SME Mart to QA environment"**

### Build

```bash
ng build --configuration=production
```

Output: `dist/sme-mart/browser/` — static HTML/JS/CSS

### Deploy to S3

```bash
aws s3 sync dist/sme-mart/browser/ s3://{bucket}/sme-mart/
aws cloudfront create-invalidation --distribution-id {id} --paths "/sme-mart/*"
```

App accessible at: `https://qa.zerobias.com/sme-mart/`

### Environment Configuration

| Environment | Proxy Target | Config |
|-------------|-------------|--------|
| Local dev | `proxy-dev.conf.js` → `ci.zerobias.com` | `environment.ts` |
| QA | Built static, served via S3 | `environment.prod.ts` |
| Production | Built static, served via S3 | `environment.prod.ts` |

### Portal Registration

1. Add app URL to portal's `appUrlOrigins` config
2. Portal loads SME Mart in iframe via `PortalAppFrameComponent`
3. Theme sync, org ID, and navigation happen via postMessage

---

## Generic SQL Hub Module Setup

Before the Angular app can access data, the Generic SQL connector must be provisioned:

1. **Create SQL Connector Secret** in ZeroBias UI (Hub → New Connection)
   - **jdbcUrl**: `jdbc:postgresql://ep-aged-fog-af9wu771.c-2.us-west-2.aws.neon.tech/neondb?user=neondb_owner&password=xxx&sslmode=require`
   - Use direct endpoint (no `-pooler`) since HikariCP handles pooling
   - **poolSize**: 5, **maxPoolSize**: 15

2. **Connection ID** → `environment.smeMartConnectionId`

3. **QA status**: Connection created (`e3c874f5-5fd8-4fbc-8120-19861e28b19e`), tags endpoint had 503 (Kevin investigating)

---

## Verification Plan

### Phase 1 Verification
- `ng serve` — dev server starts, app loads in browser
- Auth initializes — `ZerobiasClientApp.init()` succeeds, `whoAmI()` returns user
- ngx-library theme renders — M3 palette visible, dark mode toggle works
- ngx-library components render correctly

### Phase 2 Verification
- Generic SQL connection established via DataProducer
- `SmeMartDbService.connect()` succeeds with provisioned connection ID
- Can list rows from `provider_profiles` table
- Can create/read/update/delete a test row

### Phase 3 Verification
- `CatalogService.listRoles()` returns 95+ roles from ZeroBias API
- `ProviderProfilesService.list()` returns providers from Neon via Generic SQL
- Services handle errors gracefully with toast notifications

### Phase 4 Verification
- Landing page renders with categories and featured providers
- Provider directory loads with card grid and 6-type catalog filters
- Provider detail page shows full profile with expertise and reviews
- All 6 expertise autocomplete pickers work
- Service catalog browse works
- Role toggle persists via PKV

### Phase 5 Verification
- Engagement list shows lifecycle toggle and filters
- Create RFP form submits to Neon via Generic SQL
- Proposals can be submitted and accepted
- Acceptance generates BIP39 tag and creates ZeroBias Tag
- Engagement detail switches between RFP and Transparency Center views
- Admin panel CRUD operations work (categories, reviews, settings)

### Phase 7 Verification
- `ng build --configuration=production` succeeds
- S3 upload works, app loads at QA URL
- App works in portal iframe (postMessage, theme sync, org ID)

---

## Open Questions

### Resolved
- ~~Standalone vs NgModules~~ → **Standalone** (Angular 21 default, greenfield app)
- ~~Nx vs Angular CLI~~ → **Angular CLI** (single app, no monorepo benefits from Nx)
- ~~neverfail-lib vs ngx-library~~ → **`@zerobias-org/ngx-library`** (new official package)

### Still Open

1. **ngx-library component inventory** — Need to inspect the package to see exactly what components, services, and theme exports are available. This determines how much custom UI we need to build.

2. **Hub Module decision** — Starting with Generic SQL. Monitor for limitations (JOINs, validation, performance). Revisit if needed.

3. **Database VIEWs** — Should we create Neon VIEWs now for common composite queries, or wait until performance is an issue?

4. **Engagement tag format** — BIP39 words (`ENG-word-word`) vs alphanumeric short codes (`ENG-XXXXXX`)? Next.js uses BIP39. Transparency Center plan mentions alphanumeric.

5. **Demo mode / mock catalog** — Plan 013 from Next.js (capture catalog fixtures for offline dev). Port to Angular or defer?

6. **Portal navigation entry** — When should SME Mart appear in portal navigation?

---

## File Reference

### ngx-library & SDK (new packages)

| Package | Registry | Auth |
|---------|----------|------|
| `@zerobias-org/ngx-library@0.2.1` | `pkg.zerobias.org` | `ZB_TOKEN` |
| `@zerobias-com/zerobias-angular-client@1.1.21` | `npm.pkg.github.com` | `GITHUB_TOKEN` |
| `@zerobias-com/zerobias-client@1.1.22` | `npm.pkg.github.com` | `GITHUB_TOKEN` |
| `@zerobias-com/zerobias-sdk@1.1.17` | `npm.pkg.github.com` | `GITHUB_TOKEN` |
| `@zerobias-org/data-utils` | `pkg.zerobias.org` | `ZB_TOKEN` |

### Key patterns to follow (source files in `~/zb-repos/ui/`)

| Pattern | File |
|---------|------|
| App module providers | `projects/portal/src/app/app.module.ts` |
| App component | `projects/catalog-app/src/app/app.component.ts` |
| ZB client wrapper | `projects/neverfail-lib/src/lib/auditmation-services/zb-client-api.service.ts` |
| Service base class | `projects/neverfail-lib/src/lib/auditmation-services/services/base/nf-base-service.service.ts` |
| DataProducer service | `projects/neverfail-lib/src/lib/auditmation-services/auditlogic/data-explorer/data-explorer.service.ts` |
| Theme config | `projects/theme/src/styles/theme.scss` |
| M3 palette | `projects/theme/src/styles/_theme-colors.scss` |
| Environment dev | `projects/catalog-app/src/environments/environment.ts` |
| Portal iframe host | `projects/portal/src/app/portal/components/portal-app-frame/portal-app-frame.component.ts` |
| Proxy config | `proxy-dev.conf.js` |

### Next.js features to migrate (source in `app/package/w3geekery/sme-mart/`)

| Feature | Next.js Location | Notes |
|---------|-----------------|-------|
| Landing page | `src/app/page.tsx` | Hero, categories, featured |
| Provider directory | `src/app/providers/page.tsx` | Card grid + 6-type catalog filters |
| Provider detail | `src/app/providers/[providerId]/page.tsx` | Full profile |
| Service catalog | `src/app/services/page.tsx` | Service browse |
| Engagement list | `src/app/engagements/page.tsx` | Lifecycle toggle, My Proposals |
| Engagement detail | `src/app/engagements/[engagementId]/page.tsx` | Dual view: RFP / Transparency Center |
| Create/Edit RFP | `src/app/engagements/new/page.tsx`, `[id]/edit/page.tsx` | Form |
| My profile | `src/app/my-profile/page.tsx` | Edit provider profile |
| My expertise | `src/app/my-profile/expertise/page.tsx` | 6 autocomplete pickers |
| My services | `src/app/my-profile/services/page.tsx` | CRUD service offerings |
| My reviews | `src/app/my-profile/reviews/page.tsx` | View reviews |
| Moderate reviews | `src/app/my-profile/moderate-reviews/page.tsx` | Approve/reject |
| Admin panel | `src/app/admin/page.tsx` | 5 tabs |
| Role toggle | `src/hooks/useUserRole.ts` | PKV + localStorage |
| Filter persistence | `src/hooks/useFilterPreferences.ts` | PKV + localStorage |
| Catalog hook | `src/hooks/useZeroBiasCatalog.ts` | 6 catalog types |
| Catalog proxy | `src/app/api/catalog/route.ts` | Server-side proxy → SDK (not needed in Angular) |
| DB schema | `src/lib/db/schema.ts` | 15 tables, 6 enums |
| Engagement lifecycle | `src/lib/engagement-lifecycle.ts` | Phase detection helpers |
| BIP39 tags | `src/lib/bip39-tags.ts` | `ENG-word-word` generation |
| Impersonation | `src/components/dev/ImpersonationSwitcher.tsx` | Dev-only user switching |
