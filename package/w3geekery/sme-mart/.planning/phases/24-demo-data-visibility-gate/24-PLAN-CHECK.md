# Phase 24 Plan Check

**Checked:** 2026-04-30
**Plans:** 24-01 through 24-05 (5 plans, 4 waves)
**Verdict:** **PASS_WITH_FLAGS — halt for Director review before /gsd-execute-phase 24**

## Goal Coverage Map

| Req | Plan / Task | Status |
|---|---|---|
| DG-01 (seed-time tag ingest) | 24-02 / Tasks 1-3 | covered |
| DG-02 (non-admin filter) | 24-03 / Tasks 1-3 (DemoVisibilityService injection across 21 services) | covered |
| DG-03 (admin retains visibility) | 24-01 / Task 2 (helper short-circuits when `isAdmin()` true), 24-03 / Tasks 1-3 | covered |
| DG-04 (admin delete-demo escape hatch) | 24-04 / Tasks 1-2 | covered, but see HIGH-1 below |
| DG-05 (unit tests for three scenarios) | 24-05 / Tasks 1-3 + per-service specs in 24-03 | covered |

## HIGH Concerns (must address before execute)

### HIGH-1 — Hydra has no `deleteResource` operation; Plan 24-04 Task 1 assumes one exists

**Verified via** `mcp__zerobias__zerobias_search { keyword: "resource", service: "hydra" }` (28 ops returned; ZERO match for `deleteResource`).

Available hydra Resource ops are: `getResource`, `tagResource`, `untagResource`, `searchResources`/`resourceSearch`, `linkResources`, `deleteResourceLink` (link, NOT resource), `getTagsForResource`, etc.

**Implication:** Plan 24-04 Task 1's pseudo-code (`hydraClient.getResourceApi().deleteResource(...)`) cannot work as written. Three viable paths:

1. **Untag-only.** Use `hydra.Resource.untagResource(resourceId, tagId)` to clear demo tags. Resource record remains as orphan (invisible to filter once untagged because filter still excludes by tag — orphan with no demo tag is, by definition, visible to non-admins). **NOT what we want.**
2. **Class-Object cascade.** `Pipeline.receive { markDeleted: [recordId, ...] }` for the underlying class-Object — verify whether this cascades to delete the corresponding hydra Resource. (Question for Kevin / platform — not answerable from MCP alone.)
3. **Defer hydra cleanup.** Phase 24 Plan 04 only deletes class-Object records via `Pipeline.receive markDeleted`. Hydra Resource cleanup is documented as out-of-scope and tracked as a separate director brief. The visibility gate (Plan 03) still hides demo data from non-admins because the filter is on Object.tag, not on hydra Resource state.

**Recommendation:** Option 3 (defer hydra cleanup). Phase 24's stated goal is *visibility*, not *destruction* — admin "delete-demo" can be scoped as "hide them irreversibly by markDeleted, leave hydra residue for Kevin." Update Plan 24-04 Task 1 and CONTEXT.md before execute starts. If Director wants true hydra deletion, add a Phase 24.x sub-phase with Kevin's input on the cascade behavior.

### HIGH-2 — GqlQueryOptions.filters cannot express two `.ne.` exclusions on the same field

**Verified by reading** `src/app/core/services/graphql-read.service.ts:35-36, 173-176`:
- `filters?: Record<string, string>` — one string value per field key
- `args.push(`${field}: "${value}"`)` — single literal embedded as a single GQL arg

Two `.ne.` exclusions on `tag` would both key on `'tag'` in a `Record<string, string>` and one would clobber the other. Plan 24-03 must therefore choose ONE of:

(a) **Backend `.not in.A,B` syntax** — single string value, syntactically clean. UNVERIFIED against ZB GQL backend; no precedent in repo (grep returned 0 matches in `src/app`). Day-1 validation required.
(b) **Extend `GqlQueryOptions`** to allow `filters: Record<string, string | string[]>` and serialize each `string[]` as multiple GQL args. Requires modifying `buildQuery` in `graphql-read.service.ts`. Touches the central seam.
(c) **Build a separate filter envelope** outside `Record<string, string>` (e.g., `excludeTags: string[]` field) and serialize specially. Lowest blast radius if Plan 03 wants to keep the existing `filters` API stable.

Plan 24-03 Task 4 plans Day-1 validation of `.not in.` — that's the right instinct, but **the fallback (b) requires touching `graphql-read.service.ts`'s `buildQuery` method**, which the current plan does not yet scope as a task. Either Plan 03 adds a "extend GqlQueryOptions if .not in. unsupported" task, or Plan 01 pre-plumbs option (c).

**Recommendation:** Pre-validate `.not in.` against UAT BEFORE Wave 0 starts (cheap — one MCP run_sql or a curl). If unsupported, Plan 24-01 must add a task to extend `GqlQueryOptions.filters` shape. Director input wanted on whether to (a) try-and-pivot or (b) pre-validate.

### HIGH-3 — Phase-24 brief uses `isAdmin$` (Observable); actual API is `isAdmin()` (Signal)

**Verified by reading** `src/app/core/services/project-context.service.ts:18,25,60-62` — the field is a Signal (`signal<boolean>(false)` then `.asReadonly()`), called as `projectContext.isAdmin()`. Brief at `.planning/director/phase-24-brief.md:12, 36` uses `isAdmin$` Observable form.

**Status:** All five plans correctly use `isAdmin()` Signal (verified by reading 24-01 Task 2 helper). CONTEXT.md is authoritative. **The brief is the only artifact with the wrong name.** Plans are NOT defective; recommend the Director update the brief to match reality (Director already disclaimed in the brief: "or whatever the equivalent observable / signal is named — verify by reading the service after Phase 27 closure" → verified: it's `isAdmin()` Signal).

### HIGH-4 — Plan 24-04 component task missing the verbatim modernization-patterns block

**Verified by reading** Plan 24-04 Task 2 (admin-demo-data.component.ts creation): does NOT paste the non-negotiable Angular 21 patterns block in the task action body. Per memory `feedback_handoff_must_include_modernization_rules.md`, the block must be VERBATIM at the top of the executor's task description (linking MODERNIZATION_GUIDE.md is insufficient; even CONTEXT.md isn't enough).

**Fix:** Add the patterns block (control flow `@if`/`@for`, no `CommonModule`, field-level `inject()`, signal `input()`/`output()`, `<mat-progress-spinner>`, suffixed filenames, OnPush, standalone, Phase 20 error pattern) verbatim into Plan 24-04 Tasks 1 and 2. Plans 24-01, 24-02, 24-03, 24-05 don't create new components — service/spec edits are lower risk for the patterns block, but adding it for completeness is cheap.

## MEDIUM Concerns

### MED-1 — Plan-checker didn't actually write the report file

The plan-checker agent returned its findings in the chat message but did NOT write `24-PLAN-CHECK.md` to disk. This file (the one you're reading) was written by the orchestrator to capture the check. Standard agent-write-failure pattern (see memory `feedback_subagents_dont_write_files`). Not a plan defect, just a workflow note.

### MED-2 — Plan 24-04 lacks an explicit confirmation-dialog UX spec

Plan 24-04 mentions "MatDialog confirmation pattern (already in codebase)" in the locked decisions but the task body is light on confirmation UX details (button label, double-confirm pattern, typing "DELETE" to confirm, etc.). Director should clarify whether a single confirm-cancel dialog is sufficient or whether a "type DELETE to confirm" pattern is required for this destructive action.

### MED-3 — Plan-author skipped 24-PLAN-INDEX.md

Orchestrator asked planner for an INDEX file. Not produced. Low-impact (the 5 PLAN files are self-describing) but worth a 30-line index for /gsd-execute-phase to consume.

## LOW Concerns / Nits

- **LOW-1:** Plan filenames use `24-NN-PLAN.md` rather than `24-NN-PLAN-{slug}.md` from the orchestrator request. Functionally equivalent.
- **LOW-2:** Plan 24-03 modifies 21 service files in a single plan. Wave 2 task 2 should perhaps split into "atomic per-service commits" — currently scoped that way in the task body, just want to confirm gsd-execute respects the per-file commit boundary.
- **LOW-3:** Plan 24-05 includes `npm run build:vercel` as a verification step. Confirm Vercel build is still gated on this branch (memory says "Vercel project pending cleanup/removal").

## Strengths

- **Centralization.** Plan 03 augments the single seam (`GraphqlReadService` + `DemoVisibilityService`) instead of touching 21 services with duplicate filter logic. Right architectural call.
- **Two-UUID transition handling.** Plans correctly model both the global `81053c14-...` and legacy `d618b602-...` tags through Wave 0 constants.
- **Test discipline.** Per-service spec updates scoped tightly; no test-infra refactor proposed (matches `feedback_unit_tests_default_test_infra_deferred`).
- **Phase 27 contract consumption.** Plans correctly read `ProjectContextService.isAdmin()` rather than re-implementing admin detection (matches Director brief intent).
- **Tag UUIDs pinned.** No re-discovery during execute — UUIDs are constants in Plan 24-01.

## Recommendation

**PASS_WITH_FLAGS — halt for Director review.**

Three real pre-execute decisions are needed:

1. **HIGH-1 (hydra deletion):** Confirm scope — does Plan 24-04 attempt class-Object markDeleted only (Option 3), or include hydra Resource untagging as a sibling step, or wait for Kevin's word on cascade?
2. **HIGH-2 (filter syntax):** Authorize a 5-minute pre-execute MCP probe (`platform.Search` or curl against UAT GQL endpoint) to confirm `.not in.` syntax. If unsupported, add an extend-GqlQueryOptions task to Plan 24-01.
3. **HIGH-4 (modernization block):** Cheap fix — paste the patterns block into Plan 24-04 Tasks 1-2 before execute.

**HIGH-3 (brief vs reality)** is informational — plans are correct; brief should be edited for downstream readers but doesn't block execute.

Once those three decisions are made, plans are ready for /gsd-execute-phase 24.
