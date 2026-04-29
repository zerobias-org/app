# Neon-via-Hub Wireup Plan

**Created:** 2026-04-22
**Owner:** Clark
**Status:** Approved — Phase 0 complete (audit verdict GO); Phase 1 ready to start
**Goal:** Flip the SME Mart published-app build from `dbMode: 'neon'` (direct browser-to-Neon HTTP with creds) to `dbMode: 'hub'` (browser → ZB Hub → generic-sql → Neon, zero creds in client). Unblock feature work that needs Neon access on published builds.

---

## BOOTSTRAP — Required reading for a fresh session

If you're picking this up after `/clear`, do this before touching anything:

### 1. Session & environment state to recover

- **Claude session name:** `zb-org-app`. After `/clear`, run `/rename zb-org-app` immediately. (Per memory: `/clear` silently drops session name.)
- **Working directory:** `/Users/cstacer/Projects/w3geekery/zerobias-org-forks/app`
- **ZB MCP profile:** `uat-clark@w3geekery`. Verify with `meta.listProfiles`. If it isn't `active:true, connected:true`, run `meta.switchProfile` — but check the lock first (next item).
- **ZB MCP profile lock:** `~/.claude/scripts/zb-mcp-profile-lock.sh check uat-clark@w3geekery`. If safe, acquire: `zb-mcp-profile-lock.sh acquire uat-clark@w3geekery zb-org-app`. Release at end with `release`.
- **Neon MCP project:** `square-meadow-76427985` (sme-mart), db `neondb`, branch `br-wild-mode-affit7rf`. Role currently backing the Hub secret: `zb_hub_readonly` (SELECT only). Phase 1 creates `zb_hub_readwrite`.
- **Active Hub resources (UAT):**
  - Deployment `87f6ff90-3e60-11f1-97df-d9b9a1d21aad`
  - Secret `fbafb917-b7e4-4221-a945-9b51e8652391` (managed, valid)
  - Connection `5ae47aa2-285a-439b-b12c-1429dd272931` (up, auto PT5M)
  - Default scope `a7b22df3-dee5-443a-b562-0256d86e46ec`
  - Boundary: SME Marketplace DEV (`c15fb2dc-4f8c-48b5-b27a-707bd516b005`)

### 2. Read these files in this order (skim is fine after the first two)

1. **This plan** — end to end.
2. **`.planning/notes/hub-wiring-audit-2026-04-22.md`** — Phase 0 audit verdict, SDK-op mapping, env-file inventory, bit-rot findings.
3. **`.planning/docs/HUB_CONNECTION_SETUP_NEON.md`** — the playbook for the Hub connection we stood up today. Exact MCP sequences for Secret.create / updateSecretValues / reverify are here.
4. **`src/app/core/services/sme-mart-db.service.ts`** — the file being polished in Phase 2 (456 lines).
5. **`.planning/docs/MODERNIZATION_GUIDE.md`** — Angular 21 patterns (signals, `input()`/`output()`/`inject()`). `@Input`/`@Output`/constructor injection banned.
6. **Root `CLAUDE.md`** (at `/Users/cstacer/Projects/w3geekery/zerobias-org-forks/CLAUDE.md`) — 3-repo overview.
7. **App `CLAUDE.md`** (at `/Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/CLAUDE.md`) — publishing path (cross-fork PR to `zerobias-org/app:uat` triggers `uat.zerobias.com/sme-mart`).
8. **SME Mart `CLAUDE.md`** — project-level quick references; look for `Hub Connection Setup (Neon)` row added today.

### 3. Skills & sub-tools to know about

- **`/meta:director`** — Architect/QA role. Not needed for Phase 1 (simple provisioning). Consider invoking `checkpoint` mode before Phase 4 (PR open).
- **`sme-mart-architect`** (project-level skill) — Angular 21 + ngx-library + DataProducer patterns. Use it for any significant code change beyond the single-line URL polish in Phase 2. Phase 1 doesn't need it. Phase 5 (tests) might.
- **`/gsd:debug`** — if a phase fails and root-cause isn't obvious, start a debug session.
- **`Plan` / `planner` subagent** — don't re-plan; this plan IS the plan. Only spawn if an unforeseen scope expansion happens.
- **`Explore` subagent** — okay for deep code reads that would burn context (e.g., if you need to diff the SDK surface against 456 lines of service code).

### 4. Relevant memory pointers (auto-loaded, but highlighted)

- `feedback_mcp_is_sanctioned_path.md` — NEVER curl/fetch ZB APIs directly, always MCP.
- `feedback_never_merge_prs_autonomously.md` — stop after `gh pr create`, only `SUCCESS` CI counts.
- `feedback_always_pull_before_commits.md` — rebase `poc/sme-mart` onto `upstream/uat` before Phase 4.
- `feedback_fresh_branch_per_pr.md` — merged = closed, don't push to merged branches.
- `feedback_verify_commit_contents.md` — `git show HEAD --stat` after each commit.
- `feedback_targeted_test_runs.md` — Phase 5 tests targeted, not the 900-spec full suite.
- `reference_zb_mcp_profile_lock.md` — usage notes for the lock script.
- `feedback_neon_mcp_single_statement.md` / memory note "Neon MCP Rules: run_sql = ONE statement only" — Phase 1 grants must be separate calls.
- `feedback_no_unauthorized_forks.md` — don't create silent forks on push fail.
- `feedback_no_unsolicited_commits_recaps.md` — don't commit without explicit ask. Phase 4 has the commit call-out explicit; still wait for confirmation before `git push`.

### 5. Write-target table list (evidence-grepped, bake into Phase 1 grants)

```
app_settings, categories, notifications, org_documents, org_document_shares,
provider_profiles, provider_skills, provider_roles, provider_products,
provider_frameworks, provider_segments, provider_service_segments,
sme_resource_tags, sme_resource_links
```

Fourteen tables. Clark approved this list for MVP; "will adjust as needed."

### 6. What NOT to do (from prior session corrections)

- **Do not touch `environment.vercel.ts`, `middleware.ts`, `vercel.json`, or `build:vercel`.** Vercel is being retired in a separate phase. Leave it alone.
- **Do not build or publish a custom Hub Module.** We consume the shipped `@auditlogic/module-auditmation-generic-sql@0.5.0`. This is the distinction BACKLOG 089 missed — the correction is part of Phase 6's doc updates.
- **Do not use the Neon pooler endpoint** (`ep-xxx-pooler.*`). JDBC can't SCRAM-auth through it. Use the direct endpoint (`ep-xxx.*`) in the JDBC URL.
- **Do not design schemas or plan Pipeline+GQL migration work here.** Separate effort.
- **Do not invoke plan mode (`EnterPlanMode`).** Per Clark's preference.

### 7. Phase-start checklist

Before running any phase:
- [ ] Session renamed to `zb-org-app` (if fresh session).
- [ ] Profile lock held for `uat-clark@w3geekery`.
- [ ] Working dir is the app repo root.
- [ ] This plan file is open and current phase is clear.

---

## Why this plan is (probably) small — and the "probably" matters

The planner + a quick code audit surfaced that **the app-side Hub code path already exists**. A previous milestone stood up `SmeMartDbService` with a 456-line implementation that supports both `'neon'` and `'hub'` modes, including `createRow` / `updateRow` / `deleteRow` via parameterized SQL. Environments files already carry `dbMode` and `smeMartConnectionId` fields.

**But this code is old** (per Clark: "written long ago"). Before trusting it, Phase 0 audits the wiring for bit-rot against the current SDK and the generic-sql 0.5.0 op shapes. If the audit finds gaps, the plan expands to fix them before Phase 1 begins.

Assuming no audit surprises, only config and infrastructure are missing:

1. A Hub connection with **write privileges** (the one we stood up today has a SELECT-only Neon role).
2. The env files pointing at the real UUID (current placeholder `e3c874f5-5fd8-4fbc-8120-19861e28b19e` does not match today's connection `5ae47aa2-285a-439b-b12c-1429dd272931`).

If the audit finds gaps (deprecated SDK methods, missing fields, mismatched op names, token/header plumbing drift), Phase 0 expands with concrete fixes before Phases 1–6 proceed.

## Scope boundaries

- **In scope:** Neon readwrite role, updating today's Hub secret/connection in place, env file swap, local + UAT verification, deploy, doc updates (CLAUDE.md, HUB_CONNECTION_SETUP_NEON.md, BACKLOG entry 089).
- **Out of scope:** Pipeline+GQL migration (continues independently per 089). New Angular code beyond tests. A custom Hub Module (we consume the shipped `@auditlogic/module-auditmation-generic-sql`).
- **Neither owned nor blocked:** Production Hub connection deployment (Kevin's environment) — tracked as a follow-on.

## Evidence snapshot (2026-04-22)

### Write-target tables (14, from grep of `createRow|updateRow|deleteRow` under `src/app`)

```
app_settings, categories, notifications, org_documents, org_document_shares,
provider_profiles, provider_skills, provider_roles, provider_products,
provider_frameworks, provider_segments, provider_service_segments,
sme_resource_tags, sme_resource_links
```

### Existing env state (ZB-native targets only; Vercel is out of scope)

| File | dbMode | smeMartConnectionId | Notes |
|------|--------|---------------------|-------|
| `environment.ts` (dev) | `'neon'` | `e3c874f5-...` (stale) | local dev, `.env.local` URL |
| `environment.uat.ts` (UAT ZB-native) | `'neon'` | `''` | Published UAT build target |
| `environment.prod.ts` (prod ZB-native) | `'hub'` | `''` | Prod — already hub, connection TBD by Kevin |
| `environment.stack.ts` | `'neon'` | — | zbb local stack (local PG) |

### Existing Hub infrastructure (UAT, `uat-clark@w3geekery`)

| Resource | ID | Role/Creds |
|----------|-----|-----------|
| Deployment (generic-sql 0.5.0) | `87f6ff90-3e60-11f1-97df-d9b9a1d21aad` | — |
| Secret (managed, valid) | `fbafb917-b7e4-4221-a945-9b51e8652391` | holds **readonly** JDBC URL today |
| Connection (up, auto PT5M) | `5ae47aa2-285a-439b-b12c-1429dd272931` | bound to SME Marketplace DEV boundary |
| Default scope | `a7b22df3-dee5-443a-b562-0256d86e46ec` | — |
| Neon role (today) | `zb_hub_readonly` | SELECT only |

## Design decision: one connection, scoped readwrite role

Keep a single Hub connection for the app. Swap the Neon credentials from `zb_hub_readonly` → new `zb_hub_readwrite` via `hub.Secret.updateSecretValues`. The readwrite role is least-privileged to the 14 write-tables + SELECT elsewhere.

Rationale:
- App uses one `smeMartConnectionId` config — no per-operation routing.
- Hub + Neon grants give defense-in-depth: boundary scoping + DB-level privilege limits.
- The readonly role/connection pattern is preserved in the playbook for reporting or audit scenarios, but isn't used by the app.

Alternative considered & rejected: two connections (readonly + readwrite) with per-op selection. Would require app code changes, adds coordination complexity. Deferred unless a compelling need arises.

## Phases

### Phase 0 — Audit the existing Hub wiring (~45 min)

**Goal:** Confirm `SmeMartDbService`'s Hub path actually works against generic-sql 0.5.0 + current `@zerobias-com/zerobias-angular-client`. Identify bit-rot before provisioning anything.

Artifacts to read (in order):

1. `src/app/core/services/sme-mart-db.service.ts` — full file (456 lines). Focus areas:
   - How the Hub connection is initialized (DataProducerClient? HubConnector? ZerobiasAppService?).
   - Which op gets called for reads (`getCollectionElements` / `searchCollectionElements` / `invokeFunction('query', …)`).
   - Which op gets called for writes (`addCollectionElement` / raw SQL via `invokeFunction`?).
   - Whether table names are resolved to object IDs (we saw `/db:neondb/schema:public/table:foo` shape today — does the service build that path?).
   - Auth headers: does it rely on `ZerobiasAppService` + `hubClient` or does it hand-roll an API key?
2. `src/app/core/services/app-init.service.ts` (or similar bootstrap) — is `ZerobiasAppService.getInstance()` called early? Is a Hub-mode branch already in there?
3. `package.json` — SDK versions:
   - `@zerobias-com/zerobias-angular-client`
   - `@zerobias-com/zerobias-client`
   - Any `dataproducer-client` / `module-auditmation-generic-sql-client-ts` lingering (SDK layer for the module).
4. `src/environments/environment.ts` — look at every field the service touches (beyond `dbMode` and `smeMartConnectionId` — e.g., `apiHostname`, `isLocalDev`).
5. `.planning/docs/GENERIC_SQL_HUB_MODULE.md` original v0.3.x API table — diff it against today's 0.5.0 op list (26 ops, captured in the playbook). Any op rename that the service depends on is a block.

Comparison targets (what "good" looks like):

- Init pattern matches data-explorer's (see `package/zerobias/data-explorer/CLAUDE.md` in this repo, section "Hub Module Client Initialization (CRITICAL PATTERN)"): `getZerobiasClientUrl('hub', …)` + connection profile with `server`, `targetId`, `apiKey`, `orgId`.
- Read flow ends up invoking one of the 0.5.0 ops confirmed working today: `getRootObject` / `getChildren` / `getCollectionElements` / `searchCollectionElements` / `invokeFunction`.
- Write flow does the same — if it uses `addCollectionElement` / `updateCollectionElement` / `deleteCollectionElement`, confirm 0.5.0 keeps those names (it does — they're in the 26-op list).

Output of Phase 0:

- A 1-page `.planning/notes/hub-wiring-audit-2026-04-22.md` capturing: (i) op name map (service → 0.5.0), (ii) any method calls that are deprecated/renamed, (iii) auth-plumbing findings, (iv) whether the `e3c874f5-…` placeholder appears elsewhere.
- A go/no-go verdict. If no-go, an **inline amendment to this plan** listing the specific fixes Phase 0.5 must land before Phase 1. If go, proceed.

Acceptance: the audit note exists, has a verdict, and lists any blocking fixes explicitly.

Risk: SDK method drift (renamed or moved accessors). Mitigation: grep the installed `node_modules/@zerobias-com/zerobias-angular-client/dist/**/*.d.ts` for the exact current signatures before editing any service code.

Rollback: N/A — Phase 0 is read-only.

---

### Phase 1 — Provision readwrite Neon role + swap Hub secret (~45 min)

**Goal:** Hub connection authenticates to Neon as a role that can write to exactly the 14 tables the app writes to, read anywhere.

Steps (Neon MCP for DB; ZB MCP for Hub):

1. Acquire ZB MCP profile lock: `~/.claude/scripts/zb-mcp-profile-lock.sh acquire uat-clark@w3geekery <session>`.
2. Neon: `CREATE ROLE zb_hub_readwrite WITH LOGIN PASSWORD '<generated>'` (generate 28-char base64-ish, as before).
3. Neon grants (one statement per MCP `run_sql` call):
   - `GRANT CONNECT ON DATABASE neondb TO zb_hub_readwrite`
   - `GRANT USAGE ON SCHEMA public TO zb_hub_readwrite`
   - `GRANT SELECT ON ALL TABLES    IN SCHEMA public TO zb_hub_readwrite`
   - `GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO zb_hub_readwrite`
   - `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO zb_hub_readwrite`
   - Per the 14 write-tables above: `GRANT INSERT, UPDATE, DELETE ON public.<table> TO zb_hub_readwrite` (14 statements).
   - Per the sequences those tables use: `GRANT USAGE, SELECT, UPDATE ON public.<seq> TO zb_hub_readwrite` (depends on Drizzle defaults — list will be queried before grant).
4. Verify via psql: connect as `zb_hub_readwrite`, confirm SELECT everywhere, INSERT allowed on `categories`, INSERT **denied** on e.g. `marketplace_users` (which app doesn't write).
5. ZB MCP: `hub.Secret.updateSecretValues` on secret `fbafb917-...` — new JDBC URL using readwrite creds + **direct (non-pooler)** endpoint.
6. ZB MCP: `hub.Connection.reverify` on `5ae47aa2-...` — wait for `status: up`, `secret.status: valid`.
7. Exercise a write end-to-end: `hub.Target.execute invokeFunction { objectId: '/db:neondb/function:query', functionInput: { sql: "INSERT INTO categories(name, slug, icon, sort_order) VALUES ('hub-smoke','hub-smoke','test',9999) RETURNING id" } }` → record returned id → `DELETE WHERE id = …` to clean up.

Acceptance: readwrite role verified at both Neon and Hub layers; test row written and deleted with no errors; readonly role untouched and still works for its own tests.

Risk: over-granting. Mitigation: the 14-table list is grep-derived and pasted verbatim into the SQL; peer-review the statements before running.

Rollback: revoke readwrite grants + `DROP ROLE zb_hub_readwrite`, restore readonly JDBC URL to the secret.

---

### Phase 2 — Env config flip + UUID sync + server-URL polish (~45 min)

**Goal:** UAT ZB-native build uses Hub. Dev updated with real UUID for opt-in parity testing. Prod left with explicit TODO.

Files & changes (Vercel is out of scope — `environment.vercel.ts` is untouched):

| File | Current | New |
|------|---------|-----|
| `src/environments/environment.ts` | `dbMode: 'neon'`, `smeMartConnectionId: 'e3c874f5-...'` | Keep `dbMode: 'neon'` (dev iterates fastest with direct Neon per (b)); update `smeMartConnectionId` to `5ae47aa2-...` so Hub-opt-in works when someone flips locally |
| `src/environments/environment.uat.ts` | `dbMode: 'neon'`, `smeMartConnectionId: ''` | `dbMode: 'hub'`, `smeMartConnectionId: '5ae47aa2-...'` |
| `src/environments/environment.prod.ts` | `dbMode: 'hub'`, `smeMartConnectionId: ''` | Add comment `// TODO(prod-hub): Kevin to provision prod generic-sql deployment + connection; set UUID when ready.` No UUID change yet. |
| `src/environments/environment.stack.ts` | `dbMode: 'neon'` | No change — zbb stack uses local PG, not Hub. |

Additional polish in this phase (per audit):

- **`src/app/core/services/sme-mart-db.service.ts`** — replace line 104's hardcoded URL with `getZerobiasClientUrl('hub', true, environment.isLocalDev)`. Import `getZerobiasClientUrl` from `@zerobias-com/zerobias-client` (already used by `document.service.ts`; not a new dep). Keeps same-origin behavior, matches data-explorer pattern, gives dev-mode flexibility. Update the deprecation docblock (lines 9–34) to reflect today's hub setup reality.

Acceptance: `ng build --configuration uat` succeeds; built bundle references `5ae47aa2-...`; `grep -r "e3c874f5" src/environments/` outside `environment.vercel.ts` returns zero matches.

Risk: wrong UUID baked into bundle. Mitigation: `grep 5ae47aa2 dist/` after build.

Rollback: `git revert` the config commit.

---

### Phase 3 — Local verification against UAT Hub (~45 min)

**Goal:** Prove the app works end-to-end in Hub mode before deploying.

Steps:

1. In dev, temporarily flip `environment.ts` `dbMode: 'hub'`, `npm start`.
2. Log in as any dev user. In DevTools:
   - Check console for Hub connection init log (already emitted by `SmeMartDbService`).
   - Navigate to Categories admin (reads), create a test category, edit it, delete it.
   - Navigate to Provider Profile editor (provider-profiles writes), add a skill, remove it.
   - Navigate to Documents (org_documents writes), upload/share/update a doc.
   - Navigate to Notifications, mark one read then dismiss.
3. For any feature that throws, record error + which Hub op + which SQL statement. Most likely failure mode: a sequence missing from readwrite grants — fix with an incremental `GRANT USAGE ON SEQUENCE …`.
4. Revert `environment.ts` back to `'neon'` once verification passes (dev keeps fast feedback).

Acceptance: five write flows complete without error; matching rows visible via direct Neon psql.

Risk: Angular client error surfaces differ from raw psql errors (Hub wraps them). Mitigation: keep psql-as-readwrite open in a side terminal to diff.

Rollback: env revert; local-only, zero blast radius.

---

### Phase 4 — Deploy to UAT ZB-native + verify published app (~45 min)

**Goal:** published UAT build at `https://uat.zerobias.com/sme-mart` reads and writes Neon via Hub with zero browser creds.

**Publishing path (clarified by Clark 2026-04-22):**
- Work lives on `w3geekery/app:poc/sme-mart`. That branch publishes **nowhere** via ZB.
- Publish to UAT by opening a PR **from `w3geekery/app:poc/sme-mart` → `zerobias-org/app:uat`**. Merging that PR triggers auto-deploy to `https://uat.zerobias.com/sme-mart`.

Steps:

1. Commit Phase 1 + Phase 2 changes on branch `poc/sme-mart` (`w3geekery/app` fork). Use conventional commits per git-workflow rules. Include `Session: claude --resume zb-org-app` footer.
2. Push `poc/sme-mart` to origin (`w3geekery/app`).
3. Sync `zerobias-org/app:uat` into local `poc/sme-mart` (pull upstream/uat, rebase or merge). Resolve any conflicts — CLAUDE.md rule "always pull/sync upstream before commits" applies.
4. Open cross-fork PR: `gh pr create --repo zerobias-org/app --base uat --head w3geekery:poc/sme-mart --title "..." --body "..."`. Include test plan + deploy expectations in the body.
5. **STOP at PR open** per memory `feedback_never_merge_prs_autonomously.md` — wait for Clark to review, for CI to pass SUCCESS (never SKIPPED), and for Clark's merge.
6. After merge, ZB deploy pipeline publishes. Clark confirms URL is live before smoke starts.
7. Open `https://uat.zerobias.com/sme-mart/` in a fresh browser session.
8. Smoke checklist:
   - [ ] Login works (Dana session).
   - [ ] Category list renders (reads via Hub).
   - [ ] Create a category → edit it → delete it (writes via Hub).
   - [ ] Upload a document (tests org_documents + org_document_shares writes).
   - [ ] Notifications page: dismiss one.
   - [ ] DevTools Network tab: **no `*.neon.tech` requests**. Hub traffic goes to same-origin `/api/hub/*`.
9. Pull the deployed JS bundle and `grep -E "neon\\.tech|npg_|NEON_DATABASE_URL"` — expect zero matches.

Acceptance: all six smoke items pass; zero `neon.tech` requests in Network tab; no secrets in bundle.

Risk: conflicts when rebasing `poc/sme-mart` onto current `upstream/uat`. Mitigation: do the rebase early (step 3) and resolve before opening the PR.

Rollback: if the deployed build breaks UAT, open a revert PR from `w3geekery/app` back to `zerobias-org/app:uat`; merge reverts the env flip. Deploy pipeline republishes the revert.

---

### Phase 5 — Tests + guardrails (~45 min)

**Goal:** Prevent regression of Hub-mode behaviour.

1. Add a unit test case in `src/app/core/services/sme-mart-db.service.spec.ts` (or sibling) that exercises Hub mode explicitly, mocking the Angular ZB client. Cover `listRows`, `searchRows`, `createRow`, `updateRow`, `deleteRow`.
2. Add a Playwright smoke test in `e2e/` that drives categories CRUD through the UI and asserts on DOM, tagged for the `smoke` suite. (Per CLAUDE.md's E2E guide — check `.planning/notes/e2e-testing-guide.md` first.)
3. Run targeted tests only (per memory `feedback_targeted_test_runs.md`): `npm test -- sme-mart-db.service` + the new Playwright spec.

Acceptance: tests pass locally; failing tests produce actionable errors (not just "undefined").

Risk: Playwright auth flow in UAT may require a fresh token — see e2e-testing-guide. Mitigation: reuse existing test-auth fixtures.

Rollback: N/A — tests don't affect runtime.

---

### Phase 6 — Docs + backlog reconciliation (~30 min)

**Goal:** The decision log reflects reality. Future developers don't rediscover what we just learned.

Updates (the actual edits — not placeholders):

1. **`CLAUDE.md`** (top-level Key Constraints):
   - Rewrite the line "Generic SQL Hub Module for Neon DB access (DataProducer interface, no direct Drizzle)" to something like: "For published builds: **Neon access goes through ZB Hub** via generic-sql (connection `5ae47aa2-...`); browser never sees Neon creds. Dev mode uses direct Drizzle for speed. Pipeline+GQL migration is the longer-term direction per BACKLOG 089."
   - Quick Reference table: add a row for this plan + HUB_CONNECTION_SETUP_NEON.md if not already linked.

2. **`.planning/docs/HUB_CONNECTION_SETUP_NEON.md`** (playbook):
   - Append a "Consumed by" section: "The connection created by this playbook is consumed by the SME Mart Angular app via `smeMartConnectionId` in `src/environments/environment.*.ts`. The Neon role backing the secret must be readwrite, not readonly — see Phase 1 of `.planning/phases/neon-via-hub-wireup.md` for grants."
   - Add a "Rotating Neon creds in place" sub-section showing the exact `hub.Secret.updateSecretValues` + `reverify` flow used in Phase 1.

3. **`.planning/docs/GENERIC_SQL_HUB_MODULE.md`** (stale doc):
   - Remove the "publishing path not currently working" language.
   - Point readers to this plan and the playbook.

4. **`.planning/docs/WHY_HUB_MODULE.md`** (stale doc):
   - Add a dated note at the top: "The **consume generic-sql** approach proven here replaced the earlier 'build a custom Hub Module' framing. For why we consume rather than publish, see BACKLOG 089 and this plan."

5. **`.planning/BACKLOG.md` entry 089**:
   - Add a 2026-04-22 update: "Correction: the 089 analysis conflated *publishing a custom Hub Module* (unnecessary) with *consuming an existing Hub Module* (necessary today). We consume `@auditlogic/module-auditmation-generic-sql` on UAT as a read/write bridge to Neon. Pipeline+GQL migration remains the real end state tracked separately. 089 itself stays archived."

6. **New follow-on BACKLOG item** (~1 line): "Production Hub connection deployment — Kevin owns; populate `smeMartConnectionId` in `environment.prod.ts`. Blocks first prod release."

Acceptance: all six doc edits present; `grep -r "publishing path not currently working"` returns zero matches.

Risk: Forgetting one of the stale docs. Mitigation: this checklist.

Rollback: N/A — docs are orthogonal to runtime.

---

## Cross-cutting unknowns surfaced during planning

1. **Sequence grants.** Neon Drizzle schemas generally use UUID defaults rather than serial, but a few tables may have sequences for integer columns. Before Phase 1, run `SELECT relname FROM pg_class WHERE relkind='S' AND relnamespace='public'::regnamespace` and grant `USAGE, SELECT, UPDATE` to `zb_hub_readwrite` on whatever matches.
2. **Write path clarification (from audit):** `SmeMartDbService` Hub-mode writes use the typed collection APIs (`addCollectionElement` / `updateCollectionElement` / `deleteCollectionElement`), NOT raw SQL. The raw `INSERT`/`UPDATE`/`DELETE` statements seen in the service file are in the Neon-mode branch only. Phase 1's GRANTs target Postgres-level permissions regardless of which path the SDK takes — the module invokes SQL under the hood — so no scope change.
4. **Org / boundary scoping in Hub responses.** The app currently filters by `org_id` / `user_id` in query WHERE clauses. Hub doesn't add implicit filters. Verify Phase 3 flows don't regress multi-tenant isolation.
5. **Error payload shape.** Hub may wrap Neon errors (unique constraint violations, FK violations) in its own envelope. Domain code that switches on error codes will need verification — grep for `constraint` / `unique` / `pg_` in services; none expected but verify.

## Rollback story (the big one)

If the published app is broken after Phase 4:

1. `git revert <commit>` on `poc/sme-mart`; push. ZB deploy pipeline auto-deploys the revert.
2. `environment.uat.ts` is back to `'neon'` — but UAT has no `neonConnectionString` baked in, so a pure revert returns the app to the *pre-Hub-wireup* broken-on-published state (Neon inaccessible). That was the starting point of this work. Not a regression.
3. Root-cause the Hub failure in a feature branch. No urgency on main.

The readwrite Neon role and the updated secret can stay — they don't affect anything unless `dbMode: 'hub'` is active in a running build.

## Estimated total: ~4.5 hrs across seven phases (Phase 0 + six)

- Phase 0 (audit): 0.75 hr
- Phase 1 (Neon role + secret swap): 0.75 hr
- Phase 2 (env flip): 0.5 hr
- Phase 3 (local verify): 0.75 hr
- Phase 4 (deploy + verify): 0.5 hr
- Phase 5 (tests): 0.75 hr
- Phase 6 (docs): 0.5 hr

If Phase 0 finds bit-rot requiring service-layer fixes, the total inflates — budget +1–3 hrs depending on scope. Tracks within your 15 hr/week cap either way.

## Approval gate

Phase 0 starts when Clark signs off on this plan. Phase 1 (any provisioning) does NOT start until the Phase 0 audit verdict is "go" — or the amended plan includes the specific bit-rot fixes as Phase 0.5. Specifically confirm before Phase 0:
- (a) Option A+ is still the call (one connection, readwrite, least privilege).
- (b) Dev (`environment.ts`) stays on `'neon'` mode for local iteration.
- (c) The 14-table write list is correct — nothing missing from the grep.
