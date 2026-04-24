# CLAUDE.md - SME Mart

> **On Startup:** Read `.planning/BACKLOG.md` — source of truth for all pending work. Read `.planning/PROJECT.md` + `.planning/ROADMAP.md` for current milestone state.

> **UAT Environment:** CI/dev was rebuilt with hydra. UAT (`uat.zerobias.com`) is the active dev environment. Migration complete 2026-03-30 — see [`.claude/notes/uat-migration-tracker.md`](.claude/notes/uat-migration-tracker.md) for ID mapping reference. `npm run dev` targets UAT.

> **⚠️ ALWAYS prefer `~/Projects/w3geekery/zerobias-org-forks/` over `~/Projects/zb/` for every repo that exists in zerobias-org-forks (app, login, module, schema, etc.).** We are a 3rd-party developer — work from the w3geekery fork, push to the fork, and create cross-fork PRs to zerobias-org. Only use `~/Projects/zb/` for read-only reference unless specifically asked otherwise.

## Purpose

SME Mart is a **marketplace for Subject Matter Experts** in compliance/cybersecurity — "Upwork meets Whop" for ZeroBias platform users. Built with **Angular 21**.

## Quick Reference

| What | Where |
|------|-------|
| **UAT ID Reference** | [`.claude/notes/uat-migration-tracker.md`](.claude/notes/uat-migration-tracker.md) — CI→UAT ID mapping (migration complete) |
| **Backlog (all pending work)** | [`.planning/BACKLOG.md`](.planning/BACKLOG.md) — select items for next GSD milestone |
| **Project & Milestone State** | [`.planning/PROJECT.md`](.planning/PROJECT.md), [`.planning/ROADMAP.md`](.planning/ROADMAP.md) |
| **Plan Archive (historical)** | `.claude/plans-archive/` — old PLAN.md + 55 plan files (local-only, gitignored) |
| **Source Paths (SDKs, repos)** | [`.claude/docs/SOURCE_PATHS.md`](.claude/docs/SOURCE_PATHS.md) |
| **Angular 21 Docs** | [`AGENTS.md`](AGENTS.md) — local docs index in `.angular-docs/` (refresh: `npx angular-agents-md`) |
| **Next.js prototype** (archived) | `../sme-mart-nextjs-deprecated/` |
| **ZeroBias UI** (Angular 21 reference) | `~/Projects/zb/ui` |
| **SDK source** | `~/Projects/zb/clients/packages/` |
| **Neon DB reference** | [`.claude/notes/neon-mcp-reference.md`](.claude/notes/neon-mcp-reference.md) — project ID, tables, common SQL queries |
| **Hub Connection Setup (Neon)** | [`.claude/docs/HUB_CONNECTION_SETUP_NEON.md`](.claude/docs/HUB_CONNECTION_SETUP_NEON.md) — step-by-step playbook: generic-sql deployment + managed secret + connection via ZB MCP |
| **ZB Portal API curl Fallback** | [`.claude/docs/ZB_PORTAL_CURL_FALLBACK.md`](.claude/docs/ZB_PORTAL_CURL_FALLBACK.md) — recipe for querying `portal.*` endpoints (frameworks, vendors) when ZB MCP doesn't index the service |
| **Demo data guide** | [`.claude/notes/demo-data-guide.md`](.claude/notes/demo-data-guide.md) — buyers, providers, engagements, ZB Tasks, demo scenarios |
| **GQL Schema Extension (howto)** | [`.claude/notes/zb-graphql-custom-schema-howto.md`](.claude/notes/zb-graphql-custom-schema-howto.md) — customer-facing guide: YAML schema packages, querying, filtering |
| **GQL Schema Extension (internals)** | [`.claude/notes/zb-graphql-schema-extension-guide.md`](.claude/notes/zb-graphql-schema-extension-guide.md) — platform internals: SchemaBuilder, catalog tables, source files |
| **SME Mart Resource Types** | [`.claude/notes/sme-mart-resource-types-summary.md`](.claude/notes/sme-mart-resource-types-summary.md) — resource type inventory shared with Kevin |
| **File Upload SDK** | [`.claude/notes/zb-file-upload-sdk-reference.md`](.claude/notes/zb-file-upload-sdk-reference.md) — FileService SDK, upload workflow, task attachments, preview, ZB UI reference |
| **E2E Testing Guide** | [`.claude/notes/e2e-testing-guide.md`](.claude/notes/e2e-testing-guide.md) — **READ before writing Playwright tests.** Stack, auth model, gotchas, page object patterns, debugging playbook |
| **Schema repo** | [`zerobias-org/schema`](https://github.com/zerobias-org/schema) — YAML schema packages (source of truth for GQL entities) |
| **Post-mortems** | [`.claude/post-mortems/`](.claude/post-mortems/) — failure reports (see [`INDEX.md`](.claude/post-mortems/INDEX.md)). **Read before starting any schema change.** |
| **zb-dx (Developer Experience)** | `~/Projects/zb/zerobias-org/zb-dx` — shared knowledge base for all ZB platform developers. **File friction with `/friction`, browse patterns, find integration guides.** See below. |

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

**READ [`.claude/docs/MODERNIZATION_GUIDE.md`](.claude/docs/MODERNIZATION_GUIDE.md) before writing any component.** `@Input`/`@Output`/constructor injection are banned — use `input()`/`output()`/`inject()`. When modifying a file with old patterns, migrate what you touch.

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

## Key Constraints

- **No Nx** — plain Angular CLI (`ng serve`, `ng build`, `angular.json`)
- **Standalone components** — Angular 21 default, no NgModules
- **`@zerobias-org/ngx-library`** — use its components and theme before building custom
- **`@zerobias-com/zerobias-angular-client`** — wraps `zerobias-client` → `zerobias-sdk` (all SDKs)
- **Generic SQL Hub Module** for Neon DB access (DataProducer interface, no direct Drizzle)
- **Neon VIEWs** for read queries (no JOINs in DataProducer) — writes go to individual tables
- **15 hrs/week cap** — Clark / W3Geekery contractor

## Team

- **Brian** — CEO. Business directives (Tasks & Boundaries requirement). Not a developer.
- **Kevin** — CIO. Platform/Hub infrastructure. Flag platform issues to Kevin.
- **Clark** — W3Geekery contractor. SME Mart frontend.
