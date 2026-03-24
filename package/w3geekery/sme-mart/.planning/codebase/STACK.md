# Technology Stack

**Analysis Date:** 2026-03-18

## Languages

**Primary:**
- TypeScript 5.9.2 - Application code (strict mode enabled, ES2022 target)

**Secondary:**
- HTML 5 - Angular templates (strict mode enabled)
- SCSS - Component and global styling
- JavaScript - Build scripts (Node 18.19.1+)

## Runtime

**Environment:**
- Node.js 18.19.1 or higher (pinned in `engines` field)

**Package Manager:**
- npm 10.2.4 or higher
- Lockfile: `package-lock.json` (present, committed)

## Frameworks

**Core:**
- Angular 21.1.0 - Frontend framework (standalone components, App Router)
- Angular Material 21.1.4 - UI component library
- Angular CDK 21.1.4 - Component development kit (utilities, accessibility)

**Platform Integration:**
- `@zerobias-com/zerobias-angular-client` 1.1.25 - ZeroBias platform Angular SDK (wraps zerobias-client)
- `@zerobias-org/ngx-library` 0.2.25 - ZeroBias custom component library (tabs, panels, tables, avatars, autocomplete, filters, remote-table, code-editor, resource-status)

**Data & APIs:**
- `@zerobias-com/platform-sdk` - ZeroBias platform GraphQL/REST API client
- `@zerobias-com/graphql-sdk` - ZeroBias GraphQL query execution
- `@zerobias-org/data-utils` - DataProducer client for Hub module access (SQL-like interface)
- `@zerobias-org/module-interface-dataproducer-hub-sdk` - Hub module SDK types

**Internationalization:**
- `@ngx-translate/core` 15.0.0 - i18n library (English-first, extensible)
- `@ngx-translate/http-loader` 17.0.0 - Translation file loader

**Code Editing:**
- CodeMirror 6 (multiple language packs: CSS, HTML, JavaScript, JSON, Markdown, Python, SQL, XML, YAML)
- `@codemirror/lint` 6.9.4 - Linting support
- `@codemirror/theme-one-dark` 6.1.3 - Dark theme

**Rich Text Editing:**
- `@milkdown/crepe` 7.18.0 - Rich markdown editor (collaborative-ready)
- `@milkdown/kit` 7.18.0 - Milkdown core
- `@milkdown/theme-nord` 7.18.0 - Nord theme

**Markdown & HTML:**
- `marked` 17.0.3 - Markdown parser
- `dompurify` 3.3.1 - HTML sanitization (XSS prevention)

**Utilities:**
- `rxjs` 7.8.0 - Reactive programming
- `yaml` 2.8.2 - YAML parsing (schema configuration)
- `ts-md5` 2.0.1 - MD5 hashing (non-crypto use)
- `tslib` 2.3.0 - TypeScript helpers

**Infinite Scrolling:**
- `ngx-infinite-scroll` 21.0.0 - Virtual scrolling for large lists

**Database Access (Development/QA):**
- `@neondatabase/serverless` 1.0.2 - Neon PostgreSQL HTTP client (direct mode, fallback to Hub Module)

## Testing

**Framework:**
- Vitest 4.0.8 - Unit test runner (replacing Jasmine for spec files)
- `jsdom` 27.1.0 - DOM simulation for testing

**Run Commands:**
```bash
npm test              # Run all tests (via ng test → Vitest)
```

## Build & Dev

**Build System:**
- Angular CLI 21.1.4 - Build, serve, test orchestration
- `@angular/build:application` - Modern build architecture
- `@angular/build:dev-server` - Development server
- `@angular/build:unit-test` - Test runner integration

**Build Configurations:**
- `development` - Source maps, no optimization
- `production` - Bundled, minified, hash output, tree-shaking
- `vercel` - Vercel deployment (points to environment.vercel.ts)

**Scripting:**
- `dotenv-cli` 11.0.0 - Environment variable injection (predev scripts)
- Node.js CommonJS (proxy-common.js) - Dev server proxy configuration

## Key Dependencies

**Critical:**
- `@zerobias-com/zerobias-angular-client` - Authentication and platform API access (singleton pattern)
- `@zerobias-com/platform-sdk` - GraphQL execution for schema class queries (Engagement, Bid, etc.)
- `@neondatabase/serverless` - Direct Neon database queries (fallback when Hub unavailable)

**Infrastructure:**
- `@zerobias-org/data-utils` / DataProducerClient - Generic SQL Hub Module connector (production DB access)
- `@zerobias-org/types-core-js` - Shared core types (UUID, PagedResults, etc.)
- Angular Material - Professional UI (buttons, forms, dialogs, tabs, chips, paginator)

## Configuration

**Environment:**
- Multi-environment setup: development (CI), UAT, QA, production
- Environment files in `src/environments/`
  - `environment.ts` - CI development (default)
  - `environment.prod.ts` - Production (Hub Module, no API key)
  - `environment.vercel.ts` - Vercel deployment (Neon HTTP, API key via Edge Middleware)
  - `environment.neon.ts` - Auto-generated from NEON_DATABASE_URL (do not commit)

**Build:**
- `angular.json` - Main build config (assets, styles, budgets, configurations)
- `tsconfig.json` - Root TS config (strict, ES2022, preserve modules)
- `tsconfig.app.json` - App-specific TS config
- `tsconfig.spec.json` - Test-specific TS config

**Proxy:**
- `proxy-uat.conf.js` - UAT (default: `npm run dev`)
- `proxy-dev.conf.js` - CI development (deprecated, being migrated to UAT)
- `proxy-qa.conf.js` - QA environment
- `proxy-prod.conf.js` - Production
- `proxy-common.js` - Shared proxy factory (injects API key header, org ID cookie, error handling)

**Styling:**
- Global: `src/styles.scss`
- Component: SCSS per component (configured in schematics)
- ngx-library styles included via `stylePreprocessorOptions` (SCSS import paths)
- Prettier for HTML/code formatting (printWidth 100, single quotes)

## Platform Requirements

**Development:**
- Node.js 18.19.1+, npm 10.2.4+
- `.env.local` file with API keys (ZEROBIAS_UAT_API_KEY, ZEROBIAS_UAT_ORG_ID, etc.)
- NEON_DATABASE_URL for direct Neon access (fallback mode)
- ng serve with proxy config (dev server handles CORS, auth header injection)

**Production:**
- Deployed to ZeroBias platform or Vercel
- No API keys in code (Hub Module or Vercel Edge Middleware handles auth)
- Neon PostgreSQL connection (pooled via Hub Module or direct HTTP in Vercel)
- Standalone components (no NgModules)
- Source maps disabled, bundle optimized

---

*Stack analysis: 2026-03-18*
