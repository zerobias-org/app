# Director Session State
**Last updated:** 2026-04-10T20:00:00-07:00
**Milestone:** v1.2 (RFP Packages & Pilot Projects) — executing
**Phase focus:** Phases 13-15 complete. Phase 16 next.

## Mental Model

v1.2 milestone executing. 3/5 phases complete (13 Pilot Projects, 14 Invitation Controls, 15 Document Templates). All errata fixed (001-005 closed). Test suite fully green: 1259/1259 passing across 102 spec files.

Phase 15 schema PR #41 needs merge to zerobias-org/schema:dev for GQL boundary rebuild (~15min after merge). Until then, DocumentTemplate and DocumentInstance entities won't be queryable on UAT.

Plan 078 (Transparency Controls) wireframes produced at `.claude/sketches/078-transparency-wireframes.html`. 8 open questions unresolved. Pre-phase design work targeting v1.3+.

Process improvements this session:
- Added ANGULAR_PATTERNS.md and MODERNIZATION_GUIDE.md to sme-mart-architect skill's "Always read first" list
- Added MODERNIZATION_GUIDE.md reference to CLAUDE.md (one-liner with key rule inline)
- WATCH-LIST updated with Phase 14-15 patterns (chip styling, @Input migration)

## Open Items
- Schema PR #41 (Phase 15) — needs merge for GQL boundary
- Plan 078 wireframes — 8 open questions pending Clark's review
- Phase 16 (Form Builder) — needs /gsd:discuss-phase 16 (has research flag: JSON Schema subset + DynamicFormComponent)
- Phase 17 (Demo Seed Scripts) — depends on 13-16

## Errata Summary (all closed)
- 001: @Input() on teaser → FIXED
- 002: 26x !important in SCSS → FIXED
- 003: @Input/@Output on markdown-editor → FIXED
- 004: constructor injection on variable-panel → FIXED
- 005: 7 failing spec files / 33 tests → FIXED

## Recent Decisions
- Phase 14 COMPLETE — 10/10 UAT
- Phase 15 COMPLETE — 6/6 verification, 123 tests
- Transparency tab placement: recommending Governance group — pending Clark's decision
- sme-mart-architect skill now references MODERNIZATION_GUIDE.md + ANGULAR_PATTERNS.md

## Failure Patterns Seen This Session
- @Input() decorator instead of input() signal — recurring across Phases 14 and 15
- !important for Material chip overrides — extracted to shared mixin
- constructor injection leaking through — recurring
- Test specs not updated when components modernized to inject() — caused 33 accumulated failures
- Background agent spent 57 min analyzing without making changes — should retry or do directly

## What to Do on Resume
- Check schema PR #41 merge status
- Phase 16: /gsd:discuss-phase 16 (Form Builder — largest phase, research flag)
- Plan 078: review wireframes with Clark, resolve 8 open questions
- WATCH-LIST: add "specs must be updated when components migrate to inject()" pattern
