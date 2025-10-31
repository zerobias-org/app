# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a monorepo containing example applications demonstrating the Zerobias Client API integration. The repository houses two separate example applications (NextJS and Angular) that showcase how to integrate with the Zerobias platform for authentication, product catalog access, and external service connections (e.g., GitHub).

## Project Structure

```
package/zerobias/
├── example-nextjs/     # Next.js 15 demo application
└── example-angular/    # Angular 17 demo with Nx
```

## Common Development Commands

### NextJS Example App
Navigate to: `package/zerobias/example-nextjs/`

- **Development**: `npm run dev` - Starts dev server with default config
- **Build for dev**: `npm run build:dev` - Copies dev config and builds
- **Build for qa**: `npm run build:qa` - Copies QA config and builds
- **Build for prod**: `npm run build:prod` - Copies prod config and builds
- **Production start**: `npm start` - Starts production server
- **Lint**: `npm run lint` - Runs ESLint

### Angular Example App
Navigate to: `package/zerobias/example-angular/`

- **Development**: `npm start` - Starts dev server via Nx
- **Build**: `npm run build` - Builds for production with custom base-href
- **Test**: `npm test` - Runs tests via Nx

## Architecture

### NextJS Application Architecture

The NextJS app uses App Router (Next.js 15) with the following patterns:

**Client Libraries:**
- `@auditmation/zb-client-lib-js` - Core Zerobias client library for authentication and API access
- `@auditlogic/module-github-github-client-ts` - GitHub integration module

**State Management:**
- `CurrentUserContext` (`context/CurrentUserContext.tsx`) wraps the entire application
- Provides global access to: `user`, `org`, `loading`, `action`, `setOrg`, `setAction`
- Uses singleton pattern via `ZerobiasAppService` (`lib/zerobias.ts`)

**Service Initialization:**
- `ZerobiasAppService.getInstance()` returns singleton instance
- Initializes three core services:
  - `ZerobiasClientOrgId` - Manages organization context
  - `ZerobiasClientApi` - API client with environment config
  - `ZerobiasClientApp` - Main application service with authentication
- Supports custom axios interceptors for local development (API key injection)

**Environment Configuration:**
- Multiple `next.config.*.ts` files for different environments (dev, qa, prod)
- Build scripts copy the appropriate config to `next.config.ts` before building
- Static export mode with custom `basePath: "/example-nextjs"`
- Environment variables: `NEXT_PUBLIC_API_HOSTNAME`, `NEXT_PUBLIC_IS_LOCAL_DEV`, `NEXT_PUBLIC_API_KEY` (local dev only)

**Application Structure:**
- `/app/page.tsx` - Main demo landing page
- `/app/module-demo/` - GitHub module integration demo
- `/app/products-demo/` - Product catalog demo
- `/app/pkv-demo/` - Principal Key-Value storage demo
- `/components/forms/` - Reusable form components
- `/components/ui/` - UI components
- `/components/demos/` - Demo-specific components

### Angular Application Architecture

The Angular app uses a single-component architecture with extensive reactive patterns:

**Client Libraries:**
- `@auditmation/ngx-zb-client-lib` - Angular-specific Zerobias client library
- Provides injectable services: `ZerobiasClientAppService`, `ZerobiasClientApiService`, `ZerobiasClientOrgIdService`

**Initialization:**
- `APP_INITIALIZER` in `app.module.ts` bootstraps `ZerobiasClientAppService.init()`
- Must complete before application starts

**State Management:**
- Heavy use of RxJS observables and `combineLatest` for reactive data flow
- `app.component.ts` manages all state (594 lines) - single component handles entire demo
- Subscriptions managed via single `Subscription` object, cleaned up in `ngOnDestroy`

**Key Observables:**
- `getOrgs()` - List of organizations
- `getWhoAmI()` - Current user
- `getCurrentOrg()` - Currently selected organization
- Changes cascade through form controls to trigger related data fetches

**API Access Pattern:**
- Access client APIs via injected services:
  - `clientApi.portalClient.getProductApi()` - Product catalog
  - `clientApi.hubClient.getConnectionApi()` - External connections
  - `clientApi.hubClient.getScopeApi()` - Connection scopes
  - `clientApi.danaClient.getPkvApi()` - Key-value storage
  - `clientApi.danaClient.getMeApi()` - User operations (API keys, session keys)

**Build Configuration:**
- Uses Nx build system
- Builds with `--base-href /example-angular/` for proper deployment path
- Node.js >= 18.19.1, npm >= 10.2.4 required

## Key Integration Patterns

### Zerobias Platform Connection Flow

Both applications follow this pattern for connecting to external services:

1. **Authenticate user** - Get current user and org via `getWhoAmI()` and `getCurrentOrg()`
2. **Select product** - Query product catalog (e.g., GitHub product via `packageCode: 'github.github'`)
3. **Find modules** - Search for modules that use the selected product
4. **List connections** - Find connections that implement those modules
5. **Get scopes** - Retrieve scopes for the selected connection (connection-level or scope-level targeting)
6. **Initialize module client** - Connect external service client (e.g., `newGithub()`) with hub connection profile
7. **Use external APIs** - Call methods on the connected client (e.g., `listMyOrganizations()`, `listRepositories()`)

### Environment-Specific Configuration

**NextJS:**
- Environment variables control API hostname and local dev behavior
- Build scripts swap config files for different deployment targets
- Local development uses API key authentication via request interceptor

**Angular:**
- Environment files in `src/environments/` (dev vs prod)
- `isLocalDev` flag controls development-specific behavior
- Dependency injection provides environment config via `'environment'` token

## Development Workflow

### Working with the NextJS App

1. Navigate to `package/zerobias/example-nextjs/`
2. Install dependencies: `npm install`
3. Set environment variables (for local dev, create `.env.local`):
   ```
   NEXT_PUBLIC_API_HOSTNAME=your-api-host
   NEXT_PUBLIC_IS_LOCAL_DEV=true
   NEXT_PUBLIC_API_KEY=your-api-key
   ```
4. Run dev server: `npm run dev`
5. Build for specific environment: `npm run build:dev|qa|prod`

### Working with the Angular App

1. Navigate to `package/zerobias/example-angular/`
2. Install dependencies: `npm install`
3. Run dev server: `npm start` (uses Nx)
4. Tests: `npm test`
5. Production build: `npm run build`

## TypeScript and Dependencies

Both apps use TypeScript with strict typing from the Zerobias client libraries. The libraries provide comprehensive type definitions for all API responses, including:

- `User`, `Org`, `ServiceAccount` from `@auditmation/module-auditmation-auditmation-dana`
- `ProductExtended`, `ProductWithObjectCount` from portal/platform modules
- `ConnectionListView`, `ScopeListView` from hub module
- `PagedResults<T>`, `Duration` from `@auditmation/types-core-js`
- Module-specific types (e.g., GitHub's `Organization`, `Repository`)

## Important Notes

- Both apps use static export mode for deployment (NextJS uses `output: "export"`)
- Custom base paths are configured for sub-directory deployment
- The NextJS app disables React strict mode
- The Angular app uses Nx workspace for build tooling
- Session management and authentication are handled entirely by the Zerobias platform
- Local development requires API key configuration for backend access
