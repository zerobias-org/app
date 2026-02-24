# Engagement Lifecycle Design

**Status:** Planning (Updated with Competitor Research)
**Created:** 2026-02-04
**Updated:** 2026-02-06
**Author:** Clark

---

## Overview

This document defines the end-to-end engagement lifecycle for SME Mart, covering both buyer and provider journeys from discovery through completion and payment.

**Research Note:** Updated with findings from competitor documentation research. See `.claude/research/competitor-engagement-flows.md` for detailed Upwork/Fiverr analysis.

---

## Personas

### Persona 1: Provider (Expert/SME)

**Profile:** Compliance professional, security consultant, assessor, or specialist offering services through SME Mart.

**Goals:**
- Get discovered by potential buyers
- Receive and respond to work opportunities
- Execute work in a secure, tracked environment
- Get paid fairly and on time
- Build reputation through completed work and reviews

### Persona 2: Buyer (Compliance Director/Org)

**Profile:** Organization or individual seeking compliance expertise - assessments, consulting, implementation help, training, etc.

**Goals:**
- Find qualified experts for specific needs
- Evaluate candidates based on skills, experience, reviews
- Engage experts with clear scope and pricing
- Track work progress and deliverables
- Pay securely upon satisfactory completion

---

## Gap Analysis: SME Mart vs Competitors

Based on competitor research from Upwork and Fiverr official documentation (see `.claude/research/competitor-engagement-flows.md`).

### Critical Gaps (High Priority)

| Gap | Upwork | Fiverr | SME Mart Current | Impact |
|-----|--------|--------|------------------|--------|
| **Messaging System** | Messages workspace + Direct Messages | Inbox with file sharing, Zoom | ❌ None | Buyers/providers can't communicate pre-engagement |
| **Escrow/Payment Protection** | Project Funds with 14-day review | Funds held until complete + 14-day clearance | ❌ Off-platform only | No buyer protection, no trust |
| **Contract/Agreement** | Formal contracts with milestones | Gig package = implicit contract | ❌ Proposal acceptance only | No formal terms, scope disputes likely |
| **Time/Work Tracking** | Desktop app + Work Diary | Milestone-based + hourly work | ❌ Manual only | No visibility into work progress |
| **Dispute Resolution** | 7-day → mediation → arbitration | Resolution Center (48hr response) | ❌ None defined | No recourse when things go wrong |
| **Auto-Complete Timer** | 14 days no response = approved | 3 days (8 for milestones) | ❌ None | Engagements can stall indefinitely |

### Important Gaps (Medium Priority)

| Gap | Upwork | Fiverr | SME Mart Current | Impact |
|-----|--------|--------|------------------|--------|
| **Reputation Score** | Job Success Score (%) | Success Score + Levels | ⚠️ Star rating only | Single metric doesn't capture full performance |
| **Trust Badges** | Rising/Top Rated/Expert-Vetted | Levels (L1/L2/Top Rated) + Pro | ⚠️ None | No way to signal quality at a glance |
| **Response Time** | Tracked, recommended <2hr | Displayed on profile, affects ranking | ⚠️ Schema exists, not calculated | Buyers can't gauge provider responsiveness |
| **Productized Services** | Project Catalog | Gig packages (3-tier) | ⚠️ Services exist, no packages | Providers can't offer tiered pricing |
| **Delivery Workflow** | Submit → 14 days review | Deliver → 3 days auto-accept | ⚠️ Mark complete only | No structured handoff |
| **Revision Handling** | Per milestone agreement | Defined per package | ❌ Not tracked | Scope creep risk |
| **Review Window** | Feedback at contract end | 14 days to review | ⚠️ Review exists, timing unclear | Reviews may come too late or not at all |

### Nice-to-Have Gaps (Lower Priority)

| Gap | Upwork | Fiverr | SME Mart Current | Impact |
|-----|--------|--------|------------------|--------|
| **Connects/Credits** | Virtual tokens to apply | N/A (buyers pay) | ❌ None | No mechanism to ensure quality proposals |
| **Proposal Boost** | Pay extra for visibility | Seller Plus features | ❌ None | No premium placement option |
| **On-Time Delivery Rate** | Tracked in JSS | Tracked in Success Score | ❌ Not tracked | Missing performance metric |
| **Repeat Client %** | Visible on profile | Tracked | ❌ Not tracked | Missing loyalty indicator |
| **Video Calls** | Built into Messages | Zoom integration | ❌ None | No live consultation option |
| **File Size Limits** | 500MB in messages | 5GB in delivery | ❌ Not specified | Could cause issues at scale |
| **Requirements Form** | Questions in proposal | Collected at order start | ❌ None | Missing structured intake |

### What SME Mart Has That Competitors Don't

| Feature | SME Mart | Upwork/Fiverr | Advantage |
|---------|----------|---------------|-----------|
| **ZeroBias Identity** | Platform-verified identity | Separate ID verification | Trust from ecosystem |
| **ZeroBias Boundaries** | Secure, scoped work environments | No equivalent | Compliance-grade access control |
| **ZeroBias Tasks** | Audit trail for all work | Basic tracking only | Complete compliance context |
| **Framework/Standard Skills** | Compliance-specific taxonomy | Generic skills | Domain-specific matching |
| **Compliance Focus** | Specialized marketplace | General freelancing | Targeted audience, less noise |

### Competitor Fee Comparison

| Fee Type | Upwork | Fiverr | SME Mart (Proposed) |
|----------|--------|--------|---------------------|
| **Buyer Service Fee** | Up to 7.99% + $0.99-$14.99 initiation | 5.5% + $3.50 (orders <$200) | 5-10% |
| **Seller Commission** | 0-15% variable per contract | 20% flat | 10-15% |
| **Total Take Rate** | ~15-23% | ~25% | ~15-25% |

**Recommendation:** Target 10-15% total take rate to be competitive with Upwork while simpler than their tiered structure.

---

## Current State (As Built)

### What Exists

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Buyer     │────▶│    Work     │────▶│  Proposals  │────▶│   Status    │
│ Posts Request│     │   Request   │     │ from Provs  │     │  Tracking   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**Implemented:**
- Work Request creation (title, description, category, budget, timeline)
- Proposal submission (cover letter, price, timeline)
- Proposal accept/reject workflow
- Status progression: `open` → `in_progress` → `completed` / `cancelled`
- Reviews and ratings (with approval workflow)
- Provider profiles with skills, services, stats

**Not Implemented:**
- Direct hire flow (buyer → specific provider)
- Communication/messaging between parties
- Contract or Statement of Work generation
- Payment processing
- ZeroBias Boundary integration (secure work environment)
- ZeroBias Task integration (work/hour tracking)
- Automatic stats updates (jobs completed, earnings)
- Engagement history view

---

## Engagement Flows

### Flow A: Work Request → Proposal (Current Model)

This is the "Upwork job posting" model where buyers post needs and providers bid.

```
BUYER                                    PROVIDER
  │                                          │
  ├─▶ 1. Create Work Request                 │
  │   (category, description, budget)        │
  │                                          │
  │                              2. Browse ◀─┤
  │                                 Requests │
  │                                          │
  │                           3. Submit  ◀───┤
  │                              Proposal    │
  │   ┌──────────────────────────────────────┤
  │   │  (cover letter, price, timeline)     │
  │   ▼                                      │
  ├─▶ 4. Review Proposals                    │
  │                                          │
  │   ┌─── 5. Clarifying Questions? ─────────┤  [GAP: No messaging]
  │   │                                      │
  │   ▼                                      │
  ├─▶ 6. Accept Proposal                     │
  │                                          │
  │   ════════ ENGAGEMENT BEGINS ════════    │
  │                                          │
  │   ┌─── 7. Contract/SOW? ─────────────────┤  [GAP: Not implemented]
  │   │                                      │
  │   ┌─── 8. Payment/Escrow? ───────────────┤  [GAP: Not implemented]
  │   │                                      │
  │   ┌─── 9. Work Environment? ─────────────┤  [GAP: ZB Boundary]
  │   │                                      │
  │                             10. Do ◀─────┤
  │                                 Work     │
  │                                          │
  │   ┌─── 11. Track Progress? ──────────────┤  [GAP: ZB Tasks]
  │   │                                      │
  │                             12. Mark ◀───┤
  │                                Complete  │
  │   ▼                                      │
  ├─▶ 13. Review Deliverables                │
  │                                          │
  ├─▶ 14. Approve Completion                 │
  │                                          │
  │   ┌─── 15. Release Payment? ─────────────┤  [GAP: Not implemented]
  │   │                                      │
  ├─▶ 16. Leave Review                       │
  │                                          │
  │   ════════ ENGAGEMENT COMPLETE ═══════   │
  │                                          │
  └─▶ 17. View in History                    │  [GAP: History view]
```

### Flow B: Direct Hire (Not Yet Built)

This is the "find and hire specific expert" model.

```
BUYER                                    PROVIDER
  │                                          │
  ├─▶ 1. Browse /providers                   │
  │   (filter by skills, category, etc.)     │
  │                                          │
  ├─▶ 2. View Provider Profile               │
  │   (skills, services, reviews, rates)     │
  │                                          │
  ├─▶ 3. Click "Hire" or "Request Service"   │
  │                                          │
  │   ┌─── What happens here? ───────────────┤  [DECISION NEEDED]
  │   │                                      │
  │   │  Option A: Create Work Request       │
  │   │            pre-filled, targeted      │
  │   │            to this provider          │
  │   │                                      │
  │   │  Option B: Purchase a Service        │
  │   │            Offering directly         │
  │   │            (fixed price/scope)       │
  │   │                                      │
  │   │  Option C: Send Inquiry/Message      │
  │   │            to discuss before         │
  │   │            formal engagement         │
  │   │                                      │
  │   ▼                                      │
  │   ... continues to engagement flow ...   │
```

### Flow C: Service Offering Purchase (Productized Services)

This is the "Upwork Project Catalog" or "Fiverr Gig" model - pre-packaged services.

```
BUYER                                    PROVIDER
  │                                          │
  │                         (Previously) ◀───┤
  │                         Created Service  │
  │                         Offering with    │
  │                         fixed price/scope│
  │                                          │
  ├─▶ 1. Browse /services                    │
  │                                          │
  ├─▶ 2. View Service Details                │
  │   (price, deliverables, timeline)        │
  │                                          │
  ├─▶ 3. Click "Purchase" or "Order"         │
  │                                          │
  │   ┌─── 4. Customize? ────────────────────┤  [Optional requirements]
  │   │                                      │
  │   ┌─── 5. Payment ───────────────────────┤  [GAP: Not implemented]
  │   │                                      │
  │   ════════ ENGAGEMENT BEGINS ════════    │
  │                                          │
  │   ... continues similar to Flow A ...    │
```

---

## Decision Points

### 1. Communication Model

How do buyers and providers communicate during the engagement lifecycle?

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A: ZeroBias Tasks** | All communication via ZeroBias Task comments | Uses existing infrastructure; audit trail; secure | Requires ZB integration; may feel disconnected from SME Mart |
| **B: In-App Messaging** | Build messaging system in SME Mart | Seamless UX; all in one place | Significant dev effort; another system to maintain |
| **C: External Only** | Email links, no in-app messaging | Zero dev effort | Poor UX; no tracking; messages get lost |
| **D: Hybrid** | Initial inquiry in SME Mart; work comms in ZB Tasks | Best of both; clear separation | Two systems to understand |

**Recommendation:** Option D (Hybrid)
- Pre-engagement: Simple inquiry/message in SME Mart (or just proposal comments)
- Post-engagement: All work communication via ZeroBias Tasks within Boundary

**Competitor Insight:**
- Upwork: Pre-contract messaging limited (5/day for free tier), contact info only after contract
- Fiverr: Unified inbox, auto-reply feature, response time tracked and displayed
- Both track response times and it affects search ranking

**SME Mart Approach:**
1. Phase 1: Proposal comments only (already have this structure)
2. Phase 1.5: Add simple inbox for pre-engagement inquiries (track response time)
3. Phase 2+: All work communication via ZB Tasks (full audit trail)

---

### 2. Contract / Statement of Work

What formalizes the engagement agreement?

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A: None** | Proposal acceptance = informal agreement | Simple; fast | No legal protection; scope disputes |
| **B: Simple Terms** | Auto-generated summary of agreed terms (price, timeline, scope from proposal) | Low effort; clear record | Not legally binding |
| **C: SOW Template** | Generate formal SOW document from template, require acceptance | Professional; clear scope | More friction; template maintenance |
| **D: E-Signature Integration** | DocuSign/PandaDoc integration for formal contracts | Legally binding; professional | Complexity; cost; friction |
| **E: External** | Users handle contracts outside SME Mart; track status only | Flexible; no liability | No standardization; tracking issues |

**Recommendation:** Start with Option B, evolve to C
- Phase 1: Auto-generated engagement summary (parties, scope, price, timeline, terms)
- Phase 2: Optional SOW template generation
- Future: E-signature integration if demand exists

**Competitor Insight:**
- Upwork: Formal contracts with project title, description, payment terms, milestones, weekly limits
- Fiverr: Gig package = implicit contract (scope, price, delivery time, revisions defined upfront)
- Both have clear "what you're getting" before work starts

**SME Mart Approach:**
1. For Service Catalog purchases: Service package defines the "contract" (Fiverr model)
2. For Work Requests: Accepted proposal terms become the contract (Upwork model)
3. Auto-generate summary document with: parties, scope, deliverables, price, timeline, revision count, payment terms

---

### 3. Payment Model

How does money flow between parties?

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A: Off-Platform** | Users handle payments externally (Venmo, wire, etc.); SME Mart tracks status only | Zero liability; simple | No protection; no fee revenue; fraud risk |
| **B: Mercury Integration** | Use ZeroBias Mercury banking integration | Native to ZeroBias ecosystem; business banking features | Dependency on Mercury rollout; US-centric |
| **C: Stripe Connect** | Standard marketplace payment processing with escrow | Proven; handles escrow, splits, payouts | Fees; compliance burden; setup complexity |
| **D: Credit System** | Pre-purchased credits (VoltAgent model) | Predictable revenue; reduces payment friction | Users must pre-fund; mental model shift |

**Recommendation:** Phase approach
- Phase 1: Option A (Off-Platform) - track payment status manually
- Phase 2: Option B (Mercury) when available, or Option C (Stripe) as fallback
- Consider Option D for micro-transactions (quick consultations, agent usage)

**Competitor Insight:**
- **Upwork Fixed-Price:** Client funds milestone before work starts → Freelancer submits → 14 days to approve/request changes → Auto-release if no response
- **Upwork Hourly:** Work logged in Work Diary → Weekly automatic billing every Monday
- **Fiverr:** Pre-pay at checkout → Work delivered → 3 days to accept/request revisions → Auto-complete → 14-day clearance before payout

**Key Patterns:**
1. **Escrow is table stakes** - Both platforms hold funds to protect both parties
2. **Auto-release timers prevent stalling** - 3-14 days depending on context
3. **Clearance period** - 14 days between completion and payout (fraud protection)
4. **Weekly billing for hourly** - Predictable payment cycles

**SME Mart Approach:**
1. Phase 1: Off-platform with status tracking (pending → paid)
2. Phase 2: Escrow via Stripe Connect or Mercury
3. Add auto-release timer: 7 days for deliverable review (between Fiverr's 3 and Upwork's 14)
4. Clearance period: 7-14 days before provider payout

---

### 4. Fee Structure

How does SME Mart generate revenue?

| Model | Description | Examples |
|-------|-------------|----------|
| **Platform Fee %** | Take percentage of each transaction | Upwork: 5-20%; Fiverr: 20%; App Store: 15-30% |
| **Subscription (Provider)** | Providers pay monthly for listing/features | LinkedIn Premium; featured listings |
| **Subscription (Buyer)** | Buyers pay for access/unlimited hiring | Toptal model |
| **Transaction Fee** | Flat fee per engagement | $X per contract |
| **Freemium** | Free basic, paid premium features | Enhanced profiles, analytics, priority support |

**Recommendation:** Platform Fee % (10-15%) + Freemium
- Base: Free to list, free to browse
- Fee: 10-15% platform fee on completed engagements (when payments integrated)
- Premium: Optional paid features (featured listings, analytics, priority matching)

**Competitor Insight:**
| Platform | Buyer Fee | Seller Fee | Notes |
|----------|-----------|------------|-------|
| **Upwork** | 7.99% + $0.99-$14.99 initiation | 0-15% variable | Seller fee locked per contract |
| **Fiverr** | 5.5% + $3.50 flat (<$200) | 20% flat | Simple but high seller fee |

**Key Observations:**
- Fiverr's 20% seller fee is high but simple
- Upwork's variable fee (0-15%) rewards long-term client relationships
- Both have buyer fees (marketplace is two-sided)
- Hidden/complex fees frustrate users

**SME Mart Approach:**
- **Seller Fee:** 12-15% (lower than Fiverr, competitive with Upwork)
- **Buyer Fee:** 5% (simple, transparent)
- **No initiation fees** (differentiation from Upwork)
- **Volume discounts:** Consider reduced fees for high-value engagements or repeat business (Phase 3+)

---

### 5. Work Execution Environment

Where and how does the actual work happen?

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A: External** | Work happens outside SME Mart entirely | Simple; flexible | No tracking; no audit trail; trust issues |
| **B: ZeroBias Boundary** | Create secure Boundary for each engagement; invite provider | Secure; scoped access; audit trail | Requires ZB integration; setup overhead |
| **C: ZeroBias Tasks** | Track work items, hours, deliverables in ZB Task system | Detailed tracking; integrates with ZB | Requires ZB integration |
| **D: Boundary + Tasks** | Full ZeroBias integration - Boundary for security, Tasks for tracking | Complete solution; enterprise-ready | Most complex; full ZB dependency |

**Recommendation:** Option D (Boundary + Tasks) as target
- Phase 1: External (status tracking only)
- Phase 2: ZeroBias Boundary creation on engagement start
- Phase 3: ZeroBias Task integration for work tracking

---

### 6. Engagement History & Reputation

What history is tracked and displayed?

| Data Point | Description | Current State |
|------------|-------------|---------------|
| **Reviews** | Star rating + text feedback | ✅ Built (with approval workflow) |
| **Jobs Completed** | Count of completed engagements | Schema field exists, not auto-updated |
| **Total Earnings** | Sum of completed engagement values | Schema field exists, not auto-updated |
| **Response Time** | Average time to respond to inquiries | Schema field exists, not calculated |
| **Job History** | List of past engagements (for provider and buyer) | ❌ Not built |
| **Repeat Clients** | Count/percentage of repeat buyers | ❌ Not tracked |
| **On-Time Delivery** | Percentage delivered by deadline | ❌ Not tracked |
| **Dispute Rate** | Percentage of engagements with disputes | ❌ Not tracked |

**Recommendation:** Build incrementally
- Phase 1: Auto-update jobs completed and earnings on completion
- Phase 2: Job history view (past engagements list)
- Phase 3: Advanced metrics (response time, on-time delivery, repeat clients)

---

### 7. Reputation & Trust Signals (NEW - from Research)

How do we signal provider quality and build trust?

**Competitor Analysis:**

| Signal | Upwork | Fiverr | Current SME Mart |
|--------|--------|--------|------------------|
| **Star Rating** | 1-5 per category (skills, comm, quality) | 1-5 overall | ✅ 1-5 overall |
| **Composite Score** | Job Success Score (%) | Success Score | ❌ Not implemented |
| **Level/Badge** | Rising → Top Rated → Top Rated Plus → Expert-Vetted | New → L1 → L2 → Top Rated → Pro | ❌ Not implemented |
| **Verification** | ID verified badge | ID verification required | ⚠️ ZB identity only |
| **Response Time** | Tracked, recommended <2hr | Displayed on profile | ⚠️ Schema exists, not calculated |
| **On-Time Delivery** | Factors into JSS | Factors into Success Score | ❌ Not tracked |
| **Repeat Clients** | Visible on profile | Tracked internally | ❌ Not tracked |

**Upwork Job Success Score (JSS) Formula:**
- Public feedback (star ratings)
- Private feedback (0-10 recommend score)
- Contract end reasons (completed vs cancelled vs client didn't pay)
- Dispute history
- Long-term relationships weighted higher
- Calculated from best of 6/12/24 month windows

**Fiverr Seller Levels:**
| Level | Requirements |
|-------|--------------|
| New Seller | Just started |
| Level 1 | 60+ days, X orders, Y rating |
| Level 2 | 120+ days, more orders, higher rating |
| Top Rated | Exceptional performance, high volume |
| Pro | Vetted by Fiverr, proven experience |

**SME Mart Approach:**

**Phase 1: Basic Reputation**
- Star rating (already have)
- Jobs completed count
- Total earnings display
- Response time calculation & display

**Phase 2: Composite Score**
- **SME Score** (0-100%): Weighted calculation from:
  - Average rating (40%)
  - On-time delivery rate (20%)
  - Response time score (15%)
  - Completion rate (15%)
  - Review sentiment (10%)

**Phase 3: Provider Levels**
| Level | Criteria | Benefits |
|-------|----------|----------|
| **New** | Just registered | Basic listing |
| **Verified** | ZB identity + skill verification | Badge, higher search ranking |
| **Established** | 5+ jobs, 4.5+ rating, 90%+ on-time | Featured in category |
| **Expert** | 20+ jobs, 4.8+ rating, 95%+ metrics | Premium placement, priority support |
| **Elite** | Invited/vetted, top 1% | Homepage feature, exclusive opportunities |

**Skill Verification Options:**
1. ZeroBias certification completion
2. Third-party certifications uploaded (CISSP, CISA, etc.)
3. Framework-specific assessments
4. Portfolio review by SME Mart team

---

### 8. Deliverable & Revision Workflow (NEW - from Research)

How do we handle work submission and revisions?

**Competitor Analysis:**

| Aspect | Upwork | Fiverr |
|--------|--------|--------|
| **Submission** | Submit Work for Review | Deliver button + file upload (5GB) |
| **Review Period** | 14 days | 3 days (8 for milestones) |
| **Auto-Complete** | Yes, after 14 days no response | Yes, after 3 days no response |
| **Revisions** | Per-milestone agreement | Defined per package tier |
| **Revision Request** | During 14-day window | Accept or Request Revision |

**SME Mart Approach:**

**Delivery Flow:**
```
Provider submits deliverable →
Buyer has 7 days to:
  ├─ Accept → Engagement complete → Payment released
  ├─ Request Revision → Provider redelivers → Timer resets
  └─ No response → Auto-complete after 7 days
```

**Revision Limits:**
- For Service Catalog: Defined in package (e.g., Basic: 1 revision, Premium: 3)
- For Work Requests: Specified in proposal terms
- Unlimited revisions = scope creep risk, discourage

**File Handling:**
- Max file size: 2GB per file (S3/ZB storage)
- Supported types: Common doc/pdf/zip formats
- Deliverables attached to ZB Task for audit trail

---

### 9. Dispute Resolution (NEW - from Research)

How do we handle conflicts between buyers and providers?

**Competitor Analysis:**

**Upwork Process:**
1. Direct communication between parties
2. If unresolved: File dispute (7 days for fixed-price)
3. Non-binding mediation by Upwork (2 days for resolution)
4. If rejected: Binding arbitration (third-party, costs involved)

**Fiverr Process:**
1. Resolution Center initiated
2. Freelancer has 48 hours to respond
3. If unresolved: Fiverr Customer Support reviews
4. Fiverr makes final decision

**Key Differences:**
- Upwork has formal arbitration (more legally robust but costly)
- Fiverr keeps it in-house (faster but platform has final say)

**SME Mart Approach (Phased):**

**Phase 1: Manual Resolution**
- Parties communicate directly (or via ZB Task comments)
- If unresolved: Contact SME Mart support (email)
- SME Mart reviews case manually
- Decision by SME Mart team (simple majority)

**Phase 2: Resolution Center**
- Structured dispute filing form
- 48-hour response window for other party
- Evidence attachment (screenshots, files, task history)
- SME Mart moderator review

**Phase 3: Formal Process**
- Tiered resolution: Mediation → Escalation → Final decision
- Consider third-party mediation for high-value disputes
- Clear policies published upfront

**Dispute Categories:**
- Work not delivered
- Work doesn't match scope
- Quality issues
- Non-payment (when payment integrated)
- Communication/professionalism issues

---

## Phased Implementation

### Phase 1: Foundation (Current + Minor Enhancements)

**Goal:** Complete the basic flow with manual/external handling of gaps

**Changes (Original):**
1. Add "Hire" button on provider profiles → Creates targeted Work Request
2. Add engagement summary generation on proposal acceptance
3. Add payment status field (pending/paid) - manually updated
4. Auto-update provider stats (jobs completed, earnings) on completion
5. Add basic engagement history view on My Profile

**Additional Changes (from Research):**
6. Add response time tracking and display on provider profiles
7. Add revision count field to proposals and service packages
8. Add delivery/completion workflow with timer (7-day auto-complete)
9. Add 3-tier pricing structure to service offerings (Basic/Standard/Premium)
10. Calculate and display provider "SME Score" (composite metric)

**User Experience:**
```
Work Request → Proposal → Accept → Summary Generated → Work (external) →
Submit Deliverable → 7-day Review Window → Accept/Revise → Complete →
Update Payment Status → Review Prompt → Stats Updated
```

**Technical Requirements:**
- New field: `work_requests.payment_status` enum (pending, paid, disputed)
- New field: `work_requests.engagement_summary` (generated text/JSON)
- New field: `work_requests.deliverable_submitted_at` timestamp
- New field: `work_requests.revision_count` integer (used vs allowed)
- New field: `proposals.revisions_included` integer
- New fields for service_offerings: `basic_price`, `standard_price`, `premium_price`, `basic_includes`, etc.
- New field: `provider_profiles.response_time_avg` decimal (calculated)
- New field: `provider_profiles.sme_score` decimal (0-100, calculated)
- Trigger/hook: On completion, update provider stats
- Trigger/hook: On 7-day timeout, auto-complete if no response
- New UI: Engagement history section on My Profile
- New UI: "Hire" button on provider profile → pre-filled Work Request form
- New UI: Deliverable submission form
- New UI: Accept/Request Revision workflow

---

### Phase 2: ZeroBias Integration

**Goal:** Integrate ZeroBias Boundary and Task system for secure, tracked work

**Changes:**
1. On proposal acceptance, create ZeroBias Boundary for the engagement
2. Invite provider to Boundary with appropriate permissions
3. Create initial ZeroBias Task for the engagement
4. Link `work_requests.zerobias_boundary_id` and `zerobias_task_id`
5. Display Boundary/Task status in engagement view
6. Sync task completion with engagement completion

**User Experience:**
```
... Accept Proposal → Boundary Created → Provider Invited →
Task Created → Work in Boundary → Task Updates →
Task Complete → Engagement Complete → ...
```

**Technical Requirements:**
- ZeroBias Boundary API integration (create, invite)
- ZeroBias Task API integration (create, update, complete)
- New fields: `work_requests.zerobias_boundary_id`, `zerobias_task_id`
- UI: Boundary status indicator
- UI: Task progress/hours display
- Webhook or polling for task status sync

---

### Phase 3: Payments Integration

**Goal:** Enable secure payments through the platform

**Changes:**
1. Integrate payment processor (Mercury or Stripe Connect)
2. Escrow funds on engagement start (or milestone-based)
3. Release funds on completion approval
4. Deduct platform fee on release
5. Provider payout to connected account
6. Payment history and invoicing

**User Experience:**
```
... Accept Proposal → Payment/Escrow Setup → Funds Held →
Work Complete → Buyer Approves → Funds Released (minus fee) →
Provider Receives Payout
```

**Technical Requirements:**
- Payment processor integration (Mercury API or Stripe Connect)
- New tables: `payments`, `payouts`, `invoices`
- Escrow workflow implementation
- Platform fee calculation and deduction
- Payout scheduling
- Tax document generation (1099s for US providers)

---

### Phase 4: Advanced Features

**Goal:** Enhanced marketplace features for scale

**Potential Features:**
- In-app messaging system
- Milestone-based payments
- Dispute resolution workflow
- Provider verification/badges
- AI-powered matching
- Subscription tiers
- Analytics dashboard
- API for integrations

---

## Data Model Changes

### Phase 1 Additions

```typescript
// work_requests table additions
paymentStatus: pgEnum('payment_status', ['pending', 'paid', 'disputed']),
engagementSummary: text('engagement_summary'), // JSON or structured text
completedAt: timestamp('completed_at'),
paidAt: timestamp('paid_at'),

// New table: engagement_history (or derive from work_requests)
// Could be a view joining work_requests + proposals + reviews
```

### Phase 2 Additions

```typescript
// work_requests table additions
zerobiasBoundaryId: text('zerobias_boundary_id'),
zerobiasTaskId: text('zerobias_task_id'),
boundaryStatus: text('boundary_status'), // cached for display
taskStatus: text('task_status'), // cached for display
hoursLogged: decimal('hours_logged'), // synced from ZB Task
```

### Phase 3 Additions

```typescript
// New table: payments
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  workRequestId: uuid('work_request_id').references(() => workRequests.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal('platform_fee', { precision: 10, scale: 2 }),
  providerPayout: decimal('provider_payout', { precision: 10, scale: 2 }),
  status: paymentStatusEnum('status').default('pending'),
  processorId: text('processor_id'), // Stripe/Mercury transaction ID
  escrowedAt: timestamp('escrowed_at'),
  releasedAt: timestamp('released_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// New table: provider_payment_accounts
export const providerPaymentAccounts = pgTable('provider_payment_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').references(() => providerProfiles.id),
  processorType: text('processor_type'), // 'stripe' | 'mercury'
  processorAccountId: text('processor_account_id'),
  status: text('status'), // 'pending' | 'verified' | 'disabled'
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## UI/UX Wireframes

### Engagement Summary (Phase 1)

Generated on proposal acceptance, displayed on request detail page:

```
┌─────────────────────────────────────────────────────────────┐
│ ENGAGEMENT SUMMARY                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Parties                                                     │
│ ────────                                                    │
│ Buyer:    Acme Corp (compliance@acme.com)                  │
│ Provider: Jane Smith (jane@securitypro.com)                │
│                                                             │
│ Scope                                                       │
│ ─────                                                       │
│ Title: SOC 2 Type II Readiness Assessment                  │
│ Description: [from work request]                           │
│                                                             │
│ Terms                                                       │
│ ─────                                                       │
│ Price: $5,000 (fixed)                                      │
│ Timeline: 4 weeks                                          │
│ Started: Feb 4, 2026                                       │
│ Due: Mar 4, 2026                                           │
│                                                             │
│ Status                                                      │
│ ──────                                                      │
│ Work: In Progress                                          │
│ Payment: Pending                                           │
│                                                             │
│ [Mark Complete]  [Cancel Engagement]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Engagement History (Phase 1)

New section on My Profile page:

```
┌─────────────────────────────────────────────────────────────┐
│ ENGAGEMENT HISTORY                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SOC 2 Readiness Assessment          COMPLETED  ★★★★★   │ │
│ │ Acme Corp • $5,000 • Jan 2026                          │ │
│ │ "Excellent work, highly recommend..."                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Penetration Test Consultation        COMPLETED  ★★★★☆   │ │
│ │ Beta Inc • $2,500 • Dec 2025                           │ │
│ │ "Good insights, minor communication delays"             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ NIST CSF Gap Analysis                IN PROGRESS        │ │
│ │ Gamma LLC • $3,000 • Started Feb 2026                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Direct Hire Flow (Phase 1)

"Hire" button on provider profile:

```
┌─────────────────────────────────────────────────────────────┐
│ JANE SMITH                                                  │
│ Senior Compliance Consultant                                │
│ ★★★★★ (24 reviews) • 15 jobs completed • $150/hr           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Message]  [Hire Jane]  [View Services]                    │
│                                                             │
│ ... rest of profile ...                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Clicking "Hire Jane" → Opens Work Request form pre-filled:
- Targeted provider: Jane Smith (hidden field)
- Category: Pre-selected based on Jane's primary category
- Message: "Request for Jane Smith"
```

---

## Open Questions

1. **Dispute Resolution:** How do we handle disputes? Manual review? Escrow hold?
2. **Cancellation Policy:** What happens if engagement is cancelled mid-work?
3. **Milestone Payments:** Support for multi-milestone engagements?
4. **Team Engagements:** Can a buyer hire multiple providers for one project?
5. **Subcontracting:** Can a provider bring in other providers?
6. **NDAs/Confidentiality:** Standard NDA as part of engagement terms?
7. **Insurance/Liability:** Professional liability requirements for providers?
8. **International Payments:** Currency handling, international payouts?
9. **Tax Compliance:** 1099 generation, W-9 collection, international tax docs?

---

## Success Metrics

### Phase 1
- [ ] 5+ engagements completed through platform
- [ ] Engagement summary generated for all accepted proposals
- [ ] Provider stats auto-updating correctly
- [ ] Users can view engagement history

### Phase 2
- [ ] ZeroBias Boundaries created for engagements
- [ ] Providers successfully joining Boundaries
- [ ] Tasks tracking work hours/deliverables
- [ ] Task completion syncing with engagement status

### Phase 3
- [ ] Payments processed through platform
- [ ] Escrow working correctly
- [ ] Platform fees being collected
- [ ] Provider payouts successful
- [ ] Zero payment disputes (or resolution process working)

---

## Next Steps

1. **Review this document** - Confirm direction on decision points
2. **Prioritize Phase 1 items** - Which to build first?
3. **Design UI mockups** - Engagement summary, history, hire flow
4. **Update master plan** - Add Phase 1 items to roadmap
5. **Begin implementation** - Start with highest-value items

---

## Summary: What's Missing in SME Mart

### Must Have for MVP (Blocking User Trust)
1. ❌ **Messaging/Communication** - Buyers and providers can't talk pre-engagement
2. ❌ **Engagement Contract** - No formal agreement of terms
3. ❌ **Deliverable Workflow** - No structured submission/review process
4. ❌ **Auto-Complete Timer** - Engagements can stall forever
5. ❌ **Response Time Display** - Buyers can't gauge provider responsiveness
6. ❌ **Revision Handling** - Scope creep risk without defined limits

### Important for Growth (Blocking Quality Signal)
1. ⚠️ **Composite Reputation Score** - Star rating alone insufficient
2. ⚠️ **Provider Levels/Badges** - No way to signal expertise at glance
3. ⚠️ **3-Tier Service Packages** - Services exist but no tiered pricing
4. ⚠️ **Dispute Resolution Process** - Open question, no defined path
5. ⚠️ **On-Time Delivery Tracking** - Missing performance metric

### Future Enhancements (Nice to Have)
1. Connects/credit system for proposal quality
2. Boosted/featured listings
3. Video call integration
4. Milestone-based payments
5. International payment support

---

## References

- [Master Plan](./000-MASTER-PLAN.md) - Overall project roadmap
- [Competitor Research](../../research/competitor-engagement-flows.md) - Upwork/Fiverr analysis (**NEW**)
- [Resume Import Idea](../../ideas/001-resume-import.md) - Profile import feature
- Phase 3.2/3.3 in Master Plan - ZeroBias Boundary/Task integration

**External Documentation:**
- [Upwork Help Center](https://support.upwork.com) - Contracts, escrow, disputes, JSS
- [Fiverr Help Center](https://help.fiverr.com) - Orders, delivery, levels, Resolution Center

---

**Last Updated:** 2026-02-06
