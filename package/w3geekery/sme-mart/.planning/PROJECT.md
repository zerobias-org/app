# SME Mart — AuditgraphDB Migration

## What This Is

SME Mart is a marketplace for Subject Matter Experts in compliance and cybersecurity — "Upwork meets Whop" for ZeroBias platform users. Built with Angular 21, it connects buyers seeking compliance services (SOC 2, ISO 27001, HIPAA, etc.) with qualified providers. The app is live on Vercel with Phases 1-4 complete and Phase 5 (Engagements & Admin) in progress.

## Core Value

All 17 SME Mart entity types read and write through ZeroBias AuditgraphDB (Pipeline writes + GraphQL reads), replacing the Neon PostgreSQL data layer entirely.

## Requirements

### Validated

- ✓ Angular 21 app scaffolding with standalone components — Phase 1
- ✓ Neon-backed SmeMartDbService with DataProducer CRUD — Phase 2
- ✓ 10 domain services + 8 model files — Phase 3
- ✓ Marketplace pages: Home, ProviderList, ProviderDetail, ServiceCatalog, MyProfile — Phase 4
- ✓ Engagement detail with child routes (overview/details/tasks/timeline) — Phase 5
- ✓ Notes system with folders, drag-drop, OneNote-style layout — Phase 5
- ✓ RFP creation wizard with requirements editor, JSON import, method chooser — Phase 5
- ✓ Vendor bid response flow with per-requirement responses, compliance progress — Phase 5
- ✓ Document upload/management at org and engagement level — Phase 5
- ✓ Tag system with hierarchical naming, resource tag editor — Phase 5
- ✓ Notification center (Neon-backed, ZB Cards pattern) — Phase 5
- ✓ 456 unit tests across 33 spec files — Phase 5
- ✓ GQL schema package live in prod (8 classes) — Plan 034 Phases 1-4
- ✓ Receiver Pipeline created + tested with sample Engagement — Plan 034 Phase 4
- ✓ PipelineWriteService and GraphqlReadService created — Plan 059

### Active

- [ ] Migrate 8 existing entities from Neon to Pipeline+GQL (Engagement, Bid, BidResponse, ServiceOffering, Note, NoteFolder, Review, SmeMartDocument)
- [ ] Build 9 new Project Bloom entities directly against Pipeline+GQL (SmeMartProject, SmeMartBoard, SmeMartActivity, SmeMartWorkflow, SmeMartTask, ProjectPrd, PrdSection, ProjectPlan, PlanMilestone)
- [ ] Fix schema naming issue (PR #9) — blocks PR #8 (Bloom entities)
- [ ] Merge PR #8 (Project Bloom entity definitions) — blocked on PR #9
- [ ] GQL types available for all 17 entity classes
- [ ] Demo data seeded via Pipeline instead of Neon SQL
- [ ] All domain services bypass SmeMartDbService for migrated entities
- [ ] Tests updated to mock PipelineWriteService + GraphqlReadService
- [ ] Neon entity tables archived after migration verified

### Out of Scope

- Auth flow / login (ZeroBias platform handles this) — not SME Mart responsibility
- LLM-assisted bid generation (Plan 033 Phase 5) — separate initiative
- AI document decomposition for Project Bloom (Plan 040) — separate initiative after entities exist
- Transparency Center (Plan 023) — depends on Project Bloom completion
- E2E Playwright tests (Plan 052) — separate initiative
- ngx-library re-skin (Phase 6) — after migration
- Production deployment pipeline (Phase 7) — after migration
- Internal Marketplace (Plan 050) — future concept
- Reverse Bid Flow (Plan 051) — future concept

## Context

- **Existing architecture:** Angular 21 standalone components, SmeMartDbService wraps Neon via Generic SQL Hub Module (DataProducer interface). Neon VIEWs for consolidated reads.
- **Target architecture:** Writes via Receiver Differential Pipeline (Batch API). Reads via auto-generated GraphQL API (read-only). Tags and links become native AuditgraphDB relationships.
- **Schema repo:** `zerobias-org/schema` — YAML packages define classes, fields, enums, links. Auto-deployed on merge to dev/qa/main branches.
- **Pipeline:** `091d5068-0527-4f45-9839-37f6d5c1669e` (SME Mart Entity Pipeline) — receiver/differential/dynamic/json.
- **Eventual consistency:** Pipeline writes are async. UI uses optimistic updates — no polling needed unless issues arise.
- **PR chain:** PR #9 (schema naming fix) → PR #8 (9 Bloom entities) → GQL types available.
- **Schema reloads every 15 minutes** after merge to schema repo branches.
- **15 hrs/week cap** — Clark / W3Geekery contractor.

## Constraints

- **Tech stack**: Angular 21, standalone components, no Nx, `@zerobias-org/ngx-library` for theming
- **Data layer**: Must use Pipeline (writes) + GQL (reads) — no direct Neon for migrated entities
- **Schema PRs**: PR #9 must merge before PR #8; both must merge before GQL types are available for Bloom entities
- **Backward compat**: Public API of domain services stays identical — zero component changes for migration
- **Budget**: 15 hrs/week contractor time

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Direct swap (no adapter pattern) | Each domain service is already isolated — swap internals, keep public API | — Pending |
| Incremental migration by entity waves | Linked entities migrate together; reduces risk vs big-bang | — Pending |
| Wave order: Engagement+Bids → Notes+Docs → Standalone → Bloom | Dependency graph: core flow first, then attachments, then independent | — Pending |
| Optimistic updates for write visibility | Pipeline async delay; component already has data from create call | — Pending |
| 9 Bloom entities built directly against GQL (no Neon) | No legacy to migrate — start clean | — Pending |

---
*Last updated: 2026-03-18 after initialization*
