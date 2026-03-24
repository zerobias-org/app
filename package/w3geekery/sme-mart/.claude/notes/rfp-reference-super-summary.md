# RFP Reference Super-Summary — Roadmap Gap Analysis

> **Date:** 2026-03-16
> **Sources:** Three reference sets analyzed against SME Mart PLAN and roadmap
> 1. **CDPH HBEDS RFP** — Government SaaS procurement, 17 documents, ~200 requirements
> 2. **Vancouver Clinic Enterprise Imaging RFP** — Private healthcare, 10 documents, invitation-only
> 3. **AAH Policies & Standards** — 23 corporate security documents (supply-side reference)

---

## Cross-Reference Summary

| Dimension | CDPH (Government) | Vancouver Clinic (Enterprise) | AAH (Supply-Side Docs) |
|-----------|-------------------|-------------------------------|------------------------|
| **Buyer type** | State agency | Private healthcare system | N/A (client org) |
| **RFP access** | Public, open bid | Invitation-only, 7 vendors | N/A |
| **Mediator** | State procurement office | External consultant (H-I-S) | N/A |
| **Documents** | 17 | 10 | 23 |
| **Pricing** | Per-facility quarterly + one-time | NRC/ARC split, 0-80-20 milestones | N/A |
| **Timeline** | 3yr + 2yr extensions | 5yr support contract | Engagement: 7-11 weeks |
| **Compliance** | HIPAA, NIST, FedRAMP, CDC/NHSN | HIPAA, HITRUST, SOC 2, FDA, NIST, TECFA | HIPAA, NIST, PCI-DSS, CIS, ISO |
| **Key gap** | Task/subtask decomposition | Closed RFPs, complex pricing, forms | Document taxonomy, engagement execution |

---

## Consolidated Capability Gaps

### Already in PLAN (Covered)

| Gap | Current Plan | Status |
|-----|-------------|--------|
| Document upload to RFP | Plan 031 | Complete |
| RFP creation wizard | Plan 032 | Complete |
| Vendor bid response flow | Plan 033 (Phases 1-4) | Complete |
| AI-assisted bid generation | Plan 033 Phase 5 | Pending |
| Project bloom (task decomposition) | Plan 040 | Draft |
| Supply-side vendor profile | Plan 041 | Concept |
| Org-level document management | Plan 046 | Phases 1-5,7 complete |
| Tag-based domain classification | Plan 029, 037, 039 | Complete |

### New Gaps — Demand Side (Buyer)

| # | Gap | Source | Priority | Suggested Plan |
|---|-----|--------|----------|----------------|
| D1 | **Closed/invitation-only RFPs** — restrict visibility to selected vendors | Vancouver | Critical | 054 |
| D2 | **Multi-document RFP packages** — structured packages with templates (appendices, exhibits, forms), not just file uploads | Vancouver, CDPH | Critical | 054 |
| D3 | **Form builder for submission requirements** — buyer defines structured forms vendors must complete (intent to bid, contact info, attestations) | Vancouver | High | 054 |
| D4 | **Complex pricing models** — NRC/ARC, recurring/one-time split, milestone payments, per-unit pricing, multi-year projections | Vancouver, CDPH | High | 055 |
| D5 | **Evaluation criteria builder** — weighted scoring matrix with domain categories, not just free-text criteria | CDPH | High | 055 |
| D6 | **Communication channel controls** — mediated messaging (all vendor comms through facilitator), no direct contact mode | Vancouver | Medium | 056 |
| D7 | **Third-party facilitator role** — external consultant managing RFP process on behalf of buyer | Vancouver | Medium | 056 |
| D8 | **Bid/performance bonds** — tracking bond requirements and vendor compliance | Vancouver | Low | Future |
| D9 | **GenAI disclosure** — requirement for bidders to declare AI usage in deliverables | CDPH | Low | Future |

### New Gaps — Supply Side (Vendor)

| # | Gap | Source | Priority | Suggested Plan |
|---|-----|--------|----------|----------------|
| S1 | **Corporate vetting documents** — financial statements, SEC filings, D&B, stability statements uploaded at bid stage | Vancouver, Plan 041 | High | 041 (expand) |
| S2 | **Intent to Bid / Withdraw workflow** — formal acknowledgement with deadlines, withdrawal attestation (document destruction) | Vancouver | High | 054 |
| S3 | **Structured bid response templates** — vendor response mirrors RFP section numbering, section-by-section compliance | Vancouver, CDPH | High | 055 |
| S4 | **Bid validity / expiration dates** — proposals valid for N days (e.g., 180) | Vancouver | Medium | 055 |
| S5 | **Named contact roles** — primary, executive, technical, legal contacts per bid | Vancouver | Medium | 041 (expand) |
| S6 | **Legal attestation forms** — non-discrimination, equal opportunity, notarized affidavits | Vancouver | Medium | Future |
| S7 | **Staff resumes / qualifications** — named project team with resumes attached to bid | Vancouver, CDPH | Medium | 041 (expand) |

### New Gaps — Engagement Execution (Post-Award)

| # | Gap | Source | Priority | Suggested Plan |
|---|-----|--------|----------|----------------|
| E1 | **Expanded document type taxonomy** — policies, standards, procedures, guidelines, incident response plans, BCP/DR, network security, cloud security, asset management | AAH | High | 046 (expand) |
| E2 | **Assessment task templates** — pre-built task trees for common engagement types (gap analysis, control mapping, risk assessment, audit prep) | AAH | High | 040 (expand) |
| E3 | **Compliance framework tagging** — tag documents and tasks with specific framework controls (NIST 800-53 control IDs, PCI-DSS requirements, ISO 27001 clauses) | AAH | High | 029 (expand) |
| E4 | **Deliverable templates** — gap analysis report, risk register, remediation roadmap, control mapping spreadsheet | AAH | Medium | 040 (expand) |
| E5 | **Payment milestone tracking** — milestone-based payment schedules (0-80-20), acceptance periods, sign-off workflow | Vancouver | Medium | 022 (expand) |
| E6 | **Multi-year contract management** — year-over-year cost tracking, renewal notifications, extension options | Vancouver, CDPH | Low | Future |

### New Gaps — Platform

| # | Gap | Source | Priority | Suggested Plan |
|---|-----|--------|----------|----------------|
| P1 | **Vendor conference scheduling** — dedicated meeting slots per vendor, random assignment, calendar integration | Vancouver | Low | Future |
| P2 | **NDA / confidentiality tracking** — per-vendor NDA status, document access logging, destruction attestation | Vancouver | Medium | 055 |
| P3 | **Site visit coordination** — request/approve site visits through platform | Vancouver | Low | Future |

---

## Roadmap Recommendations

### Immediate (Next Sprint)

**No new plans needed** — current work (UAT migration, GQL schema, vendor/product PRs) takes priority.

### Next Phase (Plans 053-055)

| Plan | Title | Scope | Est. Effort |
|------|-------|-------|-------------|
| **054** | **RFP Package Builder & Access Controls** | Closed RFPs (invitation-only), multi-document packages with templates, form builder for structured submissions, intent-to-bid/withdraw workflow | 30-40 hrs |
| **055** | **Advanced Pricing & Evaluation** | Complex pricing models (NRC/ARC, milestone payments, multi-year), evaluation criteria builder with weighted scoring, structured bid response templates, bid validity dates | 25-35 hrs |
| **056** | **Engagement Roles & Communication** | Third-party facilitator role, mediated communication channels, NDA tracking, role-based access per engagement party | 20-25 hrs |

### Expand Existing Plans

| Plan | What to Add |
|------|------------|
| **040** (Project Bloom) | Assessment task templates for common engagement types; deliverable templates |
| **041** (Vendor Profile) | Corporate vetting (financial statements, D&B); named contact roles; staff resumes; legal attestations |
| **046** (Org Documents) | Expanded document type taxonomy (10+ new types from AAH analysis) |
| **029/037** (Tags/Resources) | Compliance framework control-level tagging (NIST 800-53 controls, PCI-DSS reqs) |

### Future (Phase 3+)

- Bid/performance bond management
- GenAI disclosure tracking
- Vendor conference scheduling with calendar integration
- Site visit coordination
- Multi-year contract lifecycle management

---

## Document Type Taxonomy — Proposed Expansion

Current enum (`document.documentType`):
```
SECURITY_REQUIREMENTS, SOW, BUDGET, LEGAL_TERMS, COMPLIANCE,
FUNCTIONAL_SPEC, EVALUATION, PRIVACY, FEDERAL_PROVISIONS, OTHER
```

Proposed additions (from all three references):

| New Type | Source | Description |
|----------|--------|-------------|
| `INTENT_FORM` | Vancouver | Intent to bid/withdraw forms |
| `CONTACT_FORM` | Vancouver | Vendor contact information sheet |
| `LEGAL_ATTESTATION` | Vancouver | Notarized affidavits, non-discrimination |
| `FINANCIAL_STATEMENT` | Vancouver | Annual reports, SEC filings, audited financials |
| `PROJECT_TIMELINE` | Vancouver | Gantt charts, milestone schedules |
| `BRIEFING_MATERIAL` | Vancouver | Kick-off presentations, meeting decks |
| `SECURITY_POLICY` | AAH | Organizational security policies |
| `SECURITY_STANDARD` | AAH | Security implementation standards |
| `OPERATIONAL_PROCEDURE` | AAH | Step-by-step operational procedures |
| `BCP_DR` | AAH | Business continuity and disaster recovery plans |
| `INCIDENT_RESPONSE` | AAH | Cybersecurity incident response plans |
| `NETWORK_SECURITY` | AAH | Network architecture and security docs |
| `CLOUD_SECURITY` | AAH | Cloud design standards, CSA controls |
| `ASSET_MANAGEMENT` | AAH | Hardware/software asset management |
| `DATA_CLASSIFICATION` | AAH | Information classification schemas |
| `FRAMEWORK_MAPPING` | AAH | Control crosswalks, framework mappings |
| `GAP_ANALYSIS` | AAH/CDPH | Gap analysis reports (deliverable) |
| `RISK_REGISTER` | AAH | Risk assessment registers (deliverable) |
| `REMEDIATION_PLAN` | AAH/CDPH | Prioritized remediation roadmaps (deliverable) |

**Note:** These should be grouped into categories in the UI:
- **Procurement** — INTENT_FORM, CONTACT_FORM, LEGAL_ATTESTATION, FINANCIAL_STATEMENT, PROJECT_TIMELINE, BRIEFING_MATERIAL
- **Requirements** — SECURITY_REQUIREMENTS, SOW, BUDGET, FUNCTIONAL_SPEC, EVALUATION, PRIVACY, FEDERAL_PROVISIONS, COMPLIANCE, LEGAL_TERMS
- **Client Docs** — SECURITY_POLICY, SECURITY_STANDARD, OPERATIONAL_PROCEDURE, BCP_DR, INCIDENT_RESPONSE, NETWORK_SECURITY, CLOUD_SECURITY, ASSET_MANAGEMENT, DATA_CLASSIFICATION
- **Deliverables** — GAP_ANALYSIS, RISK_REGISTER, REMEDIATION_PLAN, FRAMEWORK_MAPPING

---

## Summary

Three very different RFP/engagement scenarios paint a comprehensive picture:

1. **CDPH** = government procurement with formal evaluation and task decomposition → validates Plans 032, 033, 040
2. **Vancouver Clinic** = enterprise private-sector with invitation-only access, consultant-mediated, complex pricing → reveals need for Plans 053-055
3. **AAH Policies** = supply-side working documents that SMEs actually review during engagements → reveals document taxonomy and engagement execution gaps

Together, they confirm the SME Mart roadmap direction while identifying **~25 specific gaps** that need to be addressed for the platform to handle real-world compliance procurement end-to-end.
