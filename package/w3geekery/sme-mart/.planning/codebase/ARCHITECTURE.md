# Architecture

> Auto-generated codebase map. Source of truth is the code itself.

## Pattern

**Layered Angular 21 SPA** — standalone components, feature-sliced pages, shared services with domain-specific data layers.

No Nx. Plain Angular CLI (`angular.json`). Single project: `sme-mart`.

## Layers

```
┌─────────────────────────────────────────────────┐
│  Pages (feature routes)                         │
│  home, providers, services, rfps, engagements,  │
│  my-profile, my-engagements, org, admin         │
├─────────────────────────────────────────────────┤
│  Shared Components (~55 reusable components)    │
│  + pipes, directives, plugins                   │
├─────────────────────────────────────────────────┤
│  Core Services (domain logic)                   │
│  bids, notes, rfp-wizard, engagements,          │
│  catalog, work-requests, reviews, etc.          │
├─────────────────────────────────────────────────┤
│  Core Data Layer (3 modes)                      │
│  SmeMartDbService  → Neon SQL (dev) / Hub DP    │
│  GraphqlReadService → AuditgraphDB GQL reads    │
│  PipelineWriteService → Receiver pipeline writes│
├─────────────────────────────────────────────────┤
│  Core Mappers                                   │
│  domain model → SmeMartResource (pipeline)      │
├─────────────────────────────────────────────────┤
│  ZeroBias SDK layer                             │
│  zerobias-angular-client, hydra-sdk,            │
│  platform-sdk, graphql-sdk, data-utils          │
└─────────────────────────────────────────────────┘
```

## Data Flow

### Reads (two paths)

1. **Neon direct** (`dbMode: 'neon'`): `SmeMartDbService` → `@neondatabase/serverless` → Neon HTTP API → PostgreSQL
2. **GraphQL** (`GraphqlReadService`): Platform GQL API → AuditgraphDB → schema-generated types

### Writes (pipeline)

`PipelineWriteService` → `platform.Pipeline.receive` → AuditgraphDB ingestion → eventual GQL availability

### Auth flow

`AppInitService.init()` → `ZerobiasClientApp.init()` → session check / redirect → org selection → `SmeMartDbService.connect()` (non-blocking)

## Key Abstractions

### `SmeMartDbService` (`src/app/core/services/sme-mart-db.service.ts`)
Central DB access. Dual-mode: Hub DataProducer (production) or Neon HTTP (dev). All domain services consume this — mode is transparent.

### `GraphqlReadService` (`src/app/core/services/graphql-read.service.ts`)
Reads from AuditgraphDB via platform GraphQL. Boundary-scoped. Supports filtering (RFC4515-style), pagination, sorting.

### `PipelineWriteService` (`src/app/core/services/pipeline-write.service.ts`)
Writes to AuditgraphDB via Receiver Pipeline. Maps class names to class IDs. Uses `SimpleBatch` for bulk upsert.

### Resource Mappers (`src/app/core/mappers/`)
Pure functions: `domainModel → SmeMartResource`. One mapper per entity type. Used by pipeline writes and resource tagging.

### `AppInitService` (`src/app/core/app-init.service.ts`)
APP_INITIALIZER: i18n → ZB auth → DB connect. Blocks rendering until auth resolves.

## Entry Points

| Entry | File |
|-------|------|
| Bootstrap | `src/main.ts` |
| App config | `src/app/app.config.ts` |
| Routes | `src/app/app.routes.ts` |
| Shell layout | `src/app/layout/app-shell.component.ts` |
| Init service | `src/app/core/app-init.service.ts` |
| Styles | `src/styles.scss` (imports ngx-library theme) |

## Routing

Top-level routes in `app.routes.ts`, all under `AppShell`:

| Route | Component | Notes |
|-------|-----------|-------|
| `/` | `Home` | Dashboard |
| `/providers` | `ProviderList` | Browse SMEs |
| `/providers/:id` | `ProviderDetail` | |
| `/services` | `ServiceCatalog` | Browse offerings |
| `/rfps` | `RfpList` | Work requests list |
| `/rfps/new` | `RfpWizard` | Create RFP |
| `/rfps/:id` | `RfpDetail` | |
| `/rfps/:id/bid` | `BidWizard` | Submit bid |
| `/rfps/:id/compare` | `BidComparisonPage` | |
| `/engagements/:id` | `EngagementDetail` | Tab sub-routes |
| `/org` | Lazy: `org.routes` | Org admin pages |
| `/my/engagements` | Lazy: `my-engagements.routes` | Provider's engagements |
| `/my-profile` | Lazy: `my-profile.routes` | User profile tabs |
| `/admin` | Lazy: `admin.routes` | Admin pages |

## Environment Configuration

| File | Purpose |
|------|---------|
| `environment.ts` | Default dev (UAT target) |
| `environment.prod.ts` | Production |
| `environment.vercel.ts` | Vercel deployment |
| `environment.neon.ts` | Neon-only mode |

Key env flags: `dbMode` ('hub' | 'neon'), `smeMartConnectionId`, `neonConnectionString`, `isLocalDev`.
