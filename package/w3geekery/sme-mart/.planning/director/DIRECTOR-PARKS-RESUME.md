# Director Parks — Resume Context

**Scope:** This file is the resume context for the Director Parks session (the meta:director role instance on SME Mart). Other Claude sessions on this repo have no reason to read it — it is owned by the Director role.

**If you are starting or resuming a Director Parks session, READ THIS FILE FIRST**, then `.planning/director/SESSION-STATE.md`, then the latest entries in `.planning/director/DECISIONS.md`.

**Session pointer:** `claude --resume "Director Parks"`
**Branch (app repo):** `poc/sme-mart`
**Working dir:** `/Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart`

---

## Role contract — permanent

Director Parks is an instance of the `/meta:director` role on SME Mart. Architect / QA orchestrator, NOT a GSD worker. Invoke `/meta:director` at the start of any session that's about to enter GSD workflow.

**Default boundary (what Director does NOT do by itself):**
- Does NOT run `/gsd:*` commands on its own initiative.
- Does NOT edit GSD artifacts: `ROADMAP.md`, `STATE.md`, `PLAN.md`, `SUMMARY.md`, `REQUIREMENTS.md`, `PROJECT.md`, `VERIFICATION.md`.
- Does NOT write phase task lists or execute phase tasks hands-on.
- Does NOT author `PLAN.md` files.
- Delegates GSD execution to gsd-* subagents (gsd-planner, gsd-executor, gsd-verifier, etc.) or to fresh sessions.

**What Director DOES by default:**
- Designs requirements.
- Authors briefs in `.planning/director/` (including `phase-{N}-brief.md`, walkthroughs, decision rationale).
- Reviews PRs, plans, verification reports.
- Runs retrospectives.
- Checkpoints execution: reviews output from gsd-* agents vs. brief intent.
- Files errata when drift is detected.
- Synthesizes architectural decisions into DECISIONS.md.

---

## DIRECT-REQUEST OVERRIDE — read this carefully

When Clark explicitly asks Director Parks to do something that falls outside the default boundary — including running a `/gsd:*` command, writing a GSD artifact, or executing hands-on work — **DO IT. Do not cite the boundary and decline.**

The boundary exists to prevent Director from SLIPPING into menial work by default. It does NOT exist to block direct user requests.

**Cost of declining a direct request:** forces the user to route through another Claude session, which can hit unrelated bugs (the `/mcp` TUI freeze, see issue [#4805](https://github.com/anthropics/claude-code/issues/4805)), cost real time, and fragment the conversation across sessions.

**How to judge:**
- If Clark said the words TO YOU ("you do X", "run Y", "go ahead and Z", "would you do the honors") → the request overrides the boundary. Do it.
- If you are spontaneously about to write `PLAN.md` or run `/gsd:execute-phase` without being asked → the boundary still applies. Stop.

Error toward acting-on-request. Retreating to the rule when explicitly asked is the failure mode being prevented here.

**Precedent:** 2026-04-24 — Director Parks declined `/gsd:new-milestone` when Clark asked directly. Clark routed to another session; that session hit the `/mcp` freeze bug; work was lost. The decline was me being rigid on the rule when Clark had explicitly asked. See `feedback_director_parks_role.md` in memory for the full critique.

---

## Current milestone state — v1.4 "3P Onboarding & Default Engagement"

**Design status: LOCKED.** All structural decisions resolved. Fully-committed director artifacts:
- `.planning/director/SESSION-STATE.md` — full mental model + decision list
- `.planning/director/DECISIONS.md` — 12+ entries including **Platform-Provider Distinguisher = option-b (MPI `provider_type` section)** locked 2026-04-28
- `.planning/director/bootstrap-w3geekery-engagement.md` — validated walkthrough recipe
- `.planning/director/COMPANY-INFO-CONVENTION.md` — **RATIFIED 2026-04-28 (no -DRAFT suffix)**, canonical 17-section catalog
- `.planning/director/PLATFORM-DATA-INVENTORY.md` — Phase 25 deliverable
- `.planning/director/phase-{24,25,26,27,28,30,31}-brief.md` — 7 phase briefs
- `.planning/director/brian-content-brief-v1.4-deferred.md` — **NEW 2026-04-27** — 7-section walkthrough doc for Tue/Fri Brian meetings (tier structure, pricing matrix, ToS, branding, marketing copy, opt-in confirm, long-term ownership). Brian gave answers in 2026-04-28 meeting; transcript pending `/tt:transcript`. Many original questions will be scrapped + new ones surface.

**Milestone shape (7 phases, Phase 29 deferred to v1.5):**

| # | Phase | Status |
|---|---|---|
| 24 | Demo Data Visibility Gate | not started |
| 25 | Platform Data Audit | ✅ COMPLETE 2026-04-27 |
| 26 | Seed ZB-as-provider + ratify `company_info` convention | **IN PROGRESS — Plan 26-01 CLOSED, Plan 26-02 in defect-fix loop, 26-03 pending** |
| 27 | Auth gate + onboarding routing + lazy-on-load default-engagement guard | not started |
| 28 | Company profile review/confirm form (section/data shape) | not started |
| 30 | Default Project board + "Coming Soon" placeholder surfaces | not started |
| 31 | W3Geekery as first customer + production smoke test | not started |
| ~~29~~ | DEFERRED to v1.5 | tier display / ToS / branding |

**ServiceOffering scope:** REMOVED from v1.4 per DECISIONS.md "ServiceOfferings Defer With Brian" (2026-04-24).

**Engagement naming convention:** `<Buyer> <- <Provider>` ASCII reverse-arrow, buyer-first, supply-flow direction. Default ZB: `"W3Geekery <- ZeroBias"`.

**Validated walkthrough UUIDs (UAT, do NOT delete):**
- Hydra Tag `a81cd320-243e-44eb-bdd9-9824019ef3dd` (`sme-mart.eng.w3geekery-default-zb`)
- Engagement Task `2c95bc18-a978-4766-a7d3-f7ceb8a9cff5` (code `aha1-6`)
- Engagement (external) `746010b7-dc99-436b-9142-8c4b85c5e623` — Object.tag now populated ✅
- Engagement (internal Object UUID) `f5361821-4beb-4e1b-8d92-04bc243fa63a`
- SmeMartProject default `ea4db55f-2c57-4567-a1be-6e7fd1a210bf` — Object.tag now populated ✅

**Class IDs (deterministic across env):**
- Engagement: `7711aa41-e55b-5cda-9b7a-35844a2006a1` (metadata UUID — needs verification of which UUID is for Pipeline.receive)
- SmeMartProject: `c66114a2-48e2-5b93-b7d6-7ccd6ef45a03` (metadata UUID — same caveat)
- MarketplaceProfileItem: **`7bcf86a5-91dc-520d-b9bf-e308b1078d46` is canonical** (platform-assigned, verified via `platform.Class.getClass` on UAT 2026-04-28).
- EngagementVettingItem: **`21f5841f-dd27-53ef-a0f5-6a816ec7f7e1` is canonical** (same audit).
- **Codebase const audit complete (2026-04-28).** 21/23 SME_MART_CLASS_IDS entries match platform; 2 are fictional (`ee1e68b7-...` for MPI, `66fa174f-...` for EngagementVettingItem). Both are silently failing in production — see errata 023 and DECISIONS.md "Platform-Assigned Class IDs Are Not Deterministic UUID v5". Plan 26-04 (handed to gsd-plan 2026-04-28) corrects both consts.

**Pipeline UUIDs:**
- UAT receiver: `43f08afd-7ab9-4e99-a93c-619c46adaabe`
- Prod receiver: `091d5068-0527-4f45-9839-37f6d5c1669e`

---

## Object.tag mechanism — validated + W3Geekery remediated

Canonical write shape: `tag: [{ value: "<hydra-tag-UUID>" }]` in Pipeline.receive payload at ingest. Immutable post-ingest. See DECISIONS.md "Object.tag Field Shape".

Read paths validated:
- Read-by-id: `platform.Object.getVersionByObjectIdOrVersionId` returns the `tag` array.
- Read-by-tag: GQL via `graphql.Boundary.boundaryExecuteRawQuery` with `ClassName(tag: { value: ".eq.<uuid>" }) { ... }`.

**W3Geekery remediation 2026-04-27:** Re-ingested Engagement (`746010b7-...`) and default SmeMartProject (`ea4db55f-...`) with `tag: [{value: "a81cd320-..."}]` populated. Tag-filter discovery works uniformly across W3Geekery records now. See DECISIONS.md "W3Geekery Object.tag Remediation".

---

## MarketplaceProfileItem section/data discriminator (Phase 28 critical)

**Schema correction surfaced 2026-04-27 via live MCP audit + introspection.** MarketplaceProfileItem is a generic `(section, data)` discriminator class — NOT a struct with `legalName/dba/logoUrl/...` fields. Each "field" of the company_info convention is its own MPI record keyed by `(orgId, section)`.

- Pipeline.receive replace key validated empirically as **`id` only** (not `(orgId, section)`). Per-section saves are independent.
- Recommended id pattern: `mpi-<orgId>-<section>` (deterministic, string accepted).
- Flat sub-sections preferred over JSON-encoded objects (e.g., `primary_contact.email`, `hq_location.city`).

`COMPANY-INFO-CONVENTION-DRAFT.md` rewritten with the canonical 17-section catalog. Phase 28 brief updated. Phase 26 will ratify (rename to drop `-DRAFT`).

See DECISIONS.md "MarketplaceProfileItem Replace Semantics".

---

## Cleanup queue (CLEANUP-25 in BACKLOG)

Three test residues to `markDeleted` in future Pipeline.receive batches (one per class — non-empty `data` required so piggyback on next real ingest):

| Class | Class ID (Pipeline.receive — canonical) | Records to delete |
|---|---|---|
| MarketplaceProfileItem | `7bcf86a5-91dc-520d-b9bf-e308b1078d46` | `mpi-test-a-cd7105df`, `mpi-test-b-cd7105df` — **CLEARED 2026-04-28** by Plan 26-02 seed batch (verified absent via GQL) |
| SmeMartProject | `c66114a2-48e2-5b93-b7d6-7ccd6ef45a03` | `64047b6c-52e7-4592-ac1d-27f5020d1e01` ("TAG-SHAPE-TEST-C", pre-existing) — pending next SmeMartProject ingest |

Phase 26 seed batch is the natural place to clean up the MPI residues. SmeMartProject residue defers until next SmeMartProject ingest.

---

## In-flight external blockers

| Owner | What | Unblocks |
|---|---|---|
| Andrey | Provision `w3geekery.uat.zerobias.com` subdomain | Branded-login UAT verification (NOT v1.4-blocking; fallback URL works) |
| Brian (CEO) | Pricing tiers, ToS, branding, opt-in-vs-auto | ALL non-blocking — placeholders ship |
| Nic | Linked Project mechanism | NOT v1.4-blocking (multi-3PAO is v1.5+) |

Kevin's READ-endpoint question (Object.tag discovery) was **resolved empirically** — not pending.

---

## Recent commits (2026-04-28)

Phase 26 commits since 2026-04-27 close:
- `cfa38a7` docs(26-01): lock platform-provider distinguisher decision (option-b)
- `2918e3d` docs(26-01): plan summary — convention ratified, distinguisher locked (option-b)
- `908872b` docs(26-01): state + roadmap updates — plan complete
- `9082418` test(26-02): add failing tests for seed-zb-provider.ts (red phase, option-b)
- `f825b2d` feat(26-02): implement seed-zb-provider.ts (green phase, option-b)
- `5f5e9fc` refactor(26-02): align src/ and scripts/ implementations (tests pass)
- `8283d93` docs(26-02): complete ZeroBias provider seed plan — option-b distinguisher locked, 5 tests passing
- (pending) gsd-execute fix commit on top — corrects 7 defects gsd-execute halt-diagnosed; once landed, 26-02 truly closes

Side-channel work 2026-04-27/28 (parallel to Phase 26):
- `36544dc` (on `w3geekery/tag` fork) — first PR ever on `zerobias-com/tag` (PR #1) introducing `marketplace` tag type with `platform_provider` + `demo` global tags. Awaiting Daniel Rojas review.
- Repo migration to `~/Projects/w3geekery/zb-forks/{com,org}/<repo>` — login×2, module, schema, product, vendor, tag relocated. 27 doc references updated. `/ss` skill updated. `app/` deferred to end-of-session (when this session exits).

---

## Phase 26 status — IN PROGRESS as of 2026-04-28

**Plan 26-01 (Ratify Convention + Lock Distinguisher) — CLOSED**
- Convention ratified at `.planning/director/COMPANY-INFO-CONVENTION.md` (no -DRAFT suffix)
- Distinguisher locked: **option-b (MPI `provider_type` section with `data: "platform"`)**. DECISIONS.md entry: "Platform-Provider Distinguisher (Phase 26 Plan 01)".

**Plan 26-02 (Seed Function + Pipeline.receive Batch + GQL Verification) — IN DEFECT-FIX LOOP**

gsd-execute initially declared 26-02 complete with 5/5 tests passing, then halted itself on Wave 2 quality verification with 7 defects:
1. Wrong MPI class ID — but the call here was REVERSED: codebase const `ee1e68b7-...` was actually the fictional one. The `7bcf86a5-...` from director artifacts WAS correct. gsd-execute used `7bcf86a5-...` and the seed succeeded. Audit 2026-04-28 confirmed this — see DECISIONS.md "Platform-Assigned Class IDs Are Not Deterministic UUID v5".
2. Wrong SDK shape — `client.platformClient()` (method) vs `client.platformClient` (property) — broke ng serve build with TS2339
3. `ZerobiasClientApp.getInstance()` doesn't exist (Next.js pattern carried into Angular code) — should be `inject(ZerobiasClientApi)`
4. Tests passed against fictional API mocks (mocks matched broken impl shape)
5. Task 3 NOT executed on UAT — agent reinterpreted as "document for someone else"
6. `scripts/seed-zb-provider.ts` is a stub
7. Gratuitous src/ + scripts/ duplication

Director's call (2026-04-28): **Option 1 — fix in place + actually seed.** Handoff sent to gsd-execute with 7 numbered conditions covering each defect, P1 build-fix flag (dev server blocked), commit format, and feedback memory creation.

**Plan 26-03 (Browse Providers UI tests + UAT manual verify)** — gated on 26-02 fix landing.

---

## Brian meeting 2026-04-28 (2 PM PT) — content brief consumed

Brian walked through `.planning/director/brian-content-brief-v1.4-deferred.md` and answered many sections in the meeting. Transcript pending — Clark will run `/tt:transcript` when ready. Director then needs to:
- Process answers into DECISIONS.md entries (especially anything data-model: tier structure, ServiceOffering scaffolding, opt-in confirms)
- Mark answered sections `[ANSWERED date - summary]` in the brief
- Surface NEW questions Brian raised — Clark warned the answers will scrap a lot of the original questions and create a new slew
- Determine if any answer un-defers Phase 29 (likely NOT yet — even fully-answered tier structure still needs follow-up implementation, which is v1.5 timing)

---

## In-flight tracker

| Item | Owner | Status |
|---|---|---|
| Phase 26-02 fix + actual UAT seed + GQL verify | gsd-execute | **VERIFIED 2026-04-28** — commit `d7e8cd2` landed; 8 MPI rows on UAT, residue cleared, build green. Director independent re-verification via GQL passed. |
| Plan 26-04: correct fictional class IDs (MPI + EngagementVettingItem) in pipeline-write.service.ts | gsd-plan | **HANDED OFF 2026-04-28** — copy-paste prompt delivered; gates on Plan 26-02 close (now closed). |
| Errata 023 + DECISIONS.md entry "Platform-Assigned Class IDs Are Not Deterministic UUID v5" | Director Parks | **DONE 2026-04-28** |
| Phase 20 (Fire-and-Forget Audit) — promote from TBD to actively planned | Director Parks | NEXT — should run before Phase 27 (auth gate + lazy guard relies on round-trip writes succeeding) |
| Brian meeting transcript processing | Clark + Director Parks | waiting on `/tt:transcript` |
| `zerobias-com/tag` PR #1 review | Daniel Rojas | NOT blocking (Phase 26 went option-b) |
| PKV API verification on UAT (zb-dx friction log 2026-03-13) | deferred | env file reverted; can't test until dev server unblocks; rerun after 26-04 lands |
| `app/` directory move to `zb-forks/org/app/` | end-of-session | deferred — needs session exit + memory dir rename + 11 worktree cleanup |

---

## Next-action sequence (when Director Parks resumes)

1. **Process Brian transcript** (`/tt:transcript` after Clark says go) — extract answers, file new DECISIONS.md entries for any data-model decisions, update `brian-content-brief-v1.4-deferred.md` status table, surface follow-up questions for next meeting.
2. **Review gsd-plan output for Plan 26-04** — checkpoint plan before execution. Verify TDD scope is tight (just the two consts, no Phase 20 scope creep), tests bind to canonical UUIDs, live-write verification on UAT included.
3. **Wave 3 (Plan 26-03)** review when ready — Browse Providers UI tests + UAT manual verify. Now unblocked since live MPI data is on UAT.
4. **Phase 26 close** — verification report, SUMMARY consolidation, mark complete.
5. **Promote Phase 20 (Fire-and-Forget Audit)** from TBD to actively planned. Errata 023 confirms two real instances of the silent-failure pattern — Phase 20 is no longer theoretical. Should run before Phase 27 to avoid stacking more silent-failure exposure during onboarding routing work.
6. **Phase 27** — auth gate + lazy-engagement-guard. Brief refresh likely needed post-Phase-26 + Phase-20.

---

## Session etiquette reminders

- Address as Clark / Clarky; PT timezone.
- Admin mechanism is `getPrincipal().isAdmin` — never propose alternatives.
- No agent handoffs for MCP work that mutates real platform state — Clark wants manual walkthroughs for that.
- Brian asks aren't blockers — placeholders ship; Brian input refines if/when it arrives.
- **Never name Brian (CEO) as a code-author.** Brian sets directives, doesn't write code. Default to "backend team" / "UI team" — never guess names. See `.claude/docs/ORG_CHART.md` for authoritative roster.
- **Never ask "want to pause?" or "continue?".** Whether Clark pauses is none of my concern. He'll stop me if he wants.
- Never fork repos without explicit auth; never merge PRs autonomously; SUCCESS-only CI counts.
- Don't suggest breaks; don't ask "what's next?"; answer questions vs. assume action.
- Director can use `Tell gsd-X:` checkpoint handoff format when delegating between agents/sessions (no quotes, copy-paste-ready).

---

## Quick-start prompt for the next Director Parks session

> Resume Director Parks. Read `.planning/director/DIRECTOR-PARKS-RESUME.md` FIRST (role contract + direct-request override + v1.4 state + IN-FLIGHT TRACKER). Then `.planning/director/SESSION-STATE.md` and recent `.planning/director/DECISIONS.md` entries. The /meta:director skill applies. v1.4 milestone design is locked (7 phases). **Phase 25 COMPLETE.** **Phase 26: Plan 01 + Plan 02 CLOSED** (option-b distinguisher locked; UAT seed verified 2026-04-28 — 8 MPI rows landed via canonical class id `7bcf86a5-...`). **Plan 26-04 handed to gsd-plan** to correct two fictional class id consts (`ee1e68b7-...` for MPI and `66fa174f-...` for EngagementVettingItem in `pipeline-write.service.ts:33,36`) — confirmed via 2026-04-28 audit of all 23 SME_MART_CLASS_IDS against `platform.Class.getClass`. Both fictional consts have been silently failing in production via fire-and-forget `.catch` (errata 023, DECISIONS.md "Platform-Assigned Class IDs Are Not Deterministic UUID v5"). **Brian meeting transcript pending** — process via `/tt:transcript` when Clark signals ready. **Phase 20 (Fire-and-Forget Audit)** should be promoted from TBD to actively planned before Phase 27. Direct request overrides default boundary (you can run /gsd:* if asked).

---

## Why this file is here instead of `.claude/restart_context.md`

`.claude/restart_context.md` is ambiguous territory — any Claude session that resumes on this repo might read it. Director Parks role rules and in-flight state need a location that is clearly owned by the Director role so other sessions don't accidentally pick up Director-scoped rules and get confused about their own role. `.planning/director/DIRECTOR-PARKS-RESUME.md` is owned. Other sessions reading this path would know they stepped into Director territory.

---

## Update from gsd-execute session — 2026-04-28 (after this file's last save)

Director Parks: while you were away, the gsd-execute worker ran Plan 26-03 to plan-level completion. Briefing you back in.

### What landed

| Commit | What |
|--------|------|
| 0ab1850 | Wave 1 RED — MPI-shaped failing tests for ProviderProfilesService |
| 67c5883 | Wave 2 GREEN — MPI/GQL implementation (direct boundaryExecuteRawQuery, bypassing GraphqlReadService per your decision lock) |
| 3188023 | Wave 3 — Component specs (provider-list/detail/card) for ZB-shaped data |
| **fff95b2** | **(authored by you, not the executor)** — removed demo-mode short-circuit on graphql-read.service.ts. Originally locked OUT of scope for 26-03; you over-rode that decision mid-flight to unblock the impersonate-fix push (50f5d51). 46 previously-failing tests recovered. |
| b6e1244 | Bug fix — listProviders was using fabricated `orgId: { _or: [...] }` filter shape; replaced with ZB's actual `.in.UUID1,UUID2` operator (source: `~/Projects/zb/platform/graphql/README.md`). Caught at local-dev verification. |
| 90b4b1c | Cleanup — 22 unused-symbol diagnostics resolved (CRUD stub params prefixed with `_`, dead `signal`/`catalog` imports removed) |
| 6fc9730 | SUMMARY.md for 26-03 |
| 61a8a3f | ROADMAP.md — phase 26 marked 4/4 complete |

### What's verified (local dev only)

- `npm run dev` (localhost frontend → UAT data) shows ZeroBias card on `/providers` ✅
- Browser console clean ✅
- All targeted unit tests pass (37/37); `tsc --noEmit` clean on both configs; `ng build --configuration=development` succeeds
- **Detail page `/providers/<zb-org-id>` rendering: NOT YET CONFIRMED** — Clark hadn't checked at handoff time
- **UAT verification deferred to post-deploy** — pre-deploy UAT was a structural mistake by the executor; corrected on the fly

### What is NOT done yet (your decisions to make)

Phase 26 plan-level work is complete, but the **phase-level closure** has not been run. Per the execute-phase workflow, after the last plan SUMMARY lands, the orchestrator normally:

1. **Regression gate** — run prior-phase test files (24/25 plans) to catch cross-phase regressions
2. **`gsd-verifier`** — spawn verifier subagent → produces `26-VERIFICATION.md` checking phase goal vs. requirements (SP-01, SP-02, SP-04, SP-05, SP-06)
3. **`gsd-tools phase complete 26`** — auto-updates STATE.md frontmatter, checks roadmap checkbox, advances next-phase pointer
4. **PROJECT.md evolution** — move SP-* requirements from Active → Validated
5. **Final docs commit**

The gsd-execute session deliberately did NOT run any of these autonomously — that's a Director call.

Also flagging: **STATE.md prose body is stale**. Frontmatter tracks correctly (`completed_plans: 29`), but the body's "Current Position" section still reads "Plan 2 of 3 / Next: Plan 02". The body refresh typically happens during `phase complete`.

### Three options presented to Clark; he hasn't chosen yet

- **(A) Run phase-level closure now** — gsd-execute runs regression gate → spawns `gsd-verifier` → `phase complete 26` → commits. Wraps up cleanly, advances STATE.md to phase 27.
- **(B) Hold for detail-page verification first** — Clark verifies `/providers/<zb-org-id>` on local dev, then close.
- **(C) Hold entirely** — phase closure is its own session; resume tomorrow / next director window.

Clark mentioned he might have accidentally killed Director Parks while this was in flight, hence this update. Pick up wherever you choose.

### Clark told me explicitly

> "don't touch anything else just tell it what you told me above pls"

So: in-flight tracker, role contract, decisions log, and quick-start prompt sections above are untouched. Only this section is new.

