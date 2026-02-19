# Source Code Paths

## SME Mart (W3Geekery)

| Name | Path | Notes |
|------|------|-------|
| **SME Mart Angular** (this project) | `~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart-angular` | Angular 21 rebuild |
| **SME Mart Next.js** (prototype) | `~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart` | Migration source — full feature reference |
| **SME Mart Hub Module** | `~/Projects/w3geekery/zerobias-org-forks/module/package/w3geekery/sme-mart` | Custom Hub Module (may not be needed if Generic SQL suffices) |
| **SME Mart Login** | `~/Projects/w3geekery/zerobias-org-forks/login/package/w3geekery` | Branded login page |

## ZeroBias Platform UI

| Name | Path | Notes |
|------|------|-------|
| **UI Workspace** | `~/Projects/zb/ui` | Angular 21 multi-project workspace — **primary reference** for patterns |
| **Portal App** | `~/Projects/zb/ui/projects/portal` | Main shell app (bootstrap, routing, iframe host) |
| **Catalog App** | `~/Projects/zb/ui/projects/catalog-app` | Good small-app reference for providers/config |
| **neverfail-lib** | `~/Projects/zb/ui/projects/neverfail-lib` | Shared component library (services, components, base classes) |
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

## ZeroBias Backend Services

| Name | Path | Notes |
|------|------|-------|
| **Hub** | `~/Projects/zb/hub` | Hub server/node — connector debugging, `ConnectedNode.ts` |
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
