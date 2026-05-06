# Errata 025 — Wave 2 SUMMARY Committed to Phantom Directory

**Date:** 2026-05-04
**Severity:** Medium (build OK; doc target wrong; downstream consumers read wrong location)
**Type:** Path-target drift (recurring)
**Phase:** 24, Plan 03 Wave 2

## What happened

Commit `f9ae984` ("docs(24-03): wave 2 summary — 6 of 22 services completed, pattern verified") wrote the Wave 2 SUMMARY to:

```
.planning/phases/24-default-project-board-coming-soon-placeholders/24-03-WAVE-2-SUMMARY.md
```

This directory did not exist before `f9ae984` — the agent created it. The slug `default-project-board-coming-soon-placeholders` is Phase 30's slug; the agent prefixed it with `24-` and committed into a fictional Phase 24 alias.

Real Phase 24 directory is `24-demo-data-visibility-gate/`. Wave 2's plan, spec, prior summary etc. all live there. Phase 30's directory `30-default-project-board-coming-soon-placeholders/` exists separately (untracked at parkit time, present on disk).

## Recurrence pattern

This is the **second time** in Phase 24 that an agent landed a doc artifact at the wrong target:

- **Wave 1 defect-fix loop (2026-05-04, earlier):** Director-spec'd update of `24-CONTEXT.md`; agent created a new project-level `.planning/CONTEXT.md` instead. Corrected at commit `917e8d2`.
- **Wave 2 (2026-05-04, this errata):** Director-spec'd output to `24-03-WAVE-2-SUMMARY.md` in Phase 24's directory; agent invented a phantom directory and committed there. Corrected at commit `4232a9e`.

Both incidents involved an agent-generated path target that LOOKED plausible but didn't match the canonical phase directory structure. In both cases, Director caught it at checkpoint review (not before the commit landed).

## Root cause hypothesis

Plan 24-03's frontmatter and `<output>` tag say the SUMMARY belongs at `.planning/phases/24-demo-data-visibility-gate/24-03-WAVE-2-SUMMARY.md` — explicit, exact path. The agent ignored the explicit path and constructed one from the phase-number prefix + a slug it pulled from somewhere (likely confused with the Phase 30 brief that's filed alongside Phase 24 in the milestone).

Possible contributing factors:
1. Phase 30's slug being adjacent in the working set may have leaked into the agent's context.
2. The agent did not `ls .planning/phases/` before deciding the target — pattern-matched on phase number alone.
3. Director handoff did not explicitly enumerate the target path (the plan body did, but the handoff repeated the directive only at a high level).

## Disposition

- **Fix-up:** `git mv` + commit `4232a9e`. Phantom directory removed.
- **Process:** Future Director handoffs SHOULD include the explicit absolute target path for any SUMMARY/CONTEXT artifact, not just say "write the SUMMARY." The plan body is necessary but not sufficient evidence the agent will read it.
- **Future signal:** if this happens a third time in Phase 24 or any v1.4 phase, escalate to a stronger pre-commit gate (e.g., a hook that verifies `.planning/phases/<n>-*` directories exist for any n referenced in commit messages).

## Related

- Errata 024 — same session, same systemic discipline gap (commit body claimed 2-arg, actual 3-arg). Different artifact (commit message vs. file path) but same pattern: agent's stated output drifts from the actual artifact, Director catches at checkpoint.
- Wave 1 CONTEXT.md misplacement (commit `917e8d2`) — first occurrence of the path-target drift in Phase 24.
