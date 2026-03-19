# AAH (Advocate Aurora Health) Policies & Standards Analysis

> **Source:** `.claude/references/Policies, Standards, Procedures, and Guidelines/`
> **Organization:** Advocate Aurora Health (AAH) — large US healthcare system
> **Document Count:** 23 documents + 1 spreadsheet
> **Domain:** Enterprise IT Security, Compliance, and Operations
> **Date Range:** 2019–2021
> **Relevance:** These represent the type of organizational security documents that SME Mart vendors would need to assess, audit, or build compliance programs around during an engagement.

## Document Inventory by Domain

### Security & Risk Management (6 docs)

| Document | Type | Key Frameworks |
|----------|------|----------------|
| HIT Security and Risk Management | Policy | HIPAA, NIST |
| Enterprise Information Security & CISO Standard | Standard | HIPAA Security Rule |
| EIS Standard Roles and Responsibilities | Standard | HIPAA |
| Vulnerability Management Standard | Standard | NIST, CVE/CVSS |
| Cybersecurity Incident Response | Policy | NIST CSF, HIPAA Breach |
| HIT Incident Notification & Command Activation | Policy | ICS/HICS |

### Network & Infrastructure (3 docs)

| Document | Type | Key Frameworks |
|----------|------|----------------|
| Network Security | Policy/Standard | CIS, NIST 800-53 |
| Server Security Integrated | Standard | CIS Benchmarks, STIG |
| Cloud Design Standard | Standard | CSA, FedRAMP, HIPAA |

### Data Protection & Privacy (4 docs)

| Document | Type | Key Frameworks |
|----------|------|----------------|
| Information Classification | Policy | HIPAA, state privacy laws |
| Acceptable Use of Information Resources | Policy | HIPAA |
| HIT Logging and Retention Standard | Standard | HIPAA §164.312, PCI-DSS |
| Payment Card Industry - Data Security Standards | Policy | PCI-DSS v3.2.1 |

### Business Continuity & Recovery (3 docs)

| Document | Type | Key Frameworks |
|----------|------|----------------|
| Business Continuity Plan | Policy/Procedure | ISO 22301, NIST |
| Health Informatics & Technology Disaster Recovery | Policy | HIPAA, NIST |
| Data Backup and Recovery | Policy | HIPAA, NIST |

### Operations & Change Management (3 docs)

| Document | Type | Key Frameworks |
|----------|------|----------------|
| Change Management Standard | Standard | ITIL, NIST 800-128 |
| Enterprise Architecture Standard | Standard | TOGAF, Zachman |
| System Incident Notification & Command Activation | Policy/Procedure | ICS/HICS |

### Physical Security & Asset Management (3 docs)

| Document | Type | Key Frameworks |
|----------|------|----------------|
| Physical Security | Policy/Procedure/Standard | HIPAA Physical Safeguards |
| Hardware Asset Management Policy | Policy | ITAM, NIST 800-53 |
| Hardware Asset Management Standard | Standard | ITAM |

### Governance (1 doc)

| Document | Type |
|----------|------|
| Data Center Capacity Strategy Governance (Excel) | Request form/tracker |

## Document Type Classification

| Type | Count | Examples |
|------|-------|---------|
| **Policy** | 12 | Security, DR, BCP, Physical Security, PCI |
| **Standard** | 9 | Change Mgmt, Cloud Design, EA, Vulnerability Mgmt |
| **Procedure** | 3 | BCP, Physical Security, Incident Notification |
| **Guideline** | 0 | None in this set |
| **Other** | 1 | Governance request form (Excel) |

## What This Means for SME Mart

### 1. Supply-Side Document Categories Needed

An SME/consultant working an engagement would need to upload, classify, and reference these document types:

| Category | SME Mart `documentType` | New? |
|----------|------------------------|------|
| Security Policy | `security_policy` | **Yes** |
| Security Standard | `security_standard` | **Yes** |
| Operational Procedure | `operational_procedure` | **Yes** |
| BCP/DR Plan | `bcp_dr` | **Yes** |
| Network Security | `network_security` | **Yes** |
| Cloud Security | `cloud_security` | **Yes** |
| Data Classification | `data_classification` | **Yes** |
| Asset Management | `asset_management` | **Yes** |
| Incident Response Plan | `incident_response` | **Yes** |
| Compliance Framework Mapping | `framework_mapping` | **Yes** |
| Gap Analysis Report | `gap_analysis` | Exists (CDPH) |
| Remediation Roadmap | `remediation_plan` | Exists (CDPH) |

Current SME Mart `documentType` enum only has: SECURITY_REQUIREMENTS, SOW, BUDGET, LEGAL_TERMS, COMPLIANCE, FUNCTIONAL_SPEC, EVALUATION, PRIVACY, FEDERAL_PROVISIONS, OTHER. **10 of 12 categories above are new.**

### 2. Assessment Task Types

When an SME reviews these documents, they produce specific deliverables:

| Assessment Activity | Output Deliverable | ZB Task Type |
|--------------------|--------------------|--------------|
| Policy gap analysis | Gap report with finding severity | gap_analysis |
| Control mapping | Framework crosswalk spreadsheet | control_mapping |
| Risk assessment | Risk register with scores | risk_assessment |
| Compliance audit prep | Evidence collection checklist | audit_prep |
| Architecture review | Security architecture diagram + findings | architecture_review |
| Incident response tabletop | Exercise report + improvement plan | tabletop_exercise |
| BCP/DR test | Test results + remediation items | dr_test |
| Vulnerability assessment | Scan results + remediation priorities | vuln_assessment |
| Policy development | New/updated policy documents | policy_development |
| Training program design | Curriculum + materials + schedule | training_design |

### 3. Compliance Framework Coverage

These documents reference the following frameworks that SME Mart should support for tagging/filtering:

| Framework | Frequency | Currently in SME Mart? |
|-----------|-----------|----------------------|
| HIPAA (Security Rule, Privacy Rule, Breach) | Very High | Partially (tag only) |
| NIST 800-53 / CSF | High | Partially (tag only) |
| PCI-DSS | Medium | No |
| CIS Benchmarks | Medium | No |
| ISO 22301 (BCP) | Low | No |
| ISO 27001 | Medium | Partially (tag only) |
| ITIL | Low | No |
| CSA (Cloud Security Alliance) | Low | No |
| FedRAMP | Low | Yes (CDPH) |
| SOC 2 | Medium | Yes |

### 4. Supply-Side Vendor Profile Requirements

For an SME to credibly bid on engagements involving these documents, their profile should demonstrate:

| Capability | How Demonstrated |
|------------|-----------------|
| Framework expertise | Certifications (CISSP, CISM, CISA, PCI-QSA, HITRUST CCSFP) |
| Industry experience | Past healthcare engagements, references |
| Assessment methodology | Documented approach to gap analysis, risk assessment |
| Tool proficiency | GRC platforms, vulnerability scanners, SIEM |
| Regulatory knowledge | State privacy laws, HIPAA, 21st Century Cures Act |
| Deliverable samples | Redacted gap analysis, risk register, remediation roadmap |

### 5. Engagement Scope Templates

These 23 documents represent a typical **healthcare IT security compliance program**. An engagement to review all of them would decompose into:

| Phase | Tasks | Duration (est.) |
|-------|-------|-----------------|
| 1. Document Review | Review all 23 docs, catalog findings | 2-3 weeks |
| 2. Gap Analysis | Map against target framework (e.g., NIST CSF) | 2-3 weeks |
| 3. Risk Assessment | Score gaps by likelihood × impact | 1-2 weeks |
| 4. Remediation Roadmap | Prioritize, assign owners, set timelines | 1-2 weeks |
| 5. Executive Report | Summarize findings, recommendations, cost estimates | 1 week |

**Total:** 7-11 weeks, typical for a mid-size healthcare system.

## Key Takeaway

These documents represent the **supply-side reality** — what an SME actually works with during an engagement. SME Mart currently focuses on the demand-side (RFP creation, bid submission) but needs to support the **working engagement phase** where consultants review client documents, produce assessments, and deliver remediation plans. The document type taxonomy needs significant expansion to cover organizational policies, standards, and procedures — not just RFP procurement documents.
