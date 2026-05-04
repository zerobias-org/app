# Director Parks — Resume Context

**Scope:** This file is the resume context for the Director Parks session (the meta:director role instance on SME Mart). Other Claude sessions on this repo have no reason to read it — it is owned by the Director role.

**If you are starting or resuming a Director Parks session, READ THIS FILE FIRST**, then `.planning/director/SESSION-STATE.md`, then the latest entries in `.planning/director/DECISIONS.md`.

**Session pointer:** `claude --resume "Director Parks"`
**Branch (app repo):** `poc/sme-mart`
**Working dir:** `/Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart`

---

## ⚠️ Director directive 2026-05-01 — Deployment paths LOCKED

3P customer apps in `zerobias-org/app` deploy ONLY to **uat, qa, prod**. `dev` and `ci` are valid ZB **platform** environments (ZB itself runs there) but are NOT deploy targets for 3P apps in this repo. Encoded permanently in sme-mart `CLAUDE.md` "Deployment Paths" section (commit `240edda`). BACKLOG `DEV-CI-PURGE-1` tracks the broader sweep (strip `build:dev`/`build:ci` script variants, branch→env mapping docs at app-root, any GH workflow targeting dev/ci).

## ✅ Phase 27.5 CLOSED 2026-05-01 — enforcement gate operational

Phase 27.5 closed `08cc25a` after gsd-verifier passed 8/8 ENF-* requirements (`27.5-VERIFICATION.md`). All five waves landed with two Director-approved pivots that dropped 15-20 hr off the original budget AND dissolved a cross-team auth blocker:

1. **Plan 03 — diff-based lint-only CI (`lint.yml` not `test-and-lint.yml`).** Full-repo lint would have punished PRs for 1561 pre-existing violations; full deps require `@zerobias-org`/`@zerobias-com` private-registry auth the fork doesn't have. Resolution scoped CI to public-only lint deps via `${RUNNER_TEMP}/lint-tools` symlink workaround. Both verification runs captured (fail https://github.com/w3geekery/app/actions/runs/25234090327, pass https://github.com/w3geekery/app/actions/runs/25234121514).
2. **Plan 04 — inventory snapshot (`INITIAL-AUDIT.md`) not annotation sweep.** Touch-it-fix-it cleanup model encoded in `MODERN-CLEANUP-1` reframe. Closure = zero rule violations on re-run.

Enforcement chain is operational at three layers: ESLint config (Plan 01) + pre-commit hook with cross-package early-exit + cache flag (Plan 02) + diff-based CI gate (Plan 03), with developer-facing docs (`CLAUDE.md` Angular 21 Patterns + `MODERNIZATION_GUIDE.md` Touch-It-Fix-It rule + "If Lint Fires on You" troubleshooting for 8 rules) closing the contract (Plan 05). Tech debt: `CI-LINT-INSTALL-1` BACKLOG entry tracks the `${RUNNER_TEMP}` symlink workaround replacement.

## ⚠️ CRITICAL — GSD command format changed (2026-04-30)

**GSD updated 1.30.0 → 1.38.5.** Slash command format moved from colon to hyphen:

| Old (≤1.30) | New (1.38.5) |
|---|---|
| `/gsd:plan-phase` | `/gsd-plan-phase` |
| `/gsd:execute-phase` | `/gsd-execute-phase` |
| `/gsd:insert-phase` | `/gsd-insert-phase` |
| `/gsd:verify-work` | `/gsd-verify-work` |
| `/gsd:reapply-patches` | `/gsd-reapply-patches` |
| `/gsd:update` | `/gsd-update` |

Non-GSD plugins keep colons: `/meta:director`, `/meta:sync`, `/meta:backlog`, `/meta:errata`, `/parks`, `/tt`, etc. **Only GSD changed.**

`gsd-local-patches/verify-phase.md` (BLOCKED + filter_deferred_items evidence-enforcement) was reapplied via `/gsd-reapply-patches` and merged adapted to the new structure (PARTIAL status was removed upstream; safeguard now applies to BLOCKED and cross-phase deferral paths). Two atomic commits pending in `~/.claude/` (left dirty for review per Clark).

---

## ⚠️ AskUserQuestion is GLOBALLY BANNED (2026-04-30)

Added to deny list at `~/.claude/settings.json:182`. Tool's overlay UI hides last lines of conversation output; Clark finds it irritating. Do not search for it; do not attempt to invoke it. Use plain-text confirmation prompts instead.

---

## Role contract — permanent

Director Parks is an instance of the `/meta:director` role on SME Mart. Architect / QA orchestrator, NOT a GSD worker. Invoke `/meta:director` at the start of any session that's about to enter GSD workflow.

**Default boundary (what Director does NOT do by itself):**
- Does NOT run `/gsd-*` commands on its own initiative.
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

When Clark explicitly asks Director Parks to do something that falls outside the default boundary — including running a `/gsd-*` command, writing a GSD artifact, or executing hands-on work — **DO IT. Do not cite the boundary and decline.**

The boundary exists to prevent Director from SLIPPING into menial work by default. It does NOT exist to block direct user requests.

**Cost of declining a direct request:** forces the user to route through another Claude session, which can hit unrelated bugs (the `/mcp` TUI freeze, see issue [#4805](https://github.com/anthropics/claude-code/issues/4805)), cost real time, and fragment the conversation across sessions.

**How to judge:**
- If Clark said the words TO YOU ("you do X", "run Y", "go ahead and Z", "would you do the honors") → the request overrides the boundary. Do it.
- If you are spontaneously about to write `PLAN.md` or run `/gsd-execute-phase` without being asked → the boundary still applies. Stop.

Error toward acting-on-request. Retreating to the rule when explicitly asked is the failure mode being prevented here.

---

## Current milestone state — v1.4 "3P Onboarding & Default Engagement"

**Design status: LOCKED.** All structural decisions resolved. Fully-committed director artifacts:
- `.planning/director/SESSION-STATE.md` — full mental model + decision list
- `.planning/director/DECISIONS.md` — 12+ entries
- `.planning/director/bootstrap-w3geekery-engagement.md` — validated walkthrough recipe
- `.planning/director/COMPANY-INFO-CONVENTION.md` — RATIFIED 2026-04-28
- `.planning/director/PLATFORM-DATA-INVENTORY.md` — Phase 25 deliverable
- `.planning/director/phase-{24,25,26,27,27.5,28,30,31}-brief.md` — 8 phase briefs
- `.planning/director/brian-content-brief-v1.4-deferred.md` — Brian Tue/Fri walkthrough doc

**Milestone shape (8 phases including 27.5 insert; Phase 29 deferred to v1.5):**

| # | Phase | Status |
|---|---|---|
| 20 | Fire-and-Forget Audit (reclaimed from v1.3 deferral) | ✅ COMPLETE 2026-04-29 |
| 24 | Demo Data Visibility Gate | **EXECUTING WAVE 1.** gsd-execute landed DEMO_TAG_UUIDS module (`48f9140`) + DemoVisibilityService client-side post-filter (`39ee02c`) + fakeProjectContextService mock helper (`820916c`). Wave 1 spec test in flight (uncommitted `demo-visibility.service.spec.ts`). Plan re-spec'd around Option X (client-side post-filter) after Decision-Probe-1 found `.ne.`/`.not in.` broken on tag arrays in ZB GQL; brief refreshed `431eafa`. |
| 25 | Platform Data Audit | ✅ COMPLETE 2026-04-27 |
| 26 | Seed ZB-as-provider + ratify `company_info` convention | ✅ COMPLETE 2026-04-28; UAT-deployed 2026-04-29 |
| 27 | Auth gate + onboarding routing + lazy-on-load default-engagement guard | ✅ COMPLETE 2026-04-30 — verifier 14/14, commits `5b594c6..43f8d1c` |
| 27.5 | Modernization rule enforcement (ESLint + pre-commit + CI gate) | ✅ COMPLETE 2026-05-01 — verifier 8/8 ENF-* (`27.5-VERIFICATION.md`); enforcement chain operational (ESLint config + pre-commit hook + diff-based CI gate); two Director-approved pivots (Plan 03 lint-only, Plan 04 inventory-not-sweep). Closure commit `08cc25a`. |
| 28 | Company profile review/confirm form | ✅ COMPLETE 2026-04-30 |
| 30 | Default Project board + "Coming Soon" placeholder surfaces | brief refreshed `b7f9b80` (`/projects` route slot pinned post-Wave-3); plan PAUSED awaiting 27.5 closure |
| 31 | W3Geekery as first customer + production smoke test | not started; depends on 30 |
| ~~29~~ | DEFERRED to v1.5 | tier display / ToS / branding |

**ServiceOffering scope:** REMOVED from v1.4 per DECISIONS.md "ServiceOfferings Defer With Brian" (2026-04-24).

**Engagement naming convention:** `<Buyer> <- <Provider>` ASCII reverse-arrow. Default ZB: `"W3Geekery <- ZeroBias"`.

**Validated walkthrough UUIDs (UAT, do NOT delete):**
- Hydra Tag `a81cd320-243e-44eb-bdd9-9824019ef3dd` (`sme-mart.eng.w3geekery-default-zb`)
- Engagement Task `2c95bc18-a978-4766-a7d3-f7ceb8a9cff5` (code `aha1-6`)
- Engagement (external) `746010b7-dc99-436b-9142-8c4b85c5e623`
- Engagement (internal Object UUID) `f5361821-4beb-4e1b-8d92-04bc243fa63a`
- SmeMartProject default `ea4db55f-2c57-4567-a1be-6e7fd1a210bf`

**Class IDs (deterministic across env):**
- Engagement: `7711aa41-e55b-5cda-9b7a-35844a2006a1`
- SmeMartProject: `c66114a2-48e2-5b93-b7d6-7ccd6ef45a03`
- MarketplaceProfileItem: **`7bcf86a5-91dc-520d-b9bf-e308b1078d46`** (canonical, platform-assigned)
- EngagementVettingItem: **`21f5841f-dd27-53ef-a0f5-6a816ec7f7e1`** (canonical)

**Pipeline UUIDs:**
- UAT receiver: `43f08afd-7ab9-4e99-a93c-619c46adaabe`
- Prod receiver: `091d5068-0527-4f45-9839-37f6d5c1669e`

---

## Admin detection — CORRECTED + WIRED

**Canonical contract (MCP-verified):** `clientApi.danaClient.getOrgApi().getRequestOrgMember(orgMemberId)` returns `OrgMemberExtendedWithAdminFlag` with required `admin: boolean` field.

**Wired in app:** `onboardingGuard` (Phase 27 Wave 2 patch `d4c542e`) calls this and hydrates `ProjectContextService.setIsAdmin(boolean)`. **Phase 24 + future admin-aware code MUST consume `ProjectContextService.isAdmin$`** (or equivalent observable) — do NOT re-call the admin SDK directly in services.

Memory `project_sme_mart_admin_detection.md` was wrong for ~7 days (cited non-existent `getPrincipal().isAdmin`); CORRECTED 2026-04-30. Source-of-truth doc at `.planning/docs/SDK_VERIFICATION_SOURCES.md`.

---

## Object.tag mechanism — validated + W3Geekery remediated

Canonical write shape: `tag: [{ value: "<hydra-tag-UUID>" }]` in Pipeline.receive payload at ingest. Immutable post-ingest. See DECISIONS.md "Object.tag Field Shape".

Read paths validated:
- Read-by-id: `platform.Object.getVersionByObjectIdOrVersionId` returns the `tag` array.
- Read-by-tag: GQL via `graphql.Boundary.boundaryExecuteRawQuery` with `ClassName(tag: { value: ".eq.<uuid>" }) { ... }`.

**W3Geekery remediation 2026-04-27:** Re-ingested Engagement (`746010b7-...`) and default SmeMartProject (`ea4db55f-...`) with `tag: [{value: "a81cd320-..."}]` populated. Tag-filter discovery works uniformly across W3Geekery records now.

---

## In-flight tracker

| Item | Owner | Status |
|---|---|---|
| **Phase 27 closed** | DONE | ✅ 2026-04-30. Verifier 14/14. Commits `5b594c6..43f8d1c`. |
| **Phase 27.5 closed** | DONE | ✅ 2026-05-01. Verifier 8/8 ENF-* (`27.5-VERIFICATION.md`). Closure commit `08cc25a`. Two Director-approved pivots: Plan 03 lint-only diff-based CI; Plan 04 inventory snapshot not annotation sweep. |
| **Phase 24 EXECUTING WAVE 1** | gsd-execute | **In flight as of parkit time.** Three Wave-1 commits landed: `48f9140` DEMO_TAG_UUIDS module, `39ee02c` DemoVisibilityService client-side post-filter, `820916c` fakeProjectContextService mock helper. Spec test in flight (uncommitted `src/app/core/services/demo-visibility.service.spec.ts` in working tree). Plan re-spec'd around Option X (client-side post-filter) after Decision-Probe-1 found `.ne.`/`.not in.` broken on tag arrays in ZB GQL + NULL semantics issue. Modernization rules block pasted verbatim into handoff. **Halt expected at end of Wave 1 for Director checkpoint** before Wave 2 (component-touching list-page wiring) fires. Behavioral callout: pre-existing `tag: null` records remain visible to non-admins (Option X tradeoff) — retroactive re-push walkthrough required before Phase 31. |
| **Phase 30 plan PAUSED** | Director-decided | Phase 27.5 closure unblocks resume. Brief at `b7f9b80` (route slot `/projects` pinned). Resuming: `/gsd-plan-phase 30` reads existing CONTEXT.md (pre-paused). Phase 24 should land first since `/projects` route is what 24's visibility gate filters. |
| **CI-LINT-INSTALL-1 backlog filed** | DONE | ✅ 2026-05-01 commit `515adc9`. Tracks `${RUNNER_TEMP}` symlink workaround replacement. Low-priority; current workaround operational. |
| **Director briefs committed** | DONE | ✅ 2026-05-01 commit `5f7c527` filed `cleanup-orphan-hydra-resources.md` + `retroactive-demo-tag-repush.md`. |
| **Phase 24 plan-artifact hygiene** | DONE | ✅ 2026-05-01 commit `5250512`. Tracked 24-02-PLAN.md / 24-RESEARCH.md / 24-PLAN-CHECK.md (gsd-plan outputs left untracked from original plan run). |
| **Retroactive demo-tag re-push manual walkthrough** | Director-led | Brief at `.planning/director/retroactive-demo-tag-repush.md`. 51-record inventory pinned. Required before Phase 31 (production cutover). Run after Phase 24 ships so Wave 3 admin delete escape hatch is available as fallback. |
| **GSD 1.38.5 update + local patch reapplied** | DONE | ✅ 2026-04-30. Local patch (`verify-phase.md` BLOCKED + filter_deferred_items evidence-enforcement) reapplied + adapted. 2 atomic commits pending in `~/.claude/` (left dirty for review). Slash format: hyphens for GSD only. |
| **AskUserQuestion banned** | DONE | ✅ 2026-04-30. Global deny in `~/.claude/settings.json:182`. |
| **Hub generic-sql 0.6.0 side-quest** | BLOCKED on Kevin | Deployment `9a296640-44e5-11f1-818f-533ce4635095` orphan; server REJECTS createConnection (0.6.0 published without connection_profile catalog row). Tear-down playbook in `.planning/director/cleanup-orphan-hydra-resources.md` (committed `5f7c527`). Goal in memory `project_neon_hub_module_goal.md` — read/write hub module path; existing readonly secret `fbafb917-...` MUST NOT be reused. |
| **Cross-team handoff materials** | DONE-untracked | At `.claude/handoffs/for-{nic,dan,joe}/`. Send to Joe + Dan when convenient (27.5 closure window). |
| **Send transparency HTML + for-joe MD to Joe (Work Worlds)** | Clark | Phase 27.5 closed — clear to send. HTML + for-joe MD in `.claude/handoffs/`. |
| **BACKLOG #095 — recurring Joe + Dan + Clark cross-team sync** | Director + Clark | NEW from 4-28 fold. Output target: `.planning/director/cross-team-platform-contract.md`. |
| **W3Geekery↔ZB engagement → "supporting all ZeroBias apps" workspace** | Clark | Per 4-28 directive. Triggered once W3Geekery↔ZB engagement is stood up. |
| **Demo-org seed engagements for HIS, Work Worlds, etc.** | Clark | Per 4-28 Action Item #3. Aligns with Phase 24 visibility gate. |
| **Worktree pruning hygiene** | Director | 8 stale prunable entries; `git worktree prune` is safe. Untaken. |
| **DP2 worktree teardown** | Director | UNBLOCKED (Phase 20 closed): `git worktree remove ../sme-mart-dp2 && git branch -D director-parks-2-phase20`. |
| **Session-name-guard `compact` matcher noise** | Clark decision pending | Drop `compact` matcher from `~/.claude/settings.json`. |
| **PKV API verification on UAT** | deferred | env file reverted; can't test until dev server unblocks. |
| **`app/` directory move to `zb-forks/org/app/`** | end-of-session | deferred. |
| **Hook fix uncommitted** | Clark review | `~/.claude/hooks/zb-mcp-lock-check.sh` patched 2026-05-01 (`IFS=$'\t'` so multi-word session names don't false-positive). Uncommitted in user-config dir; leave for separate review. |

---

## Recent commits (key 2026-04-30 + earlier deltas)

Phase 27 Wave 1 + 2 + patches + Wave 3 + closure (Phase 27 done):
- `588430b` docs(27-02) complete bootstrap-service plan
- `14e5f5d` fix(27-02) remove unused imports
- `1c5e3b2` feat(phase-27-03) onboarding guard + bootstrap shell UI
- `ee0fdde` fix(27-03) silence TS6133/6198
- `6bc9c7d` fix(27-03) remove CommonModule from onboarding-bootstrap-shell
- `d4c542e` feat(27-03) admin detection via getRequestOrgMember.admin (AR-02)
- `130c576` fix(27-01) drop redundant auth probe — lean on SDK redirectLogin
- `3756443` feat(27-04) attach onboarding guard at AppShell + add bootstrap/projects routes
- `8a2d603` feat(27-04) provide OnboardingBootstrapService + MarketplaceProfileService + snackbar defaults
- `8fc0070` test(27-04) verify guard attachment + route structure
- `52bd03d` docs(27-04) complete routing integration summary
- `9cd9da2` docs(27-03) backfill SUMMARY.md (Wave 2 batched commit; verifier flagged)
- `4deeb8c` docs(phase-27) complete phase execution — 4/4 plans, 6/6 must-haves verified
- `43f8d1c` docs(phase-27) evolve PROJECT.md after phase completion

Director artifacts + Phase 27.5 brief + Phase 24 brief + cross-team handoff cleanup:
- `5b594c6` chore(gitignore) move director handoff materials out of tracked tree (created `.claude/handoffs/` gitignored, `for-nic` removed from index)
- `c5a3361` docs(planning) Phase 27 + 28 context, research, validation artifacts
- `858ac8c` docs(director) SDK verification sources + Phase 27/28 progress refresh
- `b7f9b80` docs(director) Phase 30 brief — pin /projects route slot post-Wave-3
- `3bdd789` docs(backlog) ANIM-01 — provideAnimationsAsync migration (filed as v1.5 polish)
- `39308fd` docs(backlog) **revert** ANIM-01 / "Modernization Polish" cluster (wrong frame; real fix is Phase 27.5 enforcement)
- `e1c46a6` docs(director) Phase 27.5 brief — modernization rule enforcement
- `431eafa` docs(director) Phase 24 brief — fold in admin detection correction + Phase 27 deltas

Phase 27.5 execute (Plans 01-04 done; 05 pending):
- `5368aff` feat(27.5-01) install ESLint deps + flat config skeleton
- `49b1895` feat(27.5-01) add npm run lint script with --max-warnings=0
- `7e41252` feat(27.5-01) wire angular.json lint builder
- `5da666f` fix(27.5-01) repair eslint.config.js — remove unavailable rules
- `e840763` docs(27.5-01) complete SUMMARY.md with configuration + smoke test results
- `b5632b6` docs(state/roadmap) update progress for Plan 01 completion
- `76eaaef` feat(27.5-02) install husky v9 + lint-staged + pre-commit hook
- `28831b6` docs(27.5-02) record hook latency baseline + write SUMMARY
- `6bf710c` docs(27.5-02) update STATE.md and ROADMAP.md
- `fcabe35` feat(27.5-02) tighten pre-commit hook with sibling-package early-exit gate
- `e33a95f` feat(27.5-02) add --cache to lint-staged eslint invocation
- `ea97584` chore(27.5-02) gitignore .eslintcache
- `9ab7bad` docs(27.5-02) backfill SUMMARY with Director-locked refinements
- `e901e25` feat(27.5-03) [SUPERSEDED] add test-and-lint CI workflow
- `80fd448` fix(27.5-03) [SUPERSEDED] add Vault + ZB_TOKEN auth pattern
- `96288ce` docs(27.5-03) revise plan — diff-based, lint-only CI per Director directive
- `33f4c2a` docs(27.5-04) revise plan — inventory snapshot, no annotation sweep
- `be6cef5` docs(27.5-05) revise plan — touch-it-fix-it rule + lint troubleshooting
- `4736439` feat(27.5-03) replace test-and-lint.yml with diff-based lint-only CI gate
- `e0a3769` fix(27.5-03) align lint.yml install list with eslint.config.js imports
- `eb7adf3` fix(27.5-03) install lint tooling in temp dir to avoid workspace .npmrc
- `7ace07f` docs(27.5-03) summary — diff-based lint CI gate verified
- `3ad7af2` docs(27.5-04) add INITIAL-AUDIT.md — pre-existing violation inventory
- `556ca32` docs(27.5-04) reframe MODERN-CLEANUP-1 around touch-it-fix-it
- `92cbbc1` docs(27.5-04) summary — inventory snapshot + MODERN-CLEANUP-1 reframed

Phase 24 plan re-spec around Option X (4 commits, all 2026-05-01):
- `9b24cf7` docs(24-CONTEXT) supersede a/b/c bullets — lock Option X (client-side post-filter)
- `27859eb` docs(24-01) remove Task 5 (GqlQueryOptions extension) + re-spec Tasks 2/4 for Option X
- `570135c` docs(24-03) full Wave 2 rewrite around Option X
- `4b43cb3` docs(24-05) align verification matrix + regression guards (no .ne./.not in.) with Option X

Director artifacts (committed prior sessions):
- `a1d7918` docs(backlog) file MODERN-CLEANUP-1/3 + DEV-CI-PURGE-1 + CI-BUILD-GATE-1
- `240edda` docs(claude) add Deployment Paths section — uat/qa/prod only for 3P apps

Phase 27.5 close-out + Wave 5 (this session, 2026-05-01 PM):
- `5f3989f` docs(backlog) refresh MODERN-CLEANUP-2 reference to INITIAL-AUDIT.md (Director sweep mid-Plan-04 checkpoint)
- `cefc255` docs(27.5-05) CLAUDE.md — machine-enforcement note + touch-it-fix-it cross-link
- `26edcbb` docs(27.5-05) MODERNIZATION_GUIDE — touch-it-fix-it rule + lint troubleshooting (8 rule subsections)
- `59a3fb4` docs(27.5-05) summary — Phase 27.5 closure
- `08cc25a` docs(phase-27.5) complete phase execution — 5/5 plans, 8/8 ENF-* requirements verified
- `515adc9` docs(backlog) file CI-LINT-INSTALL-1 — replace lint.yml RUNNER_TEMP workaround
- `5f7c527` docs(director) file two Director briefs from 2026-05-01 session (cleanup-orphan-hydra-resources + retroactive-demo-tag-repush)
- `5250512` docs(24) track gsd-plan-phase artifacts left untracked from original plan run

Phase 24 Wave 1 (in flight as of parkit time):
- `48f9140` feat(24-01) add DEMO_TAG_UUIDS constant module
- `39ee02c` feat(24-01) add DemoVisibilityService with client-side post-filter
- `820916c` feat(24-01) add fakeProjectContextService mock helper

---

## Phase 27 closeout — VERIFIED 2026-04-30

Verifier passed 14/14 must-haves: 6 ROADMAP success criteria + 8 Director end-to-end validation items.

**Verification highlights:**
- Auth redirect — SDK-native via `ZerobiasClientApp.whoAmI()` → `redirectLogin()` (verified at `node_modules/@zerobias-com/zerobias-client/dist/lib/services/zerobias-client-app.js:73-84`); custom `fetch('/api/dana/me')` probe was deleted in patch
- Admin detection — MCP-verified contract `clientApi.danaClient.getOrgApi().getRequestOrgMember(userId).admin` → boolean; admin → `/admin`, skips bootstrap and completion checks; `ProjectContextService.setIsAdmin` hydrated
- Bootstrap recipe — 5-call (Steps A–E) with per-step idempotency probes; `pushEntities('Engagement'|'SmeMartProject', ..., callSiteTag)`; `Object.tag [{ value: tagId }]` at ingest time
- Routing tree — `canActivate: [onboardingGuard]` at AppShell; `/onboarding/bootstrap` is failure escape hatch (no guard, no recursion); `/projects` ComingSoon placeholder pinned for Phase 30

Closeout artifacts: `27-VERIFICATION.md`, backfilled `27-03-onboarding-guard-SUMMARY.md`, ROADMAP/STATE/REQUIREMENTS updated, PROJECT.md AR-01..AR-06 in Validated section.

Surfaced (non-blocking, do not turn into a phase): `provideAnimationsAsync` deprecation in `app.config.ts` (pre-existing Feb 2026). Brief considered filing as backlog entry; reverted because the framing was wrong — the real fix is Phase 27.5's enforcement gate (so future deprecations get caught at lint time, not "tracked for cleanup later"). Animations deprecation does NOT need its own backlog entry.

---

## Phase 27.5 — Modernization Rule Enforcement (CLOSED 2026-05-01)

**Brief:** `.planning/director/phase-27.5-brief.md` (commit `e1c46a6`).
**Verification:** `.planning/phases/27.5-modernization-enforcement/27.5-VERIFICATION.md` — 8/8 ENF-* PASSED.
**Closure commit:** `08cc25a`.
**Origin:** Phase 27 Wave 2 imported `CommonModule` despite the rule sitting in CONTEXT.md AND in the gsd-plan handoff (caught + patched in `6bc9c7d`). Rules-as-text-in-handoff structurally failed; project had zero machine enforcement. 27.5 installed the gate.

**Final plan shape (post-pivots — 5 plans / 5 waves):**

| Wave | Plan | Reqs | Built |
|---|---|---|---|
| 1 | 27.5-01 | ENF-01/02/03 | `eslint.config.js` (8 modernization rules + custom AST `@Output` ban) + `npm run lint --max-warnings=0` + `angular.json` lint builder |
| 2 | 27.5-02 | ENF-04 | husky v9 + lint-staged pre-commit (cross-package early-exit + `--cache`) |
| 3 | 27.5-03 | ENF-05 | `.github/workflows/lint.yml` — diff-based lint-only CI (was full-repo test+lint; pivoted) |
| 4 | 27.5-04 | ENF-06/07 | `INITIAL-AUDIT.md` (1561 messages / 796 rule violations / 765 fatal parse errors) + `MODERN-CLEANUP-1` reframe (was annotation sweep; pivoted) |
| 5 | 27.5-05 | ENF-06 docs / ENF-08 | `CLAUDE.md` Angular 21 Patterns expansion + `MODERNIZATION_GUIDE.md` "Touch It = Fix It" + "If Lint Fires on You" with 8 rule subsections |

**Director-approved pivots (audit trail in `08cc25a` body):**
1. **Plan 03 — diff-based lint-only CI.** Full-repo lint would have punished PRs for 1561 pre-existing violations; full deps require `@zerobias-org`/`@zerobias-com` private-registry auth the fork doesn't have. Resolution: `lint.yml` runs `npx lint-staged --diff` against PR base ref; tooling installs into `${RUNNER_TEMP}/lint-tools` and symlinks into workspace. Both verification CI runs captured.
2. **Plan 04 — inventory snapshot not annotation sweep.** Touch-it-fix-it model encoded in `MODERN-CLEANUP-1`; closure = zero rule violations on re-run. Avoided 15-20 hrs churn.

**Plan files:** `.planning/phases/27.5-modernization-enforcement/27.5-0[1-5]-PLAN.md` + CONTEXT/RESEARCH/VALIDATION/VERIFICATION/SUMMARYs.

**Tech debt filed:** `CI-LINT-INSTALL-1` BACKLOG entry tracks the `${RUNNER_TEMP}` symlink workaround replacement.

---

## Brian meeting 2026-04-28 — content brief consumed

Brian walked through `.planning/director/brian-content-brief-v1.4-deferred.md`. 4 DECISIONS entries filed (3% transactional toll, per-app ToS two-layer architecture, pilot↔production project type flip, project-notes as canonical Brian↔W3Geekery collab channel). 3 BACKLOG entries (#095 cross-team sync, #096 Stitch vs Claude Design comparison spike, #097 programmatic vendor-claim flow). 5 brian-content-brief sections updated. Phase 29 scope substantially dissolved per 4-28 directives.

---

## Next-action sequence (when Director Parks resumes)

1. **Phase 24 Wave 1 in flight — Director checkpoint pending at end of wave.** gsd-execute landed three commits at parkit time: `48f9140` DEMO_TAG_UUIDS module, `39ee02c` DemoVisibilityService, `820916c` fakeProjectContextService mock helper. Spec test (uncommitted `src/app/core/services/demo-visibility.service.spec.ts`) is in flight. Wave 1 SUMMARY expected next. Verify Option X predicate logic against `24-01-PLAN.md` Tasks 1-4 (Task 5 was removed in re-spec `27859eb`); confirm zero references to `.ne.`/`.not in.` filters. Approve, then fire Wave 2.
2. **Phase 24 Wave 2 — list-page filter wiring.** Component-touching across providers/RFPs/bids/projects/engagements/services list pages. Modernization rules block goes verbatim into Wave 2 handoff (already pasted in current Phase 24 fire handoff Director issued this session). Halt for Director checkpoint between waves so visibility behavior gets eyeballed against actual demo data on UAT.
3. **Phase 24 Wave 3 — admin delete escape hatch.** Lets admins delete `tag: null` orphans that the post-filter hides from non-admins. Component-touching; modernization rules apply.
4. **Phase 24 verification + close-out** — spawn gsd-verifier subagent (NOT `/gsd-verify-phase` — that command doesn't exist in 1.38.5; verifier is invoked as a subagent directly) against `24-05-PLAN.md` regression matrix. Critical regression guards: zero `.ne.`/`.not in.` filters in committed code; non-admin sees only tagged demo records on every list page; admin sees all records.
5. **Retroactive demo-tag re-push manual walkthrough** — Director-led, Clark + Director run together via MCP (no agent — agents fabricate UUIDs on real platform mutations). Brief at `.planning/director/retroactive-demo-tag-repush.md`. 51 records to re-push with demo tag so Phase 24's filter catches them. Required before Phase 31 (W3Geekery production cutover). Run after Phase 24 ships so Wave 3 admin delete escape hatch is available as fallback.
6. **Resume Phase 30 plan** — `/gsd-plan-phase 30` reads existing CONTEXT.md. Brief at `b7f9b80` (route slot `/projects` locked). Plan tasks include `npx lint-staged --diff` exit-0 verification. Phase 24 should close first since `/projects` is what 24's visibility gate filters.
7. **Phase 31 brief spot-check** — pre-existing brief; spot-check after 30 closes.
8. **Push commit delta to `origin/poc/sme-mart`** — pre-push hook runs full test suite. Validate range with `git log --oneline upstream/uat..HEAD`. Pre-push tests passed 1602/1602 most recently this session.
9. **Hub generic-sql side-quest** — check Kevin's response on Slack about 0.6.0 connection_profile. Tear-down playbook for the orphan deployment is at `.planning/director/cleanup-orphan-hydra-resources.md` (committed `5f7c527`). If 0.6.0 republished, repeat deploy + connect playbook against write-capable Neon secret (NOT readonly `fbafb917-...`).
10. **Send transparency HTML + for-joe MD to Joe (Work Worlds)** — Clark's task; Phase 27.5 closure removed the gate. Files at `.claude/handoffs/`.
11. **Set up BACKLOG #095 recurring sync** — Joe + Dan + Clark.
12. **Demo-org seed engagements for HIS, Work Worlds, etc.** (Clark's hands-on, per 4-28 Action Item #3).
13. **DP2 worktree teardown** — `git worktree remove ../sme-mart-dp2 && git branch -D director-parks-2-phase20`.
14. **Worktree hygiene** — `git worktree prune` (8 stale entries; safe).
15. **Commit `~/.claude/` verify-phase.md merge** — 2 atomic commits left dirty after `/gsd-reapply-patches`. Eyeball diff first.
16. **`~/.claude/hooks/zb-mcp-lock-check.sh` patch (uncommitted, user-config dir)** — `IFS=$'\t'` fix for multi-word session names. Leave for separate review.

---

## Session etiquette reminders

- Address as Clark / Clarky; PT timezone.
- **Admin mechanism: `clientApi.danaClient.getOrgApi().getRequestOrgMember(orgMemberId).admin`** — MCP-verified. Memory was wrong before 2026-04-30; corrected. Phase 24 + future admin-aware code consumes `ProjectContextService.isAdmin()` Signal (NOT `isAdmin$` Observable — verified by source read post-Phase-27), NOT direct SDK calls.
- **Source-of-truth rule (READ FIRST for any "what's the API for X" question):** `.planning/docs/SDK_VERIFICATION_SOURCES.md`. Authoritative: ZB MCP, actual ZB platform source, installed SDK source. NOT authoritative: deprecated Next.js prototype, workspace `node_modules` without `npm pack`, prior memory entries (verify before citing).
- No agent handoffs for MCP work that mutates real platform state — Clark wants manual walkthroughs for that.
- Brian asks aren't blockers — placeholders ship; Brian input refines if/when it arrives.
- **Never name Brian (CEO) as a code-author.** Brian sets directives. Default to "backend team" / "UI team" — never guess names. See `.planning/docs/ORG_CHART.md`.
- **Never ask "want to pause?" or "continue?".** He'll stop me if he wants.
- Never fork repos without explicit auth; never merge PRs autonomously; SUCCESS-only CI counts.
- Don't suggest breaks; don't ask "what's next?"; answer questions vs. assume action.
- Director can use `Tell gsd-X:` checkpoint handoff format when delegating between agents/sessions (no quotes, copy-paste-ready).
- **AskUserQuestion is GLOBALLY BANNED.** Use plain-text confirmation prompts.

---

## Quick-start prompt for the next Director Parks session

> Resume Director Parks. Read `.planning/director/DIRECTOR-PARKS-RESUME.md` FIRST (role contract + direct-request override + Deployment Paths directive 2026-05-01 + GSD command format change + AskUserQuestion ban + v1.4 state). Then `.planning/director/SESSION-STATE.md` and recent `.planning/director/DECISIONS.md`. The /meta:director skill applies. **CRITICAL — GSD slash commands use hyphens (`/gsd-foo`); non-GSD plugins use colons (`/meta:sync`).** **CRITICAL — `/gsd-verify-phase` does NOT exist in 1.38.5; verification runs via the `gsd-verifier` subagent invoked directly through the Agent tool, not as a slash command.** **CRITICAL — AskUserQuestion is globally banned.** **CRITICAL — 3P apps in zerobias-org/app deploy ONLY to uat/qa/prod;** dev/ci are platform-only (encoded in CLAUDE.md "Deployment Paths" section commit `240edda`; sweep tracker DEV-CI-PURGE-1). **v1.4 status: Phases 20, 25, 26, 27, 27.5, 28 COMPLETE; Phase 24 EXECUTING WAVE 1 — three Wave-1 commits landed at parkit time (`48f9140` DEMO_TAG_UUIDS, `39ee02c` DemoVisibilityService, `820916c` fakeProjectContextService mock helper); spec test in flight (uncommitted `src/app/core/services/demo-visibility.service.spec.ts`). Wave 1 SUMMARY expected next; halt for Director checkpoint before Wave 2 (component-touching list-page wiring). Plan re-spec'd around Option X (client-side post-filter) after Decision-Probe-1 found `.ne./.not in.` broken on tag arrays in ZB GQL. Phase 30 plan PAUSED awaiting Phase 24 closure (route slot `/projects` is what 24 filters); Phase 31 not started.** **First actions on resume:** (1) check Phase 24 Wave 1 final commits + SUMMARY; verify Option X predicate logic against `24-01-PLAN.md` Tasks 1-4 (Task 5 was removed in re-spec `27859eb`); confirm zero `.ne.`/`.not in.` filter references in committed code; Director-checkpoint approve; fire Wave 2 with verbatim modernization rules block in handoff. (2) **CRITICAL:** Wave 2 is component-touching across providers/RFPs/bids/projects/engagements/services list pages — modernization rules block MUST be pasted verbatim into gsd-execute handoff (lint gate is active but diff-based — pasting block prevents the gate from firing on agent-authored code). (3) Halt between waves for Director checkpoint so visibility behavior gets eyeballed against actual demo data on UAT. **After Phase 24 closes:** queue retroactive demo-tag re-push manual walkthrough (Director-led, NO agents — agents fabricate UUIDs on real platform mutations; brief at `.planning/director/retroactive-demo-tag-repush.md`, 51 records to backfill before Phase 31); resume Phase 30 plan; spot-check Phase 31 brief. **Phase 27.5 closed `08cc25a` — verifier 8/8 ENF-*; enforcement chain operational (ESLint + pre-commit + diff-based CI). Tech debt: CI-LINT-INSTALL-1 BACKLOG entry tracks `${RUNNER_TEMP}` symlink workaround replacement.** **Hub generic-sql 0.6.0 BLOCKED on Kevin** (tear-down playbook in `.planning/director/cleanup-orphan-hydra-resources.md`). **Admin detection wired:** `clientApi.danaClient.getOrgApi().getRequestOrgMember(orgMemberId).admin`; consume `ProjectContextService.isAdmin()` Signal (NOT `isAdmin$` Observable). **Pre-push hook runs full test suite** (1602/1602 green most recently). **Hook fix uncommitted:** `~/.claude/hooks/zb-mcp-lock-check.sh` patched 2026-05-01 (`IFS=$'\t'`); leave for separate review. Direct request overrides default boundary (you can run /gsd-* if asked).

---

## Why this file is here instead of `.claude/restart_context.md`

`.claude/restart_context.md` is ambiguous territory — any Claude session that resumes on this repo might read it. Director Parks role rules and in-flight state need a location that is clearly owned by the Director role so other sessions don't accidentally pick up Director-scoped rules and get confused about their own role. `.planning/director/DIRECTOR-PARKS-RESUME.md` is owned. Other sessions reading this path would know they stepped into Director territory.

---

## Session log — 2026-05-01 PM (Phase 27.5 closure + Phase 24 Wave 1 fire)

What this session achieved, in order:

1. **Resumed Director Parks** after `/clear` — loaded RESUME + SESSION-STATE + recent DECISIONS, posted status snapshot.
2. **Phase 27.5 Wave 4 (Plan 04) checkpoint approved** — verified `INITIAL-AUDIT.md` (286 lines, per-rule + top-10-files breakdowns of 1561 messages / 796 rule violations / 765 fatal parse errors), MODERN-CLEANUP-1 reframe in BACKLOG, zero source changes. One residual nit (gsd-execute correctly flagged) cleaned up via Director one-line BACKLOG sweep `5f3989f` (refresh MODERN-CLEANUP-2 stale "annotation pass output" reference to point at INITIAL-AUDIT.md).
3. **Phase 27.5 Plan 05 (docs) handoff fired** — gsd-execute landed in 3 atomic commits: `cefc255` (CLAUDE.md Angular 21 Patterns expansion 1→6 paragraphs with machine-enforcement note + Touch-It-Fix-It rule + troubleshooting cross-link + emergency-bypass policy), `26edcbb` (MODERNIZATION_GUIDE.md "Touch It = Fix It" section at top + "If Lint Fires on You" troubleshooting at bottom with 8 rule subsections covering 100% of top-pressure rules from audit), `59a3fb4` (Plan 05 SUMMARY). Zero source changes; cross-link chain CLAUDE.md → MODERNIZATION_GUIDE.md → INITIAL-AUDIT.md → BACKLOG.md MODERN-CLEANUP-1 verified.
4. **Phase 27.5 verification + close-out** — `/gsd-verify-phase` doesn't exist in 1.38.5; spawned `gsd-verifier` subagent directly via Agent tool. Returned **PASSED 8/8 ENF-* requirements** with full cross-link integrity verification, both Director-approved pivots confirmed (Plan 03 lint-only diff-based CI, Plan 04 inventory-not-sweep). VERIFICATION.md written. gsd-execute committed phase-completion update at `08cc25a` (audit trail of pivots in commit body).
5. **Director hygiene pass** — three atomic commits: `515adc9` files CI-LINT-INSTALL-1 BACKLOG entry tracking `${RUNNER_TEMP}` symlink workaround replacement; `5f7c527` files two pending Director briefs (`cleanup-orphan-hydra-resources.md` + `retroactive-demo-tag-repush.md`) per next-action sequence; `5250512` tracks 3 orphaned Phase 24 gsd-plan artifacts (24-02-PLAN.md, 24-RESEARCH.md, 24-PLAN-CHECK.md) that were left untracked from original plan run. Pre-push hook ran 1602/1602 tests green.
6. **Phase 24 execute handoff fired** — issued copy-pastable `Tell gsd-execute:` block with verbatim modernization rules block, Option X locked-server-side-filter-ban regression guard, admin-Signal-not-Observable contract, and wave-checkpoint discipline.
7. **Phase 24 Wave 1 in flight** — gsd-execute landed three Wave-1 commits in rapid succession: `48f9140` (DEMO_TAG_UUIDS constant module), `39ee02c` (DemoVisibilityService client-side post-filter), `820916c` (fakeProjectContextService mock helper). Spec test (`src/app/core/services/demo-visibility.service.spec.ts`) in flight at parkit time.

**Net session outcome:** Phase 27.5 fully closed (8/8 ENF-* verified; enforcement chain operational across three layers: ESLint + pre-commit + diff-based CI; developer-facing docs cross-linked; tech debt CI-LINT-INSTALL-1 filed for the install-path workaround). Phase 24 Wave 1 EXECUTING with three commits landed and spec in flight. All Director artifacts up to this session are committed and pushed. HEAD: `820916c` on origin/poc/sme-mart.

Key learnings captured in this session log: (a) `/gsd-verify-phase` slash command doesn't exist in 1.38.5 — verification is a subagent invocation; (b) Director's pre-execute checkpoint can catch agent-flagged residuals (MODERN-CLEANUP-2 stale reference) for one-line cleanup before next wave fires; (c) gsd-plan-phase outputs sometimes don't all make it into commits — hygiene check before next phase fires.

Clark called `parkit` mid-Wave-1 so the next session can pick up at the Wave 1 checkpoint.

---

## Session log — 2026-05-01 (Phase 27.5 execute through Wave 4 + Phase 24 plan re-spec + Director directive on deploy paths)

What this session achieved, in order:

1. **Phase 27.5 Plan 01 closeout checkpoint** — gsd-execute completed Plan 01 with 6/7 modernization patterns firing (Pattern 6 mat-spinner deferred to MODERN-CLEANUP-2). Director approved.
2. **Phase 24 plan-phase output review** — gsd-plan produced 5 plans / 4 waves / PASS_WITH_FLAGS plan-check; Director ruled on three pre-execute edits (verbatim modernization block in Plan 24-04, Path-c lock for HIGH-1 hydra deleteResource gap, conditional Plan 24-01 Task 5 for HIGH-2 GQL filter). Drafted `cleanup-orphan-hydra-resources.md` Director brief.
3. **gsd-plan landed three pre-execute edits** (`4e9fa16`, `d397a28`, `4eec32b`) + sweep cleanup (`a510483`).
4. **Decision-Probe-1 manual MCP probe** — Director ran `.not in.` filter probe against W3Geekery boundary GQL. **FAILED**: ZB GQL silently breaks `.ne.` and `.not in.` on tag arrays (positive control `.eq.` works, all negation returns empty). NULL semantics also break the visibility goal (records with `tag: null` excluded by any `.ne.` filter). Both Approach A and Approach B non-viable. Updated 24-CONTEXT.md with probe result + 3 redesign options (Option X client-side filter, Option Y positive include-tag with backfill, Option Z two-query union).
5. **Patched `~/.claude/hooks/zb-mcp-lock-check.sh`** — added `IFS=$'\t'` so multi-word session names ("Director Parks") don't false-positive as conflicts. Bug surfaced when acquiring profile lock during the probe.
6. **BACKLOG additions: MODERN-CLEANUP-1 (placeholder for Plan 04 inventory), MODERN-CLEANUP-3 (theme-aware SCSS sweep)** filed per Director ask.
7. **Drafted `retroactive-demo-tag-repush.md` Director brief** — 51-record inventory pinned, walkthrough recipe, 8-step action plan for backfilling demo tags on pre-existing untagged records (required before Phase 31 production cutover).
8. **Phase 27.5 Plan 02 checkpoint** — gsd-execute completed Plan 02 with husky v9 + lint-staged hook installed at git root + cd shim. Director required tightening (cross-package safety: early-exit gate in hook so sibling packages incur zero overhead; ESLint cache flag). gsd-execute landed 4 atomic refinement commits (`fcabe35`, `e33a95f`, `ea97584`, `9ab7bad`) with all 3 verification tests passing.
9. **Phase 24 re-spec around Option X** — gsd-plan landed 4 commits (`9b24cf7`, `27859eb`, `570135c`, `4b43cb3`). Plan 24-01 Task 5 removed; Plan 24-03 fully rewritten around client-side post-filter via `applyVisibility<T>()` + `isLocalDemoTagged()`; modernization block pasted verbatim into component-touching tasks; regression guards added (no `.ne.`/`.not in.`).
10. **Director directive 2026-05-01 — deployment paths LOCKED:** 3P apps in `zerobias-org/app` deploy ONLY to uat/qa/prod; dev/ci are valid ZB platform environments but NOT 3P-app deploy targets. Encoded permanently in sme-mart CLAUDE.md "Deployment Paths" section (`240edda`). BACKLOG `DEV-CI-PURGE-1` filed for the broader sweep.
11. **Phase 27.5 Plan 03 attempt 1 BLOCKED** — gsd-execute's first Plan 03 implementation (full-repo lint + test, e901e25 + 80fd448) hit npm ci E401 because w3geekery/app fork doesn't inherit zerobias-org/app secrets (VAULT_ADDR, ZB_TOKEN). Surfaced auth-injection blocker.
12. **Director PIVOT — diff-based, lint-only CI** — flipped Plan 03 from full-repo `npm run lint` + `npm test` to `npx lint-staged --diff` against PR base ref. Eliminated the OPC-violation problem AND the auth-injection problem in one architectural move. Plan 04 collapsed from 15-20 hr annotation sweep to ~1-2 hr inventory snapshot. Plan 05 absorbed docs-half of ENF-06.
13. **gsd-plan revised Plans 03+04+05** — three atomic plan-revision commits (`96288ce`, `33f4c2a`, `be6cef5`) per the Director's pivot brief.
14. **Phase 27.5 Wave 3 (revised Plan 03) executed** — gsd-execute landed `lint.yml` (replaces `test-and-lint.yml`); both verification runs captured (fail https://github.com/w3geekery/app/actions/runs/25234090327, pass https://github.com/w3geekery/app/actions/runs/25234121514); throwaway branches cleaned up. Two deviations documented: install-list aligned with `eslint.config.js` imports (`e0a3769`); workspace `.npmrc` symlink workaround via `${RUNNER_TEMP}` (`eb7adf3`). SUMMARY at `7ace07f`. Director approved + filed CI-LINT-INSTALL-1 follow-up BACKLOG entry concept (not yet committed).
15. **Phase 27.5 Wave 4 (revised Plan 04) executed** — gsd-execute landed INITIAL-AUDIT.md inventory + MODERN-CLEANUP-1 reframe (`3ad7af2`, `556ca32`, `92cbbc1`). Director checkpoint pending at parkit time.
16. **Director artifacts committed:** BACKLOG additions (`a1d7918`) and CLAUDE.md Deployment Paths section (`240edda`). Two Director briefs drafted but uncommitted (cleanup-orphan-hydra-resources.md + retroactive-demo-tag-repush.md).

**Net session outcome:** Phase 27.5 four of five waves complete with major architectural pivot (full-repo lint → diff-based lint-only) that dropped 15-20 hr off the budget AND eliminated the cross-team auth blocker. Phase 24 plan re-spec'd around Option X after Decision-Probe-1 invalidated the original GQL filter strategy. Deployment-paths policy locked permanently in CLAUDE.md. Hook bug fixed in user-config dir.

Clark called `parkit` mid-Wave-4-checkpoint so the next session can pick up Plan 05 (docs) execution.

## Session log — 2026-04-30 PM (Phase 27 close + Phase 27.5 insertion + GSD update + Phase 24 brief refresh)

What this session achieved, in order:

1. **Cleanup of uncommitted Director artifacts** — moved `for-nic/`, `for-dan/`, `for-joe/`, `transparency-center-entangled-tasks-2026-04-21.html` to `.claude/handoffs/` (gitignored). 3 atomic commits (`5b594c6` gitignore, `c5a3361` Phase 27/28 planning artifacts, `858ac8c` SDK verification + RESUME refresh + phase-27 brief refresh).
2. **Phase 27 Wave 3 + verification + closeout** — gsd-execute landed Wave 3 (3 atomic commits: `3756443`, `8a2d603`, `8fc0070` + docs `52bd03d`). gsd-verifier passed 14/14. Phase 27 closed (`4deeb8c`, `43f8d1c`).
3. **Phase 27.5 brief authored + filed** (`e1c46a6`). Origin: Phase 27 Wave 2 violated CommonModule rule despite it sitting in CONTEXT.md AND handoff. Rules-as-text has structurally failed; project has zero machine enforcement. Brief installs the gate (ESLint + husky + CI), NOT a sweep.
4. **ANIM-01 backlog mistake + revert** (`3bdd789` then `39308fd`). I filed `provideAnimationsAsync` migration as v1.5 polish; Clark caught the framing — "modernization polish cluster" legitimizes the antipattern. Reverted; the actual fix is Phase 27.5 enforcement.
5. **Phase 30 brief refreshed** (`b7f9b80`) — pin `/projects` route slot post-Wave-3.
6. **Phase 27.5 inserted + planned** — gsd-plan returned 5 plans / 18 tasks / 8 ENF-* requirements / plan-checker PASSED 10 dimensions. 3 Director-approved deviations: new test-and-lint.yml workflow, custom AST rule for @Output ban, estimate revised 8–10 hr realistic.
7. **Phase 27.5 execute STARTED** — gsd-execute Plan 01 landing 3/4 tasks (`5368aff`, `49b1895`, `7e41252`). Halt-for-Director-checkpoint after Plan 01 (most failure-sensitive — misconfigured rule lets violations through silently).
8. **GSD 1.30.0 → 1.38.5 update** — local patch detected (`verify-phase.md`), backed up to `~/.claude/gsd-local-patches/`. Slash command format moved colon → hyphen for GSD only. New skills include `gsd-spec-phase`, `gsd-explore`, `gsd-spike`, `gsd-sketch`, `gsd-graphify`, `gsd-intel`, `gsd-extract_learnings`, `gsd-undo`, etc.
9. **meta:sync** — upstream `zerobias-org/meta-harness` unchanged. No drift to merge.
10. **AskUserQuestion globally banned** — added to deny in `~/.claude/settings.json:182` per Clark direction (overlay UI hides last lines of conversation output).
11. **`/gsd-reapply-patches`** — verify-phase.md merged with adapted evidence-enforcement (PARTIAL status was removed upstream; safeguard now applies to BLOCKED case in verify_requirements AND filter_deferred_items deferral path — Director's call to plug both escape valves, not just BLOCKED). 2 atomic commits left dirty in `~/.claude/` for Clark review.
12. **Phase 24 brief refresh** (`431eafa`) — folded in admin detection correction (3x `getPrincipal().isAdmin` → MCP-verified contract + ProjectContextService consumption rule), `/admin` route lock from Wave 3, source-of-truth rule reference. Plan handoff drafted; ready to fire in fresh shell.

**Net session outcome:** Phase 27 fully closed; Phase 27.5 inserted, planned, executing (Plan 01 mid-flight); Phase 24 brief refreshed with Phase 27 deltas + admin detection correction; GSD updated 1.38.5 with command format change discipline; meta:sync verified clean; AskUserQuestion neutralized. Director artifacts cleaned out of tracked tree. 84 commits unpushed on `poc/sme-mart`.

Clark called `parkit` so this session can be `/clear`-ed and restarted in fresh shell to pick up GSD 1.38.5 commands. Resume context current as of 2026-04-30 PM.

---

## Session log — 2026-04-30 (Phase 28 close + Phase 27 mid-flight + hub side-quest + source-of-truth doc)

[Preserved from prior parkit; see git history `78cfa1d` and earlier.]

## Session log — 2026-04-29 (Phase 26 closure + UAT deploy saga + upstream sync + Phase 20 full lifecycle)

[Preserved from prior parkit; see git history.]
