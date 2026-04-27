> **⚠ STALENESS WARNING (2026-04-17):** This doc is from the POC-era when SME Mart was Next.js with 16 API routes. Current SME Mart is Angular 21 with Pipeline + GQL + Neon-direct (`dbMode: 'neon'`), and may not need a Hub Module at all.
>
> **Authoritative Hub Module documentation lives at `~/Projects/zb/zerobias/HubModules.md`** (meta-repo). See also `~/Projects/zb/hub/` for hub-server implementation. Treat this doc as "what we thought in early 2026" context, not as current design direction.

# Why SME Mart Needs a Hub Module

## The Core Constraint

ZeroBias deploys apps as **static exports to S3 + CloudFront** — no server runtime. SME Mart's server-side database logic prevents static export, so a Hub Module is needed to host that logic as a managed ZeroBias service.

## The Problem

During the POC (Phases 0–6), SME Mart was built as a full Next.js app with **16 server-side API routes** that talk directly to Neon via Drizzle ORM:

```
Browser → Next.js App (with server routes)
              ↓
         API Routes (/api/providers, /api/profile, /api/admin, etc.)
              ↓
         Neon PostgreSQL
```

This works for local dev but **blocks deployment** because:

- ZeroBias apps must use `output: "export"` (static HTML/JS/CSS)
- Static exports **cannot have server-side API routes**
- Database credentials can't live in browser code

## The Solution

A **Hub Module** is a ZeroBias-managed server-side service. It takes all the server logic out of the Next.js app and runs it as a platform service:

```
Browser (Static App) → Hub SDK Client → Hub Module API (managed) → Neon PostgreSQL
```

## What This Buys Us

### 1. Static Export Becomes Possible

Remove all `/api/` routes, Drizzle deps, and set `output: "export"`. The app becomes pure client-side code deployable to S3 + CloudFront.

### 2. Database Credentials Stay Secure

The Neon connection string is stored as a Hub module secret, configured by an admin. It never touches the browser.

### 3. Authentication Is Inherited

Hub Modules get ZeroBias auth context automatically. Admin checks, user scoping, org context — all validated server-side by the Hub, not by client-side guards.

### 4. Follows Platform Conventions

This is the exact same pattern `data-explorer` uses with the DataProducer Hub Module. It's how ZeroBias apps are designed: static frontend + Hub Module backend.

### 5. Independent Scalability

The Hub Module can be versioned, replicated, and maintained separately from the UI. Future apps could reuse the same marketplace API.

## What Moves Where

| Stays in the App | Moves to Hub Module |
|---|---|
| UI components, pages | All Drizzle schema + queries |
| ZeroBias auth context | All 16 API route handlers |
| Hub SDK client calls | Database connection logic |
| Static assets | Admin authorization checks |

## Why Not Just Keep the API Routes?

1. **Deployment model** — ZeroBias doesn't run Next.js servers. It's S3 + CloudFront. Period.
2. **Security** — Database credentials in a deployed Next.js server would need separate infrastructure. Hub handles this as a managed service.
3. **Multi-tenancy** — Hub Modules plug into ZeroBias's existing module ecosystem (discovery, connection profiles, per-org configuration).

## Related

- **Hub Module Plan**: `.claude/plans/local/007-hub-module-static-export.md`
- **Master Plan**: `.claude/plans/public/000-MASTER-PLAN.md`
- **Hub Module Source**: `~/Projects/w3geekery/zerobias-org/module`
- **Data Explorer (reference)**: `../../zerobias/data-explorer/CLAUDE.md`
