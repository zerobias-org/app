# CDPH HBEDS RFP Analysis — Full Document Review

> **Date:** 2026-03-06
> **Source:** `.claude/references/CA Department of Public Health RFP/` (all 17 documents read)
> **Context:** Brian directed us to use this real CDPH RFP as the template for building out the demand side of SME Mart — engagement requirements, project requirements, and task/subtask decomposition.
> **Visual:** `.claude/diagrams/exhibit-f-demand-side-analysis.html` (Exhibit F breakdown only)

---

## RFP Overview

**RFP 37498 — Hospital Bed and Emergency Medical Services Data System (HBEDS)**

- **Buyer:** California Department of Public Health (CDPH), Center for Preparedness and Response
- **Issued:** February 23, 2026 via CA Dept. of General Services
- **Proposals Due:** April 2, 2026 at 5:00 PM
- **Contract Term:** 3 years base + 2 optional 1-year extensions (5 years max)
- **Scope:** Statewide SaaS system to automate hospital bed capacity reporting from EMR/EHR systems, replacing manual bed-polling. Must comply with Assembly Bill 177 (AB 177) and submit data to CDC/NHSN.
- **Target Population:** 497 California hospitals over 5 years (215 in Year 1, scaling to 497 by Year 5)
- **Service Level:** 24/7/365 system availability with 15-minute data refresh; business support 8 AM-5 PM PST Mon-Fri

---

## Document-by-Document Summary

### Master RFP (1-RFP_37498)

The master solicitation document. Defines procurement rules, evaluation criteria, bid submission requirements, protest procedures, and contract terms. Key elements:

- **Bidders Conference:** March 6, 2026 (Teams, 10:00-11:30 AM)
- **Final Questions/Change Requests:** March 10, 2026
- **GenAI Disclosure Required:** Bidders must disclose if they intend to use GenAI for deliverables
- **Iran Contracting Act / DVBE / Small Business:** Standard CA state procurement preference programs
- **Service Location:** Remote within U.S. (no on-site required except optional onboarding)

### Exhibit A — Statement of Work (SOW)

The functional requirements. This is the **FUNCTIONAL** task domain.

**System Requirements:**
- Integration with hospital EMR/EHR systems for real-time staffed bed availability by bed type
- Continuous 24/7 data collection in 15-minute increments per CDC/NHSN
- Support SFTP, API, or FHIR data transmission based on hospital capability
- Automate bed reporting on behalf of hospitals
- SSO required (SAML 2.0 or OIDC/OAuth2)
- MFA for privileged access and sensitive data

**Dashboard Requirements:**
- Filter by hospital, bed type, region
- Real-time bed availability (staffed beds: ICU, med/surg, pediatric, psychiatric, etc.)
- Occupancy rates and available capacity
- Hospital integration status (EHR connectivity, success/failure logs)
- Operational insights (trends, surge capacity, geographic distribution)
- CDC/NHSN compliance tracking (submission timeliness, audit logs, alerts)
- Historical data download, weekly/monthly/annual filters

**Hospital Onboarding:**
- Virtual enrollment sessions
- Documentation and outreach materials (CDPH approval required)
- Access management (grant/revoke)
- Monthly onboarding reports (by 5th of following month)
- Monthly data subscription tracking spreadsheet
- Participation agreement to hospital within 5 business days of request

**Data Transmission:**
- To CDC/NHSN: at least twice daily (per Exhibit A1)
- To CDPH: via API every 15 minutes

**Implementation Plan (due 30 days after award):**
- Project timelines with major milestones
- Readiness checkpoints and progress review intervals
- Hospital onboarding schedule (volume projections by period)
- Risk mitigation strategies

**Key Milestones:**
- Kickoff: within 30 days of award
- CDPH dashboard access: within 60 days
- Hospital outreach materials: within 60 days
- Hospital onboarding start: within 90 days
- Hospital authorized partner access: within 180 days

**Subcontractor Management:**
- 14 working days advance notice for changes
- CDPH approval before termination/hire
- Subcontracts must include all contract compliance clauses

### Exhibit A1 — CDC/NHSN Instruction Book

Technical specifications for hospital bed capacity data reporting to CDC's National Healthcare Safety Network.

**Connectivity Options:**
1. Hospital-to-Jurisdiction Capacity System (intermediary datastore, 15-min minimum collection)
2. Direct Facility Reporting to NHSN (independent via NHSN API, requires CDC SAMS access)

**File Specs:**
- Format: JSON
- Naming: `XX-yyyymmdd-hh:mm:ss.JSON`
- 5 required fields: NHSN OrgID, Context, Reporting Status, Collection Date, Extraction Date

**Transmission Frequency:**
- Minimum: every 3 hours, one record per hour granularity
- Alternative: hourly transmission

**Reporting Status Values:**
- ActiveCMS (meets CMS requirements)
- ActiveNoCMS (onboarded but doesn't meet CMS)
- Test (onboarding/validation)
- Inactive (no longer participating)

**Bed Definitions:**
- Staffed beds (not licensed beds) = actual capacity
- Surge beds = non-licensed emergency overflow
- Zero = bed type exists, none occupied/unoccupied
- Null = bed type exists, no data reported
- 9999 = bed type not offered

### Exhibit A2 — Required Data Elements

**78 data elements total** across these categories:

| Category | Elements | Examples |
|----------|----------|----------|
| Core facility info | 5 | NHSN OrgID, Collection Date, Context, Reporting Status, Extraction Date |
| All beds census/availability | 14 | AllBedsOccupied, AllBedsUnoccupied |
| Adult beds | 16 | ICU, Non-ICU, PCU, MTMS, Obstetrics (occupied + unoccupied each) |
| Pediatric beds | 16 | Same breakdown as adult |
| Specialty beds | 24 | OB, NICU Levels 1-4, Nursery, Psych, Rehab |
| Surge beds | 9 | Active/Inactive ICU, Non-ICU (occupied + unoccupied) |
| Additional beds | 4 | Burn, Negative Pressure |
| Emergency Department | 6 | Adult/Peds/Total ED census and admitted census |
| Respiratory data | 26 | COVID-19, Influenza, RSV by age group (0-4, 5-17, 18-49, 50-64, 65-74, 75+) |

### Exhibit B — Budget Detail and Payment Provisions

**Cost Model (FINANCIAL domain):**
- **Quarterly subscription** per hospital (paid in advance after first quarter)
- **Per-hospital onboarding fee** (billed in arrears)
- Invoices submitted quarterly (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec)
- Prorated charges for mid-quarter onboarding

**5-Year Hospital Ramp:**

| Year | Expected Subscribed Hospitals | New Onboardings |
|------|------------------------------|-----------------|
| 1 | 215 | 215 |
| 2 | 300 | 85 |
| 3 | 385 | 85 |
| 4 (optional) | 415 | 30 |
| 5 (optional) | 497 | 82 |

**Payment Terms:**
- California Prompt Payment Act applies
- Budget contingency clause (if funds not appropriated, contract is void)
- Final invoice within 30 calendar days of contract expiration
- Disputed invoices: contractor corrects and resubmits (no credit memos)
- Overpayment recovery: full amount within 30 days or negotiated repayment schedule

### Exhibit B1 — Federal Fund Provisions

**Federal compliance requirements (COMPLIANCE domain):**
- Contract contingent on Congressional appropriation
- Equal opportunity requirements (no discrimination, affirmative action)
- Debarment & suspension certification (not presently debarmed, no convictions in 3 years)
- No contingent fees / no lobbying with federal funds (>$100K)
- Clean Air Act / Clean Water Act compliance (>$100K)
- Smoke-free workplace for services to children <18
- Small/minority/women-owned business participation encouraged
- Financial & compliance audit per 2 CFR 200 (single audit if >$750K federal awards)

### Exhibit C — Special Provisions

**Intellectual property (LEGAL domain):**
- No third-party IP dependency without State approval
- State gets non-exclusive worldwide royalty-free license to use IP in cloud services
- Federal government gets irrevocable paid-up worldwide license for governmental purposes
- Contractor warranties: free to perform, no privacy violations, no conflicting rights, no copyright violations
- CDPH makes no patent/trademark warranty

### Exhibit D — Additional Provisions

**Insurance, subcontractor, and business compliance (LEGAL + COMPLIANCE domain):**

**Insurance Requirements (non-negotiable):**
- Commercial General Liability: $1M/occurrence, $2M aggregate (State named as additional insured)
- Auto Liability: $1M combined single limit (if applicable)
- Workers' Comp: statutory + $1M employer's liability
- Carrier: AM Best A- or better, Category VI+

**Subcontractor Rules:**
- Prior written authorization for any subcontract >$5,000
- Minimum 3 competitive quotes (or justification)
- CDPH right to inspect/audit subcontract files
- CDPH can require subcontractor substitution/termination within 30 days

**DVBE/Small Business Compliance:**
- Must use proposed DVBEs from bid or submit written substitution
- Same rules for small business subcontractors
- DGS sanctions for non-compliance

### Exhibit E — Information Privacy

**Privacy requirements (COMPLIANCE domain) — this is dense and overlaps heavily with Exhibit F.**

**Scope:**
- Covers all Personal/Confidential Information (PCI): medical, health insurance, PHI
- Supersedes conflicting terms in other exhibits
- Workforce members must be located in continental U.S. only

**Key Requirements:**
- Written information privacy/security program at each PCI location
- Designated Security Officer at each location
- Annual workforce training (at contractor's expense), certifications retained 3 years
- Signed confidentiality statements from all workforce members

**Breach Notification Chain:**
- Immediately by phone AND email to Program Contract Manager, Privacy Officer, CISO
- 24-hour deadline for email if after hours
- Written investigation report ASAP: data elements, individuals affected, probable causes
- Corrective action plan including containment and prevention
- If >500 individuals: notification to affected persons + Attorney General per CA Civil Code 1798.29

**Technical Security Controls (within Exhibit E):**
- Encryption: all desktops/mobile, removable media, in-transit, at-rest (FIPS 140 or CDPH standards)
- FIDO authentication required (AAL 3) — YubiKeys or Windows Hello for Business
- Patch management: Critical (CVSS 9.0-10.0) within 48 hours, High within 7 days, Other within 30 days
- Unique user IDs, RBAC, session termination by AAL level
- System logging with 6-year retention
- Intrusion detection/prevention on all internet-facing systems
- Live data prohibited for testing (must use synthetic data)
- Business continuity/disaster recovery plans for PCI systems
- Paper document controls (never unattended, escorted visitors, tracked mailing for 500+ records)

**Reauthentication Schedule:**

| AAL Level | Fixed Time | Inactivity | Authenticators |
|-----------|-----------|-----------|----------------|
| AAL 1 | 30 days | N/A | One |
| AAL 2 | 12 hours | 30 minutes | One |
| AAL 3 | 12 hours | 15 minutes | Both |

### Exhibit F — Information Systems Security

**Security requirements (ISO/SR1 v5.5) — 5 categories, ~45 requirements. Already decomposed in detail in CEO_NOTES and the HTML diagram.** See `.claude/diagrams/exhibit-f-demand-side-analysis.html` for the full Task/SubTask tree.

Summary of categories:
1. Administrative/Management Safeguards (8 requirements): workforce confidentiality, access authorization, activity review, recovery plan, change control, business associate compliance, incident response
2. Technical/Operational Safeguards (14): endpoint protection, patch management, encryption (transit/rest/workstation/removable/connectivity), IDS/IPS, sanitization, authentication logging, reauthentication, audit access/events/retention
3. Solution Architecture (15): layered 4-tier design, container security, WAF, identity proofing (IAL 2), MFA (FIDO2/AAL 3), OWASP ASVS Level 2, secure SDLC, penetration testing, PAM, NIST SP800-53r5, PCI DSS, offshore access controls
4. Documentation (7): system config docs, asset inventory (FIPS-199), ISSP, roles/relationships, audit method docs, 6-year retention, PTA/PIA assessments
5. ISO Notifications & Approvals (4): security compliance notification pre-custody, change approval, breach notification, PAL Stage/Gate approvals

### Exhibit G — Contractor's Release

Final payment release form. Contractor certifies:
- Release of all obligations/claims against State upon final payment
- Agrees to refund any sustained audit exceptions post-final-payment
- 3-year record retention beyond final payment date
- Return of state equipment (if applicable)
- Recycled product certification

### Attachment 1 — Cost Workbook

Template for bidder pricing. Two line items per year:
1. **Quarterly subscription fee** (per hospital) x expected hospital count x 4 quarters
2. **Per-hospital onboarding fee** x expected new onboardings

Bidder fills in unit costs; workbook calculates 5-year total. All cells blank (template).

### Attachment 2 — Key Action Dates

| Date | Event |
|------|-------|
| Feb 23, 2026 | RFP release |
| Mar 6, 2026 | Bidders Conference (Teams) |
| Mar 10, 2026 | Last day for questions/change requests |
| Mar 17, 2026 | State response to questions |
| Mar 20, 2026 | Last day to protest RFP requirements |
| Apr 2, 2026 | Proposals due (5:00 PM) |
| TBD | Cost public opening, Intent to Award, Protest deadline, Contract award |

### Attachment 3 — Narrative Response

Bidder certification questions at submission:
- Iran Contracting Act compliance (3 questions)
- Small Business / DVBE / TACPA preference claims
- GenAI disclosure (will bidder use GenAI for deliverables?)
- International business activity in last 3 years

### Attachment 4 — Bidder Skills and Experience

Bidder must demonstrate experience in 3 categories (up to 5 projects each, with verifiable customer contacts):
1. **Operational System:** Successfully implemented hospital bed capacity system or comparable
2. **Client Onboarding:** Experience working with customers to establish capacity systems
3. **Healthcare/EMS Engagement:** Working with healthcare facilities or EMS providers in the U.S.

---

## Hospital Dataset Analysis

### Target Population

**105 facilities currently documented** (from the v1-3 spreadsheet):
- 95 Acute Care Hospitals
- 10 Children's Hospitals

**Statewide Totals:**

| Metric | Value |
|--------|-------|
| Total Licensed Beds | 37,865 |
| Medicare Certified Beds | 37,378 (99.7%) |
| Licensed ER Beds | 3,670 |
| Adjusted Patient Days | 15.7M |
| Inpatient Days | 13.5M |
| Total Annual Discharges | 2.18M |

**Geographic Concentration (top 6 CBSAs = 70% of capacity):**

| CBSA | Hospitals | Beds | Avg Beds/Hospital |
|------|-----------|------|-------------------|
| Los Angeles-Long Beach-Glendale | 33 | 13,829 | 419 |
| San Francisco-Oakland-Berkeley | 12 | 4,502 | 375 |
| San Diego-Chula Vista-Carlsbad | 9 | 3,465 | 385 |
| Riverside-San Bernardino-Ontario | 8 | 3,928 | 491 |
| San Jose-Sunnyvale-Santa Clara | 6 | 2,484 | 414 |
| Sacramento-Roseville-Folsom | 5 | 1,930 | 386 |

**Key Demographics:**
- CA total: 36.57M population, 0.29 hospitals per 100K, 1.06 beds per 1K
- Rural CA severely underserved: 0.02 beds per 1K vs. LA's 1.38
- Aging population: 17.2% age 65+ in rural areas
- 75% non-profit ownership (private + church); only ~5% proprietary
- 104/105 facilities have 24/7 emergency departments

---

## Complete Task Decomposition — All Exhibits

If a buyer used SME Mart to post this RFP as a project, here's the full task tree across ALL documents:

### Activity 1: FUNCTIONAL Requirements (Exhibits A, A1, A2)

| Task | SubTasks | Source |
|------|----------|--------|
| System Integration & Data Collection | EMR/EHR integration, 15-min collection, SFTP/API/FHIR support, automated reporting | Ex A |
| Dashboard & Reporting | Filtering, real-time beds, occupancy, integration status, compliance tracking, historical data | Ex A |
| Hospital Onboarding Program | Virtual enrollment, outreach materials, access management, monthly reporting, participation agreements | Ex A |
| CDC/NHSN Data Submission | Twice-daily submission, JSON format, 78 data elements, facility ID validation, quality checks | Ex A1, A2 |
| Implementation Planning | Project timelines, milestones, readiness checkpoints, onboarding schedule, risk mitigation | Ex A |
| SSO & Authentication | SAML 2.0 or OIDC/OAuth2, MFA for privileged access | Ex A |
| Subcontractor Management | 14-day notice, CDPH approval, compliance clauses in subcontracts | Ex A |

**Estimated subtasks: ~40-50**

### Activity 2: FINANCIAL Requirements (Exhibits B, B1, Attachment 1)

| Task | SubTasks | Source |
|------|----------|--------|
| Pricing & Cost Model | Per-hospital quarterly subscription, per-hospital onboarding fee, 5-year projections | Ex B, Att 1 |
| Invoicing & Payment | Quarterly invoicing, prorated charges, final invoice within 30 days, prompt payment act | Ex B |
| Budget Contingency | State funding appropriation dependency, amendment provisions | Ex B |
| Overpayment Recovery | 30-day remittance or repayment schedule, interest accrual | Ex B |
| Federal Funding Compliance | Congressional appropriation contingency, audit per 2 CFR 200, single audit if >$750K | Ex B1 |

**Estimated subtasks: ~15-20**

### Activity 3: LEGAL Requirements (Exhibits C, D, G)

| Task | SubTasks | Source |
|------|----------|--------|
| Intellectual Property | Third-party IP approval, State license grant, federal government license, warranties | Ex C |
| Insurance Requirements | CGL $1M/$2M, auto $1M, workers' comp statutory/$1M, AM Best A- carrier | Ex D |
| Subcontractor Compliance | >$5K authorization, 3 competitive quotes, CDPH audit rights, substitution/termination | Ex D |
| DVBE/Small Business | Use proposed DVBEs, substitution process, DGS sanctions for non-compliance | Ex D |
| Contractor Release | Final payment release, audit exception refunds, 3-year record retention, equipment return | Ex G |

**Estimated subtasks: ~20-25**

### Activity 4: COMPLIANCE Requirements (Exhibits B1, E)

| Task | SubTasks | Source |
|------|----------|--------|
| Privacy Program | Written privacy/security program per PCI location, designated Security Officer | Ex E |
| Workforce Training & Clearance | Annual training, confidentiality statements, 3-year certification retention, U.S.-only workforce | Ex E |
| Breach Notification | Immediate phone+email, 24-hour written, investigation report, corrective action, AG notification if >500 | Ex E |
| Data Protection Controls | Encryption (all types), FIDO/AAL 3 auth, RBAC, unique user IDs, session management | Ex E |
| Patch Management | Critical <48hrs, High <7 days, Other <30 days (CVSS-based) | Ex E |
| Audit & Logging | 6-year retention, routine log review, read-only audit trails | Ex E |
| Business Continuity/DR | Technical recovery plans, backup procedures, >24hr interruption response | Ex E |
| Paper Document Controls | Never unattended, escorted visitors, tracked mailing for 500+, encrypted removable media | Ex E |
| Federal Equal Opportunity | No discrimination, affirmative action, include in subcontracts | Ex B1 |
| Debarment Certification | Not debarred/suspended, no convictions in 3 years | Ex B1 |
| Lobbying Restrictions | No federal funds for lobbying (>$100K), quarterly disclosure | Ex B1 |
| Environmental Compliance | Clean Air/Water Act, smoke-free workplace | Ex B1 |
| Small/Minority Business | Positive efforts to use small/minority/women-owned businesses | Ex B1 |

**Estimated subtasks: ~50-60**

### Activity 5: SECURITY Requirements (Exhibit F)

Already decomposed in CEO_NOTES and HTML diagram — 5 tasks, 45 subtasks covering:
1. Administrative/Management Safeguards (8)
2. Technical/Operational Safeguards (14)
3. Solution Architecture (15)
4. Documentation Requirements (7)
5. ISO Notifications & Approvals (4)

**Subtasks: 45** (see `.claude/diagrams/exhibit-f-demand-side-analysis.html`)

### Activity 6: EVALUATION Requirements (Attachments 3, 4)

| Task | SubTasks | Source |
|------|----------|--------|
| Bidder Certifications | Iran Contracting Act, small business/DVBE/TACPA preferences, GenAI disclosure, international business | Att 3 |
| Operational System Experience | Up to 5 reference projects with verifiable contacts | Att 4 |
| Client Onboarding Experience | Up to 5 reference projects demonstrating deployment capability | Att 4 |
| Healthcare/EMS Experience | Up to 5 reference projects working with healthcare/EMS providers | Att 4 |

**Estimated subtasks: ~15-20**

---

## Total Decomposition Summary

| Activity | Domain | Tasks | Est. SubTasks |
|----------|--------|-------|---------------|
| Functional (A, A1, A2) | FUNCTIONAL | 7 | 40-50 |
| Financial (B, B1, Att 1) | FINANCIAL | 5 | 15-20 |
| Legal (C, D, G) | LEGAL | 5 | 20-25 |
| Compliance (B1, E) | COMPLIANCE | 13 | 50-60 |
| Security (F) | SECURITY | 5 | 45 |
| Evaluation (Att 3, 4) | EVALUATION | 4 | 15-20 |
| **Total** | **6 domains** | **~39 tasks** | **~185-220 subtasks** |

A single government RFP = **~200 subtasks** across 6 typed task domains. This validates Brian's architecture at scale.

---

## Exhibit E vs Exhibit F Overlap

Exhibit E (Privacy) and Exhibit F (Security) have significant overlap — both cover encryption, authentication, audit logging, patch management, breach notification, and access controls. Key differences:

| Topic | Exhibit E (Privacy) | Exhibit F (Security) |
|-------|-------|-------|
| **Focus** | PII/PHI data protection | System/infrastructure security |
| **Patch SLAs** | Specific CVSS-based timelines (48hrs/7d/30d) | "2 weeks from vendor release, critical faster" |
| **Auth** | FIDO/AAL 3 with specific reauthentication schedule | FIDO2/YubiKey, ASVS Level 2 |
| **Breach** | Detailed notification chain with AG reporting | ISO notification + remediation |
| **Unique to E** | Paper document controls, live data prohibition, workforce U.S.-only, DR/BC plans | — |
| **Unique to F** | — | 4-tier layered architecture, WAF, container security, pen testing, NIST SP800-53, PCI DSS, offshore access controls |

**SME Mart implication:** These two exhibits should map to separate task groups but with cross-references. The privacy subtasks in Exhibit E complement (don't duplicate) the security subtasks in Exhibit F.

---

## What This RFP Proves for SME Mart

### 1. The hierarchy works at scale
Project > Engagement > Activity > Task > SubTask maps naturally to a real 17-document RFP. Six domain-typed activities, ~39 tasks, ~200 subtasks — no forcing required.

### 2. Six task types, not five
Brian's original model had Security, Compliance, Legal, Functional, Financial. This RFP adds **EVALUATION** as a sixth type (bidder qualifications, reference projects, certifications). Consider whether Evaluation is a distinct type or a sub-category of Compliance.

### 3. Exhibits overlap — cross-referencing is essential
Exhibit E and F share ~30% of their requirements. The task decomposition must support cross-references between subtasks (e.g., "Encryption in Transit" appears in both E and F with different specificity). Without cross-referencing, the buyer sees redundancy; with it, they see complementary coverage.

### 4. Document-to-task AI decomposition confirmed as killer feature
Manually decomposing 17 documents into 200 subtasks would take days. An AI agent that reads uploaded exhibits and suggests the task/subtask tree — with typed domains, compliance standard references, and cross-references — is the massive differentiator vs. Upwork/Fiverr/traditional procurement.

### 5. Cost model is per-unit recurring + one-time
The HBEDS cost structure (quarterly subscription per hospital + one-time onboarding fee) is a common government SaaS procurement pattern. SME Mart needs to support both recurring and one-time pricing in the financial domain.

### 6. The evaluation/qualification flow is a supply-side feature
Attachment 4 (bidder skills) is what the buyer demands from providers. In SME Mart, this maps to the provider profile — verified experience, reference projects, and customer contacts that the marketplace can surface during vendor selection.

### 7. Hospital dataset = real demo data
105 hospitals with beds, counties, CBSAs, ownership, and utilization metrics. Perfect for populating SME Mart demo scenarios showing a government buyer managing a large-scale procurement.

---

## Gap Analysis (Updated)

### What SME Mart Covers Today

- Task/SubTask hierarchy (ZB Tasks with `child_of` links)
- Task status lifecycle (draft > open > in_progress > awaiting_approval > completed)
- Engagement/Boundary creation (`work_requests` + ZB Boundary)
- Notes/documentation per engagement (Milkdown editor)
- Tag-based hierarchy (PROJ/ENG/TASK prefixes)

### Critical Gaps (Ordered by Priority)

| # | Gap | Blocked By | Why This RFP Proves It |
|---|-----|-----------|------------------------|
| 1 | **Document upload to Project** | ZB Task Attachments (SDK exists, not wired) | Buyer uploads 17 documents that define the entire project |
| 2 | **Typed Tasks** (6 domains) | ZB-3 (Custom Task Activities) | Without types, can't separate FUNCTIONAL from SECURITY from FINANCIAL |
| 3 | **Typed SubTasks with custom fields** | ZB-3 | Each subtask needs: requirement text, standard reference, evidence type, pass/fail/NA, compliance standard |
| 4 | **Cross-references between subtasks** | Design needed | Exhibit E and F overlap ~30% — subtasks must link to each other |
| 5 | **RFP creation wizard** (SM-18) | Activity layer (SM-17) | 17 documents > 6 activities > 39 tasks > 200 subtasks — needs structured wizard |
| 6 | **AI-assisted decomposition** | SM-18 + AI | Manual decomposition of 17 docs is days of work. AI does it in minutes. |
| 7 | **Cost model support** | Neon + UI | Quarterly subscription + one-time onboarding fee + 5-year projections |
| 8 | **Vendor proposal response flow** (SM-19) | SM-18 | Provider maps capabilities to each of 200 buyer subtasks |
| 9 | **Bidder qualification profiles** | Provider profile system | 3 experience categories with verifiable references (Attachment 4 pattern) |
| 10 | **Demand/supply view filtering** (SM-24) | SM-17 | Buyer sees requirements; provider sees response obligations; shared = transparency |
| 11 | **Evidence/artifact linking** | ZB Task Attachments | Provider attaches certs/audits/policies to specific subtasks |
| 12 | **Compliance standard references** | Custom Activities or Neon | Link subtasks to NIST, OWASP, HIPAA, PCI DSS, FIPS-199 controls |
| 13 | **Timeline/milestone tracking** | Calendar UI | Key Action Dates (Attachment 2) define procurement timeline |
| 14 | **Readiness scoring per domain** | ZB Scoring App (future) | Roll up subtask completion to "Security: 78%, Compliance: 92%" |

---

## Action Items

1. Share this analysis with Brian for validation
2. Use the full RFP decomposition (not just Exhibit F) as the design spec for SM-18
3. Design typed task model with 6 domains — interim workaround with tags/Neon metadata until ZB-3
4. Design cross-reference model for overlapping subtasks (E/F overlap pattern)
5. Prototype demand-side project view with task tree + domain rollups at scale (~200 subtasks)
6. Evaluate AI-assisted document parsing across all exhibit types (not just security)
7. Wire ZB Task Attachments into SME Mart UI
8. Design cost model support (recurring subscription + one-time fees + multi-year projections)
9. Flag ZB-3 (Custom Task Activities) to Kevin — critical path blocker
10. Use hospital dataset as demo data for buyer-side scenarios

---

## Related Files

- **Visual breakdown (Exhibit F only):** `.claude/diagrams/exhibit-f-demand-side-analysis.html`
- **CEO directives:** `.planning/notes/CEO_NOTES.md` (2026-03-05 entry)
- **Converted text files:** `.claude/references/CA Department of Public Health RFP/*.txt`
- **Plan:** `.claude/plans/public/PLAN.md`
- **Demo data guide:** `.planning/notes/demo-data-guide.md`
