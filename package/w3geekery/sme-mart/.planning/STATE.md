---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: 3P Onboarding & Default Engagement
status: defining_requirements
last_updated: "2026-04-24T14:00:00.000Z"
last_activity: 2026-04-24 -- Milestone v1.4 started
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# STATE.md -- Session Context

**Session Name:** `poc/sme-mart`
**Date Created:** 2026-04-24
**Current Focus:** Defining requirements for v1.4

---

## Current Position

Milestone: v1.4 3P Onboarding & Default Engagement
Phase: Not started (defining requirements)
Plan: --
Status: Defining requirements
Last activity: 2026-04-24 -- Milestone v1.4 started

Next: Define requirements, then create roadmap

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-24)

**Core value:** Transparent, task-gated marketplace with demand/supply/transparency partitions
**Current focus:** v1.4 (phases 24-31, gap at 29)
**Phase numbering:** continues from v1.3 (23) -- starts at 24

**v1.4 Milestone Structure:**

- Phase 24: Demo Data Visibility Gate (4-6 hrs)
- Phase 25: Platform Data Audit (4-6 hrs)
- Phase 26: ZB-as-Provider Seed + company_info + tiers (5-7 hrs)
- Phase 27: Auth Gate + Onboarding Routing + Lazy Guard (8-12 hrs)
- Phase 28: Company Profile Review/Confirm Form (6-10 hrs)
- Phase 29: DEFERRED to v1.5 (tier display / ToS / branding)
- Phase 30: Default Project Board + "Coming Soon" placeholders (6-8 hrs)
- Phase 31: W3Geekery Dogfood + Production Smoke Test (4-6 hrs)

**Total:** 7 phases, ~37-55 hrs estimated

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

From v1.3 (partial -- phases 18-19 completed, 20-23 deferred):

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

---

## Session Continuity

**Resume this session:**

```bash
claude --resume poc/sme-mart
```

**Next step:**

`/gsd:discuss-phase 25` -- gather context for Phase 25 (Platform Data Audit, agreed first target)

**If starting fresh:**

- Read `.planning/PROJECT.md` for current state
- Read `.planning/ROADMAP.md` for v1.4 phase structure
- Read `.planning/REQUIREMENTS.md` for v1.4 scope
- Read `.planning/director/phase-{24..28,30,31}-brief.md` for per-phase context
- Read `.planning/director/DECISIONS.md` for v1.4 decisions
- Read `CLAUDE.md` for project conventions

---

**Last Updated:** 2026-04-24
**Milestone v1.4:** ACTIVE -- defining requirements
