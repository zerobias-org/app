# CLAUDE.md - SME Mart

> **On Startup:** Read `.claude/plans/public/PLAN.md` — source of truth for architecture, phases, and decisions.

> **⚠️ UAT Migration In Progress:** CI/dev is being rebuilt with hydra. UAT is our temporary dev environment. See [`.claude/notes/uat-migration-tracker.md`](.claude/notes/uat-migration-tracker.md) for checklist and ID mapping. `npm run dev` now targets UAT.

## Purpose

SME Mart is a **marketplace for Subject Matter Experts** in compliance/cybersecurity — "Upwork meets Whop" for ZeroBias platform users. Built with **Angular 21**.

## Quick Reference

| What | Where |
|------|-------|
| **⚠️ UAT Migration Tracker** | [`.claude/notes/uat-migration-tracker.md`](.claude/notes/uat-migration-tracker.md) — CI→UAT ID mapping, checklist, config updates |
| **Architecture & Plan** | [`.claude/plans/public/PLAN.md`](.claude/plans/public/PLAN.md) |
| **Source Paths (SDKs, repos)** | [`.claude/docs/SOURCE_PATHS.md`](.claude/docs/SOURCE_PATHS.md) |
| **Angular 21 Docs** | [`AGENTS.md`](AGENTS.md) — local docs index in `.angular-docs/` (refresh: `npx angular-agents-md`) |
| **Next.js prototype** (archived) | `../sme-mart-nextjs-deprecated/` |
| **ZeroBias UI** (Angular 21 reference) | `~/Projects/zb/ui` |
| **SDK source** | `~/Projects/zb/clients/packages/` |
| **Neon DB reference** | [`.claude/notes/neon-mcp-reference.md`](.claude/notes/neon-mcp-reference.md) — project ID, tables, common SQL queries |
| **Demo data guide** | [`.claude/notes/demo-data-guide.md`](.claude/notes/demo-data-guide.md) — buyers, providers, engagements, ZB Tasks, demo scenarios |
| **GQL Schema Extension (howto)** | [`.claude/notes/zb-graphql-custom-schema-howto.md`](.claude/notes/zb-graphql-custom-schema-howto.md) — customer-facing guide: YAML schema packages, querying, filtering |
| **GQL Schema Extension (internals)** | [`.claude/notes/zb-graphql-schema-extension-guide.md`](.claude/notes/zb-graphql-schema-extension-guide.md) — platform internals: SchemaBuilder, catalog tables, source files |
| **SME Mart Resource Types** | [`.claude/notes/sme-mart-resource-types-summary.md`](.claude/notes/sme-mart-resource-types-summary.md) — resource type inventory shared with Kevin |
| **File Upload SDK** | [`.claude/notes/zb-file-upload-sdk-reference.md`](.claude/notes/zb-file-upload-sdk-reference.md) — FileService SDK, upload workflow, task attachments, preview, ZB UI reference |
| **Schema repo** | [`zerobias-org/schema`](https://github.com/zerobias-org/schema) — YAML schema packages (source of truth for GQL entities) |

## Skills

- **`/angular-architect`** — invoke the global skill for general Angular 21 architecture questions
- **`sme-mart-architect`** — project-level skill (`.claude/skills/`) with SME Mart-specific patterns: ngx-library, DataProducer, standalone components, no Nx. Invoke for implementation work.

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
