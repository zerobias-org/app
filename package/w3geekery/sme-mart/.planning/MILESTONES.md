# Milestones

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
