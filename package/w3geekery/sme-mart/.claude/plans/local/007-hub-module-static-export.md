# Plan 007: Static Export + Hub Module for QA Deployment

**Status:** Planning
**Created:** 2026-01-30
**Prereqs:** Phases 1–6 complete (all existing features working with local API routes)

---

## Goal

Deploy SME Mart to QA as a static site on S3. Requires moving all server-side API logic into a ZeroBias Hub Module so the app can use `output: "export"`.

## Architecture

```
BEFORE:  Browser → Next.js API Routes → Neon/Drizzle
AFTER:   Browser → Hub SDK Client → Hub Module (ZeroBias SaaS) → Neon/Drizzle
```

---

## Part 1: Hub Module (separate repo)

**Repo:** Fork of `@zerobias-org/module` → PR to `dev` branch
**Package:** `@zerobias-org/module-w3geekery-sme-mart` (or similar)

### Scaffold

```bash
yo @auditmation/hub-module
# name: w3geekery-sme-mart
# scope: zerobias-org
# API name: SmeMart
```

### API Surface (5 tags, ~20 operations)

| Tag | Operations | Source Route |
|-----|-----------|-------------|
| **Provider** | listProviders, getProvider, submitReview | `/api/providers/*` |
| **Profile** | getProfile, upsertProfile, addSkill, removeSkill, addService, updateService, removeService, getProfileReviews, moderateReview | `/api/profile/*` |
| **Service** | listServices | `/api/services` |
| **Request** | listRequests, createRequest, getRequest, updateRequest, createProposal, updateProposal, deleteProposal | `/api/requests/*`, `/api/proposals/*` |
| **Admin** | getStats, listCategories, createCategory, updateCategory, deleteCategory, listAllReviews, moderateReviews | `/api/admin/*` |

### Connection Profile

```yaml
type: object
required:
  - databaseUrl
properties:
  databaseUrl:
    type: string
    format: uri
    description: Neon PostgreSQL connection string
```

### Implementation

- Move Drizzle schema + query logic from current API routes into producer files
- Each tag → `*Producer.ts` (ProviderProducer, AdminProducer, etc.)
- `databaseUrl` from connection profile initializes Neon/Drizzle client
- Admin ops validate caller's admin flag via Hub auth context

### Module Dev Workflow

```bash
npm run sync-meta    # Sync package.json → api.yml
npm run validate     # Validate OpenAPI spec
npm run generate     # Generate TypeScript from api.yml
npm run build        # Full build
npm test             # Run tests
```

---

## Part 2: App Changes (this repo)

### Phase A — Hub Client Integration

New file: `src/lib/sme-mart-client.ts`
- Initialize Hub module client using standard ZeroBias pattern
- Connection profile from ZeroBiasContext (Hub URL, API key, org ID)
- Export typed API accessors

### Phase B — Replace Fetch Calls

Replace all `fetch('/api/...')` with Hub SDK client calls:
- `src/app/admin/page.tsx` → `client.getAdminApi().*`
- `src/app/providers/page.tsx` → `client.getProviderApi().listProviders()`
- `src/app/providers/[providerId]/page.tsx` → `client.getProviderApi().getProvider()`
- Profile editing pages → `client.getProfileApi().*`
- Work requests → `client.getRequestApi().*`
- Service catalog → `client.getServiceApi().listServices()`

### Phase C — Static Export Config

**Delete:**
- `src/app/api/` (all 16 route files)
- `src/lib/admin-auth.ts`
- `src/lib/db/` (schema, migrations, seed → moved to Hub module)

**Remove deps:** `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`

**Update `next.config.ts`:**
```typescript
const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "export",
  distDir: "dist",
  basePath: "/sme-mart",
  skipTrailingSlashRedirect: true,
  trailingSlash: true,
};
```

**Add build scripts** (data-explorer pattern):
```
build:dev  → cp next.config.dev.ts next.config.ts && next build
build:qa   → cp next.config.qa.ts next.config.ts && next build
build:prod → cp next.config.prod.ts next.config.ts && next build
```

**Keep `next.config.default.ts`** for local dev (no export, keeps rewrites)

### Phase D — Dynamic Routes

`output: "export"` needs `generateStaticParams()` for dynamic routes.
Use empty array + client-side loading: page renders loading state, fetches via Hub SDK.

---

## Assumptions (confirm with Christopher)

- **basePath:** `/sme-mart`
- **Local dev:** Dual mode — local API routes for dev, Hub for deployed builds
- **Hub deployment:** Module PR merge to `dev` triggers CI build + Hub registration (TBD)
- **Connection secrets:** Christopher or admin configures Neon DATABASE_URL as Hub connection secret

## Execution Order

1. Hub Module — scaffold, api.yml, implement producers, build, publish
2. App — add Hub client dep, create integration layer
3. Incremental migration — one route group at a time
4. Static export config — next.config.ts, dynamic routes
5. Clean up — remove API routes, DB deps
6. Local test — `npm run build` → static `dist/`
7. PR to `qa` → dispatch deploys to S3

## Verification

1. Hub module: `npm run build` succeeds
2. Module published + registered on Hub with Neon connection
3. App: `npm run build` produces `dist/` (static)
4. All pages load data via Hub SDK
5. Admin guard works through Hub auth
6. PR to `qa` → app at `https://qa.zerobias.com/sme-mart/`

## Reference Docs

- Hub module generator: `/Projects/zerobias-com/repos/hub/generator-hub-module/CLAUDE.md`
- Hub README (api.yml patterns): `/Projects/zerobias-com/repos/hub/README.md`
- Hub core (codegen workflow): `/Projects/zerobias-com/repos/hub/core/CLAUDE.md`
- Codegen tool: `/Projects/zerobias-com/repos/zerobias-org/util/packages/codegen/CLAUDE.md`
- Data-explorer static config: `package/zerobias/data-explorer/next.config.qa.ts`
- Deploy workflow: `.github/workflows/deploy.yml`
- Dispatch workflow: `.github/workflows/dispatch.yml`
