# CLAUDE.md - SME Mart

> **On Startup:** Read `.claude/plans/public/000-MASTER-PLAN.md` first — this is the source of truth for the entire project. Then check `.claude/restart_context.md` for session state and next steps.

> **Stand-up Prep (Weekdays @ 8:30am Pacific):** When Clark asks for stand-up items, search all `.claude/plans/` files for `<!-- STANDUP -->` flags and list them as discussion topics.

This file provides project-specific guidance for the SME Mart application.

## Purpose

SME Mart is a **marketplace for Subject Matter Experts (SMEs), talent, and task workers** related to the ZeroBias platform for compliance attestation work. Think "Upwork meets Whop for compliance professionals."

### What is SME Mart?

A labor and services marketplace where:
- **Providers (Supply-side)**: SMEs, consultants, assessors, developers list themselves and offer services
- **Buyers (Demand-side)**: Companies/orgs shop for talent and request compliance-related work
- **Work is scoped**: All work performed within ZeroBias Boundaries for security
- **Tracked via Tasks**: Hours, deliverables, and context tracked through ZeroBias Task System

### CEO DIRECTIVE: ZeroBias Tasks & Boundaries Are Foundational

> **Non-negotiable requirement from Brian (CEO).** All SME Mart engagements must flow through ZeroBias Tasks within Boundaries.

**ZeroBias Tasks must carry the complete audit trail:**
- **All dialog** → Task Comments (negotiations, clarifications, updates)
- **Requirements** → Task Description + Custom Fields
- **Transactions** → Task Custom Fields (rates, hours, payments)
- **LLM prompts/output** → Task Comments with type tagging
- **Documents** → Task Attachments (SOWs, deliverables, evidence)

**ZeroBias Boundaries provide:**
- Access control (only invited providers can access buyer's context)
- Compliance isolation (work scoped to specific frameworks)
- Audit trail context (all activity logged within boundary)

**Implementation Priority:**
1. Plan 010: Boundary Integration (prerequisite)
2. Plan 009: Tasks Integration (depends on boundaries)

See `.claude/plans/local/` for detailed implementation plans.

### Target Service Categories

| Category | Description |
|----------|-------------|
| **Assessors** | Compliance assessors, auditors, certification specialists |
| **Advisors** | Compliance advisors, GRC consultants |
| **Agentic** | AI agent builders, automation specialists, prompt engineers |
| **SecOps** | Security operations professionals |
| **DevSecOps** | Development security operations, secure SDLC |
| **Data Entry** | Compliance data entry, evidence collection |
| **Training** | Compliance training, certification prep |
| **Engineering** | Software engineering, platform integration |

### Who Uses This App?

**Providers:**
- Compliance professionals offering services
- AI/LLM experts building agents
- Developers specializing in compliance tools
- Trainers and educators

**Buyers:**
- Companies needing compliance guidance
- Organizations seeking audit preparation
- Teams requiring SME mentoring
- Businesses needing compliance automation

## Project Structure

```
sme-mart/
├── app/
│   ├── page.tsx                    # Landing page / marketplace browse
│   ├── layout.tsx                  # Root layout with providers
│   ├── globals.css                 # Global styles
│   ├── providers/
│   │   ├── page.tsx               # Provider directory/search
│   │   └── [providerId]/
│   │       └── page.tsx           # Provider profile detail
│   ├── services/
│   │   ├── page.tsx               # Service catalog browse
│   │   └── [serviceId]/
│   │       └── page.tsx           # Service detail
│   ├── requests/
│   │   ├── page.tsx               # Work request list (buyer view)
│   │   └── [requestId]/
│   │       └── page.tsx           # Request detail/management
│   ├── dashboard/
│   │   ├── page.tsx               # User dashboard (provider or buyer)
│   │   └── provider/
│   │       └── page.tsx           # Provider-specific dashboard
│   └── api/
│       └── proxy/[...path]/       # API proxy for CORS (local dev)
├── components/
│   ├── common/                    # Shared UI components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   └── Loading.tsx
│   ├── marketplace/               # Marketplace-specific components
│   │   ├── ProviderCard.tsx
│   │   ├── ServiceCard.tsx
│   │   ├── ProviderGrid.tsx
│   │   ├── ServiceGrid.tsx
│   │   ├── SearchFilters.tsx
│   │   └── CategoryNav.tsx
│   ├── provider/                  # Provider profile components
│   │   ├── ProviderProfile.tsx
│   │   ├── ServiceOfferings.tsx
│   │   ├── SkillsBadges.tsx
│   │   ├── ReviewsSection.tsx
│   │   └── AvailabilityCalendar.tsx
│   ├── request/                   # Work request components
│   │   ├── RequestForm.tsx
│   │   ├── RequestCard.tsx
│   │   ├── ProposalForm.tsx
│   │   └── ContractDetails.tsx
│   └── dashboard/                 # Dashboard components
│       ├── ProviderStats.tsx
│       ├── BuyerStats.tsx
│       ├── ActiveRequests.tsx
│       └── EarningsChart.tsx
├── context/
│   ├── ZeroBiasContext.tsx        # ZeroBias auth/org state (direct SDK)
│   └── MarketplaceContext.tsx     # Marketplace state (providers, services)
├── lib/
│   ├── zerobias-clients.ts       # ZeroBias SDK client initialization
│   ├── db/
│   │   ├── index.ts              # Drizzle client setup
│   │   ├── schema.ts             # Drizzle schema definitions
│   │   └── migrations/           # Database migrations
│   ├── types.ts                  # TypeScript type definitions
│   └── utils.ts                  # Helper functions
├── hooks/
│   ├── useProviders.ts           # Provider data fetching
│   ├── useServices.ts            # Service data fetching
│   ├── useRequests.ts            # Work request management
│   └── useSearch.ts              # Search/filter logic
└── next.config.*.ts              # Environment-specific configs
```

## Architecture

### Design Philosophy

**Hybrid Data Architecture:**
- **ZeroBias Platform**: Authentication, organizations, boundaries, tasks, users
- **Neon**: Extended marketplace data (provider profiles, services, reviews, requests)

**Why Neon?**
- ZeroBias backend focused on core platform features
- Marketplace needs custom tables not in ZeroBias data model
- Serverless PostgreSQL with branching for dev/staging
- Quick iteration during POC phase
- Standard PostgreSQL with Drizzle ORM for type safety

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **UI Library** | Material UI (MUI) v6 |
| **State** | React Context + TanStack Query |
| **Auth** | ZeroBias Platform (via SDKs) |
| **Database** | Neon (Serverless PostgreSQL) |
| **ORM** | Drizzle ORM |
| **Styling** | SCSS Modules + MUI theming |
| **Icons** | Lucide React / MUI Icons |

### Styling Approach

**SCSS Modules** - Scoped component styles with full SCSS features:
```scss
// components/ProviderCard.module.scss
.card {
  border-radius: 8px;
  padding: 1.5rem;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .rating {
    color: var(--color-primary);
    font-weight: 600;
  }
}
```

**Global SCSS** - Variables, mixins, base styles:
```scss
// styles/globals.scss
:root {
  --color-primary: #667eea;
  --color-secondary: #764ba2;
  --color-success: #10b981;
  --font-sans: 'Inter', system-ui, sans-serif;
}

// styles/_mixins.scss
@mixin card-shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@mixin responsive($breakpoint) {
  @if $breakpoint == mobile { @media (max-width: 640px) { @content; } }
  @if $breakpoint == tablet { @media (max-width: 1024px) { @content; } }
}
```

**MUI Theming** - For component library consistency:
```typescript
// lib/theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#667eea' },
    secondary: { main: '#764ba2' }
  },
  typography: {
    fontFamily: 'var(--font-sans)'
  }
});
```

### State Management

**Two Context Providers:**

1. **ZeroBiasContext**
   - Manages ZeroBias authentication and organization
   - Provides: `user`, `org`, `loading`, `sdk`
   - Source of truth for identity

2. **MarketplaceContext**
   - Manages marketplace-specific state
   - Provides: `providers`, `services`, `categories`, `searchFilters`
   - Coordinates between ZeroBias and Neon data

### Data Model (Neon + Drizzle)

```typescript
// lib/db/schema.ts
import { pgTable, uuid, text, decimal, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const availabilityStatusEnum = pgEnum('availability_status', ['available', 'busy', 'unavailable']);
export const pricingTypeEnum = pgEnum('pricing_type', ['fixed', 'hourly', 'subscription', 'custom']);
export const budgetTypeEnum = pgEnum('budget_type', ['fixed', 'hourly', 'negotiable']);
export const requestStatusEnum = pgEnum('request_status', ['open', 'in_progress', 'completed', 'cancelled']);
export const proposalStatusEnum = pgEnum('proposal_status', ['pending', 'accepted', 'rejected', 'withdrawn']);
export const proficiencyLevelEnum = pgEnum('proficiency_level', ['beginner', 'intermediate', 'expert']);

// Provider profiles (extends ZeroBias User)
export const providerProfiles = pgTable('provider_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  zerobiasUserId: text('zerobias_user_id').notNull().unique(),
  zerobiasOrgId: text('zerobias_org_id'),
  displayName: text('display_name').notNull(),
  headline: text('headline'),
  about: text('about'),
  avatarUrl: text('avatar_url'),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  availabilityStatus: availabilityStatusEnum('availability_status').default('available'),
  responseTime: text('response_time'),
  totalJobsCompleted: integer('total_jobs_completed').default(0),
  totalEarnings: decimal('total_earnings', { precision: 12, scale: 2 }).default('0'),
  ratingAverage: decimal('rating_average', { precision: 3, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Provider skills/expertise
export const providerSkills = pgTable('provider_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').references(() => providerProfiles.id, { onDelete: 'cascade' }),
  skillName: text('skill_name').notNull(),
  skillCategory: text('skill_category'),
  proficiencyLevel: proficiencyLevelEnum('proficiency_level'),
  yearsExperience: integer('years_experience'),
  verified: boolean('verified').default(false)
});

// Service offerings (productized services - Upwork Project Catalog pattern)
export const serviceOfferings = pgTable('service_offerings', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').references(() => providerProfiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  pricingType: pricingTypeEnum('pricing_type').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }),
  deliveryTime: text('delivery_time'),
  includes: text('includes').array(),
  requirements: text('requirements'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Work requests from buyers (Upwork job posting pattern)
export const workRequests = pgTable('work_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  buyerZerobiasUserId: text('buyer_zerobias_user_id').notNull(),
  buyerZerobiasOrgId: text('buyer_zerobias_org_id'),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  budgetType: budgetTypeEnum('budget_type'),
  budgetMin: decimal('budget_min', { precision: 10, scale: 2 }),
  budgetMax: decimal('budget_max', { precision: 10, scale: 2 }),
  timeline: text('timeline'),
  status: requestStatusEnum('status').default('open'),
  zerobiasBoundaryId: text('zerobias_boundary_id'),
  zerobiasTaskId: text('zerobias_task_id'),
  createdAt: timestamp('created_at').defaultNow()
});

// Proposals from providers (Upwork proposal pattern)
export const proposals = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').references(() => workRequests.id, { onDelete: 'cascade' }),
  providerId: uuid('provider_id').references(() => providerProfiles.id, { onDelete: 'cascade' }),
  coverLetter: text('cover_letter'),
  proposedPrice: decimal('proposed_price', { precision: 10, scale: 2 }),
  proposedTimeline: text('proposed_timeline'),
  status: proposalStatusEnum('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow()
});

// Reviews and ratings (Upwork/VoltAgent pattern)
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').references(() => providerProfiles.id, { onDelete: 'cascade' }),
  reviewerZerobiasUserId: text('reviewer_zerobias_user_id').notNull(),
  requestId: uuid('request_id').references(() => workRequests.id),
  rating: integer('rating').notNull(),
  reviewText: text('review_text'),
  createdAt: timestamp('created_at').defaultNow()
});

// Categories taxonomy (Whop/VoltAgent pattern)
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  parentId: uuid('parent_id').references(() => categories.id),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0)
});

// Relations
export const providerProfilesRelations = relations(providerProfiles, ({ many }) => ({
  skills: many(providerSkills),
  serviceOfferings: many(serviceOfferings),
  proposals: many(proposals),
  reviews: many(reviews)
}));

export const providerSkillsRelations = relations(providerSkills, ({ one }) => ({
  provider: one(providerProfiles, {
    fields: [providerSkills.providerId],
    references: [providerProfiles.id]
  })
}));
```

### ZeroBias Integration Points

| ZeroBias Feature | Marketplace Usage |
|------------------|-------------------|
| **Authentication** | User identity, session management |
| **Organizations** | Provider orgs, buyer orgs |
| **Boundaries** | Secure work environments for contracts |
| **Tasks** | Track work, hours, deliverables, context |
| **Profiles** | Base user info (name, email) |
| **Modules** | Agent marketplace (future) |

### Generic SQL Hub Module (Neon via DataProducer)

The SME Mart Neon database is connected to ZeroBias via the **Generic SQL Hub Module**, which exposes it through the DataProducer interface (same pattern as data-explorer).

**Module:** `@auditlogic/module-auditmation-generic-sql` (v0.5.0)
**KB Article:** `https://cdn.zerobias.com/ct/qa/ctauditmationgenericsql/`

**QA Connection (created 2026-02-11):**

| Property | Value |
|----------|-------|
| **Connection Name** | SQL Connector Connection 1 |
| **Connection ID** | `e3c874f5-5fd8-4fbc-8120-19861e28b19e` |
| **Boundary** | Test (`a2262699-b182-482c-8fc3-ace298168343`) |
| **Deployment** | SQL Connector 0.5.0 on SaaS Connection Node |
| **Node Status** | Up |
| **Connection Status** | Standby (blocked — see below) |

**JDBC URL format (for Neon):**
```
jdbc:postgresql://ep-aged-fog-af9wu771.c-2.us-west-2.aws.neon.tech/neondb?user=neondb_owner&password=<PASSWORD>&sslmode=require
```

> **Note:** Use the **direct** Neon endpoint (no `-pooler` suffix) for JDBC. The Hub module uses HikariCP for connection pooling internally; double-pooling through Neon's PgBouncer can cause issues with prepared statements.

**Status (2026-02-11):** Connection created but blocked on two issues:
1. **Hub tags endpoint 503** — `POST /api/hub/resources/{id}/tags` returns 503 on QA, preventing deployment tagging (`envTypeTags INPUT: null` → `Error: no module-deployment tags found`)
2. **Connection test fails** — `GET /api/hub/targets/{id}/metadata` reaches the SQL Connector container, but the error response isn't in `CoreError` format. The Hub's `ConnectedNode.ts:237` can't deserialize it, hiding the actual JDBC error. Likely cause: SSL/cert or network issue inside the Docker container reaching Neon.

**Next steps:** Kevin is updating Hub error handling for better LLM troubleshooting. Retry connection test after QA Hub updates are deployed. Check `~/zb-repos/hub/` source (pulled latest 2026-02-11) for changes to `ConnectedNode.ts` and `TargetProducerImpl.ts`.

**Hub source:** `~/zb-repos/hub/` (zerobias-com/hub, main branch)

### API Integration Patterns

**ZeroBias SDK:** See `AGENTS.md` for SDK usage patterns and documentation references.

**Neon + Drizzle Usage:**
```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import * as schema from './schema';

// Initialize Neon client
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// Fetch providers with skills
const providers = await db.query.providerProfiles.findMany({
  where: eq(schema.providerProfiles.availabilityStatus, 'available'),
  with: {
    skills: true,
    serviceOfferings: true
  }
});

// Insert a new work request
const [request] = await db.insert(schema.workRequests).values({
  buyerZerobiasUserId: user.id,
  title: 'SOC 2 Assessment Support',
  category: 'assessor',
  budgetType: 'fixed',
  budgetMax: 5000
}).returning();
```

## UI/UX Design

### Design System

**Material-Based UI:**
- Use MUI (Material UI) or Radix primitives
- Consistent with modern SaaS marketplace aesthetics
- Accessible, responsive, professional

**Color Palette:**
- Primary: ZeroBias purple (`#667eea` to `#764ba2`)
- Secondary: Complementary blue (`#2563eb`)
- Success: Green for availability/active
- Neutral: Gray scales for content

### Key Pages

**1. Landing / Browse (`/`):**
- Hero section with value proposition
- Category navigation
- Featured providers
- Recent service offerings
- Search bar

**2. Provider Directory (`/providers`):**
- Grid/list toggle
- Filter sidebar (category, skills, availability, price range)
- Sort options (rating, price, response time)
- Provider cards with key info

**3. Provider Profile (`/providers/[id]`):**
- Profile header (avatar, name, headline, rating)
- About section
- Skills badges
- Service offerings list
- Reviews section
- Contact/Request button
- Availability calendar

**4. Service Catalog (`/services`):**
- Browse productized services
- Filter by category, price, delivery time
- Service cards with pricing

**5. Work Request (`/requests/new`):**
- Multi-step form
- Category selection
- Description with rich text
- Budget configuration
- Timeline selection
- Boundary selection (for ZeroBias integration)

**6. Dashboard (`/dashboard`):**
- Provider view: Active requests, earnings, profile stats
- Buyer view: Active requests, past work, spending

## Development

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env.local`:**
   ```
   # ZeroBias
   NEXT_PUBLIC_API_HOSTNAME=https://your-api-host/api
   NEXT_PUBLIC_IS_LOCAL_DEV=true
   ZEROBIAS_API_KEY=your-api-key-here

   # Neon Database
   DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/sme-mart?sslmode=require
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Access at:**
   ```
   http://localhost:3000
   ```

### Build Commands

```bash
npm run dev          # Development server (uses .env.local defaults)
npm run dev:ci       # Dev server → ZeroBias CI environment
npm run dev:qa       # Dev server → ZeroBias QA environment
npm run dev:prod     # Dev server → ZeroBias Production environment
npm run build        # Production build
npm run lint         # Run ESLint
```

### Environment Variables

**Required - ZeroBias:**
- `NEXT_PUBLIC_API_HOSTNAME` - ZeroBias API endpoint
- `NEXT_PUBLIC_IS_LOCAL_DEV` - Enable local dev mode
- `ZEROBIAS_API_KEY` - API key (server-only, injected by middleware)

**Required - Neon:**
- `DATABASE_URL` - Neon PostgreSQL connection string (pooled)

### Auth Modes (`NEXT_PUBLIC_AUTH_MODE`)

The app supports three authentication modes for local development, configured in `.env.local`:

| Mode | Value | Description |
|------|-------|-------------|
| **Mock** | `mock` | Fake user/org data, no ZeroBias connection needed. For rapid UI development. |
| **Proxy** | `proxy` | Real ZeroBias API calls proxied through Next.js rewrites. Requires valid `NEXT_PUBLIC_API_KEY`. |
| **Production** | `production` | Direct connection using session cookies. For deployed environments only. |

**Switching modes:** Edit `NEXT_PUBLIC_AUTH_MODE` in `.env.local` and restart the dev server.

**How proxy mode works:**

`next.config.ts` sets up rewrites so local requests get forwarded to the ZeroBias host (`NEXT_PUBLIC_ZEROBIAS_HOST`, defaults to `https://ci.zerobias.com`):

- `/api/:path*` → ZeroBias API
- `/dana/:path*` → Dana core API
- `/login/:path*` → Authentication
- `/session/:path*` → Session socket

The API key (`ZEROBIAS_API_KEY`) is injected as an `Authorization: APIKey ...` header server-side by Next.js middleware (`src/middleware.ts`), so it never reaches the browser bundle.

**How mock mode works:**

`src/context/ZeroBiasContext.tsx` returns hardcoded fake data:
- User: "Local Developer" (developer@example.com)
- Org: "Development Organization"
- Admin: true
- No ZeroBias connection required

### ZeroBias Environments

Each ZeroBias environment has its own API host and requires its own API key generated from that environment's ZeroBias app:

| Environment | Host | API Endpoint (path) | API Endpoint (subdomain) |
|-------------|------|---------------------|--------------------------|
| **DEV (CI)** | `ci.zerobias.com` | `ci.zerobias.com/api` | `api.ci.zerobias.com` |
| **QA** | `qa.zerobias.com` | `qa.zerobias.com/api` | `api.qa.zerobias.com` |
| **Production** | `app.zerobias.com` | `app.zerobias.com/api` | `api.app.zerobias.com` |

**API keys are per-environment.** Generate them from the ZeroBias app in each environment (e.g., log into `ci.zerobias.com` to generate a CI API key).

### Switching ZeroBias Environments

Per-environment config is stored in `.env.dev`, `.env.qa`, and `.env.prod`. Each file contains:
- `NEXT_PUBLIC_ZEROBIAS_HOST` - The ZeroBias host
- `NEXT_PUBLIC_API_HOSTNAME` - The API endpoint
- `NEXT_PUBLIC_API_KEY` - The API key for that environment

**Quick switch via npm scripts:**

```bash
npm run dev        # Uses defaults from .env.local (mock mode or whatever is configured)
npm run dev:ci     # Loads .env.dev overrides → points to ci.zerobias.com
npm run dev:qa     # Loads .env.qa overrides → points to qa.zerobias.com
npm run dev:prod   # Loads .env.prod overrides → points to app.zerobias.com
```

The `dev:ci/qa/prod` scripts use `dotenv-cli` to layer `.env.dev`/`.env.qa`/`.env.prod` on top of `.env.local`, so environment-specific values (host, API key) override the defaults while shared values (`DATABASE_URL`, `NEXT_PUBLIC_IS_LOCAL_DEV`, `NEXT_PUBLIC_AUTH_MODE`) come from `.env.local`.

**Setup:** Copy API keys into each env file after generating them:

```bash
# .env.dev  → set ZEROBIAS_API_KEY to your CI key
# .env.qa   → set ZEROBIAS_API_KEY to your QA key
# .env.prod → set ZEROBIAS_API_KEY to your prod key
```

**Note:** Set `NEXT_PUBLIC_AUTH_MODE=proxy` in `.env.local` when using `dev:ci/qa/prod` scripts, since you're connecting to a real ZeroBias environment.

## Best Practices

### DO

1. **Use ZeroBias for identity** - Never create separate auth
2. **Link data properly** - Store `zerobias_user_id` in Supabase tables
3. **Leverage boundaries** - All work scoped to ZeroBias boundaries
4. **Track in tasks** - Use ZeroBias Task system for work tracking
5. **Keep components focused** - Single responsibility
6. **Handle errors gracefully** - User-friendly messages
7. **Implement loading states** - Feedback during async ops
8. **Type everything** - Leverage TypeScript

### DON'T

1. **Don't duplicate auth** - ZeroBias is the auth source
2. **Don't store sensitive data in Supabase** - Use ZeroBias for secrets
3. **Don't skip RLS** - Enable Supabase row-level security
4. **Don't ignore accessibility** - Keyboard nav, ARIA labels
5. **Don't hardcode IDs** - Use environment variables

## Custom Login Package

SME Mart has a custom branded login page that integrates with ZeroBias authentication.

**Location:** `../../../../login/package/w3geekery` (i.e. `zerobias-org-forks/login/package/w3geekery`)

**Structure:**
```
login/package/w3geekery/
├── package.json                    # Uses @zerobias-com/dana-login-sdk@1.0.20
├── .npmrc                          # Registry config for ZeroBias scopes
└── src/
    ├── assets/
    │   ├── metadata.json           # Package metadata
    │   ├── custom.css              # SME Mart branded styles
    │   ├── translations/en_US.json # English translations
    │   └── visuals/
    │       ├── favicon.png
    │       └── powered-by-zb.png
    ├── partials/
    │   ├── head.hbs                # Inter font, custom CSS
    │   └── scripts.hbs             # Empty placeholder
    └── views/
        ├── login.hbs               # Login page template
        ├── session_expired.hbs
        ├── access_denied.hbs
        ├── request_access.hbs
        ├── shared_session.hbs
        └── eula.hbs
```

**Commands:**
```bash
cd ~/Projects/w3geekery/zerobias-org-forks/login/package/w3geekery

# Install (requires valid ZB_TOKEN)
ZB_TOKEN=<your-token> npm install

# Run locally on port 8080
npm run start
```

**Note:** The login package requires a valid `ZB_TOKEN` environment variable to install dependencies from the private ZeroBias npm registry.

## Project Reference Files

- **Why Hub Module?**: `.claude/docs/WHY_HUB_MODULE.md` - Why SME Mart needs a Hub Module for deployment
- **Generic SQL Hub Module**: `.claude/docs/GENERIC_SQL_HUB_MODULE.md` - Analysis of generic-sql as alternative/complement to custom Hub Module
- **Common Source Paths**: `.claude/docs/SOURCE_PATHS.md` - External repo locations and local directory conventions
- **Plans (public)**: `.claude/plans/public/` - Shared implementation plans
- **Plans (local)**: `.claude/plans/local/` - Local/draft plans
- **Notes**: `.claude/notes/` - Session notes and working docs
- **Hub Module (W3Geekery fork)**: `../../../../module` (i.e. `zerobias-org-forks/module`) - SME Mart Hub Module source (forked from `zerobias-org/module`, PRs go to `dev` branch)
- **Hub Source (ZeroBias)**: `~/zb-repos/hub/` - Hub server/node source for debugging connector issues

## AGENTS.md Reference

**IMPORTANT:** `AGENTS.md` contains canonical documentation for:
- **ZeroBias SDK** - Use `@zerobias-com/zerobias-sdk` as unified entry point, SDK service accessors, USAGE.md locations, and pattern file references
- **Next.js 15.5** - Local docs index in `.next-docs/`

Prefer retrieval-led reasoning over pre-training for any ZeroBias or Next.js tasks. Read `AGENTS.md` first.

## Related Documentation

- **Repository CLAUDE.md**: `../../CLAUDE.md`
- **Data Explorer patterns**: `../../zerobias/data-explorer/CLAUDE.md`
- **ZeroBias SDK**: See `AGENTS.md` for SDK documentation and patterns
- **Custom Login SDK**: `@zerobias-com/dana-login-sdk`
- **Neon Docs**: https://neon.tech/docs
- **Drizzle ORM**: https://orm.drizzle.team
- **MUI Docs**: https://mui.com/material-ui/

## Research References

- **Marketplace Plan**: `~/Projects/zerobias-com/repos/ui/.claude/plans/MARKETPLACE_TOOLS_CENTER.md` (external — zerobias-com repo)
- **Upwork Research**: `~/Projects/zerobias-com/repos/ui/.claude/plans/history/RESEARCH_UPWORK.md` (external — zerobias-com repo)
- **Whop Research**: `~/Projects/zerobias-com/repos/ui/.claude/plans/history/RESEARCH_WHOP.md` (external — zerobias-com repo)
- **VoltAgent**: https://voltagent.dev/ai-agent-marketplace/

## VoltAgent Marketplace Patterns

VoltAgent's AI agent marketplace provides useful patterns for SME Mart:

| VoltAgent Pattern | SME Mart Application |
|-------------------|---------------------|
| **Credit-based pricing** | Pay-per-task/consultation model |
| **Subscription tiers** | Monthly retainer packages |
| **Free tier** | Basic profile listing, limited visibility |
| **One-click integration** | Quick engagement via ZeroBias boundary invite |
| **Usage analytics** | Track jobs completed, ratings, response time |
| **Creator attribution** | Provider profiles with reputation building |
| **Community discovery** | Marketplace browse with ratings/reviews |

---

**Last Updated:** 2026-02-11
**Owner:** Clark / w3geekery
