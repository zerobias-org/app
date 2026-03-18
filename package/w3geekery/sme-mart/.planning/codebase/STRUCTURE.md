# Structure

> Auto-generated codebase map. Source of truth is the code itself.

## Directory Layout

```
sme-mart/
├── .claude/                    # Claude Code config, notes, plans, skills
│   ├── docs/                   # SOURCE_PATHS.md
│   ├── notes/                  # Reference docs, meeting notes, guides
│   ├── plans/public/           # PLAN.md (architecture source of truth)
│   └── skills/                 # Project-specific skills
├── src/
│   ├── app/
│   │   ├── core/               # Domain logic layer
│   │   │   ├── app-init.service.ts       # APP_INITIALIZER
│   │   │   ├── mappers/                  # Entity → SmeMartResource mappers
│   │   │   │   ├── bid-resource.mapper.ts
│   │   │   │   ├── document-resource.mapper.ts
│   │   │   │   ├── note-resource.mapper.ts
│   │   │   │   ├── review-resource.mapper.ts
│   │   │   │   ├── service-offering-resource.mapper.ts
│   │   │   │   ├── work-request-resource.mapper.ts
│   │   │   │   └── index.ts              # Barrel export
│   │   │   ├── models/                   # TypeScript interfaces (22 files)
│   │   │   │   ├── bid.model.ts
│   │   │   │   ├── rfp.model.ts
│   │   │   │   ├── provider.model.ts
│   │   │   │   ├── service-offering.model.ts
│   │   │   │   ├── notification.model.ts
│   │   │   │   ├── enums.ts
│   │   │   │   ├── index.ts              # Barrel export
│   │   │   │   └── ... (15 more)
│   │   │   ├── services/                 # Injectable services (27 files)
│   │   │   │   ├── sme-mart-db.service.ts      # Central DB (Hub/Neon dual-mode)
│   │   │   │   ├── graphql-read.service.ts     # AuditgraphDB GQL reads
│   │   │   │   ├── pipeline-write.service.ts   # AuditgraphDB pipeline writes
│   │   │   │   ├── bids.service.ts
│   │   │   │   ├── notes.service.ts
│   │   │   │   ├── rfp-wizard.service.ts
│   │   │   │   ├── engagement-lifecycle.service.ts
│   │   │   │   ├── sme-mart-tag.service.ts
│   │   │   │   ├── sme-mart-resource.service.ts
│   │   │   │   └── ... (18 more)
│   │   │   └── utils/
│   │   │       └── tag-prefix.util.ts
│   │   ├── layout/
│   │   │   └── app-shell.component.*     # Main shell with sidenav + toolbar
│   │   ├── pages/                        # Feature route pages
│   │   │   ├── admin/                    # Admin management
│   │   │   ├── coming-soon/              # Placeholder page
│   │   │   ├── engagements/              # Engagement CRUD + tab routes
│   │   │   ├── home/                     # Dashboard
│   │   │   ├── my-engagements/           # Provider's engagement list
│   │   │   ├── my-profile/               # User profile (6 tab pages)
│   │   │   ├── org/                      # Org admin (documents, members, etc.)
│   │   │   ├── providers/                # Provider list + detail
│   │   │   ├── rfps/                     # RFP list, detail, wizards, bids
│   │   │   └── services/                 # Service catalog
│   │   ├── shared/                       # Reusable UI components
│   │   │   ├── components/               # ~55 shared components
│   │   │   │   ├── list-page/            # Generic list page shell
│   │   │   │   ├── task-card/            # ZB Task card
│   │   │   │   ├── task-list-panel/
│   │   │   │   ├── timeline-panel/       # Engagement timeline
│   │   │   │   ├── bid-card/
│   │   │   │   ├── note-editor/
│   │   │   │   ├── markdown-editor/
│   │   │   │   ├── resource-tag-autocomplete/
│   │   │   │   └── ... (47 more)
│   │   │   ├── directives/
│   │   │   │   └── resizable-drawer.directive.ts
│   │   │   ├── pipes/
│   │   │   │   ├── zb-tag.pipe.ts
│   │   │   │   └── safe-resource-url.pipe.ts
│   │   │   ├── plugins/
│   │   │   │   └── sme-doc-link.plugin.ts
│   │   │   └── index.ts                  # Barrel export
│   │   ├── test-helpers/                 # Shared test utilities
│   │   │   ├── angular.ts               # Mock factories (170 lines)
│   │   │   ├── constants.ts             # Test UUIDs/IDs
│   │   │   └── factories.ts            # Domain model factories (376 lines)
│   │   ├── app.component.*              # Root component
│   │   ├── app.config.ts               # App config (providers, init)
│   │   └── app.routes.ts               # Top-level routes
│   ├── assets/                          # Static assets
│   ├── environments/                    # Environment configs (4 files)
│   ├── styles.scss                      # Global styles
│   ├── main.ts                          # Bootstrap
│   └── test-setup.ts                    # Vitest setup
├── angular.json                         # Angular CLI config
├── middleware.ts                         # Vercel Edge Middleware (API proxy)
├── package.json
├── tsconfig*.json
└── vercel.json                          # Vercel deployment config
```

## Key Locations

| What | Where |
|------|-------|
| App bootstrap | `src/main.ts` → `src/app/app.config.ts` |
| Routes | `src/app/app.routes.ts` |
| Domain models | `src/app/core/models/` (22 files, barrel: `index.ts`) |
| Domain services | `src/app/core/services/` (27 services) |
| Entity mappers | `src/app/core/mappers/` (6 mappers + barrel) |
| Page components | `src/app/pages/` (10 feature directories) |
| Shared components | `src/app/shared/components/` (~55 components) |
| Test helpers | `src/app/test-helpers/` (3 files, 583 lines) |
| Environment configs | `src/environments/` (4 files) |
| Global styles | `src/styles.scss` |

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Component | `foo.component.ts` / `.html` / `.scss` | `provider-card.component.ts` |
| Service | `foo.service.ts` | `catalog.service.ts` |
| Model | `foo.model.ts` | `provider.model.ts` |
| Mapper | `foo-resource.mapper.ts` | `bid-resource.mapper.ts` |
| Pipe | `foo.pipe.ts` | `zb-tag.pipe.ts` |
| Directive | `foo.directive.ts` | `resizable-drawer.directive.ts` |
| Routes | `foo.routes.ts` | `my-profile.routes.ts` |
| Test | `foo.spec.ts` (co-located) | `bids.service.spec.ts` |
| Barrel | `index.ts` | `src/app/core/models/index.ts` |

**Note:** Angular 21 dropped type suffixes, but this project **keeps traditional suffixed naming** for readability.

## Code Metrics

| Metric | Value |
|--------|-------|
| Source files (non-test `.ts`) | ~182 |
| Test files (`.spec.ts`) | 40 |
| Total source lines | ~23,218 |
| Total test lines | ~6,266 |
| Test helpers | 583 lines (3 files) |
| Shared components | ~55 |
| Domain services | 27 |
| Domain models | 22 |
| Entity mappers | 6 |
