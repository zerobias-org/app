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

**Milestone shape (7 phases, Phase 29 deferred to v1.5; Phase 20 reclaimed + closed inline):**

| # | Phase | Status |
|---|---|---|
| 20 | Fire-and-Forget Audit (reclaimed from v1.3 deferral) | ✅ COMPLETE 2026-04-29 — 3/3 plans, commits `977828c..0f32800`. FF-01..FF-08 VALIDATED. UAT 1-week soak runs post-merge, non-blocking. |
| 24 | Demo Data Visibility Gate | not started |
| 25 | Platform Data Audit | ✅ COMPLETE 2026-04-27 |
| 26 | Seed ZB-as-provider + ratify `company_info` convention | ✅ COMPLETE 2026-04-28 — all 4 plans + phase-level closure done; UAT-deployed + verified 2026-04-29 |
| 27 | Auth gate + onboarding routing + lazy-on-load default-engagement guard | **NEXT** |
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

## Recent commits (2026-04-29)

Phase 20 Waves 1-3 + closure (27 commits ahead of `origin/poc/sme-mart`):
- `977828c` Wave 1: telemetry + AUDIT.md + REQUIREMENTS.md FF-06/07/08 + STATE.md
- `97885c9` Wave 1 cleanup: drop unused destructured var
- `5444014` Wave 1 director-checkpoint corrections (test fix + AUDIT exec summary fix)
- `d64d11d`, `a1321a0`, `8c2236c`, `2a66bc2`, `13415a5`, `8f50a66`, `6f0e58b`, `9418936`, `c8210ed` — Wave 2 service remediations (vendor-profile, vetting, bids+task, reviews, engagements, service-offerings, rfp-invitation, org-document, sme-mart-project)
- `ea49400` Wave 2 test-expectation update (callSiteTag)
- `1721b21` Wave 2 cleanup: drop unused imports + dead test fixtures
- `9853efe` (structure) move `.claude/notes` + `.claude/docs` to `.planning/`
- `89e7c13` Director checkpoint after Wave 2 — BACKLOG corrections + DECISIONS.md callSiteTag-uses-post-edit-line entry + #094 dead-code follow-up
- `769bfde`, `b2e014c`, `150df9a`, `eb228ce`, `672024e`, `7422387` — Wave 2 finish batch (org-document deletes, project-prd, project-plan, sme-mart-board, note-hierarchy, sme-mart-workflow)
- `a31b9a6` BACKLOG.md update from gsd-execute Wave 2 finish
- `904276d` Wave 3: kill-network specs + class-id round-trip + AUDIT cleanup + soak docs + VERIFICATION.md
- `0f32800` Phase 20 closure: ROADMAP/STATE/PROJECT updates (Phase 20 [x], FF-01..08 VALIDATED, completed_phases 7→8, completed_plans 31→34)

Working tree clean. Untracked `.planning/notes/meetings/2026-04-28-marketplace.md` left in place pending `/tt:transcript` processing.

Side-channel work still in flight from prior session (2026-04-27/28):
- `36544dc` (on `w3geekery/tag` fork) — PR #1 on `zerobias-com/tag` introducing `marketplace` tag type. Daniel Rojas merged 2026-04-29.
- Repo migration to `~/Projects/w3geekery/zb-forks/{com,org}/<repo>` — login×2, module, schema, product, vendor, tag relocated. `app/` deferred to end-of-session.

---

## Phase 20 status — CLOSED 2026-04-29

**Plan 20-01 (Audit + class-id verification + telemetry) — CLOSED.** AUDIT.md 60-row table; all 23 SME_MART_CLASS_IDS verified canonical against UAT `platform.Class.getClass`; structured `[PIPELINE_WRITE_FAILURE]` console.warn telemetry on push/delete rejection paths.

**Plan 20-02 (Wave 2 remediation across 42 sites) — CLOSED.** All 33 CRITICAL + 9 MEDIUM call sites converted from `.catch(err => console.error)` to `await + try/catch + MatSnackBar('Dismiss', 5000ms) + explicit callSiteTag + re-throw`. 2 LOW activity-log sites legitimately stay fire-and-forget. Per-service rejection-path specs cover every remediated callSite.

**Plan 20-03 (Wave 3 verification) — CLOSED.** Kill-network specs (note-folder gap closure); parameterized round-trip-per-class-id spec with length/uniqueness drift guards; AUDIT.md prose cleanup with concrete `<file>.ts:NN — surfaces via <mechanism>` citations on all 16 AWAITED rows; UAT-SOAK-READY.md + ROUND-TRIP-RESULTS.md + PHASE-20-SUMMARY.md.

**Verifier:** gsd-verifier returned 8/8 FF-* requirements ✅ VALIDATED. Report at `.planning/phases/20-fire-and-forget-audit/VERIFICATION.md`. PROJECT.md ledger gains FF-01..FF-08 entries.

**Build state at HEAD `0f32800`:** `tsc --noEmit` clean; `npm test` 1537/1537 across 118 files.

**v1.5 polish carried forward:** BACKLOG.md "Fire-and-Forget Remediation Polish (v1.5)" with FF-POLISH-1 (bid retry UX), FF-POLISH-2 (vetting batch per-item), FF-POLISH-3 (submit-button-disable sweep + 2 NgZone-only DocumentTemplate sites). BACKLOG #094 covers pre-existing dead-code sweep on Wave-2-touched files.

**Note re `gsd-tools phase complete`:** subcommand doesn't exist on this gsd-tools install (verbs available: state, resolve-model, find-phase, commit, verify-summary, verify, frontmatter, template, generate-slug, current-timestamp, list-todos, verify-path-exists, config-ensure-section, config-new-project, init, workstream). Equivalent state-machine update applied directly to ROADMAP.md / STATE.md / PROJECT.md in commit `0f32800`. `gsd-tools verify phase-completeness 20-fire-and-forget-audit` reports `complete: true` (3 plans → 4 summaries; PHASE-20-SUMMARY.md is the consolidated narrative, intentionally orphan).

**UAT 1-week soak:** runs post-merge, NON-BLOCKING. Soak findings file as new errata or BACKLOG entries against deployed telemetry; do NOT reopen Phase 20.

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
| **Phase 20 (3 waves + closure)** | DONE | ✅ 2026-04-29. 27-commit delta `977828c..0f32800`. tsc clean, 1537/1537 tests green, FF-01..FF-08 VALIDATED. UAT soak post-merge non-blocking. |
| **27-commit batch push to `origin/poc/sme-mart`** | Director | NEXT after resume refresh. Validates with `git log --oneline upstream/uat..HEAD` before push. No PR yet — push to fork branch only. |
| **Phase 27** | gsd-planner | NEXT v1.4 phase. Auth gate + onboarding routing + lazy-on-load default-engagement guard. Brief refresh likely needed before `/gsd:plan-phase` since prior brief predates Phase 26 closure + W3Geekery default-engagement remediation. |
| Phase 26 (all 4 plans + phase-level closure + UAT deploy) | DONE | ✅ 2026-04-28 + UAT verified 2026-04-29. |
| `poc/sme-mart` synced with `upstream/uat` | DONE | ✅ 2026-04-29 merge `4d6ef39`. |
| Marketplace tagType decision filed | DONE | ✅ 2026-04-29 commit `b460930`. NEW tags use `marketplace`; existing `other` tags stay; `sme-mart.` prefix retained. |
| `zerobias-com/tag` PR #1 (marketplace tagType) merged | DONE | ✅ 2026-04-29 by Daniel Rojas. |
| Brian 2026-04-28 meeting transcript processing | Clark + Director Parks | waiting on `/tt:transcript`. After processing: extract Brian answers, file DECISIONS.md entries for any data-model decisions, mark answered sections in `brian-content-brief-v1.4-deferred.md`, surface follow-up questions. |
| Worktree pruning hygiene | Director | 8 stale prunable entries; `git worktree prune` is safe. Untaken. |
| DP2 worktree teardown | Director | NOW UNBLOCKED (Phase 20 closed): `git worktree remove ../sme-mart-dp2 && git branch -D director-parks-2-phase20`. |
| PKV API verification on UAT (zb-dx friction log 2026-03-13) | deferred | env file reverted; can't test until dev server unblocks. |
| `app/` directory move to `zb-forks/org/app/` | end-of-session | deferred — needs session exit + memory dir rename. |

---

## Next-action sequence (when Director Parks resumes)

1. **Push 27-commit Phase 20 delta to `origin/poc/sme-mart`** — validate first with `git log --oneline upstream/uat..HEAD` (sanity check the range), then `git push origin poc/sme-mart`. Fork branch only — no PR. (PR happens later when v1.4 ships to UAT.)
2. **Phase 27 brief refresh** — pre-existing brief at `.planning/director/phase-27-brief.md` predates Phase 26 closure + W3Geekery Object.tag remediation + Phase 20. Re-read against current state, surface assumptions, update for current Object.tag mechanism + already-validated walkthrough recipe.
3. **`/gsd:plan-phase 27`** — auth gate + onboarding routing + lazy-on-load default-engagement guard. Director hand-off after gsd-planner produces draft PLAN.md.
4. **Brian transcript processing** (`/tt:transcript` when Clark signals go) — extract answers from `2026-04-28-marketplace.md`, file new DECISIONS.md entries for any data-model decisions, mark answered sections in `brian-content-brief-v1.4-deferred.md`, surface follow-up questions.
5. **DP2 worktree teardown** — `git worktree remove ../sme-mart-dp2 && git branch -D director-parks-2-phase20`. Now unblocked.
6. **Worktree hygiene** — `git worktree prune` (8 stale entries; safe, untaken).
7. **Phase 28** — company profile review/confirm form (post-Phase-27).
8. **Phase 30 + 31** — default board, smoke test (close out v1.4).

---

## Session etiquette reminders

- Address as Clark / Clarky; PT timezone.
- Admin mechanism is `getPrincipal().isAdmin` — never propose alternatives.
- No agent handoffs for MCP work that mutates real platform state — Clark wants manual walkthroughs for that.
- Brian asks aren't blockers — placeholders ship; Brian input refines if/when it arrives.
- **Never name Brian (CEO) as a code-author.** Brian sets directives, doesn't write code. Default to "backend team" / "UI team" — never guess names. See `.planning/docs/ORG_CHART.md` for authoritative roster.
- **Never ask "want to pause?" or "continue?".** Whether Clark pauses is none of my concern. He'll stop me if he wants.
- Never fork repos without explicit auth; never merge PRs autonomously; SUCCESS-only CI counts.
- Don't suggest breaks; don't ask "what's next?"; answer questions vs. assume action.
- Director can use `Tell gsd-X:` checkpoint handoff format when delegating between agents/sessions (no quotes, copy-paste-ready).

---

## Quick-start prompt for the next Director Parks session

> Resume Director Parks. Read `.planning/director/DIRECTOR-PARKS-RESUME.md` FIRST (role contract + direct-request override + v1.4 state). Then `.planning/director/SESSION-STATE.md` and recent `.planning/director/DECISIONS.md` entries. The /meta:director skill applies. **v1.4 milestone Phase 20 + 25 + 26 COMPLETE**; Phase 26 shipped to UAT 2026-04-29 (engagements + providers render at `uat.zerobias.com/sme-mart/`); **Phase 20 closed 2026-04-29 with FF-01..FF-08 VALIDATED** (60-site audit + telemetry + 42-site remediation + drift-guard tests + verifier). 27-commit delta `977828c..0f32800` sits unpushed on `poc/sme-mart`. **First action on resume: push the delta to `origin/poc/sme-mart`** (fork branch, no PR). **Then refresh `phase-27-brief.md`** (predates Phase 26 closure + Object.tag remediation) and run `/gsd:plan-phase 27`. v1.4 next-up: Phase 27 (auth gate + lazy-engagement-guard) → Phase 28 (company profile form) → Phase 30 (default board) → Phase 31 (W3Geekery first-customer smoke test). Phase 29 deferred to v1.5. UAT Phase 20 soak runs post-merge non-blocking. **Brian 2026-04-28 transcript still pending** — `/tt:transcript` when Clark signals. Direct request overrides default boundary (you can run /gsd:* if asked).

---

## Why this file is here instead of `.claude/restart_context.md`

`.claude/restart_context.md` is ambiguous territory — any Claude session that resumes on this repo might read it. Director Parks role rules and in-flight state need a location that is clearly owned by the Director role so other sessions don't accidentally pick up Director-scoped rules and get confused about their own role. `.planning/director/DIRECTOR-PARKS-RESUME.md` is owned. Other sessions reading this path would know they stepped into Director territory.

---

## Session log — 2026-04-29 (Phase 26 closure + UAT deploy saga + upstream sync)

What this session achieved, in order:

1. **Phase 26 phase-level closure** — option A from yesterday's three-way. gsd-execute ran the regression gate (32 specs / 416 tests pass), spawned gsd-verifier (PASS for SP-01/04/05/06; SP-02 PARTIAL pending UAT), ran `gsd-tools phase complete 26`, refreshed STATE.md prose. Closure commits: `f66299a`, `1b0cc40`, `80aaf8f`.
2. **DP2 handoff cherry-pick** — pulled DP2's Phase 20 brief refresh + ROADMAP entry into `poc/sme-mart` (`2bfecfa`, `96c8d45`). The 3-wave PLAN.md stays on the `director-parks-2-phase20` worktree branch until execution time.
3. **DP2 worktree gitlink fix** — gsd-execute's `67c5883` commit had accidentally `git add`ed the worktree directory as a phantom 160000 submodule. Untracked + ignored (`bf5f2f0`).
4. **`.claude/` Obsidian-rename damage repair** — the directory had been renamed on disk to `SME Mart` (literal space) by Obsidian opening it as a vault. Two prior commits (`ebb6f5b`, `67c5883`) bulk-added the renamed copy under the new name, replicating 188 files plus a `.obsidian/` folder + 36 MB `node_modules/`. Untracked the misnamed copy (`4cbf6d9`), `mv`'d back to `.claude/`, surgical gitignores for `.obsidian/`, `node_modules/`, `.DS_Store`, `plans-archive/`, then re-tracked legitimate content (`22719ed`).
5. **UAT deploy saga**:
   - PR #50 — full diff (93 files) including planning + `.claude/`. Closed as superseded.
   - PR #51 — narrowed to 12 runtime files. Merged 16:43Z. Auto-deployed → broke: bucket layout was `sme-mart/sme-mart/browser/index.html` instead of `sme-mart/index.html`. `uat.zerobias.com/sme-mart/` → `/not-found`.
   - **Root cause**: `poc/sme-mart` carried pre-PR-#46 versions of `angular.json` (no `outputPath` flatten) and `package.json` (bare `ng build`, no UAT config + base-href). Cherry-picking those onto upstream silently undid #46.
   - Same family as `.github/workflows/deploy.yml` — that file had been excluded from #51 BECAUSE we noticed it carried Clark's old `afc97d8` rollback that PR #44 had already superseded.
   - PR #52 — hotfix, restored `outputPath` and build-script line. SDK bumps preserved. Merged + deployed → working.
6. **`poc/sme-mart` synced with `upstream/uat`** (merge `4d6ef39`) — closes the long-divergence problem at the source. Future cherry-picks from this branch won't carry stale config. Merge was clean (only `package.json` auto-merged; SDK bumps + build script + outputPath all converged correctly).

UAT verification screenshots confirm: My Engagements, /providers list (ZeroBias card), /providers/<zb-org-id> detail page all rendering. SP-02 PARTIAL → PASS.

**Lesson saved (apply to all future deploy PRs from `poc/sme-mart` or any long-lived branch):**
> Before cherry-picking config files (`angular.json`, `package.json` build scripts, `.github/workflows/*.yml`, env files) onto an `upstream/uat` deploy branch, run `git log --name-only --pretty=format: $(git merge-base poc/sme-mart upstream/uat)..upstream/uat | sort -u` and exclude any file that appears — take upstream's version instead, or three-way merge it. Keeping `poc/sme-mart` periodically synced with upstream prevents this entirely.

---

## Session log — 2026-04-29 (Phase 20 — full lifecycle in one session)

7. **Phase 20 Wave 1** — gsd-execute committed `977828c` + `97885c9` (telemetry + AUDIT.md + REQUIREMENTS.md FF-06/07/08 + STATE.md), then halted with two BLOCKERS: failing `pipeline-write.service.spec.ts:280` test (vitest stack-frame issue with `deriveCallSiteFromStack` fallback) + AUDIT.md exec summary contradiction. Director's checkpoint corrections landed in `5444014`. Suite to 1472/1472 green.
8. **Phase 20 Wave 2 (in flight when Director resumed)** — by the time Director Parks loaded, gsd-execute had already completed 26/42 sites across 9 services (vendor-profile, vetting, bids+task, reviews, engagements, service-offerings, rfp-invitation, org-document, sme-mart-project). Resume document was stale; verified actual state from disk. Handed remaining 16 sites + 6 files to gsd-execute with locked pattern (`await` + `try/catch` + `MatSnackBar('Dismiss', 5000ms)` + explicit `callSiteTag` + re-throw). Wave 2 finish landed in 6 service commits + BACKLOG update + structure refactor.
9. **Wave 2 Director checkpoint (`89e7c13`)** — 4 findings surfaced by gsd-execute: (1) callSiteTag drift on 4 of 6 finish-batch files (post-edit lines vs AUDIT-row anchors); Director accepted post-edit as the standard, filed DECISIONS.md "Phase 20 Telemetry `callSiteTag` Uses Post-Edit `await` Line Number" — no amends, since 2 prior services (reviews, engagements) had already drifted to post-edit; (2) BACKLOG.md "Remaining (18 sites)" table stale — every row already remediated in prior commits; replaced with clean v1.5 polish framing; (3) FF-Polish v1.5 section never created — added with FF-POLISH-1/2/3 (bid retry UX, vetting batch per-item, submit-button-disable sweep); (4) pre-existing dead-code on touched files filed as BACKLOG #094, deferred.
10. **Phase 20 Wave 3 (`904276d`)** — verification only, no new code. Note-folder kill-network specs (3 tests for callSites :107/:230/:260). Parameterized round-trip-per-class-id `it.each` over 23 className→UUID cases + length/uniqueness drift guards. AUDIT.md prose cleanup: column header rewrite distinguishing "snackbar exists" vs "reflects actual outcome"; 16 AWAITED rows replaced "likely has error handling" with concrete `<file>.ts:NN — surfaces via <mechanism>` citations (honest tally: 5 proper / 2 no-consumer / 2 NgZone-only / 9 admin-swallow). UAT-SOAK-READY.md + ROUND-TRIP-RESULTS.md + PHASE-20-SUMMARY.md + per-plan summaries + VERIFICATION.md (gsd-verifier 8/8 ✅). Suite to 1537/1537 green.
11. **Phase 20 closure (`0f32800`)** — final administrative state-machine update. ROADMAP Phase 20 → COMPLETE 2026-04-29 3/3 plans. STATE completed_phases 7→8, completed_plans 31→34. PROJECT FF-01..FF-08 ✅ VALIDATED. Note: `gsd-tools phase complete` subcommand doesn't exist on this install; equivalent updates applied directly to ROADMAP/STATE/PROJECT and called out in commit body. `gsd-tools verify phase-completeness 20-fire-and-forget-audit` → `complete: true`.
12. **Director Parks session-name guard discussion** — Clark surfaced that `/rename` events kept firing during gsd-execute sub-agent runs. Diagnosis: `compact` matcher in `~/.claude/settings.json` SessionStart hooks fires on sub-agent auto-compactions; guard re-issues no-op `tmux send-keys "/rename ..."`. Recommendation: drop the `compact` matcher entirely (session names already survive `/compact` via JSONL `customTitle`; matcher is redundant noise). Decision pending Clark.

**Net session outcome:** Phase 20 fully closed in one Director Parks session — Wave 1 fix → Wave 2 finish → Wave 2 checkpoint → Wave 3 → closure → resume refresh. 27 commits unpushed on `poc/sme-mart`, ready for batch push to `origin/poc/sme-mart`. tsc clean, 1537/1537 tests green, FF-01..FF-08 VALIDATED.

