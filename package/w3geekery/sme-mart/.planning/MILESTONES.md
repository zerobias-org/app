# Milestones

## v1.1 Org Navigation & Vendor Profile (Shipped: 2026-04-02)

**Phases completed:** 6 phases, 8 plans, 26 tasks
**Timeline:** 3 days (2026-03-31 → 2026-04-02)
**Commits:** 56 | **Files:** 163 | **LOC:** +36,185 / -5,340

**Delivered:** Three-tier org navigation, supply-side vendor profile with 6-section corporate docs, vetting pre-fill with profile item suggestions, and project-centric boundary model with Internal/External org badges.

**Key accomplishments:**

1. Three-tier org navigation — `/orgs` list with card/table toggle, `/orgs/:orgId` read-only detail with members, groups, boundaries, and org switching stub
2. MarketplaceProfileItem GQL schema — single entity with section discriminator, JSON data blob, org-scoped, merged to `zerobias-org/schema:dev`
3. VendorProfileService with full CRUD — GQL reads + Pipeline writes, bidirectional field mapping, roundtrip tests for all 6 profile sections
4. Corporate Profile tab on `/org` — add/edit/delete profile items across 6 sections, expiration indicators, renewal prompts
5. Vetting pre-fill suggestion panel — section-to-vetting-type matching, 1:1 pointer attachments, reference counting blocks deletion of in-use items
6. Project-centric boundary model — Internal/External org badges, engagement/project counts, boundary parties tab with roles

**Key decisions:**

- Schema PR first — MarketplaceProfileItem to zerobias-org/schema:dev blocks phases 9-11
- Single entity with section discriminator (not per-section classes)
- JSON data blob for section-specific content (flexible, typed per section)
- Profile items as 1:1 pointers (not copies) for vetting references
- /orgs/:orgId is read-only — editing on /org only
- Org switching stubbed (disabled button with tooltip, requires session auth)

**Tech debt carried forward:**

- Phase 8 missing VERIFICATION.md (process gap, SUMMARY covers it)
- Phase 12 teams field stubbed (boundary teams API not yet available)
- 2 pre-existing vendor-profile.service.ts TypeScript warnings
- SmeMartDbService still used by 7 non-migrated services (from v1.0)

**Archive:** [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) | [v1.1-REQUIREMENTS.md](milestones/v1.1-REQUIREMENTS.md) | [v1.1-MILESTONE-AUDIT.md](milestones/v1.1-MILESTONE-AUDIT.md)

---

## v1.0 AuditgraphDB Migration (Shipped: 2026-03-19)

**Phases completed:** 6 phases, 9 plans, 22 tasks
**Timeline:** 2 days (2026-03-18 → 2026-03-19)
**Commits:** 58 | **Files:** 212 | **LOC:** +21,411 / -1,593
**Codebase:** 40,882 LOC TypeScript

**Delivered:** All 17 SME Mart entity types read/write through AuditgraphDB (Pipeline writes + GraphQL reads), replacing Neon PostgreSQL.

**Key accomplishments:**

1. Migrated all 8 existing entities (Engagement, Bid, BidResponse, ServiceOffering, Note, NoteFolder, Review, SmeMartDocument) from Neon to Pipeline+GQL
2. Built 9 new Project Bloom entity services directly on Pipeline+GQL (SmeMartProject, Board, Activity, Workflow, Task, Prd, PrdSection, Plan, PlanMilestone)
3. Created field mapping infrastructure — 17 bidirectional mapping constants, GQL type interfaces, roundtrip tests, test mock factories
4. Zero component changes — domain service public APIs kept identical, only internal data paths swapped
5. 94+ unit tests for Bloom services, 27 for Wave 3, comprehensive roundtrip validation
6. Neon archival planned — 8 tables scheduled for archive after 2-week observation (2026-04-02)

**Key decisions:**

- Direct swap (no adapter pattern) — services already isolated
- Wave-based migration order: core flow → attachments → standalone → bloom
- Optimistic updates mask 5-10s eventual consistency delay
- Archive Neon (don't delete) — 2-week observation then S3 backup

**Tech debt carried forward:**

- Build errors in unrelated components block `npm test`
- Neon archival not yet executed (observation period ends 2026-04-02)
- SmeMartDbService still used by 7 non-migrated services

**Archive:** [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) | [v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md) | [v1.0-MILESTONE-AUDIT.md](milestones/v1.0-MILESTONE-AUDIT.md)

---
