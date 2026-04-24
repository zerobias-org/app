> **⚠ STALENESS WARNING (2026-04-17):** Dated 2026-02-02. Current SME Mart uses Pipeline + GQL + Neon-direct and may not need any Hub Module locally. The "publishing path not currently working" claim is stale — verify current state before making decisions.
>
> **Authoritative Hub Module docs:** `~/Projects/zb/zerobias/HubModules.md` (meta-repo). The generic-sql module is covered there as `@auditmation/module-generic-sql` in the Connector Modules section.
>
> **For the actual step-by-step setup on UAT (deployment + secret + connection via ZB MCP):** see [`HUB_CONNECTION_SETUP_NEON.md`](./HUB_CONNECTION_SETUP_NEON.md) (2026-04-22).

# Generic SQL Hub Module — Can We Use It?

**Package:** `@auditlogic/module-auditmation-generic-sql-client-ts` (v0.5.0)
**Registry:** `https://pkg.zerobias.org`
**Updated:** 2026-02-02

---

## What Is It?

A generic SQL Hub Module that implements the same **DataProducer interface** used by `data-explorer`. It exposes any SQL database as a browsable object tree with collections, functions, schemas, etc. — the same way data-explorer browses databases.

## API Surface

| API | Operations |
|-----|-----------|
| **ObjectsApi** | `getRootObject`, `getObject`, `getChildren`, `objectSearch`, `createChildObject`, `updateObject`, `deleteObject` |
| **CollectionsApi** | `getCollectionElements`, `searchCollectionElements`, `addCollectionElement`, `updateCollectionElement`, `deleteCollectionElement`, `executeBulkOperations` |
| **FunctionsApi** | `invokeFunction`, `executeRestRequest`, `validateFunctionInput` |
| **SchemasApi** | `getSchema` |
| **DocumentsApi** | `getDocumentData`, `updateDocumentData` |
| **BinaryApi** | `downloadBinary`, `uploadBinaryContent` |
| **SystemApi** | `healthCheck` |
| **ConnectionApi** | `connect`, `disconnect`, `getConnectionMetadata` |

## Connection Profile

```yaml
type: object
properties:
  url:
    type: string
    format: url
  apiKey:
    type: string
    format: password
  orgId:
    type: string
    format: uuid
  jwt:
    type: string
    format: password
```

## Verdict: Not a Replacement, But Potentially Useful

### What It Gives You

- Raw CRUD on table rows via `CollectionsApi` (paginate, filter, add, update, delete)
- Browse the database schema tree via `ObjectsApi`
- Run stored procedures via `FunctionsApi.invokeFunction()`
- Already published, maintained, and integrated with Hub infrastructure

### What It Doesn't Give You

- **No domain-specific endpoints** — No `listProviders(category, availability)`, no `submitProposal()`, no `getProviderWithSkillsAndReviews()`
- **No business logic** — No rating recalculation on review, no proposal status workflows, no admin authorization
- **No aggregated queries** — No "get provider with skills, services, and average rating" in one call
- **No authorization layer** — Raw database access; anyone with a connection could read/write any row

## Possible Uses

### Option A: Admin/Debugging Tool

Connect generic-sql to the SME Mart Neon DB for data inspection, the same way data-explorer works. Useful for ops and troubleshooting without building custom admin queries.

### Option B: PostgreSQL Functions + `invokeFunction`

Write stored procedures in Neon that implement marketplace business logic (e.g., `get_provider_detail(id)`, `submit_proposal(...)`) and call them through `FunctionsApi.invokeFunction()`. This avoids building a custom Hub Module but pushes all logic into PL/pgSQL.

**Tradeoff:** Eliminates custom Hub Module scaffolding at the cost of business logic in SQL instead of TypeScript.

### Option C: Alongside Custom Hub Module

Build the custom Hub Module for the proper marketplace API, but use generic-sql alongside it for ad-hoc data access and admin tooling.

## Current Status (2026-02-02)

The publishing path for our custom W3Geekery Hub Module is **not currently working** for Dev/QA/Prod environments. Until that's resolved, we're proceeding with local development using Next.js API routes, keeping track of what will need to migrate to the Hub Module later.

Generic-sql remains a consideration for Option A (admin tooling) or Option B (stored procedures) once the Hub publishing pipeline is sorted out.

## Related

- **Why Hub Module?**: `.claude/docs/WHY_HUB_MODULE.md`
- **Hub Module Plan**: `.claude/plans/local/007-hub-module-static-export.md`
- **Master Plan**: `.claude/plans/public/000-MASTER-PLAN.md`
