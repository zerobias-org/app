# Plan 069: Compliance Framework Linkage

**Status:** Stub
**Phase:** 5 (Engagements & Admin)
**Created:** 2026-03-24
**Depends on:** Plan 022 (Project UI), Plan 057 (tasks), ZB Boundary framework APIs
**Source:** Clark 2026-03-24, Brian's 3-view Transparency vision, Kevin's "boundary as promise management" (2026-03-20)

---

## Purpose

Build a Compliance view under SmeMartProject that links tasks to specific compliance framework controls (e.g., "Task A satisfies SOC2 CC6.1"). Provides visibility into which requirements are satisfied, with links to proof/evidence for attestation.

## Core Concept

Compliance frameworks are defined in the ZB Platform **Boundary** (SOC2, PCI-DSS, NIST, HIPAA, etc.). SME Mart adds the **evidence chain** — which specific tasks address which controls, and what proof exists.

```
Task: "Access Control Policy Review" (BUY-003)
├── Satisfies: SOC2 CC6.1 (Logical and Physical Access Controls)
├── Satisfies: SOC2 CC6.3 (Role-Based Access)
├── Evidence: [Access Control Policy v2.1.pdf]
├── Evidence: [IAM Configuration Screenshot]
└── Attestation: VERIFIED by Jane Smith, 2026-03-15
```

## Three Views (Brian's Transparency Vision)

| View | Audience | Shows |
|------|----------|-------|
| **Demand** | Buyer | "Which of my requirements are satisfied?" — controls mapped to tasks, completion status |
| **Supply** | Provider | "Which controls am I providing evidence for?" — my tasks linked to framework requirements |
| **Transparency** | Both + auditors | "Independent proof chain" — verified vs pending, evidence links, attestation status |

## Data Model

### Option A: GQL Links (preferred)

Use AuditgraphDB links between SmeMartTask and framework control identifiers:

```yaml
SmeMartComplianceMapping:
  - taskId          # SmeMartTask reference
  - frameworkId     # e.g., "soc2", "pci-dss"
  - controlId       # e.g., "CC6.1", "Req 8.3.1"
  - controlName     # Human-readable name
  - evidenceIds     # Links to SmeMartDocument(s)
  - status          # not_started | in_progress | evidence_provided | verified | expired
  - verifiedBy      # ZB user ID
  - verifiedAt      # Timestamp
  - notes           # Verifier comments
```

### Option B: Tags

Use hierarchical tags: `sme-mart.compliance.soc2.CC6.1` on tasks. Lighter weight but less queryable.

### Boundary Auto-Satisfaction

Kevin's "promise keeping" concept (2026-03-20): If the boundary already has evidence for a control (e.g., the org already passed SOC2 CC6.1 in another engagement), the task can be auto-closed. This requires:
1. Query boundary for existing framework compliance status
2. Match against task's compliance mappings
3. Auto-close with "satisfied by boundary evidence" status

This is a platform-level feature — SME Mart would consume the API when available.

## UI Components

### Compliance Matrix View

Table: rows = framework controls, columns = status + task links + evidence

```
SOC2 Trust Services Criteria
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Control    | Description                          | Task         | Status   | Evidence
CC6.1      | Logical and Physical Access Controls  | BUY-003      | VERIFIED | [2 docs]
CC6.3      | Role-Based Access                     | BUY-003      | VERIFIED | [1 doc]
CC3.1      | Risk Assessment                       | PRV-001      | PENDING  | —
CC3.2      | Risk Mitigation                       | PRV-001      | PENDING  | —
CC7.1      | System Operations                     | (unmapped)   | GAP      | —
```

### Task-Level Compliance Panel

On the task detail view, show which controls this task satisfies:
- List of framework + control ID + status
- "Add compliance mapping" button
- Evidence upload/link area

### Project-Level Summary

Dashboard-style rollup:
- "SOC2: 78% mapped, 45% verified"
- "PCI-DSS: 92% mapped, 67% verified"
- Gap analysis: controls with no task mapped

## Effort Estimate

12-16 hours (data model + compliance matrix + task panel + boundary framework integration)

---

*Session: `claude --resume poc/sme-mart`*
