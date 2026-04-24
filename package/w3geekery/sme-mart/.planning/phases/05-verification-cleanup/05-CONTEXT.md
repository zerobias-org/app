# Phase 5: Verification & Cleanup - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify all 8 migrated entities are stable, update demo data seeding to use Pipeline, update all tests to mock Pipeline+GQL only, and remove SmeMartDbService from fully-migrated services. Neon tables are NOT archived yet — wait 2 weeks after this phase completes.

</domain>

<decisions>
## Implementation Decisions

### Neon Table Archival
- **Wait 2 weeks** before archiving Neon tables for migrated entities
- Tables stay accessible as safety net during verification period
- DATA-03 requirement: mark as "scheduled" not "done" — actual archival is a future task after 2-week observation
- The 2-week clock starts when Phase 5 completes

### SmeMartDbService Removal
- **Remove from migrated services only** — the 5 migrated services (EngagementsService, BidsService, NotesService, OrgDocumentService, ServiceOfferingsService, ReviewsService + NoteFolderService)
- **Keep SmeMartDbService** for non-migrated features: categories, notifications, provider profiles, app settings, marketplace users
- Do NOT add @deprecated — it's still actively used by other features

### Demo Data Seeding
- Update demo data to use PipelineWriteService.pushEntities() for all 8 migrated entities
- Replace Neon SQL inserts for: Engagement, Bid, BidResponse, Note, NoteFolder, SmeMartDocument, ServiceOffering, Review
- Non-migrated demo data (categories, providers, etc.) stays on Neon

### Test Updates
- All specs for migrated services must mock PipelineWriteService + GraphqlReadService
- No SmeMartDbService mocks in migrated service specs
- Non-migrated service specs keep SmeMartDbService mocks

### Claude's Discretion
- Exact demo data seeding implementation
- Which test files need updating (scan for SmeMartDbService mocks in migrated service specs)
- Whether to add a scheduled reminder/comment for the 2-week archival

</decisions>

<canonical_refs>
## Canonical References

### Migrated services (verify no SmeMartDbService)
- `src/app/core/services/engagements.service.ts`
- `src/app/core/services/bids.service.ts`
- `src/app/core/services/notes.service.ts`
- `src/app/core/services/org-document.service.ts`
- `src/app/core/services/service-offerings.service.ts`
- `src/app/core/services/reviews.service.ts`
- `src/app/core/services/note-folder.service.ts`

### SmeMartDbService (stays for non-migrated features)
- `src/app/core/services/sme-mart-db.service.ts`

### Demo data
- Check for demo/seed data files in the codebase

### Prior verifications
- `.planning/phases/02-wave-1-migrations/02-VERIFICATION.md`
- `.planning/phases/03-wave-2-attachments/03-VERIFICATION.md`
- `.planning/phases/04-wave-3-standalone-entities/04-VERIFICATION.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### What needs cleanup
- SmeMartDbService imports in migrated services (may already be removed by Phases 2-4)
- Test mocks referencing SmeMartDbService for migrated services
- Demo data SQL inserts for migrated entities

### What stays
- SmeMartDbService itself (used by categories, notifications, etc.)
- Neon tables (2-week observation period)
- Non-migrated service tests with SmeMartDbService mocks

</code_context>

<specifics>
## Specific Ideas

- This is primarily a verification + cleanup phase, not new features
- Most of the "removal" may already be done by Phases 2-4 executors
- The main new work is demo data migration to Pipeline

</specifics>

<deferred>
## Deferred Ideas

- Neon table archival (scheduled for 2 weeks after Phase 5 completion)

</deferred>

---

*Phase: 05-verification-cleanup*
*Context gathered: 2026-03-19*
