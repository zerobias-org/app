# Source Code Paths

## SME Mart (W3Geekery)

| Name | Path | Notes |
|------|------|-------|
| **SME Mart** (this project) | `~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart` | Angular 21 — active |
| **SME Mart Next.js** (deprecated) | `~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart-nextjs-deprecated` | Archived, gitignored, on disk for reference |
| **SME Mart Hub Module** | `~/Projects/w3geekery/zerobias-org-forks/module/package/w3geekery/sme-mart` | Custom Hub Module (may not be needed if Generic SQL suffices) |
| **SME Mart Login** | `~/Projects/w3geekery/zerobias-org-forks/login/package/w3geekery` | Branded login page |
| **SME Mart GQL Schema** | `~/Projects/w3geekery/zerobias-org-forks/schema/package/w3geekery/smemart` | AuditgraphDB schema — **see [SCHEMA_CHANGE_PROCESS.md](SCHEMA_CHANGE_PROCESS.md) before any changes** |

## ZeroBias Platform UI

| Name | Path | Notes |
|------|------|-------|
| **UI Workspace** | `~/Projects/zb/ui` | Angular 21 multi-project workspace — **primary reference** for patterns |
| **Portal App** | `~/Projects/zb/ui/projects/portal` | Main shell app (bootstrap, routing, iframe host) |
| **Catalog App** | `~/Projects/zb/ui/projects/catalog-app` | Good small-app reference for providers/config |
| **neverfail-lib** | `~/Projects/zb/ui/projects/neverfail-lib` | Shared component library (services, components, base classes) |
| **ngx-library** (source) | `~/Projects/zb/zerobias-org/ngx-library` | `@zerobias-org/ngx-library` source — check commit log for changes between versions |
| **Theme** | `~/Projects/zb/ui/projects/theme` | M3 theme SCSS (`$theme`, `$altTheme`, CSS custom props) |
| **Governance App** | `~/Projects/zb/ui/projects/governance-app` | Boundary/task patterns |
| **Boundary Manager** | `~/Projects/zb/ui/projects/boundary-manager-app` | Boundary CRUD patterns |
| **Learning Center** | `~/Projects/zb/ui/projects/learning-center-app` | Content/catalog patterns |

## ZeroBias Client SDKs (`~/Projects/zb/clients/`)

| Name | Path | npm Package |
|------|------|-------------|
| **Angular Client** | `~/Projects/zb/clients/packages/angular-client` | `@zerobias-com/zerobias-angular-client` |
| **Client (framework-agnostic)** | `~/Projects/zb/clients/packages/client` | `@zerobias-com/zerobias-client` |
| **SDK (unified entry-point)** | `~/Projects/zb/clients/packages/sdk` | `@zerobias-com/zerobias-sdk` |
| **MCP Server** | `~/Projects/zb/clients/packages/mcp` | MCP tool definitions for ZeroBias |

### Individual Service SDKs (`~/Projects/zb/clients/packages/sdks/`)

| SDK | Path | Scope |
|-----|------|-------|
| `dana` | `sdks/dana` | Auth, users, orgs, PKV, sessions |
| `platform` | `sdks/platform` | Catalog, tags, boundaries, tasks |
| `portal` | `sdks/portal` | Products, navigation, apps |
| `hub` | `sdks/hub` | Connections, modules, scopes |
| `store` | `sdks/store` | Key-value store |
| `graphql` | `sdks/graphql` | GraphQL queries |
| `cardservice` | `sdks/cardservice` | Card service |
| `fileservice` | `sdks/fileservice` | File uploads/downloads |
| `scim` | `sdks/scim` | SCIM provisioning |
| `dataloader` | `sdks/dataloader` | Data loading |
| `hub-events` | `sdks/hub-events` | Hub event streams |
| `platform-events` | `sdks/platform-events` | Platform event streams |
| `fileservice-events` | `sdks/fileservice-events` | File service event streams |

## Hub Module Documentation (Authoritative)

| Doc | Path | What it covers |
|-----|------|-----------------|
| **HubModules.md** | `~/Projects/zb/zerobias/HubModules.md` | **Primary authoritative doc** — Connector vs Agent modules, TypeScript vs Docker implementations, consumption patterns, deployment API |
| **Modules.md** | `~/Projects/zb/zerobias/Modules.md` | Cross-cutting module concepts (Hub + Platform-Service) |
| **ModuleSDKs.md** | `~/Projects/zb/zerobias/ModuleSDKs.md` | Auto-generated SDKs — consumption patterns, naming (`@auditmation/sdk-<vendor>-<product>`) |
| **ModuleTooling.md** | `~/Projects/zb/zerobias/ModuleTooling.md` | Code-generation toolchain (OpenAPI → TypeScript) |
| **ModuleNaming.md** | `~/Projects/zb/zerobias/ModuleNaming.md` | Naming conventions across NPM, Maven, PyPI, Go registries |
| **ModuleAgents.md** | `~/Projects/zb/zerobias/ModuleAgents.md` | Agent modules (on-node system management, RMM) |
| **PlatformServiceModules.md** | `~/Projects/zb/zerobias/PlatformServiceModules.md` | Platform-service-flavored modules |
| **LocalDevelopment.md** | `~/Projects/zb/zerobias/LocalDevelopment.md` | **Cross-package npm link workflow** — essential before local Hub Module iteration |
| **Hub Architecture** | `~/Projects/zb/hub/Architecture.md` | (reference) Hub-server internals, Node implementation details |

> **Freshness note (2026-04-17):** Meta-repo docs are from initial commit 2026-01-24. Re-verify against source code in `~/Projects/zb/hub/` and `~/Projects/zb/zerobias-org/module/` before committing to implementation decisions — docs may lag code.

## ZeroBias Backend Services

| Name | Path | Notes |
|------|------|-------|
| **Hub** | `~/Projects/zb/hub` | Hub server/node — connector debugging, `ConnectedNode.ts`. See `~/Projects/zb/zerobias/HubModules.md` for authoritative module architecture. |
| **Dana** | `~/Projects/zb/dana` | Auth/identity service |
| **Platform** | `~/Projects/zb/platform` | Catalog, tags, boundaries, tasks backend |
| **Login** | `~/Projects/zb/login` | Login page framework |
| **DevOps** | `~/Projects/zb/devops` | CI/CD, deployment actions |
| **Util** | `~/Projects/zb/util` | Shared utilities |
| **Hydra** | `~/Projects/zb/hydra` | OAuth/OIDC provider |
| **Fileservice** | `~/Projects/zb/fileservice` | File storage service |
| **ZeroBias (main)** | `~/Projects/zb/zerobias` | Core platform |

## SDK Dependency Chain

```
@zerobias-com/zerobias-angular-client  →  Angular 21 DI wrappers
  └── @zerobias-com/zerobias-client    →  RxJS observables + framework-agnostic API
       └── @zerobias-com/zerobias-sdk  →  Unified entry-point (re-exports all service SDKs)
            ├── dana-sdk, hub-sdk, platform-sdk, portal-sdk, store-sdk, ...
            └── @zerobias-org/types-core-js

@zerobias-org/ngx-library              →  UI component library (independent of SDK chain)
```

## Private Registries

| Scope | Registry | Auth Env Var |
|-------|----------|-------------|
| `@zerobias-org/*` | `https://pkg.zerobias.org` | `ZB_TOKEN` |
| `@zerobias-com/*` | `https://npm.pkg.github.com` | `GITHUB_TOKEN` |
| `@auditmation/*` | `https://npm.pkg.github.com` | `GITHUB_TOKEN` |
