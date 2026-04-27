# Transparency Center — Multi-Party Clarification

**Date:** 2026-04-06
**Source:** Clark discussion + Brian Hierholzer's Miro board
**Relates to:** Backlog #071 (Entangled Task Pairs), #078 (Transparency Controls UI Spec)
**Brian's Miro Board:** https://miro.com/app/board/uXjVGm64Grw=/

---

## Key Clarifications

### Multi-Party, Not Just Buyer/Provider

The Transparency Center is **not limited to 2 orgs**. An engagement can involve multiple participating orgs (parties) in any combination of roles:

- Buyer
- Provider
- Auditor / Assessor
- Any future role type

Example: Company X (auditee) + Audit Company Y (auditor) + Regulatory Body Z (observer) could all be parties in a single engagement.

### Demands From Any Direction

Any party can create demands/requirements — not just the buyer or "demand side." Each party has its own demands and requires proof of those demands being met by the relevant counterparty.

- Auditor demands evidence from auditee
- Auditee may demand credentials/certifications from auditor
- Buyer demands deliverables from provider
- Provider demands payment terms/milestones from buyer

### Zero Default Visibility (Explicit Submission Only)

Evidence is **never passively visible**. A party's internal data is invisible to all other parties unless explicitly:

- Submitted
- Declared
- Shared
- Uploaded
- Screenshot captured

Only items that have been specifically "published" to the transparency intersection appear there. Parties should **never** be able to see any of the other party's data unless it has been explicitly permitted to be shown.

### Demand-Proof Cycle

1. Party A creates a demand (requirement)
2. Party B prepares proof internally (private, not visible)
3. Party B explicitly submits proof to the transparency center
4. Proof becomes visible at the intersection to scoped parties only
5. Any party can verify/accept/dispute

---

## Cross-App Applicability

The same Transparency Center model applies across:

- **SME Mart** — buyer/provider engagements, project work
- **Readiness Center** (Dan S.) — auditee/auditor assessment flows
- **Any future cross-org interaction** on the ZeroBias platform

### SME Mart Example

- SmeMartProject: "Audit Assessment of X"
- Engagement between Company X and Audit Company Y
- Auditor creates demand (evidence request)
- Company X submits proof to transparency center
- Only submitted items visible at the intersection

---

## Brian's Miro Board Context

Brian's board (https://miro.com/app/board/uXjVGm64Grw=/) covers both initiatives:

- **Readiness Center pieces:** Boundary infrastructure diagrams (AWS, Apps, Policies, Legal Reqs, License Reqs)
- **SME Mart pieces:** Auditee/Auditor Kanban prototypes, Supply/Demand task tables, Transparency Publisher tables

The "Transparency Publisher" tables on the board model the publication mechanism — how evidence gets explicitly pushed into the intersection. The Supply/Demand Boundary task tables model the per-party private workspace.

Brian's message (2026-04-06): "I want to try to build out your solution over the top of the design I'm putting together."

---

## Impact on Existing Architecture

The current 3-view model (Demand/Supply/Shared from Plan 023) is correct but needs expansion:

| Current Assumption | Refinement |
|-------------------|------------|
| 2 parties (buyer + provider) | N parties in any role combination |
| Buyer defines demands | Any party defines demands |
| Shared view = tag aggregation | Shared view = only explicitly submitted items |
| Entangled pairs = 1 demand ↔ 1 supply | Entangled pairs per party-pair within engagement |
