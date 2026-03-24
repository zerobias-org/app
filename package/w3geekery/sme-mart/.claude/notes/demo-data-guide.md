# SME Mart Demo Data Guide

This doc maps every demo entity to show which data demonstrates each aspect of the engagement lifecycle.

## Buyer Organizations

| Display Name | Org ID | ZB User ID | Notes |
|-------------|--------|------------|-------|
| **Lakewood Health** | `org-lakewood-health` | `demo-buyer-lakewood` | Healthcare buyer, 3 RFPs + 1 engagement |
| **Pinnacle Corp** | `org-pinnacle-corp` | `demo-buyer-pinnacle` | Series B startup, 2 RFPs + 1 engagement |
| **Acme Corp** | `org-acme-corp` | `buyer-acme-001` | B2B SaaS, 1 open RFP |
| **FinTech Inc** | `org-fintech-inc` | `buyer-fintech-002` | Financial services, 1 engagement |
| **Startup XYZ** | `org-startup-xyz` | `buyer-startup-003` | Startup, 1 engagement |
| **HealthTech Co** | `org-healthtech` | `buyer-health-004` | Healthcare tech, 1 engagement |
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

## Engagements (Active — `in_progress`)

These 5 work_requests have been converted from RFPs to active engagements. Each has a ZeroBias Task on **UAT** (`uat` profile), boundary **"SME Marketplace"** (`e3871f0b-56f0-4e5e-87c6-6ca196bf88c7`). Old IDs in parentheses for reference.

### 1. SOC 2 Type I Fast-Track Assessment
**What it demonstrates:** Assessor engagement, fixed-price, fast timeline, accepted bid with rejected alternative

| Field | Value |
|-------|-------|
| **Engagement Tag** | `sme-mart.eng.crystal-harbor` |
| **Category** | Assessors |
| **Buyer** | Pinnacle Corp |
| **Budget** | $6,000–$9,000 (fixed) |
| **Timeline** | 4 weeks |
| **ZB Task ID** | `abc5d715-b97d-4c76-a24b-95c643b68795` (old: `fafe9c00-...`) |
| **ZB Task Code** | `aha1-1` |
| **ZB Tag ID** | `e1864514-af28-4397-93a5-f05e443b05cb` (old ZB-Ops: `b4c97483-...`, CI: `518acc1c-...`) |

**Bids:**
| Provider | Price | Timeline | Status |
|----------|-------|----------|--------|
| A3-Gina-Auditor | $7,500 | 4 weeks | **Accepted** |
| Marcus Webb | $4,000 | 3 weeks | **Rejected** |

**Demo value:** Shows full RFP → bid → accepted/rejected → engagement → ZB Task lifecycle. Gina's accepted bid vs. Marcus's rejected one shows the selection process.

---

---

## RFPs (Open — no `engagementTag`)

These 4 engagements do NOT have an `engagementTag`, so they appear on the /rfps page.

### 1. Penetration Testing for Healthcare Portal
| Buyer | Category | Budget | Status | Bids |
|-------|----------|--------|--------|------|
| (unassigned) | Assessors | $12K–$18K fixed | open | 0 |

**Demo value:** Open RFP with no bids yet. Shows the "waiting for bids" state.

### 2. Cloud Security Posture Review
| Buyer | Category | Budget | Status | Bids |
|-------|----------|--------|--------|------|
| (unassigned) | Advisors | $8K–$15K fixed | open | 2 pending (Gina $11K, Carlos $9.5K) |

**Demo value:** Open RFP with competing bids from different specialties (auditor vs SOC analyst).

### 3. AI-Powered Vulnerability Triage Agent
| Buyer | Category | Budget | Status | Bids |
|-------|----------|--------|--------|------|
| (unassigned) | Agentic | $25K–$40K negotiable | open | 3 pending (Bob $35K, Sarah $28K, Clark $38K) |

**Demo value:** Most competitive RFP. Three different approaches: AI agent (Bob), pipeline-native (Sarah), ZeroBias Hub module (Clark). Wide price spread.

### 4. FedRAMP Readiness Assessment
| Buyer | Category | Budget | Status | Bids |
|-------|----------|--------|--------|------|
| (unassigned) | Assessors | $30K–$50K fixed | draft | 0 |

**Demo value:** Draft status — buyer hasn't published yet. Highest budget RFP.

---

### 2. NIST CSF Implementation Advisor
**What it demonstrates:** Advisory engagement, hourly billing, long timeline

| Field | Value |
|-------|-------|
| **Engagement Tag** | `sme-mart.eng.velvet-summit` |
| **Category** | Advisors |
| **Buyer** | FinTech Inc |
| **Budget** | $150–$250/hr (hourly) |
| **Timeline** | 3 months |
| **ZB Task ID** | `c3b5fc15-2cf3-406d-961b-570f78689821` (old: `9d4a93a9-...`) |
| **ZB Task Code** | `aha1-2` (CI: `aha1-5`) |
| **ZB Tag ID** | `355a0e23-e22b-4622-b186-08e860513de6` (old ZB-Ops: `0630ad1b-...`, CI: `e07c3ee5-...`) |

**Bids:**
| Provider | Price | Timeline | Status |
|----------|-------|----------|--------|
| James Okafor | $200/hr | 3 months | **Accepted** |

**Demo value:** Hourly-rate engagement (vs. fixed-price). Single bid accepted. Financial services buyer with GRC consultant provider.

---

### 3. AI Agent for Compliance Evidence Collection
**What it demonstrates:** Agentic category, negotiable budget, bid with withdrawal

| Field | Value |
|-------|-------|
| **Engagement Tag** | `sme-mart.eng.amber-circuit` |
| **Category** | Agentic |
| **Buyer** | Startup XYZ |
| **Budget** | $10,000–$20,000 (negotiable) |
| **Timeline** | 8–12 weeks |
| **ZB Task ID** | `3a6799c6-65ea-4833-9cf9-3f739f0fe587` (old: `9ab5a79a-...`) |
| **ZB Task Code** | `aha1-3` (CI: `aha1-6`) |
| **ZB Tag ID** | `49e67643-85da-44b0-a47a-c67c56a4d2d7` (old ZB-Ops: `b244cd6c-...`, CI: `aacd35bd-...`) |

**Bids:**
| Provider | Price | Timeline | Status |
|----------|-------|----------|--------|
| A1-Bob-IT | $15,000 | 10 weeks | Pending |
| Carlos Rivera | $18,000 | 12 weeks | **Withdrawn** |

**Demo value:** Shows the "negotiable" budget type. Carlos Rivera's withdrawn bid demonstrates a provider pulling out. Note: no bid is explicitly "accepted" yet — engagement may have been created by buyer directly.

---

### 4. HIPAA Security Awareness Training
**What it demonstrates:** Training category, healthcare buyer with repeat engagement

| Field | Value |
|-------|-------|
| **Engagement Tag** | `sme-mart.eng.silver-bridge` |
| **Category** | Training |
| **Buyer** | Lakewood Health |
| **Budget** | $8,000–$12,000 (fixed) |
| **Timeline** | 6 weeks |
| **ZB Task ID** | `900dfe93-ad93-4c02-996c-a8c13700e8ab` (old: `127dfed5-...`) |
| **ZB Task Code** | `aha1-4` (CI: `aha1-7`) |
| **ZB Tag ID** | `ba599b51-6d87-4c46-9c98-05244a928cc9` (old ZB-Ops: `29ab33e0-...`, CI: `b3b590d8-...`) |

**Bids:**
| Provider | Price | Timeline | Status |
|----------|-------|----------|--------|
| Alex Nguyen | $10,000 | 6 weeks | **Accepted** |

**Demo value:** Training engagement. Lakewood Health is a repeat buyer (also has 3 open RFPs). Shows healthcare vertical + training category.

---

### 5. ISO 27001 Gap Assessment
**What it demonstrates:** Assessor engagement, healthcare tech buyer, cross-framework expertise

| Field | Value |
|-------|-------|
| **Engagement Tag** | `sme-mart.eng.coral-meadow` |
| **Category** | Assessors |
| **Buyer** | HealthTech Co |
| **Budget** | $5,000–$7,500 (fixed) |
| **Timeline** | 4 weeks |
| **ZB Task ID** | `d9895a40-38a4-4dad-9e8a-6ee588104cf0` (old: `43bcbbfd-...`) |
| **ZB Task Code** | `aha1-5` (CI: `aha1-8`) |
| **ZB Tag ID** | `3b2e84a6-52bc-41d7-8e8c-5e78e65a033c` (old ZB-Ops: `b8e84e56-...`, CI: `49cbb0b8-...`) |

**Bids:**
| Provider | Price | Timeline | Status |
|----------|-------|----------|--------|
| A3-Gina-Auditor | $6,500 | 4 weeks | **Accepted** |

**Demo value:** Gina has 2 active engagements (this + crystal-harbor), showing a busy provider. HealthTech Co mentions HIPAA + ISO dual requirements.

---

## Open RFPs (status: `open`, no engagement_tag)

These demonstrate the "marketplace browsing" and "bid submission" stages.

### 1. SOC 2 Type II Assessment Support
| Buyer | Category | Budget | Bids |
|-------|----------|--------|------|
| Acme Corp | Assessors | $8K–$12K fixed | 2 pending (Gina $10K, James $11.5K) |

**Demo value:** Multiple competing bids, neither accepted yet. Good for showing bid comparison UI.

### 2. HIPAA Risk Assessment & Remediation Plan
| Buyer | Category | Budget | Bids |
|-------|----------|--------|------|
| Lakewood Health | Advisors | $10K–$15K fixed | 2 pending (James $12K, Gina $13.5K) |

**Demo value:** Same buyer (Lakewood) with another RFP. Shows buyer with multiple requests across categories.

### 3. Automated PHI Access Monitoring Agent
| Buyer | Category | Budget | Bids |
|-------|----------|--------|------|
| Lakewood Health | Agentic | $12K–$25K negotiable | 2 pending (Bob $20K, Sarah $18K) |

**Demo value:** Agentic category, wide negotiable budget range. Healthcare AI use case.

### 4. SOC Monitoring Setup for Healthcare Cloud
| Buyer | Category | Budget | Bids |
|-------|----------|--------|------|
| Lakewood Health | SecOps | $18K–$25K fixed | 1 pending (Carlos $22K) |

**Demo value:** SecOps category. Carlos (busy status) still submitting bids.

### 5. Security Training Program Development
| Buyer | Category | Budget | Bids |
|-------|----------|--------|------|
| Enterprise Co | Training | $15K–$20K fixed | 2 pending (Alex $17.5K, James $19K) |

**Demo value:** Training category from a different buyer. Cross-discipline bids (trainer + GRC consultant).

### 6. DevSecOps Pipeline Hardening
| Buyer | Category | Budget | Bids |
|-------|----------|--------|------|
| Pinnacle Corp | DevSecOps | $150–$200/hr hourly | 3 pending (Sarah $190/hr, Bob $195/hr, Carlos $185/hr) |

**Demo value:** Hourly RFP with 3 competing bids — most bids of any RFP. DevSecOps category. Good for showing competitive bidding.

### 7. Compliance Evidence Package Preparation
| Buyer | Category | Budget | Bids |
|-------|----------|--------|------|
| Pinnacle Corp | Data Services | $3.5K–$5K fixed | 2 pending (Marcus $4.2K, Alex $4.8K) |

**Demo value:** Data Services category. Lowest budget RFP. Marcus (evidence specialist) vs. Alex (trainer offering to cross-sell).

---

## ZeroBias Integration Points

### Tags (on UAT, `uat` profile)
Every engagement has a `zerobias_tag_id` — these are ZeroBias Tags used to label/filter tasks.

| Engagement Tag | UAT Tag ID |
|----------------|------------|
| `sme-mart.eng.crystal-harbor` | `e1864514-af28-4397-93a5-f05e443b05cb` |
| `sme-mart.eng.velvet-summit` | `355a0e23-e22b-4622-b186-08e860513de6` |
| `sme-mart.eng.amber-circuit` | `49e67643-85da-44b0-a47a-c67c56a4d2d7` |
| `sme-mart.eng.silver-bridge` | `ba599b51-6d87-4c46-9c98-05244a928cc9` |
| `sme-mart.eng.coral-meadow` | `3b2e84a6-52bc-41d7-8e8c-5e78e65a033c` |

### Tasks (on UAT, `uat` profile)
All tasks are `todo` in boundary **"SME Marketplace"** (`e3871f0b-56f0-4e5e-87c6-6ca196bf88c7`), activity "Ad Hoc Activity - One person" (`e15830c8-4274-4d67-bf9b-c22b60001e32`), workflow "Software Development Lifecycle".

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

### Scenario A: Complete RFP-to-Engagement Flow
**Use:** `crystal-harbor` (SOC 2 Fast-Track)
- Buyer (Pinnacle Corp) posts RFP
- 2 providers submit bids (Gina + Marcus)
- Buyer accepts Gina, rejects Marcus
- Engagement created with ZB Task + Tag
- Task tracked in ZeroBias platform

### Scenario B: Hourly vs Fixed-Price Comparison
**Use:** `velvet-summit` (hourly, $200/hr) vs `crystal-harbor` (fixed, $7,500)
- Shows different budget_type handling in UI
- Hourly shows rate; fixed shows total

### Scenario C: Provider with Multiple Active Engagements
**Use:** A3-Gina-Auditor — active in both `crystal-harbor` and `coral-meadow`
- Shows provider workload/capacity
- "Busy" indicator potential

### Scenario D: Buyer with Multiple RFPs + Engagements
**Use:** Lakewood Health — 3 open RFPs + 1 engagement (`silver-bridge`)
- Demonstrates "My Engagements" view for a power buyer
- Multiple categories: Advisors, Agentic, SecOps, Training

### Scenario E: Withdrawn Bid
**Use:** `amber-circuit` — Carlos Rivera withdrew his bid
- Shows bid withdrawal state
- Only Bob's pending bid remains

### Scenario F: Competitive Bidding (Most Bids)
**Use:** DevSecOps Pipeline Hardening (open RFP) — 3 providers bidding
- Sarah, Bob, Carlos all competing at ~$185–195/hr
- Good for showing bid comparison/ranking

### Scenario G: Provider Reviews
**Use:** Any provider detail page — all 8 providers have 2–4 reviews each
- Reviews come from different buyers
- Ratings range from 3 to 5 stars
- All reviews currently `approved: false` (admin approval flow)
