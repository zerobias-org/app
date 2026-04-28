# Phase 20 — Handoff from Parallel Director Session (#2)

**Session:** Director Parks instance #2 (parallel)
**Branch:** `director-parks-2-phase20`
**Worktree:** `/Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart-dp2`
**Base:** `a4cbc67` (DP1's `docs(director): errata 023 — fictional class IDs audit + cross-refs`)
**Authored:** 2026-04-28
**Status:** PARKED — plan ready for Director review (DP1 verdict landed: all 4 decisions concurred)

---

## Cherry-pick scope (DP1 picks these back to `poc/sme-mart`)

### Returns to `poc/sme-mart`

These are the prep artifacts. They reflect already-committed errata 023 work on `poc/sme-mart` and are immediately useful regardless of when Phase 20 actually executes:

| SHA | Subject | Files |
|---|---|---|
| `21d6091` | docs(phase-20): refresh brief for errata 023 + add call-site audit | `.planning/director/phase-20-brief.md` (refresh), `.planning/director/phase-20-call-site-audit.md` (new) |
| `bb44c49` | docs(roadmap): refine Phase 20 entry — cross-reference brief + audit, expand requirements to FF-01..FF-08 | `.planning/ROADMAP.md` (Phase 20 entry edits) |

### Stays on `director-parks-2-phase20`

The actual Phase 20 plan + this handoff note. They surface to `poc/sme-mart` only when Phase 20 enters execution. Until then, they live on the feature branch:

| SHA | Subject | Files |
|---|---|---|
| `b243935` | docs(phase-20): add 3-wave plan from gsd-planner — ready for Director review | `.planning/phases/20-fire-and-forget-audit/20-01-PLAN.md`, `20-02-PLAN.md`, `20-03-PLAN.md` (1370 lines total) |
| (this commit) | docs(phase-20): handoff note from parallel session #2 | `.planning/director/phase-20-handoff-from-parallel-session.md` |

---

## What changed (mental-model delta)

### Phase 20 promoted from theoretical to required

Errata 011 (2026-04-15) flagged fire-and-forget `.catch()` as a **silent-failure risk** — no confirmed instances. Errata 023 (2026-04-28) confirmed **two real production bugs** hiding behind that pattern:

| Class | First plan | Time silently failing | Production impact |
|---|---|---|---|
| MarketplaceProfileItem | Plan 041 | months | ZERO MPI writes ever landed through `vendor-profile.service.ts` (149/204/232) until Plan 26-02 bypassed `PipelineWriteService` directly. |
| EngagementVettingItem | Plan 063 | months | ZERO vetting-item writes ever landed through `vetting.service.ts` (184/226/283/309). |

Plan 26-04 (commit `b1e997b`, merged 2026-04-28) corrected the two fictional consts. **That fixed the immediate symptom; it did not fix the silent-failure mode.** Phase 20's job is to close the silent-failure mode itself so future regressions surface to users instead of disappearing into `console.error`.

### Brief refresh highlights

- Milestone target moved from v1.3 to **v1.4 (recommended insertion before Phase 27)**. Phase 27's auth gate + lazy-on-load default-engagement guard relies on round-trip writes succeeding; running it on top of an unaudited fire-and-forget surface stacks more silent-failure exposure during onboarding routing work. Final ordering is GSD's call.
- Requirements expanded **FF-01..FF-05 → FF-01..FF-08**:
  - FF-02 tightened: mandate `platform.Class.getClass(<name>)` re-verification of every `SME_MART_CLASS_IDS` entry at audit time (catches future drift, not just the two known fictional consts).
  - FF-06 (new): verify all 16 AWAITED call sites' callers actually surface errors. An `await` whose throw lands in a swallowing context is the same bug.
  - FF-07 (new): WATCH-LIST — `.catch(err => console.error(err))` is BLOCK for user-triggered actions.
  - FF-08 (new): WATCH-LIST — `(deterministic UUID v5 from schema)` comments on class-ID consts are SUSPECT.
- Effort estimate refreshed ~8h → ~10h (audit+instrument ~6h + opportunistic SIMPLE remediation ~4h).
- Origin field expanded to cite errata 023 as the promotion trigger.

### Audit seed

`phase-20-call-site-audit.md` catalogs **60 call sites** found via `grep -rn "pushEntity\|pushEntities" src/ --include="*.ts"` on 2026-04-28 (older brief said 48 — drift since 2026-04-15):

- **44 fire-and-forget** (`.catch(err => console.error)`)
- **16 already-awaited**

Preliminary classification (Phase 20 audit task refines): 33 CRITICAL, 9 MEDIUM, 2 LOW (fire-and-forget); 5 CRITICAL, 11 AWAITED-VERIFY (awaited).

The 7 confirmed silent-failing sites from errata 023 (3 MPI + 4 vetting) are flagged as rows 1–7 of the CRITICAL table.

---

## 3-wave plan structure (Director-mandated, gsd-planner faithful)

Wave structure is binary: SIMPLE goes now, COMPLEX defers. There is no MEDIUM bucket in the wave plan — collapse what the seed audit calls "MEDIUM" into either SIMPLE or COMPLEX based on whether `await + toast` is sufficient or a UX rework is needed.

**Wave 1 — Audit + Instrumentation** (`20-01-PLAN.md`, 285 lines, FF-01/02/03/06)
- Refine 60-site seed → canonical AUDIT.md
- `platform.Class.getClass(<name>)` against every `SME_MART_CLASS_IDS` entry (table appended to AUDIT.md)
- Verify all 16 AWAITED callers surface errors (any swallowing caller promoted to SIMPLE)
- Add structured-log telemetry to `PipelineWriteService` rejection path
- **Caller signatures unchanged in this wave**

**Wave 2 — CRITICAL+SIMPLE remediation** (`20-02-PLAN.md`, 536 lines, FF-04/05/07/08)
- TDD per service: failing-write spec FIRST (RED), then `await + MatSnackBar` surface (GREEN), then refactor
- Mock SDK shape correctly per `feedback_tests_passing_against_wrong_shape_mocks.md`
- CRITICAL+COMPLEX call sites file backlog entries (see Director Decision #4 below)
- Update WATCH-LIST per FF-07 + FF-08

**Wave 3 — Verification** (`20-03-PLAN.md`, 549 lines)
- Kill-network E2E per remediated site: trigger user action, mock SDK rejection, assert visible error surface fires
- Round-trip test per class id: `pushEntities` minimal-but-valid object, GraphQL read-back
- `npm test` (targeted), `npm run build:prod`, `tsc --noEmit` all green
- UAT 1-week soak runs post-merge (does not block phase close)

---

## Director decisions (resolved during planning)

DP1 verdict on all four: **concurred, no overrules.**

### Decision #1 — Class-ID re-verify all 23 in Wave 1 (don't trust 2026-04-28 audit)

- **Resolution:** Re-verify every entry in `SME_MART_CLASS_IDS` against `platform.Class.getClass(<name>)` at Wave 1 execution time. Append the verification table to AUDIT.md.
- **Rationale:** The 2026-04-28 audit was solid but Phase 20 may run weeks from now and class registry can drift. Re-verify-at-execute-time is correct discipline, not redundant. FF-02 mandates this.
- **Cost:** ~30 minutes. Worth it.

### Decision #2 — Deterministic probe IDs for round-trip cleanup

- **Resolution:** Wave 3 round-trip tests use deterministic ids `phase-20-probe-<className>` so re-runs replace residue rather than accumulate.
- **Rationale:** Matches the 26-02 / 26-04 cleanup pattern. CLEANUP queue handles persistent residue if any escapes. Don't block phase close on cleanup.
- **Note:** If anything residual remains after Wave 3, add a CLEANUP entry pointing to the probe IDs by name.

### Decision #3 — Don't skip ServiceOffering call sites despite v1.5 deferral

- **Resolution:** Treat `service-offerings.service.ts:109, 139` as CRITICAL+SIMPLE in Wave 2 alongside the others. Apply the same `await + MatSnackBar` remediation.
- **Rationale:** Silent-failure correctness is orthogonal to data-model deferral. If ServiceOffering ends up changing data model in v1.5, the toast surface remains correct (it's just a save-failed toast). If ServiceOffering ends up removed entirely in v1.5, the call sites + their fixes go away together — no extra cleanup cost.

### Decision #4 — Append to BACKLOG.md under "Fire-and-Forget Remediation (Phase 20 deferrals)"

- **Resolution:** Wave 2 Task 4 appends a new section to `.planning/BACKLOG.md` titled `## Fire-and-Forget Remediation (Phase 20 deferrals)`. One entry per CRITICAL+COMPLEX call site: file:line | className | proposed remediation | complexity rationale | severity (all CRITICAL).
- **Rationale:** Project convention treats BACKLOG.md as single source of truth.

---

## State of the phase artifacts

```
.planning/director/
├── phase-20-brief.md                    [refreshed; commit 21d6091; cherry-picks back]
├── phase-20-call-site-audit.md          [new; commit 21d6091; cherry-picks back]
├── phase-20-handoff-from-parallel-session.md  [new; this file; STAYS on feature branch]
├── errata/011-pipeline-fire-and-forget-masks-errors.md  [unchanged on poc/sme-mart]
├── errata/023-fictional-class-ids-silent-failures.md    [unchanged on poc/sme-mart]
└── DECISIONS.md "Platform-Assigned Class IDs..."        [unchanged on poc/sme-mart]

.planning/ROADMAP.md                     [Phase 20 entry refined; commit bb44c49; cherry-picks back]

.planning/phases/20-fire-and-forget-audit/
├── 20-01-PLAN.md                        [Wave 1; commit b243935; STAYS on feature branch]
├── 20-02-PLAN.md                        [Wave 2; commit b243935; STAYS on feature branch]
└── 20-03-PLAN.md                        [Wave 3; commit b243935; STAYS on feature branch]
```

`STATE.md`, `REQUIREMENTS.md`, `PROJECT.md` — UNTOUCHED by DP2 (intentional; DP1 manages those, and STATE.md was mid-flux when DP2 inspected — frontmatter showed `milestone: v1.5` while body was v1.4).

---

## What DP1 needs to do

1. **Cherry-pick `21d6091` and `bb44c49` back to `poc/sme-mart`.**
   ```
   git -C /Users/cstacer/Projects/w3geekery/zerobias-org-forks/app cherry-pick 21d6091 bb44c49
   ```
   No conflicts expected (these files were not modified on `poc/sme-mart` between `a4cbc67` and now from DP2's view; verify before cherry-pick).
2. **Leave `b243935` (the 3 plan files) and this handoff note on `director-parks-2-phase20`.** They surface only when Phase 20 enters execution.
3. **When Phase 20 actually executes** (currently positioned to run before Phase 27 per director recommendation, but final ordering is yours):
   - Merge or cherry-pick `b243935` from `director-parks-2-phase20` to whatever execution branch.
   - Have gsd-executor open `20-01-PLAN.md` first, work waves sequentially.
   - REQUIREMENTS.md will need FF-06/07/08 added (gsd-executor or gsd-planner can do this as part of Wave 1 execution; DP2 deliberately did not edit REQUIREMENTS.md).
4. **Worktree cleanup** when all-this is done:
   ```
   git -C /Users/cstacer/Projects/w3geekery/zerobias-org-forks/app worktree remove ../sme-mart-dp2
   git -C /Users/cstacer/Projects/w3geekery/zerobias-org-forks/app branch -D director-parks-2-phase20  # only after merge/pick
   ```

---

## Open / not-blocking

- **Telemetry sink choice** (Wave 1 Task 3): plan defers selection to execution time. Wave 1 execution greps for existing sinks (Sentry / posthog / `LogService`); falls back to `console.warn('[PIPELINE_WRITE_FAILURE]')` with structured payload if nothing's wired. Director decision deferred — execution-time call.
- **REQUIREMENTS.md update for FF-06/07/08** (3 new requirements derived directly from errata 023): not done by DP2. The brief is the authoritative source until REQUIREMENTS.md catches up. Cleanest moment to update is Wave 1 execution.
- **`/tmp/dp2-phase-20-call-site-audit.md`** leftover from worktree setup: per DP1 instruction 2026-04-28 ("leave it; macOS tmp policy or next reboot will clean it"), no manual cleanup.

---

## Session etiquette / parking note

DP2 followed all original spawn-prompt constraints:

- ✓ Worktree isolation (after one missed-constraint recovery — see git history for the brief moment DP2 was on `poc/sme-mart` before stash + worktree create)
- ✓ No `/gsd:execute-phase` or any GSD orchestrator command
- ✓ No `STATE.md` / `ROADMAP.md` edits beyond the narrow Phase 20 entry refinement (per DP1 expanded scope this turn)
- ✓ No `SUMMARY.md` or `VERIFICATION.md` authored
- ✓ Did not push `director-parks-2-phase20` anywhere; local branch only
- ✓ Stopped at "plan ready for Director review"
- ✓ Time budget respected (well under 2-3 hour cap)

DP2 is parked. Resume not anticipated unless DP1 wants iteration on the plan (in which case re-route to this session before worktree removal).
