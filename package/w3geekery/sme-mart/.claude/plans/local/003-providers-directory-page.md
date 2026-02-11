# Plan: Providers Directory Page (`/providers`)

> **Status:** Planned (2026-01-30)

## Goal
Build a browsable, filterable provider directory at `/providers` — the main page for buyers to find compliance professionals.

## What We're Building

A full-width directory page with:
- **Search bar** — filter by name/headline text
- **Category filter chips** — filter by service category (Assessors, Advisors, Agentic, SecOps, etc.)
- **Availability filter** — show only available providers
- **Sort options** — by rating, hourly rate, jobs completed
- **Provider cards grid** — reuse the same card pattern from the landing page
- **Results count** — "Showing X providers"

All filtering happens client-side for now (the dataset is small). No pagination needed yet.

## Files to Create/Modify

### New Files
1. **`src/app/providers/page.tsx`** — The directory page with search, filters, and grid
2. **`src/components/marketplace/ProviderCard.tsx`** — Extract the provider card from `page.tsx` into a reusable component (used by both landing page and directory)

### Modified Files
3. **`src/app/page.tsx`** — Replace inline provider card with `<ProviderCard />` component; add "View All Providers" link to the Featured Experts section
4. **`src/components/layout/AppTopBar.tsx`** — Add "Providers" nav link in the top bar

## Implementation Details

### 1. `ProviderCard.tsx` (Extract from landing page)
- Move the existing card markup from `page.tsx` into a standalone component
- Props: `provider` object (same shape already used)
- Wrapped in Next.js `<Link>` to `/providers/${provider.slug}`
- Avatar with initials, headline, skills chips, rate, rating, availability badge

### 2. `/providers/page.tsx`
- Fetch all providers from `GET /api/providers` on mount (same pattern as landing page)
- Client-side state for: `searchQuery`, `selectedCategory`, `availableOnly`, `sortBy`
- Filter pipeline: text search → category filter → availability filter → sort
- **Search**: `TextField` with search icon, filters on `displayName` and `headline`
- **Category chips**: Row of `Chip` components for each category (from the provider data or hardcoded list matching CLAUDE.md categories). "All" chip selected by default.
- **Availability toggle**: `Chip` or `Switch` for "Available only"
- **Sort**: `Select` or `ToggleButtonGroup` — Rating (default), Rate (low→high), Jobs Completed
- **Grid**: `Grid size={{ xs: 12, sm: 6, md: 4 }}` with `<ProviderCard />` components
- **Empty state**: Message when no providers match filters
- **Loading/Error**: `CircularProgress` and `Alert` (existing pattern)

### 3. Landing page updates
- Import and use `<ProviderCard />` instead of inline card markup
- Add "Browse All Providers →" button/link below the featured grid

### 4. AppTopBar nav link
- Add "Providers" text button or link next to the app name, linking to `/providers`

## Styling Approach
- MUI `sx` props throughout (matches existing pattern)
- Filter bar: sticky or fixed below the top bar, with horizontal scroll on mobile for chips
- Same card hover effect as landing page (`translateY(-4px)`)
- Consistent with theme colors (`primary.main: #667eea`)

## Verification
1. `npm run dev` — navigate to `/providers`
2. Confirm all seeded providers display in the grid
3. Type in search box — verify filtering by name/headline
4. Click category chips — verify filtering
5. Toggle availability — verify filtering
6. Change sort — verify ordering
7. Navigate from landing page "View All" link
8. Click a provider card — verify navigation to `/providers/[slug]`
9. Check mobile responsiveness (cards stack to single column)
