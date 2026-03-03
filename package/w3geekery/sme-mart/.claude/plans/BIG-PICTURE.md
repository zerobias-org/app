# BIG PICTURE — SME Mart Ecosystem

**Last updated:** 2026-02-27
**Purpose:** Aggregate view of SME Mart, its relationship to ZeroBias and 3rd-party systems, gap analysis, and development priorities. Guides roadmap decisions.

---

## Vision

SME Mart is a **marketplace for Subject Matter Experts** in compliance, cybersecurity, and regulated industries. It enables organizations to discover, vet, contract, and manage expert providers through a transparent, auditable lifecycle — all built on the ZeroBias platform.

Brian's North Star: **"The agentic marketplace — not for toys, but for mature, heavily regulated companies to buy and sell."**

---

## System Map

```
┌──────────────────────────────────────────────────────────────┐
│                     ZEROBIAS PLATFORM                        │
│                                                              │
│  Auth │ Orgs │ Users │ Boundaries │ Tasks │ Tags │ PKV      │
│  Catalog (Roles, Skills, Products, Frameworks, Segments)     │
│  Hub Modules │ Schema │ Boundary Manager │ FileService       │
└──────┬────────────────────┬──────────────────────┬───────────┘
       │                    │                      │
       ▼                    ▼                      ▼
┌──────────────┐   ┌────────────────┐   ┌──────────────────────┐
│   SME MART   │   │  ZB BILLING    │   │  ZB SCORING /        │
│   (Angular)  │   │  APP (Future)  │   │  READINESS (Future)  │
│              │   │                │   │                      │
│ Marketplace  │   │ Task-level $   │   │ Assessment rollups   │
│ Profiles     │   │ Project budget │   │ Compliance scores    │
│ RFPs         │   │ ZB 3% cut      │   │ Provider levels      │
│ Engagements  │   │ Invoicing      │   │                      │
│ Tasks/Notes  │   │                │   │                      │
│ Timeline     │   │                │   │                      │
└──────┬───────┘   └────────────────┘   └──────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                  3RD-PARTY INTEGRATIONS                       │
│                                                              │
│  Stripe/Privy (payments) │ Credly (certs) │ login.gov (ID)  │
│  Teams/Zoom (meetings)   │ Otter/Firefly  │ Background check│
│  Calendar (M365)         │ Stripe Atlas    │                 │
└──────────────────────────────────────────────────────────────┘
```

**Key Principle:** SME Mart is a **UX layer** consuming ZeroBias platform primitives (Tasks, Boundaries, Tags, Auth). It does not own governance — ZeroBias does.

---

## Hierarchy Model

Brian's definitive hierarchy, mapped to ZB platform entities (2026-02-25):

```
Project (tag-based wrapper — scope of work, where $ flows)
│  Gets a Tag, Members + Admins groups, tag-based access rules
│  Transparency rollups land here
│  Can span multiple Boundaries
│
├── Boundary (org-to-org: W-9, tax, DUNS, banking, exec checks)
│   ├── Board (user-created task collection, per-board permissions)
│   │   ├── Task (how outcomes delivered: apps/services/agents)
│   │   │   ├── SubTask: Legal readiness
│   │   │   ├── SubTask: Financial ($) readiness
│   │   │   ├── SubTask: Cyber/compliance readiness
│   │   │   └── SubTask: Functional outcomes
│   │   └── Task 2 ...
│   ├── Board 2 ("Sprint 1", "Compliance Review", etc.)
│   └── Board N ...
└── Boundary 2 (if project spans orgs)
```

**Three perspectives at every level:**
1. **Demand side (buyer)** — private to buyer
2. **Supply side (provider)** — private to provider
3. **Transparency (shared middle)** — both parties + 3rd-party assessors/insurers

**Four dimensions surfaced in transparency:** $ (payments), Compliance, Functional deliverables, Legal adherence.

---

## Current State (2026-02-27)

### What's Built

| Layer | Status | Details |
|-------|--------|---------|
| **Angular 21 scaffold** | Complete | Standalone components, SDK + ngx-library, M3 theme, proxy configs |
| **Data layer** | Complete | Generic SQL Hub Module → Neon PostgreSQL, 15 tables, 6 VIEWs |
| **Service layer** | Complete | 10+ services (catalog, profiles, proposals, engagements, etc.) + 8 models |
| **Marketplace** | Complete | Landing page, provider directory (6-type filters), provider detail, service catalog |
| **Profiles** | Complete | My profile, expertise pickers, service offerings, reviews + moderation |
| **Engagements** | In Progress | RFP list, engagement detail with tabs (overview, details, tasks, timeline) |
| **Tasks tab** | Complete | ZB Tasks integration, status transitions, subtask creation |
| **Timeline tab** | Complete | Activity center with Milkdown markdown editor, event cards |
| **Notes feature** | In Progress | Plan 026 — engagement-scoped notes with folders and tags |
| **Admin panel** | Partially built | Users, categories, reviews, settings tabs |
| **Deployment** | Temporary | Vercel (temporary), S3/CloudFront (target) |

### What's Stubbed (Needs Platform Work)

| Plan | Feature | Blocker |
|------|---------|---------|
| 022 | Project layer (Engagement → Project → Task hierarchy) | ZB platform Project entity (on Kevin's near-term roadmap) |
| 023 | Transparency Center (3-view buyer/supplier/shared) | Needs project layer + subtask type customization |
| 024 | Readiness & Scoring | Needs transparency center + extended user profile |
| 025 | ZB platform feature requests | Living doc tracking requests for Kevin |

---

## Gap Analysis

### SME Mart Gaps (Clark's Roadmap)

Features within SME Mart's domain — Clark can build these:

| # | Gap | Priority | Depends On | Notes |
|---|-----|----------|------------|-------|
| SM-1 | **Notes feature completion** | High | — | Plan 026, in progress |
| SM-2 | **Engagement detail polish** | High | — | RFP detail page, proposal workflow UX |
| SM-3 | **ngx-library re-skin** (Phase 6) | Medium | — | Audit all custom components, dark/light mode consistency |
| SM-4 | **Dashboard pages** (role-specific) | Medium | — | Buyer dashboard, provider dashboard, aggregate stats |
| SM-5 | **Direct hire flow** | Medium | — | Buyer → specific provider (skip RFP) |
| SM-6 | **Service packages** (3-tier pricing) | Low | — | Bronze/Silver/Gold pricing on service offerings |
| SM-7 | **Matching OS UI** | Medium | ZB-4 | Search/filter by credentials, clearance, certifications, location |
| SM-8 | **Transparency Center UI** (Plan 023) | High | ZB-1, ZB-2, ZB-3 | 3-view architecture: buyer / provider / shared |
| SM-9 | **Board management UI** | Medium | ZB-8 | Create/manage boards within boundaries, per-board permissions |
| SM-10 | **Credential display in profiles** | Medium | ZB-4 | Show verified credentials, clearances, background check status |
| SM-11 | **Deployment to S3/CloudFront** (Phase 7) | High | — | Get off Vercel |
| SM-12 | **Portal iframe integration** | Medium | SM-11 | postMessage, theme sync, org ID |
| SM-13 | **Demo mode / mock catalog** | Low | — | Plan 013, offline dev fixtures |
| SM-14 | **Pagination on all list pages** | Medium | — | Some pages lack infinite scroll |
| SM-15 | **Readiness display** (Plan 024) | Low | ZB-5, SM-8 | Provider readiness scores from assessment rollups |
| SM-16 | **Conceptual diagrams** | Low | — | Brian requested visual "art" of Transparency Center, data flows, permissions model |

### ZB Platform Gaps (Kevin's Roadmap)

Platform capabilities SME Mart needs but cannot build:

| # | Gap | Priority | Status | Notes |
|---|-----|----------|--------|-------|
| ZB-1 | **Project entity** | **Critical** | Kevin's near-term roadmap | Tag-based wrapper with Members + Admins groups. Blocks project-level budget, multi-boundary scoping, transparency rollups |
| ZB-2 | **Boards (task collections)** | High | TBD | User-created task groupings within boundaries. May be tags, new entity, or Neon-backed |
| ZB-3 | **Custom Task Activities** | High | Kevin's near-term roadmap | Define custom fields on tasks/subtasks. Enables legal/financial/functional subtask typing |
| ZB-4 | **Extended user/org profile schema** | High | Requested, no timeline | Credential storage at org + user level. Currently SME Mart works around with Neon |
| ZB-5 | **Scoring app** | Medium | Future | Separate ZB app. SME Mart consumes scoring data |
| ZB-6 | **Billing app** | High | Future | Separate ZB app. See billing requirements (BR-001 through BR-006) |
| ZB-7 | **Schema forking capability** | Low | Vision stage | Let 3rd-party devs fork ZB schema, extend, hand back |
| ZB-8 | **Board entity / implementation** | Medium | TBD | May be new entity, tag-based, or Neon-backed |
| ZB-9 | **File attachment scoping** | Medium | — | Current S3 uploads → ZB bucket. May need private/scoped storage for vendor files |
| ZB-10 | **Data classification scheme** | Low | — | PII, CUI (government), sensitivity levels — affects storage and access |
| ZB-11 | **Tag-based project security rules** | Medium | Design needed | Kevin flagged: project tags compete with Boundary security. Need conflict resolution |

### 3rd-Party Integration Gaps

External service integrations — live in ZB catalog as connectors, SME Mart is primary consumer:

| # | Integration | Owner | Priority | Status | Notes |
|---|-------------|-------|----------|--------|-------|
| 3P-1 | **Stripe Connect / Financial Accounts** | TBD | High | Not started | Marketplace payment processing. ZB takes ~3% |
| 3P-2 | **Privy (embedded wallets)** | TBD | Medium | Brian directive (2026-02-24) | Stablecoin support, global payments for Guild members |
| 3P-3 | **Tempo blockchain** | TBD | Low | Future | Stripe's payment blockchain — microtransactions, agentic payments |
| 3P-4 | **Bridge (stablecoin orchestration)** | TBD | Low | Future | Cross-border payouts |
| 3P-5 | **Credly (professional credentials)** | TBD | Medium | Needs connector built | First credentialing integration prototype |
| 3P-6 | **Government ID / facial recognition** | Brian investigating | Medium | Research stage | login.gov, ID.me — identity verification for regulated environments |
| 3P-7 | **Background check system** | TBD | Medium | Not started | DoD clearances, standard background checks |
| 3P-8 | **Teams/Zoom/M365 (meeting integration)** | Clark | Low | Not started | Auto-capture transcripts, link to engagements |
| 3P-9 | **Calendar integration (M365)** | Clark | Low | Not started | Schedule meetings within engagement context |
| 3P-10 | **Otter/Firefly (transcription)** | TBD | Low | Brian interested | Alternative to Teams native transcription |
| 3P-11 | **Stripe Atlas** | TBD | Low | Future | Provider company incorporation through marketplace |

---

## Billing Architecture (Separate ZB App)

Brian confirmed: **billing is NOT part of SME Mart.** It's a separate ZB platform app that SME Mart consumes.

### Requirements Captured

| Req | Description | Source |
|-----|-------------|--------|
| BR-001 | Project-level budget tracking (total, actual, remaining, burn rate) | PMO input, Brian |
| BR-002 | Budget threshold alerts (configurable %, executive dashboard) | PMO input |
| BR-003 | Spend per PM / per program with drill-down | PMO input |
| BR-004 | Department-level spend rollup | PMO input |
| BR-005 | Engagement payment status in Transparency Center | Brian |
| BR-006 | Marketplace transaction support (Stripe/Privy/Bridge) | Brian |

### Billing Model

Task-level billing with **heterogeneous methods per task:**
- **Hourly** — contractor hours (e.g., W3Geekery / Clark's engagement model)
- **Metered** — per-action (e.g., 1 cent per legal review)
- **Output-based** — per-unit (e.g., $0.15 per second of video generated)

Each task can have a **billing subtask** that tracks costs. Project-level aggregation produces daily/weekly/monthly summaries. **ZeroBias takes ~3% of all transaction fees as the marketplace brokerage.**

---

## Transparency Center Architecture

The Transparency Center is the heart of the engagement experience — three views:

| View | Visibility | Purpose |
|------|-----------|---------|
| **Provider (supply side)** | Private to provider | Internal readiness data from Readiness Center. Choose what to share per buyer under NDA |
| **Shared (middle)** | Both parties + assessors | Common ground: engagement status, $, compliance, deliverables, legal |
| **Buyer (demand side)** | Private to buyer | Requirements definition — what they demand from each seller |

**Rollup path:** SubTask → Task → Board → Boundary → Project

**Blocked by:** ZB-1 (Project entity), ZB-2 (Boards), ZB-3 (Custom Task Activities)

---

## Credentialing System (Org-Level, Not SME Mart)

Brian clarified (2026-02-27): **credentials live at the org/user profile level** in a governance app, not in SME Mart. SME Mart *consumes* credential data for matching.

Three tiers:
1. **Professional credentials** — Credly, certifications (needs connector built)
2. **Government ID + facial recognition** — login.gov, ID.me (Brian investigating)
3. **Background checks + security clearances** — DoD, standard background (TBD)

**SME Mart's role:** Display credentials in provider profiles, filter/match by credential requirements in the Matching OS.

---

## Observability & Audit Trail (Long-Horizon)

Brian's vision for agentic transparency — every task audits the full chain:

```
Buy-side Boundary
    → Seller-side Environment (stack in boundary)
        → Desktop (human operator)
            → Each Agentic Session
```

Requirements: decisioning context, permission overrides, data classification (PII/CUI), full memory retention from all parties, pre-production testing lifecycle (test → prototype → production subtasks).

**Depends on:** Full hierarchy in place + agentic orchestration layer.

---

## Priority Recommendations

### Tier 1 — Finish What's Started (Now)

| Item | Owner | Rationale |
|------|-------|-----------|
| SM-1: Notes feature | Clark | In progress, finish it |
| SM-2: Engagement detail polish | Clark | Core engagement UX needs refinement |
| SM-11: S3/CloudFront deployment | Clark | Get off Vercel |

### Tier 2 — High-Value, Unblocked (Next)

| Item | Owner | Rationale |
|------|-------|-----------|
| SM-3: ngx-library re-skin (Phase 6) | Clark | Consistency with ZB platform apps before demo |
| SM-4: Dashboard pages | Clark | Role-specific landing for buyers and providers |
| SM-14: Pagination | Clark | List pages need it before real data volume |

### Tier 3 — Blocked by Platform (Track & Push)

| Item | Blocker | Rationale |
|------|---------|-----------|
| SM-8: Transparency Center UI (Plan 023) | ZB-1, ZB-2, ZB-3 | Brian's flagship feature. Push Kevin on Project entity |
| SM-7: Matching OS UI | ZB-4 | Credential-aware search. Needs extended user/org profile |
| SM-9: Board management | ZB-8 | Board entity/implementation TBD |
| SM-15: Readiness display (Plan 024) | ZB-5, SM-8 | Depends on scoring app + transparency center |

### Tier 4 — External Dependencies (Coordinate)

| Item | Dependency | Rationale |
|------|-----------|-----------|
| 3P-1: Stripe Connect | Billing app design | Marketplace payments — needs billing app architecture first |
| 3P-5: Credly connector | Connector builder | First credentialing prototype |
| 3P-6: Government ID | Brian's provider selection | login.gov vs ID.me decision |
| ZB-6: Billing app | Separate team/project | Requirements captured, hand off when dev starts |

### Tier 5 — Future (Research / Vision)

| Item | Notes |
|------|-------|
| Stripe/Privy/Tempo | Embedded wallets, stablecoin. Research when billing direction clearer |
| Agentic commerce | AI agents procuring SME services (Stripe ACP) |
| Schema forking | Formalized 3rd-party schema extension workflow |
| Calendar/video integration | Auto-capture meeting transcripts |
| Observability/audit trail | Needs full hierarchy + agentic layer |

---

## Key Decisions Locked In

| Decision | Source | Date |
|----------|--------|------|
| SME Mart is a UX layer consuming ZB platform | Brian | 2026-02-25 |
| Hierarchy: Project → Boundary → Board → Task → SubTask | Brian + Kevin | 2026-02-25 |
| Three perspectives at every level: buyer, supplier, shared | Brian | 2026-02-25 |
| Credentialing is org-level (Governance app), not SME Mart | Brian | 2026-02-27 |
| "Matching OS" = credential-aware search/filter in SME Mart | Brian | 2026-02-27 |
| Scoring is a separate ZB platform app | Brian | 2026-02-25 |
| Billing is a separate ZB platform app | Brian | 2026-02-25 |
| ZeroBias takes ~3% of all marketplace transactions | Brian | 2026-02-27 |
| Task-level billing with heterogeneous methods per task | Brian | 2026-02-27 |
| Schema extension: build in Neon, prototype, hand back to core | Brian | 2026-02-27 |
| Assume full transparency for all agentic runs | Brian | 2026-02-20 |

---

## Open Questions (Unresolved)

| Question | Who Decides | Context |
|----------|-------------|---------|
| When will ZB Project entity ship? | Kevin | Blocks Plans 022, 023, 024 |
| When will custom Task Activities ship? | Kevin | Blocks subtask typing |
| Is extending ZB user profile on the roadmap? | Kevin | Credentials, assessments, avatar, history |
| Which government ID provider — login.gov or ID.me? | Brian | First credentialing integration |
| Is ZB 3% brokerage fee confirmed or placeholder? | Brian | Affects billing app design |
| Should credentials default to anonymous in SME Mart? | Brian | Headcount + cert level vs. named individuals |
| Billing subtask structure — per-task or centralized per-project? | Brian | Affects billing app architecture |
| Tag-based project rules vs. Boundary security — conflict resolution? | Kevin | Design concern Kevin flagged |
| How will schema forking work for 3rd-party devs? | Kevin/Brian | "Bring your own account" vs. ZB-hosted |
| What's the industry-standard nomenclature for agent hierarchies? | Research | Swarm vs. orchestration vs. hierarchy |

---

## Sources

| Document | Location |
|----------|----------|
| PLAN.md (architecture & phases) | `.claude/plans/public/PLAN.md` |
| Meeting #1 (2026-02-20) | `.claude/notes/meetings/2026-02-20-marketplace-meeting.md` |
| Meeting #2 (2026-02-27) | `.claude/notes/meetings/2026-02-27-marketplace-meeting.md` |
| CEO Notes | `.claude/notes/CEO_NOTES.md` |
| Billing app requirements | `.claude/notes/billing-app-requirements.md` |
| ZB platform feature requests | `.claude/plans/local/025-zb-platform-feature-requests.md` |
