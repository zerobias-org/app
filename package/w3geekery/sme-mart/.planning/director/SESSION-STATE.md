# Director Session State
**Last updated:** 2026-04-10T17:00:00-07:00
**Milestone:** v1.2 (RFP Packages & Pilot Projects) — executing
**Phase focus:** Phase 14 checkpoint complete. Phase 15 next.

## Mental Model

v1.2 milestone executing. 2/5 phases complete (13 Pilot Projects, 14 Invitation Controls). Phase 14 passed checkpoint with 2 medium-severity errata (001: @Input() decorator on teaser, 002: 26 !important in SCSS). Both are code quality issues, not functional — phase is shippable. 10/10 UAT tests pass. GQL boundary rebuilt, schema 1.0.14 live, demo data repushed.

Plan 078 (Transparency Controls) is in active design — wireframes produced during this session at `.claude/sketches/078-transparency-wireframes.html`. This is pre-phase design work targeting v1.3+, running in parallel with v1.2 execution.

Key context:
- Schema workflow validated: YAML → PR to zerobias-org/schema:dev → promote to main → 15min reload → live on UAT
- Nic's "option #2" for GQL boundary rebuilds works (publish schema mod triggers dataloader)
- ngx-library at 0.2.29, Jasmine→Vitest migration complete

## Open Items
- Errata 001 (teaser @Input) — quick fix, can be done as /gsd:fast
- Errata 002 (!important in SCSS) — moderate fix, extract shared status chip mixin
- Plan 078 wireframes awaiting Clark's review and open question resolution (8 questions)
- Phase 15 (Document Templates) — research complete, needs /gsd:discuss-phase 15

## Recent Decisions
- Phase 14 COMPLETE — 10/10 UAT, 0 BLOCKs, 2 FLAGs, 3 NOTEs
- Transparency tab placement: recommending Governance group (not Tracking) — pending Clark's decision
- Wireframe produced: segmented toggle (Unresolved | All Matched | All) per Clark's annotation

## Failure Patterns Seen This Session
- Executor used @Input() decorator instead of input() signal — WATCH-LIST item missed during execution
- Executor used !important for Material chip overrides (26 instances) — common shortcut, but violates coding standards
- Summary referenced `npx vitest run` instead of `npm test` — minor process discipline

## What to Do on Resume
- If Clark approved errata fixes: run /gsd:fast for each (001 then 002)
- If Clark wants Phase 15: run /gsd:discuss-phase 15
- If Clark wants Plan 078 wireframe review: load .claude/sketches/078-transparency-wireframes.html and discuss open questions
- WATCH-LIST update: add "agent uses !important for Material chip overrides" pattern
