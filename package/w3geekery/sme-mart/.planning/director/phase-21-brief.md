# Phase 21 — Org Documents Center Completion (Plan 046 remaining)

**Milestone:** v1.3
**Est:** ~20 hrs (time-boxed, scope trims if creep emerges)
**Repos:** `app/` (SME Mart only)
**Origin:** Plan 046 (Org-Level Document Management), phases 6/8/9 deferred. Plus new document-types expansion from RFP gap analysis E1.

## Goal

Complete the Org Documents Center surface — the primary document-management experience under `/org` / `/orgs/:orgId` navigation. Start with the backlog's full 046-remaining list; defer anything that turns into scope creep to v1.4.

## Architecture

**Target list (ordered by likely complexity, cheap first):**

1. **Folders** — nested folder CRUD in the doc center (likely already exists in similar Notes pattern; reuse if so)
2. **Color tagging** — folder/document color assignment for visual organization
3. **Tag UI** — surface hydra `Tag` assignment/filtering on documents (Kevin's `hydraClient.getTagApi()`; search/filter by tag)
4. **Document templates listing** — surface DocumentTemplate entities created in v1.2 Phase 15, in the Org Documents center (not just inside the RFP wizard)
5. **Preview** — existing File SDK preview surface (leverage Phase 15 / file-upload SDK already wired for ZB UI)
6. **Archive browser** — hidden/archived documents view
7. **Versioning UI** — surface version history for documents (File SDK has version concept)
8. **Bulk operations** — multi-select + archive/tag/move
9. **PDF conversion** — file-service supported?; if not, defer
10. **New document types** — E1 gap analysis adds 19 new document types (terminology work; schema-adjacent)

**Execution strategy:** work top-to-bottom, ship each as a plan or micro-plan, close the phase when time is spent OR when the next item starts feeling like creep. Don't pre-commit to all 10.

## Requirements

Loose, because we're time-boxing:

- **OD-01:** Folders are user-creatable and nestable in the Org Documents Center
- **OD-02:** Color + Tag affordances visible and functional on documents
- **OD-03:** DocumentTemplate (v1.2) entities appear in the Org Documents Center, not only in the RFP wizard
- **OD-04:** Document preview works for at least the common content types already supported by the File SDK
- **OD-05+:** Additional deliverables added as they land; each has a satisfying requirement in this section

**Scope-creep trigger:** any deliverable that would require >4 hrs of work or touches platform/schema gets a "defer to v1.4" note instead, and we close the phase with what's shipped.

## Dependencies

- Phase 15 DocumentTemplate + DocumentInstance classes (shipped v1.2)
- `@zerobias-com/hydra-sdk` Tag API (shipped)
- Existing Notes-Center folder pattern (if it exists, reuse wholesale)
- File SDK (MEMORY.md + `.claude/notes/zb-file-upload-sdk-reference.md`)

## Verification

- UAT walk-through of Org Documents Center with each shipped deliverable working end-to-end
- No schema work in this phase — if a deliverable needs schema, that's automatic defer

## Out of scope (by design)

- Form templates (lives in Phase 22)
- Anything requiring platform/schema work
- Multi-org / cross-org document sharing
- External storage import (Plan 046 Phase 8 — deferred past this milestone too)

## References

- BACKLOG.md "046 remaining" entry
- `.claude/notes/zb-file-upload-sdk-reference.md`
- Phase 15 DocumentTemplate artifacts (`.planning/phases/15-*/`)
- E1 gap analysis (19 new document types) — terminology table to be synthesized from RFP research docs
