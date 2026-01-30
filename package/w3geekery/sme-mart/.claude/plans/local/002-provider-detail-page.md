# Plan: Provider Detail Page (Public Profile View)

> **Status:** In Progress (2026-01-29)

## Summary

Add a public provider detail page at `/providers/[providerId]` so buyers can view an expert's full profile when clicking a card on the front page. Includes contact info, hire button, and moderated reviews.

## 1. Single Provider API Route

**Create** `src/app/api/providers/[id]/route.ts`

- **GET** `/api/providers/:id` — returns one provider profile with skills, services, and reviews
- Fetches by provider profile `id` (UUID)
- Includes reviews via Drizzle `with: { skills, serviceOfferings, reviews }`
- Returns 404 if not found

## 2. Provider Detail Page

**Create** `src/app/providers/[providerId]/page.tsx`

Public profile view with:
- Header: avatar, name, headline, availability badge, hourly rate, rating, jobs completed
- "Hire Me" button (placeholder — snackbar "Coming soon")
- Contact info: email, response time
- About section
- Skills as chips (proficiency + years, expert highlighted)
- Service offerings cards (title, description, category, pricing, delivery time)
- Reviews section with "Leave a Review" dialog (moderated, approved: false by default)

## 3. Reviews API Route

**Create** `src/app/api/providers/[id]/reviews/route.ts`

- **POST** — submit review (rating 1-5, reviewText, reviewerZerobiasUserId)
- Saved with `approved: false` by default

## 4. Link Front Page Cards

**Modify** `src/app/page.tsx` — wrap cards with Next.js Link to `/providers/[id]`

## Files

| File | Action |
|------|--------|
| `src/app/api/providers/[id]/route.ts` | Create |
| `src/app/api/providers/[id]/reviews/route.ts` | Create |
| `src/app/providers/[providerId]/page.tsx` | Create |
| `src/app/page.tsx` | Modify |
