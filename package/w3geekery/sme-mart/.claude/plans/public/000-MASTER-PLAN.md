# SME Mart Implementation Plan

**Project:** SME Mart - Compliance Talent Marketplace
**Owner:** Clark / w3geekery
**Status:** POC In Progress (Phases 0-3 complete, Phase 4 partial)
**Created:** 2026-01-23

---

## Progress Overview (Updated 2026-02-02)

| Phase | Description | Status |
|-------|-------------|--------|
| **0** | App Shell & Auth | ✅ Complete |
| **1** | Foundation (MVP) | ✅ Complete |
| **2** | Service Offerings | ✅ Complete |
| **3** | Engagement Flow | ⚠️ Proposals done; Tabs, Boundary, Task integration not started |
| **4** | Admin & Reviews | ⚠️ Reviews + categories done; Org mgmt + settings mocked |
| **5** | Dashboard & Polish | ❌ Not started |

**Remaining gaps (minor):**
- Mobile hamburger menu
- Pagination on list pages
- "Hire" button placeholder
- Phase 3.1.5 minimizable tabs not started
- Phase 3.2/3.3 ZeroBias Boundary/Task integration not started

---

## Executive Summary

SME Mart is a marketplace connecting compliance Subject Matter Experts (SMEs), talent, and task workers with organizations needing compliance-related services. Think "Upwork meets Whop" for the ZeroBias compliance ecosystem.

### Key Value Propositions

**For Providers (Supply):**
- List services and expertise to the compliance community
- Set your own pricing (hourly, fixed, subscription)
- Build reputation through ratings and completed work
- Secure work environment via ZeroBias Boundaries
- Track work and context via ZeroBias Task system

**For Buyers (Demand):**
- Find vetted compliance professionals
- Browse productized service offerings
- Request custom work with clear scoping
- Secure, boundary-scoped engagement
- Full audit trail of work performed

---

## CEO DIRECTIVE: ZeroBias Tasks & Boundaries Are Foundational

> **This is non-negotiable.** All SME Mart engagements must flow through ZeroBias Tasks and Boundaries.

### The Imperative

Brian (CEO) requires that ZeroBias Tasks carry the **complete audit trail** of every engagement:

| What Gets Tracked | Where It Lives |
|-------------------|----------------|
| **All dialog** | Task Comments (negotiations, clarifications, updates) |
| **Requirements** | Task Description + Custom Fields (scope, acceptance criteria) |
| **Transactions** | Task Custom Fields (rates, hours, payments, milestones) |
| **LLM prompts/output** | Task Comments with type tagging |
| **Documents** | Task Attachments (SOWs, deliverables, evidence) |

### Why This Matters

1. **Compliance**: Work happens in Boundaries for access control and audit isolation
2. **Dispute Resolution**: Complete history of every conversation and decision
3. **Trust**: Buyers and providers can see the full engagement record
4. **Platform Value**: ZeroBias becomes the system of record, not just auth

### Implementation Priority

```
Plan 010: Boundary Integration  ← DO THIS FIRST
    └── Plan 009: Tasks Integration  ← THEN THIS
            └── All other engagement features depend on these
```

**See:**
- `.claude/plans/local/010-zerobias-boundary-integration.md` - Boundary integration plan
- `.claude/plans/local/009-zerobias-tasks-integration.md` - Tasks integration plan
- `.claude/notes/CEO_NOTES.md` - CEO strategic notes and requirements

---

## Future Vision: Transparency Center

> **CEO Note (2026-02-06):** The Transparency Center is a strategic priority for trust and visibility between buyers and sellers.

Three components planned:

1. **Provider Internal Transparency Center** - NDA-gated sharing of Readiness Center data with specific buyers
2. **Shared Transparency Center** - Common view visible to both seller and buyer
3. **Buyer Transparency Management** - Buyer-defined requirements for what sellers must expose

**End-to-end audit goal:** Each Task audits the full chain from buy-side Boundary → seller stack → human desktop → agentic sessions.

See `.claude/notes/CEO_NOTES.md` for full details.

---

## Technology Decisions

### Stack Selection

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Framework** | Next.js 15 (App Router) | Modern React, SSR/SSG, proven in data-explorer |
| **UI Components** | MUI (Material UI) v6 | Free, comprehensive, professional look |
| **Styling** | SCSS Modules + MUI theming | Full SCSS features, scoped styles |
| **State** | React Context + TanStack Query | Simple global state + server state caching |
| **Auth** | ZeroBias Platform (direct SDKs) | Single source of identity |
| **Database** | Neon (Serverless PostgreSQL) | Branching, serverless, quick iteration |
| **ORM** | Drizzle ORM | Type-safe, lightweight, great DX |
| **ZeroBias SDKs** | `@zerobias-com/*` packages (direct) | No wrapper, direct API access |

### Why Neon + Drizzle for Extended Data?

The ZeroBias platform handles:
- Authentication and identity
- Organizations and boundaries
- Tasks and work tracking
- User profiles (basic)

But marketplace needs additional data not in ZeroBias:
- Provider profiles (extended - services, skills, hourly rates)
- Service offerings (productized services)
- Work requests and proposals
- Reviews and ratings
- Categories taxonomy

Neon + Drizzle provides:
- Serverless PostgreSQL with instant branching (dev/staging/prod)
- Type-safe schema with Drizzle ORM
- Quick schema iteration with migrations
- Standard PostgreSQL (easy to move if needed)

### Data Architecture: ZeroBias as Source of Truth

**Strong preference:** Use ZeroBias tables as source of truth wherever possible.

**Principles:**
1. **ZeroBias Catalog = Authoritative Data**
   - Products, Vendors, Suites (663+ products, 100+ vendors)
   - Frameworks (NIST, ISO, SOC2, etc.)
   - Segments (128 industry/category segments)
   - NICE Work Roles (95 roles, 7 categories)
   - NICE Skills (556) and Knowledge (640)

2. **Neon = SME Mart-Specific Data Only**
   - Provider profiles (marketplace-specific extensions)
   - Service offerings (productized services)
   - Work requests and proposals
   - Reviews and ratings
   - User-requested additions pending ZeroBias catalog inclusion

3. **Avoid Data Duplication**
   - Don't copy ZeroBias catalog data into Neon
   - Link to ZeroBias by ID (e.g., `zerobias_product_id`, `zerobias_framework_id`)
   - Query ZeroBias APIs for catalog data, store only user selections

4. **Temporary Tables (Performance Only)**
   - If needed for performance (e.g., reporting, complex joins), use Neon as temporary cache
   - Keep cache minimal and clearly marked as derived data
   - Prefer API calls over cached copies

**Benefits:**
- No stale data (ZeroBias catalog updates automatically available)
- No data synchronization complexity
- Single source of truth for compliance/security data
- Smaller Neon footprint (only marketplace-specific data)

**Example - Provider Skills:**
```
❌ BAD:  Copy skill name/description into Neon providerSkills table
✅ GOOD: Store zerobias_skill_id in providerSkills, fetch details from ZeroBias API
```

**Example - Framework Experience:**
```
❌ BAD:  Create local frameworks table mirroring ZeroBias
✅ GOOD: Store provider's selected framework IDs, query ZeroBias for display
```

### Direct SDK Usage (No Wrapper)

We use `@zerobias-com/*` SDKs directly without the `zb-client-lib-js` wrapper:
- More control over initialization
- Simpler dependency chain
- Direct access to typed API clients
- Easier debugging

---

## Phase 0: App Shell & Authentication ✅ COMPLETE

**Goal:** Authenticated app shell with navigation and user menu

### 0.1 ZeroBias Authentication ✅

**Tasks:**
- [x] Implement ZeroBias platform authentication (single auth source for all app access)
- [x] Create auth context/provider for app-wide access
- [x] Handle session management and token refresh
- [x] Implement admin role detection (ZeroBias admin check)
- [x] Install `@zerobias-com/zerobias-client` (consolidated SDK)
- [x] Install peer deps: `axios`, `rxjs`
- [x] Create `lib/zerobias.ts` for SDK initialization (singleton pattern)
- [x] Create `ZeroBiasContext` provider (no wrapper pattern)
- [x] Three auth modes: mock, proxy, production
- [x] Server-side admin guard (`lib/admin-auth.ts`)
- [x] Impersonation support (dev-only)

**Deliverables:** ✅ All complete

### 0.2 App Top Bar Component ✅

**Tasks:**
- [x] Create `AppTopBar` component with branding (Storefront icon + "SME Mart")
- [x] Center navigation: Providers, Services, Requests
- [x] User profile dropdown on upper right
- [x] Active route highlighting

**Note:** Mobile hamburger menu not implemented (nav hidden on small screens)

### 0.3 User Profile Dropdown Component ✅

**Tasks:**
- [x] User avatar and name display
- [x] Edit Profile link → `/my-profile`
- [x] App Administration link (admins only) → `/admin`
- [x] Light/Dark Theme toggle
- [x] Logout
- [x] Admin menu conditional visibility

---

## Phase 1: Foundation (MVP) ✅ COMPLETE

**Goal:** Basic marketplace browse and provider profiles

### 1.1 Project Setup ✅

**Tasks:**
- [x] Initialize Next.js 15 project with App Router
- [x] Configure TypeScript
- [x] Set up MUI v7 with custom theme
- [x] Configure environment variables (ZeroBias + Neon)
- [x] Set up next.config files for dev/qa/prod
- [x] Create project structure
- [x] Environment scripts: `dev`, `dev:ci`, `dev:qa`, `dev:prod`

### 1.2 ZeroBias Integration (Direct SDKs) ✅

- [x] User/org retrieval working
- [x] Auth flow verified across mock/proxy/production modes

### 1.3 Neon + Drizzle Setup ✅

- [x] Neon project created
- [x] `@neondatabase/serverless` + `drizzle-orm` + `drizzle-kit` installed
- [x] Schema (`lib/db/schema.ts`): 7 tables with enums and relations
- [x] Client (`lib/db/index.ts`): Neon HTTP driver
- [x] Seed data (`lib/db/seed.ts`): 5 providers, skills, services, reviews, 27 categories
- [x] Records linked to ZeroBias user IDs

### 1.4 Provider Profiles ✅

- [x] `provider_profiles` + `provider_skills` tables
- [x] Provider detail page (`/providers/[providerId]`)
- [x] Skills chips with proficiency/years
- [x] Profile auto-created on first access (upsert pattern)

### 1.5 User Profile Page (Editable) ✅

- [x] **1.5.1 Profile Section** — Editable: headline, about, hourly rate, availability, response time
- [x] **1.5.2 Skills Section** — Add/delete skills with proficiency, years, category
- [x] **1.5.3 Service Offerings Section** — Add/delete service offerings with full details
- [x] **1.5.4 Work Request Summary** — Shows open/in_progress/completed counts (mock data in UI, not wired to real API yet)
- [x] **1.5.5 Reviews Summary** — Approved/pending counts, link to moderate reviews page

**Completed gaps (2026-02-02):**
- [x] Skill editing — click skill chip to edit
- [x] Service offering editing — click edit icon to edit
- [x] Work request summary wired to real `/api/requests` data

### 1.6 Marketplace Browse ✅

- [x] Landing page with hero, category cards, featured providers
- [x] Provider directory (`/providers`) with search, category filter, availability filter, sorting
- [x] `ProviderCard` component
- [x] Provider detail page with profile, skills, services, reviews

**Completed gaps (2026-02-02):**
- [x] Landing page search bar wired to navigate to `/providers?search=...`

**Remaining minor gaps:**
- [ ] Pagination (currently loads all results)

---

## Phase 2: Service Offerings ✅ COMPLETE

**Goal:** Productized services and work requests

### 2.1 Service Offerings ✅

- [x] `service_offerings` table with pricing types
- [x] `ServiceCard` component
- [x] Service catalog page (`/services`) with search, category filter, pricing filter, sorting
- [x] Service creation via My Profile page
- [x] API: `GET /api/services`

### 2.2 Categories Taxonomy ✅

- [x] `categories` table with hierarchy (parentId)
- [x] 7 top-level + ~20 subcategories seeded
- [x] Category filter chips on providers, services, requests pages
- [x] Admin CRUD for categories

### 2.3 Work Requests ✅

- [x] `work_requests` table
- [x] Request creation form (`/requests/new`) — title, description, category, budget, timeline
- [x] `RequestCard` component
- [x] Request browse page (`/requests`) with search, category filter, status filter, sorting
- [x] Request detail page (`/requests/[requestId]`)
- [x] Status workflow: open → in_progress → completed/cancelled
- [x] API: `GET/POST /api/requests`, `GET/PUT /api/requests/[id]`

**Completed gaps (2026-02-02):**
- [x] Seed data for work requests + proposals (5 requests, 8 proposals)

---

## Phase 3: Engagement Flow ✅ MOSTLY COMPLETE

**Goal:** Connect providers and buyers, track work

### 3.1 Proposals ✅

- [x] `proposals` table with status workflow
- [x] `ProposalForm` component (dialog on request detail page)
- [x] `ProposalCard` component showing proposal details
- [x] Proposal review UI for buyers (accept/reject buttons)
- [x] Provider can withdraw proposals
- [x] Accepting proposal auto-sets request to `in_progress`
- [x] Duplicate proposal prevention
- [x] API: `POST /api/proposals`, `PUT /api/proposals/[id]`

**Completed gaps (2026-02-02):**
- [x] Seed data for proposals (8 proposals across 5 requests)

### 3.1.5 Proposals & Work Requests Tabs — NOT STARTED

- [ ] Minimizable proposals tab on profile page
- [ ] Minimizable work requests tab on profile page
- [ ] localStorage state persistence
- [ ] Notification badges

### 3.2 ZeroBias Boundary Integration — NOT STARTED

- [ ] Boundary selection in work request form
- [ ] Boundary invite flow on proposal acceptance
- [ ] Boundary status display

### 3.3 ZeroBias Task Integration — NOT STARTED

- [ ] Task creation on work start
- [ ] Link `work_requests.zerobias_task_id`
- [ ] Task status display in request detail

---

## Phase 4: Admin & Reviews ⚠️ PARTIALLY COMPLETE

**Goal:** Admin management and trust through ratings

### 4.0 Admin Page ✅ (mostly)

**Route:** `/admin` — admin guard checks `isAdmin` from ZeroBiasContext

- [x] Admin route guard
- [x] Dashboard layout with 5 tabs + stats cards

#### 4.0.1 Category Management ✅
- [x] Category CRUD (add/edit/delete)
- [x] Hierarchical tree view with parent/child
- [x] API: `GET/POST /api/admin/categories`, `PUT/DELETE /api/admin/categories/[id]`

**Remaining gaps:**
- [ ] Drag-and-drop reordering (UI handles present, logic missing)

#### 4.0.2 Review Moderation ✅
- [x] List all reviews across providers
- [x] Filter by status (pending/approved/rejected)
- [x] Search reviews
- [x] Bulk approve/reject
- [x] Review detail dialog
- [x] API: `GET/PUT /api/admin/reviews`

#### 4.0.3 Organization Management — MOCKED
> Shows placeholder data with disclaimer. Waiting for Clark's requirements re: `org_profiles` table.

#### 4.0.4 App Settings — MOCKED
> Shows placeholder toggles with disclaimer. Waiting for Clark's requirements re: ZeroBias PKV integration.

### 4.1 Reviews System ✅

- [x] `reviews` table with `approved` boolean, `approvedAt`, `approvedBy`
- [x] Review submission form (on provider detail page)
- [x] Only approved reviews shown on public provider profile
- [x] Provider review moderation page (`/my-profile/moderate-reviews`)
- [x] Admin review moderation (in admin page)
- [x] API: `GET/PUT /api/profile/reviews`, `POST /api/providers/[id]/reviews`

### 4.2 Provider Stats — PARTIAL

- [x] `total_jobs_completed` and `total_earnings` fields in schema
- [x] Stats displayed on provider profile and detail page
- [ ] Stats not auto-updated (static seed values, no trigger on job completion)
- [ ] Response time metric not calculated

---

## Phase 5: Dashboard & Polish

**Goal:** User dashboards and UX refinement

### 5.1 Provider Dashboard

**Tasks:**
- [ ] Active requests overview
- [ ] Proposal status list
- [ ] Earnings summary (if enabled)
- [ ] Profile completeness indicator
- [ ] Quick actions (edit profile, view requests)

### 5.2 Buyer Dashboard

**Tasks:**
- [ ] Active work requests
- [ ] Proposal review queue
- [ ] Past engagements
- [ ] Spending summary
- [ ] Quick actions (post request, browse providers)

### 5.3 UX Polish

**Tasks:**
- [ ] Loading states throughout
- [ ] Error handling and messages
- [ ] Empty states with guidance
- [ ] Mobile responsiveness
- [ ] Keyboard navigation
- [ ] Accessibility audit

---

## Future Phases (Post-MVP)

### Phase 6: Billing Integration

- Payment processing (Stripe Connect?)
- Escrow for fixed-price work
- Automatic invoicing
- Mercury banking integration (ZeroBias roadmap)

### Phase 7: Agent Marketplace

- AI agent publishing (VoltAgent pattern)
- API key-based billing
- Usage metering
- Agent discovery and ratings

### Phase 8: Advanced Features

- Availability calendar
- Video call integration
- Direct messaging
- Saved searches / favorites
- Provider verification badges
- Affiliate/referral program

---

## Database Schema Summary (Drizzle)

### Core Tables

```typescript
// See CLAUDE.md for full Drizzle schema definition

providerProfiles       // Extends ZeroBias User with marketplace data
providerSkills         // Skills/expertise tags per provider
serviceOfferings       // Productized services (Upwork Project Catalog pattern)
workRequests           // Job postings from buyers (Upwork pattern)
proposals              // Provider bids on requests (Upwork pattern)
reviews                // Ratings and feedback with approval workflow
categories             // Taxonomy with hierarchy (Whop pattern)
```

### Schema Updates Required

**reviews table additions:**
```typescript
reviews: {
  // ... existing fields ...
  approved: boolean,           // Default false - requires provider/admin approval
  approved_at: timestamp,      // When review was approved
  approved_by: text,           // ZeroBias user ID of approver (provider or admin)
}
```

### Key Patterns from Research

| Pattern | Source | Implementation |
|---------|--------|----------------|
| **Project Catalog** | Upwork | `serviceOfferings` - fixed-price productized services |
| **Proposal Flow** | Upwork | `proposals` with cover letter, price, timeline |
| **Credit-based Pricing** | VoltAgent | `pricingType` enum supports subscription model |
| **Gated Communities** | Whop | ZeroBias Boundaries for secure work |
| **Creator Attribution** | VoltAgent | Provider profiles with stats and reputation |

---

## API Architecture

### Next.js API Routes (Server Actions + Route Handlers)

Marketplace data via Drizzle (server-side only):
```typescript
// app/api/providers/route.ts
export async function GET() {
  const providers = await db.query.providerProfiles.findMany({
    with: { skills: true, serviceOfferings: true }
  });
  return Response.json(providers);
}

// Or use Server Actions for mutations
'use server'
export async function createServiceOffering(data: ServiceOfferingInput) {
  const [offering] = await db.insert(serviceOfferings).values(data).returning();
  return offering;
}
```

### ZeroBias Platform API (Direct SDK)

```typescript
// Via @zerobias-com/dana-sdk
danaClient.getMeApi().whoAmI()
danaClient.getOrgApi().listOrgs()
danaClient.getOrgApi().selectOrg(orgId, hostname)

// Via @zerobias-com/platform-sdk
platformClient.getBoundaryApi().listBoundaries()
platformClient.getBoundaryApi().inviteToBoundary(boundaryId, invite)
platformClient.getTaskApi().createTask(task)
platformClient.getTaskApi().listTasks()
```

---

## Component Hierarchy

```
App
├── Layout
│   ├── AppTopBar
│   │   ├── AppLogo (left)
│   │   ├── AppName (left)
│   │   └── UserProfileDropdown (right)
│   │       ├── UserAvatar
│   │       ├── UserName
│   │       ├── LoginMenuItem (if not auth)
│   │       ├── EditProfileMenuItem
│   │       ├── AppAdminMenuItem (admins only)
│   │       ├── ThemeToggleMenuItem
│   │       └── LogoutMenuItem
│   ├── Main Content
│   └── Footer
├── Pages
│   ├── / (Landing)
│   │   ├── Hero
│   │   ├── CategoryNav
│   │   ├── FeaturedProviders
│   │   └── RecentServices
│   ├── /providers
│   │   ├── SearchFilters (sidebar)
│   │   └── ProviderGrid
│   │       └── ProviderCard[]
│   ├── /providers/[id]
│   │   ├── ProviderProfile
│   │   ├── SkillsBadges
│   │   ├── ServiceOfferings
│   │   └── ReviewsSection (approved reviews only)
│   ├── /services
│   │   ├── CategoryNav
│   │   └── ServiceGrid
│   │       └── ServiceCard[]
│   ├── /requests
│   │   └── RequestList
│   │       └── RequestCard[]
│   ├── /requests/new
│   │   └── RequestForm (multi-step)
│   ├── /my-profile (authenticated user's profile)
│   │   ├── ProposalsTab (top, minimizable)
│   │   │   └── ProposalList
│   │   ├── ProfileSection (editable)
│   │   │   └── ProfileForm
│   │   ├── SkillsSection (editable)
│   │   │   └── SkillsList
│   │   │       └── SkillItem (add/edit/delete)
│   │   ├── ServiceOfferingsSection (editable)
│   │   │   └── ServiceOfferingsList
│   │   │       └── ServiceOfferingItem (add/edit/delete)
│   │   ├── WorkRequestSummarySection
│   │   │   └── WorkRequestStats
│   │   ├── ReviewsSummarySection
│   │   │   ├── ApprovedReviewsList
│   │   │   └── ReviewModerationButton
│   │   └── WorkRequestsTab (bottom, minimizable)
│   │       └── WorkRequestList (linked to ZeroBias Tasks)
│   ├── /my-profile/moderate-reviews
│   │   └── ReviewModerationList
│   │       └── ReviewModerationItem (approve/reject)
│   ├── /dashboard
│   │   ├── ProviderStats
│   │   ├── ActiveRequests
│   │   └── RecentActivity
│   ├── /dashboard/provider
│   │   ├── ProfileCompleteness
│   │   ├── ProposalQueue
│   │   └── EarningsChart
│   └── /admin (ZeroBias admins only)
│       ├── AdminDashboard
│       ├── CategoryManagement
│       │   ├── CategoryList
│       │   ├── CategoryForm (add/edit)
│       │   └── CategoryTreeView (hierarchical)
│       └── ReviewModeration
│           ├── ReviewModerationFilters
│           └── AllReviewsList
│               └── AdminReviewItem (approve/reject)
└── Contexts
    ├── ZeroBiasContext (direct SDK)
    ├── AuthContext (user, isAdmin)
    ├── ThemeContext
    └── MarketplaceContext
```

---

## Environment Variables

```bash
# ZeroBias Platform
NEXT_PUBLIC_API_HOSTNAME=https://api.zerobias.com
NEXT_PUBLIC_IS_LOCAL_DEV=true
NEXT_PUBLIC_API_KEY=your-api-key

# Neon Database
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/sme-mart?sslmode=require

# App Config
NEXT_PUBLIC_APP_URL=https://app.zerobias.com/sme-mart
NEXT_PUBLIC_BASE_PATH=/sme-mart
```

---

## Success Metrics

### Phase 1 (MVP)
- [ ] 5+ provider profiles created
- [ ] Provider search working
- [ ] Categories browsable
- [ ] Mobile-responsive design

### Phase 2-3
- [ ] 10+ service offerings listed
- [ ] 3+ work requests posted
- [ ] 1+ proposal accepted
- [ ] ZeroBias boundary integration working

### Phase 4-5
- [ ] Reviews being submitted
- [ ] Dashboard analytics useful
- [ ] User feedback positive

---

## Hub Module Strategy

### Current Status (2026-02-02)

The publishing path for the custom W3Geekery Hub Module is **not currently working** for Dev/QA/Prod environments. Until that's resolved, we continue developing features locally using Next.js API routes.

### Parallel Development Approach

As we build out each feature with local API routes, we also track what needs to migrate to the Hub Module for QA/production releases:

- **Every new API route** = a future Hub Module endpoint
- **Every Drizzle query** = future Hub Module producer logic
- **Every admin check** = future Hub Module authorization

When the Hub publishing pipeline is resolved, migration will be straightforward because the API surface is already defined by the local routes.

### Generic SQL Hub Module

`@auditlogic/module-auditmation-generic-sql-client-ts` is an existing generic SQL Hub Module that could complement (not replace) our custom module. See `.claude/docs/GENERIC_SQL_HUB_MODULE.md` for full analysis.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **ZeroBias SDK changes** | Pin versions, follow release notes |
| **Neon connection limits** | Use pooled connection string, monitor usage |
| **Data sync issues** | Use zerobias_user_id as foreign key, validate on write |
| **Scope creep** | Strict MVP focus, defer features to future phases |
| **Auth complexity** | Keep ZeroBias as single auth source, direct SDK usage |
| **Schema migrations** | Use Drizzle Kit for type-safe migrations |
| **Hub Module publishing** | Develop locally with API routes; track Hub Module migration needs per feature |

---

## Development Workflow

1. **Local Development**
   - Run Next.js dev server
   - Connect to Supabase dev project
   - Use ZeroBias API key for auth

2. **Testing**
   - Test in QA environment
   - Verify ZeroBias integration
   - Test boundary/task creation

3. **Deployment**
   - PR to `dev` branch → deploys to dev.zerobias.com/sme-mart
   - PR to `qa` branch → deploys to qa.zerobias.com/sme-mart
   - PR to `main` branch → deploys to app.zerobias.com/sme-mart

---

## Initial Users (MVP Testing)

From MARKETPLACE_TOOLS_CENTER.md:
- Brian / Health Innovative
- Clark / Clark Inc
- Dan
- Catalin
- Andrey
- Daniel

---

## Periodic Checks / TODOs

> Items to check periodically as ZeroBias platform evolves.

### Service Segments Migration (Check Monthly)

**Status:** Using tags API (`service-segment` tag type) as temporary solution.

**Background:** SME Mart needs professional service categories (e.g., SOC, Pentesting, Compliance, Risk Assessment, Training). The ZeroBias segment taxonomy is primarily product/tool categories. The proper approach is to use `platform.Segment.list` and filter by `isService: true`, but as of 2026-02-04 only 2 infrastructure service segments exist (Package Hosting Service, Development Environment Service).

**Current implementation:**
- `GET /api/catalog?type=serviceSegments` → uses `/api/platform/tags?tagTypes=service-segment`
- Returns 9 service categories: bdr, comms, compliance, it, noc, pentesting, risk, soc, training

**Migration path:** When ZeroBias populates service segments in the catalog:
1. Check `platform.Segment.list` for segments where `latestVersion.isService === true`
2. If professional service categories exist (not just infrastructure services), update:
   - `src/app/api/catalog/route.ts` - switch `serviceSegments` case to use segment list endpoint
   - `src/hooks/useZeroBiasCatalog.ts` - update `ServiceSegment` interface if needed
3. Test that all current tag-based categories have equivalent segments

**Files affected:**
- `src/app/api/catalog/route.ts` (serviceSegments case)
- `src/hooks/useZeroBiasCatalog.ts` (ServiceSegment interface, useServiceSegments hook)

---

## ZeroBias Catalog Data (as of 2026-02-03)

Data available from ZeroBias platform APIs for profile panels:

| Type | Count | API Endpoint | Use Case |
|------|-------|--------------|----------|
| **Products** | 663 | `POST /portal/productSearch` | Product Experience panel |
| **Vendors** | 438 | `GET /platform/catalog/vendors` | Group products by vendor |
| **Suites** | varies | (included in product data) | Group products by suite (AWS, GCP, etc.) |
| **Segments** | 128 | `GET /platform/catalog/segments` | Industry/category tags |
| **Service Segments** | 9 | `GET /platform/tags?tagTypes=service-segment` | Professional service categories (temp - see Periodic Checks) |
| **Frameworks** | 12 | `GET /platform/catalog/frameworks` | Framework Experience panel |
| **NICE Work Roles** | 95 | `GET /platform/catalog/roles` | Provider role selection |
| **NICE Role Categories** | 7 | `GET /platform/catalog/roleCategories` | Group roles by category |
| **NICE Skills (S####)** | 556 | `GET /platform/catalog/roleQualifications?qualificationType=skill` | Skills panel |
| **NICE Knowledge (K####)** | 640 | `GET /platform/catalog/roleQualifications?qualificationType=knowledge` | Knowledge panel (optional) |

**Top Product Vendors:** Amazon (235), Microsoft (159), Google (99), Tenable (9), GitHub (6)

**Key Frameworks:** NIST-800-53, ISO-27001, SOC2, NIST-CSF, FedRAMP, CMMC, CIS-Controls

**Segment Examples:** SIEM, EDR, CSPM, IAM, SAST, SCA, CI/CD, API Security, Cloud Security

---

## Ideas / Feature Proposals

> Features under consideration for future phases. See `.claude/ideas/` for detailed proposals.

| ID | Feature | Status | Description |
|----|---------|--------|-------------|
| [001](../../ideas/001-resume-import.md) | Resume Import | Proposal | Analyze resume/CV to auto-populate profile with roles, skills, frameworks, products |

---

## Design Documents

> Detailed design docs for major features. See `.claude/plans/public/` for full documents.

| Doc | Topic | Status |
|-----|-------|--------|
| [008-engagement-lifecycle.md](./008-engagement-lifecycle.md) | End-to-end engagement flow (buyer & provider journeys, payments, contracts) | Planning |

---

## References

- **CLAUDE.md**: Project documentation and architecture
- **MARKETPLACE_TOOLS_CENTER.md**: Original planning doc
- **RESEARCH_UPWORK.md**: Upwork marketplace patterns
- **RESEARCH_WHOP.md**: Whop marketplace patterns
- **VoltAgent**: https://voltagent.dev/ai-agent-marketplace/
- **Neon Docs**: https://neon.tech/docs
- **Drizzle ORM**: https://orm.drizzle.team
- **MUI v6**: https://mui.com/material-ui/

### UI Component References (ZeroBias Portal)

**App Top Bar:**
- `~/zb-repos/ui/projects/portal/src/app/portal/components/auditmation-default-app-bar/` (external — zerobias-com UI repo)
- Key features: App logo/name (left), navigation tabs, search button (right)

**User Profile Dropdown:**
- `~/zb-repos/ui/projects/portal/src/app/portal/components/auditmation-user/` (external — zerobias-com UI repo)
- Key features:
  - User avatar and name with org
  - Organization switcher
  - Theme toggle (`dark_mode` icon with `toggle_on`/`toggle_off`)
  - Menu items: Request Help, Manage Orgs, Create API Key, Share Session, About, Logout
  - Uses `mat-menu-item` with icons for menu items
  - Uses `ThemeService.toggle()` for theme switching

---

**Next Steps:**
1. Review and approve this plan
2. Implement App Shell & Authentication (Phase 0)
   - Build `AppTopBar` component
   - Build `UserProfileDropdown` component (reference: `auditmation-user`)
   - Implement ZeroBias authentication
3. Set up project scaffolding (Phase 1.1)
4. Implement ZeroBias integration (Phase 1.2)
5. Create Neon project and schema (Phase 1.3)
6. Build user profile page with editable sections (Phase 1.5)
7. Add Proposals/Work Requests minimizable tabs (Phase 3.1.5)
8. Build Admin page (Phase 4.0)


# Roadmap Notes

> Future planning — to be fleshed out in subsequent phases.

### Vendor/Provider Guild — Community Contributions & Trust

- **Dual-level tracking**: Contributions are tracked both within the **Vendor/Provider Guild** (community space) AND on the **service provider's org/company profile** in the marketplace.
- **Purpose**: Drive visible value and trust around a provider's platform competencies.
- **Example**: A provider contributes a compliance template in the Guild → that contribution appears on their SME Mart profile as proof of expertise, boosting buyer confidence.

### Pricing Toolkit & Task-Based Billing

- **Task system as billing foundation**: Every ZeroBias Task carries attributes (hours, deliverables, context, security scope) that serve as **billing building blocks**.
- **Cost transparency**: Each task displays its cost so buyers see the full picture — what the task involves, the security context it runs in, and how much it costs.
- **Aggregation via billing module**: The service provider org aggregates task costs through a billing module in the marketplace.
- **Platform fee model (App Store %)**: ZeroBias takes a percentage of total transaction value as a platform fee, similar to the App Store revenue model.
- **Flow**: `Task (with cost) → Provider invoice → Billing module → Platform takes % fee → Provider receives remainder`

### LLM Agent / MCP Integration

- **No separate MCP needed**: ZeroBias MCP server can already call any Hub Module API endpoints, including SME Mart's Hub Module
- **User setup**: Site users just configure the ZeroBias MCP - it provides access to all platform capabilities including SME Mart
- **SME Mart Hub Module endpoints** (exposed via ZeroBias MCP):
  - Search providers by skills, roles, frameworks, segments
  - Browse service offerings
  - Create/manage work requests
  - Submit proposals (for provider agents)
  - Query marketplace stats and analytics
- **Use cases**:
  - AI assistants that help buyers find the right compliance expert
  - Provider agents that can respond to relevant work requests
  - Automated matching based on project requirements
  - Natural language interface to marketplace search
- **Depends on**: SME Mart Hub Module deployment (see Hub Module Strategy section)


---

**Last Updated:** 2026-02-04
