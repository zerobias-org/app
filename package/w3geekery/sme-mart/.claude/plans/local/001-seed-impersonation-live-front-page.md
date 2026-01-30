# Plan: Seed Data, Impersonation, and Live Front Page

> **Status:** Completed (2026-01-29)

## Summary

Create realistic test provider profiles in Neon, add a dev-mode impersonation switcher to demo different user personas, and wire the front page "Featured Experts" section to real Neon data.

## 1. Seed Script

**Created** `src/lib/db/seed.ts` — runnable via `npx tsx src/lib/db/seed.ts`
**Added** `"db:seed"` script to `package.json`: `"dotenv -e .env.local -- tsx src/lib/db/seed.ts"`

Inserted 5 test provider profiles with varied personas:

| zerobiasUserId | displayName | Category Focus |
|---|---|---|
| `a1-bob-it` | A1-Bob-IT | Agentic (AI Agent Builder) |
| `a3-gina-auditor` | A3-Gina-Auditor | Assessors (SOC 2, ISO 27001) |
| `demo-advisor-002` | James Okafor | Advisors (GRC Strategy) |
| `demo-secops-004` | Carlos Rivera | SecOps (IR, SIEM) |
| `demo-trainer-005` | Alex Nguyen | Training (CISSP, Security Awareness) |

Each profile gets 3 skills with varied proficiency levels, 2 service offerings with realistic pricing, availability status, hourly rate, response time, totalJobsCompleted, and ratingAverage.

## 2. Providers API Route

**Created** `src/app/api/providers/route.ts`

- **GET** `/api/providers` — returns all provider profiles with skills and services
- Optional query params: `?category=Assessors` for filtering
- Ordered by ratingAverage desc

## 3. Impersonation Switcher (Dev Only)

**Created** `src/components/dev/ImpersonationSwitcher.tsx`
**Modified** `src/context/ZeroBiasContext.tsx` — added `impersonateUser`, `stopImpersonating`, `isImpersonating`
**Modified** `src/app/layout.tsx` — renders ImpersonationSwitcher

## 4. Wire Front Page to Real Data

**Modified** `src/app/page.tsx` — Featured Experts section fetches from `/api/providers` via useEffect, displays real provider cards with avatar, skills chips, rates, ratings.

## Files Changed

| File | Action |
|------|--------|
| `src/lib/db/seed.ts` | Created |
| `package.json` | Modified — added `db:seed` script |
| `src/app/api/providers/route.ts` | Created |
| `src/components/dev/ImpersonationSwitcher.tsx` | Created |
| `src/context/ZeroBiasContext.tsx` | Modified |
| `src/app/layout.tsx` | Modified |
| `src/app/page.tsx` | Modified |
