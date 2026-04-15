# Director Session State
**Last updated:** 2026-04-15T18:45:00-07:00
**Milestone:** v1.2 (RFP Packages & Pilot Projects) — 5/5 phases complete, awaiting closeout + retro
**Phase focus:** Phase 17 shipped today; v1.2 milestone close pending.

## Mental Model

v1.2 is functionally complete. All five phases (13 Pilot Projects, 14 Invitation Controls, 15 Document Templates, 16 Form Builder, 17 Demo Seed Scripts) have shipped with code committed. Phase 16 closed with the schema inherited-props drift post-mortem today — that failure exposed a commit-claim drift pattern (commit message claimed a fix that wasn't staged) that also applied to the director itself this session (see errata 009). Phase 17 shipped via parent-session MCP wiring after the gsd-executor subagent silently stubbed real API calls (errata 010). Full round-trip verified against UAT 2026-04-15 — 7 entities seed + cleanup cleanly.

Key outstanding concern: `PipelineWriteService.pushEntity` is fire-and-forget in the Angular app. Phase 17's strict-await CLI exposed several schema gotchas (date-only fields, File base fields required, `markDeleted` empty-data rejection) that prod has been silently eating. Errata 011 proposes a v1.3 audit.

Five open errata (006-012, excluding the closed 007/008) are the v1.2 carry-forward list. Three of them (010 executor allowlist, 011 fire-and-forget, 012 pipeline→hydra) are cross-cutting process/platform findings, not just Phase 16 or 17 issues.

## Open Items

- **gsd-execute must commit Phase 17 ROADMAP/STATE closeout** — `.planning/ROADMAP.md` needs Phase 17 plan checkbox + progress table updated; `.planning/STATE.md` is stale (says "Phase 16 executing" on 2026-04-13). Director cannot edit these per skill rule. Tell gsd-execute to run `/gsd:next` or make a `docs(17-demo-seed-scripts): closeout` commit that updates both.
- **Push 11 commits to origin** once closeout commits land.
- **v1.2 retro not triggered yet** — once ROADMAP/STATE show 5/5 complete, run `/meta:director retro`.
- **Errata 006** (UAT vendor/buyer accounts deferred) remains open — blocks deferred flows 5-8 verification.
- **Errata 011** (fire-and-forget audit) is first docket item for v1.3.
- **Errata 012** (pipeline→hydra FK gap) needs Kevin escalation.

## Recent Decisions (details in DECISIONS.md)

- **2026-04-15**: Phase 17 wired via parent session when executor lacked MCP. Option B (real SDK calls, standalone CLI) chosen over Option A (one-shot MCP execute) because CLI reproducibility outweighed 1-2hr time cost. Rationale: avoid commit-claim drift.
- **2026-04-15**: Code and closeout commits separated for Phase 16/17. Rationale: if fix commit reverts, closeout doesn't lie.
- **2026-04-14**: Plans 087 (Form Template Library) and 088 (Split-screen Form Builder + Info Field) added to backlog as separate v1.3 phases rather than inline extensions of Phase 16.

## Failure Patterns Seen This Session

- **Director edited GSD artifacts** (ROADMAP.md commit c6fbb6b, VERIFICATION.md commit da8867e) in violation of skill boundary rule. Filed as errata 009.
- **Director skipped `required_reading` on skill resume** — read only SESSION-STATE.md, missed the boundary rule context. Filed as errata 009.
- **gsd-executor silently stubbed MCP calls** — allowlist gap, no escalation path. Filed as errata 010.
- **Working tree drift across sessions** — Phase 16 post-walkthrough UX fixes sat uncommitted (errata 007, now closed by da8867e).

## What to Do on Resume

1. **Check gsd-execute session state** — did Phase 17 ROADMAP/STATE closeout commit land? If yes, proceed; if no, nudge.
2. **Verify push happened** (`git log origin/poc/sme-mart..HEAD --oneline` should be empty).
3. **Run `/meta:director retro`** for v1.2. Errata 006-012 are the primary input. Compare director-caught (9 errata filed) vs director-missed (anything in gsd summaries we didn't flag).
4. **File backlog items** created from errata 010 (executor escalation rule), 011 (fire-and-forget audit), 012 (pipeline→hydra escalation). These are process/tech-debt items that should have entries in `.planning/BACKLOG.md` so they don't get forgotten in v1.3 kickoff.
5. **Update the director skill itself** if any findings are harness-level (not project-level). Per skill line 575-577: "When a retro reveals a process gap, the fix goes in the harness." Candidates: required_reading enforcement, GSD-artifact-modification check, executor allowlist pre-dispatch check.
