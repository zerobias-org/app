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

**Design status: LOCKED.** 9 structural decisions resolved. Fully-committed director artifacts:
- `.planning/director/SESSION-STATE.md` — full mental model + decision list
- `.planning/director/DECISIONS.md` — 9+ entries (auto/invariant default engagement, naming convention `<Buyer> <- <Provider>`, Phase 29 deferred, admin via `getPrincipal().isAdmin`, Object.tag validation, etc.)
- `.planning/director/bootstrap-w3geekery-engagement.md` — validated walkthrough recipe (18 refinements folded)
- `.planning/director/backlog/005-sme-mart-entity-tagging-mechanism.md` — RESOLVED (no schema PR needed)
- `.planning/director/phase-{24,25,26,27,28,30,31}-brief.md` — 7 phase briefs

**Milestone shape (7 phases, Phase 29 deferred to v1.5):**

| # | Phase | Notes |
|---|---|---|
| 24 | Demo Data Visibility Gate | Admin via `getPrincipal().isAdmin`; gate-with-delete-escape-hatch pattern |
| 25 | Platform Data Audit (NEW) | SDK inventory → `PLATFORM-DATA-INVENTORY.md`; first `/gsd:discuss-phase` target |
| 26 | Seed ZB-as-provider + `company_info` convention + ServiceOffering placeholder tiers (Free/$99/$999) | Also covers retroactive tag push for walkthrough records |
| 27 | Auth gate + onboarding routing + lazy-on-load default-engagement guard | Guard uses validated bootstrap recipe inline |
| 28 | Company profile review/confirm form | Pre-populated from Phase 25 audit; decoupled from engagement creation |
| 30 | Default Project board + "Coming Soon" placeholder surfaces (046/066/065) | User-landing surface |
| 31 | W3Geekery as first customer + production smoke test | Closes loop; the UAT walkthrough records are the dogfood seed |
| ~~29~~ | DEFERRED to v1.5 | Tier display / ToS / branding (display-layer; Brian-ask content) |

**Engagement naming convention:** `<Buyer> <- <Provider>` ASCII reverse-arrow, buyer-first, supply-flow direction (arrow points toward buyer-as-Demand-owner). Default ZB: `"W3Geekery <- ZeroBias"`.

**Validated walkthrough UUIDs (UAT, do NOT delete):**
- Hydra Tag `a81cd320-243e-44eb-bdd9-9824019ef3dd` (`sme-mart.eng.w3geekery-default-zb`)
- Engagement Task `2c95bc18-a978-4766-a7d3-f7ceb8a9cff5` (code `aha1-6`)
- Engagement (external) `746010b7-dc99-436b-9142-8c4b85c5e623`
- Engagement (internal Object UUID) `f5361821-4beb-4e1b-8d92-04bc243fa63a`
- SmeMartProject `ea4db55f-2c57-4567-a1be-6e7fd1a210bf`

---

## Object.tag mechanism — validated 2026-04-24

Canonical write shape: `tag: [{ value: "<hydra-tag-UUID>" }]` in Pipeline.receive payload at ingest. Immutable post-ingest.

Read paths validated:
- Read-by-id: `platform.Object.getVersionByObjectIdOrVersionId` returns the `tag` array.
- Read-by-tag: GQL via `graphql.Boundary.boundaryExecuteRawQuery` with `ClassName(tag: { value: ".eq.<uuid>" }) { ... }`.

See DECISIONS.md "Object.tag Field Shape" for the full experiment record.

**Residue to clean up in a future batch:** `TAG-SHAPE-TEST-C` (schema id `64047b6c-52e7-4592-ac1d-27f5020d1e01`) — include `markDeleted` in a future `SmeMartProject` Pipeline.receive batch (class `c66114a2-48e2-5b93-b7d6-7ccd6ef45a03`).

---

## In-flight external blockers

| Owner | What | Unblocks |
|---|---|---|
| Andrey | Provision `w3geekery.uat.zerobias.com` subdomain | Branded-login UAT verification (NOT v1.4-blocking; fallback URL works) |
| Brian | Pricing tiers, ToS, branding, opt-in-vs-auto | ALL non-blocking — placeholders ship |
| Nic | Linked Project mechanism | NOT v1.4-blocking (multi-3PAO is v1.5+) |

Kevin's READ-endpoint question (Object.tag discovery) was **resolved empirically** — not pending.

---

## Next-action sequence (post today's work)

Today's commits (in order): `9019b82` seeder fix → `2b06694` walkthrough folded → `c0392a6` Hub docs → `28bd078` Object.tag validated → `f52af09` 7 phase briefs → `5089c47` deploy-probe for UAT verification.

Pending work:

1. **Push `poc/sme-mart` to w3geekery/app origin** + open cross-fork PR to `zerobias-org/app:uat`. Merging triggers UAT auto-deploy. Needs your explicit approval to push (never merge autonomously).
2. **Walk HIS as a second proof-of-concept** (~45 min, manual MCP, Clark-driven) — validates recipe generalizes beyond W3Geekery.
3. **Encode batch script** (`.planning/director/batch-prime-engagements-for-existing-orgs.md`) — after HIS validation.
4. **v1.4 milestone scaffold** via `/gsd:new-milestone v1.4 "3P Onboarding & Default Engagement"` — per direct-request override, Director Parks CAN run this if you ask. Otherwise you run it in a non-Director session.
5. **Per-org LLM-prompt generation brief** — after Phase 25 (data audit) + Phase 28 (profile form design) land.

---

## Session etiquette reminders

- Address as Clark / Clarky; PT timezone.
- Admin mechanism is `getPrincipal().isAdmin` — never propose alternatives.
- No agent handoffs for MCP work that mutates real platform state — Clark wants manual walkthroughs for that.
- Brian asks aren't blockers — placeholders ship; Brian input refines if/when it arrives.
- Never fork repos without explicit auth; never merge PRs autonomously; SUCCESS-only CI counts.
- Don't suggest breaks; don't ask "what's next?"; answer questions vs. assume action.
- File-based message bus pattern is available for sibling-session coordination: `.planning/director/walkthrough-inbox.md` + `.planning/director/director-inbox.md`.

---

## Quick-start prompt for the next Director Parks session

> Resume Director Parks. Read `.planning/director/DIRECTOR-PARKS-RESUME.md` FIRST (role contract + direct-request override + v1.4 state). Then `.planning/director/SESSION-STATE.md` and recent `.planning/director/DECISIONS.md` entries. The /meta:director skill applies. v1.4 milestone design is locked (7 phases); 7 phase briefs committed; default-ZB engagement recipe validated on UAT; Object.tag write+read both validated. Pending: UAT deploy push, HIS second-case walkthrough, batch script, /gsd:new-milestone (you run OR ask Director Parks directly — direct request overrides the default boundary).

---

## Why this file is here instead of `.claude/restart_context.md`

`.claude/restart_context.md` is ambiguous territory — any Claude session that resumes on this repo might read it. Director Parks role rules and in-flight state need a location that is clearly owned by the Director role so other sessions (gsd-execute, zb-org-app, ui-gsd, whatever) don't accidentally pick up Director-scoped rules and get confused about their own role. `.planning/director/DIRECTOR-PARKS-RESUME.md` is owned. Other sessions reading this path would know they stepped into Director territory.
