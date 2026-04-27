# BIG PICTURE — SME Mart Ecosystem

**Last updated:** 2026-03-09
**Purpose:** Aggregate view of SME Mart, its relationship to ZeroBias and 3rd-party systems, gap analysis, and development priorities. Guides roadmap decisions.

> **Reference:** [Hierarchy Model](public/hierarchy-model.md) — Org → Engagement → Project → Boundary mapping, Notes scoping, permissions model, CEO/CIO directive reconciliation.

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

> **Full reference:** [hierarchy-model.md](public/hierarchy-model.md) — detailed entity definitions, boundary selection flow, notes scoping, CEO/CIO reconciliation.

### SME Mart Hierarchy (Reconciled — 2026-03-09)

Synthesized from Brian (2026-02-25, 2026-03-03, 2026-03-06) and Kevin (2026-03-06):

```
Org (company identity — ZB Org)
└── Engagement (corp-to-corp: MSA, D&B, banking, compliance)
    │  Administrative/legal container — NOT where scoped work lives
    │  Created when a Bid is accepted (or reused if relationship exists)
    │
    ├── Project A (scoped work / SOW — boundary-scoped)
    │   ├── Boundary (ZB platform — products, frameworks, users/groups/roles)
    │   ├── Documents (subset of Org Documents shared to this Project)
    │   ├── Members/Groups/Roles (ZB platform, scoped by boundary)
    │   ├── Tasks / SubTasks (ZB Tasks, scoped by boundary)
    │   └── Notes (Project Notebook — 1:1 per project)
    │
    ├── Project B (different SOW, different boundary)
    └── Project C (may share boundary with A)
```

### Task Hierarchy Within a Project

```
Project
├── Activity (phase of work — e.g., RFP Response, Skill Assessment, Task Execution)
│   ├── Task (requirement type — functional, legal, compliance)
│   │   ├── SubTask (individual work item — assignable, trackable, billable)
│   │   └── SubTask 2 ...
│   └── Task 2 ...
└── Activity 2 ...
```

### Platform Entity Mapping

| SME Mart | ZB Platform | Notes |
|----------|-------------|-------|
| Org | `Org` | 1:1 |
| Engagement | None (Neon `work_requests`) | Corp-to-corp container |
| Project | `Project` (future, tag-based) | Scoped work, where $ flows |
| — (imported) | `Boundary` | Security/compliance envelope per project |
| Tasks | `Task` + `child_of` links | Scoped by boundary |

**Three perspectives at every level:**
1. **Demand side (buyer)** — private to buyer: sees requirements, status, progress indicators, deliverables
2. **Supply side (provider)** — private to provider: proposes task breakdown, tracks implementation, internal notes (hidden metadata)
3. **Transparency (shared middle)** — both parties + 3rd-party assessors: audit trail of assignments, completions, decisions, approvals

**Four dimensions surfaced in transparency:** $ (payments), Compliance, Functional deliverables, Legal adherence.

---

## RFP-to-Engagement Flow (2026-03-03)

Brian defined the full lifecycle from RFP to engagement execution:

```
1. Buyer creates RFP
   ├── Project overview, scope, deliverables, timeline
   ├── Success criteria
   ├── Compliance/legal requirements
   └── Budget

2. Vendors respond with bids
   ├── Proposed task breakdown (requirement → tasks → subtasks)
   ├── Timeline estimates
   └── Pricing

3. Demand-side reviews vendor bids
   ├── Accept → creates engagement
   ├── Reject → vendor notified
   └── Request changes → negotiation loop (back to vendor)

4. Accepted bid → Engagement created
   └── Vendor's task breakdown becomes engagement tasks

5. Engagement execution
   ├── Vendor works tasks: pending → in_progress
   ├── Vendor marks complete → awaiting_approval
   ├── Demand-side reviews → approve or reject
   └── Approval triggers invoice generation (line items per task/subtask)
```

**Wizard-style creation suggested:** Engagement details → Requirements → Timeline → Success criteria.

---

## Scope Adjustment & Change Management (2026-03-03)

Formal process to prevent scope creep:

1. **Demand-side submits scope change request** — add/remove/modify tasks
2. **Vendor responds** with updated estimates and pricing
3. **Both parties agree** on new scope
4. **Change history maintained** — original scope → proposed change → agreed scope (auditable)

---

## Data Classification (2026-03-03)

Brian expanded on data sensitivity requirements:

- **Classification levels:** PII, CUI, HIPAA, confidential
- **Classification affects:** access control, audit logging, storage location
- **Sensitive data access must be logged** for compliance
- **Supply-side notes** may be hidden from demand-side but access still logged
- **Future:** specialized/encrypted storage for sensitive data (for now, handle with access control + audit trails)

---

## Current State (2026-03-04)

### What's Built

| Layer | Status | Details |
|-------|--------|---------|
| **Angular 21 scaffold** | Complete | Standalone components, SDK + ngx-library, M3 theme, proxy configs |
| **Data layer** | Complete | Generic SQL Hub Module → Neon PostgreSQL, 15 tables, 6 VIEWs |
| **Service layer** | Complete | 10+ services (catalog, profiles, proposals, engagements, etc.) + 8 models |
| **Marketplace** | Complete | Landing page, provider directory (6-type filters), provider detail, service catalog |
| **Profiles** | Complete | My profile, expertise pickers, service offerings, reviews + moderation |
| **Engagements** | In Progress | RFP list, engagement detail with tabs (overview, details, tasks, timeline), bid management |
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
| SM-17 | **Activity layer in engagement** | **High** | — | New "Activity" level between engagement and tasks (RFP response, skill assessment, task execution) |
| SM-18 | **RFP creation flow** | **High** | SM-17 | Wizard-style: project overview → scope → deliverables → timeline → compliance/legal → budget |
| SM-19 | **Vendor bid/response flow** | **High** | SM-18 | Vendor proposes task breakdown, timeline, pricing in response to RFP |
| SM-20 | **Bid review & negotiation** | **High** | SM-19 | Demand-side accept/reject/request changes loop |
| SM-21 | **Task approval workflow** | **High** | SM-17 | Vendor marks complete → awaiting_approval → demand-side approve/reject |
| SM-22 | **Invoice generation** | Medium | SM-21, ZB-6 | Auto-generate invoice with line items per task/subtask on approval |
| SM-23 | **Scope adjustment / change requests** | Medium | SM-17 | Formal change request process with audit trail of scope changes |
| SM-24 | **Demand/supply view filtering** | **High** | SM-17 | Role-based visibility: demand sees requirements + status, supply sees execution + internal notes |
| SM-25 | **Progress indicators** | Medium | SM-24 | On-track / behind / ahead visual status for demand-side |
| SM-26 | **Living engagement documentation** | Medium | — | Meeting-driven task creation, engagement docs updated as requirements emerge |

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

### Brian's Marketplace Roadmap (2026-03-03)

Brian defined a 3-phase marketplace build-out with scope adjustment as a cross-cutting concern:

| Phase | Focus | Key Features |
|-------|-------|-------------|
| **Phase 1** | RFP + Engagement Creation | RFP flow, engagement creation wizard, activity/task/subtask hierarchy |
| **Phase 2** | Engagement Execution | Task management, approvals, invoicing, demand/supply views |
| **Phase 3** | Observability + Audit | Transparency center, C-Traces, compliance tracking, audit trails |
| **Cross-cutting** | Scope Adjustment | Change requests, re-estimation, change history |

### Tier 1 — Finish What's Started (Now)

| Item | Owner | Rationale |
|------|-------|-----------|
| SM-1: Notes feature | Clark | In progress, finish it |
| SM-2: Engagement detail polish | Clark | Core engagement UX needs refinement |
| SM-11: S3/CloudFront deployment | Clark | Get off Vercel |

### Tier 1b — Marketplace Phase 1 (Next Priority per Brian)

| Item | Owner | Rationale |
|------|-------|-----------|
| SM-17: Activity layer | Clark | Foundation for engagement hierarchy — gates everything else |
| SM-18: RFP creation flow | Clark | Buyer creates RFP with wizard flow. Needs Brian's spec doc |
| SM-19: Vendor proposal flow | Clark | Vendor responds with task breakdown, timeline, pricing |
| SM-20: Proposal review loop | Clark | Accept/reject/negotiate cycle |
| SM-24: Demand/supply views | Clark | Role-based filtering of task visibility |

### Tier 2 — Marketplace Phase 2 (After Phase 1)

| Item | Owner | Rationale |
|------|-------|-----------|
| SM-21: Task approval workflow | Clark | Vendor → awaiting_approval → demand approves/rejects |
| SM-22: Invoice generation | Clark + ZB-6 | Auto-invoice on approval with task line items |
| SM-23: Scope adjustment | Clark | Formal change request process |
| SM-25: Progress indicators | Clark | On-track/behind/ahead for demand-side |
| SM-4: Dashboard pages | Clark | Role-specific landing for buyers and providers |

### Tier 3 — Polish & Infrastructure

| Item | Owner | Rationale |
|------|-------|-----------|
| SM-3: ngx-library re-skin (Phase 6) | Clark | Consistency with ZB platform apps before demo |
| SM-14: Pagination | Clark | List pages need it before real data volume |
| SM-26: Living engagement docs | Clark | Meeting-driven task creation |

### Tier 4 — Blocked by Platform (Track & Push)

| Item | Blocker | Rationale |
|------|---------|-----------|
| SM-8: Transparency Center UI (Plan 023) | ZB-1, ZB-2, ZB-3 | Brian's flagship feature (Phase 3). Push Kevin on Project entity |
| SM-7: Matching OS UI | ZB-4 | Credential-aware search. Needs extended user/org profile |
| SM-9: Board management | ZB-8 | Board entity/implementation TBD |
| SM-15: Readiness display (Plan 024) | ZB-5, SM-8 | Depends on scoring app + transparency center |

### Tier 5 — External Dependencies (Coordinate)

| Item | Dependency | Rationale |
|------|-----------|-----------|
| 3P-1: Stripe Connect | Billing app design | Marketplace payments — needs billing app architecture first |
| 3P-5: Credly connector | Connector builder | First credentialing prototype |
| 3P-6: Government ID | Brian's provider selection | login.gov vs ID.me decision |
| ZB-6: Billing app | Separate team/project | Requirements captured, hand off when dev starts |

### Tier 6 — Future (Research / Vision)

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
| Hierarchy: Org → Engagement → Project → Boundary → Task (reconciled) | Brian + Kevin + Clark | 2026-03-09 |
| Engagement = corp-to-corp (MSA, D&B), Project = scoped work (SOW) | Brian | 2026-03-06 |
| Boundaries imported at Project level from buyer's boundary selection | Clark | 2026-03-09 |
| Notes scoping: edit-at-level, read-down, boundary membership = access | Clark | 2026-03-09 |
| Three perspectives at every level: buyer, supplier, shared | Brian | 2026-02-25 |
| Credentialing is org-level (Governance app), not SME Mart | Brian | 2026-02-27 |
| "Matching OS" = credential-aware search/filter in SME Mart | Brian | 2026-02-27 |
| Scoring is a separate ZB platform app | Brian | 2026-02-25 |
| Billing is a separate ZB platform app | Brian | 2026-02-25 |
| ZeroBias takes ~3% of all marketplace transactions | Brian | 2026-02-27 |
| Task-level billing with heterogeneous methods per task | Brian | 2026-02-27 |
| Schema extension: build in Neon, prototype, hand back to core | Brian | 2026-02-27 |
| Assume full transparency for all agentic runs | Brian | 2026-02-20 |
| Four-level marketplace hierarchy: Engagement → Activity → Task → Subtask | Brian | 2026-03-03 |
| Three-sided task model: demand / shared (transparency) / supply | Brian | 2026-03-03 |
| RFP creates engagement — accepted vendor proposal becomes engagement tasks | Brian | 2026-03-03 |
| Task status lifecycle: pending → in_progress → awaiting_approval → completed | Brian | 2026-03-03 |
| Approval gates billing — demand-side must approve before invoice generation | Brian | 2026-03-03 |
| Formal scope adjustment / change request process with audit trail | Brian | 2026-03-03 |
| Engagement docs are living — meetings surface new tasks | Brian | 2026-03-03 |
| Data classification (PII/CUI/HIPAA/confidential) affects access + audit | Brian | 2026-03-03 |
| Marketplace phases: 1=RFP+Creation, 2=Execution, 3=Observability | Brian | 2026-03-03 |

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
| Scope adjustment workflow details — who approves, billing adjustment mechanics? | Brian | Formal process discussed but details TBD |
| Hidden supply-side metadata — where's the line between privacy and transparency? | Brian | What types of notes should be hidden from demand-side? |
| Automated vs. manual task creation from RFP? | Brian | Vendor always proposes breakdown, or auto-convert requirements? |
| Cross-engagement task dependencies? | Brian/Kevin | Can tasks reference other engagements? Boundary isolation? |
| Subtask granularity — how fine-grained before it becomes noise? | Brian | Practical limits on subtask creation |
| Can a Project span multiple Boundaries? | Brian/Kevin | Feb 25 CEO notes say yes. UI scoping implications? |
| Should Engagement have its own Boundary? | Brian/Kevin | If Project gets boundary, does Engagement need one for corp-level access? |
| Bidirectional requirements at Project level? | Brian | Vendor also has requirements from buyer (tech lead, contacts). How to model? |
| Per-project vs per-engagement billing? | Brian | If Projects are the work container, where does billing roll up? |

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
| Meeting #3 (2026-03-03) | `.claude/notes/meetings/2026-03-03-marketplace-meeting.md` |
