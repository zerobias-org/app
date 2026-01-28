# SME Mart Implementation Plan

**Project:** SME Mart - Compliance Talent Marketplace
**Owner:** Clark / w3geekery
**Status:** POC Planning
**Created:** 2026-01-23

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

### Direct SDK Usage (No Wrapper)

We use `@zerobias-com/*` SDKs directly without the `zb-client-lib-js` wrapper:
- More control over initialization
- Simpler dependency chain
- Direct access to typed API clients
- Easier debugging

---

## Phase 0: App Shell & Authentication

**Goal:** Authenticated app shell with navigation and user menu

### 0.1 ZeroBias Authentication

**Tasks:**
- [ ] Implement ZeroBias platform authentication (single auth source for all app access)
- [ ] Create auth context/provider for app-wide access
- [ ] Handle session management and token refresh
- [ ] Implement admin role detection (ZeroBias admin check)
- [ ] Install `@zerobias-com/dana-sdk`, `@zerobias-com/platform-sdk`
- [ ] Install peer deps: `axios`, `rxjs`, `@zerobias-org/types-core-js`
- [ ] Create `lib/zerobias-clients.ts` for SDK initialization
- [ ] Create `ZeroBiasContext` provider (no wrapper pattern)

**Deliverables:**
- Users can login via ZeroBias credentials
- Auth state available throughout app
- Admin role detection working

### 0.2 App Top Bar Component

**Reference:** `~/zb-repos/ui/projects/portal/src/app/portal/components/auditmation-default-app-bar/`

**Tasks:**
- [ ] Create `AppTopBar` component with:
  - App name & logo on left side
  - User profile dropdown on upper right
- [ ] Implement responsive design for the top bar
- [ ] Add navigation tabs (if applicable)

**Deliverables:**
- App top bar with branding
- Consistent header across all pages

### 0.3 User Profile Dropdown Component

**Reference:** `~/zb-repos/ui/projects/portal/src/app/portal/components/auditmation-user/`

**Tasks:**
- [ ] Create `UserProfileDropdown` component with:
  - User avatar and name display
  - **Login** - link to ZeroBias login (if not authenticated)
  - **Edit Profile** - navigate to profile edit page
  - **App Administration** - visible only for ZeroBias admins
  - **Light/Dark Theme** toggle (with toggle icon like `auditmation-user`)
  - **Logout** - sign out of ZeroBias
- [ ] Implement theme toggle using theme service
- [ ] Admin menu item conditional visibility based on user role

**Deliverables:**
- Dropdown menu with all menu items
- Theme toggle working
- Admin menu conditionally visible

---

## Phase 1: Foundation (MVP)

**Goal:** Basic marketplace browse and provider profiles

### 1.1 Project Setup

**Tasks:**
- [ ] Initialize Next.js 15 project with App Router
- [ ] Configure TypeScript strict mode
- [ ] Install and configure SCSS (`sass` package)
- [ ] Set up MUI v6 with custom theme
- [ ] Configure environment variables (ZeroBias + Neon)
- [ ] Set up next.config files for dev/qa/prod
- [ ] Create basic project structure
- [ ] Set up global SCSS variables and mixins

**Deliverables:**
- Working dev server
- Build scripts for all environments
- Basic layout with header/footer
- SCSS architecture in place

### 1.2 ZeroBias Integration (Direct SDKs)

**Tasks:**
- [ ] Test user/org retrieval via `getMeApi()` and `getOrgApi()`
- [ ] Verify auth flow from Phase 0

**Deliverables:**
- Authenticated user access via direct SDK
- Organization context available
- API clients accessible from context

### 1.3 Neon + Drizzle Setup

**Tasks:**
- [ ] Create Neon project and database
- [ ] Install `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`
- [ ] Create Drizzle schema (`lib/db/schema.ts`)
- [ ] Set up Drizzle client (`lib/db/index.ts`)
- [ ] Generate and run initial migration
- [ ] Test connection and basic queries
- [ ] Link records to ZeroBias user IDs

**Deliverables:**
- Database tables created via Drizzle migration
- Type-safe queries working
- Connection pooling configured

### 1.4 Provider Profiles

**Tasks:**
- [ ] Create `provider_profiles` table
- [ ] Create `provider_skills` table
- [ ] Build `ProviderProfile` component
- [ ] Build `SkillsBadges` component
- [ ] Implement "become a provider" flow

**Deliverables:**
- Profiles display on detail page
- Skills are taggable and searchable

### 1.5 User Profile Page (Editable)

**Goal:** Authenticated user can view and edit their own provider profile

**Sections:**

#### 1.5.1 Profile Section
- [ ] Build editable profile form (from `provider_profiles` table)
  - Display name, headline, about, avatar
  - Hourly rate, availability status, response time
- [ ] Save changes to Neon database
- [ ] Link to ZeroBias user ID

#### 1.5.2 Skills Section
- [ ] Display list of skills from `provider_skills` table
- [ ] Add new skill (name, category, proficiency level, years experience)
- [ ] Edit existing skills
- [ ] Delete skills
- [ ] Skill proficiency levels: beginner, intermediate, expert

#### 1.5.3 Service Offerings Section
- [ ] Display service offerings from `service_offerings` table
- [ ] Add/edit/delete service offerings
- [ ] Pricing type selection (fixed, hourly, subscription, custom)

#### 1.5.4 Work Request Summary Section
- [ ] Display summary of work requests tied to user
- [ ] Show status breakdown (open, in_progress, completed, cancelled)
- [ ] Quick stats (total requests, completion rate)

#### 1.5.5 Reviews Summary Section
- [ ] Display **approved reviews only** on public profile
- [ ] Provider can moderate reviews (approve/reject)
- [ ] Click edit button to open review moderation view
- [ ] Only show reviews with `approved = true` status

**Deliverables:**
- Full editable profile page for authenticated users
- All sections editable inline or via modals
- Review moderation workflow for providers

### 1.6 Marketplace Browse

**Tasks:**
- [ ] Create marketplace landing page
- [ ] Build `ProviderCard` component
- [ ] Build `ProviderGrid` component
- [ ] Implement provider search/filter
- [ ] Create `CategoryNav` component
- [ ] Add pagination

**Deliverables:**
- Browse all providers
- Filter by category/skill
- Search by name/keyword
- Click through to provider detail

---

## Phase 2: Service Offerings

**Goal:** Productized services and work requests

### 2.1 Service Offerings

**Tasks:**
- [ ] Create `service_offerings` table
- [ ] Build `ServiceCard` component
- [ ] Build `ServiceGrid` component
- [ ] Create service offering form
- [ ] Add pricing display (fixed/hourly/custom)
- [ ] Implement service categories

**Deliverables:**
- Providers can list services
- Services browsable in catalog
- Clear pricing displayed

### 2.2 Categories Taxonomy

**Tasks:**
- [ ] Create `categories` table with hierarchy support
- [ ] Seed initial categories (Assessor, Advisor, Agentic, SecOps, etc.)
- [ ] Build category navigation UI
- [ ] Implement category filtering

**Categories Structure:**
```
- Assessors
  - SOC 2 Assessors
  - ISO 27001 Auditors
  - HITRUST Assessors
  - PCI-DSS QSAs
- Advisors
  - GRC Consultants
  - Privacy Advisors
  - Risk Analysts
- Agentic
  - AI Agent Builders
  - Prompt Engineers
  - Automation Specialists
- SecOps
  - Security Analysts
  - Incident Responders
  - Threat Hunters
- DevSecOps
  - Secure SDLC
  - CI/CD Security
  - Container Security
- Data Services
  - Evidence Collection
  - Data Entry
  - Documentation
- Training
  - Compliance Training
  - Certification Prep
  - Awareness Programs
```

### 2.3 Work Requests

**Tasks:**
- [ ] Create `work_requests` table
- [ ] Build work request form (multi-step)
- [ ] Build `RequestCard` component
- [ ] Create buyer request dashboard
- [ ] Implement request status workflow

**Deliverables:**
- Buyers can post work requests
- Requests visible to providers
- Status tracking (open → in_progress → completed)

---

## Phase 3: Engagement Flow

**Goal:** Connect providers and buyers, track work

### 3.1 Proposals

**Tasks:**
- [ ] Create `proposals` table
- [ ] Build `ProposalForm` component
- [ ] Build proposal review UI for buyers
- [ ] Implement accept/reject workflow
- [ ] Notify providers of decisions

**Deliverables:**
- Providers can submit proposals
- Buyers can review and accept
- Status updates on both sides

### 3.1.5 Proposals & Work Requests Tabs

**Goal:** Minimizable tabs for quick access to proposals and work requests

**Tasks:**
- [ ] Create **Proposals Tab** (top of page, minimizable)
  - List of incoming proposals for provider
  - List of submitted proposals for buyer
  - Click to expand/minimize
  - Status indicators (pending, accepted, rejected, withdrawn)

- [ ] Create **Work Requests Tab** (bottom of page, minimizable)
  - List of work requests tied to current user
  - Linked to ZeroBias Task System via `zerobias_task_id`
  - Status tracking (open, in_progress, completed, cancelled)
  - Click to expand/minimize

- [ ] Implement minimize/expand state persistence (localStorage)
- [ ] Show notification badges for new items

**Deliverables:**
- Two minimizable tabs always accessible on profile
- Quick overview of proposals and work requests
- Direct link to ZeroBias Task System for status tracking

### 3.2 ZeroBias Boundary Integration

**Tasks:**
- [ ] Implement boundary selection in work request
- [ ] Create boundary invite flow when proposal accepted
- [ ] Link work request to ZeroBias boundary
- [ ] Display boundary status in request detail

**Deliverables:**
- Work scoped to specific boundaries
- Providers invited to boundary on engagement
- Secure work environment

### 3.3 ZeroBias Task Integration

**Tasks:**
- [ ] Create task when work begins
- [ ] Link Supabase `work_requests.zerobias_task_id`
- [ ] Display task status in request detail
- [ ] Track time and deliverables in task

**Deliverables:**
- Work tracked in ZeroBias Task system
- Context preserved for audit/review
- Hours and deliverables logged

---

## Phase 4: Admin & Reviews

**Goal:** Admin management and trust through ratings

### 4.0 Admin Page

**Access:** Only visible to ZeroBias admins (via "App Administration" menu item)

**Route:** `/admin`

**Tasks:**
- [ ] Implement admin route guard (check ZeroBias admin role)
- [ ] Create admin dashboard layout

#### 4.0.1 Category Management
- [ ] Create categories CRUD interface
- [ ] Add new category (name, slug, description, parent_id, icon, sort_order)
- [ ] Edit existing categories
- [ ] Delete categories (with confirmation)
- [ ] Support hierarchical categories (parent/child)
- [ ] Drag-and-drop reordering

#### 4.0.2 Review Moderation
- [ ] List all reviews across all providers
- [ ] Filter by approval status (pending, approved, rejected)
- [ ] Admin can approve/reject any review
- [ ] View review details (rating, text, reviewer, provider, request)
- [ ] Bulk actions (approve/reject multiple)

**Deliverables:**
- Admin page accessible only to ZeroBias admins
- Full category management (CRUD)
- Review moderation for all reviews

### 4.1 Reviews System

**Tasks:**
- [ ] Create `reviews` table with `approved` boolean field
- [ ] Add `approved_at` timestamp field
- [ ] Add `approved_by` field (admin or provider user ID)
- [ ] Build review submission form
- [ ] Build `ReviewsSection` component (shows only approved reviews)
- [ ] Calculate and display average rating (approved reviews only)
- [ ] Add review to provider profile

**Deliverables:**
- Buyers can leave reviews after work
- Reviews require approval before display
- Ratings display on provider profiles (approved only)
- Average rating calculated from approved reviews

### 4.2 Provider Stats

**Tasks:**
- [ ] Track `total_jobs_completed`
- [ ] Track `total_earnings` (privacy option)
- [ ] Calculate response time metric
- [ ] Display stats on profile

**Deliverables:**
- Jobs completed count
- Response time average
- Success rate (completed/cancelled)

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

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **ZeroBias SDK changes** | Pin versions, follow release notes |
| **Neon connection limits** | Use pooled connection string, monitor usage |
| **Data sync issues** | Use zerobias_user_id as foreign key, validate on write |
| **Scope creep** | Strict MVP focus, defer features to future phases |
| **Auth complexity** | Keep ZeroBias as single auth source, direct SDK usage |
| **Schema migrations** | Use Drizzle Kit for type-safe migrations |

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
- `~/zb-repos/ui/projects/portal/src/app/portal/components/auditmation-default-app-bar/`
- Key features: App logo/name (left), navigation tabs, search button (right)

**User Profile Dropdown:**
- `~/zb-repos/ui/projects/portal/src/app/portal/components/auditmation-user/`
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

---

**Last Updated:** 2026-01-26
