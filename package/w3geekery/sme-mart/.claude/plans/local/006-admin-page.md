# 006 — Admin Page (Phase 4.0)

**Status:** Planned
**Created:** 2026-01-30

## Goal

Replace all mock data in the existing admin page (`src/app/admin/page.tsx`) with real API calls to Neon. Wire up all 5 tabs: Users (providers), Organizations, Categories, Reviews, Settings. Seed categories with subcategories.

## What Exists

- Full admin page UI at `src/app/admin/page.tsx` (1169 lines) with 5 tabs, all using mock data
- Admin guard: checks `isAdmin` from ZeroBiasContext
- Admin menu item in UserProfileDropdown already routes to `/admin`
- Categories schema in Drizzle with hierarchy support (parentId)
- Reviews schema with approval workflow (approved, approvedAt, approvedBy)
- Provider-level review moderation API at `/api/profile/reviews`
- No categories API exists yet
- No categories seed data

## Files to Create

### 1. `src/app/api/admin/categories/route.ts`
- **GET** — List all categories ordered by sortOrder, with children nested
- **POST** — Create a category (name, slug, description, parentId, icon, sortOrder)

### 2. `src/app/api/admin/categories/[id]/route.ts`
- **PUT** — Update a category
- **DELETE** — Delete a category (cascade deletes children)

### 3. `src/app/api/admin/reviews/route.ts`
- **GET** — List ALL reviews across all providers with provider info (name, slug)
- **PUT** — Bulk or single approve/reject (accepts `{ reviewIds, action, approvedBy }`)

### 4. `src/app/api/admin/stats/route.ts`
- **GET** — Return dashboard stats: total providers, total categories, pending reviews count

### 5. Seed categories in `src/lib/db/seed.ts`
- Add category seeding with 7 top-level + ~22 subcategories (matching the mock data)
- Check for existing categories before inserting

## Files to Modify

### 6. `src/app/admin/page.tsx` — Major rewrite
Replace mock data with real API calls for each tab:

**Stats Cards (top):** Fetch from `/api/admin/stats`

**Users Tab (index 0):** Fetch providers from `/api/providers` (already exists)

**Organizations Tab (index 1):** Keep mock data for POC.
> **Future:** Build out with real data. Primary org data comes from ZeroBias platform (dana-sdk `getOrgApi()`), but we'll expand the schema in Neon with additional org fields that ZeroBias doesn't cover (same pattern as provider profiles — ZeroBias user ID as foreign key, extended marketplace data in Neon). Create an `org_profiles` Neon table to store marketplace-specific org data alongside ZeroBias org identity.

**Categories Tab (index 2):** Fetch from `/api/admin/categories`, wire CRUD dialogs

**Reviews Tab (index 3):** Fetch from `/api/admin/reviews`, wire approve/reject (single + bulk)

**Settings Tab (index 4):** Keep as-is for POC (non-functional toggles).
> **Future:** Create an `app_settings` table in Neon to persist all toggle values. Wire up the Settings tab to read/write from that table via a `/api/admin/settings` endpoint. Settings should be key-value pairs so new toggles can be added without schema changes.

## Verification

1. Seed categories: `npx dotenv -e .env.local -- npx tsx src/lib/db/seed.ts`
2. Navigate to `/admin` — stats cards show real counts
3. Users tab shows real providers
4. Categories tab shows seeded hierarchy, CRUD works
5. Reviews tab shows real reviews, approve/reject works
6. TypeScript check: `npx tsc --noEmit`
