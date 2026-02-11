# Plan 008: My Profile Page - Tabbed Layout with Nested Routes

**Status:** ✅ Complete (All Phases Done)
**Created:** 2026-02-05
**Author:** Claude (with Clark)
**Last Updated:** 2026-02-05

---

## TL;DR

**Problem:** The My Profile page is a 1600+ line monolith mixing profile info, 6 catalog attribute sections, service offerings, and reviews. It's hard to navigate and maintain.

**Solution:** Split into 4 tabbed sections with nested routes:

| Tab | What's There |
|-----|--------------|
| `/my-profile` | Basic info, stats, availability settings |
| `/my-profile/expertise` | Roles, Skills, Products, Frameworks, Segments, Service Categories |
| `/my-profile/services` | Service offerings management (add/edit/remove) |
| `/my-profile/reviews` | Review moderation and ratings |

**Benefits:**
- Cleaner UX - users go to the section they need
- Easier maintenance - smaller, focused components
- Bookmarkable URLs for each section
- Foundation for future tabs (Settings, Tasks, Analytics)

**Effort:** Medium - can be done incrementally over phases

---

## Overview

Refactor the My Profile page from a single long-scrolling page into a tabbed interface with nested routes. This improves UX by separating concerns and makes each section more manageable.

## Current State

- Single page at `/my-profile` (~1660 lines)
- Contains everything: basic info, all catalog attributes (roles, skills, products, frameworks, segments, service categories), service offerings, reviews
- Gets overwhelming and mixes different user intents
- Review moderation already has a separate page at `/my-profile/moderate-reviews`

## Proposed Structure

### Route Structure

```
/my-profile
├── /my-profile                    → Overview (default tab)
├── /my-profile/expertise          → Catalog attributes (roles, skills, etc.)
├── /my-profile/services           → Service offerings management
└── /my-profile/reviews            → Reviews & ratings management
```

### Tab Layout

| Tab | Route | Description |
|-----|-------|-------------|
| **Overview** | `/my-profile` | Profile summary, stats, availability, quick actions |
| **Expertise** | `/my-profile/expertise` | Roles, Skills, Products, Frameworks, Segments, Service Categories |
| **Services** | `/my-profile/services` | Service Offerings CRUD, pricing, delivery times |
| **Reviews** | `/my-profile/reviews` | Review moderation, ratings breakdown, responses |

## Component Architecture

### Layout Component (Shared)

```
src/app/my-profile/layout.tsx
├── Header (Back button, "My Profile" title)
├── Profile Summary Card (left sidebar - always visible)
│   ├── Avatar
│   ├── Name/Email
│   ├── Org chip
│   ├── Rating stars
│   └── Quick stats (jobs, hourly rate, rating)
├── Tab Navigation (MUI Tabs synced with route)
└── {children} (tab content area)
```

### Page Components

```
src/app/my-profile/
├── layout.tsx              → Shared layout with sidebar + tabs
├── page.tsx                → Overview tab content
├── expertise/
│   └── page.tsx            → Expertise tab (all catalog sections)
├── services/
│   └── page.tsx            → Services tab (offerings table + CRUD)
├── reviews/
│   └── page.tsx            → Reviews tab (moderation + stats)
└── moderate-reviews/       → (existing - could merge into /reviews)
    └── page.tsx
```

### Shared Components (Extract from current page)

```
src/components/profile/
├── ProfileSidebar.tsx          → Left column summary card
├── ProfileOverview.tsx         → Basic info form (headline, about, availability)
├── ExpertiseSection.tsx        → All catalog attribute sections
│   ├── RolesSection.tsx
│   ├── SkillsSection.tsx
│   ├── ProductsSection.tsx
│   ├── FrameworksSection.tsx
│   ├── SegmentsSection.tsx
│   └── ServiceCategoriesSection.tsx
├── ServiceOfferingsSection.tsx → Services table + dialogs
├── ReviewsSection.tsx          → Reviews list + moderation
└── dialogs/
    ├── RoleDialog.tsx
    ├── SkillDialog.tsx
    ├── ProductDialog.tsx
    ├── FrameworkDialog.tsx
    ├── SegmentDialog.tsx
    ├── ServiceSegmentDialog.tsx
    └── ServiceDialog.tsx
```

## Tab Content Details

### 1. Overview Tab (`/my-profile`)

- **Profile Form:** Headline, About, Hourly Rate, Availability, Response Time
- **Work Requests Summary:** Open/In Progress/Completed counts with link to full list
- **Quick Actions:** Links to other tabs, "View Public Profile" button
- **Activity Feed (future):** Recent reviews, completed jobs

### 2. Expertise Tab (`/my-profile/expertise`)

All catalog attribute sections (moved from current page):
- Role Experience (NICE work roles)
- Skills & Expertise (NICE skills)
- Product Experience (vendor products)
- Framework Experience (compliance frameworks)
- Service Categories (professional service types)
- Market Segment Experience (industries)

Each section has Add/Edit/Delete with dialog modals.

### 3. Services Tab (`/my-profile/services`)

- **Service Offerings Table:** Title, Category, Price, Delivery Time, Actions
- **Add Service Button:** Opens dialog
- **Empty State:** Prompt to add first service
- **Future:** Service analytics (views, inquiries), duplicate service, toggle active/inactive

### 4. Reviews Tab (`/my-profile/reviews`)

- **Ratings Overview:** Average rating, star breakdown chart
- **Approved Reviews:** List with rating, reviewer, date, text
- **Pending Reviews:** Moderation queue (approve/reject)
- **Future:** Reply to reviews, report inappropriate reviews

## Implementation Steps

### Phase 1: Setup Layout & Routes ✅ COMPLETE

1. ✅ Create `src/app/my-profile/layout.tsx` with shared layout
2. ✅ Extract `ProfileSidebar` component to `src/components/profile/ProfileSidebar.tsx`
3. ✅ Add MUI Tabs navigation synced with routes
4. ✅ Create placeholder pages for each route

### Phase 2: Extract Overview Tab ✅ COMPLETE

1. ✅ Move profile form (headline, about, etc.) to Overview page
2. ✅ Work requests summary accessible via layout (ProfileSidebar)
3. ✅ Added Quick Links section to other tabs

### Phase 3: Extract Expertise Tab ✅ COMPLETE

1. ✅ Create `expertise/page.tsx`
2. ✅ Move all 6 catalog sections (roles, skills, products, frameworks, segments, service categories)
3. ✅ All dialogs for add/edit included

### Phase 4: Extract Services Tab ✅ COMPLETE

1. ✅ Create `services/page.tsx`
2. ✅ Move service offerings table and dialog
3. ✅ Added tips card for providers
4. ✅ Enhanced table with Delivery column

### Phase 5: Extract Reviews Tab ✅ COMPLETE

1. ✅ Create `reviews/page.tsx`
2. ✅ Move reviews section with full functionality
3. ✅ Link to `moderate-reviews` page maintained
4. ✅ Add ratings breakdown chart with visual bars

### Phase 6: Polish & Cleanup ✅ COMPLETE

1. ✅ Old page saved as `_page.monolithic.tsx` (for reference during refactor)
2. ✅ All tab pages compile and render (200 OK)
3. ✅ CRUD operations tested across tabs
4. ✅ Monolithic page deleted (2026-02-09)

## Technical Considerations

### State Management

- **Profile data:** Continue using `useProfile` hook (works across all tabs)
- **Tab state:** Derived from URL (no local state needed)
- **Dialog state:** Keep in individual tab pages or lift to layout if shared

### URL Syncing with Tabs

```tsx
// In layout.tsx
const pathname = usePathname();
const tabValue = pathname === '/my-profile' ? 0
  : pathname.includes('/expertise') ? 1
  : pathname.includes('/services') ? 2
  : pathname.includes('/reviews') ? 3
  : 0;
```

### Navigation

```tsx
<Tabs value={tabValue} onChange={(_, v) => router.push(tabRoutes[v])}>
  <Tab label="Overview" />
  <Tab label="Expertise" />
  <Tab label="Services" />
  <Tab label="Reviews" />
</Tabs>
```

## Future Considerations (Post-POC)

- **Settings Tab:** App personalization, notification preferences
- **Tasks Tab:** ZeroBias task system integration
- **Analytics Tab:** Earnings, profile views, engagement metrics
- **Communications Tab:** Messages, inquiries from buyers

## Questions for Discussion

1. Should the left sidebar (profile summary) be visible on all tabs, or just Overview?
2. Should we keep `moderate-reviews` as a separate page or merge into Reviews tab?
3. Any preference on tab order?
4. Should we add a "View as Buyer" button to preview public profile?

## Estimated Effort

- Phase 1 (Layout): Small
- Phase 2 (Overview): Small
- Phase 3 (Expertise): Medium (most sections to move)
- Phase 4 (Services): Small
- Phase 5 (Reviews): Small
- Phase 6 (Polish): Small

**Total:** Medium-sized refactor, can be done incrementally

---

**Approval:** [ ] Approved by _____ on _____
