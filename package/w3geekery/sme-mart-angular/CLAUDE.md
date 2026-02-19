# CLAUDE.md - SME Mart Angular

> **On Startup:** Read `.claude/plans/public/PLAN.md` — source of truth for architecture, phases, and decisions.

## Purpose

SME Mart is a **marketplace for Subject Matter Experts** in compliance/cybersecurity — "Upwork meets Whop" for ZeroBias platform users. This is the **Angular 21 rebuild** of the Next.js prototype.

## Quick Reference

| What | Where |
|------|-------|
| **Architecture & Plan** | [`.claude/plans/public/PLAN.md`](.claude/plans/public/PLAN.md) |
| **Source Paths (SDKs, repos)** | [`.claude/docs/SOURCE_PATHS.md`](.claude/docs/SOURCE_PATHS.md) |
| **Angular 21 Docs** | [`AGENTS.md`](AGENTS.md) — local docs index in `.angular-docs/` (refresh: `npx angular-agents-md`) |
| **Next.js prototype** (migration source) | `../sme-mart/` |
| **ZeroBias UI** (Angular 21 reference) | `~/Projects/zb/ui` |
| **SDK source** | `~/Projects/zb/clients/packages/` |

## Skills

- **`/angular-architect`** — invoke the global skill for general Angular 21 architecture questions
- **`sme-mart-angular-architect`** — project-level skill (`.claude/skills/`) with SME Mart-specific patterns: ngx-library, DataProducer, standalone components, no Nx. Invoke for implementation work.

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
