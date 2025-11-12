# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Note**: For getting started, deployment workflows, and user-facing documentation, see `README.md` first. This file provides supplemental architectural guidance and AI-assistant context.

## Repository Overview

This is the **ZeroBias Community Apps Monorepo** - a platform for creating custom UIs that leverage the ZeroBias platform for authentication, hosting, and access to community-generated modules and content.

### Purpose

This repository enables developers to:
- **Create custom UIs** without implementing authentication or hosting infrastructure
- **Leverage ZeroBias SDKs** and community-generated module SDKs
- **Deploy automatically** via pull request workflow to hosted ZeroBias infrastructure
- **Access platform capabilities** including connections, modules, schemas, queries, and more
- **Skip integration complexity** - focus on UI/UX and business logic

### Repository Type

- **Public/Open Source**: Community applications hosted at `https://app.zerobias.com/{basePath}`
- **Private Forks**: For custom/closed-source applications (same patterns, private hosting)

### Current Applications

- **data-explorer**: Production-ready database explorer using the DataProducer interface (reference implementation)
- **example-nextjs**: NextJS demo showing platform integration patterns (flawed but functional examples)
- **example-angular**: Angular demo with Nx build system (framework alternative example)

## Project Structure

```
package/zerobias/
├── data-explorer/      # Production database explorer (Next.js 15) - REFERENCE IMPLEMENTATION
├── example-nextjs/     # Next.js 15 integration demo - FLAWED BUT FUNCTIONAL EXAMPLES
├── example-angular/    # Angular 17 demo with Nx - FRAMEWORK ALTERNATIVE
└── {your-app}/         # Your custom application
```

## Creating a New Application

**See `CREATING_AN_APP.md` for complete step-by-step guide.**

### Quick Start

1. Fork this repository
2. Create directory: `package/zerobias/your-app-name/`
3. Choose unique `basePath` (becomes `https://app.zerobias.com/{basePath}`)
4. Copy from `data-explorer` (recommended) or `example-nextjs`
5. Update `package.json` and `next.config.*.ts` files
6. Implement `ZerobiasAppService.init()` for authentication
7. Build your UI
8. Submit PR to `dev`/`qa`/`main` branch
9. Merge triggers automatic deployment

### Deployment Model

**Pull Request Workflow:**
- **Fork** → **Create App** → **Submit PR** → **Review** → **Merge** → **Auto-Deploy**

**Branch → Environment Mapping:**
- `dev` branch → `https://dev.zerobias.com/{basePath}`
- `qa` branch → `https://qa.zerobias.com/{basePath}`
- `main/master` branch → `https://app.zerobias.com/{basePath}`

**basePath Requirements:**
- Must be globally unique across all ZeroBias apps
- Should match directory name (recommended, not required)
- PR review process identifies and resolves conflicts
- Lowercase, hyphens preferred (e.g., `my-app`, `data-explorer`)

## ZeroBias Platform Integration

### Module Ecosystem

The ZeroBias platform provides access to:

**ZeroBias Core Modules** (`~/code/module`):
- Published to **public NPM**
- Examples: DataProducer interface, GitHub integration
- No authentication required for installation

**Community Modules** (`~/zb-org/module`):
- Published to **private NPM** (requires API key)
- See `~/zb-org/module/README.md` for authentication setup
- Discovered via **ZeroBias Catalog** application

**Module Discovery:**
- Use ZeroBias platform UI → Catalog application
- Browse modules, schemas, queries, collector bots, alert bots, etc.
- View documentation, examples, and compatibility info

### Authentication Flow

**Required Pattern** (all apps must implement):

```typescript
// Singleton service for platform client lifecycle
const zerobiasService = await ZerobiasAppService.getInstance();
// init() checks session, redirects to /login if needed
```

**How it Works:**
1. App calls `ZerobiasAppService.getInstance()`
2. Service calls `init()` which checks for valid session
3. If no session: Redirects to `/login` path
4. Platform shows login screen (default or custom via virtual hosting)
5. User authenticates
6. Platform redirects back to app
7. App continues with authenticated session

**Session Management:**
- Handled transparently by ZeroBias client libraries
- Organization-based policies control session parameters
- Session limits and inactivity timers applied automatically
- No manual refresh/renewal logic needed

**Alternative: Custom Login Screens**
- Repository: `https://github.com/zerobias-org/login`
- Location: `~/zb-org/login`
- Combined with virtual hosting for white-label login
- Still uses same authentication flow

**API-Only / Headless Apps:**
- Must acquire API tokens for authentication
- See platform documentation for token generation
- Used for backend services, CLIs, automation

## Common Development Commands

### Data Explorer App
Navigate to: `package/zerobias/data-explorer/`

- **Development**: `npm run dev` - Starts dev server with default config
- **Build for dev**: `npm run build:dev` - Copies dev config and builds
- **Build for qa**: `npm run build:qa` - Copies QA config and builds
- **Build for prod**: `npm run build:prod` - Copies prod config and builds
- **Production start**: `npm start` - Starts production server
- **Lint**: `npm run lint` - Runs ESLint

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

## Application Architectures

This section provides high-level overviews of each application. For detailed architecture, patterns, and development guidance, see the package-specific CLAUDE.md files.

### Data Explorer

**Purpose**: Production-ready reference implementation showcasing clean architecture patterns for ZeroBias platform applications.

**Key Features:**
- Database exploration using DataProducer interface
- Split-pane UI with resizable panels
- RFC4515 filter builder for queries
- Schema inspection and ERD generation
- Function invocation

**Architecture Highlights:**
- Clean separation: Singleton for globals, React state for instances
- Direct API calls from contexts (no unnecessary wrappers)
- Modern UI/UX with professional design
- Comprehensive error handling and loading states

**For detailed documentation:** See `package/zerobias/data-explorer/CLAUDE.md`

### NextJS Example Application

**Purpose**: Educational demo showcasing various ZeroBias platform integration patterns.

**Key Features:**
- Product catalog browsing
- Module discovery
- External service connections (GitHub)
- Key-value storage demo

**Architecture Notes:**
- App Router (Next.js 15) with singleton service pattern
- **FLAWED BUT FUNCTIONAL** - Contains anti-patterns, not for production use
- Useful for understanding platform capabilities

**For detailed documentation:** See `package/zerobias/example-nextjs/CLAUDE.md`

### Angular Example Application

**Purpose**: Framework alternative demonstrating Angular integration with ZeroBias platform.

**Key Features:**
- RxJS-based reactive patterns
- Angular dependency injection
- Similar demo scenarios as NextJS example

**Architecture Notes:**
- Single-component architecture with extensive observables
- Nx build system
- **EXAMPLE ONLY** - Educational purposes

**For detailed documentation:** See `package/zerobias/example-angular/CLAUDE.md` (if present)

## Key Integration Patterns

### DataProducer Interface Pattern (data-explorer)

The DataProducer interface provides a generic object-oriented view of data sources:

1. **Discover connections** - Find connections implementing DataProducer via product/module association
2. **Handle scoping** - Detect single-scope vs multi-scope connections
3. **Initialize client** - Create DataProducer client with Hub connection profile
4. **Browse hierarchy** - Navigate object tree (root → containers → collections/functions)
5. **Access data** - Query collections with filters, invoke functions, view schemas
6. **Generate diagrams** - Create ERDs from schema metadata

**Key APIs:**
- `getObjectsApi().getObject(id)` - Get object metadata
- `getObjectsApi().getRootChildObjects(page, pageSize)` - Browse root level
- `getObjectsApi().getChildObjects(parentId, page, pageSize)` - Browse children
- `getCollectionsApi().getCollectionElements(id, page, pageSize, filters)` - Query data with RFC4515 filters
- `getSchemasApi().getSchema(id)` - Get collection schema
- `getFunctionsApi().invoke(id, input)` - Execute functions
- `getDiagramApi().getERD(id)` - Get entity relationship diagrams (if supported)

### Zerobias Platform Connection Flow (example apps)

Both example applications follow this pattern for connecting to external services:

1. **Authenticate user** - Get current user and org via `getWhoAmI()` and `getCurrentOrg()`
2. **Select product** - Query product catalog (e.g., GitHub product via `packageCode: 'github.github'`)
3. **Find modules** - Search for modules that use the selected product
4. **List connections** - Find connections that implement those modules
5. **Get scopes** - Retrieve scopes for the selected connection (connection-level or scope-level targeting)
6. **Initialize module client** - Connect external service client (e.g., `newGithub()`) with hub connection profile
7. **Use external APIs** - Call methods on the connected client (e.g., `listMyOrganizations()`, `listRepositories()`)

### Environment-Specific Configuration

**All NextJS Apps:**
- Environment variables control API hostname and local dev behavior
- Build scripts swap config files for different deployment targets
- Local development uses API key authentication via request interceptor

**Angular:**
- Environment files in `src/environments/` (dev vs prod)
- `isLocalDev` flag controls development-specific behavior
- Dependency injection provides environment config via `'environment'` token

## Development Workflow

### Working with Data Explorer

1. Navigate to `package/zerobias/data-explorer/`
2. Install dependencies: `npm install`
3. Set environment variables (for local dev, create `.env.local`):
   ```
   NEXT_PUBLIC_API_HOSTNAME=your-api-host
   NEXT_PUBLIC_IS_LOCAL_DEV=true
   NEXT_PUBLIC_API_KEY=your-api-key
   ```
4. Run dev server: `npm run dev`
5. Access at `http://localhost:3000`
6. Build for specific environment: `npm run build:dev|qa|prod`

### Working with the NextJS Example App

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

All apps use TypeScript with strict typing from the Zerobias client libraries. The libraries provide comprehensive type definitions for all API responses, including:

**Common Types:**
- `User`, `Org`, `ServiceAccount` from `@auditmation/module-auditmation-auditmation-dana`
- `ProductExtended`, `ProductWithObjectCount` from portal/platform modules
- `ConnectionListView`, `ScopeListView` from hub module
- `PagedResults<T>`, `Duration` from `@auditmation/types-core-js`

**DataProducer Types:**
- `DataproducerObject` - Generic object with metadata, classification, schemas
- `CollectionElement` - Data row from collection queries
- `ObjectClass` - Enum: container, collection, function, document, binary
- Schema types for collections, functions, documents

**Module Types:**
- Module-specific types (e.g., GitHub's `Organization`, `Repository`)

## Important Notes

- All apps use static export mode for deployment (NextJS uses `output: "export"`)
- Custom base paths are configured for sub-directory deployment
- NextJS apps disable React strict mode
- The Angular app uses Nx workspace for build tooling
- Session management and authentication are handled entirely by the Zerobias platform
- Local development requires API key configuration for backend access

## Architecture Best Practices (Learned from data-explorer refactor)

**✅ DO:**
- Use singleton pattern for global Zerobias client lifecycle (`ZerobiasAppService`)
- Manage per-connection clients (like DataProducer) directly in React state/context
- Call API clients directly from components/contexts - avoid unnecessary wrapper services
- Use TypeScript strict mode and leverage provided type definitions
- Implement proper error boundaries and loading states
- Use modern UI libraries (`react-resizable-panels`, etc.) for better UX

**❌ DON'T:**
- Create wrapper services around per-instance clients (keep them in React state)
- Mix architectural patterns between singleton and per-instance clients
- Ignore TypeScript errors or use `any` types unnecessarily
- Copy UI patterns from example apps into production apps without design consideration
- Create unnecessary abstraction layers that obscure direct API usage

## Project-Specific Documentation

For detailed project-specific guidance, see:
- `package/zerobias/data-explorer/CLAUDE.md` - Data Explorer architecture and development
- `package/zerobias/example-nextjs/CLAUDE.md` - NextJS example patterns and suggested improvements
- `package/zerobias/example-angular/CLAUDE.md` - Angular example patterns (if created)
