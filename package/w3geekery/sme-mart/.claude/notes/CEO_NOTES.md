# CEO Notes

Strategic direction and requirements from Brian (CEO).

---

## 2026-02-06: Transparency Center Vision

### Overview

The Transparency Center is a multi-faceted feature for managing visibility and trust between Providers (Sellers) and Buyers in the SME Mart marketplace.

### Three Components

#### 1. Provider Internal Transparency Center
- **Source**: Data from Readiness Center (provider's internal compliance/readiness data)
- **Purpose**: Providers choose what to "share" with specific Buyers under NDA
- **Scope**: Multiple data permission sets per buyer engagement
- **Tied to**: Tasks, the app, and their stack (boundary)

#### 2. Shared Transparency Center
- **Visibility**: Both Seller and Buyer can see
- **Purpose**: Common ground / shared view of engagement status

#### 3. Buyer Transparency Management Interface
- **Purpose**: Buyers define "requirements" - what they demand to see from each seller
- **Scope**: Tasks, app, stack visibility requirements
- **Control**: Buyer-side control over transparency expectations

### End-to-End Audit Trail Vision

**Goal**: Tie visibility end-to-end into the Task system

Each Task should audit from:
```
Buy-side Boundary
    ↓
Seller-side Environment (stack defined in boundary serving the client)
    ↓
Desktop (human operator)
    ↓
Each Agentic Session
```

### Key Requirements

1. **NDA-gated data sharing** - Provider controls what Readiness data is visible per engagement
2. **Per-buyer permission management** - Different visibility rules for each buyer relationship
3. **Task-centric audit** - All transparency tied back to ZeroBias Tasks
4. **Boundary integration** - Leverages ZeroBias Boundaries for access control
5. **Full chain visibility** - From buyer boundary → seller stack → human desktop → agentic sessions

### Technical Implications

- Requires ZeroBias Boundaries integration (Plan 010)
- Requires ZeroBias Tasks integration (Plan 009)
- Need permission model for selective data exposure
- Need audit trail linking Tasks to all touchpoints
- Agentic session tracking within Tasks

---

*Captured: 2026-02-06 for planning call*

---

## 2026-02-24: Stripe Integration & Embedded Wallets

### Brian's Directive (Slack, 3:44–3:56 PM PT)

> "Need to look at all stripe companies and integrate"
> "Stripe Atlas among other that Anthropic use"
> "We will embed wallets in the marketplace with Privy. Allow for stable coins and transactions globally for all Guild marketplace members"
> "Tempo looks interesting as well as Privy and some others."

### Context: Stripe Annual Letter 2025 (Feb 24, 2026)

Brian shared the Stripe annual letter. Key items relevant to SME Mart:

#### Privy (Wallet Infrastructure)
- Powers **110M+ programmable wallets**
- Single API to provision wallets in both custodial and noncustodial modes
- Used by Ramp, Deel for embedded digital wallets
- Acquired by Stripe — now part of their ecosystem
- **Brian's vision:** Embed Privy wallets in the Guild marketplace for global stablecoin transactions

#### Tempo (Stripe's Payments Blockchain)
- Purpose-built blockchain for payments (not trading/DeFi)
- Sub-second finality, dedicated payment lanes, opt-in privacy
- Interoperability with compliance and accounting systems
- Visa, Nubank, Shopify already testing for: global payouts, embedded finance, remittances
- **Relevant:** Well-suited for agentic payments and microtransactions
- Mainnet launching soon

#### Bridge (Stablecoin Orchestration)
- Stripe acquisition, volume quadrupled in 2025
- Enables stablecoin-backed cards (spend stablecoins, merchant receives local fiat)
- Phantom wallet using Bridge for stablecoin cards (20M monthly users)
- Open Issuance for cross-border settlement

#### Stablecoins — Market Context
- **$400B** in stablecoin payments volume (doubled YoY), ~60% B2B
- Diverged from crypto prices — real-world adoption accelerating
- Y Combinator founders can receive funding in stablecoins, hold in Stripe financial accounts, pay engineers globally
- Smart contracts enable recurring SaaS payments without manual wallet signing

#### Stripe Atlas
- 41% increase in company formations
- 20% of Atlas startups charge first customer within 30 days (up from 8% in 2020)
- "Anthropic uses" — Brian calling out as relevant infrastructure

#### Agentic Commerce (Future Direction)
- Stripe's 5-level framework for AI agent purchasing
- Agentic Commerce Suite: Anthropologie, Urban Outfitters, Etsy, Coach onboarding
- Machine payments: agents pay for API calls via stablecoin micropayments
- Agents as a new customer type for internet businesses
- Agentic Commerce Protocol (ACP) developed with OpenAI — open standard

### Implications for SME Mart

1. **Privy wallet integration** — Global payments for Guild members via embedded wallets
2. **Stablecoin support** — Cross-border SME payments without traditional banking friction
3. **Stripe Atlas** — Potential for SME providers to incorporate businesses through marketplace
4. **Tempo blockchain** — Future infrastructure for marketplace transactions, especially micro-payments for expert consultations
5. **Agentic commerce** — AI agents procuring SME services on behalf of organizations

### Action Items

- [ ] Research Privy API and wallet embedding patterns
- [ ] Evaluate Stripe Connect vs Financial Accounts for marketplace payments
- [ ] Investigate Tempo testnet for SME Mart transaction prototype
- [ ] Map Stripe Atlas integration opportunity for provider onboarding
- [ ] Review Bridge for cross-border payout support

*Captured: 2026-02-24 from Slack + Stripe Annual Letter 2025*

---

## 2026-02-25: Project → Boundary → Task Hierarchy & Transparency Center Architecture

### Brian's Directive (Slack, 2:05–2:15 PM PT)

Brian described the engagement hierarchy and Transparency Center architecture. His language used "Engagement" as the top-level wrapper, but mapping to Kevin's platform reality, the hierarchy is:

### Hierarchy: Project → Boundary → Board → Task → SubTask

Brian's "Engagement" (org-to-org admin: W-9, tax, DUNS, banking, exec background checks) maps to **Boundary** in the ZB platform. Brian's "Project" (scope of work, where $ happens) maps to **Project** — a tag-based wrapper that sits *above* Boundaries.

```
Project (tag-based wrapper — scope of work, where $ happens)
│  Owned by org, inherits org permissions
│  Gets a Tag, two groups (Members + Admins), tag-based access rules
│  Worker background checks at this level
│  Transparency rollups land here
│  Can span multiple boundaries
│
├── Boundary (org-to-org: W-9, tax, DUNS, banking, exec checks)
│   ├── Board (user-created collection of Tasks)
│   │   │  Multiple boards per boundary
│   │   │  Per-board user permissions
│   │   │  Organizes tasks by theme, phase, team, etc.
│   │   │
│   │   ├── Task (how outcomes delivered: apps/services/agents)
│   │   │   ├── SubTask: Legal readiness
│   │   │   ├── SubTask: Financial ($) readiness
│   │   │   ├── SubTask: Cyber/compliance readiness
│   │   │   └── SubTask: Functional outcomes
│   │   └── Task 2 ...
│   │
│   ├── Board 2 ("Sprint 1", "Compliance Review", etc.)
│   │   └── Task 3 ...
│   │
│   └── Board N (as many as user wants)
│
└── Boundary 2 (if project spans orgs)
```

**Key distinctions:**
- **Project** = tag-based wrapper binding boundaries, tasks, subtasks, products, API ops, data objects. Where money flows. Different teams on different projects. Members + Admins groups provide access control.
- **Boundary** = org-to-org security zone. W-9, tax, DUNS, banking, exec background checks. Resources NOT in the boundary are not visible (enforced by ZB Boundary Manager app).
- **Board** = user-created collection of Tasks within a Boundary. Unlimited boards per boundary. Each board has its own user permissions (view/edit/admin). Used to organize tasks by theme, phase, team, workstream, or any grouping the user wants. Think: Trello/Jira boards, but scoped to a Boundary.
- **Task** = how outcomes are delivered (apps, services, agents).
- **SubTask** = readiness dimensions: legal, financial, cyber, clinical, functional outcomes.

**Design caution (from Kevin):** Tag-based project rules are a competing dimension with existing boundary security. Need a clear conflict resolution strategy (e.g., top-secret doc tagged into a project with broader visibility).

### Three Perspectives at Every Level

| Perspective | Visibility |
|-------------|-----------|
| **Demand side (buyer)** | Private to buyer |
| **Supply side (provider)** | Private to provider |
| **Transparency (shared middle)** | Both parties + 3rd-party assessors/insurers |

**What gets surfaced:**
- **$** — pricing, charges, payment status
- **Compliance** — regulatory/standard adherence
- **Functional deliverables** — actual work output
- **Legal adherence** — contractual/legal requirement satisfaction

### Readiness Rollups

Subtasks measure readiness across dimensions (legal, financial, cyber, clinical, functional outcomes). Rolls up: **SubTask → Task → Board → Boundary → Project** — giving a full transparency readiness view. Both parties measure against **Requirements** as the common yardstick.

### Supporting Infrastructure

- **Boards** at multiple levels: User (private/shared), Project, Boundary — each Board is a collection of Tasks with its own user permissions. As many Boards as desired per Boundary.
- Additional resources as needed: time cards, message boards, calendars
- Projects can span boundaries; members, observers, and 3rd-party assessors can participate

### Scoring, Billing & Assessments Clarification

- **Scoring** = a functional product — will come from a **separate ZB scoring app**, not SME Mart
- **Billing** = will come from a **separate ZB billing app**, not SME Mart
- Both scoring and billing are ZB platform apps that SME Mart will consume, not build
- **Assessments** = tied to "Readiness" concept
- **Readiness** = supplier-side construct. Multiple assessments roll into a readiness score.
- Assessments live at the supply side of the marketplace

### ZB Platform Status

- **Project entity** — on Kevin's near-term roadmap. Tag-based wrapper with Members/Admins groups.
- **Task Activities** — define custom fields on tasks/subtasks. Currently not customizable, but near-term plan to allow creating custom Activities (will solve subtask typing for legal/financial/functional).
- **Task Attachments** — already exist in SDK, uploads to AWS owned by ZB. No platform change needed.
- **Boundary visibility** — already enforced by Boundary Manager app. Resources not in boundary are not visible.

### Technical Implications

1. **SME Mart "engagements" map to Boundaries** — current `work_requests` table represents the org-to-org relationship. When Projects arrive on platform, SME Mart wraps boundaries in projects.
2. **Boards organize Tasks within Boundaries** — a Board is a user-created collection of Tasks with per-board permissions. Multiple boards per boundary allow different teams/workstreams to manage their own task views. Platform implementation TBD (may be ZB Tags, a new entity, or Neon-backed).
3. **Transparency Center needs 3 perspectives** — buyer, supplier, shared (+3rd-party assessors/insurers). Aggregation from subtask → task → board → boundary → project.
4. **Subtask typing via Task Activities** — when custom Activities are available, use them for legal/financial/functional dimensions. Until then, use tags or Neon metadata.
4. **$ tracking** — money flows at Project level. Billing is a separate ZB app; SME Mart consumes.
5. **Readiness concept** — supplier-side feature where assessments roll up into readiness per domain.

*Captured: 2026-02-25 from Slack. Reframed to match ZB platform reality (Kevin's Project → Boundary → Task model).*
