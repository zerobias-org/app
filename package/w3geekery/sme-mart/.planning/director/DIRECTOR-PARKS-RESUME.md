# Director Parks — Resume Context

**Scope:** This file is the resume context for the Director Parks session (the meta:director role instance on SME Mart). Other Claude sessions on this repo have no reason to read it — it is owned by the Director role.

**If you are starting or resuming a Director Parks session, READ THIS FILE FIRST**, then `.planning/director/SESSION-STATE.md`, then the latest entries in `.planning/director/DECISIONS.md`.

**Session pointer:** `claude --resume "Director Parks"`
**Branch (app repo):** `poc/sme-mart`
**Working dir:** `/Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart`

---

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
| 24 | Demo Data Visibility Gate | **plan handoff drafted, ready to fire** (admin signal via `ProjectContextService`, brief refreshed `431eafa`) |
| 25 | Platform Data Audit | ✅ COMPLETE 2026-04-27 |
| 26 | Seed ZB-as-provider + ratify `company_info` convention | ✅ COMPLETE 2026-04-28; UAT-deployed 2026-04-29 |
| 27 | Auth gate + onboarding routing + lazy-on-load default-engagement guard | ✅ COMPLETE 2026-04-30 — verifier 14/14, commits `5b594c6..43f8d1c` |
| 27.5 | Modernization rule enforcement (ESLint + pre-commit + CI gate) | **IN PROGRESS** — gsd-execute Plan 01 ~75% done (3/4 tasks committed: `5368aff`, `49b1895`, `7e41252`); halt-for-Director-checkpoint after Plan 01 completes |
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
| **Phase 27 closed** | DONE | ✅ 2026-04-30. Verifier 14/14 must-haves. Commits `5b594c6..43f8d1c`. |
| **Phase 27.5 inserted + planned** | DONE | ✅ 2026-04-30. 5 plans / 5 waves / 18 tasks / 8 ENF-* requirements. Plan-checker verdict PASSED 10 dimensions. 3 Director-approved deviations: new `test-and-lint.yml` (deploy.yml is workflow_dispatch only); custom AST rule for `@Output()` ban (prefer-signals doesn't cover Output); estimate revised 4–6 hr → 8–10 hr realistic given ~250 violations. |
| **Phase 27.5 EXECUTING** | gsd-execute | IN FLIGHT. Plan 01 ~75% done (3/4 tasks committed: `5368aff` ESLint deps + flat config skeleton, `49b1895` npm lint script + max-warnings=0, `7e41252` angular.json lint builder). 4th task (rule configuration completing the flat config) pending. **Halt for Director checkpoint after Plan 01 completes** — Plan 01 is most failure-sensitive (misconfigured rule lets violations through silently). Verify with intentional violation tests BEFORE Plan 02 wires pre-commit hook. |
| **Phase 24 plan handoff drafted** | Director | READY TO FIRE in fresh shell (GSD 1.38.5). Brief refreshed `431eafa`. Handoff prompt at end of pre-parkit conversation — re-paste from session transcript or re-derive. Plans in parallel with 27.5; doesn't depend on 27.5 closure for PLANNING (does for execute). |
| **Phase 30 plan PAUSED** | Director-decided | Wait for 27.5 closure. Brief at `b7f9b80` (route slot `/projects` pinned). Resuming: `/gsd-plan-phase 30` reads existing CONTEXT.md (pre-paused). |
| **GSD 1.30.0 → 1.38.5 update** | DONE | ✅ 2026-04-30. Local patch (`verify-phase.md`) reapplied + adapted (PARTIAL evidence-enforcement → BLOCKED + filter_deferred_items). 2 atomic commits pending in `~/.claude/` (left dirty for review). Slash format: hyphens for GSD only (see CRITICAL section above). |
| **meta:sync** | DONE | ✅ 2026-04-30. Upstream `zerobias-org/meta-harness` unchanged. Global pristine current. Adapter (47 SME-MART markers) untouched. |
| **AskUserQuestion banned** | DONE | ✅ 2026-04-30. Global deny in `~/.claude/settings.json:182`. |
| **Director handoff materials moved out of tracked tree** | DONE | ✅ 2026-04-30 commit `5b594c6`. `.claude/handoffs/` (gitignored) holds: `for-nic/`, `for-dan/`, `for-joe/`, `transparency-center-entangled-tasks-2026-04-21.html`. |
| **Hub generic-sql 0.6.0 side-quest** | BLOCKED on Kevin | Deployment `9a296640-44e5-11f1-818f-533ce4635095` orphan; server REJECTS createConnection (0.6.0 published without connection_profile catalog row). Slack ping ready. Goal anchored in memory `project_neon_hub_module_goal.md` — read/write hub module path; existing readonly secret `fbafb917-...` MUST NOT be reused. |
| **Cross-team handoff materials** | DONE-untracked | At `.claude/handoffs/for-{nic,dan,joe}/`. Send to Joe + Dan after 27.5 closes (less churn). |
| **Send transparency HTML + for-joe MD to Joe (Work Worlds)** | Clark | After 27.5 closes. HTML and for-joe MD ready in `.claude/handoffs/`. |
| **BACKLOG #095 — recurring Joe + Dan + Clark cross-team sync** | Director + Clark | NEW from 4-28 fold. Set up recurring meeting; output target: `.planning/director/cross-team-platform-contract.md`. |
| **W3Geekery↔ZB engagement → "supporting all ZeroBias apps" workspace** | Clark | Per 4-28 directive. Triggered once W3Geekery↔ZB engagement is stood up. |
| **Demo-org seed engagements for HIS, Work Worlds, etc.** | Clark | Per 4-28 Action Item #3. Aligns with Phase 24 visibility gate. |
| **Worktree pruning hygiene** | Director | 8 stale prunable entries; `git worktree prune` is safe. Untaken. |
| **DP2 worktree teardown** | Director | UNBLOCKED (Phase 20 closed): `git worktree remove ../sme-mart-dp2 && git branch -D director-parks-2-phase20`. |
| **Session-name-guard `compact` matcher noise** | Clark decision pending | Drop `compact` matcher from `~/.claude/settings.json`. |
| **PKV API verification on UAT** | deferred | env file reverted; can't test until dev server unblocks. |
| **`app/` directory move to `zb-forks/org/app/`** | end-of-session | deferred. |
| **84 commits unpushed on `poc/sme-mart`** | Director | Validate range first: `git log --oneline upstream/uat..HEAD`. Push to fork branch (no PR). |

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

Phase 27.5 execute (Plan 01 in flight):
- `5368aff` feat(27.5-01) install ESLint deps + flat config skeleton
- `49b1895` feat(27.5-01) add npm run lint script with --max-warnings=0
- `7e41252` feat(27.5-01) wire angular.json lint builder
- (4th task pending: rule configuration completing the flat config)

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

## Phase 27.5 — Modernization Rule Enforcement (IN PROGRESS)

**Brief:** `.planning/director/phase-27.5-brief.md` (commit `e1c46a6`).
**Origin:** Phase 27 Wave 2 imported `CommonModule` despite the rule sitting in CONTEXT.md AND in the gsd-plan handoff (caught + patched in `6bc9c7d`). Rules-as-text-in-handoff has structurally failed; project has zero machine enforcement (no ESLint, no `npm run lint`, no pre-commit, no CI lint gate). 27.5 installs the gate.

**Plan structure (5 plans / 5 waves):**

| Wave | Plan | Tasks | Reqs | Builds |
|---|---|---|---|---|
| 1 | 27.5-01 | 4 | ENF-01/02/03 | `eslint.config.js` + `npm run lint` (`--max-warnings=0`) + `angular.json` lint builder |
| 2 | 27.5-02 | 5 | ENF-04 | husky v9 + lint-staged pre-commit (staged-only, latency-tested) |
| 3 | 27.5-03 | 3 | ENF-05 | NEW `.github/workflows/test-and-lint.yml` (lint BEFORE build) |
| 4 | 27.5-04 | 3 | ENF-06/07 | INITIAL-AUDIT.md + per-rule annotation pass + `MODERN-CLEANUP-1` BACKLOG entry |
| 5 | 27.5-05 | 3 | ENF-08 | CLAUDE.md + MODERNIZATION_GUIDE.md enforcement docs + troubleshooting |

**Director-approved deviations from brief (locked):**
1. CI workflow: NEW `test-and-lint.yml` (deploy.yml is workflow_dispatch only — would defeat ENF-05)
2. `@Output()` ban via custom `no-restricted-syntax` AST rule (`prefer-signals` covers @Input + queries only, not @Output)
3. Estimate: brief said 4–6 hrs; ~250 existing violations make 8–10 hrs realistic. Do NOT truncate annotations to hit original estimate.

**Annotation discipline (Plan 04):** every existing violation gets `eslint-disable-next-line <rule> // pre-existing — pre-Phase-27.5 enforcement; track in MODERN-CLEANUP-1`. INCLUDING the trivial ones (`<mat-spinner>`, etc.). Don't fix-instead-of-annotate mid-phase. Per-rule batching = 5 commits.

**Plan files:** `.planning/phases/27.5-modernization-enforcement/27.5-0[1-5]-PLAN.md` + CONTEXT/RESEARCH/VALIDATION.

**Execute progress:** Plan 01 has 3/4 tasks landed (`5368aff`, `49b1895`, `7e41252`). 4th task (flat config rule configuration) pending. **Halt for Director checkpoint after Plan 01 completes** — verify with intentional violation tests before Plan 02 wires the pre-commit hook.

---

## Brian meeting 2026-04-28 — content brief consumed

Brian walked through `.planning/director/brian-content-brief-v1.4-deferred.md`. 4 DECISIONS entries filed (3% transactional toll, per-app ToS two-layer architecture, pilot↔production project type flip, project-notes as canonical Brian↔W3Geekery collab channel). 3 BACKLOG entries (#095 cross-team sync, #096 Stitch vs Claude Design comparison spike, #097 programmatic vendor-claim flow). 5 brian-content-brief sections updated. Phase 29 scope substantially dissolved per 4-28 directives.

---

## Next-action sequence (when Director Parks resumes)

1. **Restart this Director Parks session in fresh shell** — picks up GSD 1.38.5 commands (`/gsd-foo` not `/gsd:foo`). Per Clark direction at parkit time.
2. **Check Phase 27.5 Plan 01 status** — `git log --oneline -5` should show `7e41252` (3rd task) plus a possible 4th task commit. If Plan 01 is complete, run intentional-violation tests per the brief's verification list, then Director-checkpoint approve before Plan 02 starts.
3. **Phase 24 plan handoff** — fire `/gsd-plan-phase 24` in a fresh shell (GSD 1.38.5). Handoff prompt was drafted in this session's transcript; if needed, re-derive from refreshed brief at `431eafa`. Plans in parallel with 27.5 execute; doesn't block.
4. **Phase 27.5 Plan 02 → 05** — once Plan 01 verified, route gsd-execute through remaining waves. Each wave Director-checkpoint per atomic-commit discipline. Final wave (Plan 05) updates CLAUDE.md + MODERNIZATION_GUIDE.md.
5. **Phase 27.5 verification + close-out** — gsd-verifier against ENF-01..ENF-08; 250+ disable-comment annotations should lint clean; intentional violations should fail at all three gate layers.
6. **Resume Phase 30 plan** — `/gsd-plan-phase 30` reads existing CONTEXT.md. Brief at `b7f9b80` (route slot `/projects` locked). Plan tasks include `npm run lint` exit-0 as verification gate alongside tsc + tests.
7. **Phase 31 brief spot-check** — pre-existing brief; spot-check after 30 closes.
8. **Push 84+ commit delta to `origin/poc/sme-mart`** — fork branch, no PR. Validate range first: `git log --oneline upstream/uat..HEAD`.
9. **Hub generic-sql side-quest** — check Kevin's response on Slack about 0.6.0 connection_profile. If republished, repeat deploy + connect playbook against write-capable Neon secret (NOT readonly `fbafb917-...`).
10. **Send transparency HTML + for-joe MD to Joe (Work Worlds)** — Clark's task after 27.5 closes + push. Files at `.claude/handoffs/`.
11. **Set up BACKLOG #095 recurring sync** — Joe + Dan + Clark.
12. **Demo-org seed engagements for HIS, Work Worlds, etc.** (Clark's hands-on, per 4-28 Action Item #3). Aligns with Phase 24 visibility gate.
13. **DP2 worktree teardown** — `git worktree remove ../sme-mart-dp2 && git branch -D director-parks-2-phase20`.
14. **Worktree hygiene** — `git worktree prune` (8 stale entries; safe).
15. **Decide on session-name-guard `compact` matcher** — drop or keep. Recommendation: drop.
16. **Commit `~/.claude/` verify-phase.md merge** — 2 atomic commits left dirty after `/gsd-reapply-patches` (BLOCKED + filter_deferred_items evidence-enforcement). Eyeball diff first.

---

## Session etiquette reminders

- Address as Clark / Clarky; PT timezone.
- **Admin mechanism: `clientApi.danaClient.getOrgApi().getRequestOrgMember(orgMemberId).admin`** — MCP-verified. Memory was wrong before 2026-04-30; corrected. Phase 24 + future admin-aware code consumes `ProjectContextService.isAdmin$`, NOT direct SDK calls.
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

> Resume Director Parks. Read `.planning/director/DIRECTOR-PARKS-RESUME.md` FIRST (role contract + direct-request override + GSD command format change + AskUserQuestion ban + v1.4 state). Then `.planning/director/SESSION-STATE.md` and recent `.planning/director/DECISIONS.md`. The /meta:director skill applies. **CRITICAL — GSD slash commands changed format 2026-04-30: `/gsd:foo` → `/gsd-foo` (hyphens, GSD only; non-GSD plugins like `/meta:sync` keep colons).** **CRITICAL — AskUserQuestion is globally banned (`~/.claude/settings.json:182`)** — use plain-text confirmation. **v1.4 status: Phases 20, 25, 26, 27, 28 COMPLETE; Phase 27.5 EXECUTING (Plan 01 ~75% — 3/4 tasks committed `5368aff`, `49b1895`, `7e41252`); Phase 24 plan handoff ready to fire; Phase 30 plan PAUSED awaiting 27.5; Phase 31 not started.** **First actions on resume:** (1) check Phase 27.5 Plan 01 status — if 4th task landed, run intentional-violation tests per the 27.5 brief verification list, Director-checkpoint approve before Plan 02; (2) Phase 24 plan handoff — fire `/gsd-plan-phase 24` in fresh shell (brief refreshed `431eafa`, plans in parallel with 27.5 execute); (3) eyeball + commit 2 pending changes in `~/.claude/verify-phase.md` from `/gsd-reapply-patches` (BLOCKED + filter_deferred_items evidence-enforcement merged). **Hub generic-sql 0.6.0 BLOCKED on Kevin** — orphan deployment `9a296640-...`; Slack ping ready. Goal: read/write hub module path. Memory `project_neon_hub_module_goal.md`. **Admin detection wired:** `clientApi.danaClient.getOrgApi().getRequestOrgMember(orgMemberId).admin` (MCP-verified; memory was wrong, corrected 2026-04-30) hydrates `ProjectContextService.setIsAdmin()` via `onboardingGuard`. Phase 24 consumes `ProjectContextService.isAdmin$`, not direct SDK. **Modernization rules block** (`@if`/`@for`, no `CommonModule`, field-level `inject()`, signal-based `input()/output()`, `<mat-progress-spinner>`) MUST be pasted verbatim into BOTH gsd-plan AND gsd-execute handoffs for component-touching phases until Phase 27.5 closes the lint gate. **84 commits unpushed on `poc/sme-mart`** — push to fork branch (no PR) after validating with `git log --oneline upstream/uat..HEAD`. Direct request overrides default boundary (you can run /gsd-* if asked).

---

## Why this file is here instead of `.claude/restart_context.md`

`.claude/restart_context.md` is ambiguous territory — any Claude session that resumes on this repo might read it. Director Parks role rules and in-flight state need a location that is clearly owned by the Director role so other sessions don't accidentally pick up Director-scoped rules and get confused about their own role. `.planning/director/DIRECTOR-PARKS-RESUME.md` is owned. Other sessions reading this path would know they stepped into Director territory.

---

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
