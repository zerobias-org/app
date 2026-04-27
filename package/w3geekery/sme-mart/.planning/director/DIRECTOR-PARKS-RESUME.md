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

**Design status: LOCKED.** 9+ structural decisions resolved. Fully-committed director artifacts:
- `.planning/director/SESSION-STATE.md` — full mental model + decision list
- `.planning/director/DECISIONS.md` — 11+ entries (auto/invariant default engagement, naming convention `<Buyer> <- <Provider>`, Phase 29 deferred, admin via `getPrincipal().isAdmin`, Object.tag validation, **MarketplaceProfileItem Replace Semantics**, **W3Geekery Object.tag Remediation**, etc.)
- `.planning/director/bootstrap-w3geekery-engagement.md` — validated walkthrough recipe (18 refinements folded; remediation note added 2026-04-27)
- `.planning/director/COMPANY-INFO-CONVENTION-DRAFT.md` — rewritten 2026-04-27 for section/data discriminator shape with canonical 17-section catalog
- `.planning/director/PLATFORM-DATA-INVENTORY.md` — Phase 25 deliverable; pre-fill map corrected for MPI section/data
- `.planning/director/phase-{24,25,26,27,28,30,31}-brief.md` — 7 phase briefs (phase-26-brief updated 2026-04-27 post-Phase-25 close)

**Milestone shape (7 phases, Phase 29 deferred to v1.5):**

| # | Phase | Status |
|---|---|---|
| 24 | Demo Data Visibility Gate | not started |
| 25 | Platform Data Audit | **COMPLETE 2026-04-27** (live MCP re-execution after MCP fix landed; corrections propagated to dependent docs) |
| 26 | Seed ZB-as-provider + ratify `company_info` convention | brief updated, ready for `/gsd:plan-phase 26` |
| 27 | Auth gate + onboarding routing + lazy-on-load default-engagement guard | not started |
| 28 | Company profile review/confirm form (section/data shape) | brief updated 2026-04-27 |
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
- Engagement: `7711aa41-e55b-5cda-9b7a-35844a2006a1`
- SmeMartProject: `c66114a2-48e2-5b93-b7d6-7ccd6ef45a03`
- MarketplaceProfileItem: `7bcf86a5-91dc-520d-b9bf-e308b1078d46`

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

| Class | Class ID | Records to delete |
|---|---|---|
| MarketplaceProfileItem | `7bcf86a5-91dc-520d-b9bf-e308b1078d46` | `mpi-test-a-cd7105df`, `mpi-test-b-cd7105df` (replace-semantics test) |
| SmeMartProject | `c66114a2-48e2-5b93-b7d6-7ccd6ef45a03` | `64047b6c-52e7-4592-ac1d-27f5020d1e01` ("TAG-SHAPE-TEST-C", pre-existing) |

Phase 26 seed batch is the natural place to clean up the MPI residues (same class, same ingest). SmeMartProject residue defers until next SmeMartProject ingest.

---

## In-flight external blockers

| Owner | What | Unblocks |
|---|---|---|
| Andrey | Provision `w3geekery.uat.zerobias.com` subdomain | Branded-login UAT verification (NOT v1.4-blocking; fallback URL works) |
| Brian (CEO) | Pricing tiers, ToS, branding, opt-in-vs-auto | ALL non-blocking — placeholders ship |
| Nic | Linked Project mechanism | NOT v1.4-blocking (multi-3PAO is v1.5+) |

Kevin's READ-endpoint question (Object.tag discovery) was **resolved empirically** — not pending.

---

## Recent commits (2026-04-27)

- `c94be39` feat(phase-25): platform data audit — 9 SDK/GQL/hydra sources documented + UAT pipelineId fix
- `cd24f04` docs(director): MarketplaceProfileItem section/data shape + W3Geekery Object.tag remediation
- `1824c92` chore(phase-25): closeout — summaries, verification re-execution, BACKLOG cleanup row
- `92a66b4` docs(phase-26): brief updated post-Phase-25 close

Earlier: `9019b82` seeder fix → `2b06694` walkthrough folded → `c0392a6` Hub docs → `28bd078` Object.tag validated → `f52af09` 7 phase briefs → `5089c47` deploy-probe → `537d52b` Phase 25 plan files.

---

## Next-action sequence

1. **`/gsd:plan-phase 26`** — Phase 26 brief is updated and ready. Direct command, no extra context needed. The brief references all canonical specs.
2. **Phase 26 review** — when plans land, Director Parks reviews against the brief + COMPANY-INFO-CONVENTION-DRAFT.md + replace-semantics finding.
3. **Phase 26 execute** — Pipeline.receive seed for ZeroBias org's MPI records. Includes residue cleanup (`mpi-test-a/b`). Browse Providers UI verification.
4. **Phase 27** — auth gate + lazy-engagement-guard. Brief exists; will need refresh after Phase 26 lands.
5. **Phase 28** — company profile form. Brief updated with section/data shape + adapter pattern + deterministic id strategy. Form-schema work (Phase 22) is a dependency.

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

> Resume Director Parks. Read `.planning/director/DIRECTOR-PARKS-RESUME.md` FIRST (role contract + direct-request override + v1.4 state). Then `.planning/director/SESSION-STATE.md` and recent `.planning/director/DECISIONS.md` entries. The /meta:director skill applies. v1.4 milestone design is locked (7 phases). **Phase 25 COMPLETE 2026-04-27** with live-MCP corrections (synthesized→live; MarketplaceProfileItem schema corrected; W3Geekery Object.tag remediated). Phase 26 brief updated post-Phase-25 close — ready for `/gsd:plan-phase 26`. Direct request overrides default boundary (you can run /gsd:* if asked).

---

## Why this file is here instead of `.claude/restart_context.md`

`.claude/restart_context.md` is ambiguous territory — any Claude session that resumes on this repo might read it. Director Parks role rules and in-flight state need a location that is clearly owned by the Director role so other sessions don't accidentally pick up Director-scoped rules and get confused about their own role. `.planning/director/DIRECTOR-PARKS-RESUME.md` is owned. Other sessions reading this path would know they stepped into Director territory.
