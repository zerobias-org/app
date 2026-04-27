# Plan 024: Readiness & Scoring

**Status:** Draft — stub plan
**Phase:** Future (after assessments and transparency center)
**Depends on:** Transparency Center (023), ZB platform extended user profile (assessments + credentials)
**Source:** Brian (CEO) 2026-02-25, Joe Llamas feedback 2026-02-25

---

## Purpose

**Readiness** is a supplier-side construct that aggregates multiple signals into a provider's readiness to serve buyers. It answers: "How prepared is this provider to deliver on a specific type of engagement?"

**Scoring** is a broader functional product that rates provider performance. It consumes readiness data plus engagement outcomes.

Brian clarified: "Scoring is a functional product. Assessments are with readiness. Readiness is a supplier construct of lots of assessments."

## Readiness vs Scoring

| Concept | Owner | Inputs | Purpose |
|---------|-------|--------|---------|
| **Readiness** | Supplier-side | Assessments passed, credentials verified, transparency disclosures, compliance status | "Am I prepared to take on this type of work?" |
| **Scoring** | **Separate ZB app** | Readiness + engagement outcomes, task completion, buyer reviews, timeline adherence | "How well does this provider perform?" |

**Brian clarified (2026-02-25):** Scoring will come from a dedicated functional scoring app. Billing will come from a dedicated billing app. Both are ZB platform apps — SME Mart consumes their data, it does not build scoring or billing itself. SME Mart's role is to display scores and readiness on provider profiles, not compute them.

## Readiness Rollup (Platform Hierarchy)

Readiness data aggregates following the platform hierarchy:

```
SubTask readiness items (legal, financial, cyber, functional)
    ↓ roll up
Task readiness (aggregated subtask scores)
    ↓ roll up
Boundary readiness (aggregated across tasks in org-to-org engagement)
    ↓ roll up
Project readiness (aggregated across all boundaries in scope)
```

Both parties measure against **Requirements** as the common yardstick. Readiness rollups land at the Project level, giving a full transparency readiness view.

## Readiness Inputs

A provider's readiness for a given domain (e.g., "SOC 2 auditing") could aggregate:

1. **Assessments passed** (ZB platform — extended user profile) — which adaptive quizzes have they completed and at what score?
2. **Credentials verified** (ZB platform — extended user profile) — relevant Credly badges (CISA, CISSP, etc.)
3. **Transparency disclosures** (Plan 023) — how much have they shared with prior buyers?
4. **Self-declared expertise** (existing) — skills, roles, frameworks, products on their profile
5. **Engagement history** (existing) — completed engagements in that domain
6. **Review ratings** (existing) — star ratings from buyers in that domain

## Readiness Model (Preliminary)

```sql
-- Readiness assessment per provider per domain
CREATE TABLE provider_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id),
  -- What domain this readiness covers
  domain_type VARCHAR(50),            -- 'role', 'skill', 'framework', 'custom'
  domain_id VARCHAR(255),             -- ZB Catalog ID (or custom domain ID)
  domain_name VARCHAR(255),           -- e.g., "SOC 2 Auditing"
  -- Readiness score (computed)
  readiness_score DECIMAL(5,2),       -- 0-100
  readiness_level VARCHAR(20),        -- 'not_ready', 'basic', 'intermediate', 'advanced', 'expert'
  -- Component scores
  assessment_score DECIMAL(5,2),      -- From assessments (020)
  credential_score DECIMAL(5,2),      -- From credentials (021)
  experience_score DECIMAL(5,2),      -- From engagement history
  review_score DECIMAL(5,2),          -- From reviews
  -- Metadata
  last_calculated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider_id, domain_type, domain_id)
);
```

## Scoring — Consumed from ZB Scoring App

SME Mart does NOT compute scores. The ZB Scoring app computes scores and SME Mart displays them. Data model for what SME Mart caches/displays:

```sql
-- Cached provider scores from ZB Scoring app
CREATE TABLE provider_scores_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id),
  -- Scores from ZB Scoring app
  overall_score DECIMAL(5,2),         -- 0-100
  overall_level VARCHAR(20),          -- 'bronze', 'silver', 'gold', 'platinum'
  -- Component scores (as reported by ZB Scoring app)
  readiness_score DECIMAL(5,2),
  performance_score DECIMAL(5,2),
  reliability_score DECIMAL(5,2),
  satisfaction_score DECIMAL(5,2),
  -- Metadata
  engagements_completed INT DEFAULT 0,
  last_synced_at TIMESTAMP,           -- When we last pulled from ZB Scoring app
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider_id)
);
```

## Display on Provider Profiles

```
┌──────────────────────────────────────────┐
│  Provider Card                           │
│  ★★★★☆ 4.2  │  Score: 87/100 Gold      │
│  Readiness: SOC 2 ●●●●○  NIST ●●●○○    │
│  🔵 CISA  🔵 CISSP  🔵 CCSK            │
└──────────────────────────────────────────┘
```

- **Score badge** on provider cards (overall score + tier) — from ZB Scoring app
- **Readiness indicators** per domain (dot scale or percentage) — computed by SME Mart from assessments + credentials
- **Credential badges** (from ZB platform user profile)
- **Assessment badges** (from ZB platform user profile)

## Open Questions

1. **Readiness algorithm** — what weights for each component? Who defines?
2. **Readiness domains** — auto-created from provider's expertise, or manually configured?
3. **Score visibility** — public to all buyers, or only to engaged buyers?
4. **Score gaming prevention** — how to prevent providers from inflating scores?
5. **ZB Scoring app** — does Kevin have this on his roadmap? Is it being built by someone else?
6. **ZB Billing app** — same question. Does Kevin know about Brian's expectation for these?
7. **API contract** — what does the ZB Scoring app API look like? SME Mart needs to consume it.

---

*Stub plan — depends on ZB platform extended user profile (assessments + credentials) and Transparency Center (023). Scoring and billing are separate ZB apps; SME Mart consumes, not builds. To be expanded after platform dependencies are available.*
