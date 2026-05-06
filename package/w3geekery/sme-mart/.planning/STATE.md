---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: 3P Onboarding & Default Engagement
status: executing
current_phase: 24
last_updated: "2026-05-01T23:30:00.000Z"
last_activity: 2026-05-01
progress:
  total_phases: 20
  completed_phases: 10
  total_plans: 50
  completed_plans: 48
---

# STATE.md -- Session Context

**Session Name:** `poc/sme-mart`
**Date Created:** 2026-04-24
**Current Focus:** Phase 24 — Demo Data Visibility Gate (next-up, ready to execute)

---

## Current Position

Milestone: v1.4 3P Onboarding & Default Engagement
Phase: 24 (executing; Plan 01 complete)
Plan: 01 — Demo Visibility Service Foundation (Wave 0) — ✅ COMPLETE 2026-05-01
Status: Executing (Plan 02 onwards — next)
Last activity: 2026-05-01

**Phase 20 closed 2026-04-29** (commits `977828c..904276d`):

- Wave 1: AUDIT.md (60 sites refined), class-ID re-verification (23/23 canonical), telemetry instrumentation on receiver-rejection path, 8 telemetry specs.
- Wave 2: 42 fire-and-forget call sites remediated with `await` + try/catch + `MatSnackBar` + explicit `callSiteTag` + re-throw across 17 services. v1.5 polish entries `FF-POLISH-1/2/3` filed.
- Wave 3: Kill-network rejection-path coverage closed (note-folder gap), parameterized round-trip-per-class-id drift gate over all 23 classes, AUDIT prose cleanup with concrete code citations, soak docs.
- Verifier: 8/8 FF-* requirements ✅ (`.planning/phases/20-fire-and-forget-audit/VERIFICATION.md`).
- Build green at HEAD: `npx tsc --noEmit` clean, `npm test` 1537/1537 passing across 118 files.
- UAT 1-week soak begins post-merge; **non-blocking** per `UAT-SOAK-READY.md`. Phase 20 is closed regardless of soak outcome — soak findings would file as new errata or BACKLOG entries against deployed telemetry.

**Phase 28 Progress (2026-04-30):**

- Plan 01: Constants + Model — ✅ COMPLETE 2026-04-30 (commit `eb66f96`)
- Plan 03: CompanyProfileFormComponent — ✅ COMPLETE 2026-04-30 (commit `b6e885c`)
- Plan 04: Routing Integration — ✅ COMPLETE 2026-04-30 (commit `b9e78bb`)
- Plan 02: MarketplaceProfileService adapter (GQL read + Pipeline write) — ✅ COMPLETE 2026-04-30 (commit `2c1a2c0`)
- Plan 05: Routing integration E2E test — ✅ COMPLETE 2026-04-30 (commits `216ab62`, `064705e`, `4d21f2c`)

**Build state after Plan 05:** `npx tsc --noEmit` clean, all Phase 28 tests 25/25 passing (component + service specs).

**Phase 27.5 (Modernization Enforcement) — CLOSED 2026-05-01:**

- 5/5 plans complete; verifier 8/8 ENF-* requirements ✅
- Verification report: `.planning/phases/27.5-modernization-enforcement/27.5-VERIFICATION.md`
- Director-approved pivots:
  1. Plan 03 — diff-based lint-only CI (`.github/workflows/lint.yml`) instead of full `npm test` + lint. Rationale: 1561 pre-existing violations + fork lacks ZB private-registry auth (Vault/ZB_TOKEN blocker); tooling installed into RUNNER_TEMP as workaround.
  2. Plan 04 — inventory snapshot (INITIAL-AUDIT.md) instead of annotation sweep. Rationale: ~15-20 hrs avoided; Touch-It-Fix-It cleanup model adopted via reframed MODERN-CLEANUP-1 BACKLOG entry.
- Plan 01: ESLint Foundation (commits 5368aff, 49b1895, 7e41252, 5da666f, e840763) — flat config, 6/7 patterns, 1561 pre-existing violations baselined
- Plan 02: Pre-Commit Hook (commits 76eaaef, 28831b6) — husky v9 + lint-staged, latency 3.9-4.7s flagged
- Plan 03: CI Lint Gate — `.github/workflows/lint.yml` with diff-based lint-staged + RUNNER_TEMP tooling
- Plan 04: Inventory + BACKLOG reframe — INITIAL-AUDIT.md + MODERN-CLEANUP-1 (touch-it-fix-it)
- Plan 05: Developer Guidance — MODERNIZATION_GUIDE.md Touch-It-Fix-It + troubleshooting (8 BEFORE/AFTER fixes); CLAUDE.md machine-enforcement note + cross-links

**Phase 24 (Demo Data Visibility Gate) — EXECUTING:**

- Plan 01: Demo Visibility Service Foundation (Wave 0) — ✅ COMPLETE 2026-05-01
  - Task 1: Constants module (DEMO_TAG_UUID_LIST)
  - Task 2: DemoVisibilityService with isLocalDemoTagged() + applyVisibility<T>()
  - Task 3: Test helper (fakeProjectContextService mock)
  - Task 4: Unit tests (12 test cases across 2 describe blocks)
  - Requirements DG-01..DG-05 verified
  - Commits: `eb66f96`, `c9b3e1f`, `d2e5f4a`, `2f8c6b9`
  - Summary: `.planning/phases/24-demo-data-visibility-gate/24-01-SUMMARY.md`

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-29 — FF-01..FF-08 promoted to ✅ VALIDATED)

**Core value:** Transparent, task-gated marketplace with demand/supply/transparency partitions
**Current focus:** v1.4 (phases 24-28, 30-31; gap at 29)
**Phase numbering:** continues from v1.3 (23) -- starts at 24

**v1.4 Milestone Structure:**

- Phase 24: Demo Data Visibility Gate (4-6 hrs) — Filter demo records from non-admin users
- Phase 25: Platform Data Audit (4-6 hrs) — Research: inventory ZB SDK data available for onboarding
- Phase 26: ZB-as-Provider Seed (5-7 hrs) — Create ZeroBias as provider with company_info convention — ✅ Complete 2026-04-29
- Phase 27: Auth Gate + Onboarding Routing + Lazy Guard (8-12 hrs) — Authenticate, route, auto-create engagement
- Phase 28: Company Profile Review/Confirm Form (6-10 hrs) — Pre-populate from platform data, save
- Phase 29: DEFERRED TO v1.5 — Tier display, ToS, branding (intentionally skipped)
- Phase 30: Default Project Board + Coming Soon Placeholders (6-8 hrs) — Seeded board with 3 feature stubs
- Phase 31: W3Geekery Dogfood + Smoke Test (4-6 hrs) — End-to-end validation

**Total:** 7 phases, ~37-55 hrs estimated, 38 requirements mapped

**Dependency Chain:**

```
Phase 24 (Demo Gate)           Phase 25 (Platform Audit)
      |                              |
      +-> Phase 27 (Auth + Route) <-+
              |
         Phase 28 (Profile Form) <-+ (Phase 25 pre-fill)
              |                     |
              +-> Phase 26 (Seed Provider)
              |
              +-> Phase 30 (Board)
                       |
                   Phase 31 (Smoke Test) -- depends on ALL prior
```

---

## Accumulated Context

From v1.0:

- All 17 entity types on AuditgraphDB (Pipeline writes + GraphQL reads)
- 14 domain services migrated, 7 still on SmeMartDbService
- Neon archival scheduled 2026-04-02

From v1.1:

- Three-tier org navigation (/orgs, /orgs/:orgId, /org)
- MarketplaceProfileItem GQL schema entity (6 sections)
- VendorProfileService with full CRUD
- Corporate Profile tab with expiration indicators
- Vetting pre-fill suggestion panel with pointer attachments
- Internal/External org badges, project parties tab

From v1.2:

- Pilot Projects (projectType discriminator, completion + promotion workflow)
- RfpInvitation + closed/invitation-only RFPs (11-method service, access gate, My Invitations, Invited Vendors)
- DocumentTemplate + DocumentInstance (+ VariableSubstitutionService, Milkdown editor extension)
- FormSubmission + FormBuilder + DynamicFormRenderer (drag-drop builder, 6 field types, preview/fill/review modes)
- Demo seed CLI (real SDK wiring, state-file cleanup, end-to-end verified on UAT)

From v1.3 (phases 18-19 complete, phases 20 closed 2026-04-29 in v1.4 timeline; phases 21-23 deferred to v1.5):

- Org Switcher user-menu dropdown (Phase 18)
- zbb local dev stacks -- SPA + Hub module scaffolding (Phase 19)
- Pipeline (UAT): `43f08afd-7ab9-4e99-a93c-619c46adaabe`
- **Phase 20 (Fire-and-Forget Audit) closed 2026-04-29** — receiver-rejection telemetry live, 42 user-action sites remediated, class-id round-trip drift gate enforced at unit-test time. UAT 1-week soak runs post-merge (non-blocking).

From v1.3/v1.4 director work (pre-milestone):

- Default ZB engagement bootstrap recipe validated on UAT (W3Geekery proof-of-concept)
- Object.tag field shape validated: `[{ value: "<tag-uuid>" }]` at ingest time
- W3Geekery default engagement: `746010b7-dc99-436b-9142-8c4b85c5e623`
- W3Geekery default project: `ea4db55f-2c57-4567-a1be-6e7fd1a210bf`
- Engagement Tag: `a81cd320-243e-44eb-bdd9-9824019ef3dd`
- Branded login deployed at w3geekery.uat.zerobias.com
- SME Mart deployed at uat.zerobias.com/sme-mart

Platform observations (carry-forward):

- Pipeline-created objects do NOT materialize as hydra Resource rows -- tagResource FK fails
- Pipeline.receive rejects empty data[] even with markDeleted populated
- Date-only fields reject full ISO timestamps
- Pipeline.receive tagIds does NOT tag ingested Objects (tags batch-job record only)
- Tags are immutable post-ingest -- must be set at Pipeline.receive time via Object.tag field
- Object.tag shape: `[{ value: "<tag-uuid>" }]` at ingest time (locked 2026-04-24)
- Telemetry: every PipelineWriteService rejection emits `[PIPELINE_WRITE_FAILURE] {className, callSite, errorMessage, timestamp}` via console.warn (Phase 20)

---

## v1.4 Roadmap Summary

**Created:** 2026-04-24 15:30 UTC

**Phases (7 total):**

| Phase | Goal | Hours | Requirements | Status |
|-------|------|-------|--------------|--------|
| 24 | Demo Data Visibility Gate | 4-6 | 5 (DG-01..05) | Not started |
| 25 | Platform Data Audit | 4-6 | 5 (PDA-01..05) | Plans 01-03 complete |
| 26 | ZB-as-Provider Seed | 5-7 | 5 (SP-01,02,04,05,06) | ✅ Complete 2026-04-29 |
| 27 | Auth Gate + Routing | 8-12 | 6 (AR-01..06) | Not started — **next** |
| 28 | Company Profile Form | 6-10 | 8 (CP-01..08) | Plan 01 complete (constants/model) |
| 29 | DEFERRED TO v1.5 | — | — | Skipped |
| 30 | Default Board + Coming Soon | 6-8 | 6 (PB-01..07) | Not started |
| 31 | Dogfood + Smoke Test | 4-6 | 5 (V14-01..05) | Not started |

**Coverage:** 38/38 requirements mapped (100%)

**Success Criteria Derived:** 2-5 per phase, all observable user outcomes

**Dependencies validated:** Phase 24/25 independent, Phase 27 depends on 24, Phase 28 depends on 25+26, Phase 30 depends on 26+27+28, Phase 31 depends on all prior

**Phase 20 (Fire-and-Forget Audit)** ran interleaved with v1.4 onboarding work (commits `977828c..904276d`, closed 2026-04-29) and is no longer interleaved — it is closed.

### Roadmap Evolution

- Phase 27.5 inserted after Phase 27 (2026-04-30): Modernization Rule Enforcement — ESLint + pre-commit + CI gate (URGENT). Origin: Phase 27 Wave 2 imported `CommonModule` despite the rule being pasted in CONTEXT.md and handoff. Brief: `.planning/director/phase-27.5-brief.md`. Blocks Phase 30 + 31 plans until closed.

---

## Session Continuity

**Resume this session:**

```bash
claude --resume poc/sme-mart
```

**Next step:**

`/gsd-execute-phase 24` -- Phase 24 (Demo Data Visibility Gate), re-spec'd around Option X, ready to execute. Director fires this as the next major action.

**If starting fresh:**

- Read `.planning/PROJECT.md` for current state
- Read `.planning/ROADMAP.md` for v1.4 complete phase structure
- Read `.planning/REQUIREMENTS.md` for v1.4 scope (38 requirements)
- Read `.planning/director/phase-{24..28,30,31}-brief.md` for per-phase context (TBD)
- Read `.planning/phases/20-fire-and-forget-audit/PHASE-20-SUMMARY.md` for Phase 20 closure context (recent)
- Read `CLAUDE.md` for project conventions

---

**Last Updated:** 2026-05-01 23:30 UTC
**Milestone v1.4:** EXECUTING — Phase 20 closed (2026-04-29), Phase 26 closed (2026-04-29), Phase 25 Plans 01-03 complete, Phase 28 closed (2026-04-30, 5/5 plans + 8/8 must-haves), Phase 27 closed (2026-05-01, AR-01..AR-06 validated), **Phase 27.5 closed (2026-05-01, 5/5 plans + 8/8 ENF-* requirements verified)**; Phase 24 (Demo Data Visibility Gate, re-spec'd around Option X) is next-up.
