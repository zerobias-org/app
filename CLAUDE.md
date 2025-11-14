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
- **example-nextjs**: NextJS demo showing platform integration patterns (educational examples)
- **example-angular**: Angular demo with Nx build system (framework alternative example)

## Project Structure

```
package/zerobias/
├── data-explorer/      # Production database explorer (Next.js 15) - REFERENCE IMPLEMENTATION
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components
│   ├── context/       # React contexts
│   ├── lib/           # Utility libraries
│   └── next.config.*.ts  # Environment configs
├── example-nextjs/     # Next.js 15 integration demo - EDUCATIONAL EXAMPLES
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   └── next.config.*.ts  # Environment configs
├── example-angular/    # Angular 17 demo with Nx - FRAMEWORK ALTERNATIVE
│   ├── src/app/       # Angular app components
│   ├── src/environments/  # Environment configs
│   └── package.json
└── {your-app}/         # Your custom application
```

## Creating a New Application

**See `CREATING_AN_APP.md` for complete step-by-step guide.**

### Quick Start

1. Fork this repository
2. Create directory: `package/zerobias/your-app-name/`
3. Choose unique `basePath` (becomes `https://app.zerobias.com/{basePath}`)
4. Copy from `data-explorer` (recommended) or `example-nextjs`/`example-angular`
5. Update `package.json` and configuration files
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

**Alternative: Manual Deployment to S3/CloudFront**

See "Manual Deployment" section below for S3/CloudFront deployment instructions.

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

**Authentication Modes:**

**1. Session Inheritance (Iframe Mode):**
```typescript
// App runs in iframe, inherits session from parent portal
const app = new ZerobiasClientApp(api, orgIdService, environment);
await app.init(); // No custom auth needed

// Session managed by parent portal
const whoAmI = await app.whoAmI();
```

**2. Direct Authentication (Standalone Mode):**
```typescript
// App runs standalone, needs API key authentication
await app.init(
  (req) => {
    // Add API key for authenticated requests
    if (process.env.API_KEY) {
      req.headers["Authorization"] = `APIKey ${process.env.API_KEY}`;
    }
    return req;
  }
);
```

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
- **Lint**: `npx nx lint`

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

**Technology Stack:**
- Next.js 15 with App Router
- React 19 with TypeScript
- `react-resizable-panels`, `react-tabs`, Mermaid.js
- `@auditmation/zb-client-lib-js` - Core ZeroBias client
- `@auditlogic/module-auditmation-interface-dataproducer-client-ts` - DataProducer client

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
- **EDUCATIONAL EXAMPLES** - Demonstrates various integration patterns
- Useful for understanding platform capabilities

**Technology Stack:**
- Next.js 15.3.2 with React 19
- `@auditmation/zb-client-lib-js` - ZeroBias vanilla client
- `@auditlogic/module-github-github-client-ts` - GitHub module client
- TypeScript 5.x with strict mode

**For detailed documentation:** See `package/zerobias/example-nextjs/CLAUDE.md`

### Angular Example Application

**Purpose**: Framework alternative demonstrating Angular integration with ZeroBias platform.

**Key Features:**
- RxJS-based reactive patterns
- Angular dependency injection
- Similar demo scenarios as NextJS example
- Angular Material UI components

**Architecture Notes:**
- Single-component architecture with extensive observables
- Nx build system
- **EXAMPLE ONLY** - Educational purposes

**Technology Stack:**
- Angular 17.1.3 with Angular Material
- `@auditmation/ngx-zb-client-lib` - Angular-specific client
- RxJS 6.6.7 for reactive programming
- Nx 20.6.1 for build optimization

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

**API Integration Examples:**

```typescript
// Search for products in catalog
const products = await api.portalClient()
  .getProductApi()
  .search({ name: 'GitHub' }, page, pageSize);

// Get Hub connections
const connections = await api.hubClient()
  .getConnectionApi()
  .search({ products: [productId] }, page, pageSize);

// Create resource
const resource = await api.auditmationPlatform()
  .getResourceApi()
  .create({ name: 'My Resource', type: 'custom' });
```

**Hub Module Client Initialization (CRITICAL PATTERN):**

All Hub module clients (DataProducer, GitHub, etc.) require proper authentication setup:

```typescript
import { getZerobiasClientUrl } from '@auditmation/zb-client-lib-js';
import { newGithub } from '@auditlogic/module-github-github-client-ts';

// Get ZerobiasAppService instance
const zerobiasService = await ZerobiasAppService.getInstance();

// Build Hub URL using getZerobiasClientUrl (uses browser location for same-origin)
const hubUrl = getZerobiasClientUrl('hub', true, zerobiasService.environment.isLocalDev);

// Create Hub connection profile with authentication
const hubConnectionProfile = {
  server: hubUrl,
  targetId: zerobiasService.zerobiasClientApi.toUUID(scopeId),  // scope or connection ID
  apiKey: process.env.NEXT_PUBLIC_API_KEY,  // For local dev authentication
  orgId: zerobiasService.zerobiasClientApi.toUUID(org.id)  // For multi-tenancy
};

// Create and connect module client
const githubClient = newGithub();
await githubClient.connect(hubConnectionProfile);

// Use the connected client
const orgs = await githubClient.getOrganizationApi().listMyOrganizations(1, 5);
const repos = await githubClient.getOrganizationApi().listRepositories(orgName, ...);
```

**Why This Pattern:**
- ✅ `getZerobiasClientUrl()` uses `window.location` for same-origin URLs (avoids CORS preflight)
- ✅ `apiKey` enables `Authorization: APIKey ...` header in HubConnector
- ✅ `orgId` adds `Dana-Org-Id` header for multi-tenancy
- ✅ Works for ALL Hub module clients (DataProducer, GitHub, etc.)

**Common Mistakes:**
- ❌ Manual URL construction: `const url = process.env.NEXT_PUBLIC_API_HOSTNAME + '/hub'`
- ❌ Missing `apiKey` in connection profile → No Authorization header
- ❌ Missing `orgId` → Multi-tenancy issues
- ❌ Trying to `await getCurrentOrg().toPromise()` → Hangs (use context instead)

### Iframe Communication

**Send Message to Parent Portal:**
```typescript
window.parent.postMessage({
  type: 'APP_NAV',
  data: { url: '/some/path' }
}, '*');
```

**Receive Messages from Parent:**
```typescript
window.addEventListener('message', (event) => {
  if (event.data.type === 'PORTAL_HOME') {
    // Navigate to home
  } else if (event.data.type === 'LOGOUT') {
    // Handle logout
  }
});
```

**Message Types:**
- `APP_NAV` - Navigate within app
- `RESOURCE_NAV` - Navigate to resource
- `LOGOUT` - User logged out
- `REFRESH_NAVIGATION` - Refresh navigation
- `PORTAL_HOME` - Return to portal home

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

## Deployment

### Automatic Deployment (Recommended)

**Via Pull Request Workflow:**
1. Create PR to `dev`/`qa`/`main` branch
2. GitHub Actions automatically builds and deploys on merge
3. App available at `https://{environment}.zerobias.com/{basePath}`

### Manual Deployment to S3 + CloudFront

**Build Process:**

**Angular:**
```bash
# Build with base href for CDN deployment
npm run build -- --base-href /example-angular/

# Output: dist/example-angular/
```

**Next.js:**
```bash
# Build for environment
npm run build:prod

# Output: .next/ (for Node.js deployment) or out/ (for static export)
```

**Manual S3 Deployment:**
```bash
# Angular
cd package/zerobias/example-angular
npm run build
aws s3 sync dist/example-angular/ s3://zerobias-apps/example-angular/
aws cloudfront create-invalidation --distribution-id <ID> --paths "/example-angular/*"

# Next.js
cd package/zerobias/example-nextjs
npm run build:prod
aws s3 sync out/ s3://zerobias-apps/example-nextjs/
aws cloudfront create-invalidation --distribution-id <ID> --paths "/example-nextjs/*"
```

**Via GitHub Actions:**
```yaml
# .github/workflows/deploy.yml
- name: Deploy to S3
  uses: auditmation/devops/actions/static-s3-app-release@main
  with:
    app-name: 'example-angular'
    environment: 'production'
    s3-bucket: 'zerobias-apps'
    cloudfront-distribution-id: ${{ secrets.CLOUDFRONT_DIST_ID }}
```

### Iframe Embedding in Platform

**Register App in Platform:**
1. Create app record in platform database
2. Specify app URL (https://cdn.zerobias.com/apps/example-angular/)
3. Configure permissions (which orgs/users can access)
4. Add navigation entry in portal

**App URL Pattern:**
```
https://cdn.zerobias.com/apps/{app-name}/
```

**Iframe Configuration:**
```html
<iframe
  src="https://cdn.zerobias.com/apps/example-angular/"
  sandbox="allow-scripts allow-same-origin allow-forms"
  style="width: 100%; height: 100%; border: none;"
></iframe>
```

## Development Requirements

### System Requirements
- **Node.js**: >= 18.19.1
- **npm**: >= 10.2.4
- **Git**: >= 2.0

### Environment Variables

**Angular App:**
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://api.zerobias.com',
  portalUrl: 'https://portal.zerobias.com',
  isIframe: true
};
```

**Next.js App:**
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.zerobias.com
NEXT_PUBLIC_PORTAL_URL=https://portal.zerobias.com
NEXT_PUBLIC_API_KEY=your-api-key  # For local dev only
NEXT_PUBLIC_IS_LOCAL_DEV=true
```

## Best Practices

### Architecture Best Practices (Learned from data-explorer refactor)

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

### App Development Best Practices

**1. Authentication:**
- Always check authentication state before making API calls
- Handle session expiration gracefully
- Support both iframe and standalone modes

**2. API Calls:**
- Use ZeroBias client library, don't call APIs directly
- Handle errors properly (401, 403, 500)
- Implement loading states
- Cache data when appropriate

**3. Iframe Communication:**
- Always validate message origin
- Handle all message types gracefully
- Send status updates to parent portal

**4. Performance:**
- Lazy load routes/components
- Optimize bundle size
- Use CDN for static assets
- Implement proper caching

**5. Security:**
- Never expose API keys in client code
- Validate all user input
- Implement CSP headers
- Use HTTPS only

### UI/UX Guidelines

**1. Consistency:**
- Follow platform design patterns
- Use platform color scheme
- Match typography and spacing

**2. Responsiveness:**
- Support mobile devices
- Handle different iframe sizes
- Test on various screen sizes

**3. Accessibility:**
- Support keyboard navigation
- Implement ARIA labels
- Ensure proper contrast ratios
- Test with screen readers

## Important Notes

### Iframe vs Standalone Mode

**Iframe Mode (Embedded in Portal):**
- Session inherited from parent portal
- Limited window size
- PostMessage communication
- Sandbox restrictions apply
- No custom authentication needed

**Standalone Mode (Direct Access):**
- Requires API key authentication
- Full browser window
- Independent session management
- No iframe restrictions
- Direct URL access

### Build Optimization

**Angular:**
- Use production build for deployment
- Enable AOT compilation
- Implement lazy loading for routes
- Use OnPush change detection

**Next.js:**
- Use static generation where possible
- Optimize images with next/image
- Implement code splitting
- Use React Server Components (RSC)

**All Apps:**
- All apps use static export mode for deployment (NextJS uses `output: "export"`)
- Custom base paths are configured for sub-directory deployment
- NextJS apps disable React strict mode (for compatibility)
- The Angular app uses Nx workspace for build tooling
- Session management and authentication are handled entirely by the Zerobias platform
- Local development requires API key configuration for backend access

## Troubleshooting

### API Calls Return 401 Unauthorized

**Problem:** App can't authenticate with platform API

**Solutions:**
1. Check API key is set (standalone mode)
2. Verify iframe session is valid (iframe mode)
3. Call `whoAmI()` to establish session
4. Check CORS configuration

### Iframe Not Loading

**Problem:** App doesn't load in portal iframe

**Solutions:**
1. Check app URL is accessible
2. Verify iframe sandbox attributes
3. Check CSP headers don't block iframe
4. Test app in standalone mode first

### PostMessage Not Working

**Problem:** Messages not being sent/received between app and portal

**Solutions:**
1. Verify message origin validation
2. Check message format matches expected types
3. Test with `console.log` to debug
4. Ensure both app and portal listening for messages

### Build Fails

**Angular Solutions:**
1. Clear node_modules and reinstall
2. Check TypeScript version compatibility
3. Verify all @auditmation packages are latest
4. Run `npx nx reset` to clear cache

**Next.js Solutions:**
1. Clear .next directory
2. Check next.config.ts syntax
3. Verify environment variables set
4. Run `rm -rf .next && npm run build`

## Testing

### Local Testing

**Angular:**
```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --code-coverage

# Run in watch mode
npm test -- --watch
```

**Next.js:**
```bash
# Run tests (if configured)
npm test

# Type checking
npx tsc --noEmit

# Lint
npm run lint
```

### Integration Testing

1. **Test in Iframe:**
   - Load portal locally
   - Embed app as iframe
   - Test postMessage communication
   - Verify session sharing

2. **Test API Calls:**
   - Point to dev environment
   - Test all API endpoints
   - Verify error handling
   - Check data transformations

3. **Test Deployment:**
   - Deploy to dev environment
   - Test CDN access
   - Verify CORS configuration
   - Check console for errors

## Project-Specific Documentation

For detailed project-specific guidance, see:
- `package/zerobias/data-explorer/CLAUDE.md` - Data Explorer architecture and development
- `package/zerobias/example-nextjs/CLAUDE.md` - NextJS example patterns and suggested improvements
- `package/zerobias/example-angular/CLAUDE.md` - Angular example patterns (if present)

## Related Documentation

- **[Root CLAUDE.md](../../CLAUDE.md)** - Meta-repo development guidance
- **[Architecture.md](../../Architecture.md)** - Platform architecture
- **[Concepts.md](../../Concepts.md)** - Domain concepts
- **[auditmation/zb-client/CLAUDE.md](../../auditmation/zb-client/CLAUDE.md)** - Client library documentation
- **[auditmation/ui/CLAUDE.md](../../auditmation/ui/CLAUDE.md)** - Portal UI
- **[auditmation/hub/CLAUDE.md](../../auditmation/hub/CLAUDE.md)** - Hub modules
- **[auditmation/devops/CLAUDE.md](../../auditmation/devops/CLAUDE.md)** - Deployment workflows
- **[package/zerobias/example-angular/README.md](package/zerobias/example-angular/README.md)** - Angular app docs
- **[package/zerobias/example-nextjs/README.md](package/zerobias/example-nextjs/README.md)** - Next.js app docs

---

**Last Updated:** 2025-11-12
**Maintainers:** ZeroBias Community
