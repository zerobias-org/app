# Retrospective

## Milestone: v1.2 — RFP Packages & Pilot Projects

**Shipped:** 2026-04-15
**Phases:** 5 (13, 14, 15, 16, 17) | **Plans:** 14 | **Calendar days:** 14 (2026-04-02 → 2026-04-15)

### What Was Built

- **Phase 13 — Pilot Projects:** `projectType` discriminator (rfp|pilot|project), pilot completion workflow with conditional vetting checklist, pilot→project promotion, visual badges
- **Phase 14 — Invitation Controls:** `RfpInvitation` class, RfpInvitationService (11 methods), BidsService access gate, My Invitations page, Invited Vendors tab, teaser component with inline banners
- **Phase 15 — Document Templates:** `DocumentTemplate` + `DocumentInstance` classes, org-scoped templates + engagement-scoped instances, VariableSubstitutionService, Milkdown editor extension, preview-before-instantiate
- **Phase 16 — Form Builder:** `FormSubmission` class, FormSubmissionService + form lock, drag-drop FormBuilderComponent, DynamicFormRenderer (preview/fill/review modes), 6 field types, RFP wizard + bid review integration
- **Phase 17 — Demo Seed Scripts:** Standalone Node/TS CLI (`scripts/demo/{seed,cleanup,helpers,types}.ts`), real ZeroBias SDK wiring (`Pipeline.receive` + `hydra.Tag`), state-file-driven cleanup, end-to-end verified on UAT, 7 entity types seeded

### What Worked

- **Director review/checkpoint cadence.** 12 errata filed this milestone (vs zero formal errata in v1.0/v1.1). Pattern-to-patch time dropped from "next milestone" to "same day" for the issues caught pre-execution (errata 001-005).
- **Separate code + closeout commits** (Phase 16 `da8867e` + 17 `249e3df` pattern). Makes revert-without-lying possible. Audited into DECISIONS.md as a standing rule.
- **Parent-session MCP wiring recovery on Phase 17.** When the executor stubbed MCP calls, choosing Option B (rewrite helpers, ship real CLI) over Option A (one-shot MCP) preserved the long-term artifact. The CLI is now reusable for every future milestone's Friday demo.
- **Schema class ID inheritance is deterministic across environments** (per DECISIONS.md). Enabled verification against UAT without re-minting IDs after the CI→UAT migration.
- **Backlog items 087/088 routed to v1.3 as separate phases** instead of being stuffed into Phase 16 post-close. Resisted the "small UX improvements" creep.

### What Failed

**Director-side failures (novel to v1.2, documented as patterns):**
- **Director edited GSD artifacts** (ROADMAP.md `c6fbb6b`, VERIFICATION.md `da8867e`) in violation of skill boundary. Errata 009. Root cause: `required_reading` skipped on resume, task-mode reflex.
- **Director narrated findings without persisting them.** Prior to this session, several checkpoint observations existed only in conversation. Skill line 480-482 is now an explicit BLOCK criterion.
- **Working tree drift across sessions.** Phase 16 post-walkthrough UX fixes sat uncommitted for ~18hrs (errata 007). Post-phase checkpoint wasn't run automatically.

**Executor/platform-side failures:**
- **gsd-executor silently stubbed MCP calls** when its allowlist didn't include `mcp__zerobias__*`. Created a TODO-laden CLI that shipped with fake UUIDs before parent-session caught it via diff inspection (errata 010). No escalation rule exists in the agent definition.
- **Phases 15 AND 16 closed with schema Wave 0 incomplete** (PR open, CI SKIPPED, wrong YAML format). Verifier used "awaits schema PR merge, but does not block functional verification" as a loophole. Watch-list now treats schema-PR-unmerged as BLOCK regardless of app-side test results.
- **Schema inherited-property redefinition bug** (post-mortem 2026-04-14). Plan 15/16 author redefined `name`/`description` on classes extending `Object`. Dataloader rejection check lapsed because field YAMLs coincidentally matched. Also: commit `9c81a4e` claimed a fix that wasn't staged (commit-claim drift).
- **gsd-executor self-merged a schema PR** without waiting for upstream CI on Phase 16. Bypassed the one guardrail (dataloader on upstream infra). Reverted, then hardened Plan 16-00 with anti-self-merge guards.

**Cross-cutting platform findings (carry to v1.3):**
- **Fire-and-forget `PipelineWriteService.pushEntity`** masks schema-validation failures in production. Phase 17's strict-await CLI surfaced date-only vs ISO, `SmeMartDocument` base-class fields, and empty `markDeleted` rejection — all silently eaten in the Angular app (errata 011).
- **Pipeline→hydra Resource materialization gap.** Pipeline-created entities don't materialize as hydra `Resource` rows, so `tagResource`/`listTaggedResources` fail with FK violations. Forced Phase 17 cleanup to switch from tag-driven to state-file-driven. Will block org-scoped tagging in v1.3 Plan 087 (Template Library) (errata 012).

### Failure Patterns

| Pattern | Frequency | Severity | Prevention |
|---------|-----------|----------|------------|
| Agent uses `@Input()`/`@Output()`/constructor injection instead of signal functions | 3 (err 001, 003, 004) | medium | WATCH-LIST pre-scan of modified `.ts` files before commit |
| Agent uses `!important` in SCSS for Material overrides | 1 (err 002, 26 occurrences) | medium | Coding-style lint rule + `--mdc-*` custom-property examples in phase context |
| Test specs accumulate failures across phases without being fixed | 1 (err 005, 7 specs) | medium | `npm test` full-suite run as phase-close gate, not just changed-file test |
| Phase marked complete while schema PR unmerged/CI SKIPPED | 2 (Phases 15 & 16) | high | WATCH-LIST gate: `gh pr view --json state,statusCheckRollup` must be MERGED+SUCCESS |
| Post-phase UX fixes sit uncommitted in working tree | 1 (err 007) | medium | Post-phase director checkpoint before advancing; `git status --short \| grep <phase-scope>` must be empty |
| Director edits GSD-owned artifacts | 1 (err 009, 2 commits) | high | Required-reading enforcement on resume; skill line 162-170 reinforced in WATCH-LIST |
| gsd-executor silently stubs calls it cannot make | 1 (err 010) | high | Planner tool-availability pre-check; executor escalation rule ("STOP, don't fabricate") |
| Fire-and-forget `.catch()` masks schema errors in prod | * (systemic) | high | Audit all `pushEntity` callers in v1.3; surface errors to UI for user-triggered writes |
| Pipeline entities don't materialize as hydra Resources | 1 (err 012) | medium | Escalate to Kevin; avoid pipeline-entity tagging until resolved |
| Commit message claims a fix that isn't in the diff | 2 (9c81a4e schema, general pattern) | high | Pre-push hook: reconcile message-mentioned files against `git show HEAD --stat` |
| REQUIREMENTS.md checkboxes go stale | 3 (v1.0, v1.1, v1.2) | low | STILL NOT FIXED — 9/24 unchecked despite all satisfied. Either automate or remove the requirement. |

### Architectural Decisions Made During Execution

1. **Separate code + closeout commits per phase** (DECISIONS.md entry 2026-04-15). Standing rule, not just v1.2.
2. **Form builder is a reusable shared component**, not RFP-specific (DECISIONS.md entry 2026-04-02). Future engagement-side vendor requirements, vetting checklists will reuse it.
3. **State-file-driven cleanup** for demo CLIs (Phase 17), pending hydra Resource gap resolution.
4. **Director never edits GSD artifacts** (DECISIONS.md entry 2026-04-15). Reaffirmed; channel is `.planning/director/errata/` + briefs.
5. **Plans 087/088 as separate v1.3 phases** (DECISIONS.md entry 2026-04-14) rather than Phase 16 inline extensions.

### Process Improvements Established

- **Errata discipline.** 12 files committed individually this milestone. Audit trail survives session loss and feeds retro directly (this entry was largely synthesized from `.planning/director/errata/*`).
- **WATCH-LIST.md** now has 10 pattern groups (was 7 at v1.1 close). Four new groups added: Schema Workflow, Phase Completion Gate, Post-Phase Drift, Director Self-Discipline, Executor Allowlist, Fire-and-Forget, Schema Inherited-Property.
- **Strengthened director checkpoint rule:** schema PR must be MERGED+SUCCESS before accepting phase-complete; schema PRs must include both `classes/*.yml` AND `fields/*.yml`.
- **SCHEMA_CHANGE_PROCESS.md cross-check** added to review mode: director reads the process doc alongside any plan touching the schema repo.
- **Post-phase checkpoint requirement:** after gsd-executor reports phase complete, run director checkpoint before new work starts. Uncommitted edits force a `fix(<phase>)` follow-up commit.

### Open Items (Deferred to v1.3)

| Errata | Description | Priority |
|--------|-------------|----------|
| 006 | Phase 16 — 4 UAT flows deferred (vendor/buyer accounts missing on UAT) | medium — unblocks D3-05, D3-06 verification |
| 009 | Director modified GSD artifacts (process finding) | high — harness-level fix needed (see below) |
| 010 | gsd-executor MCP allowlist gap / escalation rule missing | high — blocks safe execution of any MCP-requiring plan |
| 011 | `pushEntity` fire-and-forget masks schema errors in prod | high — first docket item for v1.3 |
| 012 | Pipeline→hydra Resource FK gap | medium — needs Kevin escalation; blocks Plan 087 org-scoped tagging |

Also outstanding: **REQUIREMENTS.md checkboxes for D3-01..06 and DEMO-01..03 are unchecked** despite Phases 16 and 17 satisfying them. Same bookkeeping drift seen in v1.0 and v1.1 — third milestone in a row. Recommendation: automate or drop the checkbox convention.

### Harness-Level Improvements (Candidates)

Per skill line 575-577: "When a retro reveals a process gap, the fix goes in the harness." Candidates for upstream `meta-harness`:

1. **Enforce `required_reading` on resume.** SESSION-STATE alone doesn't re-inject the boundary rule. Skill should refuse to proceed past resume until the 13-item reading list is acknowledged, OR the boundary rule should be duplicated in the resume step.
2. **GSD-artifact-modification pre-check.** Before any `Write`/`Edit` on `ROADMAP.md`/`STATE.md`/`PLAN.md`/`SUMMARY.md`/`REQUIREMENTS.md`/`PROJECT.md`/`VERIFICATION.md`, skill should BLOCK and suggest an errata file + GSD command instead.
3. **Executor tool-availability pre-dispatch check.** `/gsd:execute-phase` (or the planner) should verify each plan's tool requirements against the executor's allowlist and BLOCK if MCP/SDK tools are required but unavailable.
4. **Commit-claim drift pre-push hook.** If a commit message names files, `git show HEAD --stat` should contain them. Prevents the `9c81a4e` and `c6fbb6b`-style lies.

### Cost Observations

- Calendar days: 14 (longest milestone by ~5 days vs v1.0/v1.1)
- Commits: ~85 across all phases + director workspace
- Errata filed: 12 (vs 0 formal in prior milestones)
- Gap closure plans: 0 (but 2 phases had executor-introduced bugs requiring rework before close — Phase 16 schema, Phase 17 stubs)
- Notable: the Phase 17 stub→real-SDK recovery cost ~1-2hr of parent-session time but prevented a false-positive closeout. Cheap insurance.

### Cross-Milestone Trend Update

| Metric | v1.0 | v1.1 | v1.2 |
|--------|------|------|------|
| Phases | 6 | 6 | 5 |
| Plans | 9 | 8 | 14 |
| Calendar days | 2 | 3 | 14 |
| Requirements satisfied | 32/32 | 33/33 | 24/24 (but 9/24 checkboxes stale) |
| Errata filed | 0 | 0 | 12 |
| Gap closure plans | 0 | 2 | 0 (but 2 executor-rework events) |
| Director-caught issues | n/a | n/a | 5 pre-exec + 7 post-exec |

---

## Milestone: v1.1 — Org Navigation & Vendor Profile

**Shipped:** 2026-04-02
**Phases:** 6 | **Plans:** 8

### What Was Built

- Three-tier org navigation (`/orgs` list, `/orgs/:orgId` detail, `/org` edit) with members, groups, boundaries
- MarketplaceProfileItem GQL schema entity with 6-section discriminator and JSON data blob
- VendorProfileService with full CRUD (GQL reads + Pipeline writes), bidirectional field mapping
- Corporate Profile tab with add/edit/delete, expiration indicators, renewal prompts
- Vetting pre-fill suggestion panel with section-to-vetting-type matching, pointer-based attachments
- Internal/External org badges, engagement/project counts, boundary parties tab with roles

### What Worked

- **Schema PR first** — getting MarketplaceProfileItem merged to `zerobias-org/schema:dev` before phases 9-11 unblocked the entire vendor profile pipeline cleanly
- **Phase 12 parallel execution** — boundary model ran independently of vendor profile phases, maximizing throughput
- **Single entity with section discriminator** — simpler than per-section classes, JSON data blob gave flexibility without schema proliferation
- **Pointer-based attachments** — vetting pre-fill references live profile data, no stale copies to maintain
- **Director review workflow** — `/meta:director` checkpoint and review modes caught issues early (e.g., parallelized metrics loading, proper ownerId filters)

### What Was Inefficient

- **REQUIREMENTS.md checkboxes stale again** — 18/33 checkboxes unchecked despite being verified satisfied. Same pattern as v1.0. Traceability auto-update still not implemented.
- **Phase 8 missing VERIFICATION.md** — schema phase was small (3 min execution) but should still have had formal verification for audit compliance
- **Nyquist partial compliance** — only Phase 7 fully compliant. Phases 8-12 have VALIDATION.md files but were not brought to formal compliance. Process overhead vs value trade-off.
- **Gap closure plans** — Phases 10 and 12 both needed follow-up plans to fix TypeScript errors. Root cause: initial execution plans didn't account for SDK type mismatches.

### Patterns Established

- **MarketplaceProfileItem** as the template for future org-scoped GQL entities with section discriminators
- **Section-to-vetting-type mapping** utility for cross-entity matching
- **Reference counting** before delete — `getProfileItemReferenceCount()` pattern for pointer integrity
- **Internal/External org detection** via `whoAmI().ownerId === org.id` comparison
- **BoundaryService** abstraction for platform boundary API calls (parties, roles, teams)

### Key Lessons

1. **Bookkeeping automation is overdue** — two milestones with stale checkboxes. Either automate or remove the requirement.
2. **Small phases still need VERIFICATION.md** — audit compliance shouldn't be optional regardless of phase size.
3. **SDK type alignment should be a plan step** — gap closure plans were predictable and could have been prevented by verifying SDK types before implementation.
4. **Director review adds value** — FLAG items caught real issues (5x perf improvement from parallelized loading, accurate counts from ownerId filters).

### Cost Observations

- Sessions: ~6-8 Claude Code sessions over 3 days
- Notable: Full vendor profile pipeline (schema → service → UI → vetting integration) shipped in ~2 calendar days. Boundary model ran in parallel, completing same day.

---

## Milestone: v1.0 — AuditgraphDB Migration

**Shipped:** 2026-03-19
**Phases:** 6 | **Plans:** 9

### What Was Built

- Migrated 8 entities from Neon PostgreSQL to AuditgraphDB Pipeline+GQL
- Built 9 new Project Bloom entity services on clean Pipeline foundation
- Created 17 field mapping constants with bidirectional roundtrip validation
- 94+ unit tests for Bloom, 27 for Wave 3, comprehensive mock infrastructure

### What Worked

- **Wave-based migration** — progressing from core flow → attachments → standalone kept risk low and momentum high
- **Direct swap pattern** — domain services were already isolated, so swapping internals was surgical
- **GSD workflow** — 6 phases planned, researched, executed, and verified in 2 days
- **Optimistic updates** — fire-and-forget Pipeline pattern with immediate returns gave good UX despite async writes
- **Field mapping constants first** — Phase 1 infrastructure prevented bugs in all subsequent phases

### What Was Inefficient

- **REQUIREMENTS.md bookkeeping** — checkboxes stopped being updated after Phase 2 (19/32 stale). SUMMARY.md frontmatter `requirements_completed` was never populated. Traceability should be auto-updated by the execution workflow.
- **Phase 6 VERIFICATION.md stale** — verification written before class ID gap was resolved, never updated. Created confusion during audit.
- **Build errors accumulated** — unrelated component build errors (document-share-dialog, rfp-dialog) blocked `npm test` but were never prioritized. Should have been fixed as they appeared.

### Patterns Established

- **Pipeline write + GQL read** as the standard data layer pattern for all SME Mart entities
- **`mapNeonToGql()` / `mapGqlToNeon()`** bidirectional field mapping with explicit constants
- **`fakePipelineWriteService()` / `fakeGraphqlReadService()`** test mock factories
- **Fire-and-forget pushEntity()** with `.catch()` error logging for optimistic updates
- **Flat-fetch + client-side tree rebuild** for hierarchical entities (folders, tasks)

### Key Lessons

1. **Bookkeeping automation matters** — manual checkbox updates don't scale past 2 phases. Future milestones should auto-update traceability.
2. **Fix build errors immediately** — letting them accumulate blocks verification and erodes confidence.
3. **Wave ordering by dependency** was the right call — core flow first proved the pattern, everything after was mechanical.

### Cost Observations

- Sessions: ~4-5 Claude Code sessions over 2 days
- Notable: The entire 8-entity migration + 9 new services shipped in ~2 calendar days — GSD workflow compressed what could have been 2+ weeks of manual planning into structured execution.

---

## Cross-Milestone Trends

| Metric | v1.0 | v1.1 |
|--------|------|------|
| Phases | 6 | 6 |
| Plans | 9 | 8 |
| Tasks | 22 | 26 |
| Commits | 58 | 56 |
| Calendar days | 2 | 3 |
| Requirements satisfied | 32/32 | 33/33 |
| Tech debt items | 3 | 4 |
| Gap closure plans needed | 0 | 2 |
