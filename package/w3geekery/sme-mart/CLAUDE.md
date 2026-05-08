# CLAUDE.md - SME Mart

> **On Startup:** Read `.planning/BACKLOG.md` — source of truth for all pending work. Read `.planning/PROJECT.md` + `.planning/ROADMAP.md` for current milestone state.

> **UAT Environment:** CI/dev was rebuilt with hydra. UAT (`uat.zerobias.com`) is the active dev environment. Migration complete 2026-03-30 — see [`.planning/notes/uat-migration-tracker.md`](.planning/notes/uat-migration-tracker.md) for ID mapping reference. `npm run dev` targets UAT.

> **⚠️ ALWAYS prefer `~/Projects/w3geekery/zerobias-org-forks/` over `~/Projects/zb/` for every repo that exists in zerobias-org-forks (app, login, module, schema, etc.).** We are a 3rd-party developer — work from the w3geekery fork, push to the fork, and create cross-fork PRs to zerobias-org. Only use `~/Projects/zb/` for read-only reference unless specifically asked otherwise.

## Purpose

SME Mart is a **marketplace for Subject Matter Experts** in compliance/cybersecurity — "Upwork meets Whop" for ZeroBias platform users. Built with **Angular 21**.

## Quick Reference

| What | Where |
|------|-------|
| **UAT ID Reference** | [`.planning/notes/uat-migration-tracker.md`](.planning/notes/uat-migration-tracker.md) — CI→UAT ID mapping (migration complete) |
| **Backlog (all pending work)** | [`.planning/BACKLOG.md`](.planning/BACKLOG.md) — select items for next GSD milestone |
| **Project & Milestone State** | [`.planning/PROJECT.md`](.planning/PROJECT.md), [`.planning/ROADMAP.md`](.planning/ROADMAP.md) |
| **Plan Archive (historical)** | `.claude/plans-archive/` — old PLAN.md + 55 plan files (local-only, gitignored) |
| **Source Paths (SDKs, repos)** | [`.planning/docs/SOURCE_PATHS.md`](.planning/docs/SOURCE_PATHS.md) |
| **🛑 SDK / API Verification — READ FIRST for any "what's the API for X" question** | [`.planning/docs/SDK_VERIFICATION_SOURCES.md`](.planning/docs/SDK_VERIFICATION_SOURCES.md) — authoritative sources are ZB MCP (`zerobias_search`/`zerobias_describe`), actual ZB platform source, and actual SDK source. The deprecated Next.js prototype is NOT authoritative. Memory entries can be wrong — verify against MCP/SDK before citing. |
| **Angular 21 Docs** | [`AGENTS.md`](AGENTS.md) — local docs index in `.angular-docs/` (refresh: `npx angular-agents-md`) |
| **Next.js prototype** (archived) | `../sme-mart-nextjs-deprecated/` |
| **ZeroBias UI** (Angular 21 reference) | `~/Projects/zb/ui` |
| **SDK source** | `~/Projects/zb/clients/packages/` |
| **Neon DB reference** | [`.planning/notes/neon-mcp-reference.md`](.planning/notes/neon-mcp-reference.md) — project ID, tables, common SQL queries |
| **Hub Connection Setup (Neon)** | [`.planning/docs/HUB_CONNECTION_SETUP_NEON.md`](.planning/docs/HUB_CONNECTION_SETUP_NEON.md) — step-by-step playbook: generic-sql deployment + managed secret + connection via ZB MCP |
| **UAT CloudFront Cache Invalidation** | [`.planning/docs/UAT_CLOUDFRONT_CACHE_INVALIDATION.md`](.planning/docs/UAT_CLOUDFRONT_CACHE_INVALIDATION.md) — when `uat.zerobias.com/sme-mart/` shows stale code after deploy: SSO prod account → distribution `E23VJPBBDUCHBQ` → Invalidations → `/*` |
| **ZB Portal API curl Fallback** | [`.planning/docs/ZB_PORTAL_CURL_FALLBACK.md`](.planning/docs/ZB_PORTAL_CURL_FALLBACK.md) — recipe for querying `portal.*` endpoints (frameworks, vendors) when ZB MCP doesn't index the service |
| **Demo data guide** | [`.planning/notes/demo-data-guide.md`](.planning/notes/demo-data-guide.md) — buyers, providers, engagements, ZB Tasks, demo scenarios |
| **GQL Schema Extension (howto)** | [`.planning/notes/zb-graphql-custom-schema-howto.md`](.planning/notes/zb-graphql-custom-schema-howto.md) — customer-facing guide: YAML schema packages, querying, filtering |
| **GQL Schema Extension (internals)** | [`.planning/notes/zb-graphql-schema-extension-guide.md`](.planning/notes/zb-graphql-schema-extension-guide.md) — platform internals: SchemaBuilder, catalog tables, source files |
| **SME Mart Resource Types** | [`.planning/notes/sme-mart-resource-types-summary.md`](.planning/notes/sme-mart-resource-types-summary.md) — resource type inventory shared with Kevin |
| **File Upload SDK** | [`.planning/notes/zb-file-upload-sdk-reference.md`](.planning/notes/zb-file-upload-sdk-reference.md) — FileService SDK, upload workflow, task attachments, preview, ZB UI reference |
| **Task SDK + RACI** | [`.planning/notes/zb-task-reference.md`](.planning/notes/zb-task-reference.md) — **READ before any `platform.Task.*` work.** RACI field mapping (`assigned`=R, `accountable`=A, `approvers`=C(legacy name!), `notified`=I), Party UUID requirements, link types, ownerId, common mistakes. Don't re-grep zb/ui. |
| **Permissions / RBAC** | [`.planning/notes/zb-permissions-reference.md`](.planning/notes/zb-permissions-reference.md) — **READ before any admin/permission check.** System roles (Organization Admin, Boundary Admin, etc.), auto-created groups per Org/Boundary, `searchRolesByPrincipal` / `searchRoles` / `searchOrgMembers` APIs with `via` resolution. Don't invent new roles — system roles cover the cases. |
| **E2E Testing Guide** | [`.planning/notes/e2e-testing-guide.md`](.planning/notes/e2e-testing-guide.md) — **READ before writing Playwright tests.** Stack, auth model, gotchas, page object patterns, debugging playbook |
| **Schema repo** | [`zerobias-org/schema`](https://github.com/zerobias-org/schema) — YAML schema packages (source of truth for GQL entities) |
| **Post-mortems** | [`.claude/post-mortems/`](.claude/post-mortems/) — failure reports (see [`INDEX.md`](.claude/post-mortems/INDEX.md)). **Read before starting any schema change.** |
| **zb-dx (Developer Experience)** | `~/Projects/zb/zerobias-org/zb-dx` — shared knowledge base for all ZB platform developers. **File friction with `/friction`, browse patterns, find integration guides.** See below. |
| **LSP routing** | `~/.claude/rules/common/lsp-registry.md` — built-in `LSP` is the default for symbol queries; `mcp__vscode-mcp__*` only for specific triggers (see below) |

## LSP routing — three routes, route by operation

**Built-in `LSP` is the default for SINGLE-FILE symbol queries on `.ts`/`.tsx`/`.scss`/`.yaml`.** For cross-file references in TS, default to `mcp__vscode-mcp__*` — empirically the standalone route returns 0 in multi-project Angular CLI workspaces.

Reach for **`mcp__vscode-mcp__*`** when:

1. **Angular component template (`.html` inside a component dir)** — built-in LSP can't drive ngserver; use `mcp__vscode-mcp__get_symbol_lsp_info`.
2. **Real-time diagnostics** ("did my edit just break TS / lint?") — use `mcp__vscode-mcp__get_diagnostics` (instant; replaces slow `tsc --noEmit` / `eslint .`).
3. **Workspace-wide rename** with import updates — use `mcp__vscode-mcp__rename_symbol`.
4. **Cross-file `findReferences` in TypeScript** in this multi-project workspace — built-in route returns 0; use `mcp__vscode-mcp__get_symbol_lsp_info` (avoids the 8KB truncation bug `get_references` hits on heavy-ref symbols).

Reach for **`mcp__cclsp__*`** when:

5. **Fuzzy global symbol search by name** ("find me a class/function called X-ish") — use `mcp__cclsp__find_workspace_symbols`. Returns symbols + file paths + line numbers. Unique to cclsp.

For everything else — especially single-file hover/goToDefinition on plain `.ts` files — the built-in `LSP` tool is the right call. Lower latency, no 8KB response truncation, no VSCode dependency. **Don't drift to vscode-mcp because the tool names sound more capable.**

For SCSS:
- **Single-file ops** (definition, hover, documentSymbol) — built-in `LSP` (some-sass-language-server) is better than VSCode's bundled CSS server.
- **Cross-file `findReferences`** — empirically broken across all LSP routes (server-side limitation in SCSS LSPs). Fall back to `grep`. SCSS variable/mixin names are usually unique enough that grep noise is manageable.

**Project status for vscode-mcp:**
- `strictTemplates: true` is already enabled in this repo's `tsconfig.json`, so Angular template intelligence via vscode-mcp works out of the box.
- vscode-mcp setup (extensions + MCP server registration): see [w3geekery/claude-code-lsps CLAUDE.md](https://github.com/w3geekery/claude-code-lsps/blob/main/CLAUDE.md).

Full routing table, failure-mode anchors, empirical findings, and detailed rationale: `~/.claude/rules/common/lsp-registry.md` (auto-loaded into every Claude Code session). Benchmarks: `~/Projects/zb/ui/.planning/lsp-bench/REPORT.md`.

## zb-dx — ZeroBias Developer Experience

**Repo:** `~/Projects/zb/zerobias-org/zb-dx` | **Slack:** `#zb-dx` (zerobias.org workspace)

A shared knowledge base for any developer building on `zerobias-sdk` / `zerobias-client` / `zerobias-angular-client`. Patterns, guides, skills, and friction logs contributed by the community. The best artifacts graduate into customer-facing KB articles, dev guides, and LLM skills.

**Use this repo as part of daily workflow:**

| When... | Do... |
|---|---|
| You hit a ZB SDK/API pain point | `/friction new <title> -s high -a sme-mart` -- creates a friction-log entry |
| Another dev reports the same issue | `/friction confirm <slug>` -- bumps to confirmed |
| You want to escalate to ZB platform team | `/friction task <slug> --notify` -- creates ZB Task, notifies `#zb-dx` |
| You solved something non-obvious | Write a `patterns/` or `guides/` entry (check IDEAS.md for open items) |
| You find a reusable agent/Claude pattern | Propose it as a `skills/` entry |

**What lives there:**

| Directory | Contents |
|---|---|
| `friction-log/` | 10+ pain-point reports (auth, SDK, hub module, PKV, CDN) with lifecycle tracking (`draft -> confirmed -> task-created -> resolved -> promoted`) |
| `patterns/` | 8 Multica-derived integration patterns (workspace hierarchy, flat projects, boundaries, activity log, agent-skill junction, etc.) |
| `guides/` | How-to walkthroughs born from real friction (growing) |
| `skills/` | `/friction` (log manager) + `/zb-dx-register` (participant onboarding) |
| `participants/` | Developer profiles: Clark (W3Geekery/SME Mart), Dan (SDI/Readiness Center), Joe (Work Worlds) |
| `IDEAS.md` | Running board of patterns/guides/skills/tools worth building -- add freely |

**Existing friction relevant to SME Mart:** SDK whoAmI field mismatch, hub-module unavailable on UAT/QA, PKV API 500s, CDN KB articles require auth, no formal project construct (pre-CE14), file attachments on shared S3.

**Self-registration:** new devs run `/zb-dx-register` after joining `#zb-dx`.

## Skills

- **`/angular-architect`** — invoke the global skill for general Angular 21 architecture questions
- **`sme-mart-architect`** — project-level skill (`.claude/skills/`) with SME Mart-specific patterns: ngx-library, DataProducer, standalone components, no Nx. Invoke for implementation work.
- **`/meta:director`** — Architect/QA role alongside GSD. Modes: `design`, `review`, `checkpoint`, `watch`, `retro`. Project adapter at `.claude/commands/meta/director.md` (upstream: `zerobias-org/meta-harness`). Director state lives in `.planning/director/`.
- **`/meta:sync`** — Sync meta-harness upstream and merge changes into the project adapter. Run periodically (start of milestone or when Kevin mentions updates).

## Angular 21 Patterns

**READ [`.planning/docs/MODERNIZATION_GUIDE.md`](.planning/docs/MODERNIZATION_GUIDE.md) before writing any component.** `@Input`/`@Output`/constructor injection are banned — use `input()`/`output()`/`inject()`. See the guide for the full pattern list.

**Machine-enforced (Phase 27.5, 2026-05-01):** ESLint config at [`eslint.config.js`](eslint.config.js) encodes the modernization rules. Every commit is gated by the pre-commit hook ([`../../../.husky/pre-commit`](../../../.husky/pre-commit) + [`.lintstagedrc.json`](.lintstagedrc.json)); every PR/push is gated by [`../../../.github/workflows/lint.yml`](../../../.github/workflows/lint.yml). Both gates run **diff-based** — they only check files in your change. Warnings are treated as failures (`--max-warnings=0`).

**Touch It = Fix It.** When you modify a file, fix every modernization-rule violation in that file as part of the same change. Pre-existing violations in **untouched** files do not block your PR — they're tracked in [`.planning/phases/27.5-modernization-enforcement/INITIAL-AUDIT.md`](.planning/phases/27.5-modernization-enforcement/INITIAL-AUDIT.md) and `MODERN-CLEANUP-1` ([`.planning/BACKLOG.md`](.planning/BACKLOG.md)) for organic migration.

**If lint fires on you,** see the troubleshooting section in [MODERNIZATION_GUIDE.md](.planning/docs/MODERNIZATION_GUIDE.md#if-lint-fires-on-you--troubleshooting-common-violations) for before/after fixes for the common rules.

**Emergency bypass** (`git commit --no-verify`) is human-only and requires explicit authorization. Agents must never use it. If used, file an errata immediately under `.planning/director/errata/`.

## File Naming Convention

Angular 21 dropped type suffixes from filenames (e.g., `foo.ts` instead of `foo.component.ts`). **This project keeps the traditional suffixed naming** — it's far easier to scan in a file tree.

| Type | Pattern | Example |
|------|---------|---------|
| Component | `foo.component.ts` / `.html` / `.scss` | `provider-card.component.ts` |
| Service | `foo.service.ts` | `catalog.service.ts` |
| Pipe | `foo.pipe.ts` | `currency-format.pipe.ts` |
| Directive | `foo.directive.ts` | `auto-focus.directive.ts` |
| Guard | `foo.guard.ts` | `admin.guard.ts` |
| Resolver | `foo.resolver.ts` | `provider.resolver.ts` |
| Model/Interface | `foo.model.ts` | `provider.model.ts` |
| Routes | `foo.routes.ts` | `my-profile.routes.ts` |

**Always include the type suffix.** This applies to all new files going forward.

## Vercel Deployment (Temporary)

**Live URL:** `https://sme-mart-clark-stacers-projects.vercel.app/`

Temporary hosting while the ZeroBias platform publishing path is WIP.

- **API proxy:** Vercel Edge Middleware proxies `/api/*` → `uat.zerobias.com` (was CI, migrating to UAT)
- **Database:** Direct Neon HTTP (`dbMode: 'neon'`) — Hub Module connector not active in QA
- **Auth:** API key-based (same as local dev), no session/login flow
- **Build config:** `ng build --configuration vercel` → `environment.vercel.ts`
- **Env vars:** `ZB_API_KEY`, `ZB_ORG_ID`, `ZB_TOKEN`, `GITHUB_TOKEN` (set in Vercel dashboard)
- **Branch:** `poc/sme-mart` (auto-deploys on push)

## Deployment Paths (LOCKED 2026-05-01)

3P customer apps in `zerobias-org/app` deploy ONLY to: **uat, qa, prod**.

- `dev` and `ci` are valid ZB **platform** environments (ZB itself runs there) but are NOT deploy targets for any 3P customer app in this repo.
- Local dev server (`ng serve` via `npm run dev*`) can target ANY ZB env (dev/ci/uat/qa/prod) — that's local-machine testing against an upstream platform env, not a deployment of our app.
- CI workflows MUST NOT reference `dev` or `ci` as deploy targets for this app.
- Cross-fork PRs from `w3geekery/app:poc/sme-mart` target only `zerobias-org/app:{uat,qa,prod}`.

Sweep tracker: BACKLOG.md `DEV-CI-PURGE-1` (strip remaining `build:dev` / `build:ci` script variants + branch→env mappings from app-root docs).

## Key Constraints

- **No Nx** — plain Angular CLI (`ng serve`, `ng build`, `angular.json`)
- **Standalone components** — Angular 21 default, no NgModules
- **`@zerobias-org/ngx-library`** — use its components and theme before building custom
- **`@zerobias-com/zerobias-angular-client`** — wraps `zerobias-client` → `zerobias-sdk` (all SDKs)
- **Generic SQL Hub Module** for Neon DB access (DataProducer interface, no direct Drizzle)
- **Neon VIEWs** for read queries (no JOINs in DataProducer) — writes go to individual tables
- **Tag tagType: use `marketplace` for all new tags** — registered 2026-04-29 in `zerobias-com/tag` PR #1 (Daniel Rojas merged). Existing `other`-typed tags stay (renaming = UUID churn). Tag NAMES retain `sme-mart.` prefix for now. See DECISIONS.md "Marketplace tagType Is Preferred for New Tags".
- **15 hrs/week cap** — Clark / W3Geekery contractor

## Team

- **Brian** — CEO. Business directives (Tasks & Boundaries requirement). Not a developer.
- **Kevin** — CIO. Platform/Hub infrastructure. Flag platform issues to Kevin.
- **Clark** — W3Geekery contractor. SME Mart frontend.
