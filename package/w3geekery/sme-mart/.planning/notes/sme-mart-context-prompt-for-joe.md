# SME Mart Context Prompt for Joe's LLM

Copy everything below the line and paste into your Claude session.

---

```
You are helping me (Joe) evaluate integration opportunities between my product (Work Worlds) and a partner product (SME Mart). Please ingest the following context about SME Mart so you can reason about where our systems overlap, complement each other, and where integration points make sense.

## What is SME Mart?

SME Mart is a **marketplace for Subject Matter Experts** in compliance and cybersecurity — "Upwork meets Whop" for the ZeroBias platform. It's built by W3Geekery (Clark Stacer) as a third-party app on the ZeroBias platform, same as Work Worlds.

**Live demo:** https://sme-mart-clark-stacers-projects.vercel.app/

## Platform Relationship

Both SME Mart and Work Worlds are **third-party applications** built on the ZeroBias platform using the ZeroBias SDK and client libraries. Neither is a ZeroBias-owned product. Both consume ZeroBias platform primitives:

- **Authentication & Identity** — ZeroBias Dana (users, orgs, sessions)
- **Tasks** — ZeroBias Task API (work tracking, status transitions, comments, attachments)
- **Boundaries** — ZeroBias Boundary API (access control, scope management)
- **Tags** — ZeroBias Tag API (labeling, filtering)
- **Catalog** — ZeroBias Catalog API (NICE Framework roles, skills, products, frameworks, segments)
- **PKV** — ZeroBias key-value store (user preferences)

The ZeroBias platform provides primitives. SME Mart and Work Worlds each build domain-specific experiences on top of those primitives.

## Tech Stack

- **Framework:** Angular 21 (standalone components, signals, inject())
- **UI Library:** Angular Material 21 + @zerobias-org/ngx-library (ZeroBias component/theme library)
- **Database:** Neon PostgreSQL, accessed via Generic SQL Hub Module (DataProducer interface over JDBC — credentials never exposed to browser)
- **Auth:** ZeroBias SDK (zerobias-angular-client → zerobias-client → zerobias-sdk)
- **Deployment:** Currently Vercel (temporary); target is S3/CloudFront as a ZeroBias platform app
- **No server-side layer** — all client-side via SDK + Hub Module

## Current Features (What's Built)

### Marketplace Discovery
- **Home page** — hero section, search, category cards, featured providers
- **Provider directory** — card grid with 6-type catalog filters (NICE roles, skills, products, frameworks, industry segments, service segments), search, sort, availability filter
- **Provider detail** — full profile with expertise (roles, skills, frameworks, products), service offerings, reviews, contact CTA
- **Service catalog** — browse all service offerings with catalog filters, provider as facet

### Provider Profiles
- **Self-management** — providers edit their own profile (headline, bio, hourly rate, availability)
- **Expertise management** — 6 autocomplete pickers linked to ZeroBias Catalog (NICE Work Roles, Skills, Products, Frameworks, Segments, Service Segments)
- **Service offerings** — CRUD for productized services with pricing types (fixed, hourly, custom)
- **Reviews** — star ratings with approval workflow (provider can moderate before public display)
- **Star rating** — average of approved reviews displayed on cards and profile

### RFP & Contracting
- **RFP creation** — buyers post Requests for Proposals with title, description, category, budget type/range, timeline
- **RFP browsing** — public list with status/sort/catalog filters
- **Proposal submission** — providers submit proposals with cover letter, proposed price, proposed timeline
- **Proposal management** — accept/reject/withdraw workflow
- **Engagement creation** — when a proposal is accepted: generates a BIP39 tag (ENG-word-word), creates a ZeroBias Tag, updates status to in_progress

### Engagement Center
- **Engagement detail** — 4-tab layout: Overview, Details, Tasks, Timeline
- **Tasks tab** — displays ZeroBias Tasks linked to the engagement, with status transition menus, sub-task creation via dialog with Milkdown markdown editor
- **Timeline tab** — activity feed with color-coded event types (comments, proposals, status changes), month dividers, markdown rendering, rich text composer for adding comments
- **Markdown components** — read-only renderer (marked-based) + rich editor (Milkdown Crepe with toolbar)

### Admin Panel
- **Users** — manage marketplace users (linked to ZeroBias Dana users)
- **Categories** — hierarchical taxonomy CRUD (parent/child, icons, sort order)
- **Reviews** — bulk approve/reject with search and filter
- **Settings** — registration, notifications, security, marketplace toggles (key-value store)

### Impersonation (Demo Only)
- Dev-only floating panel to switch between demo users
- 8 providers and 7 buyer organizations with sample data
- 5 active engagements and 7 open RFPs with various states

## Database Schema

15 tables in Neon PostgreSQL:

| Table | Purpose |
|-------|---------|
| `marketplace_users` | Central identity linking to ZeroBias user |
| `provider_profiles` | Extended provider data (slug, headline, about, hourly rate, rating, stats) |
| `provider_skills` | Links to NICE Skills (proficiency, years, verified) |
| `provider_roles` | Links to NICE Work Roles (isPrimary, yearsInRole) |
| `provider_products` | Links to ZeroBias Products (proficiency, certified) |
| `provider_frameworks` | Links to frameworks (assessor/implementation/audit experience) |
| `provider_segments` | Links to industry segments |
| `provider_service_segments` | Links to professional service categories |
| `service_offerings` | Productized service listings (pricing, delivery time, includes) |
| `work_requests` | RFPs and engagements (engagementTag presence = engagement phase) |
| `proposals` | Provider bids on RFPs (cover letter, price, timeline, status) |
| `reviews` | Reviews with approval workflow |
| `categories` | Hierarchical marketplace taxonomy |
| `app_settings` | Admin-configurable key-value settings |

6 enums: `availability_status`, `pricing_type`, `budget_type`, `request_status`, `proposal_status`, `proficiency_level`

6 database VIEWs for consolidated reads (no JOINs in DataProducer):
- `v_provider_directory` — provider list (profile + all expertise aggregated as JSON)
- `v_provider_detail` — full provider profile with services and reviews
- `v_engagement_summary` — engagement list with proposal counts
- `v_engagement_detail` — engagement with all proposals and provider info
- `v_admin_reviews` — review moderation view
- `v_admin_stats` — dashboard statistics

## Engagement Lifecycle

```
RFP Phase                          Engagement Phase
─────────                          ────────────────
Buyer posts RFP ──→ Providers      Proposal accepted ──→ BIP39 tag generated
(work_request,      submit         (ENG-word-word)       ZeroBias Tag created
 engagementTag      proposals      work_request updated  ZeroBias Task created
 = null)                           with tag + tagId      Status → in_progress

UI: RFP detail                     UI: Engagement detail
    Proposal list                      Overview, Details, Tasks, Timeline
    Accept/Reject/Withdraw             Comments via ZB Task API
```

## What SME Mart Does NOT Have (Gaps / Roadmap)

These are features SME Mart has identified as needed but has not built:

- **Provider scoring/reputation** — currently only star ratings from reviews. No composite score, no algorithmic reputation.
- **Credential verification** — no Credly or other badge integration. Provider expertise is self-declared.
- **Assessments/vetting** — no quiz or assessment system for verifying provider competency.
- **Matching/recommendation** — no algorithmic matching of buyers to providers. Currently manual browse + search.
- **Dashboard pages** — no role-specific dashboards for buyers or providers.
- **Pagination** — all lists load up to 200 items, no infinite scroll or pagination.
- **Direct hire flow** — no way for a buyer to go directly to a specific provider (bypassing RFP).
- **Service packages** — no 3-tier pricing on service offerings.
- **Payment processing** — no Stripe, no invoicing, no payment flow.
- **Notification system** — no email/push notifications for RFPs, proposals, messages.

## Integration Architecture Discussion So Far

Clark and I have been discussing how SME Mart and Work Worlds relate. Brian (ZeroBias CEO) clarified that:

> "WW uses the engagement center and those features from ZB. They are not features of WW. WW consumes."

This means both apps consume ZeroBias platform primitives — neither owns them. The corrected architecture:

```
ZeroBias Platform (primitives: Tasks, Boundaries, Auth, Orgs, Catalog, Tags)
    ↑ both build on top of these
    |
    ├── SME Mart (W3Geekery)
    │   - Marketplace discovery & matching
    │   - RFPs, proposals, contracting
    │   - Engagement center (lightweight, built on ZB Tasks/Boundaries)
    │   - Could expose: SME Mart API/MCP/SDK for marketplace data
    │
    └── Work Worlds (Joe's company)
        - Scoring engine, assessments, Credly
        - Workspace UX (also built on ZB Tasks/Boundaries)
        - Could expose: scoring/assessment APIs
```

Possible integration methods:
1. **Direct API-to-API (REST)** — each app exposes endpoints the other can call
2. **MCP (Model Context Protocol)** — both expose MCP servers for AI agent orchestration
3. **ZeroBias API as shared data layer** — both read/write through ZB platform APIs
4. **SME Mart SDK/API** — W3Geekery exposes SME Mart marketplace features as an API/MCP that WW can consume

## What I Need From You

Given this context about SME Mart, help me think through:

1. **Where does Work Worlds overlap with SME Mart?** Map our features against theirs.
2. **Where are we complementary?** What does WW have that SME Mart needs, and vice versa?
3. **What ZeroBias platform APIs do both apps need?** If we coordinate our requirements to Kevin (ZeroBias CIO), what gets built faster?
4. **What's the best integration approach?** Given that both apps are third-party ZB consumers, how should we share data? Direct APIs? Through ZB? MCP?
5. **What should we absolutely NOT duplicate?** What's the one thing that must live in exactly one place?
6. **What data contracts should we agree on now?** If WW has scoring data that SME Mart wants to display, what does that API look like?

Please be specific — reference SME Mart's actual tables, APIs, and features from the context above.
```
