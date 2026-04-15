# SME Mart Demo Data Guide

**Updated:** 2026-03-24 — Engagement/Project separation. Engagements are now corp-to-corp agreements. Former "engagements" (crystal-harbor, etc.) are now SmeMartProjects. Pinnacle Corp has 2 projects to demo 1:many.

This doc maps every demo entity to show which data demonstrates each aspect of the marketplace lifecycle.

## Data Model (2026-03-24)

```
Engagement (corp-to-corp agreement — "Pinnacle Corp ↔ W3Geekery")
└── SmeMartProject (scoped work — "SOC 2 Type I Fast-Track")
    ├── Bids (vendor responses)
    ├── BidResponses (per-requirement responses)
    ├── Notes + NoteFolders (project notebook)
    ├── Documents (project-scoped files)
    └── Reviews (post-project feedback)
```

Downstream entities (Bids, Notes, Documents, Reviews) reference project IDs via the `engagementId` GQL field. This field name is legacy — it means "parent project" in the new model.

---

## Buyer Organizations

| Display Name | Org ID | ZB User ID | Notes |
|-------------|--------|------------|-------|
| **Pinnacle Corp** | `org-pinnacle-corp` | `demo-buyer-pinnacle` | Series B startup, **2 projects** (1:many demo) |
| **Lakewood Health** | `org-lakewood-health` | `demo-buyer-lakewood` | Healthcare buyer, 3 RFPs + 1 project |
| **Acme Corp** | `org-acme-corp` | `buyer-acme-001` | B2B SaaS, 1 open RFP |
| **FinTech Inc** | `org-fintech-inc` | `buyer-fintech-002` | Financial services, 1 project |
| **Startup XYZ** | `org-startup-xyz` | `buyer-startup-003` | Startup, 1 project |
| **HealthTech Co** | `org-healthtech` | `buyer-health-004` | Healthcare tech, 1 project |
| **Enterprise Co** | `org-enterprise-co` | `buyer-enterprise-005` | Enterprise, 1 open RFP |

## Providers

| Name | Slug | Specialty | Rate | Rating | Availability |
|------|------|-----------|------|--------|--------------|
| **A1-Bob-IT** | `a1-bob-it` | AI Agent Builder & Compliance Automation | $200/hr | 4.90 | Available |
| **A3-Gina-Auditor** | `a3-gina-auditor` | SOC 2 & ISO 27001 Lead Assessor | $175/hr | 4.95 | Available |
| **James Okafor** | `james-okafor` | GRC Strategy & Compliance Advisory | $175/hr | 4.85 | Available |
| **Carlos Rivera** | `carlos-rivera` | Security Operations & Incident Response | $185/hr | 4.80 | **Busy** |
| **Alex Nguyen** | `alex-nguyen` | Compliance Training & Certification Prep | $140/hr | 4.92 | Available |
| **Sarah Chen** | `sarah-chen` | DevSecOps Lead & Secure SDLC | $195/hr | 4.88 | Available |
| **Marcus Webb** | `marcus-webb` | Compliance Evidence & Data Documentation | $110/hr | 4.93 | Available |
| **Clark Stacer** | `clark-stacer` | Platform Architect & Compliance Automation | $250/hr | 4.95 | Available |

## Service Categories (Top-Level)

| Category | Icon | Subcategories |
|----------|------|---------------|
| **Assessors** | `assessment` | SOC 2, ISO 27001, HITRUST, PCI-DSS QSAs |
| **Advisors** | `support_agent` | GRC Consultants, Privacy Advisors, Risk Analysts |
| **Agentic** | `smart_toy` | AI Agent Builders, Prompt Engineers, Automation Specialists |
| **SecOps** | `security` | Security Analysts, Incident Responders, Threat Hunters |
| **DevSecOps** | `integration_instructions` | Secure SDLC, CI/CD Security, Container Security |
| **Data Services** | `storage` | Evidence Collection, Data Entry, Documentation |
| **Training** | `school` | Compliance Training, Certification Prep, Awareness Programs |

---

## Engagements (Corp-to-Corp Agreements)

Engagements are long-lived org-to-org relationships. They contain corporate vetting (D&B, MSA, banking, officer checks). Projects live under them.

| ID | Name | Buyer | Status | Projects |
|----|------|-------|--------|----------|
| `eng-001-pinnacle` | Pinnacle Corp ↔ W3Geekery | Pinnacle Corp | `in_progress` | **2** (crystal-harbor + type2) |
| `eng-002-fintech` | FinTech Inc ↔ W3Geekery | FinTech Inc | `in_progress` | 1 (velvet-summit) |
| `eng-003-startup-xyz` | Startup XYZ ↔ W3Geekery | Startup XYZ | `in_progress` | 1 (amber-circuit) |
| `eng-004-lakewood` | Lakewood Health ↔ W3Geekery | Lakewood Health | `in_progress` | 1 (silver-bridge) |
| `eng-005-healthtech` | HealthTech Co ↔ W3Geekery | HealthTech Co | `in_progress` | 1 (coral-meadow) |

---

## Projects (Scoped Work Under Engagements)

### Pinnacle Corp — 2 Projects (1:many demo)

#### 1. SOC 2 Type I Fast-Track Assessment (`proj-001-crystal-harbor`)
**What it demonstrates:** Assessor project, fixed-price, fast timeline, accepted bid with rejected alternative

| Field | Value |
|-------|-------|
| **Engagement** | `eng-001-pinnacle` (Pinnacle Corp ↔ W3Geekery) |
| **Status** | `active` |
| **Category** | Assessors |
| **Budget** | $6,000–$9,000 (fixed) |
| **Timeline** | 4 weeks (2026-03-01 → 2026-03-29) |

**Bids:**
| Provider | Price | Timeline | Status |
|----------|-------|----------|--------|
| A3-Gina-Auditor | $7,500 | 4 weeks | **Accepted** |
| Marcus Webb | $4,000 | 3 weeks | **Rejected** |

**Demo value:** Full RFP → bid → accepted/rejected → project lifecycle. Gina's accepted bid vs. Marcus's rejected one shows the selection process.

#### 2. SOC 2 Type II Continuous Monitoring (`proj-002-pinnacle-type2`)
**What it demonstrates:** Follow-on project under same engagement, 1:many relationship, draft status

| Field | Value |
|-------|-------|
| **Engagement** | `eng-001-pinnacle` (Pinnacle Corp ↔ W3Geekery) |
| **Status** | `draft` |
| **Category** | Assessors |
| **Timeline** | 6 months (2026-04-01 → 2026-09-30) |

**Bids:** None yet (project is in draft)

**Demo value:** Shows a second project under the same engagement. Demonstrates the engagement as a long-lived relationship container. Draft status shows project planning phase before work begins.

---

### FinTech Inc — 1 Project

#### 3. NIST CSF Implementation Advisor (`proj-003-velvet-summit`)
**What it demonstrates:** Advisory project, hourly billing, long timeline

| Field | Value |
|-------|-------|
| **Engagement** | `eng-002-fintech` (FinTech Inc ↔ W3Geekery) |
| **Status** | `active` |
| **Category** | Advisors |
| **Budget** | $150–$250/hr (hourly) |
| **Timeline** | 3 months (2026-03-02 → 2026-06-02) |

**Bids:**
| Provider | Price | Timeline | Status |
|----------|-------|----------|--------|
| James Okafor | $200/hr | 3 months | **Accepted** |

---

### Startup XYZ — 1 Project

#### 4. AI Agent for Compliance Evidence Collection (`proj-004-amber-circuit`)
**What it demonstrates:** Agentic category, negotiable budget, bid with withdrawal

| Field | Value |
|-------|-------|
| **Engagement** | `eng-003-startup-xyz` (Startup XYZ ↔ W3Geekery) |
| **Status** | `active` |
| **Category** | Agentic |
| **Budget** | $10,000–$20,000 (negotiable) |
| **Timeline** | 10-12 weeks (2026-03-03 → 2026-04-28) |

**Bids:**
| Provider | Price | Timeline | Status |
|----------|-------|----------|--------|
| A1-Bob-IT | $15,000 | 10 weeks | Pending |
| Carlos Rivera | $18,000 | 12 weeks | **Withdrawn** |

---

### Lakewood Health — 1 Project

#### 5. HIPAA Security Awareness Training (`proj-005-silver-bridge`)
**What it demonstrates:** Training category, healthcare buyer

| Field | Value |
|-------|-------|
| **Engagement** | `eng-004-lakewood` (Lakewood Health ↔ W3Geekery) |
| **Status** | `active` |
| **Category** | Training |
| **Budget** | $8,000–$12,000 (fixed) |
| **Timeline** | 6 weeks (2026-03-04 → 2026-04-15) |

**Bids:**
| Provider | Price | Timeline | Status |
|----------|-------|----------|--------|
| Alex Nguyen | $10,000 | 6 weeks | **Accepted** |

---

### HealthTech Co — 1 Project

#### 6. ISO 27001 Gap Assessment (`proj-006-coral-meadow`)
**What it demonstrates:** Assessor project, healthcare tech buyer, cross-framework expertise

| Field | Value |
|-------|-------|
| **Engagement** | `eng-005-healthtech` (HealthTech Co ↔ W3Geekery) |
| **Status** | `active` |
| **Category** | Assessors |
| **Budget** | $5,000–$7,500 (fixed) |
| **Timeline** | 4 weeks (2026-03-05 → 2026-04-02) |

**Bids:**
| Provider | Price | Timeline | Status |
|----------|-------|----------|--------|
| A3-Gina-Auditor | $6,500 | 4 weeks | **Accepted** |

---

## RFPs (Open — no `engagementTag`)

These exist in AuditgraphDB as Engagement entities with no `engagementTag`, so they appear on the /rfps page. They have NOT yet been converted to projects.

### 1. Penetration Testing for Healthcare Portal
| Buyer | Category | Budget | Status | Bids |
|-------|----------|--------|--------|------|
| (unassigned) | Assessors | $12K–$18K fixed | open | 0 |

### 2. Cloud Security Posture Review
| Buyer | Category | Budget | Status | Bids |
|-------|----------|--------|--------|------|
| (unassigned) | Advisors | $8K–$15K fixed | open | 2 pending (Gina $11K, Carlos $9.5K) |

### 3. AI-Powered Vulnerability Triage Agent
| Buyer | Category | Budget | Status | Bids |
|-------|----------|--------|--------|------|
| (unassigned) | Agentic | $25K–$40K negotiable | open | 3 pending (Bob $35K, Sarah $28K, Clark $38K) |

### 4. FedRAMP Readiness Assessment
| Buyer | Category | Budget | Status | Bids |
|-------|----------|--------|--------|------|
| (unassigned) | Assessors | $30K–$50K fixed | draft | 0 |

### 5. SOC 2 Type II Assessment Support
| Buyer | Category | Budget | Bids |
|-------|----------|--------|------|
| Acme Corp | Assessors | $8K–$12K fixed | 2 pending (Gina $10K, James $11.5K) |

### 6. HIPAA Risk Assessment & Remediation Plan
| Buyer | Category | Budget | Bids |
|-------|----------|--------|------|
| Lakewood Health | Advisors | $10K–$15K fixed | 2 pending (James $12K, Gina $13.5K) |

### 7. Automated PHI Access Monitoring Agent
| Buyer | Category | Budget | Bids |
|-------|----------|--------|------|
| Lakewood Health | Agentic | $12K–$25K negotiable | 2 pending (Bob $20K, Sarah $18K) |

### 8. SOC Monitoring Setup for Healthcare Cloud
| Buyer | Category | Budget | Bids |
|-------|----------|--------|------|
| Lakewood Health | SecOps | $18K–$25K fixed | 1 pending (Carlos $22K) |

### 9. Security Training Program Development
| Buyer | Category | Budget | Bids |
|-------|----------|--------|------|
| Enterprise Co | Training | $15K–$20K fixed | 2 pending (Alex $17.5K, James $19K) |

### 10. DevSecOps Pipeline Hardening
| Buyer | Category | Budget | Bids |
|-------|----------|--------|------|
| Pinnacle Corp | DevSecOps | $150–$200/hr hourly | 3 pending (Sarah $190/hr, Bob $195/hr, Carlos $185/hr) |

### 11. Compliance Evidence Package Preparation
| Buyer | Category | Budget | Bids |
|-------|----------|--------|------|
| Pinnacle Corp | Data Services | $3.5K–$5K fixed | 2 pending (Marcus $4.2K, Alex $4.8K) |

---

## ZeroBias Integration Points

### Tags (on UAT)
Engagement tags are on the engagement entities (corp-to-corp). Projects inherit the engagement's ZB context.

| Engagement Tag | UAT Tag ID |
|----------------|------------|
| `sme-mart.eng.pinnacle` | `e1864514-af28-4397-93a5-f05e443b05cb` |
| `sme-mart.eng.fintech` | `355a0e23-e22b-4622-b186-08e860513de6` |
| `sme-mart.eng.startup-xyz` | `49e67643-85da-44b0-a47a-c67c56a4d2d7` |
| `sme-mart.eng.lakewood` | `ba599b51-6d87-4c46-9c98-05244a928cc9` |
| `sme-mart.eng.healthtech` | `3b2e84a6-52bc-41d7-8e8c-5e78e65a033c` |

### Tasks (on UAT)
All tasks are in boundary **"SME Marketplace"** (`e3871f0b-56f0-4e5e-87c6-6ca196bf88c7`).

| Task Code | Task Name | UAT Task ID |
|-----------|-----------|-------------|
| `aha1-1` | SOC 2 Readiness Assessment | `abc5d715-b97d-4c76-a24b-95c643b68795` |
| `aha1-2` | NIST CSF Gap Analysis | `c3b5fc15-2cf3-406d-961b-570f78689821` |
| `aha1-3` | Compliance Automation Setup | `3a6799c6-65ea-4833-9cf9-3f739f0fe587` |
| `aha1-4` | FedRAMP Authorization Support | `900dfe93-ad93-4c02-996c-a8c13700e8ab` |
| `aha1-5` | ISO 27001 Evidence Collection | `d9895a40-38a4-4dad-9e8a-6ee588104cf0` |

### Boundary
All engagements share boundary **"SME Marketplace"**: `e3871f0b-56f0-4e5e-87c6-6ca196bf88c7`

---

## Lifecycle Scenarios for Demo

### Scenario A: Complete RFP-to-Project Flow
**Use:** Pinnacle `proj-001-crystal-harbor`
- Buyer (Pinnacle Corp) posts RFP
- 2 providers submit bids (Gina + Marcus)
- Buyer accepts Gina, rejects Marcus
- Engagement created (Pinnacle Corp ↔ W3Geekery)
- Project created under engagement
- Task tracked in ZeroBias platform

### Scenario B: 1:Many — Multiple Projects Under One Engagement
**Use:** Pinnacle `eng-001-pinnacle` with 2 projects
- `proj-001-crystal-harbor` (active, SOC 2 Type I)
- `proj-002-pinnacle-type2` (draft, SOC 2 Type II follow-on)
- Demonstrates engagement as a long-lived container for multiple scoped work items

### Scenario C: Hourly vs Fixed-Price Comparison
**Use:** `proj-003-velvet-summit` (hourly, $200/hr) vs `proj-001-crystal-harbor` (fixed, $7,500)
- Shows different budget_type handling in UI

### Scenario D: Provider with Multiple Active Projects
**Use:** A3-Gina-Auditor — active in `proj-001-crystal-harbor` and `proj-006-coral-meadow`
- Shows provider workload across different engagements/buyers

### Scenario E: Buyer with Multiple RFPs + Projects
**Use:** Lakewood Health — 3 open RFPs + 1 project (`proj-005-silver-bridge`)
- Demonstrates "My Engagements" view for a power buyer

### Scenario F: Withdrawn Bid
**Use:** `proj-004-amber-circuit` — Carlos Rivera withdrew his bid
- Shows bid withdrawal state

### Scenario G: Competitive Bidding (Most Bids)
**Use:** DevSecOps Pipeline Hardening (open RFP) — 3 providers bidding
- Good for showing bid comparison/ranking

### Scenario H: Draft Project (Pre-Work)
**Use:** `proj-002-pinnacle-type2` — draft status, no bids yet
- Shows project planning phase before work begins
- Under same engagement as an active project

---

## Agent Skills Catalog (UAT — 2026-04-14)

Added as a second product on the SME Marketplace boundary to demo cross-product pipeline ingestion into AuditgraphDB.

### Platform IDs (UAT `uat.zerobias.com`)

| Field | Value |
|---|---|
| Boundary | SME Marketplace — `e3871f0b-56f0-4e5e-87c6-6ca196bf88c7` |
| Product | Agent Skills (`@zerobias-org/product-zerobias-schemas-agentskills`) — `24fd77dd-bd66-490a-b6b6-3b1b5a875332` |
| Boundary Product | `0447298c-6dc0-4c95-aca7-cbf8de327b69` |
| Schema Package | `@zerobias-org/schema-zerobias-schemas-agentskills@1.0.6` |
| Pipeline | Agent Skills Entity Pipeline — `45a6d8c8-15e1-4ee9-9dd0-239633297ae0` |
| Pipeline mode | receiver / differential / dynamic / all, format=json |
| Schema class | `AgentSkill` extends `Element` — fields: `name`, `description`, `license`, `compatibility`, `author`, `skillVersion`, `sourceRepo`, `sourcePath`, `allowedTools`, `bodyContent` |

### Push Path
```
platform.Pipeline.receive({ pipelineId: "45a6d8c8-...", data: [ { /* AgentSkill instances */ } ], markDeleted: [] })
```
Full-replace semantics — every push must include ALL fields or they get nulled.

### Demo Skill: `visual-explainer`

Picked because its SKILL.md frontmatter has full agentskills.io metadata (license, compatibility, author, version) — one-to-one mapping to the AgentSkill schema. Published repo at `nicobailon/visual-explainer`.

| AgentSkill field | Value |
|---|---|
| `name` | `visual-explainer` |
| `description` | Generate beautiful, self-contained HTML pages that visually explain systems, code changes, plans, and data. |
| `license` | MIT |
| `compatibility` | Requires a browser to view generated HTML files. Optional surf-cli for AI image generation. |
| `author` | nicobailon |
| `skillVersion` | 0.1.1 |
| `sourceRepo` | `https://github.com/nicobailon/visual-explainer` (TBD — confirm canonical URL) |
| `sourcePath` | `SKILL.md` |
| `allowedTools` | *(not specified in frontmatter)* |
| `bodyContent` | Full SKILL.md markdown body |

### Demo Scenarios
- **Scenario I: Second-Product Pipeline.** Shows that one boundary can host multiple products, each with its own receiver pipeline writing to different class namespaces.
- **Scenario J: AgentSkill Catalog Browse.** SME Mart UI queries `AgentSkill` class via GQL, renders a searchable list of installable skills (filter by `allowedTools`, `license`).
