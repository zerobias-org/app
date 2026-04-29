---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: 3P Onboarding & Default Engagement
status: executing
last_updated: "2026-04-29T01:16:11.992Z"
last_activity: 2026-04-29
progress:
  total_phases: 19
  completed_phases: 7
  total_plans: 33
  completed_plans: 31
---

# STATE.md -- Session Context

**Session Name:** `poc/sme-mart`
**Date Created:** 2026-04-24
**Current Focus:** Phase 26 — seed-provider-zb-as-provider

---

## Current Position

Milestone: v1.4 3P Onboarding & Default Engagement
Phase: 27
Plan: Not started
Status: Ready to execute
Last activity: 2026-04-29

Next: Phase 26 Plan 02 (ZB-as-Provider Seed Batch) — seed ZeroBias org with company_info MPI + provider_type section

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-24)

**Core value:** Transparent, task-gated marketplace with demand/supply/transparency partitions
**Current focus:** v1.4 (phases 24-28, 30-31; gap at 29)
**Phase numbering:** continues from v1.3 (23) -- starts at 24

**v1.4 Milestone Structure:**

- Phase 24: Demo Data Visibility Gate (4-6 hrs) — Filter demo records from non-admin users
- Phase 25: Platform Data Audit (4-6 hrs) — Research: inventory ZB SDK data available for onboarding
- Phase 26: ZB-as-Provider Seed (5-7 hrs) — Create ZeroBias as provider with company_info convention
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

From v1.3 (partial -- phases 18-19 complete, 20-23 not started):

- Org Switcher user-menu dropdown (Phase 18)
- zbb local dev stacks -- SPA + Hub module scaffolding (Phase 19)
- Pipeline (UAT): `43f08afd-7ab9-4e99-a93c-619c46adaabe`

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

---

## v1.4 Roadmap Summary

**Created:** 2026-04-24 15:30 UTC

**Phases (7 total):**

| Phase | Goal | Hours | Requirements | Status |
|-------|------|-------|--------------|--------|
| 24 | Demo Data Visibility Gate | 4-6 | 5 (DG-01..05) | Not started |
| 25 | Platform Data Audit | 4-6 | 5 (PDA-01..05) | Plan 01/5 complete |
| 26 | ZB-as-Provider Seed | 5-7 | 5 (SP-01,02,04,05,06) | Not started |
| 27 | Auth Gate + Routing | 8-12 | 6 (AR-01..06) | Not started |
| 28 | Company Profile Form | 6-10 | 8 (CP-01..08) | Not started |
| 29 | DEFERRED TO v1.5 | — | — | Skipped |
| 30 | Default Board + Coming Soon | 6-8 | 6 (PB-01..07) | Not started |
| 31 | Dogfood + Smoke Test | 4-6 | 5 (V14-01..05) | Not started |

**Coverage:** 38/38 requirements mapped (100%)

**Success Criteria Derived:** 2-5 per phase, all observable user outcomes

**Dependencies validated:** Phase 24/25 independent, Phase 27 depends on 24, Phase 28 depends on 25+26, Phase 30 depends on 26+27+28, Phase 31 depends on all prior

---

## Session Continuity

**Resume this session:**

```bash
claude --resume poc/sme-mart
```

**Next step:**

`/gsd:plan-phase 24` -- start Phase 24 planning

**If starting fresh:**

- Read `.planning/PROJECT.md` for current state
- Read `.planning/ROADMAP.md` for v1.4 complete phase structure
- Read `.planning/REQUIREMENTS.md` for v1.4 scope (38 requirements)
- Read `.planning/director/phase-{24..28,30,31}-brief.md` for per-phase context (TBD)
- Read `CLAUDE.md` for project conventions

---

**Last Updated:** 2026-04-24 23:15 UTC
**Milestone v1.4:** EXECUTING — Phase 25 Plan 01 complete (infrastructure scaffold)
