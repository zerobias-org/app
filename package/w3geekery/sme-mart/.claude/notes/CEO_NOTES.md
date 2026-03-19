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

---

## 2026-03-05: Exhibit F — Real-World RFP Security Requirements as Demand-Side Template

### Brian's Directive (Slack, 8:55–9:00 AM PT)

> "Let's use this set of documents to build out engagement requirements, project requirements, task and subtask based on the project requirements."
> "This is a perfect exercise to build out the demand side of buyer with a project and shopping it. All the forms and documents are uploaded to the Project and then let's break down the project into all the parts using the documents and list of requirements by task types/subtask types — we essentially have a very detailed project/task/subtask set of requirements from the demand side."
> "There is legal, security, $, compliance, functional outcome requirements in detail."
> "The supply side will have their side of this later. But the transparency center of project (aggregating from tasks/subtasks transparency) will show how all those different requirements are met (real time visibility) from the supply side."

### Reference Document

**Exhibit F — Information Systems Security Requirements for Projects (ISO/SR1) v5.5** (CDPH, October 2025)

This is a real California Department of Public Health (CDPH) procurement exhibit — the exact kind of document a buyer (government agency) attaches to an RFP to define mandatory security requirements for any vendor/provider bidding on the project. It covers 5 categories with ~40+ individual requirements.

### Why This Matters for SME Mart

This document is the **gold standard example of demand-side requirements specification**. It proves Brian's architecture:

1. **Documents upload to Project** — Buyer attaches Exhibit F (and similar exhibits for legal, financial, functional) to the SME Mart Project
2. **Requirements decompose into Tasks/SubTasks** — Each section of Exhibit F becomes a Task (by type: Security, Compliance, Legal, Functional) with SubTasks for individual requirements
3. **Supply side responds** — Provider maps their readiness to each requirement
4. **Transparency Center aggregates** — Real-time rollup of which requirements are met/unmet/in-progress

### Document Structure → Task Type Mapping

| Exhibit F Category | SME Mart Task Type | Example Requirements |
|---|---|---|
| **Administrative / Management Safeguards** | `COMPLIANCE` | Workforce confidentiality statements, access authorization, incident response, change control, business associate compliance |
| **Technical and Operational Safeguards** | `SECURITY` | Encryption (transit/rest), endpoint protection, patch management, intrusion detection, authentication logging, audit trails |
| **Solution Architecture** | `FUNCTIONAL` | Layered app design, WAF, MFA (FIDO2), ASVS Level 2, container security, secure SDLC, penetration testing, NIST SP800-53 compliance |
| **Documentation of Solution** | `LEGAL` | System config docs, information asset inventory, ISSP, roles/relationships, audit method docs, PTA/PIA assessments |
| **ISO Notifications and Approvals** | `COMPLIANCE` | Security compliance notification, change approval, breach notification, project security approvals |

### Gap Analysis: What SME Mart Covers vs. Does NOT Cover

#### Currently Supported

| Capability | Status | How |
|---|---|---|
| Task/SubTask hierarchy | ✅ | ZB Tasks with `child_of` links |
| Task status lifecycle | ✅ | `draft` → `open` → `in_progress` → `awaiting_approval` → `completed` |
| Engagement (Boundary) creation | ✅ | `work_requests` table + ZB Boundary |
| Notes/documentation per engagement | ✅ | Milkdown editor, note folders |
| Timeline/activity tracking | ✅ | Activity center |
| Tag-based hierarchy | ✅ | PROJ/ENG/TASK tag prefixes |

#### NOT Yet Supported (Gaps)

| Capability | Priority | Dependency | Notes |
|---|---|---|---|
| **Document upload to Project** | HIGH | ZB Task Attachments (SDK exists) | Buyer uploads Exhibit F, SOW, etc. to the Project. Attachments exist in SDK but not wired in SME Mart UI |
| **Typed Tasks** (Security, Compliance, Legal, Functional, Financial) | HIGH | ZB-3 (Custom Task Activities) | Currently no way to categorize tasks by requirement domain. Workaround: tags or Neon metadata |
| **Typed SubTasks** (individual requirements within a domain) | HIGH | ZB-3 | SubTasks need custom fields: requirement text, compliance standard reference, evidence type, pass/fail/NA status |
| **RFP creation wizard** | HIGH | SM-18 | Buyer builds RFP from uploaded documents → auto-generates task breakdown |
| **Requirement decomposition** (document → tasks) | HIGH | SM-18 + AI | Parse uploaded documents (like Exhibit F) and suggest task/subtask structure. Agentic opportunity. |
| **Activity layer** (phases of work) | HIGH | SM-17 | Activities like "RFP Response", "Security Assessment", "Implementation" that group related tasks |
| **Demand/supply view filtering** | MEDIUM | SM-24 | Buyer sees their requirements; provider sees their response obligations; shared transparency view |
| **Vendor proposal response flow** | HIGH | SM-19 | Provider maps their capabilities to each buyer requirement (task-by-task response) |
| **Evidence/artifact linking** | MEDIUM | ZB Task Attachments | Provider attaches evidence (certs, audit reports, policies) to specific subtasks |
| **Compliance standard references** | LOW | Custom Activities or Neon | Link subtasks to NIST SP800-53, OWASP ASVS, HIPAA, PCI DSS, FIPS-199 controls |
| **Readiness scoring per domain** | FUTURE | ZB Scoring App | Roll up subtask completion → task readiness → domain readiness (e.g., "Security: 78%") |
| **Approval workflow per requirement** | MEDIUM | ZB Task workflow | Buyer approves/rejects vendor's evidence for each subtask |

### Demand-Side Breakdown: Exhibit F as a Project

If a buyer used SME Mart today to shop this CDPH project, the structure would be:

```
Project: "CDPH Information Systems Modernization"
│  Documents: Exhibit F (Security), Exhibit A (SOW), Exhibit B (Budget), ...
│
├── Engagement (Boundary) with Vendor X
│   │
│   ├── Activity: "Security Requirements Assessment"
│   │   │
│   │   ├── Task: "Administrative / Management Safeguards" [type: COMPLIANCE]
│   │   │   ├── SubTask: Workforce Confidentiality Statements
│   │   │   ├── SubTask: Access Authorization & Maintenance (semi-annual review)
│   │   │   ├── SubTask: Information System Activity Review (6-year log retention)
│   │   │   ├── SubTask: Periodic Security & Log Review
│   │   │   ├── SubTask: Technology Recovery Plan (annual BIA)
│   │   │   ├── SubTask: Change Control Procedures
│   │   │   ├── SubTask: Business Associate Compliance (HIPAA BA agreement)
│   │   │   └── SubTask: Incident Response Plan (IRP + IRT + 7 procedures)
│   │   │
│   │   ├── Task: "Technical & Operational Safeguards" [type: SECURITY]
│   │   │   ├── SubTask: Endpoint Protection (SIMM 5355-A)
│   │   │   ├── SubTask: Patch Management (2-week SLA, critical faster)
│   │   │   ├── SubTask: Encryption — Transit (FIPS 140)
│   │   │   ├── SubTask: Encryption — At Rest (FIPS 140)
│   │   │   ├── SubTask: Workstation/Laptop Encryption
│   │   │   ├── SubTask: Removable Media Encryption
│   │   │   ├── SubTask: Secure Connectivity (CGEN)
│   │   │   ├── SubTask: Intrusion Detection & Prevention
│   │   │   ├── SubTask: Information Sanitization (NIST 800-88)
│   │   │   ├── SubTask: Authentication Logging (all layers + DB)
│   │   │   ├── SubTask: Reauthentication (session termination by AAL)
│   │   │   ├── SubTask: Audit Access (RBAC, least privilege)
│   │   │   ├── SubTask: Audit Event & Content (min 8 event types + 6 record fields)
│   │   │   └── SubTask: Audit Record Retention (6 years)
│   │   │
│   │   ├── Task: "Solution Architecture" [type: FUNCTIONAL]
│   │   │   ├── SubTask: System Security Compliance (SAM, HIPAA, Privacy Act)
│   │   │   ├── SubTask: Warning Banner (standard text required)
│   │   │   ├── SubTask: Layered Application Design (4-tier with firewalls)
│   │   │   ├── SubTask: Application Container Security (NIST SP800-190)
│   │   │   ├── SubTask: Web Application Firewall (F5 Silverline)
│   │   │   ├── SubTask: Identity Proofing (IAL 2, NIST SP800-63A)
│   │   │   ├── SubTask: Multi-Factor Authentication (FIDO2/YubiKey, AAL 3)
│   │   │   ├── SubTask: ASVS Level 2 Compliance (OWASP 4.0.3, 14 chapters)
│   │   │   ├── SubTask: MASVS L1+R (mobile, if applicable)
│   │   │   ├── SubTask: Secure SDLC (Azure DevOps, Veracode SAST/SCA/DAST)
│   │   │   ├── SubTask: Penetration Testing (annual + post-remediation)
│   │   │   ├── SubTask: Privileged Access Management (PAM)
│   │   │   ├── SubTask: NIST SP800-53 Rev 5 Compliance
│   │   │   ├── SubTask: PCI DSS Compliance (if payment processing)
│   │   │   └── SubTask: Offshore Remote Access (VPN + static IP whitelisting)
│   │   │
│   │   ├── Task: "Documentation Requirements" [type: LEGAL]
│   │   │   ├── SubTask: System Configuration Documentation
│   │   │   ├── SubTask: Information Asset Inventory (FIPS-199 categorization)
│   │   │   ├── SubTask: Information System Security Plan (ISSP)
│   │   │   ├── SubTask: System Roles & Relationships
│   │   │   ├── SubTask: Audit Method Documentation
│   │   │   ├── SubTask: Documentation Retention (6 years)
│   │   │   └── SubTask: Privacy Threshold & Impact Assessments (PTA/PIA)
│   │   │
│   │   └── Task: "ISO Notifications & Approvals" [type: COMPLIANCE]
│   │       ├── SubTask: Security Compliance Notification (pre-custody)
│   │       ├── SubTask: Change Notification Process
│   │       ├── SubTask: Breach Notification (HIPAA PHI + PII)
│   │       └── SubTask: Project Security Approvals (PAL Stage/Gate)
│   │
│   └── Activity: "Vendor Response & Evaluation" (supply side — later)
│
└── Engagement (Boundary) with Vendor Y (competing bid)
```

**Total from Exhibit F alone:** 5 Tasks, ~45 SubTasks — and this is just ONE exhibit (security). A full RFP would have similar exhibits for legal terms, financial requirements, functional specifications, and more.

### Strategic Insight

This validates the architecture at every level:

1. **The 4-level hierarchy works** — Engagement → Activity → Task → SubTask naturally maps to real procurement documents
2. **Typed tasks are essential** — Without Security/Compliance/Legal/Functional typing, you can't build domain-specific rollups or the Transparency Center
3. **Document-to-task decomposition is the killer feature** — An AI agent that parses procurement exhibits and auto-generates the task/subtask tree would be a massive differentiator
4. **Scale reality check** — A single government RFP can easily produce 200+ subtasks across all exhibits. The UI must handle this scale with filtering, search, and domain-level rollups
5. **This is the demand-side spec** — Everything in this breakdown is what the BUYER defines. The supply side mirrors it with evidence/attestation per subtask

### Action Items

- [ ] Build visual HTML breakdown of Exhibit F → Task/SubTask mapping (for Brian review)
- [ ] Use this as the template for SM-18 (RFP creation wizard) design
- [ ] Evaluate AI-assisted document parsing for requirement extraction
- [ ] Design the typed task model (Security, Compliance, Legal, Functional, Financial)
- [ ] Prototype the demand-side project view showing task tree with status rollups

*Captured: 2026-03-05 from Slack. Reference doc: `~/Downloads/Exhibit_F_-_Information_Systems_Security.docx`*

---

## 2026-03-06: Engagement/Project Taxonomy & Hierarchy

### Brian's Directive (Slack, 12:41-12:50 PM PT)

Brian clarified the taxonomy and entity hierarchy for SME Mart:

### Key Decisions

1. **RFP = Request for Project** (NOT Request for Proposal)
2. **"Proposal" is removed from vocabulary** — vendor response is a **Bid**
3. **Engagement = corp-to-corp relationship** — the organizational/legal container
4. **Project = scoped work** — lives under an Engagement

### Hierarchy

```
Engagement (corp-to-corp)
  |-- D&B rating
  |-- MSA (optional, if umbrella)
  |-- Banking info
  |-- Background checks on officers
  |-- C Corp / LLC verification
  |-- Financial statements / bank letter of good standing
  |-- Corp entity type requirements
  |
  |-- Project A (scoped work — from accepted Bid on RFP)
  |   |-- MSA (optional, if project-scoped)
  |   |-- Tasks / SubTasks
  |   |-- Deliverables
  |
  |-- Project B
  |-- Project C
```

### Industry Analogues

| SME Mart Term | Fed Gov | Deel | Notes |
|---|---|---|---|
| Engagement | Facility | Contract | Corp-to-corp legal/compliance wrapper |
| Project | (within Facility) | (within Contract) | Scoped work, tasks, deliverables |
| MSA | -- | -- | Can apply at Engagement OR Project level |

### Engagement-Level Requirements

Brian specified these requirements live at the Engagement (corp-to-corp) level:

- **D&B (Dun & Bradstreet) rating**
- **MSA** (if umbrella covering all projects)
- **Banking information**
- **Background checks on officers**
- **Corporate entity verification** — C Corp, LLC, etc.
- **Financial statements** or bank letter of good standing
- The **CA RFP (CDPH)** has requirements that map to this Engagement level

### MSA Flexibility

MSA can live at either level:
- **Engagement-level MSA** — umbrella terms covering all projects under the relationship
- **Project-level MSA** — specific terms for a particular scope of work

### Lifecycle

```
1. RFP (Request for Project)     -- buyer posts need
2. Bid                           -- vendor responds
3. Bid accepted                  -- triggers Engagement creation (if new corp relationship)
4. Project created               -- under the Engagement, task decomposition begins
```

One Engagement -> many Projects over time. "We sell NF software through distributors. Often times they get pulled into selling it from clients who want them to sell it to them or we sign them up. Both require the corps to put high level corporate to corp legal and banking info in place and D&B, etc. But from there. Lots of software will be sold. Or lots of projects will be awarded."

### Bidirectional Requirements (Vendor → Buyer, per Engagement)

Not just buyer requiring things from vendor — **vendor also has requirements from the buyer**. This is CRM-style data the vendor needs to do the work:

**Engagement-level (corp-to-corp):**
- Corporate contact info
- Accounting department contact
- Billing/AP contact

**Project-level:**
- Project tech lead
- Support contact info
- Subject matter contacts for the scope of work

This mirrors real-world vendor onboarding where both sides have intake forms. The Engagement and Project entities need to support requirements flowing in **both directions** (demand → supply AND supply → demand).

*Captured: 2026-03-06 from Slack (12:41-12:50 PM PT)*

---

## 2026-03-06: Project Plugin Architecture & Go-To-Market Vision

### Brian's Directive (Meeting, ~12:55 PM PT)

Follow-up meeting to the Slack taxonomy discussion. Brian expanded on the project creation vision and go-to-market strategy.

### Project Plugin Concept

Brian described a **project plugin** — a bundled package that includes:
- MCP server/skills
- Document parsers (PDF, Word, ZIP)
- Task type templates (Legal, Security, Compliance, Functional, Financial)
- Subtask templates per type
- Questionnaire flow for manual project creation

**How it works:**
1. User spins up AI (Claude), loads the project plugin
2. Plugin presents a questionnaire for project setup
3. AI generates a fully structured project with typed tasks/subtasks
4. Alternatively: user loads legacy documents, plugin decomposes them into the project template

> "Ideally what we're creating is basically a templating system that allows the AI to essentially build out these projects really quickly, including the tasks and subtasks."

> "A plugin should include the MCP and the skills and the documents and the whatever. It's just like a big plugin that has all of these things in it."

### Dual-Path Project Creation

**Path 1 — Legacy Support (old world):**
- Upload PDF, Word doc, ZIP file of procurement documents
- LLM/MCP skill decomposes documents into project structure
- Supports existing government/enterprise RFP workflows
- Phase 1: LLM creates JSON → API upload to SME Mart
- Phase 2: MCP skill with hosted MCP server (Catalin dependency)

**Path 2 — Native Plugin (new world):**
- Project plugin with templates and AI assistance
- Questionnaire-driven, fills in task types automatically
- No legacy documents needed — build from scratch with AI guidance

> "The most important thing is that we build for the new world, but we support the old world."

### Supply-Side One-Time Profile Loading

Vendors load corporate info **once**, then it pre-fills for every engagement/bid:
- Corporate docs
- Banking references
- Background checks
- D&B rating
- All engagement-level requirements

> "You literally load everything one time and you're done. You can just get right into the project stuff. You don't have to rebid or reload for every single person you're trying to sell to. Same thing on the buy side. It's fully automated."

**Brian's term for this:** "Programmatic buy, sell."

### Go-To-Market: Distributor/Reseller Channel

Distributors and resellers will:
1. Go into buy-side companies
2. Help modernize their procurement processes using ZeroBias
3. Offer **"agentic procurement services"** — run the procurement process for clients using ZeroBias as the delivery method
4. Training option: teach clients to do it themselves
5. Managed option: reseller runs the entire process on their behalf

> "Our distributors and resellers are the ones that are going to go into the buy-side companies and say, 'We're going to help you modernize your entire procurement process.' They're going to do an agentic procurement service using ZeroBias as the method of delivery."

### CDPH RFP Confirmed as Reference

Brian confirmed using the CDPH RFP as the gold standard for:
- **Engagement-level requirements** — corporate history, officer background checks, D&B, banking
- **Project-level requirements** — task/subtask decomposition from exhibits (Security, Legal, Compliance, Functional)

### Platform Demand Strategy

Brian explicitly endorsed Clark hitting platform blocks as a feature, not a bug:

> "We need to create the real world. That's exactly why we're doing this. You, Dan, Joe, and hopefully more."

Clark should continue filing explicit feature requests with schema, extensions, UI mockups, and use cases — this creates the demand signal that drives backend velocity from Kevin/Chris.

*Captured: 2026-03-06 from meeting transcript. Full transcript: `meetings/2026-03-06-marketplace-meeting.md`*

---

## 2026-03-16: Transparency Partitions — The Most Critical Path

### Brian's Directive (Slack, 1:48–2:03 PM PT)

#### Policies = Requirements

All policies, procedures, and implementation artifacts are **requirements**. To pass an assessment, you must have a policy in place that is adhered to. Reference: **OPA channel in Slack** for policies/standards context.

#### The MOST Critical Path: Task/SubTask Partitioning

> "The absolute most critical path is a task - subtask being partitioned into supply - transparency - demand parties associated with a project. That is the MOST critical path we have."
> "I think you and Dan and Kevin and everyone need this immediately. Likely immediately."

### Three Partitions at Every Level

Every entity in the hierarchy (Project, Plan, Task, SubTask) must be partitioned into three zones:

| Partition | Type | Description |
|-----------|------|-------------|
| **Demand** | Single party (buyer) | Buyer's private side — requirements, internal notes, evaluation criteria |
| **Transparency** | Multi-party (buyer + seller + auditors + others) | Shared middle — what both sides publish for visibility |
| **Supply** | Single party (seller/provider) | Provider's private side — readiness work, internal prep |

#### Partition Flow

```
Demand (Buyer)                    Transparency (Shared)                Supply (Provider)
┌─────────────────┐              ┌─────────────────────┐              ┌─────────────────┐
│ Private reqs    │──publish──►  │ Published reqs      │  ◄──publish──│ Private readiness│
│ Internal notes  │              │ Published evidence   │              │ Internal prep    │
│ Eval criteria   │              │ Status rollups       │              │ Cost analysis    │
│ Scoring (priv)  │              │ Compliance status    │              │ Resource alloc   │
└─────────────────┘              └─────────────────────┘              └─────────────────┘
```

- **Demand side** publishes requirements to the Transparency partition (may keep some requirements private)
- **Supply side** does its own readiness work, then publishes what they are required to publish to the Transparency partition
- **Transparency partition** is the shared middle where both parties (and auditors, insurers, etc.) can see published information

#### Partitions Must Exist at EVERY Level

Brian explicitly stated partitions are required at Project level too, not just Task/SubTask:

> "I don't see how projects and plans also don't have partitions. They must."
> "A project has a Transparency center. That aggregates the lower level transparency from task/subtasks."

```
Engagement
├── Project (Demand | Transparency | Supply)
│   ├── Plan (Demand | Transparency | Supply)
│   │   ├── Task (Demand | Transparency | Supply)
│   │   │   ├── SubTask (Demand | Transparency | Supply)
│   │   │   └── SubTask (Demand | Transparency | Supply)
│   │   └── Task (Demand | Transparency | Supply)
│   └── Plan (Demand | Transparency | Supply)
└── Project
```

**Rollup:** SubTask transparency → Task transparency → Plan transparency → Project transparency → Engagement-level transparency reporting.

#### Projects Sit Over Boundaries

> "Projects sit over one or many boundaries. And all roll up to engagement which is able to look across all projects level transparency reporting."

#### The Headline

> "Clark. Just to drive this home. ZeroBias — the Transparency Platform. Do you now see how important? Literally the headline."
> "It's the biggest friction of all in regulated commerce."

### Three Windows Model

Clark confirmed: "There's 3 windows for the entire thing — the shared middle is whitelist: 'I need these specific things to be visible to both parties.'"

### Implications

1. **Task/SubTask partitioning is THE priority** — Brian considers this the single most critical path for the platform
2. **Every entity gets 3 zones** — not just tasks, but Projects and Plans too
3. **Transparency = selective publishing** — each side chooses what to publish to the shared middle
4. **Rollup aggregation** — transparency data aggregates upward through the hierarchy
5. **This IS the ZeroBias value prop** — transparency in regulated commerce is the core differentiator

### Gap: 25 New Gaps Found

Clark noted "25 New Gaps found" — likely from the OPA/policies analysis, validating how many requirements still need task/subtask decomposition.

*Captured: 2026-03-16 from Slack (1:48–2:03 PM PT)*

---

## 2026-03-16: Kevin Clarifies Board Semantics

### Kevin's Clarification (Slack, 4:16 PM & 8:27–8:28 PM PT)

**A Board is structural, not a filter.**

> "No, nothing crosses a board. A task is on exactly one board."
> "The board is the ground a task plugs in to. It has rank, issue number, workflows, etc. It is structural. Not a property of a task; the ground underneath it."

### Key Takeaways

- **A Task belongs to exactly ONE Board** — tasks do not span boards
- **Boards are NOT smart collections/filters** — they are not arbitrary subsets or saved queries
- **Board is the structural foundation** — it provides rank, issue numbering, workflow definitions
- **Board scopes:** org, boundary, user, or project
- **Board is to Task as Table is to Row** — the ground the task "plugs in to"

### Correction to Prior Understanding

The Feb 25 notes described Boards as "user-created collections of Tasks" which implied a looser, tag-like grouping. Kevin's clarification makes it clear:

| What We Thought | What It Actually Is |
|---|---|
| Boards = flexible groupings/views | Boards = structural containers |
| Tasks could appear on multiple boards | Tasks belong to exactly one board |
| Boards are like saved filters | Boards provide rank, issue #, workflows |

### Implications for SME Mart

1. **Board selection matters at task creation** — can't move tasks between boards casually
2. **Workflow is board-level** — different boards can have different workflows
3. **Issue numbering is per-board** — each board has its own sequence
4. **Board hierarchy** maps cleanly to partitioning: a demand-side board, supply-side board, and transparency board within a boundary could implement Brian's 3-partition model

*Captured: 2026-03-16 from Slack (Kevin McCarthy, 4:16 PM & 8:27–8:28 PM PT)*
